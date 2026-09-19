"""
AuthentiHire - Model Evaluation & Error Analysis Script
======================================================
Loads serialized models and preprocessor from models/, evaluates them on the
untouched test partition, generates performance tables, confusion matrices,
and performs structured error analysis (False Positives and False Negatives).
"""

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import argparse
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    average_precision_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
)

from src.preprocessing import prepare_train_test_splits


def evaluate_models_on_test(
    models: Dict[str, Any],
    X_test_vec: Any,
    y_test: np.ndarray,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Evaluates all models on the holdout test set and builds comparison dataframe."""
    records = []
    detailed_metrics = {}

    for name, model in models.items():
        preds = model.predict(X_test_vec)
        probs = (
            model.predict_proba(X_test_vec)[:, 1]
            if hasattr(model, "predict_proba")
            else model.decision_function(X_test_vec)
        )

        acc = accuracy_score(y_test, preds)
        prec_1 = precision_score(y_test, preds, pos_label=1, zero_division=0)
        rec_1 = recall_score(y_test, preds, pos_label=1)
        f1_1 = f1_score(y_test, preds, pos_label=1, zero_division=0)
        prauc = average_precision_score(y_test, probs)
        rocauc = roc_auc_score(y_test, probs)
        cm = confusion_matrix(y_test, preds)
        clf_rep = classification_report(
            y_test,
            preds,
            target_names=["Legitimate (0)", "Fraudulent (1)"],
            digits=4,
        )

        records.append({
            "Model": name,
            "Accuracy": acc,
            "Precision (Fraud)": prec_1,
            "Recall (Fraud)": rec_1,
            "F1 (Fraud)": f1_1,
            "PR-AUC": prauc,
            "ROC-AUC": rocauc,
        })

        detailed_metrics[name] = {
            "predictions": preds,
            "probabilities": probs,
            "confusion_matrix": cm,
            "classification_report": clf_rep,
        }

    return pd.DataFrame(records), detailed_metrics


def perform_error_analysis(
    X_test_df: pd.DataFrame,
    y_test: np.ndarray,
    preds: np.ndarray,
    probs: np.ndarray,
    model_name: str = "Logistic Regression (Balanced)",
    n_samples: int = 3,
) -> None:
    """Performs deep forensic error analysis on False Positives and False Negatives."""
    print(f"\n{'='*30} ERROR ANALYSIS: {model_name} {'='*30}")

    # False Positives: True Real (0), Predicted Fake (1)
    fp_indices = np.where((y_test == 0) & (preds == 1))[0]
    # False Negatives: True Fake (1), Predicted Real (0)
    fn_indices = np.where((y_test == 1) & (preds == 0))[0]

    print(f"\nTotal False Positives (Real jobs misclassified as Fake): {len(fp_indices)}")
    print(f"Total False Negatives (Fake jobs misclassified as Real): {len(fn_indices)}")

    print(f"\n--- SAMPLE FALSE POSITIVES (Legitimate postings flagged as fraudulent) ---")
    for i in range(min(n_samples, len(fp_indices))):
        idx = fp_indices[i]
        row = X_test_df.iloc[idx]
        prob = probs[idx]
        print(f"\n[FP #{i+1}] Title: {row.get('title', 'N/A')}")
        print(f"  Confidence (Fraud Prob): {prob:.4f}")
        print(f"  Company Profile Missing: {row.get('has_company_profile', 0) == 0}")
        print(f"  Company Logo Present:    {row.get('has_company_logo', 0) == 1}")
        print(f"  Telecommuting / Remote:  {row.get('telecommuting', 0) == 1}")
        desc = str(row.get('description', ''))[:220].replace('\n', ' ')
        print(f"  Description Snippet:     {desc}...")

    print(f"\n--- SAMPLE FALSE NEGATIVES (Fraudulent postings that bypassed detection) ---")
    for i in range(min(n_samples, len(fn_indices))):
        idx = fn_indices[i]
        row = X_test_df.iloc[idx]
        prob = probs[idx]
        print(f"\n[FN #{i+1}] Title: {row.get('title', 'N/A')}")
        print(f"  Confidence (Fraud Prob): {prob:.4f}")
        print(f"  Company Profile Missing: {row.get('has_company_profile', 0) == 0}")
        print(f"  Company Logo Present:    {row.get('has_company_logo', 0) == 1}")
        print(f"  Telecommuting / Remote:  {row.get('telecommuting', 0) == 1}")
        desc = str(row.get('description', ''))[:220].replace('\n', ' ')
        print(f"  Description Snippet:     {desc}...")


def run_evaluation(
    data_path: str = "data/fake_job_postings.csv",
    models_dir: str = "models",
    random_state: int = 42,
) -> None:
    """Loads holdout test partition and saved models, then runs full evaluation."""
    preprocessor_path = os.path.join(models_dir, "preprocessor.joblib")
    if not os.path.exists(preprocessor_path):
        raise FileNotFoundError(f"Fitted preprocessor not found at {preprocessor_path}. Run src/train.py first.")

    splits = prepare_train_test_splits(
        csv_path=data_path,
        test_size=0.2,
        random_state=random_state,
        drop_duplicates=True,
    )
    X_test_df = splits["X_test"]
    y_test = splits["y_test"].values
    preprocessor = joblib.load(preprocessor_path)

    X_test_vec, _ = preprocessor.transform(X_test_df)

    # Load trained models
    model_files = {
        "Logistic Regression (Balanced)": "logistic_regression.joblib",
        "Multinomial Naive Bayes": "multinomial_nb.joblib",
        "Random Forest (Balanced)": "random_forest.joblib",
    }

    models = {}
    for name, fname in model_files.items():
        fpath = os.path.join(models_dir, fname)
        if os.path.exists(fpath):
            models[name] = joblib.load(fpath)
        else:
            print(f"Warning: {fpath} not found.")

    comparison_df, detailed_metrics = evaluate_models_on_test(models, X_test_vec, y_test)

    print("\n" + "=" * 90)
    print("                      AUTHENTIHIRE MODEL COMPARISON TABLE (TEST SET)")
    print("=" * 90)
    print(comparison_df.to_string(index=False))

    print("\n" + "=" * 90)
    print("                     CONFUSION MATRICES & CLASSIFICATION REPORTS")
    print("=" * 90)
    for name, detail in detailed_metrics.items():
        print(f"\n>>> Model: {name}")
        cm = detail["confusion_matrix"]
        print(f"Confusion Matrix:\n  [[TN={cm[0,0]:4d}, FP={cm[0,1]:3d}],\n   [FN={cm[1,0]:4d}, TP={cm[1,1]:3d}]]")
        print("\nClassification Report:")
        print(detail["classification_report"])

    # Perform error analysis on best performing model for fraud recall (Logistic Regression)
    if "Logistic Regression (Balanced)" in detailed_metrics:
        lr_det = detailed_metrics["Logistic Regression (Balanced)"]
        perform_error_analysis(
            X_test_df=X_test_df,
            y_test=y_test,
            preds=lr_det["predictions"],
            probs=lr_det["probabilities"],
            model_name="Logistic Regression (Balanced)",
        )

    # Perform error analysis on Random Forest for precision comparison
    if "Random Forest (Balanced)" in detailed_metrics:
        rf_det = detailed_metrics["Random Forest (Balanced)"]
        perform_error_analysis(
            X_test_df=X_test_df,
            y_test=y_test,
            preds=rf_det["predictions"],
            probs=rf_det["probabilities"],
            model_name="Random Forest (Balanced)",
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate AuthentiHire Fraud Detection Models")
    parser.add_argument("--data_path", type=str, default="data/fake_job_postings.csv")
    parser.add_argument("--models_dir", type=str, default="models")
    parser.add_argument("--random_state", type=int, default=42)
    args = parser.parse_args()

    run_evaluation(
        data_path=args.data_path,
        models_dir=args.models_dir,
        random_state=args.random_state,
    )
