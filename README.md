# AuthentiHire

**An ML-powered job and internship fraud-risk assessment platform that combines calibrated machine learning, scam-pattern detection, company intelligence, and explainable risk scoring.**

---

## Table of Contents
1. [Overview](#1-overview)
2. [Key Features](#2-key-features)
3. [How AuthentiHire Works](#3-how-authentihire-works)
4. [Risk Bands](#4-risk-bands)
5. [Dataset & Preprocessing](#5-dataset--preprocessing)
6. [Machine Learning Results](#6-machine-learning-results)
7. [Calibration & Thresholding](#7-calibration--thresholding)
8. [Deterministic Rule Engine](#8-deterministic-rule-engine)
9. [Company & Website Intelligence](#9-company--website-intelligence)
10. [REST API Reference](#10-rest-api-reference)
11. [Technology Stack](#11-technology-stack)
12. [Project Structure](#12-project-structure)
13. [Local Development & Setup](#13-local-development--setup)
14. [Environment Variables](#14-environment-variables)
15. [Database & Migrations](#15-database--migrations)
16. [Testing & Quality Assurance](#16-testing--quality-assurance)
17. [Security Controls](#17-security-controls)
18. [Interactive API Documentation](#18-interactive-api-documentation)
19. [System Architecture & Interface](#19-system-architecture--interface)
20. [Limitations](#20-limitations)
21. [Future Work](#21-future-work)
22. [Project Status](#22-project-status)
23. [Contributors](#23-contributors)

---

## 1. Overview

Employment scams have surged with the growth of remote work, online recruiting platforms, and automated job boards. Fraudulent postings prey on vulnerable job seekers and students by advertising attractive salaries, low barrier-to-entry roles, or expedited hiring processes to extract upfront fees, deposit counterfeit cashier's checks, or harvest personally identifiable information (SSNs, banking credentials).

Detecting these postings is inherently challenging:
- **Sophisticated Impersonation**: Modern attackers copy genuine job descriptions and use legitimate corporate branding or lookalike domains.
- **Extreme Class Imbalance**: Legitimate listings drastically outnumber fraudulent ones in real-world data, creating severe false-positive risks for naive classifiers.
- **Black-Box Failure Modes**: A single raw machine learning prediction provides no reasoning, making it insufficient for high-stakes screening where users require clear, actionable evidence.

**AuthentiHire** solves this by unifying three corroborating inspection layers:
1. **Calibrated Machine Learning** (probabilistic text classification via TF-IDF n-grams with Platt scaling).
2. **Deterministic Scam Rules** (high-precision heuristics catching explicit advance-fee, fake-check, and credential-harvesting patterns).
3. **Company & Website Intelligence** (live DNS resolution, MX mail integrity, free-mail provider detection, and domain-to-recruiter consistency).

The result is a transparent, explainable risk assessment featuring a composite 0–100 risk score, risk band classification, and structured evidence points.

---

## 2. Key Features

### Machine Learning
- **Text Representation**: Sublinear TF-IDF vectorization across job title, company profile, description, requirements, and benefits (unigrams + bigrams, sublinear term frequency scaling).
- **Class-Imbalance Handling**: Balanced class weights and calibrated loss optimization across imbalanced training distributions (~4.8% fraud prevalence).
- **Evaluated Classifiers**: Logistic Regression (Balanced), Multinomial Naive Bayes, and Balanced Random Forest.
- **Probability Calibration**: Sigmoid Platt scaling calibrating raw classifier decision functions into true statistical probabilities.
- **Threshold Tuning**: Dedicated threshold selection ($0.25$ operating threshold) optimizing the precision-recall trade-off for fraud capture.

### Scam Pattern Detection
- **Modular Heuristic Engine**: 14 distinct scam detection rules grouped into 7 categories.
- **Anti-Double-Counting**: Category-level score capping prevents redundant linguistic triggers from inflating risk scores artificially.
- **Explainable Evidence**: Extracts exact matched text snippets alongside risk descriptions and severity classifications.

### Company Intelligence
- **Entity Extraction**: Normalizes company profiles, URLs, and recruiter email addresses.
- **Domain Normalization & Reachability**: Validates URL structure, checks HTTP/HTTPS status, and verifies SSL/TLS certificates.
- **Email & Domain Consistency**: Verifies whether recruiter email domains align with corporate website domains and flags disposable/free mail providers (e.g., Gmail/Yahoo used for Fortune 500 roles).
- **Network Safety (SSRF Protection)**: Rejects private IP ranges, loopback addresses, AWS/GCP metadata endpoints (`169.254.169.254`), and enforces redirect caps.
- **Caching & Offline Mode**: Disk-backed domain caching with deterministic fallbacks when external networks are unreachable or disabled.

### Risk Assessment Engine
- **Composite Formula**: Synthesizes inputs into a single 0–100 unified risk score:
  $$\text{Overall Risk} = (0.50 \times \text{ML Risk}) + (0.30 \times \text{Rule Risk}) + (0.20 \times \text{Company Risk})$$
  *(Where $\text{Company Risk} = 100 - \text{Company Trust Score}$)*
- **Safety Guardrails**: Enforces non-bypassable floors (e.g., critical scam rules or raw IP URLs enforce minimum risk floors even if ML score is low).

### Authentication & User Accounts
- **Password Security**: Cryptographic hashing via **Argon2id** (OWASP-recommended, 64 MB memory cost, parallelism 4) with bcrypt verification fallback.
- **Session Tokens**: Signed **JWT access tokens** (HS256) delivered via **HttpOnly, SameSite cookies** and Bearer Authorization headers.
- **User Ownership**: Analyses and search history are strictly isolated and scoped to the authenticated user account or anonymous session.

### Dashboard & History
- **Interactive Overview**: 4 high-level stat cards, SVG donut chart for risk band distribution, 5-step visual inspection pipeline, and safety guidance.
- **History Management**: Search by title/company, filter by risk band, multi-column sorting, pagination, individual snapshot viewing, and deletion.

### Security Hardening
- **SSRF Defense**: Private IPv4/IPv6 blocking, loopback prevention, cloud metadata isolation, and strict redirect limits.
- **Rate Limiting**: Sliding-window memory rate limiting with optional Redis distributed backend support.
- **Security Headers**: HSTS, Content-Security-Policy (CSP), X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), Referrer-Policy, and Permissions-Policy.
- **Input Validation & SQL Safety**: Strict Pydantic v2 schemas and SQLAlchemy parameterized queries preventing SQL injection and payload overflow.

---

## 3. How AuthentiHire Works

```
                     ┌───────────────────────────┐
                     │   Job / Internship Input  │
                     │ (Title, Desc, URL, Email) │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │   Input Schema Validation │
                     │  (Length, Bounds, Types)  │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │    Text Preprocessing     │
                     │ (HTML clean, Unicode norm)│
                     └─────────────┬─────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  TF-IDF Vectors  │     │   Deterministic  │     │ Company & Domain │
│        +         │     │    Scam Rules    │     │   Intelligence   │
│  Calibrated ML   │     │ (Payment, Creds) │     │ (DNS, MX, Mail)  │
└─────────┬────────┘     └─────────┬────────┘     └─────────┬────────┘
          │                        │                        │
          ▼                        ▼                        ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Fraud Probability│     │  Triggered Rules │     │Company Trust Sc. │
│  (0.00 – 1.00)   │     │  & Evidence Text │     │    (1 – 100)     │
└─────────┬────────┘     └─────────┬────────┘     └─────────┬────────┘
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │  Unified Risk Assessment  │
                     │  (50% ML + 30% Rules +    │
                     │   20% Company + Floors)   │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │     Final Risk Report     │
                     │  • Overall Score (0-100)  │
                     │  • Risk Band (LOW-CRIT)   │
                     │  • Evidence Breakdown     │
                     │  • Safety Recommendations │
                     └───────────────────────────┘
```

---

## 4. Risk Bands

AuthentiHire maps the composite score (0–100) into four screening risk bands:

| Risk Band | Score Range | Description | Recommended Action |
| :--- | :---: | :--- | :--- |
| **LOW RISK** | $0 - 24$ | Postings with verified company signals, no scam rules triggered, and low ML fraud probabilities. | Safe to apply. Follow standard application procedures. |
| **MODERATE RISK** | $25 - 49$ | Minor anomalies detected (e.g., missing company website, minor wording flags, or ambiguous signals). | Exercise standard caution. Verify recruiter email independently. |
| **HIGH RISK** | $50 - 74$ | Strong indicators of employment fraud, high ML probability, or mismatched recruiter domain. | Do not transfer funds or share sensitive personal identifiers. |
| **CRITICAL RISK** | $75 - 100$ | Compound high-severity indicators (e.g., upfront payment requests, fake cashier checks, or Telegram interviews). | **Do not apply.** Flag or report the listing immediately. |

*Note: Risk bands are screening categories designed to guide user diligence and do not constitute absolute legal guarantees.*

---

## 5. Dataset & Preprocessing

The machine learning models were trained on the benchmark **EMSCAD (Employment Scam Aegean Dataset)**:

- **Original Dataset**: 17,880 postings across 18 features (17,014 legitimate, 856 fraudulent).
- **Content Deduplication**: Exact textual duplicate postings were removed prior to splitting, yielding **17,599 unique postings** (16,743 legitimate, 856 fraudulent).
- **Data Splitting**: Stratified 80/20 train/test split (`random_state=42`):
  - **Training Set**: 14,079 postings (13,394 legitimate, 685 fraudulent).
  - **Holdout Test Set**: 3,520 postings (3,349 legitimate, 171 fraudulent).
- **Leakage Prevention**: Identifier attributes (`job_id`) and target-correlated metadata were excluded prior to feature extraction.

---

## 6. Machine Learning Results

### Final Holdout Test Evaluation ($N = 3,520$)

| Model | Accuracy | Fraud Precision | Fraud Recall | Fraud F1-Score |
| :--- | :---: | :---: | :---: | :---: |
| **Logistic Regression (Balanced)** | **96.85%** | **62.82%** | **85.96%** | **72.59%** |
| **Multinomial Naive Bayes** | 97.36% | 80.47% | 60.23% | 68.90% |
| **Random Forest (Balanced)** | 97.78% | 100.00% | 54.39% | 70.45% |

### Holdout Confusion Matrices

**Logistic Regression (Balanced)**:
$$\begin{bmatrix} 3262 & 87 \\ 24 & 147 \end{bmatrix}$$
- *True Negatives*: 3,262 | *False Positives*: 87
- *False Negatives*: 24 | *True Positives*: 147

**Multinomial Naive Bayes**:
$$\begin{bmatrix} 3324 & 25 \\ 68 & 103 \end{bmatrix}$$
- *True Negatives*: 3,324 | *False Positives*: 25
- *False Negatives*: 68 | *True Positives*: 103

**Random Forest (Balanced)**:
$$\begin{bmatrix} 3349 & 0 \\ 78 & 93 \end{bmatrix}$$
- *True Negatives*: 3,349 | *False Positives*: 0
- *False Negatives*: 78 | *True Positives*: 93

### Precision-Recall Trade-off Rationale
In fraud screening, **recall is paramount**: missing a scam (False Negative) can cause severe financial and personal harm to an applicant, whereas a False Positive prompts brief manual verification. Balanced Logistic Regression captured **85.96% of all fraudulent postings** on the unseen test set, making it the superior foundation for probability calibration.

---

## 7. Calibration & Thresholding

Raw classifier decision scores often do not reflect empirical fraud rates. AuthentiHire fits a **Sigmoid Platt Scaler** to the Balanced Logistic Regression model to output calibrated probabilities $P(\text{Fraud} \mid x) \in [0.0, 1.0]$.

- **Calibration Method**: Platt Scaling (`CalibratedClassifierCV(method='sigmoid', cv=5)`).
- **Selected Operating Threshold**: $\tau = 0.25$ on calibrated probabilities.
- **Operating Trade-offs**:
  - Threshold $0.20$: Maximizes fraud capture (High Recall).
  - Threshold $0.25$: Balanced operational point (~79% recall, ~73% precision, Brier score $0.0155$).
  - Threshold $0.40$: High-confidence alerts (High Precision).

---

## 8. Deterministic Rule Engine

The rule engine evaluates 14 modular heuristics across 7 core threat categories:

1. **Payment & Advance-Fee Scams**: Requests for registration fees, onboarding charges, training materials, or security deposits.
2. **Fake Check & Equipment Purchases**: Demands to deposit checks to buy hardware from an "approved vendor".
3. **Cryptocurrency & Wire Transfers**: Requests for Bitcoin, USDT, Western Union, or non-traceable payment methods.
4. **Credential & Identity Harvesting**: Requests for SSN, banking PINs, or passport copies prior to an interview.
5. **Suspicious Recruitment Channels**: Interviews conducted exclusively over Telegram, WhatsApp, Signal, or personal Google Hangouts.
6. **Free-Mail Recruiter Discrepancies**: Recruiters claiming to represent enterprise companies while contacting from `@gmail.com` or `@outlook.com`.
7. **Urgency Pressure & No-Interview Offers**: "Immediate start", "no experience needed", or guaranteed job offers issued within minutes.

---

## 9. Company & Website Intelligence

### Implemented Capabilities
- **Entity Extraction**: Parsing company names, email addresses, and URLs from free-form text.
- **Disposable & Free Webmail Detection**: Lookup table covering 40+ common free-mail and disposable providers.
- **Domain Normalization**: Hostname extraction, sub-domain stripping, and TLD parsing.
- **Live DNS & HTTP Verification**: Reachability checks, HTTP status codes, TLS certificate validation, and redirect tracking.
- **Email-to-Domain Consistency**: Matches recruiter email domain against official company web presence.
- **Caching & SSRF Isolation**: Local disk cache (`cache/domain_cache.json`) with private IP blocking.

### Planned / Future Enhancements
- Domain registration age (WHOIS API / RDAP lookup).
- Corporate registry and business entity verification (e.g., OpenCorporates).
- Social media profile verification (LinkedIn Company Page verification).
- Automated scam reporting database integrations (e.g., BBB, FTC).

---

## 10. REST API Reference

The backend exposes a versioned, RESTful API under `/api/v1`:

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/register` | Register new user account with Argon2id hashing | No |
| `POST` | `/api/v1/auth/login` | Authenticate user, issue JWT token & HttpOnly cookie | No |
| `POST` | `/api/v1/auth/logout` | Invalidate session and clear authentication cookies | Yes |
| `GET` | `/api/v1/auth/me` | Retrieve authenticated user profile | Yes |
| `POST` | `/api/v1/analyze` | Run multi-signal risk assessment & persist snapshot | Optional |
| `GET` | `/api/v1/analyses` | Paginated search, filter, and sort analysis history | Optional |
| `GET` | `/api/v1/analyses/{id}` | Retrieve historical analysis report snapshot | Optional |
| `DELETE`| `/api/v1/analyses/{id}` | Delete user or session-owned analysis record | Optional |
| `GET` | `/api/v1/dashboard/summary` | User-scoped verification metrics and risk distribution | Yes |
| `GET` | `/api/v1/health` | Service liveness and model warm-up status | No |
| `GET` | `/api/v1/model-info` | Non-sensitive model version, weights, and bands | No |

---

## 11. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, React Router v7, Lucide Icons, Vanilla CSS Design System |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, Starlette, Uvicorn |
| **Machine Learning** | Scikit-learn, NumPy, Pandas, Joblib, TF-IDF Vectorizer, Platt Calibrator |
| **Database & ORM** | PostgreSQL (Production) / SQLite (Local/Testing), SQLAlchemy 2.0 |
| **Database Migrations**| Alembic |
| **Authentication** | Argon2id (`argon2-cffi`), PyJWT, Passlib / Bcrypt fallback, HttpOnly Session Cookies |
| **Testing & QA** | Pytest, Unittest, Vitest, React Testing Library, Playwright (CDP) |
| **Security** | SSRF Validator, In-Memory/Redis Rate Limiter, Defense-in-Depth Security Headers |

---

## 12. Project Structure

```
AuthentiHire/
├── .env.example                # Template for environment configuration
├── .gitignore                  # Git ignore protecting secrets, node_modules, and cache
├── README.md                   # System documentation & architectural reference
├── alembic.ini                 # Alembic migration configuration
├── requirements.txt            # Python backend dependencies
├── alembic/                    # Database migrations
│   ├── env.py
│   └── versions/
│       ├── 001_initial_schema.py
│       └── 002_user_authentication.py
├── data/
│   └── fake_job_postings.csv   # EMSCAD dataset for training & evaluation
├── models/                     # Trained ML models and risk configuration
│   ├── preprocessor.joblib
│   ├── logistic_regression_calibrated.joblib
│   ├── logistic_regression.joblib
│   ├── multinomial_nb.joblib
│   ├── random_forest.joblib
│   ├── risk_config.json
│   └── threshold_config.json
├── notebooks/                  # Exploratory analysis & data investigation
│   └── 01_data_analysis.ipynb
├── reports/                    # Validation, security, and architectural reports
├── src/                        # Core backend source code
│   ├── api.py                  # FastAPI application & route definitions
│   ├── api_service.py          # Service orchestration layer
│   ├── company_intelligence.py # DNS, email, and domain verification
│   ├── evaluate.py             # Evaluation and metrics computation
│   ├── predict.py              # ML inference pipeline
│   ├── preprocessing.py        # Text vectorization & cleaning
│   ├── risk_assessment.py      # Unified 50/30/20 risk engine
│   ├── risk_validation.py      # Guardrails & validation bounds
│   ├── rule_engine.py          # Deterministic scam heuristics
│   ├── train.py                # Model training and calibration script
│   ├── auth/                   # Authentication & security subsystem
│   │   ├── dependencies.py     # Auth injection & token resolvers
│   │   ├── rate_limiter.py     # Sliding-window rate limiters
│   │   ├── schemas.py          # Pydantic auth schemas
│   │   └── security.py         # Argon2id hashing & JWT logic
│   └── database/               # Database models & repository layer
│       ├── connection.py       # Engine & session management
│       ├── models.py           # SQLAlchemy User & Analysis models
│       ├── repository.py       # Data access objects & queries
│       └── schemas.py          # Pydantic persistence schemas
├── tests/                      # Comprehensive backend test suite (163 tests)
│   ├── test_api.py
│   ├── test_auth.py
│   ├── test_company_intelligence.py
│   ├── test_dashboard.py
│   ├── test_database.py
│   ├── test_qa_comprehensive.py
│   ├── test_risk_assessment.py
│   ├── test_risk_validation.py
│   ├── test_rule_engine.py
│   └── test_security.py
└── frontend/                   # Modern React TypeScript frontend
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── src/
    │   ├── App.tsx             # Root routing and application layout
    │   ├── main.tsx            # Application entry point
    │   ├── api/                # Type-safe API client
    │   ├── assets/             # Visual assets & illustrations
    │   ├── components/         # Reusable UI components
    │   ├── context/            # Authentication & State context
    │   ├── layouts/            # Public & App layouts with sidebar
    │   ├── pages/              # Public & Authenticated application pages
    │   │   ├── public/         # Landing, Login, Register, HowItWorks, About, Resources
    │   │   └── app/            # Dashboard, Analyze, History, Saved, Account
    │   └── __tests__/          # Frontend Vitest test suite (18 tests)
```

---

## 13. Local Development & Setup

### Prerequisites
- **Python**: Version `3.11` or higher
- **Node.js**: Version `18.0.0` or higher (`npm` v9+)
- **Git**

---

### Backend Setup

1. **Create and activate a virtual environment**:
   ```bash
   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate

   # Windows (PowerShell)
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

4. **Apply database migrations**:
   ```bash
   alembic upgrade head
   ```

5. **Start the FastAPI backend server**:
   ```bash
   python3 -m uvicorn src.api:app --host 127.0.0.1 --port 8000 --reload
   ```
   *Backend is accessible at `http://127.0.0.1:8000`.*

---

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   *Frontend is accessible at `http://localhost:5173`.*

---

## 14. Environment Variables

Configure backend settings via `.env` (copied from [`.env.example`](file:///Users/reethika/Desktop/AuthentiHire/.env.example)):

```bash
# Environment Mode (development | staging | production)
ENVIRONMENT=development

# Database Configuration
DATABASE_URL=sqlite:///data/authentihire.db
# PostgreSQL: postgresql://user:password@localhost:5432/authentihire

# Cryptographic secret for signing JWTs (HS256)
AUTH_SECRET_KEY=authentihire-dev-secret-key-do-not-use-in-production-change-me
AUTH_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Cookie Security (set to true in production behind HTTPS)
COOKIE_SECURE=false
ENABLE_HSTS=false

# Rate Limiting & SSRF Bounds
RATE_LIMIT_ANALYZE_MAX_REQUESTS=60
MAX_REDIRECTS=5
MAX_RESPONSE_BYTES=100000

# Server Binding & CORS
API_HOST=127.0.0.1
API_PORT=8000
LOG_LEVEL=INFO
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
```

---

## 15. Database & Migrations

AuthentiHire uses **SQLAlchemy 2.0** with **Alembic** for schema migrations.

### Running Migrations
To upgrade the database to the latest schema:
```bash
alembic upgrade head
```

To roll back a migration:
```bash
alembic downgrade -1
```

To create a new migration revision:
```bash
alembic revision -m "description_of_changes"
```

---

## 16. Testing & Quality Assurance

AuthentiHire enforces a zero-regression testing policy with **181 automated tests** spanning unit, integration, security, and contract verification:

### Run Backend Tests (163 Tests)
```bash
# Run complete test suite with Pytest
PYTHONPATH=. pytest -v

# Alternatively, run via Python unittest runner
PYTHONPATH=. python3 -m unittest discover -s tests -v
```

### Run Frontend Tests (18 Tests) & Type Checking
```bash
cd frontend

# TypeScript compilation check
npx tsc -b

# Run frontend tests
npm test -- --run

# Test production build bundle
npm run build
```

---

## 17. Security Controls

- **Cryptographic Password Storage**: Uses OWASP-recommended **Argon2id** (`time_cost=2`, `memory_cost=64MB`, `parallelism=4`).
- **Token Security**: Tokens are signed via `HS256` with configurable TTL and delivered in `HttpOnly`, `SameSite=Lax` cookies.
- **SSRF Prevention**: All external network requests parse target hostnames and validate against IPv4/IPv6 private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, and link-local cloud metadata addresses).
- **Rate Limiting**: Sliding-window rate limiters prevent brute-force attacks on `/auth/login`, `/auth/register`, and `/analyze`.
- **SQL Injection Prevention**: All queries utilize SQLAlchemy ORM parameterized statements.
- **Defense-in-Depth Headers**: Standard responses include HSTS, CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy`.

> **Responsible Use Notice**: AuthentiHire is designed for analyzing public job listings. Do not submit passwords, private cryptographic keys, or sensitive financial account numbers.

---

## 18. Interactive API Documentation

When the backend server is running locally, interactive API documentation is automatically accessible at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 19. System Architecture & Interface

- **Public Experience**: Features an editorial narrative layout with multi-image storytelling, risk education, and technical methodology explanations.
- **Authenticated Dashboard**: Features a 4-card metric summary, SVG donut chart for risk band distribution, 5-step visual process flow, searchable analysis history, and safety resources.

---

## 20. Limitations

1. **Dataset Distribution**: Models are trained on the EMSCAD benchmark dataset; emerging scams using generative AI or novel evasion strategies may require ongoing retraining.
2. **Probabilistic Nature**: Fraud probability and risk scores are screening aids, not definitive legal determinations of illegality.
3. **External Network Availability**: Live company domain checks require active internet connectivity and may be affected by third-party bot blockers or transient DNS timeouts.
4. **Independent Verification**: Users should always independently verify recruiter credentials through official corporate communication channels before transferring funds or sharing sensitive identifiers.

---

## 21. Future Work

- **WHOIS & RDAP Integration**: Automated domain registration age checks to flag newly minted domains (<30 days old).
- **Browser Extension**: Chrome/Firefox extension to analyze job listings directly on LinkedIn, Indeed, and Handshake.
- **PDF Report Generation**: Exportable fraud audit reports for career advisors and university placement cells.
- **Reputation Feeds**: Integration with FTC, BBB, and public scam telemetry feeds.
- **Multilingual Support**: Expanding vectorizer coverage to detect non-English employment fraud campaigns.

---

## 22. Project Status

AuthentiHire is fully implemented end-to-end:
- **Machine Learning**: Preprocessed, trained, probability-calibrated, and threshold-tuned models.
- **Rule Engine**: 14 modular scam rules with anti-double-counting logic.
- **Company Intelligence**: Live DNS, MX, SSL, and domain consistency verification.
- **Persistence & Auth**: PostgreSQL / SQLite schema with Alembic migrations, Argon2id hashing, and JWT cookies.
- **Web Application**: Multi-page React frontend with public storytelling and authenticated dashboard.
- **Security & QA**: SSRF hardening, rate limiting, and 181 passing automated tests.

---

## 23. Contributors

- **VS ANISHWATH** (Register No.: `2104251041104`)
- **Harihar M** (Register No.: `2104251040268`)
