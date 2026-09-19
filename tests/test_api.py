"""
AuthentiHire - Unit & Integration Tests for Backend API & Persistence
======================================================================
Tests verify FastAPI routes (/health, /model-info, /analyze, /analyses),
input validation, schema compliance, error handlers, UUID generation,
session-scoped ownership, pagination, and persistence reproducibility
under 100% offline conditions.
"""

import unittest
import uuid
import json
from fastapi.testclient import TestClient

from src.api import app
from src.api_service import API_VERSION


class TestAuthentiHireAPI(unittest.TestCase):
    """Test suite for AuthentiHire REST API endpoints."""

    @classmethod
    def setUpClass(cls):
        from src.database.connection import init_db
        app.dependency_overrides.clear()
        init_db()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def setUp(self):
        if hasattr(self.client, "cookies"):
            self.client.cookies.clear()

    # 1. Health Endpoint
    def test_01_health_endpoint(self):
        resp = self.client.get("/api/v1/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["service"], "AuthentiHire API")
        self.assertEqual(data["version"], API_VERSION)
        self.assertTrue(data["models_loaded"])
        self.assertIn("timestamp", data)

    # 2. Model Info Endpoint
    def test_02_model_info_endpoint(self):
        resp = self.client.get("/api/v1/model-info")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("model_name", data)
        self.assertIn("weights", data)
        self.assertEqual(data["weights"]["ml_weight"], 0.50)
        self.assertEqual(data["weights"]["rule_weight"], 0.30)
        self.assertEqual(data["weights"]["company_weight"], 0.20)
        self.assertEqual(data["operating_threshold"], 25.0)
        self.assertIn("LOW_RISK", data["risk_bands"])
        self.assertIn("CRITICAL_RISK", data["risk_bands"])

    # 3. Valid Full Analysis Request (Legitimate Posting)
    def test_03_valid_legitimate_posting(self):
        payload = {
            "title": "Senior Distributed Systems Engineer",
            "company_name": "Stripe Inc.",
            "company_profile": "Stripe builds economic infrastructure for the internet.",
            "description": "We are seeking a senior engineer to design distributed high-throughput transaction systems.",
            "requirements": "5+ years backend development with Go, Java, or Python.",
            "benefits": "Competitive salary, 401(k), healthcare.",
            "recruiter_email": "jobs@stripe.com",
            "url": "https://stripe.com",
            "telecommuting": True,
            "has_company_logo": True,
            "has_questions": True,
        }

        resp = self.client.post("/api/v1/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        # Schema & field checks
        self.assertIn("request_id", data)
        self.assertIn("analysis_id", data)
        self.assertIn("session_id", data)
        self.assertIn("prediction", data)
        self.assertIn("risk", data)
        self.assertIn("company", data)
        self.assertIn("rules", data)
        self.assertIn("reasons", data)
        self.assertIn("recommendations", data)
        self.assertIn("metadata", data)

        # Value checks
        self.assertLess(data["risk"]["overall_score"], 25)
        self.assertEqual(data["risk"]["risk_band"], "LOW RISK")
        self.assertEqual(data["prediction"]["prediction"], "LEGITIMATE")
        self.assertGreaterEqual(data["company"]["trust_score"], 70)
        self.assertEqual(data["company"]["company_name"], "Stripe Inc.")

    # 4. Minimal Valid Posting (Only Title and Description)
    def test_04_minimal_valid_posting(self):
        payload = {
            "title": "Software Developer",
            "description": "Looking for a fullstack developer with React and Node.js experience.",
        }

        resp = self.client.post("/api/v1/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("request_id", data)
        self.assertIn("analysis_id", data)
        self.assertGreaterEqual(data["risk"]["overall_score"], 0)
        self.assertLessEqual(data["risk"]["overall_score"], 100)

    # 5. Missing Optional Fields (Handled Gracefully)
    def test_05_missing_optional_fields(self):
        payload = {
            "description": "Standard office clerical position assisting with scheduling.",
        }

        resp = self.client.post("/api/v1/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsNone(data["company"]["company_name"])

    # 6. Malformed JSON / Invalid Type -> 422
    def test_06_malformed_input_rejected_with_422(self):
        resp = self.client.post(
            "/api/v1/analyze",
            content="This is not valid json at all",
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(resp.status_code, 422)
        data = resp.json()
        self.assertIn("error", data)
        self.assertEqual(data["error"]["code"], "VALIDATION_ERROR")

    # 7. Invalid Boolean Field -> 422
    def test_07_invalid_boolean_field(self):
        payload = {
            "title": "Analyst",
            "description": "Valid job description.",
            "telecommuting": "definitely_not_a_boolean",
        }

        resp = self.client.post("/api/v1/analyze", json=payload)
        self.assertEqual(resp.status_code, 422)
        data = resp.json()
        self.assertEqual(data["error"]["code"], "VALIDATION_ERROR")

    # 8. Empty Text Fields -> Handles gracefully with structured assessment
    def test_08_empty_text_fields(self):
        payload = {
            "title": "",
            "description": "",
        }

        resp = self.client.post("/api/v1/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn(data["risk"]["status"], ["REVIEW_RECOMMENDED", "INSUFFICIENT_EVIDENCE", "LOW_RISK"])
        self.assertGreaterEqual(data["risk"]["overall_score"], 0)
        self.assertIn(data["risk"]["risk_band"], ["LOW RISK", "MODERATE RISK"])

    # 9. Request ID Generation (Valid UUID4)
    def test_09_unique_request_id_generation(self):
        payload1 = {"title": "Job 1", "description": "Description 1"}
        payload2 = {"title": "Job 2", "description": "Description 2"}

        resp1 = self.client.post("/api/v1/analyze", json=payload1)
        resp2 = self.client.post("/api/v1/analyze", json=payload2)

        id1 = resp1.json()["request_id"]
        id2 = resp2.json()["request_id"]

        self.assertNotEqual(id1, id2)
        uuid.UUID(id1, version=4)
        uuid.UUID(id2, version=4)

    # 10. Risk Score and Probability Ranges
    def test_10_score_and_probability_ranges(self):
        payload = {
            "title": "Technical Writer",
            "description": "Document software APIs and user guides.",
        }

        resp = self.client.post("/api/v1/analyze", json=payload)
        data = resp.json()

        score = data["risk"]["overall_score"]
        prob = data["prediction"]["fraud_probability"]
        trust = data["company"]["trust_score"]

        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)
        self.assertGreaterEqual(prob, 0.0)
        self.assertLessEqual(prob, 1.0)
        self.assertGreaterEqual(trust, 1)
        self.assertLessEqual(trust, 100)

    # 11. Risk Band Validity
    def test_11_valid_risk_band_returned(self):
        valid_bands = {"LOW RISK", "MODERATE RISK", "HIGH RISK", "CRITICAL RISK"}
        payload = {"title": "Support Specialist", "description": "Customer support representative."}
        resp = self.client.post("/api/v1/analyze", json=payload)
        self.assertIn(resp.json()["risk"]["risk_band"], valid_bands)

    # 12. 404 Error Handling for Unknown Endpoints
    def test_12_unknown_endpoint_returns_404(self):
        resp = self.client.get("/api/v1/nonexistent-endpoint")
        self.assertEqual(resp.status_code, 404)
        data = resp.json()
        self.assertIn("error", data)

    # 13. Realistic Suspicious Scam Posting Analysis
    def test_13_realistic_suspicious_scam_posting(self):
        payload = {
            "title": "Remote Data Entry Clerk ($45/hr) - Immediate Onboarding",
            "description": "Urgent opening! Earn $45/hr working from home. Please pay a registration fee of $80 via Western Union before starting. Contact fastjobs@gmail.com.",
            "recruiter_email": "fastjobs@gmail.com",
            "has_company_logo": False,
            "has_questions": False,
        }

        resp = self.client.post("/api/v1/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        self.assertGreaterEqual(data["risk"]["overall_score"], 50)
        self.assertIn(data["risk"]["risk_band"], ["HIGH RISK", "CRITICAL RISK"])
        self.assertTrue(len(data["rules"]["triggered_rules"]) > 0)
        self.assertTrue(any("gmail.com" in s["evidence"] for s in data["company"]["signals"]))
        self.assertIn("payment", data["recommendations"].lower())

    # 14. Repeated Requests (Model Reuse Efficiency)
    def test_14_repeated_requests_model_reuse(self):
        payload = {"title": "DevOps Engineer", "description": "Manage Kubernetes clusters."}
        for _ in range(5):
            resp = self.client.post("/api/v1/analyze", json=payload)
            self.assertEqual(resp.status_code, 200)

    # 15. OpenAPI Documentation Endpoints
    def test_15_openapi_documentation(self):
        docs_resp = self.client.get("/docs")
        self.assertEqual(docs_resp.status_code, 200)
        openapi_resp = self.client.get("/openapi.json")
        self.assertEqual(openapi_resp.status_code, 200)
        openapi_data = openapi_resp.json()
        self.assertIn("/api/v1/analyze", openapi_data["paths"])
        self.assertIn("/api/v1/health", openapi_data["paths"])
        self.assertIn("/api/v1/model-info", openapi_data["paths"])
        self.assertIn("/api/v1/analyses", openapi_data["paths"])
        self.assertIn("/api/v1/analyses/{analysis_id}", openapi_data["paths"])

    # --------------------------------------------------------------------------
    # PHASE 8 PERSISTENCE TESTS
    # --------------------------------------------------------------------------

    # 16. Analyze Persists and Returns analysis_id with custom Session Header
    def test_16_analyze_persists_and_returns_analysis_id(self):
        my_session = "sess_custom_test_user_001"
        payload = {
            "title": "Cloud Solutions Architect",
            "company_name": "Acme Cloud Corp",
            "description": "Architect scalable enterprise cloud infrastructures on AWS and GCP.",
        }

        resp = self.client.post(
            "/api/v1/analyze",
            json=payload,
            headers={"X-Session-ID": my_session},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsNotNone(data.get("analysis_id"))
        self.assertEqual(data.get("session_id"), my_session)
        analysis_id = data["analysis_id"]

        # Retrieve saved analysis via GET endpoint
        get_resp = self.client.get(
            f"/api/v1/analyses/{analysis_id}",
            headers={"X-Session-ID": my_session},
        )
        self.assertEqual(get_resp.status_code, 200)
        saved_data = get_resp.json()
        self.assertEqual(saved_data["analysis_id"], analysis_id)
        self.assertEqual(saved_data["company"]["company_name"], "Acme Cloud Corp")
        self.assertEqual(saved_data["risk"]["overall_score"], data["risk"]["overall_score"])

    # 17. Cross-Session Access Isolation (404)
    def test_17_cross_session_access_isolation(self):
        owner_session = "sess_owner_123"
        other_session = "sess_other_456"

        payload = {"title": "Data Analyst", "description": "SQL and Tableau visualization role."}
        post_resp = self.client.post(
            "/api/v1/analyze",
            json=payload,
            headers={"X-Session-ID": owner_session},
        )
        analysis_id = post_resp.json()["analysis_id"]

        # Different session attempts retrieval -> 404
        other_resp = self.client.get(
            f"/api/v1/analyses/{analysis_id}",
            headers={"X-Session-ID": other_session},
        )
        self.assertEqual(other_resp.status_code, 404)

        # Missing session header -> 400
        no_sess_resp = self.client.get(f"/api/v1/analyses/{analysis_id}")
        self.assertEqual(no_sess_resp.status_code, 400)

    # 18. Paginated Analysis History Listing
    def test_18_paginated_history_listing(self):
        session_id = f"sess_history_{uuid.uuid4().hex[:8]}"

        for i in range(3):
            self.client.post(
                "/api/v1/analyze",
                json={"title": f"Position #{i+1}", "description": f"Role description {i+1}"},
                headers={"X-Session-ID": session_id},
            )

        # Fetch history
        list_resp = self.client.get(
            "/api/v1/analyses?limit=2&offset=0",
            headers={"X-Session-ID": session_id},
        )
        self.assertEqual(list_resp.status_code, 200)
        hist_data = list_resp.json()
        self.assertEqual(hist_data["total"], 3)
        self.assertEqual(len(hist_data["items"]), 2)
        self.assertEqual(hist_data["limit"], 2)
        self.assertEqual(hist_data["offset"], 0)

        # Fetch offset page
        page2_resp = self.client.get(
            "/api/v1/analyses?limit=2&offset=2",
            headers={"X-Session-ID": session_id},
        )
        self.assertEqual(page2_resp.status_code, 200)
        page2_data = page2_resp.json()
        self.assertEqual(len(page2_data["items"]), 1)

    # 19. Delete Analysis by Owner & Non-Owner Rejection
    def test_19_delete_analysis_lifecycle(self):
        owner_session = f"sess_del_owner_{uuid.uuid4().hex[:8]}"
        attacker_session = f"sess_del_attacker_{uuid.uuid4().hex[:8]}"

        payload = {"title": "Security Lead", "description": "Lead incident response and audits."}
        post_resp = self.client.post(
            "/api/v1/analyze",
            json=payload,
            headers={"X-Session-ID": owner_session},
        )
        analysis_id = post_resp.json()["analysis_id"]

        # Attacker cannot delete -> 404
        bad_del = self.client.delete(
            f"/api/v1/analyses/{analysis_id}",
            headers={"X-Session-ID": attacker_session},
        )
        self.assertEqual(bad_del.status_code, 404)

        # Owner deletes -> 200
        good_del = self.client.delete(
            f"/api/v1/analyses/{analysis_id}",
            headers={"X-Session-ID": owner_session},
        )
        self.assertEqual(good_del.status_code, 200)
        self.assertTrue(good_del.json()["deleted"])

        # Fetch after delete -> 404
        fetch_after = self.client.get(
            f"/api/v1/analyses/{analysis_id}",
            headers={"X-Session-ID": owner_session},
        )
        self.assertEqual(fetch_after.status_code, 404)

    # 20. Pagination Query Parameters Validation
    def test_20_pagination_query_validation(self):
        session_id = "sess_val_test"

        # Limit > 100 -> 422
        resp_bad_limit = self.client.get(
            "/api/v1/analyses?limit=101",
            headers={"X-Session-ID": session_id},
        )
        self.assertEqual(resp_bad_limit.status_code, 422)

        # Offset < 0 -> 422
        resp_bad_offset = self.client.get(
            "/api/v1/analyses?offset=-1",
            headers={"X-Session-ID": session_id},
        )
        self.assertEqual(resp_bad_offset.status_code, 422)


if __name__ == "__main__":
    unittest.main()
