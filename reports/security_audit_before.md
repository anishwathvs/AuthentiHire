# AuthentiHire — Initial Security Audit Report (Pre-Hardening)

**Date:** September 19, 2026  
**Scope:** AuthentiHire Codebase (Phase 1–10)  
**Status:** Audit Completed  

---

## 1. Executive Summary

A comprehensive, evidence-based security audit was performed across the AuthentiHire application stack prior to implementing Phase 11 hardening controls. The objective of this audit was to identify attack surfaces, architectural weaknesses, missing controls, and edge-case vulnerabilities across authentication, authorization, external network interactions, API endpoints, database access, and frontend rendering.

---

## 2. Attack Surface Breakdown & Evidence

### 2.1 External Network Requests & SSRF (Server-Side Request Forgery)
* **Component:** `src/company_intelligence.py` (`check_website_live`, `check_ssl_tls`)
* **Finding:** In Phase 4–10, `requests.Session().get(target_url, allow_redirects=True)` and `socket.create_connection((hostname, 443))` were used to verify company websites.
* **Evidence/Risk:**
  1. `requests.get()` followed HTTP redirects automatically (`allow_redirects=True`). An attacker submitting a public domain (e.g. `attacker.com`) could redirect the server to `http://127.0.0.1:8000/`, `http://169.254.169.254/latest/meta-data/` (cloud metadata service), or internal network IPs (`10.0.0.0/8`, `192.168.0.0/16`).
  2. No DNS IP address validation occurred prior to socket/HTTP connections.
  3. Non-HTTP protocols (e.g., `file://`, `gopher://`, `javascript:`) were only partially filtered by string checks rather than strict scheme validation.
* **Severity:** **HIGH** (Critical for deployment environments).

### 2.2 HTTP Security Headers
* **Component:** `src/api.py`
* **Finding:** FastAPI default responses did not include defensive security headers.
* **Evidence/Risk:**
  * Missing `X-Content-Type-Options: nosniff` (MIME sniffing risk).
  * Missing `X-Frame-Options: DENY` (clickjacking risk).
  * Missing `Referrer-Policy: strict-origin-when-cross-origin` (credential/path leakage in referer headers).
  * Missing `Permissions-Policy` (unnecessary browser features enabled by default).
  * Missing `Content-Security-Policy`.
* **Severity:** **MEDIUM**.

### 2.3 Cross-Origin Resource Sharing (CORS) & CSRF
* **Component:** `src/api.py`
* **Finding:** CORS allowed a list of origins (`ALLOWED_ORIGINS`) with `allow_credentials=True`.
* **Evidence/Risk:**
  * If `ALLOWED_ORIGINS` was configured with `*` in production with credentials enabled, browser security models would reject it or create cross-origin session leakage risks.
  * Browser authentication uses `SameSite=Lax` HttpOnly cookies and JSON request payloads (`Content-Type: application/json`), which natively mitigates classic form-based CSRF. However, explicit cross-origin state modification checks and origin validation are essential.
* **Severity:** **LOW / MEDIUM**.

### 2.4 Rate Limiting Architecture & Scalability
* **Component:** `src/auth/rate_limiter.py`
* **Finding:** Rate limiting used an in-memory dictionary sliding window limiter.
* **Evidence/Risk:**
  * Rate limits were only attached to `/auth/register` and `/auth/login`.
  * The expensive analysis endpoint (`POST /api/v1/analyze`) was not rate limited, leaving the service open to denial-of-service or compute resource exhaustion attacks.
  * The in-memory limiter is single-process only; multi-worker or containerized deployments require a pluggable architecture capable of integrating with Redis.
* **Severity:** **MEDIUM**.

### 2.5 Request Size & Input Bounds
* **Component:** `src/api_service.py` (`JobPostingRequest`)
* **Finding:** Pydantic schema did not enforce maximum string lengths on input fields (`title`, `description`, `requirements`, `benefits`, `company_profile`).
* **Evidence/Risk:** An attacker could send megabytes of text in a single request, resulting in high CPU usage in TF-IDF vectorization and regex pattern scanning (CPU exhaustion / ReDoS).
* **Severity:** **MEDIUM**.

### 2.6 Authorization & IDOR (Insecure Direct Object Reference)
* **Component:** `src/database/repository.py` & `src/api.py`
* **Finding:** Analysis records are queried with `Analysis.user_id == user_id`.
* **Evidence/Status:** Phase 9 & 10 implemented user isolation for queries. Verification tests must rigorously validate that no leakage, search escape, sorting bypass, or pagination overflow can expose another user's records or dashboard statistics.
* **Severity:** **PASS / MAINTAIN VERIFICATION**.

### 2.7 Database Query Injection
* **Component:** `src/database/repository.py`
* **Finding:** SQLAlchemy ORM expressions (`select()`, `ilike()`, `where()`) are used.
* **Evidence/Status:** All user inputs in search and filtering are parameterized. Sorting uses a hardcoded column whitelist. No raw SQL concatenation exists.
* **Severity:** **PASS / AUDITED**.

### 2.8 Logging & Secret Leakage
* **Component:** `src/api.py`, `src/auth/`, `src/database/`
* **Finding:** Logs use structured loggers (`authentihire.api`, `authentihire.repository`).
* **Evidence/Status:** Passwords and password hashes are never logged. Tokens are omitted from standard logs. `.env` is ignored by `.gitignore`.
* **Severity:** **PASS / MAINTAIN AUDIT**.

---

## 3. Pre-Hardening Summary Matrix

| Category | Initial Assessment | Mitigation Plan |
|:---|:---|:---|
| **SSRF / Network** | Needs Hardening | Implement IP validation, DNS resolution checks, redirect pinning, streaming size caps, timeouts. |
| **Security Headers** | Missing | Add custom middleware for `X-Content-Type-Options`, `X-Frame-Options`, `CSP`, `Referrer-Policy`. |
| **API Rate Limiting** | Partial (Auth only) | Abstract limiter to support Redis, add rate limiting to `POST /api/v1/analyze`. |
| **Request Bounds** | Unbounded Strings | Add Pydantic `max_length` bounds to prevent CPU/memory exhaustion. |
| **Authentication** | Strong (Argon2id + JWT) | Add automated edge-case test suites (tampered JWT, expired tokens, inactive users). |
| **Authorization / IDOR** | Strong (User-scoped) | Expand automated test suite to rigorously prove cross-user isolation. |
| **SQL Injection** | Parameterized | Maintain whitelist and parameterized bindings. |
| **CORS / Cookies** | Good | Restrict production origins, support configurable `Secure=True` for HTTPS. |
