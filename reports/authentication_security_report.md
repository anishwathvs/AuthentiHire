# AuthentiHire — Authentication & Security Architecture Report

**Phase 9 Deliverable**  
*Timestamp: September 19, 2026*  
*Status: Approved & Verified*

---

## 1. Executive Summary

Phase 9 introduces a secure, multi-layered user authentication and account ownership system for AuthentiHire. This transition shifts the platform from anonymous session tracking (`X-Session-ID`) to authenticated user accounts while strictly maintaining complete independence from the fraud classification, machine learning probability calibration, heuristic scam rule engine, and company verification pipelines.

```
┌─────────────────────────────────────────────────────────┐
│                    AUTHENTIHIRE                         │
├─────────────────────────────────────────────────────────┤
│  Authentication Layer (Argon2id + JWT + HttpOnly)       │
│                             │                           │
│                             ▼                           │
│  Authorization & Isolation Layer (User-scoped DB Model) │
│                             │                           │
│                             ▼                           │
│  API Service Layer (FastAPI REST Endpoints)             │
│                             │                           │
│                             ▼                           │
│  Unified Risk Engine (ML + Heuristics + Intelligence)   │
│                             │                           │
│                             ▼                           │
│  Persistence Layer (PostgreSQL / SQLite + Alembic 002)  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Architecture & Security Controls

### A. User Database Schema & Identification
- **User Identifier**: Non-sequential, collision-resistant UUIDv4 primary keys (`String(36)`).
- **Email Normalization**: Strict lowercase conversion, whitespace trimming, and RFC standard regex verification to prevent duplicate account confusion or enumeration collisions.
- **Index Optimization**: `ix_users_email` (unique index), `ix_users_id`, `ix_users_created_at`.
- **Relational Integrity**: Foreign key `analyses.user_id` referencing `users.id` with `ondelete="CASCADE"`. Deleting a user account cleans up all attached analyses, rule evidence, and company verification records.

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### B. Password Hashing (Argon2id)
- **Algorithm**: **Argon2id** (the OWASP and IETF recommended password hashing function resistant to GPU/ASIC brute-force and side-channel timing attacks).
- **Parameters**:
  - `time_cost = 2`
  - `memory_cost = 65,536 KiB` (64 MB)
  - `parallelism = 4`
  - `hash_len = 32`
  - `salt_len = 16`
- **Compatibility**: Supports legacy `bcrypt` verification fallback if hashes begin with `$2a$`, `$2b$`, or `$2y$`.
- **Validation Policy**:
  - Minimum length: 8 characters
  - Maximum length: 128 characters (mitigates hashing denial-of-service)
  - Whitespace-only passwords strictly rejected.

### C. Token & Session Management
- **Token Format**: Signed JSON Web Tokens (JWT) using `HS256`.
- **Claims**:
  - `sub`: User UUID
  - `email`: Normalized email
  - `iat`: UTC issuance timestamp
  - `exp`: Expiration timestamp (default: 24 hours / 1440 minutes)
  - `type`: `access`
- **Cookie Security**:
  - Name: `authentihire_token`
  - Flags: `HttpOnly = True` (prevents XSS access), `SameSite = Lax` (mitigates CSRF), `Path = /`.
  - Configurable `Secure = True` for HTTPS production environments via `COOKIE_SECURE=true`.
- **Header Fallback**: Supports `Authorization: Bearer <token>` for non-browser/mobile clients.

---

## 3. Authorization & User-Scoped Analysis Isolation

### Strict Resource Isolation
1. **Ownership Enforcement**:
   - Authenticated user requests link `analysis.user_id = current_user.id`.
   - `GET /api/v1/analyses`: Returns records where `Analysis.user_id == current_user.id`.
   - `GET /api/v1/analyses/{analysis_id}`: If the requesting user does not own the record, returns `404 Not Found` (non-enumerating response).
   - `DELETE /api/v1/analyses/{analysis_id}`: Strictly requires `Analysis.user_id == current_user.id` or returns `404 Not Found`.
2. **Anonymous Compatibility**:
   - Anonymous requests without authentication headers continue to function via `X-Session-ID`.
   - Anonymous analyses have `user_id = NULL` and cannot be claimed by unrelated accounts without explicit migration logic.

---

## 4. Abuse Prevention & Defense-in-Depth

| Security Vector | Implementation Mechanism |
|---|---|
| **Account Enumeration** | Generic, constant-time error messages (`"Invalid email or password."`) returned identically for non-existent emails and incorrect passwords. |
| **Brute Force Attacks** | In-memory sliding window rate limiter: max 15 login attempts per minute per IP, max 10 registrations per minute per IP. |
| **Security Headers** | Injected on every response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-XSS-Protection: 1; mode=block`. |
| **CORS Policy** | Explicit origin whitelist (`ALLOWED_ORIGINS`), denying wildcard `*` when credentials/cookies are enabled. |
| **Data Minimization** | No plaintext passwords, tokens, or security hashes logged anywhere in application telemetry. |

---

## 5. Verification & Test Suite Summary

### Backend Test Coverage (110 Tests — 100% Passing)
- `tests/test_auth.py` (20 tests):
  - User registration, duplicate prevention, email normalization.
  - Argon2id hashing, salt uniqueness, password verification.
  - Login authentication, invalid credentials handling.
  - `/api/v1/auth/me` profile retrieval and 401 unauthenticated protection.
  - User-owned analyses, cross-user read denial (404), cross-user deletion denial (404).
  - Inactive user rejection (403), expired token rejection (401), malformed JWT rejection (401).
  - HttpOnly cookie extraction and anonymous session coexistence.
- `tests/test_database.py` (22 tests):
  - User CRUD, email uniqueness constraints, foreign key cascading deletion, snapshot reproducibility.
- `tests/test_api.py` (19 tests):
  - End-to-end API lifecycle, UUID tracing, pagination, error schemas.
- `tests/test_risk_assessment.py` & `tests/test_rule_engine.py` (49 tests):
  - ML calibration, 13 heuristic rules, company intelligence integration.

### Frontend Test Coverage (17 Tests — 100% Passing)
- `frontend/src/__tests__/auth.test.tsx`:
  - Login form submission & error handling.
  - Sign-up password mismatch validation & min-length rules.
  - Account modal profile rendering & logout action.
  - History modal analysis listing & restoration into dashboard.
- `frontend/src/__tests__/app.test.tsx` & `client.test.ts`:
  - Full application workflow, risk visualization, error boundaries.

---

## 6. Privacy & Data Handling Notes

> [!NOTE]
> **Data Minimization Statement**: AuthentiHire is designed with data minimization and privacy-aware storage. Only essential authentication data (normalized email, salted password hash) and job posting text required for snapshot risk explanation are persisted.
