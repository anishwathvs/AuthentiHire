"""
AuthentiHire - Unit Tests for Company & Website Intelligence Analyzer
======================================================================
Tests verify company identity extraction, email extraction, domain normalization,
suspicious domain heuristics, website availability/TLS inspection, redirect analysis,
caching, and consistency evaluations under 100% offline mocked conditions.
"""

import unittest
from unittest.mock import patch, MagicMock
import os
import json
import tempfile
import ssl

from src.company_intelligence import (
    CompanyIntelligenceAnalyzer,
    DomainIntelligenceCache,
    FREE_EMAIL_PROVIDERS,
    URL_SHORTENERS,
)


class TestCompanyIntelligence(unittest.TestCase):
    """Test suite for Company & Website Intelligence analyzer."""

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_cache = os.path.join(self.temp_dir.name, "test_cache.json")
        self.analyzer = CompanyIntelligenceAnalyzer(
            cache_path=self.temp_cache,
            enable_cache=True,
            request_timeout=1.0,
        )

    def tearDown(self):
        self.temp_dir.cleanup()

    # 1. Normal Company Website & Matching Email Domain
    @patch("src.company_intelligence.socket.getaddrinfo", return_value=[(2, 1, 6, "", ("93.184.216.34", 0))])
    @patch("src.company_intelligence.requests.Session.get")
    @patch("src.company_intelligence.socket.create_connection")
    @patch("src.company_intelligence.ssl.create_default_context")
    def test_01_normal_company_website_and_matching_email(self, mock_ssl_ctx, mock_socket, mock_get, mock_addr):
        # Mock SSL handshake
        mock_ssock = MagicMock()
        mock_ssock.getpeercert.return_value = {
            "issuer": ((("organizationName", "DigiCert Inc"),),),
            "subject": ((("commonName", "acme.com"),),),
            "notAfter": "Dec 31 23:59:59 2026 GMT",
        }
        mock_ssl_ctx.return_value.wrap_socket.return_value.__enter__.return_value = mock_ssock

        # Mock HTTP Response
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.url = "https://acme.com/"
        mock_resp.history = []
        mock_resp.headers = {"Content-Type": "text/html; charset=utf-8"}
        mock_resp.raw.read.return_value = b"<html><head><title>Acme Corporation - Home</title></head><body><a href='/careers'>Careers</a><a href='/contact'>Contact Us</a></body></html>"
        mock_resp.encoding = "utf-8"
        mock_get.return_value = mock_resp

        posting = {
            "company": "Acme Corporation",
            "recruiter_email": "careers@acme.com",
            "website": "https://acme.com",
            "description": "We are hiring software engineers at Acme Corporation.",
        }

        report = self.analyzer.analyze(posting, live_checks=True)

        self.assertEqual(report["company_name"], "Acme Corporation")
        self.assertEqual(len(report["emails"]), 1)
        self.assertEqual(report["emails"][0]["domain"], "acme.com")
        self.assertEqual(report["company_domain"], "acme.com")
        self.assertTrue(report["contact_checks"]["email_domain_matches_company_domain"])
        self.assertFalse(report["contact_checks"]["has_free_email_provider"])
        self.assertEqual(report["consistency"]["rating"], "HIGH")
        self.assertTrue(report["website_checks"]["acme.com"]["reachable"])
        self.assertTrue(report["website_checks"]["acme.com"]["https_supported"])
        self.assertTrue(report["website_checks"]["acme.com"]["company_name_in_title"])

    # 2. Free Gmail Recruiter Address
    def test_02_free_gmail_recruiter_address(self):
        posting = {
            "title": "Data Entry Specialist",
            "company": "Fast Logistics LLC",
            "description": "Send your resume directly to hr.recruitment2024@gmail.com for fast onboarding.",
            "recruiter_email": "hr.recruitment2024@gmail.com",
        }

        report = self.analyzer.analyze(posting, live_checks=False)

        self.assertEqual(len(report["emails"]), 1)
        self.assertTrue(report["emails"][0]["is_free_provider"])
        self.assertTrue(report["contact_checks"]["has_free_email_provider"])
        self.assertEqual(report["contact_checks"]["free_email_providers"], ["hr.recruitment2024@gmail.com"])

        # Should generate EMAIL_FREE_PROVIDER signal
        free_signals = [s for s in report["signals"] if s["signal_id"] == "EMAIL_FREE_PROVIDER"]
        self.assertEqual(len(free_signals), 1)
        self.assertEqual(free_signals[0]["severity"], "medium")

    # 3. Company Email Matching Company Domain
    def test_03_company_email_matching_domain(self):
        posting = {
            "company": "Innovatech",
            "description": "Please visit https://innovatech.io/jobs and email talent@innovatech.io",
        }

        report = self.analyzer.analyze(posting, live_checks=False)
        self.assertEqual(report["company_domain"], "innovatech.io")
        self.assertTrue(report["contact_checks"]["email_domain_matches_company_domain"])
        self.assertIn("innovatech.io", report["domains"])

    # 4. Company Email / Website Domain Mismatch
    def test_04_company_email_domain_mismatch(self):
        posting = {
            "company": "Apex Global Solutions",
            "website": "https://apexglobal.com",
            "description": "Please submit your resume to jobs@external-staffing-agency.com",
        }

        report = self.analyzer.analyze(posting, live_checks=False)
        self.assertEqual(report["company_domain"], "apexglobal.com")
        self.assertFalse(report["contact_checks"]["email_domain_matches_company_domain"])

        mismatch_signals = [s for s in report["signals"] if s["signal_id"] == "EMAIL_DOMAIN_MISMATCH"]
        self.assertEqual(len(mismatch_signals), 1)
        self.assertEqual(mismatch_signals[0]["severity"], "medium")

    # 5. URL Extraction from multiple fields
    def test_05_url_extraction_multiple_fields(self):
        posting = {
            "company_profile": "Read about us at https://about.corp.org",
            "description": "Detailed specs available at https://docs.corp.org/spec",
            "requirements": "Apply at www.corp.org/careers",
            "benefits": "See healthcare plan: https://benefits.insurance.com/plan",
        }

        report = self.analyzer.analyze(posting, live_checks=False)
        extracted_domains = set(report["domains"])
        self.assertIn("corp.org", extracted_domains)
        self.assertIn("insurance.com", extracted_domains)
        self.assertTrue(len(report["urls"]) >= 4)

    # 6. Multiple URLs and Domain Deduplication
    def test_06_multiple_urls_and_domain_deduplication(self):
        posting = {
            "description": "Visit https://company.com/about, https://company.com/jobs, and https://company.com/team.",
        }

        report = self.analyzer.analyze(posting, live_checks=False)
        self.assertEqual(len(report["domains"]), 1)
        self.assertEqual(report["domains"][0], "company.com")
        self.assertEqual(len(report["urls"]), 3)

    # 7. HTTP -> HTTPS Redirect Analysis
    @patch("src.company_intelligence.socket.getaddrinfo", return_value=[(2, 1, 6, "", ("93.184.216.34", 0))])
    @patch("src.company_intelligence.requests.Session.get")
    @patch("src.company_intelligence.socket.create_connection")
    @patch("src.company_intelligence.ssl.create_default_context")
    def test_07_http_to_https_redirect(self, mock_ssl_ctx, mock_socket, mock_get, mock_addr):
        mock_ssock = MagicMock()
        mock_ssock.getpeercert.return_value = {"subject": ((("commonName", "securecorp.com"),),)}
        mock_ssl_ctx.return_value.wrap_socket.return_value.__enter__.return_value = mock_ssock

        hist_item = MagicMock()
        hist_item.url = "http://securecorp.com"

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.url = "https://securecorp.com/home"
        mock_resp.history = [hist_item]
        mock_resp.headers = {"Content-Type": "text/html"}
        mock_resp.raw.read.return_value = b"<html><title>Secure Corp</title></html>"
        mock_resp.encoding = "utf-8"
        mock_get.return_value = mock_resp

        res = self.analyzer.check_website_availability("http://securecorp.com")
        self.assertTrue(res["reachable"])
        self.assertTrue(res["http_to_https_redirect"])
        self.assertEqual(res["redirect_count"], 1)

    # 8. Unreachable Domain / DNS Failure Handling
    @patch("src.company_intelligence.requests.Session.get")
    @patch("src.company_intelligence.socket.create_connection")
    def test_08_unreachable_domain(self, mock_socket, mock_get):
        import requests
        mock_socket.side_effect = TimeoutError("Connection timed out")
        mock_get.side_effect = requests.exceptions.ConnectionError("DNS lookup failed")

        res = self.analyzer.check_website_availability("nonexistent-broken-domain-999.xyz")
        self.assertFalse(res["reachable"])
        self.assertIn("DNS resolution failed", res["error"])
        self.assertFalse(res["https_supported"])

    # 9. Invalid or Malformed URL Handling
    def test_09_invalid_or_malformed_url(self):
        posting = {
            "website": "not_a_valid_url_at_all!@#$%",
            "description": "No valid links here.",
        }

        report = self.analyzer.analyze(posting, live_checks=False)
        self.assertEqual(len(report["domains"]), 0)

    # 10. Suspicious URL Shortener Detection
    def test_10_suspicious_url_shortener(self):
        posting = {
            "title": "Work from Home Representative",
            "description": "Immediate hire! Apply here: https://bit.ly/rapid-job-apply-2024",
        }

        report = self.analyzer.analyze(posting, live_checks=False)
        shortener_signals = [s for s in report["signals"] if s["signal_id"] == "URL_SHORTENER_DETECTED"]
        self.assertEqual(len(shortener_signals), 1)
        self.assertEqual(shortener_signals[0]["severity"], "medium")
        self.assertEqual(shortener_signals[0]["evidence"], "bit.ly")

    # 11. Raw IP Address URL Detection
    def test_11_raw_ip_address_url(self):
        posting = {
            "title": "System Operator",
            "description": "Submit testing records to http://192.168.1.50/submit.php",
        }

        report = self.analyzer.analyze(posting, live_checks=False)
        ip_signals = [s for s in report["signals"] if s["signal_id"] == "URL_RAW_IP_ADDRESS"]
        self.assertEqual(len(ip_signals), 1)
        self.assertEqual(ip_signals[0]["severity"], "high")

    # 12. Missing / Unidentifiable Company Information
    def test_12_missing_company_information(self):
        posting = {
            "title": "Customer Support Representative",
            "description": "We are seeking a hardworking individual for remote client inquiries.",
        }

        report = self.analyzer.analyze(posting, live_checks=False)
        self.assertIsNone(report["company_name"])
        self.assertEqual(
            report["company_name_explanation"],
            "Company identity could not be reliably extracted from the posting.",
        )
        self.assertEqual(report["consistency"]["rating"], "UNVERIFIED")

    # 13. Multiple Emails Extraction with Sources
    def test_13_multiple_emails_extraction(self):
        posting = {
            "recruiter_email": "recruiter@techfirm.org",
            "description": "Contact technical lead at lead-engineer@techfirm.org or support@external-help.net",
        }

        report = self.analyzer.analyze(posting, live_checks=False)
        self.assertEqual(len(report["emails"]), 3)
        emails = {e["email"] for e in report["emails"]}
        self.assertIn("recruiter@techfirm.org", emails)
        self.assertIn("lead-engineer@techfirm.org", emails)
        self.assertIn("support@external-help.net", emails)

    # 14. Domain Normalization with Multi-level Suffixes
    def test_14_domain_normalization_multilevel_suffix(self):
        norm_uk = self.analyzer.normalize_domain("https://careers.globaltech.co.uk/apply")
        self.assertEqual(norm_uk["registered_domain"], "globaltech.co.uk")
        self.assertEqual(norm_uk["subdomain"], "careers")
        self.assertEqual(norm_uk["suffix"], "co.uk")

        norm_com = self.analyzer.normalize_domain("https://portal.service.example.com/test")
        self.assertEqual(norm_com["registered_domain"], "example.com")
        self.assertEqual(norm_com["subdomain"], "portal.service")

    # 15. Cached Domain Result Verification
    @patch("src.company_intelligence.socket.getaddrinfo", return_value=[(2, 1, 6, "", ("93.184.216.34", 0))])
    @patch("src.company_intelligence.requests.Session.get")
    @patch("src.company_intelligence.socket.create_connection")
    @patch("src.company_intelligence.ssl.create_default_context")
    def test_15_cached_domain_result(self, mock_ssl_ctx, mock_socket, mock_get, mock_addr):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.url = "https://cachetarget.com"
        mock_resp.history = []
        mock_resp.headers = {"Content-Type": "text/html"}
        mock_resp.raw.read.return_value = b"<html><title>Cache Target</title></html>"
        mock_get.return_value = mock_resp

        # First lookup should perform network call and populate cache
        res1 = self.analyzer.check_website_availability("cachetarget.com")
        self.assertEqual(mock_get.call_count, 1)

        # Second lookup should retrieve from cache without additional network calls
        res2 = self.analyzer.check_website_availability("cachetarget.com")
        self.assertEqual(mock_get.call_count, 1)
        self.assertEqual(res1["domain"], res2["domain"])

    # 16. Suspicious Domain Heuristics: Numeric-Heavy & High Entropy
    def test_16_domain_heuristics_numeric_and_entropy(self):
        # Numeric-heavy domain
        num_info = self.analyzer.normalize_domain("https://9988776655-jobs.com")
        num_signals = self.analyzer.check_suspicious_domain_heuristics(num_info, "https://9988776655-jobs.com")
        self.assertTrue(any(s["signal_id"] == "DOMAIN_NUMERIC_HEAVY" for s in num_signals))

        # High entropy / consonant cluster domain
        entropy_info = self.analyzer.normalize_domain("https://qxrvtzkj-portal.com")
        entropy_signals = self.analyzer.check_suspicious_domain_heuristics(entropy_info, "https://qxrvtzkj-portal.com")
        self.assertTrue(any(s["signal_id"] == "DOMAIN_HIGH_ENTROPY" for s in entropy_signals))

        # Uncommon TLD
        tld_info = self.analyzer.normalize_domain("https://quickjobs.top")
        tld_signals = self.analyzer.check_suspicious_domain_heuristics(tld_info, "https://quickjobs.top")
        self.assertTrue(any(s["signal_id"] == "DOMAIN_UNCOMMON_TLD" for s in tld_signals))

    # 17. Structured intro pattern extraction
    def test_17_company_intro_pattern_extraction(self):
        posting = {
            "company_profile": "About CloudScale Systems: CloudScale Systems is a leading provider of cloud infrastructure solutions.",
            "description": "We are seeking a DevOps Engineer to join our team.",
        }
        name, expl = self.analyzer.extract_company_name(posting)
        self.assertEqual(name, "CloudScale Systems")
        self.assertIn("structured company introduction", expl)


if __name__ == "__main__":
    unittest.main()
