"""
AuthentiHire - Analysis & User Persistence Repositories
========================================================
Data access layer implementing atomic transactions, user-isolated & session-scoped retrieval,
data minimization, and full snapshot reconstruction.
"""

import json
import uuid
import logging
from typing import List, Optional, Tuple, Any, Dict
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from src.database.models import User, Analysis, AnalysisEvidence, CompanyVerification
from src.api_service import (
    JobPostingRequest,
    JobAnalysisResponse,
    MLPredictionResponse,
    RiskScoreResponse,
    CompanyTrustResponse,
    RuleEvidenceResponse,
    MetadataResponse,
)
from src.auth.security import verify_password

logger = logging.getLogger("authentihire.repository")


class UserRepository:
    """Data access methods for User account management and authentication."""

    @staticmethod
    def create_user(
        db: Session,
        email: str,
        password_hash: str,
        user_id: Optional[str] = None,
    ) -> User:
        """Creates a new registered user account."""
        uid = user_id or str(uuid.uuid4())
        user = User(
            id=uid,
            email=email,
            password_hash=password_hash,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"[+] Successfully registered user {user.id} ({email}).")
        return user

    @staticmethod
    def get_by_id(db: Session, user_id: str) -> Optional[User]:
        """Fetches a user account by primary UUID."""
        stmt = select(User).where(User.id == user_id)
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Fetches a user account by normalized email address."""
        stmt = select(User).where(User.email == email)
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def authenticate(db: Session, email: str, plain_password: str) -> Optional[User]:
        """
        Authenticates a user securely against stored password hash.
        Returns User if valid and active, otherwise None.
        """
        user = UserRepository.get_by_email(db, email)
        if not user:
            return None
        if not user.is_active:
            return None
        if not verify_password(plain_password, user.password_hash):
            return None
        return user

    @staticmethod
    def get_dashboard_summary(db: Session, user_id: str) -> Dict[str, Any]:
        """
        Computes aggregated dashboard metrics for an authenticated user using database aggregations.
        Returns total analyses count, risk distribution breakdown, average risk score,
        recent analysis count (last 7 days), and recent 5 analyses.
        """
        import datetime
        from src.database.schemas import AnalysisSummaryItem

        # 1. Total count & average risk score
        agg_stmt = (
            select(
                func.count(Analysis.id),
                func.coalesce(func.avg(Analysis.overall_risk_score), 0.0),
            )
            .where(Analysis.user_id == user_id)
        )
        agg_res = db.execute(agg_stmt).one_or_none()
        total_analyses = agg_res[0] if agg_res else 0
        raw_avg = float(agg_res[1]) if agg_res and agg_res[1] is not None else 0.0
        average_risk_score = round(raw_avg, 1)

        # 2. Risk distribution aggregation
        dist_stmt = (
            select(Analysis.risk_band, func.count(Analysis.id))
            .where(Analysis.user_id == user_id)
            .group_by(Analysis.risk_band)
        )
        dist_rows = db.execute(dist_stmt).all()
        risk_dist = {"low": 0, "moderate": 0, "high": 0, "critical": 0}
        for band_str, count in dist_rows:
            if not band_str:
                continue
            normalized = band_str.strip().upper()
            if "LOW" in normalized:
                risk_dist["low"] += count
            elif "MOD" in normalized:
                risk_dist["moderate"] += count
            elif "HIGH" in normalized:
                risk_dist["high"] += count
            elif "CRIT" in normalized:
                risk_dist["critical"] += count

        # 3. Recent 7-day count
        cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)
        recent_count_stmt = (
            select(func.count(Analysis.id))
            .where(Analysis.user_id == user_id, Analysis.created_at >= cutoff)
        )
        recent_analysis_count = db.scalar(recent_count_stmt) or 0

        # 4. Recent analyses (latest 5)
        recent_stmt = (
            select(Analysis)
            .where(Analysis.user_id == user_id)
            .order_by(Analysis.created_at.desc())
            .limit(5)
        )
        recent_records = list(db.execute(recent_stmt).scalars().all())
        recent_summaries = [AnalysisSummaryItem.model_validate(r) for r in recent_records]

        return {
            "total_analyses": total_analyses,
            "risk_distribution": risk_dist,
            "average_risk_score": average_risk_score,
            "recent_analysis_count": recent_analysis_count,
            "recent_analyses": recent_summaries,
        }


class AnalysisRepository:
    """Encapsulates all persistence and retrieval logic for job posting analyses."""

    @staticmethod
    def save_analysis(
        db: Session,
        request: JobPostingRequest,
        response: JobAnalysisResponse,
        session_id: str,
        user_id: Optional[str] = None,
        analysis_id: Optional[str] = None,
    ) -> Analysis:
        """
        Atomically persists job posting metadata, risk results, rule evidence,
        and company verification snapshots within a database transaction.
        """
        record_id = analysis_id or str(uuid.uuid4())
        owner_desc = f"user '{user_id}'" if user_id else f"session '{session_id[:8]}...'"
        logger.info(f"Persisting analysis {record_id} for {owner_desc}")

        try:
            # Prepare JSON serialized fields safely
            components_json = json.dumps(response.risk.components if response.risk.components else {})
            signals_list = [
                s.model_dump() if hasattr(s, "model_dump") else (s.dict() if hasattr(s, "dict") else s)
                for s in response.company.signals
            ] if response.company.signals else []
            company_signals_json = json.dumps(signals_list)
            rule_breakdown_json = json.dumps(response.rules.category_breakdown if response.rules.category_breakdown else {})
            reasons_json = json.dumps(response.reasons if response.reasons else [])
            corroborations_json = json.dumps(response.corroborations if response.corroborations else [])

            # Create primary Analysis entity
            analysis = Analysis(
                id=record_id,
                request_id=response.request_id,
                session_id=session_id,
                user_id=user_id,
                # Job details
                title=request.title or None,
                company_name=request.company_name or response.company.company_name or None,
                location=request.location or None,
                department=request.department or None,
                salary_range=request.salary_range or None,
                employment_type=request.employment_type or None,
                required_experience=request.required_experience or None,
                required_education=request.required_education or None,
                industry=request.industry or None,
                function=request.function or None,
                telecommuting=bool(request.telecommuting),
                has_company_logo=bool(request.has_company_logo),
                has_questions=bool(request.has_questions),
                recruiter_email=request.recruiter_email or response.company.email or None,
                url=request.url or response.company.website or None,
                company_profile=request.company_profile or None,
                description=request.description or None,
                requirements=request.requirements or None,
                benefits=request.benefits or None,
                # ML Assessment
                fraud_probability=float(response.prediction.fraud_probability),
                prediction_label=str(response.prediction.prediction),
                decision_threshold=float(response.prediction.threshold_used),
                model_name=str(response.prediction.model_name),
                # Unified Risk Score
                overall_risk_score=int(response.risk.overall_score),
                risk_band=str(response.risk.risk_band),
                status=str(response.risk.status),
                components_json=components_json,
                # Company Trust
                company_trust_score=int(response.company.trust_score),
                company_domain=response.company.domain,
                company_email=response.company.email,
                company_website=response.company.website,
                consistency_rating=str(response.company.consistency_rating),
                company_signals_json=company_signals_json,
                # Rule Summary
                rule_total_score=int(response.rules.total_score),
                rule_count=int(response.rules.triggered_rules_count),
                rule_suspicion_level=str(response.rules.suspicion_level),
                rule_category_breakdown_json=rule_breakdown_json,
                # Snapshot Explanations & Recommendations
                reasons_json=reasons_json,
                corroborations_json=corroborations_json,
                recommendations=str(response.recommendations),
                # System Metadata
                model_version=str(response.metadata.model_version),
                risk_config_version=str(response.metadata.risk_config_version),
                api_version=str(response.metadata.api_version),
            )

            db.add(analysis)

            # Persist individual rule evidence items
            if response.rules.triggered_rules:
                for rule_item in response.rules.triggered_rules:
                    rule_dict = rule_item if isinstance(rule_item, dict) else (
                        rule_item.model_dump() if hasattr(rule_item, "model_dump") else rule_item.dict()
                    )
                    evidence_record = AnalysisEvidence(
                        analysis_id=record_id,
                        source="RULE",
                        rule_id=rule_dict.get("rule_id"),
                        rule_name=rule_dict.get("rule_name"),
                        category=rule_dict.get("category"),
                        severity=str(rule_dict.get("severity", "MEDIUM")),
                        status="TRIGGERED",
                        score=int(rule_dict.get("score", 0)),
                        explanation=rule_dict.get("explanation"),
                        evidence=rule_dict.get("evidence"),
                    )
                    db.add(evidence_record)

            # Persist company verification entry
            company_rec = CompanyVerification(
                analysis_id=record_id,
                company_name=response.company.company_name,
                website=response.company.website,
                domain=response.company.domain,
                email=response.company.email,
                email_domain=response.company.domain,
                website_reachable=True if response.company.trust_score >= 50 else None,
                https_status=True if response.company.website and response.company.website.startswith("https") else None,
                tls_status="VALID" if response.company.website and response.company.website.startswith("https") else "UNVERIFIED",
                consistency_rating=response.company.consistency_rating,
                trust_score=response.company.trust_score,
                signals_json=company_signals_json,
            )
            db.add(company_rec)

            db.commit()
            db.refresh(analysis)
            logger.info(f"[+] Successfully persisted analysis {record_id}.")
            return analysis

        except Exception as e:
            logger.error(f"[!] Failed to persist analysis {record_id}: {e}", exc_info=True)
            db.rollback()
            raise

    @staticmethod
    def get_analysis_by_id(
        db: Session,
        analysis_id: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> Optional[Analysis]:
        """
        Retrieves a complete analysis record by its UUID.
        Strictly enforces ownership:
        - If user_id is provided, requires analysis.user_id == user_id.
        - Else if session_id is provided, requires analysis.session_id == session_id.
        """
        stmt = (
            select(Analysis)
            .options(
                selectinload(Analysis.evidence),
                selectinload(Analysis.company_verifications),
            )
            .where(Analysis.id == analysis_id)
        )
        if user_id is not None:
            stmt = stmt.where(Analysis.user_id == user_id)
        elif session_id is not None:
            stmt = stmt.where(Analysis.session_id == session_id)

        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def list_analyses(
        db: Session,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
        search: Optional[str] = None,
        risk_band: Optional[str] = None,
        sort: str = "created_at",
        order: str = "desc",
    ) -> Tuple[List[Analysis], int]:
        """
        Returns a paginated, filtered, and sorted list of analysis records strictly scoped to:
        - user_id (if authenticated)
        - session_id (if anonymous)
        Supports parameter-safe search across title, company_name, domain.
        Supports filtering by risk_band.
        Supports sorting by whitelisted fields.
        """
        from sqlalchemy import or_

        if user_id is not None:
            clauses = [Analysis.user_id == user_id]
        elif session_id is not None:
            clauses = [Analysis.session_id == session_id]
        else:
            return [], 0

        # Search filter (case-insensitive substring on title, company_name, company_domain)
        if search and search.strip():
            term = f"%{search.strip()}%"
            clauses.append(
                or_(
                    Analysis.title.ilike(term),
                    Analysis.company_name.ilike(term),
                    Analysis.company_domain.ilike(term),
                )
            )

        # Risk band filter
        if risk_band and risk_band.strip():
            rb = risk_band.strip().upper()
            if rb in ("LOW", "LOW RISK", "LOW_RISK"):
                clauses.append(Analysis.risk_band.ilike("%LOW%"))
            elif rb in ("MODERATE", "MODERATE RISK", "MODERATE_RISK", "MOD"):
                clauses.append(Analysis.risk_band.ilike("%MOD%"))
            elif rb in ("HIGH", "HIGH RISK", "HIGH_RISK"):
                clauses.append(Analysis.risk_band.ilike("%HIGH%"))
            elif rb in ("CRITICAL", "CRITICAL RISK", "CRITICAL_RISK", "CRIT"):
                clauses.append(Analysis.risk_band.ilike("%CRIT%"))
            else:
                clauses.append(Analysis.risk_band == rb)

        # Count total matching records
        count_stmt = select(func.count(Analysis.id)).where(*clauses)
        total = db.scalar(count_stmt) or 0

        # Sorting whitelist
        sort_whitelist = {
            "created_at": Analysis.created_at,
            "overall_risk_score": Analysis.overall_risk_score,
            "company_trust_score": Analysis.company_trust_score,
            "title": Analysis.title,
            "risk": Analysis.overall_risk_score,
            "date": Analysis.created_at,
        }
        sort_col = sort_whitelist.get(sort.lower().strip() if sort else "created_at", Analysis.created_at)
        is_asc = (order or "").lower().strip() == "asc"
        order_by_expr = sort_col.asc() if is_asc else sort_col.desc()

        stmt = (
            select(Analysis)
            .where(*clauses)
            .order_by(order_by_expr)
            .limit(limit)
            .offset(offset)
        )
        items = list(db.execute(stmt).scalars().all())
        return items, total

    @staticmethod
    def delete_analysis(
        db: Session,
        analysis_id: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> bool:
        """
        Deletes an analysis record (hard delete with cascade).
        Strictly requires matching user_id or session_id ownership.
        """
        if user_id is not None:
            where_clause = (Analysis.id == analysis_id) & (Analysis.user_id == user_id)
        elif session_id is not None:
            where_clause = (Analysis.id == analysis_id) & (Analysis.session_id == session_id)
        else:
            return False

        stmt = select(Analysis).where(where_clause)
        analysis = db.execute(stmt).scalar_one_or_none()

        if analysis is None:
            return False

        try:
            db.delete(analysis)
            db.commit()
            owner_desc = f"user '{user_id}'" if user_id else f"session '{session_id[:8]}...'"
            logger.info(f"[+] Successfully deleted analysis {analysis_id} for {owner_desc}")
            return True
        except Exception as e:
            logger.error(f"[!] Error deleting analysis {analysis_id}: {e}", exc_info=True)
            db.rollback()
            raise

    @staticmethod
    def to_analysis_response(analysis: Analysis) -> JobAnalysisResponse:
        """
        Reconstructs the full JobAnalysisResponse snapshot from the persisted database model
        WITHOUT re-running ML models or modifying scoring results.
        """
        try:
            components = json.loads(analysis.components_json) if analysis.components_json else {}
        except Exception:
            components = {}

        try:
            signals = json.loads(analysis.company_signals_json) if analysis.company_signals_json else []
        except Exception:
            signals = []

        try:
            category_breakdown = json.loads(analysis.rule_category_breakdown_json) if analysis.rule_category_breakdown_json else {}
        except Exception:
            category_breakdown = {}

        try:
            reasons = json.loads(analysis.reasons_json) if analysis.reasons_json else []
        except Exception:
            reasons = []

        try:
            corroborations = json.loads(analysis.corroborations_json) if analysis.corroborations_json else []
        except Exception:
            corroborations = []

        # Reconstruct triggered rules list from evidence relationship
        triggered_rules: List[Dict[str, Any]] = []
        if analysis.evidence:
            for ev in analysis.evidence:
                triggered_rules.append({
                    "rule_id": ev.rule_id,
                    "rule_name": ev.rule_name,
                    "category": ev.category,
                    "severity": ev.severity,
                    "score": ev.score,
                    "explanation": ev.explanation,
                    "evidence": ev.evidence,
                })

        prediction = MLPredictionResponse(
            fraud_probability=float(analysis.fraud_probability),
            prediction=str(analysis.prediction_label),
            threshold_used=float(analysis.decision_threshold),
            model_name=str(analysis.model_name),
        )

        risk = RiskScoreResponse(
            overall_score=int(analysis.overall_risk_score),
            risk_band=str(analysis.risk_band),
            status=str(analysis.status),
            components=components,
        )

        company = CompanyTrustResponse(
            company_name=analysis.company_name,
            trust_score=int(analysis.company_trust_score),
            website=analysis.company_website or analysis.url,
            domain=analysis.company_domain,
            email=analysis.company_email or analysis.recruiter_email,
            consistency_rating=str(analysis.consistency_rating),
            signals=signals,
        )

        rules = RuleEvidenceResponse(
            total_score=int(analysis.rule_total_score),
            triggered_rules_count=int(analysis.rule_count),
            triggered_rules=triggered_rules,
            category_breakdown=category_breakdown,
            suspicion_level=str(analysis.rule_suspicion_level),
        )

        metadata = MetadataResponse(
            model_version=str(analysis.model_version),
            risk_config_version=str(analysis.risk_config_version),
            api_version=str(analysis.api_version),
            timestamp=analysis.created_at.isoformat() if analysis.created_at else "",
        )

        return JobAnalysisResponse(
            analysis_id=str(analysis.id),
            session_id=str(analysis.session_id),
            request_id=str(analysis.request_id),
            prediction=prediction,
            risk=risk,
            company=company,
            rules=rules,
            reasons=reasons,
            corroborations=corroborations,
            recommendations=str(analysis.recommendations),
            metadata=metadata,
        )
