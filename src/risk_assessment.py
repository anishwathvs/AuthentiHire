"""
AuthentiHire - Unified Risk Assessment Engine
=============================================
Synthesizes:
1. Calibrated ML Probability (Phase 2.5)
2. Scam Rule Engine Evidence (Phase 3)
3. Company & Website Intelligence (Phase 4)

Produces an explainable, multi-dimensional assessment featuring:
- Company Trust Score (1-100)
- Overall Risk Score (0-100)
- Risk Level (LOW, MODERATE, HIGH, CRITICAL)
- Assessment Status (CLEAR, LOW_RISK, REVIEW_RECOMMENDED, HIGH_RISK, INSUFFICIENT_EVIDENCE)
- Anti-Double-Counting Corroborated Evidence
- Human-Readable Explainable Reasons
- Neutral Recommended Actions

Key Architectural Principles:
1. Complete Explainability: No black-box combined scores; all evidence is attributed.
2. Anti-Double-Counting: Corroborated signals across ML, rules, and company intelligence
   are clustered rather than multiplied blindly.
3. Guardrails: Critical explicit scam indicators (upfront fees, banking credentials, raw IP URLs)
   cannot be masked by a low ML probability.
4. Distinguishing Absence vs Fraud: Missing metadata is recorded as UNVERIFIED/UNAVAILABLE,
   never conflated with confirmed fraud.
"""

import os
import sys
import json
import math
import html
import re
from typing import Dict, List, Any, Optional, Tuple, Set

# Ensure project root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.predict import JobPostingPredictor
from src.rule_engine import ScamRuleEngine
from src.company_intelligence import CompanyIntelligenceAnalyzer


# ==============================================================================
# CONFIGURATION & CONSTANTS
# ==============================================================================

# Initial engineering weights for combined risk calculation (documented, not claimed optimal)
DEFAULT_WEIGHT_ML = 0.50
DEFAULT_WEIGHT_RULE = 0.30
DEFAULT_WEIGHT_COMPANY = 0.20

# Risk Level Bands
RISK_LEVEL_LOW = "LOW RISK"             # 0 - 24
RISK_LEVEL_MODERATE = "MODERATE RISK"   # 25 - 49
RISK_LEVEL_HIGH = "HIGH RISK"           # 50 - 74
RISK_LEVEL_CRITICAL = "CRITICAL RISK"   # 75 - 100

# Assessment Statuses
STATUS_CLEAR = "CLEAR"
STATUS_LOW_RISK = "LOW_RISK"
STATUS_REVIEW_RECOMMENDED = "REVIEW_RECOMMENDED"
STATUS_HIGH_RISK = "HIGH_RISK"
STATUS_INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"

# Conceptual Evidence Clusters for Anti-Double-Counting
EVIDENCE_CLUSTERS = {
    "FINANCIAL_PAYMENT_REQUEST": {"PAY_001", "PAY_002", "PAY_003"},
    "FINANCIAL_CREDENTIALS": {"FIN_001", "FIN_002"},
    "PERSONAL_IDENTITY_PII": {"ID_001"},
    "COMMUNICATION_CHANNEL": {"COMM_001", "COMM_002"},
    "COMPENSATION_ANOMALY": {"COMP_001"},
    "URGENCY_PRESSURE": {"URG_001"},
    "CONTACT_EMAIL_IDENTITY": {"EMAIL_FREE_PROVIDER", "EMAIL_DOMAIN_MISMATCH"},
    "URL_DOMAIN_ANOMALY": {"URL_SHORTENER_DETECTED", "URL_RAW_IP_ADDRESS", "DOMAIN_HIGH_ENTROPY", "DOMAIN_NUMERIC_HEAVY", "DOMAIN_UNCOMMON_TLD", "URL_001", "URL_002"},
    "COMPANY_IDENTITY_SPARSITY": {"SPARSE_001"},
}


# ==============================================================================
# UNIFIED RISK ASSESSOR
# ==============================================================================

class AuthentiHireRiskAssessor:
    """Production-grade unified risk assessment engine synthesizing ML, rules, and web intelligence."""

    def __init__(
        self,
        predictor: Optional[JobPostingPredictor] = None,
        rule_engine: Optional[ScamRuleEngine] = None,
        company_analyzer: Optional[CompanyIntelligenceAnalyzer] = None,
        weight_ml: float = DEFAULT_WEIGHT_ML,
        weight_rule: float = DEFAULT_WEIGHT_RULE,
        weight_company: float = DEFAULT_WEIGHT_COMPANY,
    ) -> None:
        self.predictor = predictor or JobPostingPredictor()
        self.rule_engine = rule_engine or ScamRuleEngine()
        self.company_analyzer = company_analyzer or CompanyIntelligenceAnalyzer(enable_cache=True)
        
        # Verify weight normalization
        total_w = weight_ml + weight_rule + weight_company
        self.weight_ml = weight_ml / total_w
        self.weight_rule = weight_rule / total_w
        self.weight_company = weight_company / total_w

    # --------------------------------------------------------------------------
    # 1. COMPANY TRUST SCORE CALCULATION
    # --------------------------------------------------------------------------

    def calculate_company_trust_score(
        self,
        company_name: Optional[str],
        company_domain: Optional[str],
        emails: List[Dict[str, Any]],
        website_checks: Dict[str, Any],
        signals: List[Dict[str, Any]],
        contact_checks: Dict[str, Any],
    ) -> Tuple[int, Dict[str, Any]]:
        """
        Calculates Company Trust Score (1-100) representing strength of verified
        company identity and online presence.
        
        Starts at neutral baseline (50) and adjusts based on verified positive/negative evidence.
        Missing data does not receive the same harsh penalty as actively suspicious indicators.
        """
        score = 50.0  # Neutral baseline
        breakdown: Dict[str, float] = {"baseline": 50.0}

        primary_check = website_checks.get(company_domain) if company_domain else None

        # --- Positive Verification Points ---
        if company_name:
            score += 10.0
            breakdown["verified_company_name"] = +10.0

        if company_domain and company_domain not in {"bit.ly", "tinyurl.com", "t.co"}:
            score += 10.0
            breakdown["identified_company_domain"] = +10.0

        if primary_check and primary_check.get("reachable"):
            score += 10.0
            breakdown["website_reachable"] = +10.0

        if primary_check and primary_check.get("https_supported"):
            score += 10.0
            breakdown["valid_https_certificate"] = +10.0

        if contact_checks.get("email_domain_matches_company_domain"):
            score += 15.0
            breakdown["email_matches_corporate_domain"] = +15.0

        if primary_check and (primary_check.get("has_careers_page") or primary_check.get("has_contact_page") or primary_check.get("has_about_page")):
            score += 5.0
            breakdown["corporate_presence_pages"] = +5.0

        # --- Negative Suspicious Evidence Deductions ---
        if contact_checks.get("has_free_email_provider"):
            score -= 15.0
            breakdown["free_email_provider_used"] = -15.0

        if any(s.get("signal_id") == "EMAIL_DOMAIN_MISMATCH" for s in signals):
            score -= 15.0
            breakdown["email_domain_mismatch"] = -15.0

        if any(s.get("signal_id") == "URL_RAW_IP_ADDRESS" for s in signals):
            score -= 25.0
            breakdown["raw_ip_address_url"] = -25.0

        if any(s.get("signal_id") == "URL_SHORTENER_DETECTED" for s in signals):
            score -= 15.0
            breakdown["url_shortener_used"] = -15.0

        if any(s.get("signal_id") == "DOMAIN_HIGH_ENTROPY" for s in signals):
            score -= 15.0
            breakdown["high_entropy_domain"] = -15.0

        if any(s.get("signal_id") == "DOMAIN_NUMERIC_HEAVY" for s in signals):
            score -= 10.0
            breakdown["numeric_heavy_domain"] = -10.0

        if any(s.get("signal_id") == "WEBSITE_CROSS_DOMAIN_REDIRECT" for s in signals):
            score -= 10.0
            breakdown["cross_domain_redirect"] = -10.0

        if any(s.get("signal_id") == "WEBSITE_SSL_INVALID" for s in signals):
            score -= 15.0
            breakdown["invalid_ssl_certificate"] = -15.0

        # Absence of metadata adjustment (mild neutral penalty for complete absence of company metadata)
        if not company_name and not company_domain and not emails:
            score -= 15.0
            breakdown["unverified_corporate_identity"] = -15.0

        final_trust = int(max(1, min(100, round(score))))
        return final_trust, breakdown

    # --------------------------------------------------------------------------
    # 2. OVERALL RISK SCORE CALCULATION & GUARDRAILS
    # --------------------------------------------------------------------------

    def calculate_overall_risk(
        self,
        fraud_probability: float,
        rule_suspicion_score: int,
        company_trust_score: int,
        triggered_rules: List[Dict[str, Any]],
        company_signals: List[Dict[str, Any]],
        text_length: int,
    ) -> Tuple[int, str, str, List[str], Dict[str, float]]:
        """
        Synthesizes component scores with guardrails and returns:
        (overall_risk_score, risk_level, assessment_status, guardrail_triggers, component_breakdown)
        """
        # Component 1: ML Risk (0 - 100)
        ml_component = fraud_probability * 100.0

        # Component 2: Rule Risk (0 - 100) normalized (60 pts in rule engine is severe/capped)
        rule_component = min((rule_suspicion_score / 60.0) * 100.0, 100.0)

        # Component 3: Company Risk (0 - 100) as inverse of trust score
        company_risk_component = 100.0 - float(company_trust_score)

        # Linear weighted base score
        raw_combined = (
            (self.weight_ml * ml_component)
            + (self.weight_rule * rule_component)
            + (self.weight_company * company_risk_component)
        )

        final_score = raw_combined
        guardrail_triggers: List[str] = []

        # --- Guardrail 1: Critical explicit scam rules floor risk at HIGH (min 50) ---
        critical_rule_ids = {"PAY_001", "PAY_002", "PAY_003", "FIN_001", "FIN_002"}
        triggered_crit = [r["rule_id"] for r in triggered_rules if r["rule_id"] in critical_rule_ids]
        if triggered_crit:
            if final_score < 55.0:
                final_score = 55.0
                guardrail_triggers.append(
                    f"Risk floored to 55 (HIGH RISK) due to critical scam rule trigger ({', '.join(triggered_crit)})."
                )

        # --- Guardrail 2: Raw IP URL detected floors risk at HIGH (min 50) ---
        if any(s.get("signal_id") == "URL_RAW_IP_ADDRESS" for s in company_signals):
            if final_score < 50.0:
                final_score = 50.0
                guardrail_triggers.append("Risk floored to 50 (HIGH RISK) due to raw IP address URL.")

        # --- Guardrail 3: Compound severe rules + high ML elevate to CRITICAL (min 75) ---
        if fraud_probability >= 0.50 and rule_suspicion_score >= 30:
            if final_score < 75.0:
                final_score = 75.0
                guardrail_triggers.append("Risk elevated to 75 (CRITICAL RISK) due to high ML probability combined with multiple scam rules.")

        # Clamp score between 0 and 100
        int_score = int(max(0, min(100, round(final_score))))

        # Determine Risk Level Band
        if int_score < 25:
            risk_level = RISK_LEVEL_LOW
        elif int_score < 50:
            risk_level = RISK_LEVEL_MODERATE
        elif int_score < 75:
            risk_level = RISK_LEVEL_HIGH
        else:
            risk_level = RISK_LEVEL_CRITICAL

        # Determine Assessment Status
        if text_length < 50 and not triggered_rules:
            assessment_status = STATUS_INSUFFICIENT_EVIDENCE
        elif int_score >= 50:
            assessment_status = STATUS_HIGH_RISK
        elif int_score >= 25 or company_trust_score < 40:
            assessment_status = STATUS_REVIEW_RECOMMENDED
        elif int_score < 15 and company_trust_score >= 70 and not triggered_rules:
            assessment_status = STATUS_CLEAR
        else:
            assessment_status = STATUS_LOW_RISK

        components = {
            "ml_risk_component": round(ml_component, 2),
            "rule_risk_component": round(rule_component, 2),
            "company_risk_component": round(company_risk_component, 2),
            "weighted_base_score": round(raw_combined, 2),
            "final_score": int_score,
        }

        return int_score, risk_level, assessment_status, guardrail_triggers, components

    # --------------------------------------------------------------------------
    # 3. EVIDENCE SYNTHESIS & ANTI-DOUBLE-COUNTING
    # --------------------------------------------------------------------------

    def synthesize_evidence(
        self,
        ml_res: Dict[str, Any],
        rule_res: Dict[str, Any],
        company_res: Dict[str, Any],
    ) -> Tuple[List[Dict[str, Any]], List[str], Dict[str, Any]]:
        """
        Unifies and clusters evidence across all 3 components.
        Produces deduplicated evidence objects, explainable reasons, and cluster mappings.
        """
        evidence_list: List[Dict[str, Any]] = []
        reasons: List[str] = []
        cluster_tracker: Dict[str, Dict[str, bool]] = {
            c: {"detected_by_ml": False, "detected_by_rules": False, "detected_by_company_intelligence": False}
            for c in EVIDENCE_CLUSTERS
        }

        fraud_prob = ml_res.get("fraud_probability", 0.0)
        threshold = ml_res.get("decision_threshold", 0.25)
        triggered_rules = rule_res.get("triggered_rules", [])
        company_signals = company_res.get("signals", [])

        # 1. ML Evidence Item & Reason
        if fraud_prob >= threshold:
            evidence_list.append({
                "source": "ML",
                "severity": "HIGH" if fraud_prob >= 0.60 else "MEDIUM",
                "status": "SUSPICIOUS",
                "evidence": f"Calibrated estimated fraud probability of {fraud_prob:.2f} exceeds operating decision threshold ({threshold:.2f}).",
            })
            reasons.append(f"Calibrated ML model estimated fraud probability of {fraud_prob:.2f} (decision threshold: {threshold:.2f}).")
        else:
            evidence_list.append({
                "source": "ML",
                "severity": "LOW",
                "status": "VERIFIED",
                "evidence": f"Calibrated estimated fraud probability of {fraud_prob:.2f} is below operating decision threshold ({threshold:.2f}).",
            })

        # 2. Rule Evidence Items & Reasons
        for r in triggered_rules:
            rule_id = r["rule_id"]
            evidence_list.append({
                "source": "RULE",
                "severity": r.get("severity", "MEDIUM"),
                "status": "SUSPICIOUS",
                "evidence": f"[{rule_id}] {r['rule_name']}: {r.get('evidence', '')}",
            })
            reasons.append(f"Scam Rule [{rule_id}]: {r.get('explanation', r['rule_name'])} (Evidence: \"{r.get('evidence', '')}\").")

            # Map to clusters for anti-double-counting
            for cluster_name, rule_set in EVIDENCE_CLUSTERS.items():
                if rule_id in rule_set:
                    cluster_tracker[cluster_name]["detected_by_rules"] = True
                    if fraud_prob >= threshold:
                        cluster_tracker[cluster_name]["detected_by_ml"] = True

        # 3. Company Intelligence Evidence & Reasons
        for s in company_signals:
            sig_id = s.get("signal_id", "")
            evidence_list.append({
                "source": "COMPANY",
                "severity": s.get("severity", "MEDIUM").upper(),
                "status": "SUSPICIOUS" if s.get("severity") in {"medium", "high"} else "VERIFIED",
                "evidence": f"[{sig_id}] {s.get('description', '')} (Evidence: {s.get('evidence', '')})",
            })
            if s.get("severity") in {"medium", "high"}:
                reasons.append(f"Company Intelligence [{sig_id}]: {s.get('description', '')} (Evidence: \"{s.get('evidence', '')}\").")

            # Map to clusters
            for cluster_name, sig_set in EVIDENCE_CLUSTERS.items():
                if sig_id in sig_set:
                    cluster_tracker[cluster_name]["detected_by_company_intelligence"] = True

        # 4. Corroboration Annotations (Anti-Double-Counting transparency)
        corroborations = []
        for cluster, sources in cluster_tracker.items():
            active_sources = [src.replace("detected_by_", "") for src, active in sources.items() if active]
            if len(active_sources) > 1:
                corroborations.append(f"Signal cluster '{cluster}' corroborated across {', '.join(active_sources)}.")

        if not reasons:
            reasons.append("No suspicious heuristic patterns or ML anomalies detected; posting profile is clean.")

        return evidence_list, reasons, {"cluster_tracker": cluster_tracker, "corroborations": corroborations}

    # --------------------------------------------------------------------------
    # 4. RECOMMENDED ACTION GENERATION
    # --------------------------------------------------------------------------

    def generate_recommendation(self, risk_level: str, assessment_status: str, triggered_rules: List[Dict[str, Any]]) -> str:
        """Generates a clear, neutral action guideline based on risk level and status."""
        has_critical_rule = any(r.get("severity") in {"HIGH", "CRITICAL"} for r in triggered_rules)

        if assessment_status == STATUS_INSUFFICIENT_EVIDENCE:
            return "Insufficient information available in posting to perform a reliable assessment. Exercise caution and verify employer independently."

        if risk_level == RISK_LEVEL_CRITICAL or has_critical_rule:
            return "Do not provide payment, banking credentials, or sensitive government ID. Conduct thorough independent verification of the employer."

        if risk_level == RISK_LEVEL_HIGH:
            return "Perform additional employer and recruiter verification before applying or sharing personal contact details."

        if risk_level == RISK_LEVEL_MODERATE:
            return "Review the job posting details and verify the recruiter's official company email address before submitting an application."

        return "Proceed with normal application verification standards."

    # --------------------------------------------------------------------------
    # 5. MAIN EVALUATION PIPELINE
    # --------------------------------------------------------------------------

    def assess_posting(self, posting: Dict[str, Any], live_checks: bool = False) -> Dict[str, Any]:
        """
        Executes unified AuthentiHire Risk Assessment on a complete job posting dictionary.
        Returns a structured, fully explainable assessment report.
        """
        # Step 1: Run Calibrated ML Prediction (Phase 2.5)
        ml_raw = self.predictor.predict_single(posting)
        pred_label = ml_raw.get("prediction_label") or ml_raw.get("prediction", "LEGITIMATE")
        ml_assessment = {
            "fraud_probability": round(float(ml_raw["fraud_probability"]), 4),
            "decision_threshold": float(ml_raw["decision_threshold"]),
            "predicted_class": int(ml_raw["predicted_class"]),
            "prediction_label": pred_label,
            "model_name": ml_raw.get("model_name", "calibrated_model"),
            "note": f"Estimated probability of {ml_raw['fraud_probability']:.2f} under calibrated logistic regression model.",
        }

        # Step 2: Run Scam Rule Engine (Phase 3)
        rule_raw = self.rule_engine.analyze_posting(posting)
        rule_assessment = {
            "rule_suspicion_score": rule_raw["rule_suspicion_score"],
            "suspicion_level": rule_raw["suspicion_level"],
            "rule_count": rule_raw["triggered_rules_count"],
            "triggered_rules": rule_raw["triggered_rules"],
            "category_breakdown": rule_raw["category_breakdown"],
        }

        # Step 3: Run Company & Website Intelligence (Phase 4)
        company_raw = self.company_analyzer.analyze(posting, live_checks=live_checks)
        company_assessment = {
            "company_name": company_raw["company_name"],
            "company_name_explanation": company_raw["company_name_explanation"],
            "emails": company_raw["emails"],
            "domains": company_raw["domains"],
            "company_domain": company_raw["company_domain"],
            "website_checks": company_raw["website_checks"],
            "domain_checks": company_raw["domain_checks"],
            "contact_checks": company_raw["contact_checks"],
            "consistency": company_raw["consistency"],
            "signals": company_raw["signals"],
            "warnings": company_raw["warnings"],
            "errors": company_raw["errors"],
        }

        # Step 4: Calculate Company Trust Score (1-100)
        company_trust_score, trust_breakdown = self.calculate_company_trust_score(
            company_name=company_raw["company_name"],
            company_domain=company_raw["company_domain"],
            emails=company_raw["emails"],
            website_checks=company_raw["website_checks"],
            signals=company_raw["signals"],
            contact_checks=company_raw["contact_checks"],
        )

        # Calculate total text length for sufficiency checks
        fields = ["title", "company_profile", "description", "requirements", "benefits"]
        total_text = " ".join(str(posting.get(f, "") or "") for f in fields).strip()

        # Step 5: Calculate Overall Risk Score (0-100) & Guardrails
        overall_risk_score, risk_level, assessment_status, guardrails, components = self.calculate_overall_risk(
            fraud_probability=ml_raw["fraud_probability"],
            rule_suspicion_score=rule_raw["rule_suspicion_score"],
            company_trust_score=company_trust_score,
            triggered_rules=rule_raw["triggered_rules"],
            company_signals=company_raw["signals"],
            text_length=len(total_text),
        )

        # Step 6: Evidence Synthesis & Anti-Double-Counting Corroborations
        evidence_list, reasons, corroboration_data = self.synthesize_evidence(
            ml_res=ml_assessment,
            rule_res=rule_assessment,
            company_res=company_assessment,
        )

        # Step 7: Recommended Action
        recommendation = self.generate_recommendation(
            risk_level=risk_level,
            assessment_status=assessment_status,
            triggered_rules=rule_raw["triggered_rules"],
        )

        return {
            "ml_assessment": ml_assessment,
            "rule_assessment": rule_assessment,
            "company_assessment": company_assessment,
            "company_trust_score": company_trust_score,
            "company_trust_breakdown": trust_breakdown,
            "overall_risk_score": overall_risk_score,
            "risk_level": risk_level,
            "assessment_status": assessment_status,
            "score_components": components,
            "guardrail_triggers": guardrails,
            "evidence": evidence_list,
            "reasons": reasons,
            "corroborations": corroboration_data["corroborations"],
            "recommendation": recommendation,
        }


# ==============================================================================
# CLI DEMO & REAL DATASET EVALUATION
# ==============================================================================

def run_demo(as_json: bool = False) -> None:
    """Demonstrates unified risk assessments on representative job postings."""
    assessor = AuthentiHireRiskAssessor()

    demo_cases = [
        {
            "name": "Case 1: Legitimate Software Engineering Position (Acme Corp)",
            "posting": {
                "title": "Senior Distributed Systems Engineer",
                "company": "Stripe Inc.",
                "company_profile": "Stripe builds economic infrastructure for the internet. Millions of companies use Stripe's software to accept payments and manage their businesses online.",
                "description": "We are looking for an experienced software engineer to help build our core distributed infrastructure. You will work on high-throughput distributed transaction engines.",
                "requirements": "5+ years backend software engineering experience with Go, Java, or Python. Experience with distributed consensus systems and cloud architectures.",
                "benefits": "Competitive compensation, equity grants, comprehensive health/vision/dental insurance, 401(k) matching.",
                "website": "https://stripe.com",
                "recruiter_email": "jobs@stripe.com",
                "telecommuting": 1,
                "has_company_logo": 1,
                "has_questions": 1,
            },
        },
        {
            "name": "Case 2: Upfront Registration Fee / Payment Scam",
            "posting": {
                "title": "Remote Data Entry Assistant ($45/hr)",
                "description": "Urgent opening! Earn $45/hr working from home. Immediate placement guaranteed. A refundable background check and onboarding registration fee of $75 must be paid before commencing training. Send payment via Western Union to register.",
                "requirements": "No previous experience required. Must have a smartphone or computer.",
                "benefits": "Flexible hours, immediate cash payouts.",
                "recruiter_email": "fastplacement.careers@gmail.com",
                "has_company_logo": 0,
                "has_questions": 0,
            },
        },
        {
            "name": "Case 3: Advance-Fee Equipment / Fake Cashier's Check Scam",
            "posting": {
                "title": "Administrative Support Specialist",
                "company_profile": "Global Logistics Management Partners.",
                "description": "We are hiring remote support staff. We will mail you a cashier's check to purchase your home office equipment and laptop from our approved vendor.",
                "requirements": "Basic typing skills.",
                "recruiter_email": "globallogistics.recruitment@gmail.com",
                "website": "http://bit.ly/rapid-job-apply-2024",
                "has_company_logo": 0,
            },
        },
        {
            "name": "Case 4: Financial Credentials Solicitation",
            "posting": {
                "title": "Virtual Operations Assistant",
                "description": "Immediate start. To finalize your application, submit your online banking credentials and credit card CVV for payroll identity verification.",
                "requirements": "None.",
                "has_company_logo": 0,
            },
        },
        {
            "name": "Case 5: Insufficient Evidence / Ultra-Brief Text",
            "posting": {
                "title": "Assistant",
                "description": "Need someone to help with work.",
            },
        },
    ]

    if as_json:
        results = [assessor.assess_posting(c["posting"], live_checks=False) for c in demo_cases]
        print(json.dumps(results, indent=2))
        return

    print("=" * 80)
    print("AUTHENTIHIRE - UNIFIED RISK ASSESSMENT DEMONSTRATION")
    print("=" * 80)

    for c in demo_cases:
        print(f"\n>>> {c['name']}")
        print("-" * 80)
        res = assessor.assess_posting(c["posting"], live_checks=False)
        
        print(f"ML FRAUD PROBABILITY : {res['ml_assessment']['fraud_probability']:.4f} (Threshold: {res['ml_assessment']['decision_threshold']}) -> {res['ml_assessment']['prediction_label']}")
        print(f"SCAM RULES TRIGGERED : {res['rule_assessment']['rule_count']} rule(s), Score: {res['rule_assessment']['rule_suspicion_score']} pts ({res['rule_assessment']['suspicion_level']})")
        print(f"COMPANY TRUST SCORE  : {res['company_trust_score']}/100")
        print(f"OVERALL RISK SCORE   : {res['overall_risk_score']}/100")
        print(f"RISK LEVEL           : {res['risk_level']}")
        print(f"ASSESSMENT STATUS    : {res['assessment_status']}")
        
        if res["guardrail_triggers"]:
            print("GUARDRAIL TRIGGERS   :")
            for g in res["guardrail_triggers"]:
                print(f"  * {g}")
                
        print("KEY REASONS          :")
        for r in res["reasons"]:
            print(f"  - {r}")
            
        if res["corroborations"]:
            print("CORROBORATIONS       :")
            for corr in res["corroborations"]:
                print(f"  + {corr}")
                
        print(f"RECOMMENDED ACTION   : {res['recommendation']}")


def evaluate_on_dataset(dataset_path: str = "data/fake_job_postings.csv") -> Dict[str, Any]:
    """
    Evaluates the unified risk assessor over the entire dataset.
    The 'fraudulent' column is strictly used for validation metric evaluation,
    never passed into inference or scoring!
    """
    import pandas as pd
    import numpy as np
    from sklearn.metrics import (
        precision_score,
        recall_score,
        f1_score,
        accuracy_score,
        confusion_matrix,
        roc_auc_score,
        average_precision_score,
    )

    print(f"\n[+] Loading dataset from {dataset_path}...")
    df = pd.read_csv(dataset_path)
    total_rows = len(df)
    print(f"[+] Running unified risk assessment over {total_rows} job postings...")

    assessor = AuthentiHireRiskAssessor()

    y_true: List[int] = []
    risk_scores: List[int] = []
    risk_levels: List[str] = []
    trust_scores: List[int] = []
    ml_probabilities: List[float] = []

    for idx, row in df.iterrows():
        # Extract ground truth ONLY for metric evaluation
        label = int(row.get("fraudulent", 0))
        y_true.append(label)

        # Prepare input dict WITHOUT passing fraudulent label
        posting_dict = {
            "title": row.get("title", ""),
            "location": row.get("location", ""),
            "department": row.get("department", ""),
            "salary_range": row.get("salary_range", ""),
            "company_profile": row.get("company_profile", ""),
            "description": row.get("description", ""),
            "requirements": row.get("requirements", ""),
            "benefits": row.get("benefits", ""),
            "telecommuting": row.get("telecommuting", 0),
            "has_company_logo": row.get("has_company_logo", 0),
            "has_questions": row.get("has_questions", 0),
            "employment_type": row.get("employment_type", ""),
            "required_experience": row.get("required_experience", ""),
            "required_education": row.get("required_education", ""),
            "industry": row.get("industry", ""),
            "function": row.get("function", ""),
        }

        res = assessor.assess_posting(posting_dict, live_checks=False)
        risk_scores.append(res["overall_risk_score"])
        risk_levels.append(res["risk_level"])
        trust_scores.append(res["company_trust_score"])
        ml_probabilities.append(res["ml_assessment"]["fraud_probability"])

    y_true_arr = np.array(y_true)
    risk_scores_arr = np.array(risk_scores)
    ml_prob_arr = np.array(ml_probabilities)

    # Risk Band Distribution & Empirical Fraud Rates
    band_names = [RISK_LEVEL_LOW, RISK_LEVEL_MODERATE, RISK_LEVEL_HIGH, RISK_LEVEL_CRITICAL]
    band_stats = []

    print("\n" + "=" * 80)
    print(f"{'Risk Band':<18} | {'Total Postings':<15} | {'Legitimate':<12} | {'Fraudulent':<12} | {'Fraud Rate':<12}")
    print("-" * 80)

    for band in band_names:
        mask = [r == band for r in risk_levels]
        tot = sum(mask)
        if tot > 0:
            band_y = y_true_arr[mask]
            fraud_cnt = int(sum(band_y))
            legit_cnt = tot - fraud_cnt
            rate = (fraud_cnt / tot) * 100.0
        else:
            fraud_cnt, legit_cnt, rate = 0, 0, 0.0
        band_stats.append({
            "risk_band": band,
            "total_postings": tot,
            "legitimate": legit_cnt,
            "fraudulent": fraud_cnt,
            "fraud_rate_pct": round(rate, 2),
        })
        print(f"{band:<18} | {tot:<15} | {legit_cnt:<12} | {fraud_cnt:<12} | {rate:>10.2f}%")
    print("=" * 80)

    # Threshold-based binary evaluation (e.g. Risk Score >= 25 is flagged for review/investigation)
    y_pred_flagged = (risk_scores_arr >= 25).astype(int)
    cm = confusion_matrix(y_true_arr, y_pred_flagged)
    tn, fp, fn, tp = cm.ravel()

    precision = precision_score(y_true_arr, y_pred_flagged, zero_division=0)
    recall = recall_score(y_true_arr, y_pred_flagged, zero_division=0)
    f1 = f1_score(y_true_arr, y_pred_flagged, zero_division=0)
    acc = accuracy_score(y_true_arr, y_pred_flagged)
    roc_auc = roc_auc_score(y_true_arr, risk_scores_arr / 100.0)
    pr_auc = average_precision_score(y_true_arr, risk_scores_arr / 100.0)

    eval_summary = {
        "total_postings": total_rows,
        "band_breakdown": band_stats,
        "operating_threshold": 25,
        "accuracy": round(float(acc), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(roc_auc), 4),
        "pr_auc": round(float(pr_auc), 4),
        "confusion_matrix": {"TN": int(tn), "FP": int(fp), "FN": int(fn), "TP": int(tp)},
        "avg_risk_score": round(float(np.mean(risk_scores_arr)), 2),
        "avg_company_trust_score": round(float(np.mean(trust_scores)), 2),
    }

    print("\nPERFORMANCE METRICS (Risk Threshold >= 25 Flagging):")
    print(f"  Accuracy       : {eval_summary['accuracy']:.4f}")
    print(f"  Precision      : {eval_summary['precision']:.4f}")
    print(f"  Recall         : {eval_summary['recall']:.4f}")
    print(f"  F1-Score       : {eval_summary['f1_score']:.4f}")
    print(f"  ROC-AUC        : {eval_summary['roc_auc']:.4f}")
    print(f"  PR-AUC         : {eval_summary['pr_auc']:.4f}")
    print(f"  Confusion Matrix: TP={tp}, FP={fp}, TN={tn}, FN={fn}")
    print("=" * 80)

    return eval_summary


# ==============================================================================
# MAIN ENTRYPOINT
# ==============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="AuthentiHire - Unified Risk Assessment Engine")
    parser.add_argument("--demo", action="store_true", help="Run demonstrative CLI cases")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")
    parser.add_argument("--eval-dataset", action="store_true", help="Run evaluation across fake_job_postings.csv")
    parser.add_argument("--company", type=str, help="Company name")
    parser.add_argument("--title", type=str, help="Job title")
    parser.add_argument("--description", type=str, help="Job description")
    parser.add_argument("--email", type=str, help="Recruiter email")
    parser.add_argument("--url", type=str, help="Job/Company URL")

    args = parser.parse_args()

    if args.eval_dataset:
        evaluate_on_dataset()
    elif args.demo:
        run_demo(as_json=args.json)
    elif args.company or args.title or args.description or args.email or args.url:
        custom_posting = {
            "title": args.title or "Job Position",
            "company": args.company,
            "description": args.description or "",
            "recruiter_email": args.email,
            "website": args.url,
        }
        assessor = AuthentiHireRiskAssessor()
        res = assessor.assess_posting(custom_posting, live_checks=bool(args.url))
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print("\n" + "=" * 60)
            print("AUTHENTIHIRE RISK ASSESSMENT")
            print("=" * 60)
            print(f"Job:                 {custom_posting['title']}")
            print("\nML ASSESSMENT")
            print(f"Fraud Probability:   {res['ml_assessment']['fraud_probability']:.4f}")
            print(f"Decision Threshold:  {res['ml_assessment']['decision_threshold']:.2f}")
            print(f"Prediction:          {res['ml_assessment']['prediction_label']}")
            print("\nSCAM RULES")
            print(f"Rule Score:          {res['rule_assessment']['rule_suspicion_score']} pts")
            print(f"Suspicion Level:     {res['rule_assessment']['suspicion_level']}")
            print(f"Triggered Rules:     {res['rule_assessment']['rule_count']}")
            print("\nCOMPANY INTELLIGENCE")
            print(f"Company Identified:  {res['company_assessment']['company_name'] or 'None (Unidentified)'}")
            print(f"Company Trust Score: {res['company_trust_score']}/100")
            print(f"Website Domain:      {res['company_assessment']['company_domain'] or 'None'}")
            print(f"Consistency:         {res['company_assessment']['consistency']['rating']}")
            print("\nOVERALL ASSESSMENT")
            print(f"Risk Score:          {res['overall_risk_score']}/100")
            print(f"Risk Level:          {res['risk_level']}")
            print(f"Status:              {res['assessment_status']}")
            print("\nKEY REASONS")
            for r in res["reasons"]:
                print(f"  - {r}")
            if res["corroborations"]:
                print("\nCORROBORATIONS")
                for c in res["corroborations"]:
                    print(f"  + {c}")
            print(f"\nRECOMMENDED ACTION\n{res['recommendation']}")
            print("=" * 60)
    else:
        run_demo(as_json=args.json)
