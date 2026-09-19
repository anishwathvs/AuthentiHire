# AuthentiHire — Phase 3 Rule-Based Scam Detection Engine Report

**Project:** AuthentiHire — Fraudulent Job & Internship Detection System  
**Phase:** Phase 3 — Explainable Rule-Based Scam Detection Engine  
**Module:** `src/rule_engine.py`  
**Test Suite:** `tests/test_rule_engine.py`  

---

## 1. Architecture Overview

The AuthentiHire Rule Engine is an explainable, deterministic heuristic system that identifies explicit scam patterns in job and internship postings.

### Design Principles:
1. **Complete Decoupling:** The rule engine operates completely independently from the ML statistical classifier. It evaluates postings solely on observable textual evidence without access to ground truth labels or ML probabilities.
2. **First-Class Explainability:** Every rule evaluation returns structured diagnostic metadata (`rule_id`, `rule_name`, `category`, `severity`, `score`, human-readable `explanation`, and extracted `evidence` snippet).
3. **Anti-Double-Counting Guardrails:** Prevents runaway score compounding when multiple rules detect facets of the same underlying phrase by enforcing category-level maximum score caps.
4. **Extensible Registry:** Rules are instantiated as self-contained `Rule` dataclass objects with isolated detection functions.

---

## 2. Rule Catalogue

The engine implements **13 distinct rules** across **10 functional categories**:

| Rule ID | Rule Name | Category | Severity | Base Score | Description |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `PAY_001` | Upfront Registration / Application Fee | Payment Request | HIGH | +20 | Demands registration, training, or onboarding fees prior to employment. |
| `PAY_002` | Advance Check Equipment Purchase | Payment Request | CRITICAL | +25 | Promotes cashier's check / fake-check advance-fee equipment schemes. |
| `PAY_003` | Untraceable Payment Channel Request | Payment Request | HIGH | +18 | Requests payment via wire transfer, cryptocurrency, or gift cards. |
| `FIN_001` | Direct Banking Credentials Request | Financial Credentials | CRITICAL | +25 | Solicits online banking login, PIN, OTP, or credit card numbers upfront. |
| `ID_001` | Premature Government ID Solicitation | Identity Documents | MEDIUM | +12 | Solicits SSN, passport, or driver's license scans during initial application. |
| `COMP_001`| Unrealistic High Compensation Claim | Compensation | MEDIUM | +10 | Promises astronomical daily/weekly income, paid vacations, or guaranteed sums. |
| `EXP_001` | No Experience with High Compensation | Compensation | MEDIUM | +12 | Pairs 'no experience required' with high hourly pay or clerical work. |
| `URG_001` | High-Pressure Urgency Tactics | Urgency & Pressure | LOW | +6 | Uses artificial scarcity (instant hiring without interview, expiring slots). |
| `COMM_001`| Exclusive Instant Messaging Interviews | Communication Channels | HIGH | +16 | Mandates conducting interviews exclusively via Telegram or WhatsApp. |
| `EMAIL_001`| Free Webmail Used for Corporate Role | Contact Information | LOW | +5 | Recruiter uses free webmail (`@gmail.com`, `@yahoo.com`) for a corporate role. |
| `URL_001` | Suspicious / Shortened Link Structure | URL Risk | MEDIUM | +8 | Embeds URL shorteners (`bit.ly`, `tinyurl`) or raw IP address links. |
| `CO_001` | Completely Sparse Company Metadata | Company Information | LOW | +6 | Lacks company profile, logo, and screening questions with brief description. |
| `GEN_001` | Recognized Scam Archetype | Job Description Quality| HIGH | +15 | Matches recognized scam archetypes (package reshipping, payment forwarding). |

---

## 3. Scoring Methodology & Suspicion Bands

Points are awarded based on rule severity:
- **LOW Severity:** +4 to +6 points
- **MEDIUM Severity:** +8 to +12 points
- **HIGH Severity:** +15 to +20 points
- **CRITICAL Severity:** +25 points

### Rule-Based Suspicion Levels:
- **Clean / No Suspicious Patterns ($0$ pts):** No heuristic scam rules triggered.
- **Low Suspicion ($1 - 14$ pts):** Minor weak signals (e.g. general urgency phrasing or sparse profile).
- **Moderate Suspicion ($15 - 29$ pts):** Actionable scam indicators present (e.g. excessive compensation claims or template archetypes).
- **High Suspicion ($\ge 30$ pts):** Multiple critical/high severity scam rules triggered (e.g. upfront fee + fake check + crypto demand).

---

## 4. Anti-Double-Counting Methodology

To prevent a single scam phrase (e.g. *"Pay a $500 registration fee via wire transfer immediately"*) from triggering multiple rules and artificially generating 60+ points, the engine implements **Category-Level Score Caps**:

$$\text{Capped Score} = \sum_{\text{cat} \in \text{Categories}} \min\left(\sum_{r \in \text{cat}} \text{Score}(r), \text{Cap}(\text{cat})\right)$$

| Category | Maximum Allowable Category Cap |
| :--- | :---: |
| Payment Request | 30 pts |
| Financial Credentials | 30 pts |
| Compensation | 18 pts |
| Identity Documents | 18 pts |
| Communication Channels | 20 pts |
| Job Description Quality | 20 pts |
| URL Risk | 12 pts |
| Urgency & Pressure | 10 pts |
| Contact Information | 10 pts |
| Company Information | 8 pts |

---

## 5. Unit Test Suite Results (`tests/test_rule_engine.py`)

All 10 required test scenarios passed:

| Test Case | Scenario Description | Expected Outcome | Result |
| :--- | :--- | :--- | :---: |
| `test_01` | Clearly legitimate software engineering job | Clean ($0$ pts) | **PASS** |
| `test_02` | Upfront registration fee / onboarding fee scam | `PAY_001` triggered | **PASS** |
| `test_03` | High salary ($65/hr) + No experience scam | `EXP_001` / `COMP_001` triggered | **PASS** |
| `test_04` | Online banking login / PIN request | `FIN_001` triggered ($\ge 20$ pts) | **PASS** |
| `test_05` | Urgency-only posting | `URG_001` triggered (Low Suspicion $<15$ pts) | **PASS** |
| `test_06` | Exclusive Telegram interview demand | `COMM_001` triggered | **PASS** |
| `test_07` | Obfuscated link (`bit.ly`) | `URL_001` triggered | **PASS** |
| `test_08` | Completely sparse company metadata | `CO_001` triggered | **PASS** |
| `test_09` | Compound multi-signal scam | Anti-double-counting capped score applied | **PASS** |
| `test_10` | Legitimate job with payment & WhatsApp keywords | Clean ($0$ pts, zero false triggers) | **PASS** |

---

## 6. Real Dataset Evaluation (`data/fake_job_postings.csv`)

Evaluated across all **17,599 deduplicated postings** without providing ground truth labels to the engine:

### 6.1 Dataset Overview
- **Total Postings Evaluated:** 17,599
- **Postings Triggering $\ge 1$ Rule:** 129 (0.73% of corpus)
- **Average Suspicion Score (All):** 0.06 pts
- **Average Suspicion Score (Legitimate, $N=16,743$):** 0.03 pts
- **Average Suspicion Score (Fraudulent, $N=856$):** 0.60 pts

### 6.2 Suspicion Level Distribution by Ground Truth Class
| Suspicion Level | Legitimate (0) | Fraudulent (1) | Total |
| :--- | :---: | :---: | :---: |
| **Clean ($0$ pts)** | 16,663 | 807 | 17,470 |
| **Low Suspicion ($1 - 14$ pts)** | 78 | 36 | 114 |
| **Moderate Suspicion ($15 - 29$ pts)** | 2 | 13 | 15 |
| **Total** | **16,743** | **856** | **17,599** |

---

## 7. Individual Rule Performance & Precision

| Rule ID | Rule Name | Category | Total Triggered | Real Triggers | Fake Triggers | Precision | Recall |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **`COMP_001`** | Unrealistic High Compensation | Compensation | 10 | 0 | **10** | **100.00%** | 1.17% |
| **`GEN_001`** | Scam Archetypes (Reshipping/Forwarding) | Description Quality | 15 | 2 | **13** | **86.67%** | 1.52% |
| **`URG_001`** | High-Pressure Urgency Tactics | Urgency & Pressure | 106 | 71 | **35** | **33.02%** | 4.09% |
| **`EXP_001`** | No Experience with High Compensation | Compensation | 2 | 1 | **1** | **50.00%** | 0.12% |
| **`URL_001`** | Suspicious / Shortened Link Structure | URL Risk | 6 | 6 | **0** | **0.00%** | 0.00% |

### Performance at Operational Suspicion Thresholds:
- **At Score $\ge 15$ (Moderate/High Suspicion):**
  - **Precision:** **86.67%** (13 True Positives, only 2 False Positives across 16,743 real jobs)
  - **Recall:** 1.52%
  - **Accuracy:** 95.20%
- **At Score $\ge 6$ (Low/Moderate/High):**
  - **Precision:** **37.98%** (49 True Positives, 80 False Positives)
  - **Recall:** 5.72%

---

## 8. Error Analysis & Interpretability

### 8.1 High-Precision True Positive Example
```text
Title: "Work From Home Part Time Customer Service Representative"
Triggered Rules:
  - [COMP_001] Unrealistic High Compensation Claim (+10 pts)
    Evidence: "make anywhere from 600-115,000$ a month"
  - [GEN_001] Recognized Scam Archetype (+15 pts)
    Evidence: "be your own boss and set your own schedule"
Rule Suspicion Score: 25 pts (Moderate Suspicion)
Ground Truth: FRAUDULENT (1)
```

### 8.2 False Positive Analysis
```text
Title: "Retail Store Sales Associate"
Triggered Rule:
  - [URG_001] High-Pressure Urgency Tactics (+6 pts)
    Evidence: "urgent hiring! Immediate opening! Apply now"
Rule Suspicion Score: 6 pts (Low Suspicion)
Ground Truth: LEGITIMATE (0)
```
*Rationale:* Legitimate retail and seasonal employers occasionally use urgent hiring phrases. Because `URG_001` carries only 6 points (Low Suspicion), the system avoids flagging this posting as high risk.

### 8.3 False Negative Analysis
```text
Title: "Executive Chef"
Ground Truth: FRAUDULENT (1)
Rule Engine Result: Clean (0 pts)
```
*Rationale:* The scammer copy-pasted authentic culinary management job descriptions with standard industry jargon. Because no overt wire transfer, cashier check, or Telegram links were embedded in the raw text, deterministic rules intentionally stay silent, relying on statistical ML classifiers.

---

## 9. Limitations & Complementary Role with ML

1. **Precision vs Coverage Trade-Off:** The rule engine functions as a **high-precision deterministic alert system** ($86.67\% - 100\%$ precision on high-severity rules). It cannot and should not replace statistical ML for identifying subtle linguistic shifts in clean-looking fake jobs.
2. **Text-Only Scope in Phase 3:** In this phase, external link verification and domain lookups were deliberately avoided to maintain an offline evaluation baseline.

---

## 10. CLI Usage Demonstration

```bash
# 1. Run interactive demo
python3 src/rule_engine.py --demo

# 2. Evaluate a custom job posting via CLI
python3 src/rule_engine.py --title "Data Entry Assistant" --description "Immediate hiring! Earn $4,000 per week guaranteed. Cashier check sent for home equipment purchase."
```
