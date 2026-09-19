"""
AuthentiHire - Rule Engine Unit Test Suite
==========================================
Tests the 10 core detection scenarios including edge cases, benign keywords,
and adversarial evasion attempts.
"""

import sys
import os
import unittest
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.rule_engine import ScamRuleEngine, get_default_rules


class TestScamRuleEngine(unittest.TestCase):

    def setUp(self):
        self.engine = ScamRuleEngine()

    def test_01_clearly_legitimate_job(self):
        """1. Clearly legitimate software engineering job."""
        posting = {
            "title": "Software Engineer - Full Stack (React / Node.js)",
            "company_profile": "Acme Cloud Technologies is an enterprise SaaS company providing cloud optimization tools to Fortune 500 customers. Founded in 2015, we are backed by leading venture capital firms.",
            "description": "We are seeking an experienced Full Stack Developer to build performant web applications. You will write clean TypeScript, design GraphQL schemas, and collaborate with product designers.",
            "requirements": "3+ years of experience with React, TypeScript, and Node.js. Strong CS fundamentals and familiarity with CI/CD pipelines.",
            "benefits": "Competitive market salary ($120k-$150k), comprehensive medical/dental, 401(k) matching, 20 days PTO.",
            "has_company_logo": 1,
            "has_questions": 1,
            "telecommuting": 0,
        }
        res = self.engine.analyze_posting(posting)
        self.assertEqual(res["rule_suspicion_score"], 0)
        self.assertEqual(res["suspicion_level"], "Clean / No Suspicious Patterns")
        self.assertEqual(len(res["triggered_rules"]), 0)

    def test_02_obvious_payment_scam(self):
        """2. Obvious upfront registration fee / payment scam."""
        posting = {
            "title": "Remote Data Clerk",
            "company_profile": "",
            "description": "Immediate start. To cover administrative onboarding and background check costs, a refundable registration fee must be paid prior to receiving your employee welcome pack.",
            "requirements": "Basic typing.",
            "benefits": "Earn great money.",
            "has_company_logo": 0,
            "has_questions": 0,
        }
        res = self.engine.analyze_posting(posting)
        self.assertGreater(res["rule_suspicion_score"], 0)
        rule_ids = [r["rule_id"] for r in res["triggered_rules"]]
        self.assertIn("PAY_001", rule_ids)
        self.assertIn(res["suspicion_level"], ["Moderate Suspicion", "High Suspicion"])

    def test_03_high_salary_no_experience_scam(self):
        """3. Lucrative high salary combined with no experience required."""
        posting = {
            "title": "Data Entry Specialist",
            "company_profile": "",
            "description": "Earn $65 per hour working from home! No experience required, anyone can apply. Start immediately with no qualifications needed.",
            "requirements": "No experience needed.",
            "benefits": "Earn $4,000 per week guaranteed.",
            "has_company_logo": 0,
            "has_questions": 0,
        }
        res = self.engine.analyze_posting(posting)
        rule_ids = [r["rule_id"] for r in res["triggered_rules"]]
        self.assertTrue("EXP_001" in rule_ids or "COMP_001" in rule_ids)
        self.assertGreaterEqual(res["rule_suspicion_score"], 10)

    def test_04_financial_credential_request(self):
        """4. Solicits sensitive financial credentials during application."""
        posting = {
            "title": "Administrative Assistant",
            "company_profile": "",
            "description": "Please submit your online banking credentials, bank account number, and routing details for immediate direct deposit verification before your interview.",
            "requirements": "Online banking access.",
            "has_company_logo": 0,
            "has_questions": 0,
        }
        res = self.engine.analyze_posting(posting)
        rule_ids = [r["rule_id"] for r in res["triggered_rules"]]
        self.assertIn("FIN_001", rule_ids)
        self.assertGreaterEqual(res["rule_suspicion_score"], 20)

    def test_05_urgency_only_posting(self):
        """5. Urgency language alone (should produce a low/contained score)."""
        posting = {
            "title": "Retail Cashier - Weekend Shift",
            "company_profile": "Metro Supermarket is a local grocery chain serving the community since 1998.",
            "description": "Urgent hiring! Immediate opening! Limited positions available, apply now to join our friendly cashier team.",
            "requirements": "Good communication and punctuality.",
            "benefits": "Standard hourly retail wage.",
            "has_company_logo": 1,
            "has_questions": 1,
        }
        res = self.engine.analyze_posting(posting)
        rule_ids = [r["rule_id"] for r in res["triggered_rules"]]
        self.assertIn("URG_001", rule_ids)
        # Should not be high suspicion on urgency alone
        self.assertLess(res["rule_suspicion_score"], 15)
        self.assertEqual(res["suspicion_level"], "Low Suspicion")

    def test_06_suspicious_messaging_channel(self):
        """6. Mandates interview exclusively via Telegram / WhatsApp."""
        posting = {
            "title": "Customer Support Representative",
            "company_profile": "",
            "description": "Do not contact the company directly. Interview will be conducted via Telegram @HiringManagerHR. Send message immediately.",
            "requirements": "Telegram application.",
            "has_company_logo": 0,
            "has_questions": 0,
        }
        res = self.engine.analyze_posting(posting)
        rule_ids = [r["rule_id"] for r in res["triggered_rules"]]
        self.assertIn("COMM_001", rule_ids)
        self.assertGreaterEqual(res["rule_suspicion_score"], 15)

    def test_07_suspicious_url_pattern(self):
        """7. Contains obfuscated / URL shortener link."""
        posting = {
            "title": "Data Entry Intern",
            "company_profile": "",
            "description": "Apply for this exclusive internship opportunity at our external portal: http://bit.ly/quick-cash-job-apply-now",
            "requirements": "Basic typing.",
            "has_company_logo": 0,
            "has_questions": 0,
        }
        res = self.engine.analyze_posting(posting)
        rule_ids = [r["rule_id"] for r in res["triggered_rules"]]
        self.assertIn("URL_001", rule_ids)

    def test_08_sparse_company_information(self):
        """8. Completely missing company metadata with ultra-brief text."""
        posting = {
            "title": "Assistant",
            "company_profile": "",
            "description": "Help needed immediately. Work from computer.",
            "requirements": "",
            "benefits": "",
            "has_company_logo": 0,
            "has_questions": 0,
        }
        res = self.engine.analyze_posting(posting)
        rule_ids = [r["rule_id"] for r in res["triggered_rules"]]
        self.assertIn("CO_001", rule_ids)

    def test_09_multiple_compound_suspicious_signals(self):
        """9. Multiple red flags triggering anti-double-counting capped scores."""
        posting = {
            "title": "Financial Transaction Agent",
            "company_profile": "",
            "description": "Urgent hiring! Instant hiring no interview required. Earn $5,000 per week guaranteed. We will send a cashier check to purchase equipment from our approved vendor. Send payment fee via wire transfer or cryptocurrency. Telegram interview only.",
            "requirements": "No experience necessary, anyone can apply.",
            "benefits": "Huge earnings.",
            "has_company_logo": 0,
            "has_questions": 0,
        }
        res = self.engine.analyze_posting(posting)
        self.assertEqual(res["suspicion_level"], "High Suspicion")
        self.assertGreaterEqual(res["rule_suspicion_score"], 30)
        self.assertGreaterEqual(res["triggered_rules_count"], 4)
        # Verify anti-double-counting capped score is less than or equal to uncapped raw sum
        self.assertLessEqual(res["rule_suspicion_score"], res["raw_uncapped_score"])

    def test_10_legitimate_posting_with_benign_keywords(self):
        """10. Legitimate posting using words like 'payment', 'salary', 'WhatsApp', or 'identity' in valid contexts."""
        posting = {
            "title": "Lead Product Manager - WhatsApp Integration & Payment Gateways",
            "company_profile": "Global Fintech Corp is a publicly traded payment technology enterprise powering transactions in 80 countries.",
            "description": "We are seeking a Lead PM to oversee our WhatsApp Business API integration and payment routing infrastructure. You will collaborate with banking partners, optimize payment settlement workflows, and verify user identity verification (KYC) architectures. We offer a competitive base salary with annual performance bonuses.",
            "requirements": "7+ years in fintech, payment gateways, or enterprise messaging integrations. Strong understanding of PCI-DSS compliance.",
            "benefits": "Competitive salary, 401(k) match, comprehensive healthcare.",
            "has_company_logo": 1,
            "has_questions": 1,
            "telecommuting": 0,
        }
        res = self.engine.analyze_posting(posting)
        # Should not falsely trigger payment scams or suspicious messaging
        rule_ids = [r["rule_id"] for r in res["triggered_rules"]]
        self.assertNotIn("PAY_001", rule_ids)
        self.assertNotIn("PAY_002", rule_ids)
        self.assertNotIn("FIN_001", rule_ids)
        self.assertNotIn("COMM_001", rule_ids)
        self.assertEqual(res["rule_suspicion_score"], 0)
        self.assertEqual(res["suspicion_level"], "Clean / No Suspicious Patterns")


if __name__ == "__main__":
    unittest.main(verbosity=2)
