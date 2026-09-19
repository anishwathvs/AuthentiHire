"""
AuthentiHire - Model Training Script
====================================
Trains and compares the three baseline ML models:
1. Logistic Regression (with class balancing)
2. Multinomial Naive Bayes (with Laplace smoothing)
3. Random Forest (with balanced class weights)

Uses stratified train/test data and saves serialized model artifacts
and the fitted preprocessor to the models/ directory.
"""

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import argparse
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any

from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    average_precision_score,
    roc_auc_score,
)

from src.preprocessing import prepare_train_test_splits


def perform_cross_validation(
    models: Dict[str, Any],
    X_train_vec: Any,
    y_train: np.ndarray,
    n_splits: int = 5,
    random_state: int = 42,
) -> pd.DataFrame:
    """Executes Stratified K-Fold Cross-Validation strictly on the training partition."""
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state)
    cv_records = []

    print(f"\nRunning {n_splits}-Fold Stratified Cross-Validation on Training Partition ({X_train_vec.shape[0]} samples)...")
    print("-" * 90)

    for name, model in models.items():
        acc_s, prec_s, rec_s, f1_s, prauc_s, rocauc_s = [], [], [], [], [], []

        for train_idx, val_idx in skf.split(X_train_vec, y_train):
            X_tr, y_tr = X_train_vec[train_idx], y_train[train_idx]
            X_val, y_val = X_train_vec[val_idx], y_train[val_idx]

            # Fit model on training fold only
            model.fit(X_tr, y_tr)
            preds = model.predict(X_val)
            probs = (
                model.predict_proba(X_val)[:, 1]
                if hasattr(model, "predict_proba")
                else model.decision_function(X_val)
            )

            acc_s.append(accuracy_score(y_val, preds))
            prec_s.append(precision_score(y_val, preds, pos_label=1, zero_division=0))
            rec_s.append(recall_score(y_val, preds, pos_label=1))
            f1_s.append(f1_score(y_val, preds, pos_label=1, zero_division=0))
            prauc_s.append(average_precision_score(y_val, probs))
            rocauc_s.append(roc_auc_score(y_val, probs))

        cv_records.append({
            "Model": name,
            "CV Accuracy": np.mean(acc_s),
            "CV Precision (Fraud)": np.mean(prec_s),
            "CV Recall (Fraud)": np.mean(rec_s),
            "CV F1 (Fraud)": np.mean(f1_s),
            "CV PR-AUC": np.mean(prauc_s),
            "CV ROC-AUC": np.mean(rocauc_s),
        })

    cv_df = pd.DataFrame(cv_records)
    return cv_df


def train_and_save_models(
    data_path: str = "data/fake_job_postings.csv",
    output_dir: str = "models",
    random_state: int = 42,
) -> None:
    """Main training routine: prepares splits, runs CV, fits full models on X_train, and serializes."""
    os.makedirs(output_dir, exist_ok=True)

    print(f"Loading and preprocessing dataset from: {data_path}")
    splits = prepare_train_test_splits(
        csv_path=data_path,
        test_size=0.2,
        random_state=random_state,
        drop_duplicates=True,
    )

    X_train_df = splits["X_train"]
    y_train = splits["y_train"].values
    X_test_df = splits["X_test"]
    y_test = splits["y_test"].values
    preprocessor = splits["preprocessor"]

    # Transform training and test partitions using fitted preprocessor
    X_train_vec, _ = preprocessor.transform(X_train_df)
    X_test_vec, _ = preprocessor.transform(X_test_df)

    print(f"Training feature matrix shape: {X_train_vec.shape}")
    print(f"Test feature matrix shape:     {X_test_vec.shape}")
    print(f"Train class distribution: Legitimate (0) = {(y_train == 0).sum()}, Fraudulent (1) = {(y_train == 1).sum()}")

    # Define candidate model architectures
    models = {
        "Logistic Regression (Balanced)": LogisticRegression(
            class_weight="balanced",
            max_iter=1000,
            C=1.0,
            random_state=random_state,
        ),
        "Multinomial Naive Bayes": MultinomialNB(
            alpha=0.1,
            fit_prior=True,
        ),
        "Random Forest (Balanced)": RandomForestClassifier(
            n_estimators=200,
            class_weight="balanced",
            max_depth=None,
            min_samples_split=2,
            random_state=random_state,
            n_jobs=-1,
        ),
    }

    # 1. Cross-Validation on Training Data
    cv_results = perform_cross_validation(
        models=models,
        X_train_vec=X_train_vec,
        y_train=y_train,
        n_splits=5,
        random_state=random_state,
    )
    print("\n=== STRATIFIED 5-FOLD CROSS-VALIDATION RESULTS ===")
    print(cv_results.to_string(index=False))

    # 2. Fit full models on entire X_train and serialize
    print(f"\nFitting final models on full training set and saving to '{output_dir}/'...")
    
    # Save preprocessor artifact
    preprocessor_path = os.path.join(output_dir, "preprocessor.joblib")
    joblib.dump(preprocessor, preprocessor_path)
    print(f"Saved: {preprocessor_path}")

    # Model filenames mapping
    filename_map = {
        "Logistic Regression (Balanced)": "logistic_regression.joblib",
        "Multinomial Naive Bayes": "multinomial_nb.joblib",
        "Random Forest (Balanced)": "random_forest.joblib",
    }

    for name, model in models.items():
        model.fit(X_train_vec, y_train)
        save_path = os.path.join(output_dir, filename_map[name])
        joblib.dump(model, save_path)
        print(f"Saved: {save_path}")

    print("\nModel training and artifact serialization complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train AuthentiHire Fraud Detection Models")
    parser.add_argument("--data_path", type=str, default="data/fake_job_postings.csv")
    parser.add_argument("--output_dir", type=str, default="models")
    parser.add_argument("--random_state", type=int, default=42)
    args = parser.parse_args()

    train_and_save_models(
        data_path=args.data_path,
        output_dir=args.output_dir,
        random_state=args.random_state,
    )
