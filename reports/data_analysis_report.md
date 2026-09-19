# AuthentiHire — Phase 1 Dataset Analysis & Preprocessing Report

**Project:** AuthentiHire — Fraudulent Job & Internship Detection System  
**Phase:** Phase 1 — Dataset Analysis and Preprocessing  
**Dataset File:** `data/fake_job_postings.csv`  
**Status:** Completed & Verified  

---

## 1. Executive Summary

An exhaustive inspection and preprocessing evaluation was conducted on the `fake_job_postings.csv` dataset. The dataset contains **17,880 job postings** across **18 attributes**.

| Metric | Raw Dataset Value | Deduplicated Dataset Value |
| :--- | :--- | :--- |
| **Total Records** | 17,880 rows | 17,599 rows |
| **Total Features** | 18 columns | 17 columns (excluding `job_id`) |
| **Legitimate Postings (Class 0)** | 17,014 (95.16%) | 16,743 (95.14%) |
| **Fraudulent Postings (Class 1)** | 866 (4.84%) | 856 (4.86%) |
| **Class Imbalance Ratio** | **19.65 : 1** | **19.56 : 1** |
| **Exact Content Duplicates** | 281 postings | 0 (Removed) |

---

## 2. Dataset Schema & Missing Value Analysis

### 2.1 Column Types and Null Counts

| Column Name | Data Type | Null Count | Null Percentage | Role in Modeling |
| :--- | :--- | :--- | :--- | :--- |
| `job_id` | `int64` | 0 | 0.00% | **Drop** (Data leakage / arbitrary index) |
| `title` | `object` (string) | 0 | 0.00% | **Core Text** (TF-IDF) |
| `location` | `object` (string) | 346 | 1.94% | **Feature Engineering** (Extract Country & State) |
| `department` | `object` (string) | 11,547 | 64.58% | **Sparse / Drop** (High noise, free-text) |
| `salary_range` | `object` (string) | 15,012 | 83.96% | **Engineered Flag** (`has_salary_range`) |
| `company_profile` | `object` (string) | 3,308 | 18.50% | **Core Text & Binary Flag** (`has_company_profile`) |
| `description` | `object` (string) | 1 | 0.01% | **Core Text** (TF-IDF primary body) |
| `requirements` | `object` (string) | 2,696 | 15.08% | **Core Text & Binary Flag** (`has_requirements`) |
| `benefits` | `object` (string) | 7,212 | 40.34% | **Core Text & Binary Flag** (`has_benefits`) |
| `telecommuting` | `int64` | 0 | 0.00% | **Metadata Feature** (Binary flag) |
| `has_company_logo` | `int64` | 0 | 0.00% | **Strong Metadata Feature** (Binary flag) |
| `has_questions` | `int64` | 0 | 0.00% | **Strong Metadata Feature** (Binary flag) |
| `employment_type` | `object` (string) | 3,471 | 19.41% | **Categorical** (Impute `'Missing'`) |
| `required_experience`| `object` (string) | 7,050 | 39.43% | **Categorical** (Impute `'Missing'`) |
| `required_education` | `object` (string) | 8,105 | 45.33% | **Categorical** (Impute `'Missing'`) |
| `industry` | `object` (string) | 4,903 | 27.42% | **Categorical** (Impute `'Missing'`) |
| `function` | `object` (string) | 6,455 | 36.10% | **Categorical** (Impute `'Missing'`) |
| `fraudulent` | `int64` | 0 | 0.00% | **Target Variable** (Binary: 0=Real, 1=Fake) |

---

## 3. Discriminative Feature Analysis & Fraud Signals

Bivariate analysis exposed clear, high-signal statistical divergences between legitimate and fraudulent postings:

1. **Company Logo (`has_company_logo`):**
   - **Legitimate:** 81.91% have a company logo.
   - **Fraudulent:** Only 32.68% have a company logo (67.32% lack a logo).
2. **Company Profile Missingness (`company_profile`):**
   - **Legitimate:** Only 15.99% lack a company profile (84.01% provide one).
   - **Fraudulent:** 67.78% have **no company profile** whatsoever.
3. **Screening Questions (`has_questions`):**
   - **Legitimate:** 50.21% utilize screening questions.
   - **Fraudulent:** Only 28.87% include screening questions (71.13% do not).
4. **Salary Range Stated (`has_salary_range`):**
   - **Legitimate:** 15.55% state salary ranges.
   - **Fraudulent:** 25.75% state salary ranges (often lure salaries or bait ranges).
5. **Telecommuting / Remote Work (`telecommuting`):**
   - **Legitimate:** 4.13% remote.
   - **Fraudulent:** 7.39% remote (higher tendency for work-from-home lure scams).
6. **Linguistic Length Differences:**
   - Real jobs have longer, more detailed requirements (median **569 characters**) compared to fraudulent postings (median **349.5 characters**).

---

## 4. Text Fields Combination for TF-IDF

The 5 primary textual columns selected for TF-IDF vectorization:
1. `title`
2. `company_profile`
3. `description`
4. `requirements`
5. `benefits`

### Rationale:
- Scammers often embed fraudulent wording in the `title` (e.g. "Data Entry Clerk - Work From Home", "Administrative Payroll"), vague promises in `description`, or unusual wire/payment requests in `benefits`.
- By combining these fields after clean string normalization (unescaping HTML entities, removing URLs/emails, stripping HTML tags, lowercasing), the TF-IDF vectorizer captures n-grams across the full job description context without missing valuable cross-section signals.

---

## 5. Potential Data Leakage Assessment & Prevention

| Risk Area | Leakage Risk | Mitigation Implemented |
| :--- | :--- | :--- |
| **`job_id` Column** | Index clustering / temporal collection order can allow tree models to memorize ranges. | **Dropped completely** from feature matrix. |
| **Pre-Split Vectorization** | Fitting TF-IDF vocabulary on test data leaks unseen n-gram statistics into training. | **Strict train-only fit:** Vectorizer is fit on `X_train` only; `X_test` is strictly transformed. |
| **Duplicate Postings** | 281 duplicate postings could span train and test sets, leaking labels. | **Deduplicated before splitting** across all non-`job_id` columns. |
| **Categorical Imputation** | Using whole-corpus target encoding or global statistics before split. | Categorical values use `'Missing'` sentinel; any encoders fit strictly on train split. |

---

## 6. Class Imbalance Mitigation Strategy for Phase 2

Because the fraudulent class represents only **4.84%** of the dataset, accuracy is a misleading metric. In Phase 2, the following approaches are recommended:
1. **Evaluation Metrics:** Prioritize **PR-AUC (Precision-Recall Area Under Curve)**, **F1-Score (Macro / Minority)**, and **Recall (Fraudulent)** over accuracy.
2. **Cost-Sensitive Learning / Class Weighting:** Utilize `class_weight='balanced'` in models (Logistic Regression, Random Forest, LightGBM, XGBoost, CatBoost).
3. **Resampling Techniques:** Benchmark **SMOTE**, **ADASYN**, or Random Undersampling applied **strictly within training folds (via `imblearn.pipeline.Pipeline`)**.
4. **Threshold Tuning:** Optimize decision thresholds on validation sets to prioritize high fraud capture (Recall) while maintaining actionable precision.

---

## 7. Artifacts & Pipeline Deliverables

1. `src/preprocessing.py`: Complete, modular, scikit-learn compatible preprocessor (`JobPostingPreprocessor`, `clean_text`, `prepare_train_test_splits`).
2. `notebooks/01_data_analysis.ipynb`: Interactive Jupyter Notebook with all EDA visualizations and statistical verifications.
3. `data/fake_job_postings.csv`: Verified source dataset in workspace.
4. `requirements.txt`: Specified versions for scikit-learn, pandas, numpy, scipy, matplotlib, seaborn.
5. `.gitignore`: Git hygiene ignoring cached models, checkpoints, and bytecode.
6. `README.md`: Project overview and Phase 1 completion guide.
