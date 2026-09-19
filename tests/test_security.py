"""
AuthentiHire - Dedicated Security Hardening Test Suite (Phase 11)
================================================================
Comprehensive automated tests validating security mitigations:
- SSRF prevention & IP range validation (Loopback, RFC 1918, Link-local, Cloud Metadata, IPv6)
- Redirect chain traversal & stream bounds
- Authentication token tampering, expiration, and algorithm confusion
- IDOR access control & user data isolation
- Rate limiting on Auth and Analysis endpoints
- SQL Injection resilience in repository search and sort
- Pydantic schema field bounds and oversized payload rejection
- Defense-in-depth security response headers
"""

import unittest
import os
import sys
import uuid
import time
import jwt
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure project root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.company_intelligence import (
    is_safe_public_ip,
    validate_and_resolve_url,
    CompanyIntelligenceAnalyzer,
)
from src.auth.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    AUTH_SECRET_KEY,
    JWT_ALGORITHM,
)
from src.auth.rate_limiter import auth_rate_limiter, analysis_rate_limiter
from src.database.models import Base, User, Analysis
from src.database.repository import UserRepository, AnalysisRepository
from src.api import app
from src.database.connection import get_db


class TestSSRFAndNetworkHardening(unittest.TestCase):
    """Validates SSRF protections and safe network resolution."""

    def test_safe_ip_detection(self):
        """Tests that private, loopback, link-local, and cloud metadata IPs are blocked."""
        unsafe_ips = [
            "127.0.0.1",
            "127.0.0.254",
            "10.0.0.1",
            "10.255.255.255",
            "172.16.0.1",
            "172.31.255.255",
            "192.168.1.1",
            "192.168.0.254",
            "169.254.169.254",  # AWS/GCP/Azure IMDS
            "169.254.1.1",      # Link-local
            "0.0.0.0",
            "255.255.255.255",
            "::1",              # IPv6 loopback
            "fe80::1",          # IPv6 link-local
            "fc00::1",          # IPv6 unique local
            "fd12:3456:789a::1",
        ]
        for ip in unsafe_ips:
            with self.subTest(ip=ip):
                self.assertFalse(is_safe_public_ip(ip), f"IP {ip} should be rejected as unsafe!")

        safe_ips = [
            "8.8.8.8",
            "1.1.1.1",
            "142.250.190.46",  # Google
            "93.184.216.34",   # example.com
            "2606:4700:4700::1111", # Cloudflare DNS IPv6
        ]
        for ip in safe_ips:
            with self.subTest(ip=ip):
                self.assertTrue(is_safe_public_ip(ip), f"IP {ip} should be allowed as a safe public IP.")

    def test_url_validation_blocks_unsafe_targets(self):
        """Tests that validate_and_resolve_url rejects invalid schemes, loopback, and metadata URLs."""
        unsafe_urls = [
            "http://127.0.0.1",
            "http://127.0.0.1:8080/admin",
            "http://localhost:8000",
            "http://[::1]/",
            "http://169.254.169.254/latest/meta-data/",
            "http://10.0.0.5/internal",
            "http://192.168.1.1/router",
            "file:///etc/passwd",
            "ftp://example.com/file",
            "gopher://example.com",
            "javascript:alert(1)",
            "data:text/html,test",
        ]
        for url in unsafe_urls:
            with self.subTest(url=url):
                valid, host, ip = validate_and_resolve_url(url)
                self.assertFalse(valid, f"URL {url} should be blocked!")

    def test_check_ssl_tls_blocks_loopback(self):
        """Ensures check_ssl_tls refuses to connect to internal or loopback hosts."""
        engine = CompanyIntelligenceAnalyzer()
        res = engine.check_ssl_tls("127.0.0.1")
        self.assertFalse(res["certificate_valid"])
        self.assertIn("SSRF Blocked", res.get("error", ""))

    def test_check_website_availability_blocks_metadata(self):
        """Ensures check_website_availability blocks cloud metadata and loopback."""
        engine = CompanyIntelligenceAnalyzer()
        res = engine.check_website_availability("http://169.254.169.254/latest/meta-data/")
        self.assertFalse(res["reachable"])
        self.assertIn("SSRF Blocked", res.get("error", ""))


class TestAuthAndIDORSafety(unittest.TestCase):
    """Tests JWT authentication tampering, expiration, and IDOR isolation."""

    @classmethod
    def setUpClass(cls):
        # Create an isolated SQLite test engine
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        Base.metadata.create_all(bind=cls.engine)

        # Create two separate test users
        session = cls.SessionLocal()
        cls.user_a_id = str(uuid.uuid4())
        cls.user_a_email = "alice@company.com"
        cls.user_a = User(
            id=cls.user_a_id,
            email=cls.user_a_email,
            password_hash=hash_password("Password123!"),
            is_active=True,
        )
        cls.user_b_id = str(uuid.uuid4())
        cls.user_b_email = "bob@company.com"
        cls.user_b = User(
            id=cls.user_b_id,
            email=cls.user_b_email,
            password_hash=hash_password("Password123!"),
            is_active=True,
        )
        session.add(cls.user_a)
        session.add(cls.user_b)
        session.commit()

        # Add analysis records owned by Alice and Bob
        cls.rec_a_id = str(uuid.uuid4())
        cls.rec_a = Analysis(
            id=cls.rec_a_id,
            request_id=str(uuid.uuid4()),
            user_id=cls.user_a_id,
            session_id=str(uuid.uuid4()),
            title="Alice's Software Engineer Job",
            company_name="Acme Corp",
            fraud_probability=0.04,
            prediction_label="LEGITIMATE",
            decision_threshold=0.5,
            model_name="CalibratedEnsemble",
            overall_risk_score=15,
            risk_band="LOW RISK",
            status="CLEAR",
            components_json="{}",
            company_trust_score=85,
            consistency_rating="HIGH",
            rule_total_score=0,
            rule_count=0,
            rule_suspicion_level="LOW",
            reasons_json="[]",
            corroborations_json="[]",
            recommendations="Safe posting.",
            model_version="v1.0.0",
            risk_config_version="v1.0.0",
            api_version="1.0.0",
        )
        cls.rec_b_id = str(uuid.uuid4())
        cls.rec_b = Analysis(
            id=cls.rec_b_id,
            request_id=str(uuid.uuid4()),
            user_id=cls.user_b_id,
            session_id=str(uuid.uuid4()),
            title="Bob's Secret Job Analysis",
            company_name="Beta Corp",
            fraud_probability=0.88,
            prediction_label="FRAUDULENT",
            decision_threshold=0.5,
            model_name="CalibratedEnsemble",
            overall_risk_score=85,
            risk_band="HIGH RISK",
            status="HIGH_RISK",
            components_json="{}",
            company_trust_score=20,
            consistency_rating="LOW",
            rule_total_score=40,
            rule_count=2,
            rule_suspicion_level="HIGH",
            reasons_json="[]",
            corroborations_json="[]",
            recommendations="Do not apply.",
            model_version="v1.0.0",
            risk_config_version="v1.0.0",
            api_version="1.0.0",
        )
        session.add(cls.rec_a)
        session.add(cls.rec_b)
        session.commit()
        session.close()

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
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=cls.engine)

    def test_token_tampering_rejected(self):
        """Verifies tampered token signatures and algorithm manipulation are rejected."""
        valid_token = create_access_token(user_id=self.user_a_id, email=self.user_a_email)

        # 1. Tamper signature
        tampered_token = valid_token[:-6] + "xxxxxx"
        res = self.client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
        self.assertEqual(res.status_code, 401)

        # 2. Tamper payload algorithm to 'none'
        unsigned_token = jwt.encode({"sub": self.user_a_id, "email": self.user_a_email, "iat": int(time.time()), "exp": int(time.time() + 3600)}, "", algorithm="none")
        res2 = self.client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {unsigned_token}"})
        self.assertEqual(res2.status_code, 401)

    def test_expired_token_rejected(self):
        """Verifies expired JWT tokens return 401 Unauthorized."""
        expired_payload = {
            "sub": str(self.user_a_id),
            "email": self.user_a_email,
            "iat": int(time.time() - 7200),
            "exp": int(time.time() - 3600),
            "type": "access",
        }
        expired_token = jwt.encode(expired_payload, AUTH_SECRET_KEY, algorithm=JWT_ALGORITHM)
        res = self.client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        self.assertEqual(res.status_code, 401)

    def test_idor_protection_between_users(self):
        """Ensures User A cannot view or delete User B's historical analysis (IDOR isolation)."""
        token_a = create_access_token(user_id=self.user_a_id, email=self.user_a_email)
        token_b = create_access_token(user_id=self.user_b_id, email=self.user_b_email)

        # Alice attempts to access Bob's analysis record
        res = self.client.get(f"/api/v1/analyses/{self.rec_b_id}", headers={"Authorization": f"Bearer {token_a}"})
        self.assertEqual(res.status_code, 404, "Alice should receive 404 when accessing Bob's record")

        # Alice attempts to delete Bob's analysis record
        del_res = self.client.delete(f"/api/v1/analyses/{self.rec_b_id}", headers={"Authorization": f"Bearer {token_a}"})
        self.assertEqual(del_res.status_code, 404, "Alice should not be able to delete Bob's record")

        # Bob can view his own record
        bob_res = self.client.get(f"/api/v1/analyses/{self.rec_b_id}", headers={"Authorization": f"Bearer {token_b}"})
        self.assertEqual(bob_res.status_code, 200)
        self.assertEqual(bob_res.json()["analysis_id"], self.rec_b_id)
        self.assertEqual(bob_res.json()["risk"]["risk_band"], "HIGH RISK")


class TestRateLimitingAndAbusePrevention(unittest.TestCase):
    """Tests rate limiters on registration, login, and analysis."""

    def setUp(self):
        auth_rate_limiter.reset()
        analysis_rate_limiter.reset()

    def test_auth_rate_limiter_triggers_429(self):
        """Tests that exceeding max attempts returns 429 Too Many Requests."""
        client_ip = "198.51.100.25"
        for _ in range(15):
            allowed, _ = auth_rate_limiter.is_allowed(client_ip, "login", max_requests=15, window_seconds=60)
            self.assertTrue(allowed)

        # 16th attempt should be blocked
        allowed, retry_after = auth_rate_limiter.is_allowed(client_ip, "login", max_requests=15, window_seconds=60)
        self.assertFalse(allowed)
        self.assertGreater(retry_after, 0)

    def test_analysis_rate_limiter_triggers_429(self):
        """Tests that exceeding max analysis attempts triggers rate limiting."""
        client_ip = "203.0.113.50"
        for _ in range(60):
            allowed, _ = analysis_rate_limiter.is_allowed(client_ip, "analyze", max_requests=60, window_seconds=60)
            self.assertTrue(allowed)

        # 61st attempt blocked
        allowed, retry_after = analysis_rate_limiter.is_allowed(client_ip, "analyze", max_requests=60, window_seconds=60)
        self.assertFalse(allowed)
        self.assertGreater(retry_after, 0)


class TestSQLInjectionResilience(unittest.TestCase):
    """Tests database repository against malicious SQL injection strings."""

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        Base.metadata.create_all(bind=cls.engine)

        session = cls.SessionLocal()
        cls.user_id = str(uuid.uuid4())
        cls.user = User(
            id=cls.user_id,
            email="security@company.com",
            password_hash=hash_password("Pass12345!"),
            is_active=True,
        )
        session.add(cls.user)
        session.commit()
        session.close()

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=cls.engine)

    def test_search_and_sort_sqli_resilience(self):
        """Ensures SQL injection payloads in search or sort do not corrupt queries or throw syntax errors."""
        session = self.SessionLocal()
        try:
            sqli_payloads = [
                "' OR 1=1 --",
                "'; DROP TABLE users; --",
                "' UNION SELECT id, email, password_hash, 1, 1, 1, 1, 1, 1, 1, 1, 1 FROM users --",
                "admin' --",
                "1' OR '1'='1",
                "nonexistent') OR 1=1#",
            ]
            for payload in sqli_payloads:
                with self.subTest(payload=payload):
                    # Test search filtering
                    records, total = AnalysisRepository.list_analyses(
                        db=session,
                        user_id=self.user_id,
                        search=payload,
                        sort="created_at",
                        order="desc",
                    )
                    self.assertIsInstance(records, list)
                    self.assertIsInstance(total, int)

            # Test invalid sort column injection
            invalid_sorts = [
                "created_at; DROP TABLE analyses;--",
                "password_hash",
                "id UNION SELECT NULL",
            ]
            for sort_col in invalid_sorts:
                with self.subTest(sort_col=sort_col):
                    records, total = AnalysisRepository.list_analyses(
                        db=session,
                        user_id=self.user_id,
                        sort=sort_col,
                        order="asc",
                    )
                    self.assertIsInstance(records, list)
        finally:
            session.close()


class TestSchemaBoundsAndHeaders(unittest.TestCase):
    """Tests Pydantic input bounds and HTTP defense-in-depth headers."""

    def test_oversized_payload_rejected(self):
        """Ensures payloads exceeding character limits return 422 Unprocessable Entity."""
        client = TestClient(app)

        # Title exceeding 255 chars
        huge_title = "A" * 300
        res = client.post("/api/v1/analyze", json={"title": huge_title, "description": "Short description"})
        self.assertEqual(res.status_code, 422)
        self.assertIn("error", res.json())

        # Description exceeding 100,000 chars
        huge_desc = "D" * 105000
        res2 = client.post("/api/v1/analyze", json={"title": "Dev Role", "description": huge_desc})
        self.assertEqual(res2.status_code, 422)

    def test_defense_in_depth_headers_present(self):
        """Verifies security headers (X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy)."""
        client = TestClient(app)
        res = client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)

        headers = res.headers
        self.assertEqual(headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(headers.get("Referrer-Policy"), "strict-origin-when-cross-origin")
        self.assertIn("geolocation=()", headers.get("Permissions-Policy", ""))
        self.assertIn("default-src 'self'", headers.get("Content-Security-Policy", ""))


class TestAuthValidationBoundaries(unittest.TestCase):
    """Tests password complexity policies, email normalization, and session isolation."""

    def test_email_normalization(self):
        """Ensures email normalization trims spaces and downcases addresses."""
        from src.auth.security import normalize_email
        self.assertEqual(normalize_email("  Alice.Smith@Example.COM "), "alice.smith@example.com")
        self.assertEqual(normalize_email("Bob+Filter@Sub.Domain.ORG"), "bob+filter@sub.domain.org")

    def test_password_policy_enforcement(self):
        """Ensures passwords fail length and whitespace policy validation with helpful errors."""
        from src.auth.security import validate_password_policy
        # Empty
        valid, msg = validate_password_policy("")
        self.assertFalse(valid)
        # Whitespace only
        valid, msg = validate_password_policy("        ")
        self.assertFalse(valid)
        # Too short (< 8)
        valid, msg = validate_password_policy("Ab1!")
        self.assertFalse(valid)
        # Too long (> 128)
        valid, msg = validate_password_policy("A" * 129)
        self.assertFalse(valid)
        # Valid password (>= 8 chars)
        valid, msg = validate_password_policy("ValidSecurePass123!")
        self.assertTrue(valid)
        self.assertIsNone(msg)

    def test_redis_rate_limiter_memory_fallback(self):
        """Ensures RedisRateLimiter operates via in-memory fallback when redis server is absent."""
        from src.auth.rate_limiter import RedisRateLimiter
        limiter = RedisRateLimiter(redis_url="redis://localhost:9999/0")
        client_id = "test-fallback-ip"
        allowed, _ = limiter.is_allowed(client_id, "test_action", max_requests=2, window_seconds=60)
        self.assertTrue(allowed)
        allowed, _ = limiter.is_allowed(client_id, "test_action", max_requests=2, window_seconds=60)
        self.assertTrue(allowed)
        allowed, retry = limiter.is_allowed(client_id, "test_action", max_requests=2, window_seconds=60)
        self.assertFalse(allowed)
        self.assertGreater(retry, 0)


if __name__ == "__main__":
    unittest.main()
