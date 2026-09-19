"""
AuthentiHire - Authentication & Authorization Unit & Integration Tests
======================================================================
Tests covering Argon2id hashing, email normalization, password validation,
JWT generation/verification, registration, login, logout, current user profile,
protected analyses, cross-user isolation, rate limiting, and anonymous compatibility.
"""

import os
import sys
import unittest
import uuid
import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import jwt

# Ensure project root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.database.models import Base, User, Analysis
from src.database.connection import get_db
from src.database.repository import UserRepository, AnalysisRepository
from src.auth.security import (
    hash_password,
    verify_password,
    normalize_email,
    validate_password_policy,
    create_access_token,
    decode_access_token,
    AUTH_SECRET_KEY,
)
from src.auth.rate_limiter import auth_rate_limiter
from src.api import app


class TestAuthenticationAndAuthorization(unittest.TestCase):
    """Test suite for user authentication, password security, and access control."""

    @classmethod
    def setUpClass(cls):
        # Configure in-memory isolated SQLite database for auth testing
        cls.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        cls.TestingSessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=cls.engine,
            expire_on_commit=False,
        )

        def override_get_db():
            db = cls.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def setUp(self):
        # Fresh tables per test
        Base.metadata.drop_all(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        auth_rate_limiter.reset()
        if hasattr(self.client, "cookies"):
            self.client.cookies.clear()

    def tearDown(self):
        Base.metadata.drop_all(bind=self.engine)
        auth_rate_limiter.reset()
        if hasattr(self.client, "cookies"):
            self.client.cookies.clear()

    # --------------------------------------------------------------------------
    # 1. Registration
    # --------------------------------------------------------------------------
    def test_01_user_registration(self):
        """Verify successful registration returns user info, token, and sets HttpOnly cookie."""
        res = self.client.post(
            "/api/v1/auth/register",
            json={"email": "alice@example.com", "password": "SecurePassword123!"},
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], "alice@example.com")
        self.assertIn("id", data["user"])
        self.assertTrue(data["user"]["is_active"])
        self.assertIn("token", data)
        self.assertNotIn("password", data["user"])
        self.assertNotIn("password_hash", data["user"])
        # Check cookie
        self.assertIn("authentihire_token", res.cookies)

    # --------------------------------------------------------------------------
    # 2. Duplicate Registration
    # --------------------------------------------------------------------------
    def test_02_duplicate_registration(self):
        """Verify duplicate registration fails with 400."""
        self.client.post(
            "/api/v1/auth/register",
            json={"email": "alice@example.com", "password": "SecurePassword123!"},
        )
        res = self.client.post(
            "/api/v1/auth/register",
            json={"email": "alice@example.com", "password": "AnotherPassword456!"},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("already exists", res.json()["error"]["message"])

    # --------------------------------------------------------------------------
    # 3. Password Hashing & Verification
    # --------------------------------------------------------------------------
    def test_03_password_hashing(self):
        """Verify Argon2id generates valid secure hash and verifies correctly."""
        pwd = "MySecretPassword2026"
        hashed = hash_password(pwd)
        self.assertTrue(hashed.startswith("$argon2id$"))
        self.assertTrue(verify_password(pwd, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

    def test_04_password_verification(self):
        """Verify password verification returns False on malformed/empty input."""
        self.assertFalse(verify_password("", "some_hash"))
        self.assertFalse(verify_password("password", ""))
        self.assertFalse(verify_password("password", "invalid_hash_string"))

    # --------------------------------------------------------------------------
    # 4. Login
    # --------------------------------------------------------------------------
    def test_05_login_success(self):
        """Verify login with correct credentials succeeds and returns JWT."""
        self.client.post(
            "/api/v1/auth/register",
            json={"email": "bob@example.com", "password": "ValidPassword999!"},
        )
        res = self.client.post(
            "/api/v1/auth/login",
            json={"email": "bob@example.com", "password": "ValidPassword999!"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["email"], "bob@example.com")
        self.assertIsNotNone(data["token"])

    def test_06_invalid_login_password(self):
        """Verify login with wrong password returns 401 with generic non-enumerating message."""
        self.client.post(
            "/api/v1/auth/register",
            json={"email": "bob@example.com", "password": "ValidPassword999!"},
        )
        res = self.client.post(
            "/api/v1/auth/login",
            json={"email": "bob@example.com", "password": "WrongPassword999!"},
        )
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.json()["error"]["message"], "Invalid email or password.")

    def test_07_invalid_login_nonexistent_email(self):
        """Verify login with non-existent email returns exact same 401 message."""
        res = self.client.post(
            "/api/v1/auth/login",
            json={"email": "nonexistent@example.com", "password": "SomePassword123!"},
        )
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.json()["error"]["message"], "Invalid email or password.")

    # --------------------------------------------------------------------------
    # 5. Logout
    # --------------------------------------------------------------------------
    def test_08_logout(self):
        """Verify logout endpoint clears session cookie."""
        res = self.client.post("/api/v1/auth/logout")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["message"], "Successfully logged out.")

    # --------------------------------------------------------------------------
    # 6. Current User Profile
    # --------------------------------------------------------------------------
    def test_09_current_user_me_authenticated(self):
        """Verify /auth/me returns current user profile when authenticated."""
        reg_res = self.client.post(
            "/api/v1/auth/register",
            json={"email": "carol@example.com", "password": "CarolPassword123!"},
        )
        token = reg_res.json()["token"]

        res = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["email"], "carol@example.com")

    def test_10_current_user_me_unauthenticated(self):
        """Verify /auth/me returns 401 without authentication."""
        res = self.client.get("/api/v1/auth/me")
        self.assertEqual(res.status_code, 401)

    # --------------------------------------------------------------------------
    # 7. User-Owned Analyses & Cross-User Isolation
    # --------------------------------------------------------------------------
    def test_11_user_owned_analysis(self):
        """Verify analyses posted by authenticated user are linked to user_id."""
        reg_res = self.client.post(
            "/api/v1/auth/register",
            json={"email": "dan@example.com", "password": "DanPassword123!"},
        )
        token = reg_res.json()["token"]
        user_id = reg_res.json()["user"]["id"]

        analysis_res = self.client.post(
            "/api/v1/analyze",
            json={
                "title": "Software Engineer",
                "description": "Legitimate job description for building backend APIs.",
                "company_name": "Tech Corp",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(analysis_res.status_code, 200)
        analysis_id = analysis_res.json()["analysis_id"]

        # Check in DB
        db = self.TestingSessionLocal()
        record = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        self.assertIsNotNone(record)
        self.assertEqual(record.user_id, user_id)
        db.close()

    def test_12_cross_user_analysis_access_denied(self):
        """Verify User B cannot access User A's analysis (returns 404)."""
        # User A creates analysis
        user_a_res = self.client.post(
            "/api/v1/auth/register",
            json={"email": "usera@example.com", "password": "UserAPassword123!"},
        )
        token_a = user_a_res.json()["token"]

        analysis_res = self.client.post(
            "/api/v1/analyze",
            json={"title": "Dev", "description": "Job for User A"},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        analysis_id = analysis_res.json()["analysis_id"]

        # User B logs in
        user_b_res = self.client.post(
            "/api/v1/auth/register",
            json={"email": "userb@example.com", "password": "UserBPassword123!"},
        )
        token_b = user_b_res.json()["token"]

        # User B attempts to get User A's analysis
        get_res = self.client.get(
            f"/api/v1/analyses/{analysis_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        self.assertEqual(get_res.status_code, 404)

    def test_13_cross_user_deletion_denied(self):
        """Verify User B cannot delete User A's analysis (returns 404)."""
        user_a_res = self.client.post(
            "/api/v1/auth/register",
            json={"email": "usera2@example.com", "password": "UserAPassword123!"},
        )
        token_a = user_a_res.json()["token"]
        analysis_res = self.client.post(
            "/api/v1/analyze",
            json={"title": "Dev", "description": "Job for User A2"},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        analysis_id = analysis_res.json()["analysis_id"]

        user_b_res = self.client.post(
            "/api/v1/auth/register",
            json={"email": "userb2@example.com", "password": "UserBPassword123!"},
        )
        token_b = user_b_res.json()["token"]

        # User B attempts to delete
        del_res = self.client.delete(
            f"/api/v1/analyses/{analysis_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        self.assertEqual(del_res.status_code, 404)

        # Confirm analysis still exists for User A
        db = self.TestingSessionLocal()
        record = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        self.assertIsNotNone(record)
        db.close()

    # --------------------------------------------------------------------------
    # 8. Inactive / Expired / Malformed Tokens
    # --------------------------------------------------------------------------
    def test_14_inactive_user_denied(self):
        """Verify inactive user cannot access protected endpoints."""
        db = self.TestingSessionLocal()
        pwd_hash = hash_password("InactivePass123!")
        inactive_user = User(
            id=str(uuid.uuid4()),
            email="inactive@example.com",
            password_hash=pwd_hash,
            is_active=False,
        )
        db.add(inactive_user)
        db.commit()
        token = create_access_token(inactive_user.id, inactive_user.email)
        db.close()

        res = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 403)

    def test_15_expired_authentication_denied(self):
        """Verify expired JWT token returns 401."""
        expired_token = create_access_token(
            user_id="user_123",
            email="expired@example.com",
            expires_delta=datetime.timedelta(seconds=-10),
        )
        res = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        self.assertEqual(res.status_code, 401)
        self.assertIn("expired", res.json()["error"]["message"].lower())

    def test_16_malformed_credentials(self):
        """Verify forged or malformed JWT returns 401."""
        res = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid.jwt.signature"},
        )
        self.assertEqual(res.status_code, 401)

    # --------------------------------------------------------------------------
    # 9. Email Normalization & Password Policy
    # --------------------------------------------------------------------------
    def test_17_email_normalization(self):
        """Verify email normalization handles whitespace and mixed case."""
        raw = "  John.DOE+test@Example.COM  "
        normalized = normalize_email(raw)
        self.assertEqual(normalized, "john.doe+test@example.com")

        with self.assertRaises(ValueError):
            normalize_email("not-an-email")

    def test_18_password_validation(self):
        """Verify password validation rejects short or whitespace-only passwords."""
        valid, msg = validate_password_policy("short")
        self.assertFalse(valid)
        self.assertIn("at least 8 characters", msg)

        valid, msg = validate_password_policy("        ")
        self.assertFalse(valid)

        valid, msg = validate_password_policy("ValidPassword123")
        self.assertTrue(valid)

    # --------------------------------------------------------------------------
    # 10. Cookie Handling & Anonymous Compatibility
    # --------------------------------------------------------------------------
    def test_19_session_cookie_handling(self):
        """Verify client can authenticate via HttpOnly cookie without Bearer header."""
        reg_res = self.client.post(
            "/api/v1/auth/register",
            json={"email": "cookieuser@example.com", "password": "CookiePassword123!"},
        )
        token = reg_res.json()["token"]

        # Call /api/v1/auth/me passing cookie
        res = self.client.get("/api/v1/auth/me", cookies={"authentihire_token": token})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["email"], "cookieuser@example.com")

    def test_20_anonymous_compatibility(self):
        """Verify unauthenticated requests continue to function with X-Session-ID."""
        session_id = "anon_session_xyz789"
        analysis_res = self.client.post(
            "/api/v1/analyze",
            json={"title": "Intern", "description": "Anonymous analysis posting."},
            headers={"X-Session-ID": session_id},
        )
        self.assertEqual(analysis_res.status_code, 200)
        analysis_id = analysis_res.json()["analysis_id"]

        # Retrieve anonymously
        get_res = self.client.get(
            f"/api/v1/analyses/{analysis_id}",
            headers={"X-Session-ID": session_id},
        )
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["analysis_id"], analysis_id)


if __name__ == "__main__":
    unittest.main()
