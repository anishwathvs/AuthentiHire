"""
AuthentiHire - API Service Layer & Pydantic Data Contracts
==========================================================
Encapsulates request validation, response serialization, model lifecycle,
and risk assessment service orchestration.
"""

import os
import sys
import time
import uuid
import json
import logging
import datetime
from typing import Dict, List, Any, Optional, Union
from pydantic import BaseModel, Field, ConfigDict, field_validator

# Ensure project root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.risk_assessment import (
    AuthentiHireRiskAssessor,
    RISK_LEVEL_LOW,
    RISK_LEVEL_MODERATE,
    RISK_LEVEL_HIGH,
    RISK_LEVEL_CRITICAL,
    STATUS_CLEAR,
    STATUS_LOW_RISK,
    STATUS_REVIEW_RECOMMENDED,
    STATUS_HIGH_RISK,
    STATUS_INSUFFICIENT_EVIDENCE,
)

logger = logging.getLogger("authentihire.api_service")

API_VERSION = "1.0.0"
CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "risk_config.json")


# ==============================================================================
# PYDANTIC REQUEST & RESPONSE SCHEMAS
# ==============================================================================

class JobPostingRequest(BaseModel):
    """Validated input model representing a job/internship posting."""
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    title: Optional[str] = Field(default="", max_length=255, description="Job title or role designation")
    location: Optional[str] = Field(default="", max_length=255, description="Geographic location or country/city")
    department: Optional[str] = Field(default="", max_length=255, description="Department or organizational group")
    salary_range: Optional[str] = Field(default=None, max_length=255, description="Compensation range if provided")
    company_profile: Optional[str] = Field(default="", max_length=50000, description="Introductory company background text")
    description: Optional[str] = Field(default="", max_length=100000, description="Main job description and responsibilities")
    requirements: Optional[str] = Field(default="", max_length=50000, description="Role requirements, qualifications, and skills")
    benefits: Optional[str] = Field(default="", max_length=50000, description="Compensation benefits and perks")
    telecommuting: Optional[bool] = Field(default=False, description="Whether remote/work-from-home is allowed")
    has_company_logo: Optional[bool] = Field(default=False, description="Whether employer logo is present")
    has_questions: Optional[bool] = Field(default=False, description="Whether application screening questions exist")
    employment_type: Optional[str] = Field(default="", max_length=100, description="Full-time, Part-time, Contract, etc.")
    required_experience: Optional[str] = Field(default="", max_length=100, description="Experience level requirement")
    required_education: Optional[str] = Field(default="", max_length=100, description="Educational qualification level")
    industry: Optional[str] = Field(default="", max_length=255, description="Industry domain")
    function: Optional[str] = Field(default="", max_length=255, description="Job functional category")

    # Additional contact & entity intelligence fields
    company_name: Optional[str] = Field(default=None, max_length=255, alias="company", description="Explicit employer/company name")
    recruiter_email: Optional[str] = Field(default=None, max_length=255, alias="email", description="Contact or recruiter email address")
    url: Optional[str] = Field(default=None, max_length=2048, alias="website", description="Corporate website or posting URL")

    @field_validator("telecommuting", "has_company_logo", "has_questions", mode="before")
    @classmethod
    def parse_boolean_fields(cls, v: Any) -> bool:
        if isinstance(v, bool):
            return v
        if isinstance(v, (int, float)):
            return bool(v)
        if isinstance(v, str):
            clean = v.strip().lower()
            if clean in {"true", "1", "yes", "t", "y"}:
                return True
            if clean in {"false", "0", "no", "f", "n", ""}:
                return False
        raise ValueError(f"Unable to parse boolean from value: {v}")


class MLPredictionResponse(BaseModel):
    """Calibrated Machine Learning prediction details."""
    fraud_probability: float = Field(..., description="Calibrated probability estimate of fraudulent class (0.0000 - 1.0000)")
    prediction: str = Field(..., description="Classification label: 'LEGITIMATE' or 'FRAUDULENT'")
    threshold_used: float = Field(..., description="Operating decision threshold used for binary classification")
    model_name: str = Field(..., description="Underlying calibrated model descriptor")


class RiskScoreResponse(BaseModel):
    """Unified multi-signal risk scoring details."""
    overall_score: int = Field(..., ge=0, le=100, description="Combined screening risk score (0 - 100)")
    risk_band: str = Field(..., description="Risk tier: LOW RISK, MODERATE RISK, HIGH RISK, or CRITICAL RISK")
    status: str = Field(..., description="Assessment status: CLEAR, LOW_RISK, REVIEW_RECOMMENDED, HIGH_RISK, INSUFFICIENT_EVIDENCE")
    components: Dict[str, float] = Field(default_factory=dict, description="Point contribution breakdown across sub-systems")


class CompanyTrustResponse(BaseModel):
    """Company and website identity verification details."""
    company_name: Optional[str] = Field(None, description="Extracted or verified company name")
    trust_score: int = Field(..., ge=1, le=100, description="Company Trust Score (1 - 100) reflecting verified presence")
    website: Optional[str] = Field(None, description="Primary company website URL")
    domain: Optional[str] = Field(None, description="Normalized registered root domain")
    email: Optional[str] = Field(None, description="Primary recruiter email address")
    consistency_rating: str = Field(..., description="Cross-attribute alignment: HIGH, MEDIUM, LOW, or UNVERIFIED")
    signals: List[Dict[str, Any]] = Field(default_factory=list, description="Structured company intelligence signals")


class RuleEvidenceResponse(BaseModel):
    """Deterministic scam rule heuristic results."""
    total_score: int = Field(..., ge=0, description="Aggregated rule suspicion score")
    triggered_rules_count: int = Field(..., ge=0, description="Number of distinct scam rules triggered")
    triggered_rules: List[Dict[str, Any]] = Field(default_factory=list, description="List of triggered rules with evidence")
    category_breakdown: Dict[str, int] = Field(default_factory=dict, description="Scores grouped by scam category")
    suspicion_level: str = Field(..., description="Rule engine qualitative suspicion tier")


class ReasonItem(BaseModel):
    """Individual explainable reasoning item."""
    source: str = Field(..., description="Originating component: 'ML', 'RULE', or 'COMPANY'")
    severity: str = Field(..., description="Severity level: 'LOW', 'MEDIUM', 'HIGH', or 'CRITICAL'")
    status: str = Field(..., description="Verification status: 'VERIFIED', 'SUSPICIOUS', 'UNAVAILABLE', or 'UNVERIFIED'")
    explanation: str = Field(..., description="Human-readable description of detected signal and verbatim evidence")


class MetadataResponse(BaseModel):
    """System and configuration metadata."""
    model_version: str = Field(..., description="Model descriptor and serialization version")
    risk_config_version: str = Field(..., description="Active risk configuration version")
    api_version: str = Field(..., description="AuthentiHire API service version")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp of assessment execution")


class JobAnalysisResponse(BaseModel):
    """Master structured response schema for POST /api/v1/analyze and historical analysis snapshots."""
    analysis_id: Optional[str] = Field(default=None, description="Persistent database unique UUID identifier")
    session_id: Optional[str] = Field(default=None, description="Anonymous session identifier for ownership")
    request_id: str = Field(..., description="Unique UUID tracking ID for this assessment request")
    prediction: MLPredictionResponse = Field(..., description="Calibrated ML classification metrics")
    risk: RiskScoreResponse = Field(..., description="Overall screening risk score and band")
    company: CompanyTrustResponse = Field(..., description="Company trust and website identity assessment")
    rules: RuleEvidenceResponse = Field(..., description="Deterministic scam rule evidence")
    reasons: List[str] = Field(default_factory=list, description="Human-readable explainable reasons")
    corroborations: List[str] = Field(default_factory=list, description="Multi-source signal corroboration notes")
    recommendations: str = Field(..., description="Neutral, actionable guidance for applicant/reviewer")
    metadata: MetadataResponse = Field(..., description="System version and timestamp metadata")


class HealthResponse(BaseModel):
    """Health and readiness check response."""
    status: str = Field(..., description="Service health state: 'ok' or 'degraded'")
    service: str = Field(..., description="Service identifier name")
    version: str = Field(..., description="API version")
    models_loaded: bool = Field(..., description="Whether ML models and preprocessors are loaded in memory")
    timestamp: str = Field(..., description="Current UTC timestamp")


class ModelInfoResponse(BaseModel):
    """Detailed non-sensitive model metadata response."""
    service: str
    api_version: str
    model_name: str
    model_type: str
    calibration_method: str
    risk_config_version: str
    weights: Dict[str, float]
    operating_threshold: float
    risk_bands: Dict[str, List[int]]
    guardrails: Dict[str, Any]


# ==============================================================================
# SERVICE LAYER IMPLEMENTATION
# ==============================================================================

class AuthentiHireService:
    """Service layer managing single-instance model caching and analysis orchestration."""

    _instance: Optional["AuthentiHireService"] = None

    def __init__(self) -> None:
        logger.info("[+] Initializing AuthentiHireService and loading validated ML/Risk models...")
        self.assessor = AuthentiHireRiskAssessor()
        self.config_data = self._load_risk_config()
        self.models_loaded = True
        logger.info("[+] AuthentiHireService successfully initialized and models loaded.")

    @classmethod
    def get_instance(cls) -> "AuthentiHireService":
        """Singleton accessor for service instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_risk_config(self) -> Dict[str, Any]:
        """Loads frozen risk configuration file if present."""
        if os.path.exists(CONFIG_PATH):
            try:
                with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Unable to read risk config from {CONFIG_PATH}: {e}")
        return {
            "version": "1.0.0",
            "weights": {"ml_weight": 0.50, "rule_weight": 0.30, "company_weight": 0.20},
            "operating_flagging_threshold": 25,
            "risk_bands": {
                "LOW_RISK": [0, 24],
                "MODERATE_RISK": [25, 49],
                "HIGH_RISK": [50, 74],
                "CRITICAL_RISK": [75, 100],
            },
            "guardrail_settings": {
                "critical_scam_rule_floor": 55,
                "raw_ip_url_floor": 50,
                "compound_ml_rule_floor": 75,
                "insufficient_evidence_char_limit": 50,
            },
        }

    def analyze_job_posting(
        self,
        request: JobPostingRequest,
        request_id: Optional[str] = None,
        live_checks: bool = False,
    ) -> JobAnalysisResponse:
        """Executes full pipeline assessment and maps results into the standard response schema."""
        req_id = request_id or str(uuid.uuid4())
        start_time = time.time()
        logger.info(f"[{req_id}] Processing job analysis request for title: '{request.title}'...")

        # Transform Pydantic model into internal posting dictionary
        posting_dict: Dict[str, Any] = {
            "title": request.title or "",
            "location": request.location or "",
            "department": request.department or "",
            "salary_range": request.salary_range,
            "company_profile": request.company_profile or "",
            "description": request.description or "",
            "requirements": request.requirements or "",
            "benefits": request.benefits or "",
            "telecommuting": int(request.telecommuting or False),
            "has_company_logo": int(request.has_company_logo or False),
            "has_questions": int(request.has_questions or False),
            "employment_type": request.employment_type or "",
            "required_experience": request.required_experience or "",
            "required_education": request.required_education or "",
            "industry": request.industry or "",
            "function": request.function or "",
            "company": request.company_name,
            "company_name": request.company_name,
            "recruiter_email": request.recruiter_email,
            "website": request.url,
            "url": request.url,
        }

        # Run Unified Risk Assessor
        raw_res = self.assessor.assess_posting(posting_dict, live_checks=live_checks)
        elapsed_ms = (time.time() - start_time) * 1000.0

        # Construct structured response
        ml_data = raw_res["ml_assessment"]
        rule_data = raw_res["rule_assessment"]
        comp_data = raw_res["company_assessment"]

        prediction_resp = MLPredictionResponse(
            fraud_probability=float(ml_data["fraud_probability"]),
            prediction=str(ml_data["prediction_label"]),
            threshold_used=float(ml_data["decision_threshold"]),
            model_name=str(ml_data.get("model_name", "Calibrated Logistic Regression")),
        )

        risk_resp = RiskScoreResponse(
            overall_score=int(raw_res["overall_risk_score"]),
            risk_band=str(raw_res["risk_level"]),
            status=str(raw_res["assessment_status"]),
            components=raw_res.get("score_components", {}),
        )

        # Primary email & domain
        primary_email = comp_data["emails"][0]["email"] if comp_data.get("emails") else request.recruiter_email
        primary_domain = comp_data.get("company_domain") or (comp_data["domains"][0] if comp_data.get("domains") else None)

        company_resp = CompanyTrustResponse(
            company_name=comp_data.get("company_name"),
            trust_score=int(raw_res["company_trust_score"]),
            website=request.url or (f"https://{primary_domain}" if primary_domain else None),
            domain=primary_domain,
            email=primary_email,
            consistency_rating=str(comp_data.get("consistency", {}).get("rating", "UNVERIFIED")),
            signals=comp_data.get("signals", []),
        )

        rule_resp = RuleEvidenceResponse(
            total_score=int(rule_data["rule_suspicion_score"]),
            triggered_rules_count=int(rule_data["rule_count"]),
            triggered_rules=rule_data.get("triggered_rules", []),
            category_breakdown=rule_data.get("category_breakdown", {}),
            suspicion_level=str(rule_data.get("suspicion_level", "Clean")),
        )

        meta_resp = MetadataResponse(
            model_version="AuthentiHire-Calibrated-v1",
            risk_config_version=self.config_data.get("version", "1.0.0"),
            api_version=API_VERSION,
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        )

        logger.info(
            f"[{req_id}] Analysis completed in {elapsed_ms:.2f}ms. "
            f"Risk: {risk_resp.overall_score}/100 ({risk_resp.risk_band}), "
            f"ML Fraud Prob: {prediction_resp.fraud_probability:.4f}, "
            f"Company Trust: {company_resp.trust_score}/100"
        )

        return JobAnalysisResponse(
            request_id=req_id,
            prediction=prediction_resp,
            risk=risk_resp,
            company=company_resp,
            rules=rule_resp,
            reasons=raw_res.get("reasons", []),
            corroborations=raw_res.get("corroborations", []),
            recommendations=str(raw_res["recommendation"]),
            metadata=meta_resp,
        )

    def get_health(self) -> HealthResponse:
        """Returns API health status."""
        return HealthResponse(
            status="ok" if self.models_loaded else "degraded",
            service="AuthentiHire API",
            version=API_VERSION,
            models_loaded=self.models_loaded,
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        )

    def get_model_info(self) -> ModelInfoResponse:
        """Returns non-sensitive model and scoring metadata."""
        return ModelInfoResponse(
            service="AuthentiHire Scam Detection & Risk Engine",
            api_version=API_VERSION,
            model_name="Isotonically Calibrated Logistic Regression",
            model_type="TF-IDF Word + Char N-Grams + Calibrated Linear Classifier",
            calibration_method="Isotonic Regression (balanced class weights)",
            risk_config_version=self.config_data.get("version", "1.0.0"),
            weights=self.config_data.get("weights", {"ml_weight": 0.50, "rule_weight": 0.30, "company_weight": 0.20}),
            operating_threshold=float(self.config_data.get("operating_flagging_threshold", 25)),
            risk_bands=self.config_data.get("risk_bands", {
                "LOW_RISK": [0, 24],
                "MODERATE_RISK": [25, 49],
                "HIGH_RISK": [50, 74],
                "CRITICAL_RISK": [75, 100],
            }),
            guardrails=self.config_data.get("guardrail_settings", {}),
        )
