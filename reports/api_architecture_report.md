# AuthentiHire Phase 6: Backend API & Application Architecture Report

**Phase:** Phase 6 — Backend API & Application Architecture  
**Status:** Complete & Approved  
**Date:** September 2026  
**Artifacts Generated/Updated:**
- `src/api_service.py` (Pydantic v2 data contracts & singleton model service layer)
- `src/api.py` (FastAPI production application, lifespan warmup, routes & global exception handlers)
- `tests/test_api.py` (15 unit/integration test cases)
- `README.md` (Updated with API documentation, architecture diagram, and curl examples)
- `reports/api_architecture_report.md` (This report)

---

## 1. Executive Summary

In Phase 6, we constructed the production REST API layer for AuthentiHire using **FastAPI**, **Pydantic v2**, and **Uvicorn**. The API serves as a clean, decoupled application wrapper around the frozen, validated Phase 5.1 risk assessment engine.

### Key Architecture Achievements:
- **Decoupled Architecture**: Direct ML and rule inference is abstracted behind `AuthentiHireService`, keeping FastAPI routing entirely separated from algorithmic logic.
- **Warm Model Lifecycle**: Utilizing FastAPI's `lifespan` context manager, all ML artifacts (`logistic_regression_calibrated.joblib`, `preprocessor.joblib`, `threshold_config.json`, and `risk_config.json`) are loaded into memory **once at server startup**. Per-request inference requires 0ms model deserialization overhead.
- **Strict Data Contracts**: Pydantic v2 models provide runtime type validation, coercion for boolean/string/integer fields, and comprehensive schema documentation on `/docs` and `/redoc`.
- **Zero Information Leakage**: Global exception handlers sanitize all validation (`422`), routing (`404`), and internal (`500`) errors. Stack traces and internal filesystem paths are never leaked to API consumers.
- **Sub-5ms Latency Baseline**: Local statistical benchmarking (20 concurrent requests) demonstrated a mean latency of **3.93 ms** and a median latency of **3.84 ms**.

---

## 2. System Architecture & Request Lifecycle

```text
  [ Client (Web/Mobile/CLI/Extension) ]
                 │
                 ▼  (HTTP POST /api/v1/analyze)
  ┌────────────────────────────────────────────────────────┐
  │                 FastAPI Application Layer               │
  │  - CORS Middleware (Whitelisted Origins)               │
  │  - Global Exception Interceptors (422, 404, 500)       │
  │  - Contextual Logging & UUID4 Request ID Injection     │
  └────────────────────────┬───────────────────────────────┘
                           │ Validated JobPostingRequest (Pydantic v2)
                           ▼
  ┌────────────────────────────────────────────────────────┐
  │              AuthentiHireService (Singleton)           │
  │  - Pre-warmed ML Models (Isotonic Calibrated LR)       │
  │  - 13-Rule Scam Heuristic Engine                       │
  │  - Company Intelligence & Domain Cache                 │
  └────────────────────────┬───────────────────────────────┘
                           │ Synthesized Assessment
                           ▼
  ┌────────────────────────────────────────────────────────┐
  │         AuthentiHireRiskAssessor (Phase 5.1)           │
  │  - ML Component (50%) + Rule (30%) + Company (20%)     │
  │  - Severity Guardrails & High-Risk Floors              │
  │  - Explainability, Reasons & Corroboration Engine      │
  └────────────────────────┬───────────────────────────────┘
                           │
                           ▼
  [ JSON JobAnalysisResponse (Standardized Output Contract) ]
```

---

## 3. Endpoints & Data Contracts

### 3.1 `POST /api/v1/analyze`
Accepts a job or internship posting payload and returns a comprehensive, auditable fraud-risk assessment.

#### Input Schema (`JobPostingRequest`):
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `title` | `string` | Optional | Job title / designation |
| `location` | `string` | Optional | Location (e.g., `US, NY, New York`) |
| `department` | `string` | Optional | Department or organizational group |
| `salary_range` | `string` | Optional | Compensation range |
| `company_profile` | `string` | Optional | Company background text |
| `description` | `string` | Optional | Core job description text |
| `requirements` | `string` | Optional | Role qualifications |
| `benefits` | `string` | Optional | Benefits text |
| `telecommuting` | `bool` | Optional | Remote eligibility (accepts `true`/`false`, `1`/`0`, `"1"`/`"0"`) |
| `has_company_logo` | `bool` | Optional | Employer logo flag |
| `has_questions` | `bool` | Optional | Application screening questions flag |
| `employment_type` | `string` | Optional | Full-time, Part-time, Contract, etc. |
| `required_experience`| `string` | Optional | Experience level |
| `required_education` | `string` | Optional | Education level |
| `industry` | `string` | Optional | Industry classification |
| `function` | `string` | Optional | Job function |
| `company_name` | `string` | Optional | Explicit company name |
| `recruiter_email` | `string` | Optional | Recruiter contact email |
| `url` | `string` | Optional | Job posting or company URL |

#### Output Schema (`JobAnalysisResponse`):
- `request_id`: Unique UUID4 request tracking identifier.
- `prediction`: Calibrated ML output (`fraud_probability`, `prediction`, `threshold_used`, `model_name`).
- `risk`: Unified risk scores (`overall_score` [0–100], `risk_band`, `status`, `components` breakdown).
- `company`: Company intelligence (`company_name`, `trust_score` [1–100], `domain`, `email`, `consistency_rating`, `signals`).
- `rules`: Heuristic evidence (`total_score`, `triggered_rules_count`, `triggered_rules`, `category_breakdown`, `suspicion_level`).
- `reasons`: Bulleted human-readable explanations.
- `corroborations`: Cross-component corroborated risk findings.
- `recommendations`: Actionable safety guidance for candidates.
- `metadata`: Model version, configuration version, API version, and ISO-8601 UTC timestamp.

### 3.2 `GET /api/v1/health`
Returns system status (`"healthy"`), model loading state (`true`), and active configuration version (`"1.0.0"`).

### 3.3 `GET /api/v1/model-info`
Provides transparent model metadata including base weights (ML: 50%, Rule: 30%, Company: 20%), calibrated model type, decision threshold (`0.25`), and active heuristic rule count (13).

---

## 4. Security & Error Handling Implementation

1. **Information Leakage Prevention**:
   - Validation failures (`422`) return clean JSON error descriptors identifying offending fields without internal code paths.
   - Unhandled exceptions (`500`) generate an internal `error_id` UUID, log the full traceback securely to server logs, and return a clean, unrevealing message to the client.
2. **Input Sanitization**:
   - Pydantic strict schemas reject invalid payload structures, extraneous deeply nested objects, or unparseable primitive types.
3. **CORS Configuration**:
   - Explicit CORS policy permitting only standard origins and authorized HTTP methods (`GET`, `POST`, `OPTIONS`).
4. **Safe Offline Execution**:
   - The API defaults to offline cached/heuristic domain analysis during automated testing and core evaluation, preventing external network dependencies or SSRF vulnerabilities.

---

## 5. Performance & Latency Benchmarks

A statistical benchmark was executed measuring 20 sequential POST requests against the warm FastAPI application running on localhost.

| Metric | Result |
| :--- | :--- |
| **Total Requests** | 20 |
| **Minimum Latency** | **3.50 ms** |
| **Maximum Latency** | **4.66 ms** |
| **Mean Latency** | **3.93 ms** |
| **Median Latency** | **3.84 ms** |
| **P95 Latency** | **4.66 ms** |
| **Model In-Memory Deserializations per Request** | **0** (Lifespan singleton) |

---

## 6. Test Suite Verification

The complete AuthentiHire test suite comprises **63 unit and integration tests** spanning all 6 phases:

```text
Ran 63 tests in 6.631s
OK
```

### Breakdown by Test Suite:
1. `tests/test_api.py` (15 tests): Health check, model info, valid posting, minimal posting, missing optional fields, invalid types (422), malformed JSON (422), empty text fields, UUID4 validation, score/probability bounds, risk bands, 404 handler, realistic scam analysis, repeated request model reuse, OpenAPI documentation generation.
2. `tests/test_risk_validation.py` (9 tests): Stratified split reproducibility, score boundary guarantees, risk band classifications, component weight summation, guardrail enforcement, trust score constraints, insufficient evidence isolation, leakage audits, configuration schema validation.
3. `tests/test_risk_assessment.py` (12 tests): Legitimate jobs, ML+rule interactions, advance fee guardrails, compound scam scoring, free email penalties, website unavailability, missing company handling, corroboration synthesis, OTP solicitation, insufficient evidence cases.
4. `tests/test_company_intelligence.py` (17 tests): Website checks, free provider detection, domain matching, multi-level domain normalization, redirect checks, entropy/numeric heuristics, caching mechanisms.
5. `tests/test_rule_engine.py` (10 tests): Upfront fees, cashier check schemes, high salary/no experience, financial credential harvesting, urgency tactics, messaging channel mandates, obfuscated URLs, sparse metadata.

---

## 7. Deliverables & Files Summary

| File | Purpose |
| :--- | :--- |
| `src/api_service.py` | Pydantic v2 schemas and `AuthentiHireService` singleton orchestrator |
| `src/api.py` | FastAPI application, lifespan lifecycle manager, routes, and global error handlers |
| `tests/test_api.py` | 15 API integration and edge-case unit tests |
| `requirements.txt` | Added `fastapi`, `uvicorn`, and `pydantic` dependencies |
| `README.md` | Comprehensive user and developer guide with CLI, API, and curl examples |
| `reports/api_architecture_report.md` | This technical architectural report |
