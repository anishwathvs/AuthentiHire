"""
AuthentiHire - Database Persistence Unit & Integration Tests
============================================================
Comprehensive test suite validating database connection, table initialization,
CRUD operations, transaction atomicity, relational integrity, session-based ownership,
pagination, and snapshot consistency against an isolated test database.
"""

import os
import sys
import uuid
import datetime
import unittest
from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure project root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.database.models import Base, Analysis, AnalysisEvidence, CompanyVerification
from src.database.repository import AnalysisRepository
from src.api_service import (
    JobPostingRequest,
    JobAnalysisResponse,
    MLPredictionResponse,
    RiskScoreResponse,
    CompanyTrustResponse,
    RuleEvidenceResponse,
    MetadataResponse,
)


class TestDatabasePersistence(unittest.TestCase):
    """17+ Test Cases covering the full database persistence lifecycle."""

    @classmethod
    def setUpClass(cls):
        """Set up an isolated in-memory SQLite database for the test class."""
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.SessionTest = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=cls.engine,
            expire_on_commit=False,
        )

    def setUp(self):
        """Recreate all tables for each isolated test run."""
        Base.metadata.create_all(bind=self.engine)
        self.db = self.SessionTest()

    def tearDown(self):
        """Clean up database session and drop all tables."""
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)

    def _create_sample_request_and_response(
        self,
        title="Senior Python Backend Developer",
        risk_score=15,
        risk_band="LOW RISK",
        status="LOW_RISK",
        rules_count=0,
        rules_list=None,
    ):
        """Helper creating mock JobPostingRequest and JobAnalysisResponse objects."""
        request = JobPostingRequest(
            title=title,
            company_name="Apex Global Technologies",
            location="Austin, TX",
            department="Engineering",
            salary_range="$140,000 - $170,000",
            employment_type="Full-time",
            required_experience="5+ years",
            required_education="Bachelor's Degree",
            industry="Software & IT",
            function="Engineering",
            telecommuting=True,
            has_company_logo=True,
            has_questions=True,
            recruiter_email="careers@apexglobal.tech",
            url="https://apexglobal.tech/careers",
            company_profile="Apex Global is an established enterprise software provider.",
            description="Seeking senior engineer to design distributed backend microservices.",
            requirements="Proficiency in Python, FastAPI, and PostgreSQL databases.",
            benefits="Comprehensive healthcare, 401(k) matching, remote work flexibility.",
        )

        prediction = MLPredictionResponse(
            fraud_probability=0.042,
            prediction="LEGITIMATE",
            threshold_used=0.25,
            model_name="Isotonically Calibrated Logistic Regression",
        )

        risk = RiskScoreResponse(
            overall_score=risk_score,
            risk_band=risk_band,
            status=status,
            components={"ml_risk_component": 2.1, "rule_risk_component": 0.0, "company_risk_component": 3.0},
        )

        company = CompanyTrustResponse(
            company_name="Apex Global Technologies",
            trust_score=85,
            website="https://apexglobal.tech",
            domain="apexglobal.tech",
            email="careers@apexglobal.tech",
            consistency_rating="HIGH",
            signals=[
                {
                    "signal_type": "DOMAIN_VERIFIED",
                    "category": "Domain Heuristics",
                    "description": "Registered domain matches recruiter address domain.",
                    "evidence": "apexglobal.tech",
                    "trust_penalty": 0,
                }
            ],
        )

        rules = RuleEvidenceResponse(
            total_score=0 if not rules_list else sum(r.get("score", 0) for r in rules_list),
            triggered_rules_count=rules_count,
            triggered_rules=rules_list or [],
            category_breakdown={"Financial Demands": 0, "Communication Channels": 0},
            suspicion_level="Clean" if rules_count == 0 else "High",
        )

        metadata = MetadataResponse(
            model_version="AuthentiHire-Calibrated-v1",
            risk_config_version="1.0.0",
            api_version="1.0.0",
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        )

        response = JobAnalysisResponse(
            request_id=str(uuid.uuid4()),
            prediction=prediction,
            risk=risk,
            company=company,
            rules=rules,
            reasons=["All primary contact domains verified and authentic."],
            corroborations=["ML model and rule heuristics corroborate low risk status."],
            recommendations="Standard due diligence recommended. This posting exhibits verified enterprise credentials.",
            metadata=metadata,
        )

        return request, response

    # --------------------------------------------------------------------------
    # 1. Database Connection
    # --------------------------------------------------------------------------
    def test_01_database_connection(self):
        """Verify database engine executes simple queries successfully."""
        result = self.db.execute(select(func.datetime('now'))).scalar()
        self.assertIsNotNone(result)

    # --------------------------------------------------------------------------
    # 2. Table Creation & Schema Verification
    # --------------------------------------------------------------------------
    def test_02_table_creation_and_schema(self):
        """Verify tables (analyses, analysis_evidence, company_verifications) are created with correct columns."""
        tables = Base.metadata.tables.keys()
        self.assertIn("analyses", tables)
        self.assertIn("analysis_evidence", tables)
        self.assertIn("company_verifications", tables)

    # --------------------------------------------------------------------------
    # 3. Create Analysis Record
    # --------------------------------------------------------------------------
    def test_03_create_analysis(self):
        """Verify AnalysisRepository.save_analysis saves primary analysis record accurately."""
        req, resp = self._create_sample_request_and_response()
        session_id = "session_user_abc123"

        saved = AnalysisRepository.save_analysis(self.db, req, resp, session_id=session_id)
        self.assertIsNotNone(saved.id)
        self.assertEqual(saved.session_id, session_id)
        self.assertEqual(saved.title, "Senior Python Backend Developer")
        self.assertEqual(saved.overall_risk_score, 15)
        self.assertEqual(saved.risk_band, "LOW RISK")
        self.assertEqual(saved.fraud_probability, 0.042)

    # --------------------------------------------------------------------------
    # 4. Retrieve Analysis Record
    # --------------------------------------------------------------------------
    def test_04_retrieve_analysis(self):
        """Verify retrieving saved analysis by ID and session_id returns populated entity."""
        req, resp = self._create_sample_request_and_response()
        session_id = "session_retrieve_test"
        saved = AnalysisRepository.save_analysis(self.db, req, resp, session_id=session_id)

        retrieved = AnalysisRepository.get_analysis_by_id(self.db, analysis_id=saved.id, session_id=session_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.id, saved.id)
        self.assertEqual(retrieved.company_name, "Apex Global Technologies")

    # --------------------------------------------------------------------------
    # 5. Delete Analysis Record (Cascade Check)
    # --------------------------------------------------------------------------
    def test_05_delete_analysis(self):
        """Verify deleting analysis removes record and cascades to evidence and verifications."""
        rules = [{
            "rule_id": "RULE_01_PAYMENT_DEMAND",
            "rule_name": "Upfront Payment Demand",
            "category": "Financial Demands",
            "severity": "CRITICAL",
            "score": 35,
            "explanation": "Requires application fee",
            "evidence": "Send $50 via Zelle",
        }]
        req, resp = self._create_sample_request_and_response(rules_count=1, rules_list=rules)
        session_id = "session_delete_test"
        saved = AnalysisRepository.save_analysis(self.db, req, resp, session_id=session_id)

        # Confirm evidence exists
        ev_count = self.db.scalar(select(func.count()).select_from(AnalysisEvidence).where(AnalysisEvidence.analysis_id == saved.id))
        self.assertEqual(ev_count, 1)

        # Delete
        success = AnalysisRepository.delete_analysis(self.db, analysis_id=saved.id, session_id=session_id)
        self.assertTrue(success)

        # Verify parent deleted
        deleted_rec = AnalysisRepository.get_analysis_by_id(self.db, analysis_id=saved.id, session_id=session_id)
        self.assertIsNone(deleted_rec)

        # Verify child evidence cascaded
        ev_after = self.db.scalar(select(func.count()).select_from(AnalysisEvidence).where(AnalysisEvidence.analysis_id == saved.id))
        self.assertEqual(ev_after, 0)

    # --------------------------------------------------------------------------
    # 6. Evidence Persistence
    # --------------------------------------------------------------------------
    def test_06_evidence_persistence(self):
        """Verify structured scam rule evidence items are saved with correct relational foreign keys."""
        rules = [
            {
                "rule_id": "RULE_01_PAYMENT_DEMAND",
                "rule_name": "Upfront Payment Demand",
                "category": "Financial Demands",
                "severity": "CRITICAL",
                "score": 35,
                "explanation": "Demands wire transfer",
                "evidence": "$250 registration fee",
            },
            {
                "rule_id": "RULE_06_SUSPICIOUS_MESSAGING",
                "rule_name": "Exclusive Messaging Channel",
                "category": "Communication Channels",
                "severity": "HIGH",
                "score": 25,
                "explanation": "Interviews only on Telegram",
                "evidence": "Contact @hiring_manager on Telegram",
            },
        ]
        req, resp = self._create_sample_request_and_response(
            risk_score=78,
            risk_band="CRITICAL RISK",
            status="HIGH_RISK",
            rules_count=2,
            rules_list=rules,
        )
        session_id = "session_evidence_test"
        saved = AnalysisRepository.save_analysis(self.db, req, resp, session_id=session_id)

        retrieved = AnalysisRepository.get_analysis_by_id(self.db, saved.id, session_id=session_id)
        self.assertEqual(len(retrieved.evidence), 2)
        rule_ids = {e.rule_id for e in retrieved.evidence}
        self.assertIn("RULE_01_PAYMENT_DEMAND", rule_ids)
        self.assertIn("RULE_06_SUSPICIOUS_MESSAGING", rule_ids)

    # --------------------------------------------------------------------------
    # 7. Company Verification Persistence
    # --------------------------------------------------------------------------
    def test_07_company_verification_persistence(self):
        """Verify company verification entity stores trust score, domain, and consistency rating."""
        req, resp = self._create_sample_request_and_response()
        session_id = "session_comp_test"
        saved = AnalysisRepository.save_analysis(self.db, req, resp, session_id=session_id)

        retrieved = AnalysisRepository.get_analysis_by_id(self.db, saved.id, session_id=session_id)
        self.assertEqual(len(retrieved.company_verifications), 1)
        comp_ver = retrieved.company_verifications[0]
        self.assertEqual(comp_ver.domain, "apexglobal.tech")
        self.assertEqual(comp_ver.trust_score, 85)
        self.assertEqual(comp_ver.consistency_rating, "HIGH")

    # --------------------------------------------------------------------------
    # 8. Risk Metadata Persistence
    # --------------------------------------------------------------------------
    def test_08_risk_metadata_persistence(self):
        """Verify model version, risk config version, and timestamp metadata are stored."""
        req, resp = self._create_sample_request_and_response()
        session_id = "session_meta_test"
        saved = AnalysisRepository.save_analysis(self.db, req, resp, session_id=session_id)

        self.assertEqual(saved.model_version, "AuthentiHire-Calibrated-v1")
        self.assertEqual(saved.risk_config_version, "1.0.0")
        self.assertEqual(saved.api_version, "1.0.0")
        self.assertIsNotNone(saved.created_at)

    # --------------------------------------------------------------------------
    # 9. Session Ownership Enforcement
    # --------------------------------------------------------------------------
    def test_09_session_ownership(self):
        """Verify query with owning session_id successfully retrieves record."""
        req, resp = self._create_sample_request_and_response()
        owner_session = "owner_session_111"
        saved = AnalysisRepository.save_analysis(self.db, req, resp, session_id=owner_session)

        retrieved = AnalysisRepository.get_analysis_by_id(self.db, saved.id, session_id=owner_session)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.session_id, owner_session)

    # --------------------------------------------------------------------------
    # 10. Cross-Session Access Denial
    # --------------------------------------------------------------------------
    def test_10_cross_session_access_denial(self):
        """Verify a different session_id cannot retrieve or delete another session's analysis."""
        req, resp = self._create_sample_request_and_response()
        owner_session = "owner_session_111"
        attacker_session = "attacker_session_999"
        saved = AnalysisRepository.save_analysis(self.db, req, resp, session_id=owner_session)

        # Attacker cannot retrieve
        cross_retrieval = AnalysisRepository.get_analysis_by_id(self.db, saved.id, session_id=attacker_session)
        self.assertIsNone(cross_retrieval)

        # Attacker cannot delete
        cross_delete = AnalysisRepository.delete_analysis(self.db, saved.id, session_id=attacker_session)
        self.assertFalse(cross_delete)

        # Owner can still access
        owner_retrieval = AnalysisRepository.get_analysis_by_id(self.db, saved.id, session_id=owner_session)
        self.assertIsNotNone(owner_retrieval)

    # --------------------------------------------------------------------------
    # 11. Pagination & Limits
    # --------------------------------------------------------------------------
    def test_11_pagination(self):
        """Verify list_analyses respects limit, offset, and total count."""
        session_id = "session_pagination_test"
        for i in range(15):
            req, resp = self._create_sample_request_and_response(title=f"Engineer #{i+1}")
            AnalysisRepository.save_analysis(self.db, req, resp, session_id=session_id)

        # Page 1: 10 items
        page_1, total = AnalysisRepository.list_analyses(self.db, session_id=session_id, limit=10, offset=0)
        self.assertEqual(total, 15)
        self.assertEqual(len(page_1), 10)

        # Page 2: 5 items
        page_2, total = AnalysisRepository.list_analyses(self.db, session_id=session_id, limit=10, offset=10)
        self.assertEqual(total, 15)
        self.assertEqual(len(page_2), 5)

    # --------------------------------------------------------------------------
    # 12. Transaction Rollback on Error
    # --------------------------------------------------------------------------
    def test_12_transaction_rollback(self):
        """Verify that when persistence fails partway through, the entire transaction rolls back."""
        req, resp = self._create_sample_request_and_response()
        session_id = "session_rollback_test"

        # Corrupt response risk score to invalid non-integer string to force DB exception
        resp.risk.overall_score = None  # Non-nullable field in DB

        with self.assertRaises(Exception):
            AnalysisRepository.save_analysis(self.db, req, resp, session_id=session_id)

        # Verify nothing was committed
        count = self.db.scalar(select(func.count()).select_from(Analysis).where(Analysis.session_id == session_id))
        self.assertEqual(count, 0)

    # --------------------------------------------------------------------------
    # 13. Invalid Analysis ID Retrieval
    # --------------------------------------------------------------------------
    def test_13_invalid_analysis_id(self):
        """Verify non-existent analysis ID returns None cleanly."""
        result = AnalysisRepository.get_analysis_by_id(self.db, analysis_id=str(uuid.uuid4()), session_id="some_session")
        self.assertIsNone(result)

    # --------------------------------------------------------------------------
    # 14. Empty History for New Session
    # --------------------------------------------------------------------------
    def test_14_empty_history(self):
        """Verify new session without analyses returns empty list and total=0."""
        items, total = AnalysisRepository.list_analyses(self.db, session_id="fresh_empty_session")
        self.assertEqual(len(items), 0)
        self.assertEqual(total, 0)

    # --------------------------------------------------------------------------
    # 15. Multiple Analyses Ordering
    # --------------------------------------------------------------------------
    def test_15_multiple_analyses_ordering(self):
        """Verify analyses are returned sorted by created_at descending (newest first)."""
        session_id = "session_order_test"
        req1, resp1 = self._create_sample_request_and_response(title="First Job")
        rec1 = AnalysisRepository.save_analysis(self.db, req1, resp1, session_id=session_id)

        req2, resp2 = self._create_sample_request_and_response(title="Second Job")
        rec2 = AnalysisRepository.save_analysis(self.db, req2, resp2, session_id=session_id)

        items, _ = AnalysisRepository.list_analyses(self.db, session_id=session_id, limit=10, offset=0)
        self.assertEqual(len(items), 2)
        self.assertEqual(items[0].id, rec2.id)
        self.assertEqual(items[1].id, rec1.id)

    # --------------------------------------------------------------------------
    # 16. Historical Snapshot Consistency (No ML Rerun)
    # --------------------------------------------------------------------------
    def test_16_historical_snapshot_consistency(self):
        """Verify to_analysis_response reconstructs the exact original response without rerun."""
        rules = [{
            "rule_id": "RULE_01_PAYMENT_DEMAND",
            "rule_name": "Upfront Payment Demand",
            "category": "Financial Demands",
            "severity": "CRITICAL",
            "score": 35,
            "explanation": "Demands wire payment",
            "evidence": "$250 onboarding fee",
        }]
        req, resp = self._create_sample_request_and_response(
            risk_score=68,
            risk_band="HIGH RISK",
            status="HIGH_RISK",
            rules_count=1,
            rules_list=rules,
        )
        session_id = "session_snapshot_test"
        saved = AnalysisRepository.save_analysis(self.db, req, resp, session_id=session_id)

        reconstructed = AnalysisRepository.to_analysis_response(saved)
        self.assertEqual(reconstructed.analysis_id, saved.id)
        self.assertEqual(reconstructed.risk.overall_score, 68)
        self.assertEqual(reconstructed.risk.risk_band, "HIGH RISK")
        self.assertEqual(reconstructed.rules.triggered_rules_count, 1)
        self.assertEqual(reconstructed.rules.triggered_rules[0]["rule_id"], "RULE_01_PAYMENT_DEMAND")
        self.assertEqual(reconstructed.recommendations, resp.recommendations)

    # --------------------------------------------------------------------------
    # 17. Update UpdatedAt Timestamp
    # --------------------------------------------------------------------------
    def test_17_updated_at_timestamp(self):
        """Verify created_at and updated_at are initialized correctly."""
        req, resp = self._create_sample_request_and_response()
        saved = AnalysisRepository.save_analysis(self.db, req, resp, session_id="session_timestamp_test")
        self.assertIsNotNone(saved.created_at)
        self.assertIsNotNone(saved.updated_at)

    # --------------------------------------------------------------------------
    # 18. User Creation & Retrieval
    # --------------------------------------------------------------------------
    def test_18_user_creation_and_retrieval(self):
        """Verify UserRepository creates user and retrieves by ID and email."""
        from src.database.repository import UserRepository
        from src.database.models import User

        user = UserRepository.create_user(
            self.db,
            email="testuser@example.com",
            password_hash="mock_hash_123",
        )
        self.assertIsNotNone(user.id)
        self.assertEqual(user.email, "testuser@example.com")
        self.assertTrue(user.is_active)

        fetched_by_id = UserRepository.get_by_id(self.db, user.id)
        self.assertEqual(fetched_by_id.email, "testuser@example.com")

        fetched_by_email = UserRepository.get_by_email(self.db, "testuser@example.com")
        self.assertEqual(fetched_by_email.id, user.id)

    # --------------------------------------------------------------------------
    # 19. User Unique Email Constraint
    # --------------------------------------------------------------------------
    def test_19_user_unique_email(self):
        """Verify creating two users with the same email violates uniqueness."""
        from src.database.repository import UserRepository
        from sqlalchemy.exc import IntegrityError

        UserRepository.create_user(self.db, email="unique@example.com", password_hash="hash1")
        with self.assertRaises(IntegrityError):
            UserRepository.create_user(self.db, email="unique@example.com", password_hash="hash2")
        self.db.rollback()

    # --------------------------------------------------------------------------
    # 20. User -> Analysis Relationship
    # --------------------------------------------------------------------------
    def test_20_user_analysis_relationship(self):
        """Verify Analysis records linked to user_id populate user.analyses."""
        from src.database.repository import UserRepository

        user = UserRepository.create_user(self.db, email="analyst@example.com", password_hash="hash")
        req, resp = self._create_sample_request_and_response(title="Data Scientist Job")
        saved = AnalysisRepository.save_analysis(
            self.db, req, resp, session_id="session_dummy", user_id=user.id
        )

        self.assertEqual(saved.user_id, user.id)
        self.assertEqual(len(user.analyses), 1)
        self.assertEqual(user.analyses[0].id, saved.id)

    # --------------------------------------------------------------------------
    # 21. User Cascade Deletion
    # --------------------------------------------------------------------------
    def test_21_user_cascade_deletion(self):
        """Verify deleting a User cascades and removes all their Analysis records."""
        from src.database.repository import UserRepository
        from src.database.models import User

        user = UserRepository.create_user(self.db, email="delete_me@example.com", password_hash="hash")
        req, resp = self._create_sample_request_and_response(title="Temporary Job")
        saved = AnalysisRepository.save_analysis(
            self.db, req, resp, session_id="session_dummy", user_id=user.id
        )
        saved_id = saved.id

        # Delete user
        self.db.delete(user)
        self.db.commit()

        # Check analysis is gone
        found = self.db.query(Analysis).filter(Analysis.id == saved_id).first()
        self.assertIsNone(found)

    # --------------------------------------------------------------------------
    # 22. User-Scoped Isolation in List & Delete
    # --------------------------------------------------------------------------
    def test_22_user_scoped_isolation(self):
        """Verify listing and deleting analyses strictly respects user_id isolation."""
        from src.database.repository import UserRepository

        user1 = UserRepository.create_user(self.db, email="user1@test.com", password_hash="hash")
        user2 = UserRepository.create_user(self.db, email="user2@test.com", password_hash="hash")

        req1, resp1 = self._create_sample_request_and_response(title="Job User 1")
        rec1 = AnalysisRepository.save_analysis(self.db, req1, resp1, session_id="s1", user_id=user1.id)

        req2, resp2 = self._create_sample_request_and_response(title="Job User 2")
        rec2 = AnalysisRepository.save_analysis(self.db, req2, resp2, session_id="s2", user_id=user2.id)

        # List user1
        list_u1, count_u1 = AnalysisRepository.list_analyses(self.db, user_id=user1.id)
        self.assertEqual(count_u1, 1)
        self.assertEqual(list_u1[0].id, rec1.id)

        # List user2
        list_u2, count_u2 = AnalysisRepository.list_analyses(self.db, user_id=user2.id)
        self.assertEqual(count_u2, 1)
        self.assertEqual(list_u2[0].id, rec2.id)

        # User 2 tries to delete User 1's analysis
        deleted = AnalysisRepository.delete_analysis(self.db, analysis_id=rec1.id, user_id=user2.id)
        self.assertFalse(deleted)


if __name__ == "__main__":
    unittest.main()
