# AuthentiHire — Comprehensive QA Test Plan & Test Matrix (Phase 12)

**Phase**: 12 — Comprehensive QA & Testing  
**Date**: September 19, 2026  
**Status**: Active Execution  

---

## 1. System Inventory

AuthentiHire consists of a modular multi-tier architecture spanning machine learning, heuristic rules, external entity intelligence, persistence, authentication, rate limiting, and an interactive React/TypeScript frontend.

### Backend Components
- **Machine Learning**: Preprocessor pipeline, Calibrated Classifier Ensemble (`CalibratedClassifierCV` around LightGBM/RandomForest), isotonic probability calibrator, and decision threshold engine (`0.50`).
- **Rule Engine**: 18 deterministic scam heuristic detectors covering financial requests, advance checks, crypto, impersonation, Telegram/WhatsApp contact, urgency, and unrealistic compensation.
- **Company & Website Intelligence**: Domain extraction, multi-level suffix normalization (`tldextract`), SSRF pre-resolution and IP safety validation, TLS certificate inspection, hop-by-hop redirect analysis, and safe streaming content extraction.
- **Unified Risk Assessment**: Multi-signal mathematical synthesis combining Calibrated ML ($w_1=0.45$), Scam Rules ($w_2=0.35$), and Company Trust ($w_3=0.20$) into a single $0–100$ score and four risk bands (Low, Moderate, High, Critical).
- **FastAPI REST Service**: Production REST API (`src/api.py`, `src/api_service.py`) exposing health, model metadata, analysis, history, and user authentication endpoints.
- **Authentication & Security**: Argon2id password hashing, HS256 JWT access tokens, HttpOnly session cookies, thread-safe sliding-window rate limiters (memory + Redis support), and defense-in-depth HTTP security headers.
- **Database & Persistence**: SQLAlchemy 2.0 ORM with PostgreSQL/SQLite, Alembic migration versioning, strictly isolated user/session historical snapshots, and cascading evidence records.

### Frontend Components
- **UI Architecture**: React 19 + TypeScript + Vite + TailwindCSS.
- **Views & Flow**: Navigation Bar, Hero Section, Analysis Form, Animated Loading State, Comprehensive Results Dashboard, User Analytics Dashboard, Filterable History View, and Authentication/Profile Modals.
- **State Management**: Unified `App` view state machine with `AuthContext` session management and authenticated API client (`src/api/client.ts`).

---

## 2. Test Scope, Layers & Environments

### Test Scope
1. **Unit Testing**: Isolated logic validation for ML loading, rule evaluation, domain parsing, and password hashing.
2. **Integration Testing**: Orchestration across Risk Assessor, Database Repository, and API Service.
3. **API Contract & Edge Cases**: Validation of request/response schemas, status codes, query parameters, Unicode, and oversized payloads.
4. **Security & SSRF Regression**: Verification of IP blocking (loopback, RFC 1918, metadata), token tampering, and IDOR isolation.
5. **Database & Migrations**: Testing Alembic migrations, foreign key constraints, and snapshot immutability.
6. **Frontend & Accessibility**: Component rendering, responsive layouts ($375\text{px}$ to $1440\text{px}$), and keyboard/screen-reader accessibility.
7. **End-to-End User Journeys**: Full registration, login, analysis, history management, and logout workflows.
8. **Concurrency & Performance**: Parallel request execution, large-dataset pagination scaling, and local response-time benchmarking.

### Test Environments
- **Local Unit / Integration**: macOS Darwin / Python 3.13 / SQLite with `StaticPool`.
- **Frontend Test Environment**: Node.js / Vitest / JSDOM / React Testing Library.
- **Network Simulation**: 100% mocked offline network calls preventing live external dependencies during automated CI/CD.

---

## 3. Comprehensive Test Matrix (14 Categories)

| Category | Component / Area | Test Scenario | Expected Behavior | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **1. Unit** | Machine Learning | Model & preprocessor loading | Loads artifacts without warnings; outputs $p \in [0.0, 1.0]$. | Probability is bounded; threshold correctly applied. |
| **1. Unit** | Rule Engine | Individual evaluation of 18 scam rules | Triggers only on matching patterns with correct category and score. | Zero false positives on legitimate control postings. |
| **1. Unit** | Company Intelligence | Domain normalization & email matching | Normalizes subdomains, extracts registered domains, flags free webmail. | Exact domain match identified; public webmail flagged. |
| **2. Integration** | Risk Assessment | Multi-signal synthesis | Weights ML (0.45), Rules (0.35), Company (0.20) into $[0, 100]$. | Score in $[0, 100]$; risk band matches exact score. |
| **3. API** | FastAPI Endpoints | Request contracts on all 11 endpoints | Conforms to Pydantic data schemas; returns appropriate status codes. | HTTP 200, 201, 400, 401, 404, 422 as specified. |
| **4. Database** | SQLAlchemy Models | Analysis snapshot persistence & cascade | User $\to$ Analysis $\to$ Evidence cascading delete; indexed lookups. | Historical snapshots remain immutable when re-opened. |
| **5. Authentication** | Argon2id & JWT | User registration, login, logout, `/auth/me` | Passwords hashed securely; signed tokens verified; cookies cleared. | Valid credentials issue token; wrong password rejected. |
| **6. Authorization** | Data Isolation | Multi-tenant IDOR boundaries | User A cannot access or delete User B's historical records. | Returns HTTP 404 on unowned records; no leaks. |
| **7. Security** | SSRF & Network | Private IP, cloud metadata, redirect chains | Rejects `127.0.0.1`, `169.254.169.254`, `10.x`, `192.168.x`, `[::1]`. | External connection refused before socket opens. |
| **8. Frontend** | React Components | Views, Modals, Forms, Charts | Renders interactive components, handles loading, errors, empty states. | All 5 Vitest test suites pass with 0 errors. |
| **9. End-to-End** | Full User Journey | Signup $\to$ Analyze $\to$ Dashboard $\to$ History $\to$ Delete | Full interactive workflow completes seamlessly. | User sees their analysis persisted and aggregated. |
| **10. Edge Cases** | Malformed Inputs | Emojis, Unicode, 100k-char text, negative limits | Clean validation errors returned without stack trace leakage. | HTTP 422 returned with structured error details. |
| **11. Performance** | REST Endpoints | Latency benchmarking (min, mean, p95, max) | Fast response times on local test runs. | Local engineering benchmark recorded and documented. |
| **12. Regression** | Historical Suites | All Phases 1–11 test cases | Zero regressions across all existing tests. | 100% passing test suite. |
| **13. Migration** | Alembic Engine | Clean database upgrade to head | `alembic upgrade head` runs cleanly without schema errors. | `alembic current` reflects latest migration version. |
| **14. Failure Recovery**| External Network | DNS failure, timeout, 404, 500, redirect loop | Fails safely with status `UNVERIFIED`; does not crash service. | Non-critical failures do not flag posting as fraudulent. |

---

## 4. Acceptance Criteria

Phase 12 QA is accepted when:
1. All 139+ backend tests and 27+ frontend tests pass with 100% success rate.
2. Complete test matrix categories (1–14) are verified and documented.
3. Database migrations upgrade cleanly from a fresh database.
4. SSRF, IDOR, SQLi, and authentication controls remain fully intact.
5. All discovered defects are triaged, remediated, and covered by regression tests.
6. `reports/qa_final_report.md` and `reports/test_coverage_report.md` are completed.
