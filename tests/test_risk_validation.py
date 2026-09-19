"""
AuthentiHire - Unit Tests for Phase 5.1: Risk Validation & Calibration
======================================================================
Tests verify exact dataset partitioning reproducibility, score boundaries,
component weighting, guardrail integrity, leakage audit checks, and
configuration persistence.
"""

import unittest
import os
import sys
import json
import numpy as np

# Ensure project root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.risk_validation import (
    get_train_val_test_partitions,
    audit_data_leakage,
    compute_screening_metrics,
    compute_band_breakdown,
)
from src.risk_assessment import (
    AuthentiHireRiskAssessor,
    RISK_LEVEL_LOW,
    RISK_LEVEL_MODERATE,
    RISK_LEVEL_HIGH,
    RISK_LEVEL_CRITICAL,
    STATUS_INSUFFICIENT_EVIDENCE,
)


class TestRiskValidation(unittest.TestCase):
    """Unit tests for risk validation methodology and constraints."""

    # 1. Reproducible Train / Test Split
    def test_01_reproducible_train_test_split(self):
        partitions = get_train_val_test_partitions()
        X_test = partitions["X_test"]
        y_test = partitions["y_test"]

        self.assertEqual(len(X_test), 3520)
        self.assertEqual(int(sum(y_test)), 171)
        self.assertEqual(int(len(y_test) - sum(y_test)), 3349)

        X_train_full = partitions["X_train_full"]
        self.assertEqual(len(X_train_full), 14079)

        X_val = partitions["X_val"]
        self.assertEqual(len(X_val), 2816)

    # 2. Risk Score Range 0 - 100
    def test_02_risk_score_boundaries(self):
        assessor = AuthentiHireRiskAssessor()
        # Test extreme minimum input
        min_score, _, _, _, _ = assessor.calculate_overall_risk(
            fraud_probability=0.0,
            rule_suspicion_score=0,
            company_trust_score=100,
            triggered_rules=[],
            company_signals=[],
            text_length=500,
        )
        self.assertGreaterEqual(min_score, 0)
        self.assertLessEqual(min_score, 100)

        # Test extreme maximum input
        max_score, _, _, _, _ = assessor.calculate_overall_risk(
            fraud_probability=1.0,
            rule_suspicion_score=100,
            company_trust_score=1,
            triggered_rules=[],
            company_signals=[],
            text_length=500,
        )
        self.assertGreaterEqual(max_score, 0)
        self.assertLessEqual(max_score, 100)

    # 3. Valid Risk Bands
    def test_03_valid_risk_bands(self):
        assessor = AuthentiHireRiskAssessor()
        
        # Test distinct inputs designed for each band
        band_cases = [
            (0.10, 0, 80, RISK_LEVEL_LOW),         # ~9 pts
            (0.35, 10, 50, RISK_LEVEL_MODERATE),   # ~33 pts
            (0.65, 10, 30, RISK_LEVEL_HIGH),       # ~52 pts
            (0.90, 50, 10, RISK_LEVEL_CRITICAL),   # ~88 pts
        ]

        for fraud_p, rule_s, trust_s, expected_band in band_cases:
            score, lvl, _, _, _ = assessor.calculate_overall_risk(
                fraud_probability=fraud_p,
                rule_suspicion_score=rule_s,
                company_trust_score=trust_s,
                triggered_rules=[],
                company_signals=[],
                text_length=500,
            )
            self.assertEqual(lvl, expected_band)

    # 4. Component Weights Sum to 1.0
    def test_04_component_weights_sum_to_one(self):
        assessor = AuthentiHireRiskAssessor(weight_ml=50, weight_rule=30, weight_company=20)
        total_w = assessor.weight_ml + assessor.weight_rule + assessor.weight_company
        self.assertAlmostEqual(total_w, 1.0, places=6)

    # 5. Guardrails Enforce Risk Floors
    def test_05_guardrails_enforce_floors(self):
        assessor = AuthentiHireRiskAssessor()
        crit_rules = [{"rule_id": "PAY_001", "rule_name": "Upfront Fee", "severity": "CRITICAL", "score": 35}]

        # Low ML (0.01) + Low Company Risk (Trust 90) but critical rule present
        score, lvl, _, guardrails, _ = assessor.calculate_overall_risk(
            fraud_probability=0.01,
            rule_suspicion_score=10,
            company_trust_score=90,
            triggered_rules=crit_rules,
            company_signals=[],
            text_length=500,
        )
        self.assertGreaterEqual(score, 55)
        self.assertIn(lvl, [RISK_LEVEL_HIGH, RISK_LEVEL_CRITICAL])
        self.assertTrue(len(guardrails) > 0)

    # 6. Company Trust Score Stays Within 1 - 100
    def test_06_company_trust_score_boundaries(self):
        assessor = AuthentiHireRiskAssessor()
        # All negative signals
        worst_signals = [
            {"signal_id": "URL_RAW_IP_ADDRESS"},
            {"signal_id": "URL_SHORTENER_DETECTED"},
            {"signal_id": "EMAIL_DOMAIN_MISMATCH"},
            {"signal_id": "DOMAIN_HIGH_ENTROPY"},
        ]
        worst_trust, _ = assessor.calculate_company_trust_score(
            company_name=None,
            company_domain=None,
            emails=[],
            website_checks={},
            signals=worst_signals,
            contact_checks={"has_free_email_provider": True},
        )
        self.assertGreaterEqual(worst_trust, 1)
        self.assertLessEqual(worst_trust, 100)

        # All positive signals
        best_trust, _ = assessor.calculate_company_trust_score(
            company_name="Acme Corp",
            company_domain="acme.com",
            emails=[{"email": "jobs@acme.com"}],
            website_checks={"acme.com": {"reachable": True, "https_supported": True, "has_careers_page": True}},
            signals=[],
            contact_checks={"email_domain_matches_company_domain": True},
        )
        self.assertGreaterEqual(best_trust, 1)
        self.assertLessEqual(best_trust, 100)

    # 7. Insufficient Evidence Distinct from Legitimate
    def test_07_insufficient_evidence_isolation(self):
        assessor = AuthentiHireRiskAssessor()
        score, lvl, status, _, _ = assessor.calculate_overall_risk(
            fraud_probability=0.05,
            rule_suspicion_score=0,
            company_trust_score=50,
            triggered_rules=[],
            company_signals=[],
            text_length=20,  # Ultra brief
        )
        self.assertEqual(status, STATUS_INSUFFICIENT_EVIDENCE)

    # 8. Data Leakage Audit
    def test_08_leakage_audit_passes(self):
        audit_res = audit_data_leakage()
        self.assertTrue(audit_res["passed"], f"Leakage audit failed: {audit_res['violations']}")

    # 9. Configuration Persistence Verification
    def test_09_config_persistence_schema(self):
        config_path = "models/risk_config.json"
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            self.assertIn("version", cfg)
            self.assertIn("weights", cfg)
            self.assertIn("operating_flagging_threshold", cfg)
            self.assertIn("risk_bands", cfg)
            self.assertIn("guardrail_settings", cfg)


if __name__ == "__main__":
    unittest.main()
