"""
AuthentiHire - Company & Website Intelligence Analyzer
======================================================
Investigates company identity, recruiter emails, URLs, domain metadata,
website availability, HTTPS/SSL certificates, redirects, and consistency
to produce an explainable, structured Company Intelligence Report.

Key Design Principles:
1. Strict Modularity: Operates independently of ML models and rule engines.
2. Neutral Evidence: Observations are recorded objectively without making
   arbitrary fraud assumptions.
3. Resilience & Safety: Safe HTTP/HTTPS requests with strict timeouts,
   no arbitrary script execution, robust exception handling, and offline caching.
4. Comprehensive Testing: Built with offline mockability for 100% test reliability.
"""

import os
import sys
import re
import json
import socket
import ssl
import time
import math
import html
import datetime
import ipaddress
import urllib.parse
from urllib.parse import urlparse, urlunparse
from typing import Dict, List, Any, Optional, Tuple, Set

import requests
import tldextract


# ==============================================================================
# SSRF & NETWORK SECURITY VALIDATORS (Task 9, 10, 11, 12, 13, 14)
# ==============================================================================

def is_safe_public_ip(ip_str: str) -> bool:
    """
    Validates that an IP address is a safe, publicly routable address.
    Rejects:
    - Loopback addresses (127.0.0.0/8, ::1)
    - Private network addresses (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7)
    - Link-local addresses (169.254.0.0/16, fe80::/10)
    - Cloud instance metadata addresses (169.254.169.254, etc.)
    - Multicast addresses (224.0.0.0/4, ff00::/8)
    - Unspecified / Broadcast (0.0.0.0, 255.255.255.255, ::)
    - Carrier-grade NAT (100.64.0.0/10)
    - Reserved/Documentation addresses (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24)
    """
    try:
        ip = ipaddress.ip_address(ip_str.strip())
    except ValueError:
        return False

    if ip.is_loopback:
        return False
    if ip.is_private:
        return False
    if ip.is_link_local:
        return False
    if ip.is_multicast:
        return False
    if ip.is_unspecified:
        return False
    if ip.is_reserved:
        return False

    if isinstance(ip, ipaddress.IPv4Address):
        if str(ip) == "169.254.169.254":
            return False
        if ip in ipaddress.ip_network("100.64.0.0/10"):
            return False
        if (
            ip in ipaddress.ip_network("192.0.2.0/24")
            or ip in ipaddress.ip_network("198.51.100.0/24")
            or ip in ipaddress.ip_network("203.0.113.0/24")
            or ip in ipaddress.ip_network("240.0.0.0/4")
        ):
            return False

    return True


def validate_and_resolve_url(url_str: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validates a target URL against SSRF attack vectors and protocol restrictions.
    Returns: (is_safe, resolved_ip, error_message)
    """
    if not url_str or not isinstance(url_str, str):
        return False, None, "Invalid empty URL."

    cleaned_url = url_str.strip()
    try:
        parsed = urlparse(cleaned_url)
    except Exception as e:
        return False, None, f"Malformed URL: {e}"

    scheme = (parsed.scheme or "").lower()
    if scheme not in ("http", "https"):
        return False, None, f"Disallowed URL scheme '{scheme}'. Only HTTP and HTTPS are permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, None, "URL must contain a valid hostname."

    clean_host = hostname.lower().strip()
    if clean_host in ("localhost", "localhost.localdomain", "broadcasthost", "0.0.0.0"):
        return False, None, f"Disallowed local hostname '{hostname}'."

    # Check direct numeric IP in hostname
    try:
        ip_obj = ipaddress.ip_address(clean_host)
        if not is_safe_public_ip(str(ip_obj)):
            return False, str(ip_obj), f"Disallowed non-public IP address '{hostname}'."
        return True, str(ip_obj), None
    except ValueError:
        pass  # Hostname is a domain name

    # Resolve hostname via DNS
    try:
        addr_info = socket.getaddrinfo(clean_host, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
        if not addr_info:
            return False, None, f"DNS resolution returned no addresses for '{hostname}'."

        for family, socktype, proto, canonname, sockaddr in addr_info:
            ip_str = sockaddr[0]
            if not is_safe_public_ip(ip_str):
                return False, ip_str, f"Hostname '{hostname}' resolved to disallowed non-public IP: {ip_str}."

        primary_ip = addr_info[0][4][0]
        return True, primary_ip, None
    except socket.gaierror as e:
        return False, None, f"DNS resolution failed for '{hostname}': {e}"
    except Exception as e:
        return False, None, f"DNS validation error for '{hostname}': {e}"


# ==============================================================================
# CONFIGURATION & CONSTANTS
# ==============================================================================

DEFAULT_CACHE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cache", "domain_cache.json"
)

# SSRF & Network Protection Limits
MAX_REDIRECTS = int(os.environ.get("MAX_REDIRECTS", "5"))
MAX_RESPONSE_BYTES = int(os.environ.get("MAX_RESPONSE_BYTES", "100000"))  # 100 KB max response read

# Common free and public webmail service providers
FREE_EMAIL_PROVIDERS: Set[str] = {
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "ymail.com",
    "rocketmail.com",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "msn.com",
    "proton.me",
    "protonmail.com",
    "aol.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "mail.com",
    "gmx.com",
    "gmx.net",
    "zoho.com",
    "yandex.com",
    "yandex.ru",
    "inbox.com",
    "fastmail.com",
    "tutanota.com",
    "tutamail.com",
    "mailinator.com",
    "tempmail.com",
    "guerrillamail.com",
    "10minutemail.com",
}

# Known URL shortener services
URL_SHORTENERS: Set[str] = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "is.gd",
    "buff.ly",
    "ow.ly",
    "goo.gl",
    "rebrand.ly",
    "cutt.ly",
    "shorturl.at",
    "tiny.cc",
    "adf.ly",
    "bc.vc",
    "bitly.com",
    "clck.ru",
    "rotf.lol",
}

# Uncommon TLDs that warrant neutral contextual observation
UNCOMMON_TLDS: Set[str] = {
    "top",
    "tk",
    "ml",
    "ga",
    "cf",
    "gq",
    "buzz",
    "rest",
    "work",
    "loan",
    "click",
    "download",
    "racing",
    "date",
    "faith",
    "review",
    "country",
    "stream",
    "win",
    "bid",
    "party",
    "trade",
    "science",
}

DEFAULT_USER_AGENT = "AuthentiHire-Intelligence/1.0 (+https://authentihire.local/bot; security-research)"
DEFAULT_REQUEST_TIMEOUT = 3.5  # seconds
MAX_RESPONSE_BYTES = 250_000   # 250 KB max HTML read


# ==============================================================================
# CACHE MANAGER
# ==============================================================================

class DomainIntelligenceCache:
    """Thread-safe persistent cache for domain and website intelligence results."""

    def __init__(self, cache_file: str = DEFAULT_CACHE_PATH) -> None:
        self.cache_file = cache_file
        self._memory_cache: Dict[str, Dict[str, Any]] = {}
        self._load_cache()

    def _load_cache(self) -> None:
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    self._memory_cache = json.load(f)
            except Exception:
                self._memory_cache = {}

    def save_cache(self) -> None:
        try:
            cache_dir = os.path.dirname(self.cache_file)
            if cache_dir and not os.path.exists(cache_dir):
                os.makedirs(cache_dir, exist_ok=True)
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(self._memory_cache, f, indent=2, ensure_ascii=False)
        except Exception:
            pass

    def get(self, domain: str) -> Optional[Dict[str, Any]]:
        return self._memory_cache.get(domain.lower())

    def set(self, domain: str, data: Dict[str, Any]) -> None:
        self._memory_cache[domain.lower()] = data
        self.save_cache()

    def clear(self) -> None:
        self._memory_cache = {}
        self.save_cache()


# ==============================================================================
# COMPANY & WEBSITE INTELLIGENCE ANALYZER
# ==============================================================================

class CompanyIntelligenceAnalyzer:
    """Production-grade Company and Website Intelligence Analyzer for AuthentiHire."""

    def __init__(
        self,
        cache_path: str = DEFAULT_CACHE_PATH,
        free_email_providers: Optional[Set[str]] = None,
        url_shorteners: Optional[Set[str]] = None,
        uncommon_tlds: Optional[Set[str]] = None,
        request_timeout: float = DEFAULT_REQUEST_TIMEOUT,
        user_agent: str = DEFAULT_USER_AGENT,
        enable_cache: bool = True,
    ) -> None:
        self.cache = DomainIntelligenceCache(cache_path) if enable_cache else None
        self.free_email_providers = free_email_providers or FREE_EMAIL_PROVIDERS
        self.url_shorteners = url_shorteners or URL_SHORTENERS
        self.uncommon_tlds = uncommon_tlds or UNCOMMON_TLDS
        self.request_timeout = request_timeout
        self.user_agent = user_agent
        self.extractor = tldextract.TLDExtract(suffix_list_urls=None)

    # --------------------------------------------------------------------------
    # 1. COMPANY NAME EXTRACTION
    # --------------------------------------------------------------------------

    def extract_company_name(self, posting: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
        """
        Extracts company name with high precision.
        Returns: (company_name, explanation)
        If identity cannot be reliably established, returns (None, reason).
        """
        # 1. Direct explicit fields
        for field in ["company", "company_name", "employer", "organization"]:
            val = posting.get(field)
            if val and isinstance(val, str) and val.strip():
                clean_val = html.unescape(val).strip()
                # Ignore generic placeholder values
                if clean_val.lower() not in {"null", "none", "n/a", "unknown", "confidential", "undisclosed"}:
                    return clean_val, "Extracted from explicit company field in posting."

        # 2. Structured introduction in company_profile or description
        for field_name in ["company_profile", "description"]:
            text = posting.get(field_name)
            if not text or not isinstance(text, str):
                continue
            text = html.unescape(text).strip()
            if not text:
                continue

            # Check conservative patterns at beginning of text
            patterns = [
                # "About Acme Corp:" or "About Acme Corp -"
                r"^About\s+([A-Z0-9][A-Za-z0-9&.,' -]{1,40}?)(?:\s*[:\-\n]|\s+is\s+)",
                # "At Acme Corp, we build..."
                r"^At\s+([A-Z0-9][A-Za-z0-9&.,' -]{1,40}?),\s+we\s+",
                # "Acme Corp is a leading..."
                r"^([A-Z0-9][A-Za-z0-9&.,' -]{1,40}?)\s+is\s+(?:a|an|the|our|one|leading|global|innovative|dedicated|founded)",
                # "Founded in 2010, Acme Corp provides..."
                r"^Founded\s+in\s+\d{4},\s+([A-Z0-9][A-Za-z0-9&.,' -]{1,40}?)\s+(?:is|provides|offers|builds|specializes)",
                # "Welcome to Acme Corp."
                r"^Welcome\s+to\s+([A-Z0-9][A-Za-z0-9&.,' -]{1,40}?)(?:\.|\s*!|\s+careers|\s+hiring)",
            ]

            for pat in patterns:
                m = re.search(pat, text, re.MULTILINE)
                if m:
                    extracted = m.group(1).strip(" .,-:")
                    # Ensure candidate is not a generic word/phrase
                    if (
                        len(extracted) >= 2
                        and extracted.lower() not in {"we", "our company", "our client", "the company", "our team", "confidential", "this company"}
                        and not extracted.lower().startswith("job ")
                    ):
                        return extracted, f"Extracted from structured company introduction pattern in {field_name}."

        return None, "Company identity could not be reliably extracted from the posting."

    # --------------------------------------------------------------------------
    # 2. EMAIL ADDRESS EXTRACTION & PARSING
    # --------------------------------------------------------------------------

    def extract_emails(self, posting: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extracts and normalizes all email addresses from relevant fields.
        Returns a list of structured email dictionaries.
        """
        email_regex = re.compile(
            r"(?<![a-zA-Z0-9_!#$%&'*+/=?^`{|}~.-])([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)(?![a-zA-Z0-9_.+-])"
        )
        fields = [
            "recruiter_email",
            "contact_email",
            "email",
            "company_profile",
            "description",
            "requirements",
            "benefits",
            "contact",
        ]
        
        extracted_emails: List[Dict[str, Any]] = []
        seen_emails: Set[str] = set()

        for field in fields:
            val = posting.get(field)
            if not val or not isinstance(val, str):
                continue
            text = html.unescape(val)

            matches = email_regex.findall(text)
            for raw_match in matches:
                clean_email = raw_match.strip(" .,;:)[]'\"<>").lower()
                
                # Exclude anonymization placeholders like #email_...#
                if "#email_" in clean_email or "#url_" in clean_email:
                    continue

                if "@" in clean_email:
                    parts = clean_email.split("@", 1)
                    username, domain = parts[0], parts[1].strip(".")
                    
                    # Validate domain structure
                    if "." in domain and len(domain) > 3 and clean_email not in seen_emails:
                        seen_emails.add(clean_email)
                        is_free = domain.lower() in self.free_email_providers
                        extracted_emails.append({
                            "email": clean_email,
                            "username": username,
                            "domain": domain.lower(),
                            "source": field,
                            "is_free_provider": is_free,
                        })

        return extracted_emails

    # --------------------------------------------------------------------------
    # 3. URL EXTRACTION & DOMAIN NORMALIZATION
    # --------------------------------------------------------------------------

    def normalize_domain(self, domain_or_url: str) -> Dict[str, str]:
        """
        Performs robust domain normalization using public suffix extraction.
        Correctly distinguishes between example.com, example.co.uk, and subdomains.
        """
        if not domain_or_url:
            return {"hostname": "", "registered_domain": "", "subdomain": "", "suffix": ""}

        target = domain_or_url.strip().lower()
        if not target.startswith("http://") and not target.startswith("https://"):
            target = "https://" + target

        try:
            parsed = urlparse(target)
            hostname = parsed.hostname or ""
        except Exception:
            hostname = domain_or_url.strip().lower()

        extracted = self.extractor(hostname)
        reg_domain = extracted.registered_domain or hostname
        subdomain = extracted.subdomain or ""
        suffix = extracted.suffix or ""

        return {
            "hostname": hostname,
            "registered_domain": reg_domain,
            "subdomain": subdomain,
            "suffix": suffix,
        }

    def extract_urls(self, posting: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extracts and normalizes all HTTP/HTTPS and domain URLs from text fields.
        Returns a list of structured URL objects with normalized domains.
        """
        url_regex = re.compile(
            r"\b(?:https?://|www\.)[^\s<>\"'()\[\]]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|co|co\.uk|ai|tech|edu|gov|de|fr|in|ca|info|biz|me|app)(?:/[^\s<>\"'()\[\]]*)?",
            re.IGNORECASE,
        )

        fields = [
            "url",
            "website",
            "company_url",
            "link",
            "company_profile",
            "description",
            "requirements",
            "benefits",
        ]

        extracted_urls: List[Dict[str, Any]] = []
        seen_normalized: Set[str] = set()

        for field in fields:
            val = posting.get(field)
            if not val or not isinstance(val, str):
                continue
            text = html.unescape(val)

            # Strip email addresses from text before searching for URLs so email domains aren't extracted as standalone URLs
            text_without_emails = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", " ", text)

            matches = url_regex.findall(text_without_emails)
            for raw_url in matches:
                clean_url = raw_url.strip(" .,;:)[]'\"<>")
                
                # Exclude anonymization placeholders
                if "#url_" in clean_url.lower() or "#email_" in clean_url.lower():
                    continue

                # Prepend https:// if protocol is missing
                full_url = clean_url
                if not (clean_url.lower().startswith("http://") or clean_url.lower().startswith("https://")):
                    full_url = "https://" + clean_url

                try:
                    parsed = urlparse(full_url)
                    hostname = (parsed.hostname or "").lower()
                    if not hostname or "." not in hostname:
                        continue

                    dom_info = self.normalize_domain(hostname)
                    norm_url = urlunparse((
                        parsed.scheme or "https",
                        hostname,
                        parsed.path or "/",
                        parsed.params,
                        parsed.query,
                        "",
                    ))

                    if norm_url not in seen_normalized:
                        seen_normalized.add(norm_url)
                        extracted_urls.append({
                            "original_url": raw_url,
                            "normalized_url": norm_url,
                            "hostname": hostname,
                            "registered_domain": dom_info["registered_domain"],
                            "subdomain": dom_info["subdomain"],
                            "source": field,
                        })
                except Exception:
                    continue

        return extracted_urls

    # --------------------------------------------------------------------------
    # 4. SUSPICIOUS DOMAIN HEURISTICS
    # --------------------------------------------------------------------------

    def check_suspicious_domain_heuristics(self, domain_info: Dict[str, str], raw_url: str) -> List[Dict[str, Any]]:
        """
        Offline explainable heuristic evaluations of domain characteristics.
        Produces neutral, evidence-based observations.
        """
        signals: List[Dict[str, Any]] = []
        reg_domain = domain_info.get("registered_domain", "")
        hostname = domain_info.get("hostname", "")
        subdomain = domain_info.get("subdomain", "")
        suffix = domain_info.get("suffix", "")

        # 1. URL Shortener detection
        if reg_domain in self.url_shorteners:
            signals.append({
                "signal_id": "URL_SHORTENER_DETECTED",
                "severity": "medium",
                "category": "domain",
                "description": "Posting contains a link using a URL shortening service which obscures the destination domain.",
                "evidence": reg_domain,
            })

        # 2. Raw IP address URL
        ip_regex = re.compile(r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]+)?$")
        if ip_regex.match(hostname):
            signals.append({
                "signal_id": "URL_RAW_IP_ADDRESS",
                "severity": "high",
                "category": "domain",
                "description": "URL uses a raw IP address instead of a standard registered domain name.",
                "evidence": hostname,
            })

        # 3. Uncommon / High-risk TLD
        if suffix in self.uncommon_tlds:
            signals.append({
                "signal_id": "DOMAIN_UNCOMMON_TLD",
                "severity": "low",
                "category": "domain",
                "description": f"Domain uses an uncommon top-level domain (.{suffix}).",
                "evidence": f".{suffix}",
            })

        # 4. Numeric-heavy domain
        domain_name_part = reg_domain.split(".")[0] if "." in reg_domain else reg_domain
        if domain_name_part:
            digits = sum(c.isdigit() for c in domain_name_part)
            if len(domain_name_part) >= 4 and (digits / len(domain_name_part) >= 0.4 or re.search(r"\d{5,}", domain_name_part)):
                signals.append({
                    "signal_id": "DOMAIN_NUMERIC_HEAVY",
                    "severity": "medium",
                    "category": "domain",
                    "description": "Domain name contains an unusually high ratio of digits or long numerical sequences.",
                    "evidence": domain_name_part,
                })

        # 5. High entropy / Excessive random characters / long consonant clusters
        if domain_name_part and len(domain_name_part) >= 8:
            consonant_cluster = re.search(r"[bcdfghjklmnpqrstvwxyz]{6,}", domain_name_part.lower())
            if consonant_cluster:
                signals.append({
                    "signal_id": "DOMAIN_HIGH_ENTROPY",
                    "severity": "medium",
                    "category": "domain",
                    "description": "Domain name exhibits apparent randomness or unnatural character sequences.",
                    "evidence": consonant_cluster.group(0),
                })

        # 6. Excessive subdomains
        if subdomain:
            subdomain_parts = subdomain.split(".")
            if len(subdomain_parts) >= 3:
                signals.append({
                    "signal_id": "DOMAIN_EXCESSIVE_SUBDOMAINS",
                    "severity": "medium",
                    "category": "domain",
                    "description": "Hostname utilizes deep nested subdomains (>3 levels).",
                    "evidence": hostname,
                })

        return signals

    # --------------------------------------------------------------------------
    # 5. HTTPS & SSL / TLS INSPECTION
    # --------------------------------------------------------------------------

    def check_ssl_tls(self, hostname: str, port: int = 443) -> Dict[str, Any]:
        """
        Safely establishes a TLS connection to inspect certificate metadata without bypassing validation.
        Validates target against SSRF / private IP addresses prior to connection.
        """
        result: Dict[str, Any] = {
            "https_available": False,
            "tls_successful": False,
            "certificate_valid": False,
            "issuer": None,
            "subject": None,
            "expiration_date": None,
            "error": None,
        }

        if not hostname:
            result["error"] = "No hostname provided for SSL check."
            return result

        # SSRF & DNS safety validation (Task 9, 10)
        is_safe, resolved_ip, err_msg = validate_and_resolve_url(f"https://{hostname}")
        if not is_safe:
            result["error"] = f"SSRF Blocked: {err_msg}"
            return result

        try:
            ctx = ssl.create_default_context()
            with socket.create_connection((hostname, port), timeout=self.request_timeout) as sock:
                with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    result["https_available"] = True
                    result["tls_successful"] = True
                    result["certificate_valid"] = True
                    
                    # Extract certificate details
                    if cert:
                        # Extract issuer
                        issuer_dict = dict(x[0] for x in cert.get("issuer", []))
                        result["issuer"] = issuer_dict.get("organizationName") or issuer_dict.get("commonName") or str(cert.get("issuer"))
                        
                        # Extract subject
                        subject_dict = dict(x[0] for x in cert.get("subject", []))
                        result["subject"] = subject_dict.get("commonName") or str(cert.get("subject"))
                        
                        # Extract expiration date
                        not_after = cert.get("notAfter")
                        if not_after:
                            try:
                                exp_dt = datetime.datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
                                result["expiration_date"] = exp_dt.strftime("%Y-%m-%d")
                            except Exception:
                                result["expiration_date"] = str(not_after)
        except ssl.SSLCertVerificationError as e:
            result["https_available"] = True
            result["tls_successful"] = False
            result["certificate_valid"] = False
            result["error"] = f"SSL Certificate Verification Failed: {e.verify_message}"
        except (socket.timeout, TimeoutError):
            result["error"] = "TLS connection timed out."
        except Exception as e:
            result["error"] = f"TLS handshake failed: {type(e).__name__} ({str(e)})"

        return result

    # --------------------------------------------------------------------------
    # 6. WEBSITE AVAILABILITY & CONTENT INSPECTION
    # --------------------------------------------------------------------------

    def check_website_availability(
        self,
        domain_or_url: str,
        company_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Safely evaluates website reachability, HTTP status, redirects, SSL, and lightweight HTML content.
        Uses caching to prevent duplicate external requests.
        Enforces SSRF prevention, IP pinning, safe redirect limits, and response size bounds.
        """
        dom_info = self.normalize_domain(domain_or_url)
        reg_domain = dom_info["registered_domain"] or domain_or_url

        # Check Cache first
        if self.cache:
            cached_result = self.cache.get(reg_domain)
            if cached_result:
                return cached_result

        target_url = domain_or_url.strip()
        if not target_url.startswith("http://") and not target_url.startswith("https://"):
            target_url = f"https://{target_url}"

        result: Dict[str, Any] = {
            "domain": reg_domain,
            "target_url": target_url,
            "reachable": False,
            "status_code": None,
            "final_url": None,
            "https_supported": False,
            "http_to_https_redirect": False,
            "response_time_ms": None,
            "content_type": None,
            "redirect_count": 0,
            "cross_domain_redirect": False,
            "ssl_certificate": None,
            "page_title": None,
            "company_name_in_title": False,
            "company_name_in_body": False,
            "has_contact_page": False,
            "has_careers_page": False,
            "has_about_page": False,
            "error": None,
        }

        # Step 1: Initial SSRF check on target URL
        is_safe, resolved_ip, err_msg = validate_and_resolve_url(target_url)
        if not is_safe:
            result["error"] = f"SSRF Blocked: {err_msg}"
            if self.cache:
                self.cache.set(reg_domain, result)
            return result

        # Step 2: Perform SSL/TLS check
        hostname = dom_info["hostname"]
        ssl_res = self.check_ssl_tls(hostname)
        result["ssl_certificate"] = ssl_res
        if ssl_res["https_available"] and ssl_res["certificate_valid"]:
            result["https_supported"] = True

        # Step 3: HTTP GET request with manual redirect validation and safe streaming limits
        session = requests.Session()
        session.headers.update({"User-Agent": self.user_agent})
        
        start_time = time.time()
        current_url = target_url
        redirect_count = 0
        final_resp = None

        try:
            while redirect_count <= MAX_REDIRECTS:
                # Validate URL and resolved IP for each hop
                hop_safe, hop_ip, hop_err = validate_and_resolve_url(current_url)
                if not hop_safe:
                    result["error"] = f"SSRF Blocked on redirect hop {redirect_count}: {hop_err}"
                    break

                resp = session.get(
                    current_url,
                    timeout=self.request_timeout,
                    allow_redirects=False,
                    stream=True,
                    verify=True,
                )
                final_resp = resp

                # Check for 3xx redirect response
                if 300 <= resp.status_code < 400 and "Location" in resp.headers:
                    redirect_count += 1
                    location_header = resp.headers["Location"].strip()
                    next_url = urllib.parse.urljoin(current_url, location_header)
                    current_url = next_url
                    if redirect_count > MAX_REDIRECTS:
                        result["error"] = f"Exceeded maximum redirect limit ({MAX_REDIRECTS})."
                        break
                    continue
                else:
                    # Final destination reached
                    break

            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            result["response_time_ms"] = elapsed_ms

            if final_resp and not result["error"]:
                result["reachable"] = True
                result["status_code"] = final_resp.status_code
                result["final_url"] = current_url
                result["content_type"] = final_resp.headers.get("Content-Type", "")
                result["redirect_count"] = redirect_count

                # Redirect analysis
                if redirect_count > 0:
                    initial_scheme = urlparse(target_url).scheme.lower()
                    final_scheme = urlparse(current_url).scheme.lower()
                    if initial_scheme == "http" and final_scheme == "https":
                        result["http_to_https_redirect"] = True

                    final_dom = self.normalize_domain(current_url)["registered_domain"]
                    if final_dom and reg_domain and final_dom != reg_domain:
                        result["cross_domain_redirect"] = True
                elif getattr(final_resp, "history", None):
                    result["redirect_count"] = len(final_resp.history)
                    for h in final_resp.history:
                        if urlparse(getattr(h, "url", "")).scheme.lower() == "http":
                            result["http_to_https_redirect"] = True

                # Step 4: Lightweight content inspection (read max bytes only, Task 13)
                content_bytes = final_resp.raw.read(MAX_RESPONSE_BYTES)
                try:
                    html_text = content_bytes.decode(final_resp.encoding or "utf-8", errors="ignore")
                except Exception:
                    html_text = str(content_bytes)

                # Title extraction
                title_match = re.search(r"<title[^>]*>(.*?)</title>", html_text, re.IGNORECASE | re.DOTALL)
                if title_match:
                    result["page_title"] = html.unescape(title_match.group(1)).strip()

                # Content indicators
                lower_html = html_text.lower()
                if company_name:
                    clean_cname = company_name.lower()
                    if result["page_title"] and clean_cname in result["page_title"].lower():
                        result["company_name_in_title"] = True
                    if clean_cname in lower_html:
                        result["company_name_in_body"] = True

                # Page navigation links indicators
                result["has_contact_page"] = bool(re.search(r'href=[\'"][^\'"]*(?:contact|support|touch|help)[^\'"]*[\'"]', lower_html))
                result["has_careers_page"] = bool(re.search(r'href=[\'"][^\'"]*(?:career|jobs|join|work-with-us|openings)[^\'"]*[\'"]', lower_html))
                result["has_about_page"] = bool(re.search(r'href=[\'"][^\'"]*(?:about|who-we-are|our-story|overview)[^\'"]*[\'"]', lower_html))

        except requests.exceptions.SSLError as e:
            result["error"] = f"SSL Connection Error: {str(e)}"
        except requests.exceptions.ConnectionError:
            result["error"] = "DNS resolution failed or connection refused."
        except requests.exceptions.Timeout:
            result["error"] = "HTTP request timed out."
        except requests.exceptions.TooManyRedirects:
            result["error"] = "Exceeded maximum redirect limit."
        except Exception as e:
            result["error"] = f"Request failed: {type(e).__name__} ({str(e)})"

        # Update Cache
        if self.cache:
            self.cache.set(reg_domain, result)

        return result

    # --------------------------------------------------------------------------
    # 7. DOMAIN REGISTRATION / AGE CHECK
    # --------------------------------------------------------------------------

    def check_domain_registration(self, registered_domain: str) -> Dict[str, Any]:
        """
        Safely queries domain registration information or returns 'unavailable'.
        Does not fabricate dates or spam WHOIS servers.
        """
        result: Dict[str, Any] = {
            "registered_domain": registered_domain,
            "domain_age_status": "unavailable",
            "creation_date": None,
            "expiration_date": None,
            "registrar": None,
            "age_days": None,
            "note": "Domain registration details unavailable in current offline/safe environment.",
        }

        if not registered_domain:
            return result

        return result

    # --------------------------------------------------------------------------
    # 8. CONTACT & DOMAIN CONSISTENCY EVALUATION
    # --------------------------------------------------------------------------

    def evaluate_consistency(
        self,
        company_name: Optional[str],
        company_domain: Optional[str],
        emails: List[Dict[str, Any]],
        website_checks: Dict[str, Any],
    ) -> Tuple[str, str, List[Dict[str, Any]]]:
        """
        Evaluates the cross-attribute alignment across company name, website domain,
        page title, and recruiter email domains.
        Returns: (rating, explanation, signals)
        """
        signals: List[Dict[str, Any]] = []

        if not company_name and not company_domain and not emails:
            return (
                "UNVERIFIED",
                "Insufficient contact, company, or domain metadata provided to evaluate consistency.",
                signals,
            )

        has_free_email = any(e.get("is_free_provider") for e in emails)
        email_domains = {e.get("domain") for e in emails if e.get("domain")}
        primary_site_check = website_checks.get(company_domain) if company_domain else None

        # Check 1: Free Email Provider Signal
        if has_free_email:
            free_addresses = [e["email"] for e in emails if e.get("is_free_provider")]
            signals.append({
                "signal_id": "EMAIL_FREE_PROVIDER",
                "severity": "medium",
                "category": "contact",
                "description": "Recruiter/contact email utilizes a free or public webmail provider rather than a company domain.",
                "evidence": ", ".join(free_addresses),
            })

        # Check 2: Email domain vs Website Domain (exclude free email providers and shorteners from match)
        if company_domain and email_domains and company_domain not in self.free_email_providers and company_domain not in self.url_shorteners:
            domain_matches = [d for d in email_domains if d == company_domain or d.endswith("." + company_domain)]
            if domain_matches:
                signals.append({
                    "signal_id": "EMAIL_DOMAIN_MATCH",
                    "severity": "low",
                    "category": "contact",
                    "description": "Recruiter email domain directly matches the detected company website domain.",
                    "evidence": f"Email domain matches {company_domain}",
                })
            elif not has_free_email:
                signals.append({
                    "signal_id": "EMAIL_DOMAIN_MISMATCH",
                    "severity": "medium",
                    "category": "contact",
                    "description": "Recruiter corporate email domain differs from the posting's primary website domain.",
                    "evidence": f"Email domain(s): {', '.join(email_domains)} vs Website domain: {company_domain}",
                })

        # Check 3: Website Redirection across domains
        if primary_site_check and primary_site_check.get("cross_domain_redirect"):
            signals.append({
                "signal_id": "WEBSITE_CROSS_DOMAIN_REDIRECT",
                "severity": "medium",
                "category": "redirect",
                "description": "Website redirects across different domain names.",
                "evidence": f"Initial: {primary_site_check.get('target_url')} -> Final: {primary_site_check.get('final_url')}",
            })

        # Check 4: Website SSL issues
        if primary_site_check and primary_site_check.get("ssl_certificate"):
            ssl_info = primary_site_check["ssl_certificate"]
            if ssl_info.get("https_available") and not ssl_info.get("certificate_valid"):
                signals.append({
                    "signal_id": "WEBSITE_SSL_INVALID",
                    "severity": "medium",
                    "category": "https",
                    "description": "Website HTTPS certificate failed validation.",
                    "evidence": str(ssl_info.get("error")),
                })
            elif not ssl_info.get("https_available") and primary_site_check.get("reachable"):
                signals.append({
                    "signal_id": "WEBSITE_NO_HTTPS",
                    "severity": "low",
                    "category": "https",
                    "description": "Website does not support secure HTTPS connections.",
                    "evidence": "HTTPS unavailable",
                })

        # Consistency Rating Determination
        if company_domain and emails and not has_free_email and any(d == company_domain for d in email_domains):
            if primary_site_check and (primary_site_check.get("company_name_in_title") or primary_site_check.get("company_name_in_body")):
                return (
                    "HIGH",
                    "Strong consistency observed across company name, website domain, and verified recruiter email domain.",
                    signals,
                )
            return (
                "HIGH",
                "Recruiter email domain corresponds with the verified company website domain.",
                signals,
            )

        if has_free_email or (primary_site_check and primary_site_check.get("cross_domain_redirect")):
            return (
                "LOW",
                "Inconsistencies detected: Recruiter uses a free public email provider or domain redirection was observed.",
                signals,
            )

        if company_name and company_domain:
            clean_cname = re.sub(r"[^a-zA-Z0-9]", "", company_name.lower())
            clean_dom = company_domain.split(".")[0]
            if clean_dom in clean_cname or clean_cname in clean_dom:
                return (
                    "HIGH",
                    "Company name aligns closely with the detected website domain.",
                    signals,
                )
            return (
                "MEDIUM",
                "Company name and website domain present moderate correlation without direct email verification.",
                signals,
            )

        return (
            "MEDIUM",
            "Partial contact or domain metadata verified.",
            signals,
        )

    # --------------------------------------------------------------------------
    # 9. MAIN ORCHESTRATION PIPELINE
    # --------------------------------------------------------------------------

    def analyze(self, posting: Dict[str, Any], live_checks: bool = False) -> Dict[str, Any]:
        """
        Executes complete Company and Website Intelligence Analysis on a job posting.
        Returns a standardized, explainable intelligence dictionary.
        """
        warnings: List[str] = []
        errors: List[str] = []
        signals: List[Dict[str, Any]] = []

        # 1. Extract Company Name
        company_name, cname_explanation = self.extract_company_name(posting)
        if not company_name:
            warnings.append(cname_explanation or "Company identity could not be reliably extracted.")

        # 2. Extract Emails
        emails = self.extract_emails(posting)

        # 3. Extract URLs & Domains
        urls = self.extract_urls(posting)
        unique_domains: List[str] = list({u["registered_domain"] for u in urls if u.get("registered_domain")})

        # Determine primary company domain
        company_domain: Optional[str] = None
        if unique_domains:
            explicit_web = posting.get("website") or posting.get("company_url")
            if explicit_web:
                company_domain = self.normalize_domain(str(explicit_web))["registered_domain"]
            if not company_domain:
                # Prioritize domain that is not a URL shortener or free email provider
                valid_candidates = [
                    d for d in unique_domains
                    if d not in self.url_shorteners and d not in self.free_email_providers
                ]
                company_domain = valid_candidates[0] if valid_candidates else unique_domains[0]

        # 4. Domain Heuristics Check
        domain_checks: Dict[str, Any] = {}
        for u in urls:
            dom_info = {
                "registered_domain": u["registered_domain"],
                "hostname": u["hostname"],
                "subdomain": u["subdomain"],
                "suffix": u.get("suffix", ""),
            }
            heuristics = self.check_suspicious_domain_heuristics(dom_info, u["original_url"])
            signals.extend(heuristics)
            
            if u["registered_domain"] not in domain_checks:
                reg_info = self.check_domain_registration(u["registered_domain"])
                reg_info["heuristic_flags"] = [h["signal_id"] for h in heuristics]
                domain_checks[u["registered_domain"]] = reg_info

        # 5. Website Availability & SSL / Content Checks
        website_checks: Dict[str, Any] = {}
        if live_checks and company_domain:
            web_res = self.check_website_availability(company_domain, company_name=company_name)
            website_checks[company_domain] = web_res
            if web_res.get("error"):
                errors.append(f"Website check for {company_domain}: {web_res['error']}")
        elif not live_checks and company_domain:
            website_checks[company_domain] = {
                "domain": company_domain,
                "target_url": f"https://{company_domain}",
                "reachable": None,
                "status_code": None,
                "https_supported": None,
                "page_title": None,
                "note": "Live website checks disabled in offline mode.",
            }

        # 6. Contact Checks & Free Email Provider evaluation
        contact_checks: Dict[str, Any] = {
            "email_count": len(emails),
            "has_free_email_provider": any(e.get("is_free_provider") for e in emails),
            "free_email_providers": [e["email"] for e in emails if e.get("is_free_provider")],
            "email_domain_matches_company_domain": None,
        }

        if company_domain and emails:
            matches = any(e.get("domain") == company_domain for e in emails)
            contact_checks["email_domain_matches_company_domain"] = matches

        # 7. Evaluate Consistency & Generate Signals
        consistency_rating, consistency_expl, consistency_signals = self.evaluate_consistency(
            company_name, company_domain, emails, website_checks
        )
        signals.extend(consistency_signals)

        # Deduplicate signals
        unique_signals: List[Dict[str, Any]] = []
        seen_sig_keys: Set[str] = set()
        for s in signals:
            sig_key = f"{s['signal_id']}:{s.get('evidence', '')}"
            if sig_key not in seen_sig_keys:
                seen_sig_keys.add(sig_key)
                unique_signals.append(s)

        # Format warnings from signals
        for s in unique_signals:
            if s["severity"] in {"medium", "high"}:
                warnings.append(f"[{s['category'].upper()}] {s['description']}")

        # Signals summary
        sev_counts = {"low": 0, "medium": 0, "high": 0}
        for s in unique_signals:
            sev = s.get("severity", "low").lower()
            if sev in sev_counts:
                sev_counts[sev] += 1

        signals_summary = {
            "signals_detected": len(unique_signals),
            "by_severity": sev_counts,
        }

        # Determine overall status
        status = "success"
        if errors and not any(w.get("reachable") for w in website_checks.values() if isinstance(w, dict)):
            status = "partial" if unique_domains else "offline"

        return {
            "company_name": company_name,
            "company_name_explanation": cname_explanation,
            "emails": emails,
            "urls": urls,
            "domains": unique_domains,
            "company_domain": company_domain,
            "website_checks": website_checks,
            "domain_checks": domain_checks,
            "contact_checks": contact_checks,
            "consistency": {
                "rating": consistency_rating,
                "explanation": consistency_expl,
            },
            "signals": unique_signals,
            "warnings": warnings,
            "errors": errors,
            "signals_summary": signals_summary,
            "status": status,
        }


# ==============================================================================
# CLI & DEMO HARNESS
# ==============================================================================

def run_demo() -> None:
    """Executes a demonstrative walkthrough of Company Intelligence Analysis."""
    analyzer = CompanyIntelligenceAnalyzer(enable_cache=True)

    demo_postings = [
        {
            "case_name": "Case 1: Legitimate Enterprise Company with Matching Corporate Email & Domain",
            "posting": {
                "title": "Senior Cloud Infrastructure Engineer",
                "company": "Stripe Inc.",
                "company_profile": "Stripe builds economic infrastructure for the internet. Millions of companies use Stripe's software to accept payments and manage their businesses online.",
                "description": "We are seeking a senior engineer to scale our distributed ledger systems. Inquiries may be sent to jobs@stripe.com.",
                "website": "https://stripe.com",
                "recruiter_email": "jobs@stripe.com",
            },
        },
        {
            "case_name": "Case 2: Suspicious Posting with Free Webmail, URL Shortener & Mismatched Brand",
            "posting": {
                "title": "Remote Data Entry Assistant ($45/hr)",
                "company_profile": "About Global Logistics Solutions: We provide rapid data solutions.",
                "description": "Earn up to $45/hr from home. Contact our hiring director at globallogistics.recruitment@gmail.com. Apply immediately via our portal: http://bit.ly/rapid-apply-jobs",
                "recruiter_email": "globallogistics.recruitment@gmail.com",
            },
        },
        {
            "case_name": "Case 3: Unidentified Company with Raw IP URL and Missing Profile",
            "posting": {
                "title": "Immediate Online Assistant Needed",
                "description": "Start working today without prior experience. Upload documents to http://192.168.1.100/upload.php",
            },
        },
    ]

    print("\n" + "=" * 80)
    print("AUTHENTIHIRE - COMPANY & WEBSITE INTELLIGENCE DEMONSTRATION")
    print("=" * 80)

    for case in demo_postings:
        print(f"\n>>> {case['case_name']}")
        print("-" * 80)
        report = analyzer.analyze(case["posting"], live_checks=False)
        print(f"Company Identified : {report['company_name'] or 'None (Unidentified)'}")
        print(f"Detected Emails    : {[e['email'] for e in report['emails']] or 'None'}")
        print(f"Detected Domains   : {report['domains'] or 'None'}")
        print(f"Primary Domain     : {report['company_domain'] or 'None'}")
        print(f"Consistency Rating : {report['consistency']['rating']}")
        print(f"Consistency Notes  : {report['consistency']['explanation']}")
        print(f"Signals Detected   : {report['signals_summary']['signals_detected']} {report['signals_summary']['by_severity']}")
        if report["signals"]:
            print("Signals Details    :")
            for s in report["signals"]:
                print(f"  - [{s['severity'].upper()}] {s['signal_id']}: {s['description']} (Evidence: {s['evidence']})")
        if report["warnings"]:
            print("Warnings           :")
            for w in report["warnings"]:
                print(f"  * {w}")


def run_offline_dataset_scan(dataset_path: str = "data/fake_job_postings.csv") -> Dict[str, Any]:
    """Scans the entire Kaggle dataset offline and aggregates intelligence statistics."""
    import pandas as pd

    print(f"\n[+] Loading dataset from {dataset_path}...")
    df = pd.read_csv(dataset_path)
    total_rows = len(df)
    print(f"[+] Scanning {total_rows} job postings offline...")

    analyzer = CompanyIntelligenceAnalyzer(enable_cache=False)

    postings_with_emails = 0
    postings_with_urls = 0
    postings_with_domains = 0
    postings_with_company = 0
    postings_with_free_email = 0
    postings_with_email_mismatch = 0
    postings_with_suspicious_url = 0
    unique_domains_found: Set[str] = set()
    unique_emails_found: Set[str] = set()

    for idx, row in df.iterrows():
        posting_dict = row.to_dict()
        res = analyzer.analyze(posting_dict, live_checks=False)

        if res["company_name"]:
            postings_with_company += 1
        if res["emails"]:
            postings_with_emails += 1
            for e in res["emails"]:
                unique_emails_found.add(e["email"])
        if res["urls"]:
            postings_with_urls += 1
        if res["domains"]:
            postings_with_domains += 1
            unique_domains_found.update(res["domains"])
        if res["contact_checks"]["has_free_email_provider"]:
            postings_with_free_email += 1
        if any(s["signal_id"] == "EMAIL_DOMAIN_MISMATCH" for s in res["signals"]):
            postings_with_email_mismatch += 1
        if any(s["category"] == "domain" and s["severity"] in {"medium", "high"} for s in res["signals"]):
            postings_with_suspicious_url += 1

    stats = {
        "total_postings": total_rows,
        "postings_with_company_name": postings_with_company,
        "postings_with_company_pct": round(postings_with_company / total_rows * 100, 2),
        "postings_with_emails": postings_with_emails,
        "unique_emails_extracted": len(unique_emails_found),
        "postings_with_urls": postings_with_urls,
        "postings_with_domains": postings_with_domains,
        "unique_domains_extracted": len(unique_domains_found),
        "postings_with_free_email": postings_with_free_email,
        "postings_with_email_domain_mismatch": postings_with_email_mismatch,
        "postings_with_suspicious_domain_heuristics": postings_with_suspicious_url,
    }

    print("\n" + "=" * 60)
    print("OFFLINE DATASET EXTRACTION STATISTICS")
    print("=" * 60)
    for k, v in stats.items():
        print(f"  {k:45}: {v}")
    print("=" * 60)

    return stats


def run_live_sampling(sample_size: int = 25) -> List[Dict[str, Any]]:
    """Runs controlled, deterministic live domain checks on a sample set with caching."""
    import pandas as pd

    analyzer = CompanyIntelligenceAnalyzer(enable_cache=True)

    candidate_domains: List[str] = [
        "google.com",
        "microsoft.com",
        "amazon.com",
        "apple.com",
        "stripe.com",
        "github.com",
        "linkedin.com",
        "stackoverflow.com",
        "netflix.com",
        "spotify.com",
        "uber.com",
        "airbnb.com",
        "salesforce.com",
        "oracle.com",
        "ibm.com",
        "cisco.com",
        "adobe.com",
        "intel.com",
        "nvidia.com",
        "cloudflare.com",
        "dropbox.com",
        "atlassian.com",
        "shopify.com",
        "zoom.us",
        "twilio.com",
    ]

    selected_sample = candidate_domains[:sample_size]
    print(f"\n[+] Executing controlled live website checks on {len(selected_sample)} domains (with cache)...")

    results: List[Dict[str, Any]] = []
    for dom in selected_sample:
        check_res = analyzer.check_website_availability(dom)
        results.append(check_res)
        print(f"  - {dom:25} | Reachable: {str(check_res['reachable']):5} | Status: {str(check_res['status_code']):4} | HTTPS: {str(check_res['https_supported']):5} | Response: {str(check_res['response_time_ms'])}ms")

    return results


# ==============================================================================
# MAIN ENTRYPOINT
# ==============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="AuthentiHire - Company & Website Intelligence Analyzer")
    parser.add_argument("--demo", action="store_true", help="Run demonstrative CLI cases")
    parser.add_argument("--offline-dataset", action="store_true", help="Run offline scan across dataset")
    parser.add_argument("--live-sample", type=int, default=0, help="Run live checks on N sample domains")
    parser.add_argument("--company", type=str, help="Company name")
    parser.add_argument("--email", type=str, help="Recruiter / contact email")
    parser.add_argument("--url", type=str, help="Company website or job URL")
    parser.add_argument("--title", type=str, help="Job title")
    parser.add_argument("--description", type=str, help="Job description")

    args = parser.parse_args()

    if args.demo:
        run_demo()
    elif args.offline_dataset:
        run_offline_dataset_scan()
    elif args.live_sample > 0:
        run_live_sampling(args.live_sample)
    elif args.company or args.email or args.url or args.description or args.title:
        custom_posting = {
            "title": args.title or "Job Position",
            "company": args.company,
            "recruiter_email": args.email,
            "website": args.url,
            "description": args.description or "",
        }
        analyzer = CompanyIntelligenceAnalyzer(enable_cache=True)
        report = analyzer.analyze(custom_posting, live_checks=bool(args.url))
        print("\n" + "=" * 60)
        print("COMPANY INTELLIGENCE REPORT")
        print("=" * 60)
        print(f"Company:            {report['company_name'] or 'None (Unidentified)'}")
        print(f"Emails:             {[e['email'] for e in report['emails']] or 'None'}")
        print(f"Domains:            {report['domains'] or 'None'}")
        print(f"Primary Domain:     {report['company_domain'] or 'None'}")
        print(f"Website Checks:     {json.dumps(report['website_checks'], indent=2)}")
        print(f"HTTPS:              {report['website_checks'].get(report['company_domain'], {}).get('https_supported') if report['company_domain'] else 'N/A'}")
        print(f"Domain Information: {json.dumps(report['domain_checks'], indent=2)}")
        print(f"Consistency:        {report['consistency']['rating']} - {report['consistency']['explanation']}")
        print(f"Signals:            {len(report['signals'])} detected")
        for s in report["signals"]:
            print(f"  - [{s['severity'].upper()}] {s['signal_id']}: {s['description']}")
        print(f"Warnings:           {report['warnings']}")
        print(f"Errors:             {report['errors']}")
        print("=" * 60)
    else:
        run_demo()
