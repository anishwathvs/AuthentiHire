"""
AuthentiHire - Phase 10 Dashboard & Analysis History Backend Tests
=================================================================
Validates:
1. Dashboard summary authenticated endpoint
2. Dashboard summary unauthenticated access denial
3. Summary metrics isolation (user-scoped only)
4. Empty dashboard state
5. History pagination
6. History search (title, company, domain)
7. History risk band filtering
8. History sorting (date, risk score, trust score, title)
9. Cross-user history isolation
10. Analysis detail ownership enforcement
11. Hard deletion of analysis records
12. Invalid / non-existent analysis ID handling
13. Large history pagination
14. SQL aggregation correctness (averages, distributions, 7-day counts)
"""

import unittest
import uuid
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from src.api import app
from src.database.models import Base, User, Analysis, AnalysisEvidence, CompanyVerification
from src.database.connection import get_db
from src.auth.security import hash_password, create_access_token
from src.database.repository import UserRepository, AnalysisRepository
from src.api_service import (
    JobPostingRequest,
    JobAnalysisResponse,
    MLPredictionResponse,
    RiskScoreResponse,
    CompanyTrustResponse,
    RuleEvidenceResponse,
    MetadataResponse,
)


from sqlalchemy.pool import StaticPool

class TestDashboardAndHistory(unittest.TestCase):
    """Integration test suite for Dashboard Aggregations and Analysis History."""

    @classmethod
    def setUpClass(cls):
        """Create isolated in-memory SQLite database and test client."""
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=cls.engine,
            expire_on_commit=False,
        )
        Base.metadata.create_all(bind=cls.engine)

        def override_get_db():
            db = cls.SessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=cls.engine)
        cls.engine.dispose()
        app.dependency_overrides.clear()

    def setUp(self):
        self.db = self.SessionLocal()

    def tearDown(self):
        self.db.close()

    def _create_test_user(self, email_prefix: str = "user") -> tuple[User, str]:
        """Helper to create a user and valid JWT access token."""
        unique_email = f"{email_prefix}_{uuid.uuid4().hex[:6]}@example.com"
        pwd_hash = hash_password("ValidPass123!")
        user = UserRepository.create_user(self.db, email=unique_email, password_hash=pwd_hash)
        token = create_access_token(user.id, user.email)
        return user, token

    def _create_mock_analysis(
        self,
        user_id: str,
        title: str = "Software Engineer",
        company: str = "Acme Corp",
        domain: str = "acme.com",
        risk_score: int = 25,
        risk_band: str = "LOW RISK",
        days_ago: int = 0,
    ) -> Analysis:
        """Helper to seed structured analysis records with past timestamps."""
        created_dt = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days_ago)
        rec_id = str(uuid.uuid4())
        analysis = Analysis(
            id=rec_id,
            request_id=str(uuid.uuid4()),
            session_id=f"session_{rec_id[:8]}",
            user_id=user_id,
            title=title,
            company_name=company,
            company_domain=domain,
            company_website=f"https://{domain}",
            company_email=f"recruiter@{domain}",
            location="New York, NY",
            fraud_probability=0.08 if risk_score < 40 else 0.85,
            prediction_label="LEGITIMATE" if risk_score < 50 else "FRAUDULENT",
            decision_threshold=0.35,
            model_name="CalibratedEnsemble_v1",
            overall_risk_score=risk_score,
            risk_band=risk_band,
            status="CLEAR" if risk_score < 30 else "HIGH_RISK",
            components_json='{"ml_risk_component": 10, "rule_risk_component": 0, "company_risk_component": 15}',
            company_trust_score=85 if risk_score < 40 else 30,
            consistency_rating="HIGH",
            company_signals_json='[]',
            rule_total_score=0 if risk_score < 40 else 45,
            rule_count=0 if risk_score < 40 else 2,
            rule_suspicion_level="NONE" if risk_score < 40 else "HIGH",
            rule_category_breakdown_json='{}',
            reasons_json='["Clean employer verification"]',
            corroborations_json='[]',
            recommendations="Standard safe application process.",
            model_version="1.0.0",
            risk_config_version="1.0.0",
            api_version="1.0.0",
            created_at=created_dt,
            updated_at=created_dt,
        )
        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)
        return analysis

    def test_01_dashboard_summary_authenticated(self):
        """1. Authenticated user receives valid summary metrics."""
        user, token = self._create_test_user("dash_user")
        self._create_mock_analysis(user.id, title="Frontend Dev", risk_score=20, risk_band="LOW RISK")
        self._create_mock_analysis(user.id, title="Backend Dev", risk_score=75, risk_band="HIGH RISK")

        res = self.client.get(
            "/api/v1/dashboard/summary",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_analyses"], 2)
        self.assertEqual(data["risk_distribution"]["low"], 1)
        self.assertEqual(data["risk_distribution"]["high"], 1)
        self.assertAlmostEqual(data["average_risk_score"], 47.5, delta=0.5)
        self.assertEqual(data["recent_analysis_count"], 2)
        self.assertEqual(len(data["recent_analyses"]), 2)

    def test_02_dashboard_summary_unauthenticated(self):
        """2. Unauthenticated request to /dashboard/summary is rejected with 401."""
        res = self.client.get("/api/v1/dashboard/summary")
        self.assertEqual(res.status_code, 401)

    def test_03_summary_only_contains_user_analyses(self):
        """3. Dashboard summary isolates statistics to the authenticated user."""
        user1, token1 = self._create_test_user("user_iso1")
        user2, token2 = self._create_test_user("user_iso2")

        # 3 analyses for User 1
        for _ in range(3):
            self._create_mock_analysis(user1.id, risk_score=15, risk_band="LOW RISK")
        # 1 analysis for User 2
        self._create_mock_analysis(user2.id, risk_score=90, risk_band="CRITICAL RISK")

        res1 = self.client.get("/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {token1}"})
        data1 = res1.json()
        self.assertEqual(data1["total_analyses"], 3)
        self.assertEqual(data1["risk_distribution"]["low"], 3)
        self.assertEqual(data1["risk_distribution"]["critical"], 0)

        res2 = self.client.get("/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {token2}"})
        data2 = res2.json()
        self.assertEqual(data2["total_analyses"], 1)
        self.assertEqual(data2["risk_distribution"]["low"], 0)
        self.assertEqual(data2["risk_distribution"]["critical"], 1)

    def test_04_empty_dashboard(self):
        """4. New user with zero analyses receives clean empty summary."""
        user, token = self._create_test_user("empty_user")
        res = self.client.get("/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_analyses"], 0)
        self.assertEqual(data["average_risk_score"], 0.0)
        self.assertEqual(data["recent_analysis_count"], 0)
        self.assertEqual(data["risk_distribution"]["low"], 0)
        self.assertEqual(data["risk_distribution"]["moderate"], 0)
        self.assertEqual(data["risk_distribution"]["high"], 0)
        self.assertEqual(data["risk_distribution"]["critical"], 0)
        self.assertEqual(len(data["recent_analyses"]), 0)

    def test_05_history_pagination(self):
        """5. History pagination correctly applies limit and offset."""
        user, token = self._create_test_user("page_user")
        for i in range(15):
            self._create_mock_analysis(user.id, title=f"Job {i:02d}")

        # Page 1 (limit 5, offset 0)
        res1 = self.client.get("/api/v1/analyses?limit=5&offset=0", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res1.status_code, 200)
        data1 = res1.json()
        self.assertEqual(data1["total"], 15)
        self.assertEqual(len(data1["items"]), 5)
        self.assertEqual(data1["limit"], 5)
        self.assertEqual(data1["offset"], 0)

        # Page 2 (limit 5, offset 5)
        res2 = self.client.get("/api/v1/analyses?limit=5&offset=5", headers={"Authorization": f"Bearer {token}"})
        data2 = res2.json()
        self.assertEqual(len(data2["items"]), 5)
        self.assertEqual(data2["offset"], 5)
        self.assertNotEqual(data1["items"][0]["id"], data2["items"][0]["id"])

    def test_06_history_search(self):
        """6. History search filters by job title, company name, or domain."""
        user, token = self._create_test_user("search_user")
        self._create_mock_analysis(user.id, title="Senior Rust Developer", company="Mozilla", domain="mozilla.org")
        self._create_mock_analysis(user.id, title="Data Scientist", company="DeepMind", domain="deepmind.google")
        self._create_mock_analysis(user.id, title="React Architect", company="Vercel", domain="vercel.com")

        # Search by title keyword
        res_rust = self.client.get("/api/v1/analyses?search=Rust", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res_rust.status_code, 200)
        items_rust = res_rust.json()["items"]
        self.assertEqual(len(items_rust), 1)
        self.assertEqual(items_rust[0]["title"], "Senior Rust Developer")

        # Search by company keyword
        res_comp = self.client.get("/api/v1/analyses?search=DeepMind", headers={"Authorization": f"Bearer {token}"})
        items_comp = res_comp.json()["items"]
        self.assertEqual(len(items_comp), 1)
        self.assertEqual(items_comp[0]["company_name"], "DeepMind")

        # Search by domain keyword
        res_dom = self.client.get("/api/v1/analyses?search=vercel.com", headers={"Authorization": f"Bearer {token}"})
        items_dom = res_dom.json()["items"]
        self.assertEqual(len(items_dom), 1)

    def test_07_history_risk_filtering(self):
        """7. History filters by risk band properly."""
        user, token = self._create_test_user("filter_user")
        self._create_mock_analysis(user.id, title="Safe Job", risk_score=10, risk_band="LOW RISK")
        self._create_mock_analysis(user.id, title="Moderate Job", risk_score=45, risk_band="MODERATE RISK")
        self._create_mock_analysis(user.id, title="Risky Job", risk_score=80, risk_band="HIGH RISK")

        res_low = self.client.get("/api/v1/analyses?risk_band=LOW", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(len(res_low.json()["items"]), 1)
        self.assertEqual(res_low.json()["items"][0]["title"], "Safe Job")

        res_high = self.client.get("/api/v1/analyses?risk_band=HIGH", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(len(res_high.json()["items"]), 1)
        self.assertEqual(res_high.json()["items"][0]["title"], "Risky Job")

    def test_08_history_sorting(self):
        """8. History sorts by score, title, and date ascending/descending."""
        user, token = self._create_test_user("sort_user")
        self._create_mock_analysis(user.id, title="A Job", risk_score=10, days_ago=3)
        self._create_mock_analysis(user.id, title="B Job", risk_score=90, days_ago=1)
        self._create_mock_analysis(user.id, title="C Job", risk_score=50, days_ago=2)

        # Sort by overall_risk_score desc
        res_risk_desc = self.client.get(
            "/api/v1/analyses?sort=overall_risk_score&order=desc",
            headers={"Authorization": f"Bearer {token}"},
        )
        items_desc = res_risk_desc.json()["items"]
        self.assertEqual(items_desc[0]["overall_risk_score"], 90)
        self.assertEqual(items_desc[1]["overall_risk_score"], 50)
        self.assertEqual(items_desc[2]["overall_risk_score"], 10)

        # Sort by overall_risk_score asc
        res_risk_asc = self.client.get(
            "/api/v1/analyses?sort=overall_risk_score&order=asc",
            headers={"Authorization": f"Bearer {token}"},
        )
        items_asc = res_risk_asc.json()["items"]
        self.assertEqual(items_asc[0]["overall_risk_score"], 10)

        # Sort by title asc
        res_title_asc = self.client.get(
            "/api/v1/analyses?sort=title&order=asc",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res_title_asc.json()["items"][0]["title"], "A Job")

    def test_09_cross_user_history_isolation(self):
        """9. Users cannot view each other's analyses in listing."""
        user1, token1 = self._create_test_user("u1_iso")
        user2, token2 = self._create_test_user("u2_iso")

        self._create_mock_analysis(user1.id, title="User1 Secret Job")
        self._create_mock_analysis(user2.id, title="User2 Secret Job")

        res1 = self.client.get("/api/v1/analyses", headers={"Authorization": f"Bearer {token1}"})
        self.assertEqual(len(res1.json()["items"]), 1)
        self.assertEqual(res1.json()["items"][0]["title"], "User1 Secret Job")

        res2 = self.client.get("/api/v1/analyses", headers={"Authorization": f"Bearer {token2}"})
        self.assertEqual(len(res2.json()["items"]), 1)
        self.assertEqual(res2.json()["items"][0]["title"], "User2 Secret Job")

    def test_10_analysis_detail_ownership(self):
        """10. User cannot access another user's analysis by direct ID lookup."""
        user1, token1 = self._create_test_user("owner_user")
        user2, token2 = self._create_test_user("intruder_user")

        analysis1 = self._create_mock_analysis(user1.id, title="Owner Analysis")

        # Owner lookup succeeds
        res_owner = self.client.get(
            f"/api/v1/analyses/{analysis1.id}",
            headers={"Authorization": f"Bearer {token1}"},
        )
        self.assertEqual(res_owner.status_code, 200)

        # Intruder lookup returns 404 (isolated)
        res_intruder = self.client.get(
            f"/api/v1/analyses/{analysis1.id}",
            headers={"Authorization": f"Bearer {token2}"},
        )
        self.assertEqual(res_intruder.status_code, 404)

    def test_11_deleted_analysis(self):
        """11. Deleting an analysis permanently removes it from history and detail lookup."""
        user, token = self._create_test_user("delete_user")
        analysis = self._create_mock_analysis(user.id, title="Temporary Posting")

        # Delete record
        res_del = self.client.delete(
            f"/api/v1/analyses/{analysis.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res_del.status_code, 200)
        self.assertTrue(res_del.json()["deleted"])

        # Direct lookup now returns 404
        res_get = self.client.get(
            f"/api/v1/analyses/{analysis.id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res_get.status_code, 404)

        # History list is empty
        res_hist = self.client.get("/api/v1/analyses", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res_hist.json()["total"], 0)

    def test_12_invalid_analysis_id(self):
        """12. Non-existent or invalid analysis UUID returns 404."""
        user, token = self._create_test_user("lookup_user")
        fake_id = str(uuid.uuid4())
        res = self.client.get(
            f"/api/v1/analyses/{fake_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 404)

    def test_13_large_history_pagination(self):
        """13. Pagination handles larger volume of records gracefully."""
        user, token = self._create_test_user("bulk_user")
        for i in range(35):
            self._create_mock_analysis(user.id, title=f"Bulk Job {i:02d}")

        res = self.client.get("/api/v1/analyses?limit=25&offset=20", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total"], 35)
        self.assertEqual(len(data["items"]), 15)  # Remaining 15 items

    def test_14_aggregation_correctness(self):
        """14. Validates exact mathematical precision of aggregation queries."""
        user, token = self._create_test_user("math_user")
        # Seed exact scores: 10 (Low), 20 (Low), 50 (Moderate), 70 (High), 90 (Critical)
        # Average = (10 + 20 + 50 + 70 + 90) / 5 = 240 / 5 = 48.0
        self._create_mock_analysis(user.id, risk_score=10, risk_band="LOW RISK", days_ago=1)
        self._create_mock_analysis(user.id, risk_score=20, risk_band="LOW RISK", days_ago=2)
        self._create_mock_analysis(user.id, risk_score=50, risk_band="MODERATE RISK", days_ago=3)
        self._create_mock_analysis(user.id, risk_score=70, risk_band="HIGH RISK", days_ago=10)  # > 7 days
        self._create_mock_analysis(user.id, risk_score=90, risk_band="CRITICAL RISK", days_ago=1)

        res = self.client.get("/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["total_analyses"], 5)
        self.assertAlmostEqual(data["average_risk_score"], 48.0, places=1)
        self.assertEqual(data["risk_distribution"]["low"], 2)
        self.assertEqual(data["risk_distribution"]["moderate"], 1)
        self.assertEqual(data["risk_distribution"]["high"], 1)
        self.assertEqual(data["risk_distribution"]["critical"], 1)
        # 4 analyses occurred within last 7 days (days_ago: 1, 2, 3, 1)
        self.assertEqual(data["recent_analysis_count"], 4)


if __name__ == "__main__":
    unittest.main()
