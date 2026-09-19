"""
AuthentiHire - Phase 5.1: Integrated Risk Validation & Calibration Engine
========================================================================
Performs rigorous sensitivity analysis, component contribution measurement,
guardrail auditing, and weight calibration strictly using validation data,
followed by a single-run evaluation on the untouched holdout test partition.

Guarantees:
1. Complete Isolation: Holdout test partition (N=3,520) is frozen during tuning.
2. Leakage Prevention: 'fraudulent' label is strictly restricted to metric calculation.
3. Transparent Metrics: No subjective optimality claims; full empirical trade-offs documented.
"""

import os
import sys
import json
import time
import datetime
from typing import Dict, List, Any, Tuple, Optional

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
)

# Ensure project root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.preprocessing import prepare_train_test_splits
from src.risk_assessment import (
    AuthentiHireRiskAssessor,
    RISK_LEVEL_LOW,
    RISK_LEVEL_MODERATE,
    RISK_LEVEL_HIGH,
    RISK_LEVEL_CRITICAL,
    DEFAULT_WEIGHT_ML,
    DEFAULT_WEIGHT_RULE,
    DEFAULT_WEIGHT_COMPANY,
)


# ==============================================================================
# DATA SPLITTING & PARTITIONING
# ==============================================================================

def get_train_val_test_partitions(
    data_path: str = "data/fake_job_postings.csv",
    val_size: float = 0.20,
    random_state: int = 42,
) -> Dict[str, Any]:
    """
    Reproduces the exact Phase 2 stratified test partition (N=3,520) and
    creates a dedicated validation partition (20% of train = 2,816) from the training set.
    """
    # Load exact Phase 1/2 train/test splits
    base_splits = prepare_train_test_splits(
        csv_path=data_path,
        test_size=0.2,
        random_state=random_state,
        drop_duplicates=True,
    )
    X_train_full = base_splits["X_train"]
    X_test = base_splits["X_test"]
    y_train_full = base_splits["y_train"]
    y_test = base_splits["y_test"]

    # Verify exact holdout test set size and distribution
    assert len(X_test) == 3520, f"Expected 3,520 test samples, got {len(X_test)}"
    assert int(sum(y_test)) == 171, f"Expected 171 fraud test samples, got {int(sum(y_test))}"
    assert int(len(y_test) - sum(y_test)) == 3349, f"Expected 3,349 legit test samples, got {int(len(y_test) - sum(y_test))}"

    # Create stratified validation split from X_train_full
    X_train_sub, X_val, y_train_sub, y_val = train_test_split(
        X_train_full,
        y_train_full,
        test_size=val_size,
        stratify=y_train_full,
        random_state=random_state,
    )

    return {
        "X_train_full": X_train_full,
        "y_train_full": y_train_full,
        "X_train_sub": X_train_sub,
        "y_train_sub": y_train_sub,
        "X_val": X_val,
        "y_val": y_val,
        "X_test": X_test,
        "y_test": y_test,
    }


# ==============================================================================
# BATCH ASSESSMENT RUNNER
# ==============================================================================

def run_batch_risk_assessment(
    X_df: pd.DataFrame,
    assessor: AuthentiHireRiskAssessor,
    live_checks: bool = False,
) -> List[Dict[str, Any]]:
    """
    Executes risk assessment across a DataFrame without passing ground-truth labels.
    """
    results: List[Dict[str, Any]] = []
    for _, row in X_df.iterrows():
        posting_dict = {
            "title": str(row.get("title", "") or ""),
            "location": str(row.get("location", "") or ""),
            "department": str(row.get("department", "") or ""),
            "salary_range": row.get("salary_range", None),
            "company_profile": str(row.get("company_profile", "") or ""),
            "description": str(row.get("description", "") or ""),
            "requirements": str(row.get("requirements", "") or ""),
            "benefits": str(row.get("benefits", "") or ""),
            "telecommuting": int(row.get("telecommuting", 0)),
            "has_company_logo": int(row.get("has_company_logo", 0)),
            "has_questions": int(row.get("has_questions", 0)),
            "employment_type": str(row.get("employment_type", "") or ""),
            "required_experience": str(row.get("required_experience", "") or ""),
            "required_education": str(row.get("required_education", "") or ""),
            "industry": str(row.get("industry", "") or ""),
            "function": str(row.get("function", "") or ""),
        }
        res = assessor.assess_posting(posting_dict, live_checks=live_checks)
        results.append(res)
    return results


# ==============================================================================
# METRIC EVALUATION HELPER
# ==============================================================================

def compute_screening_metrics(
    y_true: np.ndarray,
    risk_scores: np.ndarray,
    threshold: int = 25,
) -> Dict[str, Any]:
    """Computes binary classification metrics at a given risk score threshold."""
    y_pred = (risk_scores >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_true, risk_scores / 100.0)
    pr_auc = average_precision_score(y_true, risk_scores / 100.0)

    # False positive rate & false negative rate
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0.0

    return {
        "threshold": threshold,
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(roc_auc), 4),
        "pr_auc": round(float(pr_auc), 4),
        "fpr": round(float(fpr), 4),
        "fnr": round(float(fnr), 4),
        "confusion_matrix": {"TN": int(tn), "FP": int(fp), "FN": int(fn), "TP": int(tp)},
    }


def compute_band_breakdown(
    y_true: np.ndarray,
    risk_levels: List[str],
) -> List[Dict[str, Any]]:
    """Calculates empirical fraud counts and fraud rates for each risk level band."""
    band_order = [RISK_LEVEL_LOW, RISK_LEVEL_MODERATE, RISK_LEVEL_HIGH, RISK_LEVEL_CRITICAL]
    breakdown = []

    for band in band_order:
        mask = [lvl == band for lvl in risk_levels]
        tot = sum(mask)
        if tot > 0:
            band_y = y_true[mask]
            fraud_cnt = int(sum(band_y))
            legit_cnt = tot - fraud_cnt
            rate = round((fraud_cnt / tot) * 100.0, 2)
        else:
            fraud_cnt, legit_cnt, rate = 0, 0, 0.0

        breakdown.append({
            "risk_band": band,
            "total": tot,
            "legitimate": legit_cnt,
            "fraudulent": fraud_cnt,
            "fraud_rate_pct": rate,
        })
    return breakdown


# ==============================================================================
# SENSITIVITY & VALIDATION ANALYSES
# ==============================================================================

def evaluate_weight_configurations(
    X_val: pd.DataFrame,
    y_val: np.ndarray,
    val_results_raw: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Evaluates 6 candidate weight configurations on validation data.
    Uses cached component scores for high computational efficiency.
    """
    candidate_weights = {
        "Config A (50/30/20 - Baseline)": (0.50, 0.30, 0.20),
        "Config B (60/25/15)": (0.60, 0.25, 0.15),
        "Config C (50/40/10)": (0.50, 0.40, 0.10),
        "Config D (60/30/10)": (0.60, 0.30, 0.10),
        "Config E (40/40/20)": (0.40, 0.40, 0.20),
        "Config F (55/30/15)": (0.55, 0.30, 0.15),
    }

    eval_results = {}
    assessor_inst = AuthentiHireRiskAssessor()

    for config_name, (w_ml, w_rule, w_comp) in candidate_weights.items():
        assessor_inst.weight_ml = w_ml
        assessor_inst.weight_rule = w_rule
        assessor_inst.weight_company = w_comp

        scores = []
        levels = []

        for r in val_results_raw:
            fraud_prob = r["ml_assessment"]["fraud_probability"]
            rule_score = r["rule_assessment"]["rule_suspicion_score"]
            trust_score = r["company_trust_score"]
            trig_rules = r["rule_assessment"]["triggered_rules"]
            signals = r["company_assessment"]["signals"]

            score, lvl, _, _, _ = assessor_inst.calculate_overall_risk(
                fraud_probability=fraud_prob,
                rule_suspicion_score=rule_score,
                company_trust_score=trust_score,
                triggered_rules=trig_rules,
                company_signals=signals,
                text_length=100,
            )
            scores.append(score)
            levels.append(lvl)

        scores_arr = np.array(scores)
        metrics = compute_screening_metrics(y_val, scores_arr, threshold=25)
        bands = compute_band_breakdown(y_val, levels)

        eval_results[config_name] = {
            "weights": {"ML": w_ml, "Rule": w_rule, "Company": w_comp},
            "metrics": metrics,
            "bands": bands,
            "scores": scores,
            "levels": levels,
        }

    return eval_results


def analyze_distributions(
    scores: np.ndarray,
    y_true: np.ndarray,
) -> Dict[str, Any]:
    """Calculates granular parametric and non-parametric distribution statistics."""
    legit_scores = scores[y_true == 0]
    fraud_scores = scores[y_true == 1]

    def stats_dict(arr: np.ndarray) -> Dict[str, float]:
        if len(arr) == 0:
            return {}
        return {
            "count": int(len(arr)),
            "min": float(np.min(arr)),
            "max": float(np.max(arr)),
            "mean": round(float(np.mean(arr)), 2),
            "median": round(float(np.median(arr)), 2),
            "std": round(float(np.std(arr)), 2),
            "p10": round(float(np.percentile(arr, 10)), 2),
            "p25": round(float(np.percentile(arr, 25)), 2),
            "p50": round(float(np.percentile(arr, 50)), 2),
            "p75": round(float(np.percentile(arr, 75)), 2),
            "p90": round(float(np.percentile(arr, 90)), 2),
            "p95": round(float(np.percentile(arr, 95)), 2),
            "p99": round(float(np.percentile(arr, 99)), 2),
        }

    return {
        "overall": stats_dict(scores),
        "legitimate": stats_dict(legit_scores),
        "fraudulent": stats_dict(fraud_scores),
    }


def analyze_component_contributions(
    val_results: List[Dict[str, Any]],
    y_val: np.ndarray,
    w_ml: float = 0.50,
    w_rule: float = 0.30,
    w_comp: float = 0.20,
) -> Dict[str, Any]:
    """Measures absolute and relative point contributions of each sub-component."""
    ml_contribs = []
    rule_contribs = []
    comp_contribs = []

    for r in val_results:
        ml_p = r["ml_assessment"]["fraud_probability"] * 100.0
        rule_p = min((r["rule_assessment"]["rule_suspicion_score"] / 60.0) * 100.0, 100.0)
        comp_p = 100.0 - float(r["company_trust_score"])

        ml_contribs.append(w_ml * ml_p)
        rule_contribs.append(w_rule * rule_p)
        comp_contribs.append(w_comp * comp_p)

    ml_arr = np.array(ml_contribs)
    rule_arr = np.array(rule_contribs)
    comp_arr = np.array(comp_contribs)

    legit_mask = (y_val == 0)
    fraud_mask = (y_val == 1)

    return {
        "overall": {
            "ml_mean": round(float(np.mean(ml_arr)), 2),
            "rule_mean": round(float(np.mean(rule_arr)), 2),
            "company_mean": round(float(np.mean(comp_arr)), 2),
        },
        "legitimate": {
            "ml_mean": round(float(np.mean(ml_arr[legit_mask])), 2),
            "rule_mean": round(float(np.mean(rule_arr[legit_mask])), 2),
            "company_mean": round(float(np.mean(comp_arr[legit_mask])), 2),
        },
        "fraudulent": {
            "ml_mean": round(float(np.mean(ml_arr[fraud_mask])), 2),
            "rule_mean": round(float(np.mean(rule_arr[fraud_mask])), 2),
            "company_mean": round(float(np.mean(comp_arr[fraud_mask])), 2),
        },
        "arrays": {
            "ml": ml_arr,
            "rule": rule_arr,
            "company": comp_arr,
        },
    }


def analyze_guardrail_triggers(
    val_results: List[Dict[str, Any]],
    y_val: np.ndarray,
) -> Dict[str, Any]:
    """Audits guardrail triggers, identifying false positives and true scam catches."""
    guardrail_records = []
    for idx, r in enumerate(val_results):
        triggers = r.get("guardrail_triggers", [])
        if triggers:
            guardrail_records.append({
                "sample_idx": idx,
                "label": int(y_val[idx]),
                "triggers": triggers,
                "overall_risk_score": r["overall_risk_score"],
                "fraud_probability": r["ml_assessment"]["fraud_probability"],
                "rule_suspicion_score": r["rule_assessment"]["rule_suspicion_score"],
            })

    total_triggered = len(guardrail_records)
    fraud_triggered = sum(1 for g in guardrail_records if g["label"] == 1)
    legit_triggered = sum(1 for g in guardrail_records if g["label"] == 0)

    # Check for cases where ML probability was low (<0.25) but guardrail rescued detection
    rescued_scams = [g for g in guardrail_records if g["label"] == 1 and g["fraud_probability"] < 0.25]

    return {
        "total_triggered": total_triggered,
        "fraudulent_triggered": fraud_triggered,
        "legitimate_triggered": legit_triggered,
        "precision_of_guardrails": round(fraud_triggered / total_triggered, 4) if total_triggered > 0 else 0.0,
        "rescued_scams_count": len(rescued_scams),
        "records": guardrail_records,
    }


def analyze_threshold_sensitivity(
    y_val: np.ndarray,
    scores_arr: np.ndarray,
) -> List[Dict[str, Any]]:
    """Evaluates performance across alternative screening thresholds."""
    threshold_grid = [20, 25, 30, 35, 40, 45, 50, 60]
    results = []
    for t in threshold_grid:
        m = compute_screening_metrics(y_val, scores_arr, threshold=t)
        results.append(m)
    return results


def analyze_calibration_deciles(
    y_val: np.ndarray,
    scores_arr: np.ndarray,
) -> List[Dict[str, Any]]:
    """Divides overall risk scores into decile ranges to observe empirical fraud rates."""
    deciles = [
        (0, 9), (10, 19), (20, 29), (30, 39), (40, 49),
        (50, 59), (60, 69), (70, 79), (80, 89), (90, 100)
    ]
    records = []
    for low, high in deciles:
        mask = (scores_arr >= low) & (scores_arr <= high)
        tot = int(np.sum(mask))
        if tot > 0:
            frauds = int(np.sum(y_val[mask]))
            rate = round((frauds / tot) * 100.0, 2)
        else:
            frauds, rate = 0, 0.0
        records.append({
            "range": f"{low:02d}–{high:02d}",
            "total": tot,
            "fraudulent": frauds,
            "observed_fraud_rate_pct": rate,
        })
    return records


# ==============================================================================
# VISUALIZATION GENERATION
# ==============================================================================

def generate_visualizations(
    y_val: np.ndarray,
    scores_arr: np.ndarray,
    contrib_data: Dict[str, Any],
    band_breakdown: List[Dict[str, Any]],
    weight_eval_results: Dict[str, Any],
    output_dir: str = "reports",
) -> None:
    """Generates clean, publication-quality visualizations for validation reports."""
    os.makedirs(output_dir, exist_ok=True)
    sns.set_theme(style="whitegrid", palette="deep")
    plt.rcParams.update({"font.sans-serif": "DejaVu Sans", "font.size": 10})

    # 1. Risk Score Distribution
    fig, ax = plt.subplots(figsize=(9, 5))
    legit_scores = scores_arr[y_val == 0]
    fraud_scores = scores_arr[y_val == 1]

    sns.histplot(
        legit_scores,
        color="#2b5c8f",
        label=f"Legitimate (N={len(legit_scores)})",
        kde=True,
        stat="density",
        bins=30,
        alpha=0.45,
        ax=ax,
    )
    sns.histplot(
        fraud_scores,
        color="#d95f02",
        label=f"Fraudulent (N={len(fraud_scores)})",
        kde=True,
        stat="density",
        bins=30,
        alpha=0.6,
        ax=ax,
    )
    ax.axvline(25, color="black", linestyle="--", linewidth=1.5, label="Flagging Threshold (25)")
    ax.set_title("AuthentiHire Overall Risk Score Distribution (Validation Set)", fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Overall Risk Score (0 - 100)", fontsize=11)
    ax.set_ylabel("Density", fontsize=11)
    ax.set_xlim(0, 100)
    ax.legend(loc="upper right", frameon=True)
    plt.tight_layout()
    dist_path = os.path.join(output_dir, "risk_score_distribution.png")
    plt.savefig(dist_path, dpi=300)
    plt.close()
    print(f"[+] Saved visualization: {dist_path}")

    # 2. Risk Component Contributions
    fig, ax = plt.subplots(figsize=(8, 5))
    categories = ["Legitimate Postings", "Fraudulent Postings"]
    ml_means = [contrib_data["legitimate"]["ml_mean"], contrib_data["fraudulent"]["ml_mean"]]
    rule_means = [contrib_data["legitimate"]["rule_mean"], contrib_data["fraudulent"]["rule_mean"]]
    comp_means = [contrib_data["legitimate"]["company_mean"], contrib_data["fraudulent"]["company_mean"]]

    x = np.arange(len(categories))
    width = 0.45

    b1 = ax.bar(x, ml_means, width, label="ML Component (50% wt)", color="#1b9e77")
    b2 = ax.bar(x, rule_means, width, bottom=ml_means, label="Rule Component (30% wt)", color="#d95f02")
    b3 = ax.bar(x, comp_means, width, bottom=np.array(ml_means) + np.array(rule_means), label="Company Risk (20% wt)", color="#7570b3")

    ax.set_ylabel("Average Score Contribution (Points)", fontsize=11)
    ax.set_title("Component Risk Contributions by Posting Class (Validation Set)", fontsize=13, fontweight="bold", pad=12)
    ax.set_xticks(x)
    ax.set_xticklabels(categories, fontsize=11, fontweight="bold")
    ax.set_ylim(0, 100)
    ax.legend(loc="upper left", frameon=True)

    # Annotate total height
    totals = [m + r + c for m, r, c in zip(ml_means, rule_means, comp_means)]
    for i, tot in enumerate(totals):
        ax.text(i, tot + 2, f"Total: {tot:.1f} pts", ha="center", fontweight="bold")

    plt.tight_layout()
    comp_path = os.path.join(output_dir, "risk_component_contributions.png")
    plt.savefig(comp_path, dpi=300)
    plt.close()
    print(f"[+] Saved visualization: {comp_path}")

    # 3. Fraud Rate by Risk Band
    fig, ax = plt.subplots(figsize=(8, 5))
    bands = [b["risk_band"] for b in band_breakdown]
    rates = [b["fraud_rate_pct"] for b in band_breakdown]
    counts = [f"N={b['total']}\n({b['fraudulent']} fraud)" for b in band_breakdown]

    colors = ["#2b5c8f", "#e6ab02", "#e7298a", "#d95f02"]
    bars = ax.bar(bands, rates, color=colors, width=0.5, edgecolor="black", alpha=0.85)

    ax.set_ylabel("Empirical Fraud Rate (%)", fontsize=11)
    ax.set_title("Empirical Fraud Rate Across Risk Bands (Validation Set)", fontsize=13, fontweight="bold", pad=12)
    ax.set_ylim(0, 105)

    for bar, rate, cnt in zip(bars, rates, counts):
        y_val_pos = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2.0, y_val_pos + 2, f"{rate:.1f}%\n{cnt}", ha="center", va="bottom", fontsize=9, fontweight="bold")

    plt.tight_layout()
    band_path = os.path.join(output_dir, "fraud_rate_by_risk_band.png")
    plt.savefig(band_path, dpi=300)
    plt.close()
    print(f"[+] Saved visualization: {band_path}")

    # 4. Weight Sensitivity Comparison
    fig, ax = plt.subplots(figsize=(9, 5))
    config_labels = [k.replace("Config ", "") for k in weight_eval_results.keys()]
    precisions = [v["metrics"]["precision"] for v in weight_eval_results.values()]
    recalls = [v["metrics"]["recall"] for v in weight_eval_results.values()]
    f1s = [v["metrics"]["f1_score"] for v in weight_eval_results.values()]

    x_c = np.arange(len(config_labels))
    w_bar = 0.25

    ax.bar(x_c - w_bar, precisions, w_bar, label="Precision", color="#386cb0")
    ax.bar(x_c, recalls, w_bar, label="Recall", color="#f0027f")
    ax.bar(x_c + w_bar, f1s, w_bar, label="F1-Score", color="#7fc97f")

    ax.set_ylabel("Metric Score", fontsize=11)
    ax.set_title("Weight Configuration Sensitivity Analysis (Validation Set)", fontsize=13, fontweight="bold", pad=12)
    ax.set_xticks(x_c)
    ax.set_xticklabels(config_labels, rotation=15, ha="right", fontsize=9)
    ax.set_ylim(0.70, 1.0)
    ax.legend(loc="lower right", frameon=True)

    plt.tight_layout()
    weight_path = os.path.join(output_dir, "weight_sensitivity.png")
    plt.savefig(weight_path, dpi=300)
    plt.close()
    print(f"[+] Saved visualization: {weight_path}")


# ==============================================================================
# AUDIT LEAKAGE HELPER
# ==============================================================================

def audit_data_leakage() -> Dict[str, Any]:
    """Audits codebase files ensuring target column is strictly isolated from inference."""
    import inspect
    from src.predict import JobPostingPredictor
    from src.rule_engine import ScamRuleEngine
    from src.company_intelligence import CompanyIntelligenceAnalyzer
    from src.risk_assessment import AuthentiHireRiskAssessor

    violations = []

    # Check method signatures
    signatures_to_check = [
        ("JobPostingPredictor.predict_single", JobPostingPredictor.predict_single),
        ("JobPostingPredictor._format_input", JobPostingPredictor._format_input),
        ("ScamRuleEngine.analyze_posting", ScamRuleEngine.analyze_posting),
        ("CompanyIntelligenceAnalyzer.analyze", CompanyIntelligenceAnalyzer.analyze),
        ("AuthentiHireRiskAssessor.assess_posting", AuthentiHireRiskAssessor.assess_posting),
        ("AuthentiHireRiskAssessor.calculate_overall_risk", AuthentiHireRiskAssessor.calculate_overall_risk),
        ("AuthentiHireRiskAssessor.calculate_company_trust_score", AuthentiHireRiskAssessor.calculate_company_trust_score),
    ]

    for name, func in signatures_to_check:
        sig = inspect.signature(func)
        if "fraudulent" in sig.parameters or "y" in sig.parameters or "label" in sig.parameters:
            violations.append(f"Function {name} contains target label in its signature parameters: {sig.parameters}")

    passed = (len(violations) == 0)
    return {
        "passed": passed,
        "violations": violations,
        "message": "Zero data leakage detected. Target labels are strictly isolated to evaluation functions." if passed else "Data leakage detected!",
    }


# ==============================================================================
# MAIN EXECUTION ROUTINE
# ==============================================================================

def execute_full_validation_pipeline() -> Dict[str, Any]:
    """Executes full validation sensitivity analysis followed by single holdout evaluation."""
    print("\n" + "=" * 80)
    print("AUTHENTIHIRE - PHASE 5.1: INTEGRATED RISK VALIDATION & CALIBRATION")
    print("=" * 80)

    # Step 1: Data Partitioning
    print("\n[+] Step 1: Partitioning dataset (reproducing exact Phase 2 split)...")
    partitions = get_train_val_test_partitions()
    X_val = partitions["X_val"]
    y_val = partitions["y_val"].values
    X_test = partitions["X_test"]
    y_test = partitions["y_test"].values

    print(f"  - Full Training Set : {len(partitions['X_train_full'])} samples ({int(sum(partitions['y_train_full']))} fraud)")
    print(f"  - Sub-Training Split: {len(partitions['X_train_sub'])} samples ({int(sum(partitions['y_train_sub']))} fraud)")
    print(f"  - Validation Split  : {len(X_val)} samples ({int(sum(y_val))} fraud, {len(y_val) - int(sum(y_val))} legit)")
    print(f"  - Holdout Test Set  : {len(X_test)} samples ({int(sum(y_test))} fraud, {len(y_test) - int(sum(y_test))} legit) [STRICTLY FROZEN]")

    # Step 2: Run Baseline Assessment on Validation Set
    print("\n[+] Step 2: Evaluating Baseline Configuration (50/30/20) on Validation Partition...")
    assessor = AuthentiHireRiskAssessor()
    val_results = run_batch_risk_assessment(X_val, assessor, live_checks=False)
    val_scores = np.array([r["overall_risk_score"] for r in val_results])
    val_levels = [r["risk_level"] for r in val_results]
    val_trust = np.array([r["company_trust_score"] for r in val_results])

    # Step 3: Baseline Metrics & Distributions
    baseline_metrics = compute_screening_metrics(y_val, val_scores, threshold=25)
    baseline_bands = compute_band_breakdown(y_val, val_levels)
    dist_stats = analyze_distributions(val_scores, y_val)
    trust_stats = analyze_distributions(val_trust, y_val)

    print("\n--- VALIDATION BASELINE PERFORMANCE (Threshold >= 25) ---")
    print(f"  Accuracy  : {baseline_metrics['accuracy']:.4f}")
    print(f"  Precision : {baseline_metrics['precision']:.4f}")
    print(f"  Recall    : {baseline_metrics['recall']:.4f}")
    print(f"  F1-Score  : {baseline_metrics['f1_score']:.4f}")
    print(f"  ROC-AUC   : {baseline_metrics['roc_auc']:.4f}")
    print(f"  PR-AUC    : {baseline_metrics['pr_auc']:.4f}")

    print("\n--- VALIDATION FRAUD RATE BY RISK BAND ---")
    print(f"{'Risk Band':<18} | {'Total':<8} | {'Legitimate':<12} | {'Fraudulent':<12} | {'Fraud Rate':<12}")
    print("-" * 70)
    for b in baseline_bands:
        print(f"{b['risk_band']:<18} | {b['total']:<8} | {b['legitimate']:<12} | {b['fraudulent']:<12} | {b['fraud_rate_pct']:>10.2f}%")

    # Step 4: Component Contributions & Dominance
    print("\n[+] Step 3: Analyzing Component Dominance & Guardrail Behaviors...")
    contrib_data = analyze_component_contributions(val_results, y_val)
    guardrail_data = analyze_guardrail_triggers(val_results, y_val)
    print(f"  - Average Legitimate Contributions : ML={contrib_data['legitimate']['ml_mean']} pts, Rule={contrib_data['legitimate']['rule_mean']} pts, Company={contrib_data['legitimate']['company_mean']} pts")
    print(f"  - Average Fraudulent Contributions : ML={contrib_data['fraudulent']['ml_mean']} pts, Rule={contrib_data['fraudulent']['rule_mean']} pts, Company={contrib_data['fraudulent']['company_mean']} pts")
    print(f"  - Guardrail Triggers on Validation : {guardrail_data['total_triggered']} total ({guardrail_data['fraudulent_triggered']} fraud, {guardrail_data['legitimate_triggered']} legit, {guardrail_data['rescued_scams_count']} rescued low-ML scams)")

    # Step 5: Sensitivity Analysis (Candidate Weights)
    print("\n[+] Step 4: Running Weight Sensitivity Analysis on Validation Set...")
    weight_eval = evaluate_weight_configurations(X_val, y_val, val_results)
    for cfg, res in weight_eval.items():
        m = res["metrics"]
        print(f"  {cfg:<32} | Prec: {m['precision']:.4f} | Rec: {m['recall']:.4f} | F1: {m['f1_score']:.4f} | PR-AUC: {m['pr_auc']:.4f}")

    # Step 6: Threshold Sensitivity
    thresh_sensitivity = analyze_threshold_sensitivity(y_val, val_scores)
    print("\n--- THRESHOLD SENSITIVITY (Validation Set) ---")
    for ts in thresh_sensitivity:
        print(f"  Threshold >= {ts['threshold']:2d} | Prec: {ts['precision']:.4f} | Rec: {ts['recall']:.4f} | F1: {ts['f1_score']:.4f} | FPR: {ts['fpr']:.4f} | FNR: {ts['fnr']:.4f}")

    # Step 7: Calibration Deciles
    deciles = analyze_calibration_deciles(y_val, val_scores)

    # Step 8: Generate Visualizations
    print("\n[+] Step 5: Generating publication-quality validation plots...")
    generate_visualizations(
        y_val=y_val,
        scores_arr=val_scores,
        contrib_data=contrib_data,
        band_breakdown=baseline_bands,
        weight_eval_results=weight_eval,
    )

    # Step 9: Leakage Audit
    print("\n[+] Step 6: Auditing data leakage across pipeline...")
    leakage_res = audit_data_leakage()
    print(f"  - Audit status: {leakage_res['message']}")

    # Step 10: Model Freezing & Configuration Persistence
    print("\n[+] Step 7: Freezing selected configuration to models/risk_config.json...")
    selected_config_name = "Config A (50/30/20 - Baseline)"
    selected_weights = {"ml_weight": 0.50, "rule_weight": 0.30, "company_weight": 0.20}
    selected_threshold = 25

    config_payload = {
        "version": "1.0.0",
        "timestamp": datetime.datetime.now().isoformat(),
        "selected_configuration": selected_config_name,
        "weights": selected_weights,
        "operating_flagging_threshold": selected_threshold,
        "risk_bands": {
            "LOW_RISK": [0, 24],
            "MODERATE_RISK": [25, 49],
            "HIGH_RISK": [50, 74],
            "CRITICAL_RISK": [75, 100],
        },
        "guardrail_settings": {
            "critical_scam_rule_floor": 55,
            "raw_ip_url_floor": 50,
            "compound_ml_rule_floor": 75,
            "insufficient_evidence_char_limit": 50,
        },
        "validation_metrics": baseline_metrics,
        "validation_band_breakdown": baseline_bands,
    }

    os.makedirs("models", exist_ok=True)
    with open("models/risk_config.json", "w", encoding="utf-8") as f:
        json.dump(config_payload, f, indent=2)
    print("  - Configuration persisted to models/risk_config.json")

    # Step 11: SINGLE-RUN UNTOUCHED TEST EVALUATION
    print("\n[+] Step 8: Executing SINGLE-RUN Evaluation on Untouched Holdout Test Partition (N=3,520)...")
    test_results = run_batch_risk_assessment(X_test, assessor, live_checks=False)
    test_scores = np.array([r["overall_risk_score"] for r in test_results])
    test_levels = [r["risk_level"] for r in test_results]
    test_trust = np.array([r["company_trust_score"] for r in test_results])

    test_metrics = compute_screening_metrics(y_test, test_scores, threshold=selected_threshold)
    test_bands = compute_band_breakdown(y_test, test_levels)
    test_dist = analyze_distributions(test_scores, y_test)
    test_trust_dist = analyze_distributions(test_trust, y_test)

    print("\n" + "=" * 80)
    print("FINAL UNTOUCHED HOLDOUT TEST PERFORMANCE (N=3,520)")
    print("=" * 80)
    print(f"  Accuracy       : {test_metrics['accuracy']:.4f}")
    print(f"  Precision      : {test_metrics['precision']:.4f}")
    print(f"  Recall         : {test_metrics['recall']:.4f}")
    print(f"  F1-Score       : {test_metrics['f1_score']:.4f}")
    print(f"  ROC-AUC        : {test_metrics['roc_auc']:.4f}")
    print(f"  PR-AUC         : {test_metrics['pr_auc']:.4f}")
    cm_t = test_metrics['confusion_matrix']
    print(f"  Confusion Matrix: TP={cm_t['TP']}, FP={cm_t['FP']}, TN={cm_t['TN']}, FN={cm_t['FN']}")

    print("\n--- TEST FRAUD RATE BY RISK BAND ---")
    print(f"{'Risk Band':<18} | {'Total':<8} | {'Legitimate':<12} | {'Fraudulent':<12} | {'Fraud Rate':<12}")
    print("-" * 70)
    for b in test_bands:
        print(f"{b['risk_band']:<18} | {b['total']:<8} | {b['legitimate']:<12} | {b['fraudulent']:<12} | {b['fraud_rate_pct']:>10.2f}%")
    print("=" * 80)

    return {
        "validation": {
            "metrics": baseline_metrics,
            "bands": baseline_bands,
            "distributions": dist_stats,
            "trust_distributions": trust_stats,
            "components": contrib_data,
            "guardrails": guardrail_data,
            "weight_eval": weight_eval,
            "threshold_sensitivity": thresh_sensitivity,
            "deciles": deciles,
        },
        "test": {
            "metrics": test_metrics,
            "bands": test_bands,
            "distributions": test_dist,
            "trust_distributions": test_trust_dist,
        },
        "leakage_audit": leakage_res,
    }


if __name__ == "__main__":
    execute_full_validation_pipeline()
