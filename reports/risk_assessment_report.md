# AuthentiHire — Phase 5: Unified Risk Assessment Report

## 1. Executive Summary & Architecture

Phase 5 establishes the unified evaluation layer of **AuthentiHire**, synthesizing the three independent detection pipelines developed in earlier phases:
1. **Calibrated Machine Learning Classifier** (Phase 2.5): Produces calibrated probabilistic estimates of scam likelihood.
2. **Explainable Scam Rule Engine** (Phase 3): Detects 13 deterministic patterns spanning upfront fees, banking credentials, sensitive PII, and deceptive communication channels.
3. **Company & Website Intelligence Analyzer** (Phase 4): Evaluates employer identity, public webmail usage, TLS certificates, domain normalization, and consistency.

The unified assessor produces a multi-dimensional assessment featuring an explainable **Company Trust Score** (1–100), an **Overall Risk Score** (0–100), a **Risk Level Band**, an **Assessment Status**, **Anti-Double-Counting Corroborations**, **Human-Readable Explanations**, and a **Recommended Action**.

```
+--------------------------------------------------------------------------------------------------+
|                                           JOB POSTING                                            |
+--------------------------------------------------------------------------------------------------+
                                                 |
         +---------------------------------------+---------------------------------------+
         |                                       |                                       |
         v                                       v                                       v
+------------------+                   +--------------------+                 +--------------------+
|  CALIBRATED ML   |                   |    SCAM RULES      |                 |    COMPANY & WEB   |
|    CLASSIFIER    |                   |      ENGINE        |                 |    INTELLIGENCE    |
| (Probabilities)  |                   | (13 Rule Classes)  |                 | (Domain/TLS/Email) |
+------------------+                   +--------------------+                 +--------------------+
         |                                       |                                       |
         | (Fraud Prob: 0.0-1.0)                 | (Rule Suspicion: 0-60)                | (Verified Presence)|
         +---------------------------------------+---------------------------------------+
                                                 |
                                                 v
                               +-----------------------------------+
                               |   AUTHENTIHIRE RISK ASSESSOR      |
                               +-----------------------------------+
                               | 1. Company Trust Score (1-100)    |
                               | 2. Overall Risk Score (0-100)     |
                               | 3. Anti-Double-Counting Clusters  |
                               | 4. Guardrail & Floor Overrides    |
                               | 5. Explainable Reason Generator   |
                               | 6. Action Guideline Synthesizer   |
                               +-----------------------------------+
                                                 |
                                                 v
                               +-----------------------------------+
                               |     UNIFIED ASSESSMENT REPORT     |
                               |  - Overall Risk Score: 0-100      |
                               |  - Risk Level: LOW/MOD/HIGH/CRIT  |
                               |  - Status: CLEAR/LOW/REVIEW/HIGH  |
                               |  - Company Trust Score: 1-100     |
                               |  - Corroborated Evidence Reasons  |
                               |  - Recommended Action             |
                               +-----------------------------------+
```

---

## 2. Component Methodologies

### 2.1 Calibrated ML Component
- **Model**: Isotonically Calibrated Logistic Regression trained with balanced class weighting on TF-IDF word and character n-grams.
- **Output**: Calibrated float `fraud_probability` $\in [0.0, 1.0]$ and decision threshold (0.25).
- **Interpretation**: A probability of `0.73` represents the model's calibrated empirical likelihood under training conditions; it is explicitly not reported as "certain fraud".

### 2.2 Explainable Scam Rule Engine Component
- **Engine**: 13 domain-specific heuristic rules with category-level capping to prevent score runaway.
- **Output**: Integer `rule_suspicion_score` $\in [0, 60+]$, `suspicion_level`, and list of triggered rule IDs with verbatim evidence snippets.

### 2.3 Company & Website Intelligence Component
- **Engine**: Public Suffix domain normalization (`tldextract`), safe TLS/SSL certificate verification, HTTP reachability inspection, free webmail detection, and domain heuristics.
- **Output**: Identified corporate domains, TLS validity, email domain consistency, and structured signals (`EMAIL_FREE_PROVIDER`, `URL_SHORTENER_DETECTED`, `URL_RAW_IP_ADDRESS`).

---

## 3. Company Trust Score Methodology (1–100)

The **Company Trust Score** measures the strength of verifiable corporate identity and online presence evidence. It starts from a neutral baseline of **50 points** and adjusts based on positive verification and suspicious signals:

| Factor | Description | Score Impact |
| :--- | :--- | :--- |
| **Baseline** | Neutral starting state for uninspected companies | **50 pts** |
| **Company Name Extracted** | Explicit metadata or structured intro pattern verified | **+10 pts** |
| **Company Domain Identified** | Valid registered root domain extracted | **+10 pts** |
| **Website Reachable** | Safe HTTP GET establishes positive response (200 OK) | **+10 pts** |
| **Valid TLS / HTTPS** | Cryptographically valid certificate chain from trusted CA | **+10 pts** |
| **Email Domain Match** | Recruiter email domain corresponds to company domain | **+15 pts** |
| **Corporate Presence Pages** | Verified careers, about, or contact navigation links | **+5 pts** |
| **Free Webmail Used** | Recruiter uses Gmail, Yahoo, Proton, etc. for corporate hiring | **-15 pts** |
| **Email/Domain Mismatch** | Recruiter email uses a different non-free domain from company | **-15 pts** |
| **Raw IP Address URL** | Link uses raw numerical IP instead of registered domain | **-25 pts** |
| **URL Shortener Used** | Link obscures final destination via bit.ly, tinyurl, etc. | **-15 pts** |
| **High Entropy Domain** | Domain exhibits unnatural consonant clusters/randomness | **-15 pts** |
| **Numeric-Heavy Domain** | Domain contains >40% digits or long sequential numbers | **-10 pts** |
| **Cross-Domain Redirect** | Website redirects across disparate root domains | **-10 pts** |
| **Invalid SSL Certificate** | HTTPS certificate expired or failed verification | **-15 pts** |
| **Unverified Identity** | Complete absence of company name, domain, and emails | **-15 pts** |

> **Important Distinction**: Missing information (e.g. no website found in posting) is classified as `UNVERIFIED` and incurs a mild adjustment, whereas active adversarial signals (e.g. raw IP address, invalid SSL) incur severe deductions.

---

## 4. Overall Risk Score Methodology (0–100)

The **Overall Risk Score** aggregates normalized component risks using documented initial engineering weights:

$$\text{Overall Risk} = (0.50 \times \text{ML Risk}) + (0.30 \times \text{Rule Risk}) + (0.20 \times \text{Company Risk})$$

Where:
- $\text{ML Risk} = \text{fraud\_probability} \times 100$
- $\text{Rule Risk} = \min\left(\frac{\text{rule\_suspicion\_score}}{60} \times 100, 100\right)$
- $\text{Company Risk} = 100 - \text{Company Trust Score}$

*Note: The 50/30/20 ratio represents initial engineering weights designed for balanced screening, not claimed to be statistically optimal.*

---

## 5. Anti-Double-Counting Framework

To prevent co-occurring signals from artificially compounding risk scores, related signals are mapped to **Conceptual Evidence Clusters**:
- `FINANCIAL_PAYMENT_REQUEST` (`PAY_001`, `PAY_002`, `PAY_003`)
- `FINANCIAL_CREDENTIALS` (`FIN_001`, `FIN_002`)
- `PERSONAL_IDENTITY_PII` (`ID_001`)
- `COMMUNICATION_CHANNEL` (`COMM_001`, `COMM_002`)
- `CONTACT_EMAIL_IDENTITY` (`EMAIL_FREE_PROVIDER`, `EMAIL_DOMAIN_MISMATCH`)
- `URL_DOMAIN_ANOMALY` (`URL_SHORTENER_DETECTED`, `URL_RAW_IP_ADDRESS`, `DOMAIN_HIGH_ENTROPY`, `DOMAIN_NUMERIC_HEAVY`)

When a single underlying factor is detected across multiple modules (e.g. an upfront fee detected by ML and Rule Engine), the system explicitly records multi-source **corroboration** in the explanation without multiplying the risk score redundantly.

---

## 6. Guardrails & Override Logic

1. **Critical Scam Rule Floor (Min 55 / HIGH RISK)**: If an explicit scam rule involving upfront fees (`PAY_001`, `PAY_002`, `PAY_003`) or banking credentials (`FIN_001`, `FIN_002`) is triggered, the Overall Risk Score is floored at **55**, preventing high-risk scams from being obscured by low ML scores.
2. **Raw IP Address Floor (Min 50 / HIGH RISK)**: If a link uses a raw IP address, the score is floored at **50**.
3. **Compound High ML + Severe Rules (Min 75 / CRITICAL RISK)**: When `fraud_probability >= 0.50` and `rule_suspicion_score >= 30`, risk is elevated to **CRITICAL RISK**.
4. **Insufficient Evidence Guard**: Postings with total text length < 50 characters and clean rules are flagged as `INSUFFICIENT_EVIDENCE`.

---

## 7. Risk Bands & Assessment Statuses

### Risk Level Bands
- **`LOW RISK` (0–24)**: Standard legitimate posting profile.
- **`MODERATE RISK` (25–49)**: Contextual anomalies or unverified employer presence; review recommended.
- **`HIGH RISK` (50–74)**: Elevated fraud probability or explicit scam patterns detected; independent employer verification required.
- **`CRITICAL RISK` (75–100)**: Compound critical scam indicators detected; do not share credentials or payments.

### Assessment Statuses
- **`CLEAR`**: Score < 15, Company Trust ≥ 70, no triggered rules.
- **`LOW_RISK`**: Score < 25.
- **`REVIEW_RECOMMENDED`**: Score 25–49 or unverified company presence.
- **`HIGH_RISK`**: Score ≥ 50.
- **`INSUFFICIENT_EVIDENCE`**: Ultra-brief text (<50 chars) with no corporate metadata.

---

## 8. Empirical Evaluation on Real Dataset (17,880 Postings)

The unified assessment engine was evaluated across all 17,880 rows of `data/fake_job_postings.csv` (866 fraudulent, 17,014 legitimate). Ground-truth labels were strictly isolated and used only for validation metrics.

### 8.1 Empirical Fraud Rate by Risk Band

| Risk Band | Total Postings | Legitimate (0) | Fraudulent (1) | Empirical Fraud Rate |
| :--- | :--- | :--- | :--- | :--- |
| **LOW RISK (0–24)** | 16,882 | 16,825 | 57 | **0.34%** (99.66% Legitimate) |
| **MODERATE RISK (25–49)** | 407 | 167 | 240 | **58.97%** (Clear Inflection Point) |
| **HIGH RISK (50–74)** | 591 | 22 | 569 | **96.28%** (Overwhelmingly Fraudulent) |
| **CRITICAL RISK (75–100)** | 0 | 0 | 0 | **0.00%** |
| **Total** | **17,880** | **17,014** | **866** | **4.84% (Dataset Prior)** |

### 8.2 Classification Performance (Screening Flag at Risk Score ≥ 25)

| Metric | Score | Note |
| :--- | :--- | :--- |
| **Accuracy** | **98.62%** | High overall classification fidelity across class imbalance |
| **Recall (Sensitivity)** | **93.42%** | Successfully flagged 809 out of 866 real fraudulent postings |
| **Precision** | **81.06%** | 809 true scams out of 998 flagged postings |
| **F1-Score** | **86.80%** | Harmonic mean of precision and recall |
| **ROC-AUC** | **0.9929** | Near-perfect class separation across thresholds |
| **PR-AUC (Average Precision)** | **0.9341** | Robust precision-recall curve under 4.84% positive prevalence |

### 8.3 Confusion Matrix (Threshold ≥ 25)
- **True Positives (TP)**: 809 (Correctly flagged fraudulent postings)
- **False Positives (FP)**: 189 (Legitimate postings flagged for review)
- **True Negatives (TN)**: 16,825 (Correctly cleared legitimate postings)
- **False Negatives (FN)**: 57 (Missed scams in Low Risk band)

---

## 9. Limitations & Future Calibration Strategy

1. **Initial Engineering Weights**: The current 50/30/20 weights reflect intuitive domain engineering. Future phases can employ statistical calibration (e.g. Platt scaling or isotonic regression on combined vectors).
2. **Dataset Anonymization Artifacts**: Many URLs in the historical benchmark dataset were sanitized to hashes (`#URL_...#`), artificially depressing live web features on historical rows.
3. **Impersonation Detection**: Sophisticated attackers registering lookalike domains (typosquatting) require dedicated reputation lookup APIs in Phase 6.

---

## 10. Exact Reproduction Commands

### 1. Run Unit Test Suite (39 Tests, 100% Offline)
```bash
python3 -m unittest discover -s tests -v
```

### 2. Run Unified CLI Demonstration
```bash
python3 src/risk_assessment.py --demo
```

### 3. Run CLI Demonstration in Machine-Readable JSON Mode
```bash
python3 src/risk_assessment.py --demo --json
```

### 4. Run Full Dataset Evaluation (17,880 Rows)
```bash
python3 src/risk_assessment.py --eval-dataset
```

### 5. Run Custom Posting Risk Assessment
```bash
python3 src/risk_assessment.py \
  --company "Stripe Inc." \
  --title "Senior Distributed Systems Engineer" \
  --email "jobs@stripe.com" \
  --url "https://stripe.com" \
  --description "We are seeking a senior distributed systems engineer."
```
