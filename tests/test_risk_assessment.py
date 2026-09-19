"""
AuthentiHire - Unit Tests for Unified Risk Assessment Engine
============================================================
Tests verify ML, Rule Engine, and Company Intelligence synthesis,
Company Trust Score calculation, Overall Risk Score weighting,
anti-double-counting clustering, guardrail enforcement, and recommendations
under 100% offline mocked conditions.
"""

import unittest
from unittest.mock import MagicMock, patch
import os
import sys

from src.risk_assessment import (
    AuthentiHireRiskAssessor,
    RISK_LEVEL_LOW,
    RISK_LEVEL_MODERATE,
    RISK_LEVEL_HIGH,
    RISK_LEVEL_CRITICAL,
    STATUS_CLEAR,
    STATUS_LOW_RISK,
    STATUS_REVIEW_RECOMMENDED,
    STATUS_HIGH_RISK,
    STATUS_INSUFFICIENT_EVIDENCE,
)


class TestRiskAssessment(unittest.TestCase):
    """Unit tests for AuthentiHireRiskAssessor."""

    def setUp(self):
        self.mock_predictor = MagicMock()
        self.mock_rule_engine = MagicMock()
        self.mock_company_analyzer = MagicMock()

        self.assessor = AuthentiHireRiskAssessor(
            predictor=self.mock_predictor,
            rule_engine=self.mock_rule_engine,
            company_analyzer=self.mock_company_analyzer,
            weight_ml=0.50,
            weight_rule=0.30,
            weight_company=0.20,
        )

    # 1. Clearly Legitimate Posting (Low ML, No Rules, Verified Company)
    def test_01_clearly_legitimate_posting(self):
        self.mock_predictor.predict_single.return_value = {
            "fraud_probability": 0.02,
            "decision_threshold": 0.25,
            "predicted_class": 0,
            "prediction_label": "LEGITIMATE",
            "model_name": "logistic_regression_calibrated.joblib",
        }
        self.mock_rule_engine.analyze_posting.return_value = {
            "rule_suspicion_score": 0,
            "suspicion_level": "CLEAN",
            "triggered_rules_count": 0,
            "triggered_rules": [],
            "category_breakdown": {},
        }
        self.mock_company_analyzer.analyze.return_value = {
            "company_name": "Stripe Inc.",
            "company_name_explanation": "Extracted from explicit company field.",
            "emails": [{"email": "jobs@stripe.com", "domain": "stripe.com", "is_free_provider": False}],
            "domains": ["stripe.com"],
            "company_domain": "stripe.com",
            "website_checks": {
                "stripe.com": {
                    "reachable": True,
                    "https_supported": True,
                    "has_careers_page": True,
                }
            },
            "domain_checks": {},
            "contact_checks": {
                "email_domain_matches_company_domain": True,
                "has_free_email_provider": False,
            },
            "consistency": {"rating": "HIGH", "explanation": "Recruiter email domain corresponds with verified company website domain."},
            "signals": [{"signal_id": "EMAIL_DOMAIN_MATCH", "severity": "low", "category": "contact", "description": "Email domain matches company domain.", "evidence": "stripe.com"}],
            "warnings": [],
            "errors": [],
        }

        posting = {
            "title": "Senior Distributed Systems Engineer",
            "company": "Stripe Inc.",
            "description": "We are looking for an experienced software engineer to build core distributed ledger systems with high throughput.",
            "recruiter_email": "jobs@stripe.com",
            "website": "https://stripe.com",
        }

        res = self.assessor.assess_posting(posting)

        self.assertLess(res["overall_risk_score"], 25)
        self.assertEqual(res["risk_level"], RISK_LEVEL_LOW)
        self.assertGreaterEqual(res["company_trust_score"], 80)
        self.assertIn(res["assessment_status"], [STATUS_CLEAR, STATUS_LOW_RISK])
        self.assertEqual(res["ml_assessment"]["prediction_label"], "LEGITIMATE")
        self.assertIn("normal", res["recommendation"].lower())

    # 2. ML-Low + No Suspicious Rules + Verified Company -> LOW RISK / CLEAR
    def test_02_ml_low_no_rules_verified_company(self):
        self.mock_predictor.predict_single.return_value = {
            "fraud_probability": 0.05,
            "decision_threshold": 0.25,
            "predicted_class": 0,
            "prediction_label": "LEGITIMATE",
            "model_name": "logistic_regression_calibrated.joblib",
        }
        self.mock_rule_engine.analyze_posting.return_value = {
            "rule_suspicion_score": 0,
            "suspicion_level": "CLEAN",
            "triggered_rules_count": 0,
            "triggered_rules": [],
            "category_breakdown": {},
        }
        self.mock_company_analyzer.analyze.return_value = {
            "company_name": "Google LLC",
            "company_name_explanation": "Extracted from explicit field.",
            "emails": [{"email": "recruiting@google.com", "domain": "google.com", "is_free_provider": False}],
            "domains": ["google.com"],
            "company_domain": "google.com",
            "website_checks": {"google.com": {"reachable": True, "https_supported": True, "has_careers_page": True}},
            "domain_checks": {},
            "contact_checks": {"email_domain_matches_company_domain": True, "has_free_email_provider": False},
            "consistency": {"rating": "HIGH", "explanation": "Matches"},
            "signals": [],
            "warnings": [],
            "errors": [],
        }

        posting = {
            "title": "Cloud Architect",
            "company": "Google LLC",
            "description": "Design distributed architectures across multi-region environments.",
        }

        res = self.assessor.assess_posting(posting)
        self.assertLess(res["overall_risk_score"], 20)
        self.assertEqual(res["risk_level"], RISK_LEVEL_LOW)
        self.assertEqual(res["assessment_status"], STATUS_CLEAR)

    # 3. High ML Probability + Clean Rules -> Elevated Risk with Transparent ML Explanation
    def test_03_high_ml_clean_rules(self):
        self.mock_predictor.predict_single.return_value = {
            "fraud_probability": 0.85,
            "decision_threshold": 0.25,
            "predicted_class": 1,
            "prediction_label": "FRAUDULENT",
            "model_name": "logistic_regression_calibrated.joblib",
        }
        self.mock_rule_engine.analyze_posting.return_value = {
            "rule_suspicion_score": 0,
            "suspicion_level": "CLEAN",
            "triggered_rules_count": 0,
            "triggered_rules": [],
            "category_breakdown": {},
        }
        self.mock_company_analyzer.analyze.return_value = {
            "company_name": "Generic Corp",
            "company_name_explanation": "Extracted",
            "emails": [],
            "domains": ["generic.com"],
            "company_domain": "generic.com",
            "website_checks": {},
            "domain_checks": {},
            "contact_checks": {},
            "consistency": {"rating": "MEDIUM", "explanation": "Unverified"},
            "signals": [],
            "warnings": [],
            "errors": [],
        }

        posting = {
            "title": "Administrative Assistant",
            "description": "Data entry role with anomalous linguistic patterns.",
        }

        res = self.assessor.assess_posting(posting)
        self.assertGreaterEqual(res["overall_risk_score"], 45)
        # Reason must explicitly cite ML calibrated probability
        ml_reasons = [r for r in res["reasons"] if "ML model estimated fraud probability" in r]
        self.assertEqual(len(ml_reasons), 1)

    # 4. Low ML Probability + Explicit Payment Scam Rule -> Guardrail triggers HIGH RISK
    def test_04_low_ml_with_explicit_payment_scam(self):
        self.mock_predictor.predict_single.return_value = {
            "fraud_probability": 0.08,
            "decision_threshold": 0.25,
            "predicted_class": 0,
            "prediction_label": "LEGITIMATE",
            "model_name": "logistic_regression_calibrated.joblib",
        }
        self.mock_rule_engine.analyze_posting.return_value = {
            "rule_suspicion_score": 35,
            "suspicion_level": "HIGH",
            "triggered_rules_count": 1,
            "triggered_rules": [
                {
                    "rule_id": "PAY_001",
                    "rule_name": "Upfront Fee Requirement",
                    "category": "Payment Requests",
                    "severity": "CRITICAL",
                    "score": 35,
                    "evidence": "pay registration fee of $100",
                    "explanation": "Posting requests upfront registration fee.",
                }
            ],
            "category_breakdown": {"Payment Requests": 35},
        }
        self.mock_company_analyzer.analyze.return_value = {
            "company_name": None,
            "company_name_explanation": "Unidentified",
            "emails": [],
            "domains": [],
            "company_domain": None,
            "website_checks": {},
            "domain_checks": {},
            "contact_checks": {},
            "consistency": {"rating": "UNVERIFIED", "explanation": "Unverified"},
            "signals": [],
            "warnings": [],
            "errors": [],
        }

        posting = {
            "title": "Onboarding Representative",
            "description": "Please pay registration fee of $100 before training begins.",
        }

        res = self.assessor.assess_posting(posting)
        # Guardrail should floor risk score at >= 50 (HIGH RISK)
        self.assertGreaterEqual(res["overall_risk_score"], 50)
        self.assertIn(res["risk_level"], [RISK_LEVEL_HIGH, RISK_LEVEL_CRITICAL])
        self.assertEqual(res["assessment_status"], STATUS_HIGH_RISK)
        self.assertTrue(any("PAY_001" in g for g in res["guardrail_triggers"]))

    # 5. High ML + Payment Scam + Suspicious Company -> CRITICAL RISK
    def test_05_compound_scam_critical_risk(self):
        self.mock_predictor.predict_single.return_value = {
            "fraud_probability": 0.92,
            "decision_threshold": 0.25,
            "predicted_class": 1,
            "prediction_label": "FRAUDULENT",
            "model_name": "logistic_regression_calibrated.joblib",
        }
        self.mock_rule_engine.analyze_posting.return_value = {
            "rule_suspicion_score": 45,
            "suspicion_level": "HIGH",
            "triggered_rules_count": 2,
            "triggered_rules": [
                {
                    "rule_id": "PAY_002",
                    "rule_name": "Fake Check Equipment Purchase",
                    "category": "Payment Requests",
                    "severity": "CRITICAL",
                    "score": 35,
                    "evidence": "we will send you a cashier check to purchase supplies",
                    "explanation": "Cashier check scheme.",
                }
            ],
            "category_breakdown": {"Payment Requests": 35},
        }
        self.mock_company_analyzer.analyze.return_value = {
            "company_name": "Global Scams",
            "company_name_explanation": "Extracted",
            "emails": [{"email": "recruiter@gmail.com", "domain": "gmail.com", "is_free_provider": True}],
            "domains": ["bit.ly"],
            "company_domain": "bit.ly",
            "website_checks": {},
            "domain_checks": {},
            "contact_checks": {"has_free_email_provider": True},
            "consistency": {"rating": "LOW", "explanation": "Mismatch"},
            "signals": [
                {"signal_id": "URL_SHORTENER_DETECTED", "severity": "medium", "category": "domain", "description": "Shortener", "evidence": "bit.ly"},
                {"signal_id": "EMAIL_FREE_PROVIDER", "severity": "medium", "category": "contact", "description": "Free email", "evidence": "recruiter@gmail.com"},
            ],
            "warnings": [],
            "errors": [],
        }

        posting = {
            "title": "Remote Assistant",
            "description": "Cashier check to purchase supplies. Contact recruiter@gmail.com at http://bit.ly/fakejob",
        }

        res = self.assessor.assess_posting(posting)
        self.assertGreaterEqual(res["overall_risk_score"], 75)
        self.assertEqual(res["risk_level"], RISK_LEVEL_CRITICAL)
        self.assertEqual(res["assessment_status"], STATUS_HIGH_RISK)

    # 6. Free Email but Legitimate Company Context
    def test_06_free_email_legitimate_context(self):
        self.mock_predictor.predict_single.return_value = {
            "fraud_probability": 0.10,
            "decision_threshold": 0.25,
            "predicted_class": 0,
            "prediction_label": "LEGITIMATE",
            "model_name": "logistic_regression_calibrated.joblib",
        }
        self.mock_rule_engine.analyze_posting.return_value = {
            "rule_suspicion_score": 0,
            "suspicion_level": "CLEAN",
            "triggered_rules_count": 0,
            "triggered_rules": [],
            "category_breakdown": {},
        }
        self.mock_company_analyzer.analyze.return_value = {
            "company_name": "Small Startup Cafe LLC",
            "company_name_explanation": "Extracted",
            "emails": [{"email": "startupcafe@gmail.com", "domain": "gmail.com", "is_free_provider": True}],
            "domains": [],
            "company_domain": None,
            "website_checks": {},
            "domain_checks": {},
            "contact_checks": {"has_free_email_provider": True},
            "consistency": {"rating": "LOW", "explanation": "Free webmail used"},
            "signals": [{"signal_id": "EMAIL_FREE_PROVIDER", "severity": "medium", "category": "contact", "description": "Free webmail", "evidence": "startupcafe@gmail.com"}],
            "warnings": [],
            "errors": [],
        }

        posting = {
            "title": "Barista / Counter Staff",
            "company": "Small Startup Cafe LLC",
            "description": "Looking for friendly baristas for our local coffee shop. Email startupcafe@gmail.com.",
        }

        res = self.assessor.assess_posting(posting)
        # Should not jump to CRITICAL or HIGH risk simply because of free email
        self.assertLess(res["overall_risk_score"], 50)
        self.assertIn(res["risk_level"], [RISK_LEVEL_LOW, RISK_LEVEL_MODERATE])

    # 7. Website Unavailable Handled Gracefully
    def test_07_website_unavailable(self):
        self.mock_predictor.predict_single.return_value = {
            "fraud_probability": 0.05,
            "decision_threshold": 0.25,
            "predicted_class": 0,
            "prediction_label": "LEGITIMATE",
            "model_name": "logistic_regression_calibrated.joblib",
        }
        self.mock_rule_engine.analyze_posting.return_value = {
            "rule_suspicion_score": 0,
            "suspicion_level": "CLEAN",
            "triggered_rules_count": 0,
            "triggered_rules": [],
            "category_breakdown": {},
        }
        self.mock_company_analyzer.analyze.return_value = {
            "company_name": "Local Retailer",
            "company_name_explanation": "Extracted",
            "emails": [{"email": "info@localretailer.com", "domain": "localretailer.com", "is_free_provider": False}],
            "domains": ["localretailer.com"],
            "company_domain": "localretailer.com",
            "website_checks": {"localretailer.com": {"reachable": False, "error": "DNS resolution failed"}},
            "domain_checks": {},
            "contact_checks": {"email_domain_matches_company_domain": True},
            "consistency": {"rating": "MEDIUM", "explanation": "Domain matches email"},
            "signals": [],
            "warnings": [],
            "errors": ["Website check for localretailer.com: DNS resolution failed"],
        }

        posting = {
            "title": "Store Associate",
            "company": "Local Retailer",
            "description": "Help customers in store. Send inquiries to info@localretailer.com.",
            "website": "https://localretailer.com",
        }

        res = self.assessor.assess_posting(posting)
        # Technical DNS failure should not falsely classify company as high risk
        self.assertLess(res["overall_risk_score"], 50)
        self.assertIn(res["risk_level"], [RISK_LEVEL_LOW, RISK_LEVEL_MODERATE])

    # 8. Missing Company Information
    def test_08_missing_company_information(self):
        self.mock_predictor.predict_single.return_value = {
            "fraud_probability": 0.12,
            "decision_threshold": 0.25,
            "predicted_class": 0,
            "prediction_label": "LEGITIMATE",
            "model_name": "logistic_regression_calibrated.joblib",
        }
        self.mock_rule_engine.analyze_posting.return_value = {
            "rule_suspicion_score": 0,
            "suspicion_level": "CLEAN",
            "triggered_rules_count": 0,
            "triggered_rules": [],
            "category_breakdown": {},
        }
        self.mock_company_analyzer.analyze.return_value = {
            "company_name": None,
            "company_name_explanation": "Company identity could not be reliably extracted from the posting.",
            "emails": [],
            "domains": [],
            "company_domain": None,
            "website_checks": {},
            "domain_checks": {},
            "contact_checks": {},
            "consistency": {"rating": "UNVERIFIED", "explanation": "Insufficient metadata."},
            "signals": [],
            "warnings": ["Company identity could not be reliably extracted."],
            "errors": [],
        }

        posting = {
            "title": "Operations Coordinator",
            "description": "Coordinate daily schedules and inventory shipments across local warehouses.",
        }

        res = self.assessor.assess_posting(posting)
        self.assertIsNone(res["company_assessment"]["company_name"])
        self.assertEqual(res["company_trust_score"], 35)  # Baseline minus unverified identity
        self.assertLess(res["overall_risk_score"], 50)

    # 9. Anti-Double-Counting Corroboration Clustering
    def test_09_anti_double_counting_corroboration(self):
        self.mock_predictor.predict_single.return_value = {
            "fraud_probability": 0.78,
            "decision_threshold": 0.25,
            "predicted_class": 1,
            "prediction_label": "FRAUDULENT",
            "model_name": "logistic_regression_calibrated.joblib",
        }
        self.mock_rule_engine.analyze_posting.return_value = {
            "rule_suspicion_score": 35,
            "suspicion_level": "HIGH",
            "triggered_rules_count": 1,
            "triggered_rules": [
                {
                    "rule_id": "PAY_001",
                    "rule_name": "Upfront Fee Requirement",
                    "category": "Payment Requests",
                    "severity": "CRITICAL",
                    "score": 35,
                    "evidence": "pay registration fee of $50",
                    "explanation": "Demands fee.",
                }
            ],
            "category_breakdown": {"Payment Requests": 35},
        }
        self.mock_company_analyzer.analyze.return_value = {
            "company_name": "QuickHire Inc",
            "company_name_explanation": "Extracted",
            "emails": [{"email": "recruiter@gmail.com", "domain": "gmail.com", "is_free_provider": True}],
            "domains": [],
            "company_domain": None,
            "website_checks": {},
            "domain_checks": {},
            "contact_checks": {"has_free_email_provider": True},
            "consistency": {"rating": "LOW", "explanation": "Free mail"},
            "signals": [{"signal_id": "EMAIL_FREE_PROVIDER", "severity": "medium", "category": "contact", "description": "Free webmail", "evidence": "recruiter@gmail.com"}],
            "warnings": [],
            "errors": [],
        }

        posting = {
            "title": "Typist",
            "description": "Please pay registration fee of $50. Send email to recruiter@gmail.com.",
        }

        res = self.assessor.assess_posting(posting)
        # Should record corroboration between ML and Rule engine
        self.assertTrue(len(res["corroborations"]) > 0)
        self.assertTrue(any("FINANCIAL_PAYMENT_REQUEST" in c for c in res["corroborations"]))

    # 10. Financial Banking Credential Request
    def test_10_financial_credential_request(self):
        self.mock_predictor.predict_single.return_value = {
            "fraud_probability": 0.15,
            "decision_threshold": 0.25,
            "predicted_class": 0,
            "prediction_label": "LEGITIMATE",
            "model_name": "logistic_regression_calibrated.joblib",
        }
        self.mock_rule_engine.analyze_posting.return_value = {
            "rule_suspicion_score": 40,
            "suspicion_level": "CRITICAL",
            "triggered_rules_count": 1,
            "triggered_rules": [
                {
                    "rule_id": "FIN_001",
                    "rule_name": "Banking Credentials Request",
                    "category": "Financial Credentials",
                    "severity": "CRITICAL",
                    "score": 40,
                    "evidence": "submit your online banking password and pin",
                    "explanation": "Solicits banking login credentials.",
                }
            ],
            "category_breakdown": {"Financial Credentials": 40},
        }
        self.mock_company_analyzer.analyze.return_value = {
            "company_name": None,
            "company_name_explanation": "Unidentified",
            "emails": [],
            "domains": [],
            "company_domain": None,
            "website_checks": {},
            "domain_checks": {},
            "contact_checks": {},
            "consistency": {"rating": "UNVERIFIED", "explanation": "Unverified"},
            "signals": [],
            "warnings": [],
            "errors": [],
        }

        posting = {
            "title": "Financial Clerk",
            "description": "Please submit your online banking password and pin for direct deposit verification.",
        }

        res = self.assessor.assess_posting(posting)
        self.assertGreaterEqual(res["overall_risk_score"], 50)
        self.assertIn(res["risk_level"], [RISK_LEVEL_HIGH, RISK_LEVEL_CRITICAL])
        self.assertTrue(any("FIN_001" in g for g in res["guardrail_triggers"]))

    # 11. High-risk Rule Cannot Be Hidden by Low ML Score
    def test_11_high_risk_rule_cannot_be_hidden_by_zero_ml(self):
        self.mock_predictor.predict_single.return_value = {
            "fraud_probability": 0.001,  # Ultra low ML
            "decision_threshold": 0.25,
            "predicted_class": 0,
            "prediction_label": "LEGITIMATE",
            "model_name": "logistic_regression_calibrated.joblib",
        }
        self.mock_rule_engine.analyze_posting.return_value = {
            "rule_suspicion_score": 40,
            "suspicion_level": "CRITICAL",
            "triggered_rules_count": 1,
            "triggered_rules": [
                {
                    "rule_id": "FIN_002",
                    "rule_name": "OTP / One-Time Password Solicitation",
                    "category": "Financial Credentials",
                    "severity": "CRITICAL",
                    "score": 40,
                    "evidence": "share the otp sent to your mobile phone",
                    "explanation": "Solicits OTP credentials.",
                }
            ],
            "category_breakdown": {"Financial Credentials": 40},
        }
        self.mock_company_analyzer.analyze.return_value = {
            "company_name": "Acme Inc.",
            "company_name_explanation": "Extracted",
            "emails": [],
            "domains": [],
            "company_domain": None,
            "website_checks": {},
            "domain_checks": {},
            "contact_checks": {},
            "consistency": {"rating": "MEDIUM", "explanation": "Unverified"},
            "signals": [],
            "warnings": [],
            "errors": [],
        }

        posting = {
            "title": "Account Manager",
            "description": "Share the otp sent to your mobile phone to complete onboarding.",
        }

        res = self.assessor.assess_posting(posting)
        # Even with 0.001 ML probability, overall score must be >= 50
        self.assertGreaterEqual(res["overall_risk_score"], 50)
        self.assertEqual(res["risk_level"], RISK_LEVEL_HIGH)

    # 12. Insufficient Evidence Case
    def test_12_insufficient_evidence(self):
        self.mock_predictor.predict_single.return_value = {
            "fraud_probability": 0.04,
            "decision_threshold": 0.25,
            "predicted_class": 0,
            "prediction_label": "LEGITIMATE",
            "model_name": "logistic_regression_calibrated.joblib",
        }
        self.mock_rule_engine.analyze_posting.return_value = {
            "rule_suspicion_score": 0,
            "suspicion_level": "CLEAN",
            "triggered_rules_count": 0,
            "triggered_rules": [],
            "category_breakdown": {},
        }
        self.mock_company_analyzer.analyze.return_value = {
            "company_name": None,
            "company_name_explanation": "Unidentified",
            "emails": [],
            "domains": [],
            "company_domain": None,
            "website_checks": {},
            "domain_checks": {},
            "contact_checks": {},
            "consistency": {"rating": "UNVERIFIED", "explanation": "Unverified"},
            "signals": [],
            "warnings": [],
            "errors": [],
        }

        posting = {
            "title": "Job",
            "description": "Call me.",
        }

        res = self.assessor.assess_posting(posting)
        self.assertEqual(res["assessment_status"], STATUS_INSUFFICIENT_EVIDENCE)
        self.assertIn("Insufficient information", res["recommendation"])


if __name__ == "__main__":
    unittest.main()
