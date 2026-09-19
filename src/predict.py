"""
AuthentiHire - Calibrated Inference & Prediction Engine
======================================================
Loads the calibrated ML model, preprocessor, and operational threshold configuration
to deliver probabilistic fraud classification.

Outputs:
- predicted_class: 0 (Legitimate) or 1 (Fraudulent)
- prediction_label: "FRAUDULENT" or "LEGITIMATE"
- fraud_probability: Calibrated float between 0.0000 and 1.0000
- decision_threshold: Operating decision boundary (e.g. 0.25)
- model_name: Name of the active model pipeline
- risk_level: Multi-tiered risk tier
"""

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import argparse
import json
import joblib
import pandas as pd
from typing import Dict, Any, List, Optional

from src.preprocessing import (
    clean_text,
    build_combined_text,
    TEXT_COLUMNS,
    JobPostingPreprocessor,
)


class JobPostingPredictor:
    """Production-grade inference engine with calibrated probabilities and customizable operating thresholds."""

    def __init__(
        self,
        model_path: Optional[str] = None,
        preprocessor_path: Optional[str] = None,
        config_path: str = "models/threshold_config.json",
        custom_threshold: Optional[float] = None,
    ) -> None:
        # Load threshold configuration if present
        self.config = {}
        if os.path.exists(config_path):
            with open(config_path, "r") as f:
                self.config = json.load(f)

        # Determine model path
        if model_path is None:
            model_file = self.config.get("model_file", "logistic_regression_calibrated.joblib")
            model_path = os.path.join("models", model_file)
            if not os.path.exists(model_path):
                model_path = "models/logistic_regression.joblib"

        # Determine preprocessor path
        if preprocessor_path is None:
            preprocessor_file = self.config.get("preprocessor_file", "preprocessor.joblib")
            preprocessor_path = os.path.join("models", preprocessor_file)

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model artifact not found at {model_path}. Run src/train.py first.")
        if not os.path.exists(preprocessor_path):
            raise FileNotFoundError(f"Preprocessor artifact not found at {preprocessor_path}. Run src/train.py first.")

        self.model = joblib.load(model_path)
        self.preprocessor: JobPostingPreprocessor = joblib.load(preprocessor_path)
        self.model_name = self.config.get("model_name", os.path.basename(model_path))

        # Set decision threshold
        if custom_threshold is not None:
            self.decision_threshold = float(custom_threshold)
        else:
            self.decision_threshold = float(self.config.get("selected_operating_threshold", 0.25))

    def _format_input(self, posting: Dict[str, Any]) -> pd.DataFrame:
        """Standardizes input posting dictionary into a single-row DataFrame."""
        standard_fields = {
            "title": str(posting.get("title", "") or ""),
            "company_profile": str(posting.get("company_profile", "") or ""),
            "description": str(posting.get("description", "") or ""),
            "requirements": str(posting.get("requirements", "") or ""),
            "benefits": str(posting.get("benefits", "") or ""),
            "telecommuting": int(posting.get("telecommuting", 0)),
            "has_company_logo": int(posting.get("has_company_logo", 1 if posting.get("company_profile") else 0)),
            "has_questions": int(posting.get("has_questions", 0)),
            "salary_range": posting.get("salary_range", None),
            "employment_type": posting.get("employment_type", "Missing"),
            "required_experience": posting.get("required_experience", "Missing"),
            "required_education": posting.get("required_education", "Missing"),
            "industry": posting.get("industry", "Missing"),
            "function": posting.get("function", "Missing"),
            "location": posting.get("location", "Missing"),
        }
        df = pd.DataFrame([standard_fields])
        df["combined_text"] = build_combined_text(df, TEXT_COLUMNS)
        return df

    def predict_single(self, posting: Dict[str, Any]) -> Dict[str, Any]:
        """Classifies a job posting, returning calibrated probability and thresholded label."""
        df = self._format_input(posting)
        X_vec, _ = self.preprocessor.transform(df)

        if hasattr(self.model, "predict_proba"):
            probabilities = self.model.predict_proba(X_vec)[0]
            fraud_prob = float(probabilities[1])
            legit_prob = float(probabilities[0])
        else:
            decision = float(self.model.decision_function(X_vec)[0])
            fraud_prob = float(1.0 / (1.0 + (2.718281828459045 ** (-decision))))
            legit_prob = float(1.0 - fraud_prob)

        # Apply calibrated operating threshold
        pred_class = 1 if fraud_prob >= self.decision_threshold else 0
        pred_label = "FRAUDULENT" if pred_class == 1 else "LEGITIMATE"

        # Multi-tiered risk categorization
        if fraud_prob >= 0.60:
            risk_level = "Severe Risk"
        elif fraud_prob >= self.decision_threshold:
            risk_level = "High Risk"
        elif fraud_prob >= (self.decision_threshold / 2.0):
            risk_level = "Moderate Suspicion"
        else:
            risk_level = "Low Risk"

        return {
            "title": posting.get("title", "Untitled Posting"),
            "predicted_class": pred_class,
            "prediction": pred_label,
            "fraud_probability": round(fraud_prob, 4),
            "legitimate_probability": round(legit_prob, 4),
            "decision_threshold": self.decision_threshold,
            "risk_level": risk_level,
            "model_name": self.model_name,
        }


def run_demo():
    """Demonstrates inference using calibrated probabilities and tuned decision threshold."""
    predictor = JobPostingPredictor()

    sample_scam = {
        "title": "Data Entry Specialist - Immediate Work From Home / Payroll Assistant",
        "company_profile": "",
        "description": "We are seeking enthusiastic data entry operators and payroll assistants for remote assignments. Earn $45/hour with flexible schedules. No prior experience required! We will send a cashier's check to purchase home office equipment.",
        "requirements": "Basic typing skills, internet connection, ability to handle wire transfers, and personal bank account for verification.",
        "benefits": "High hourly payout, weekly bonuses, flexible home hours, instant hiring without interview.",
        "telecommuting": 1,
        "has_company_logo": 0,
        "has_questions": 0,
        "salary_range": "85000-110000",
    }

    sample_legit = {
        "title": "Junior Software Engineer - Backend (Python / Django)",
        "company_profile": "AuthenticTech Labs is a developer tools company building next-generation observability infrastructure. Founded in 2018, we serve over 500 enterprise clients globally.",
        "description": "We are looking for a Junior Backend Engineer to join our core telemetry pipeline team. You will build high-throughput REST APIs, write automated integration tests, and collaborate with frontend developers.",
        "requirements": "BS in Computer Science or equivalent practical experience. Proficiency in Python, understanding of relational databases (PostgreSQL), and familiarity with Git and Docker.",
        "benefits": "Competitive base salary, health insurance, 401(k) matching, 20 days PTO, annual learning stipend.",
        "telecommuting": 0,
        "has_company_logo": 1,
        "has_questions": 1,
        "salary_range": "70000-90000",
    }

    print("\n" + "=" * 80)
    print("      AUTHENTIHIRE CALIBRATED INFERENCE ENGINE (THRESHOLD = 0.25)")
    print("=" * 80)

    print("\n[Sample 1: Scam Posting]")
    res1 = predictor.predict_single(sample_scam)
    print(f"Prediction:         {res1['prediction']}")
    print(f"Fraud Probability:  {res1['fraud_probability']}")
    print(f"Decision Threshold: {res1['decision_threshold']}")
    print(f"Model:              {res1['model_name']}")
    print(f"Risk Level:         {res1['risk_level']}")

    print("\n[Sample 2: Legitimate Posting]")
    res2 = predictor.predict_single(sample_legit)
    print(f"Prediction:         {res2['prediction']}")
    print(f"Fraud Probability:  {res2['fraud_probability']}")
    print(f"Decision Threshold: {res2['decision_threshold']}")
    print(f"Model:              {res2['model_name']}")
    print(f"Risk Level:         {res2['risk_level']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict authenticity of job postings using calibrated thresholds")
    parser.add_argument("--model_path", type=str, default=None)
    parser.add_argument("--threshold", type=float, default=None)
    parser.add_argument("--title", type=str, default=None)
    parser.add_argument("--description", type=str, default=None)
    parser.add_argument("--company_profile", type=str, default=None)
    parser.add_argument("--requirements", type=str, default=None)
    parser.add_argument("--benefits", type=str, default=None)
    parser.add_argument("--demo", action="store_true", default=False)
    args = parser.parse_args()

    if args.title or args.description:
        predictor = JobPostingPredictor(model_path=args.model_path, custom_threshold=args.threshold)
        posting_dict = {
            "title": args.title or "",
            "company_profile": args.company_profile or "",
            "description": args.description or "",
            "requirements": args.requirements or "",
            "benefits": args.benefits or "",
        }
        result = predictor.predict_single(posting_dict)
        print(f"Prediction:         {result['prediction']}")
        print(f"Fraud Probability:  {result['fraud_probability']}")
        print(f"Decision Threshold: {result['decision_threshold']}")
        print(f"Model:              {result['model_name']}")
        print(f"Risk Level:         {result['risk_level']}")
    else:
        run_demo()
