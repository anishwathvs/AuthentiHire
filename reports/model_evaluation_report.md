# AuthentiHire — Comprehensive Model Training, Calibration & Evaluation Report

**Project:** AuthentiHire — Fraudulent Job & Internship Detection System  
**Phases Covered:** Phase 2 (Model Training & Evaluation) & Phase 2.5 (Threshold Tuning & Probability Calibration)  
**Primary Evaluated Architecture:** Balanced Logistic Regression + CalibratedClassifierCV (Platt Sigmoid Scaling)  

---

## 1. Executive Summary & Why Threshold Tuning / Calibration Was Needed

In fraud and cyber-scam detection, two interrelated domain factors break default modeling assumptions:
1. **Extreme Class Imbalance (19.65 : 1):** Fraudulent postings comprise only **4.84%** of the population. Using an unweighted loss or arbitrary $0.50$ decision cutoff forces models to optimize for majority-class accuracy while letting scams pass undetected.
2. **Probability Distortion via Class-Weighted Objectives:** Applying `class_weight='balanced'` in Logistic Regression shifts the intercept $\beta_0$ by approximately $\ln(w_1/w_0) \approx \ln(19.65) \approx +2.98$. While this empowers the model to separate fraud and achieve high recall, the raw `predict_proba()` output represents a hypothetical balanced 50:50 distribution rather than real-world posterior scam odds.
3. **Probability Calibration (Platt Sigmoid Scaling):** Applying `CalibratedClassifierCV` via 5-fold cross-validation maps the uncalibrated linear scores back to true posterior probabilities, cutting the test **Brier score by 49.1% (from 0.03035 to 0.01545)**.
4. **Operating Threshold Selection:** Once probabilities are calibrated to true posteriors, an operational decision boundary ($t = 0.25$) captures **78.95% of scams** with **72.97% precision** and **only 1.5% false positive rate**. For high-recall operations, $t = 0.20$ captures **80.12% of scams**.

---

## 2. Threshold Comparison Table (5-Fold Stratified Cross-Validation on $X_{train}$)

Threshold sweep computed strictly on training out-of-fold predictions ($N = 14,079$):

### 2.1 Calibrated Logistic Regression (Platt Sigmoid)

| Threshold | CV Accuracy | Fraud Precision | Fraud Recall | Fraud F1 | FPR (False Alarm Rate) | FNR (Miss Rate) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `0.20` | 0.9723 | 0.6801 | **0.8131** | 0.7407 | 0.0196 (1.96%) | 0.1869 (18.69%) |
| **`0.25` (Selected)** | **0.9765** | **0.7411** | **0.7942** | **0.7667** | **0.0142 (1.42%)** | **0.2058 (20.58%)** |
| `0.30` | 0.9784 | 0.7831 | 0.7693 | 0.7761 | 0.0109 (1.09%) | 0.2307 (23.07%) |
| `0.35` | 0.9794 | 0.8140 | 0.7474 | 0.7793 | 0.0087 (0.87%) | 0.2526 (25.26%) |
| `0.40` | 0.9800 | 0.8424 | 0.7255 | 0.7796 | 0.0069 (0.69%) | 0.2745 (27.45%) |
| `0.45` | 0.9806 | 0.8652 | 0.7124 | 0.7814 | 0.0057 (0.57%) | 0.2876 (28.76%) |
| `0.50` | 0.9808 | 0.8879 | 0.6934 | 0.7787 | 0.0045 (0.45%) | 0.3066 (30.66%) |
| `0.55` | 0.9806 | 0.9055 | 0.6715 | 0.7712 | 0.0036 (0.36%) | 0.3285 (32.85%) |
| `0.60` | 0.9802 | 0.9177 | 0.6511 | 0.7617 | 0.0030 (0.30%) | 0.3489 (34.89%) |
| `0.70` | 0.9772 | 0.9292 | 0.5752 | 0.7106 | 0.0022 (0.22%) | 0.4248 (42.48%) |
| `0.80` | 0.9739 | 0.9543 | 0.4876 | 0.6454 | 0.0012 (0.12%) | 0.5124 (51.24%) |

### 2.2 Uncalibrated Balanced Logistic Regression (Reference)

| Threshold | CV Accuracy | Fraud Precision | Fraud Recall | Fraud F1 | FPR | FNR |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `0.50` (Raw Cutoff) | 0.9683 | 0.6289 | **0.8511** | 0.7233 | 0.0257 (2.57%) | 0.1489 (14.89%) |
| `0.60` (Balanced F1) | 0.9760 | 0.7298 | 0.8044 | 0.7653 | 0.0152 (1.52%) | 0.1956 (19.56%) |
| `0.70` (High Prec) | 0.9806 | 0.8377 | 0.7460 | 0.7892 | 0.0074 (0.74%) | 0.2540 (25.40%) |

---

## 3. Probability Calibration Evaluation (Brier Scores & Reliability)

| Model Configuration | CV Brier Score ($X_{train}$) | Test Brier Score ($X_{test}$) | Probability Interpretation |
| :--- | :--- | :--- | :--- |
| **Uncalibrated Balanced LR** | `0.03230` | `0.03035` | Over-confident / shifted due to balanced class weights |
| **Calibrated Sigmoid LR** | **`0.01593`** | **`0.01545`** | **True posterior fraud probabilities (49.1% error reduction)** |

- **Reliability Assessment:** Uncalibrated balanced LR significantly over-estimates posterior fraud probability because the loss function placed a $19.65\times$ penalty on false negatives. Platt scaling (`CalibratedClassifierCV(method='sigmoid')`) resolves this, yielding tight alignment with the $y = x$ diagonal on the reliability diagram.

---

## 4. Final Untouched Holdout Test Set Performance ($N=3,520$)

Evaluated strictly once after threshold selection:

| Configuration | Threshold | Accuracy | Fraud Precision | Fraud Recall | Fraud F1 | PR-AUC | Brier Score |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Uncalibrated LR (Default 0.50)** | 0.50 | 0.9685 | 0.6282 | **0.8596** (147/171) | 0.7259 | **0.8682** | 0.03035 |
| **B. Uncalibrated LR (Tuned 0.60)** | 0.60 | 0.9759 | 0.7263 | 0.8070 (138/171) | 0.7645 | 0.8682 | 0.03035 |
| **C. Calibrated LR (Default 0.50)** | 0.50 | 0.9804 | 0.8696 | 0.7018 (120/171) | **0.7767** | 0.8639 | **0.01545** |
| **D. Calibrated LR (Selected Op $t=0.25$)** | **0.25** | **0.9756** | **0.7297** | **0.7895** (135/171) | **0.7584** | 0.8639 | **0.01545** |
| **E. Calibrated LR (High Recall $t=0.20$)** | **0.20** | **0.9724** | **0.6850** | **0.8012** (137/171) | **0.7385** | 0.8639 | **0.01545** |

### Test Confusion Matrices:
```text
Calibrated LR (Selected Threshold 0.25):
  [[TN = 3299,  FP =  50],
   [FN =   36,  TP = 135]]

Calibrated LR (High-Recall Threshold 0.20):
  [[TN = 3286,  FP =  63],
   [FN =   34,  TP = 137]]

Uncalibrated LR (Default Threshold 0.50):
  [[TN = 3262,  FP =  87],
   [FN =   24,  TP = 147]]
```

---

## 5. Rationale for Selected Operating Threshold ($t = 0.25$)

1. **Optimal Trade-Off between Protection & User Friction:**
   - At $t=0.25$, AuthentiHire captures **78.95% of fraudulent job postings** while restricting false alarms to only **50 out of 3,349 genuine jobs (1.5% FPR)**.
   - Genuine employers will experience less than a $1.5\%$ flag rate, while $4$ out of $5$ scam jobs are immediately intercepted.
2. **Interpretable Calibrated Probabilities:**
   - Because probabilities are calibrated, when the model outputs a probability of $0.25$, it reflects that postings with similar linguistic profiles have approximately a $25\%$ empirical fraud rate — far higher than the $4.84\%$ baseline.
3. **Multi-Tier Risk Tiers Supported:**
   - **$< 0.125$:** Low Risk (Clean posting, verified patterns)
   - **$0.125 - 0.249$:** Moderate Suspicion (Requires manual review / warning badge)
   - **$0.250 - 0.599$:** High Risk (Exceeds operating threshold; quarantined)
   - **$\ge 0.600$:** Severe Risk (High confidence scam; blocked)

---

## 6. Limitations

1. **Non-Universal Optimality:** The $0.25$ threshold is an operational project choice. Organizations with zero-tolerance for scams can lower the threshold to $0.15–0.20$, accepting more manual false alarm reviews.
2. **Text-Only Vulnerability to Plagiarized Real Text:** Scammers who copy verbatim real corporate job postings cannot be caught by text TF-IDF alone; subsequent phases (company domain verification, external email matching) will be essential.
