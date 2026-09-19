# AuthentiHire — Phase 4: Company & Website Intelligence Report

## 1. Executive Summary & Architectural Overview

Phase 4 introduces an independent, modular, and explainable **Company & Website Intelligence Analyzer** (`src/company_intelligence.py`) for the AuthentiHire employment scam detection platform. 

The objective of Phase 4 is to assess the trustworthiness, validity, and cross-attribute consistency of corporate identity signals—including employer names, recruiter email addresses, links/URLs, domain registrations, website reachability, TLS/SSL certificate chains, and HTTP redirect paths—without altering the trained machine learning pipeline or modifying the Phase 3 rule engine scoring system.

```
                                +-----------------------------------+
                                |            JOB POSTING            |
                                +-----------------------------------+
                                                  |
                     +----------------------------+----------------------------+
                     |                                                         |
                     v                                                         v
          +---------------------+                                   +---------------------+
          |    ML CLASSIFIER    |                                   |     RULE ENGINE     |
          | (Calibrated LR/RF)  |                                   |  (13 Heuristic Cls) |
          +---------------------+                                   +---------------------+
                     |                                                         |
                     +----------------------------+----------------------------+
                                                  |
                                                  v
                               +-------------------------------------+
                               |    COMPANY INTELLIGENCE ANALYZER    |
                               +-------------------------------------+
                               |  - Company Name Extraction          |
                               |  - Email Parsing & Free Mail Checks |
                               |  - URL Parsing & Domain Normalizer  |
                               |  - Offline Domain Heuristics        |
                               |  - TLS / SSL Certificate Inspection |
                               |  - HTTP Availability & Redirects    |
                               |  - Cross-Attribute Consistency Check|
                               |  - Local File-Based Caching         |
                               +-------------------------------------+
                                                  |
                                                  v
                               +-------------------------------------+
                               |     STRUCTURED EVIDENCE SIGNALS     |
                               +-------------------------------------+
```

---

## 2. Intelligence Extraction & Normalization Methodology

### 2.1 Company Name Extraction
- **Explicit Metadata Fields**: Prioritizes explicit posting keys (`company`, `company_name`, `employer`, `organization`). Rejects placeholder strings (`"null"`, `"n/a"`, `"confidential"`, `"undisclosed"`).
- **Structured Linguistic Anchor Patterns**: Uses conservative regex anchors on `company_profile` and `description` (e.g., `^About ([A-Z0-9][A-Za-z0-9&.,' -]{1,40}?):`, `^At ([A-Z0-9][A-Za-z0-9&.,' -]{1,40}?), we build...`, `^([A-Z0-9][A-Za-z0-9&.,' -]{1,40}?) is a leading...`).
- **Conservative Fallback**: If no structured company identity is confidently extracted, sets `company_name = None` and provides the neutral explanation: `"Company identity could not be reliably extracted from the posting."` No company names are fabricated.

### 2.2 Email Extraction & Free Provider Detection
- **Extraction**: Employs an RFC-compliant regex across all structured text fields (`company_profile`, `description`, `requirements`, `benefits`, `recruiter_email`). Normalizes emails to lowercase and removes punctuation.
- **Provider Classification**: Compares domain against a configurable list of public/free webmail providers (`gmail.com`, `yahoo.com`, `outlook.com`, `proton.me`, `icloud.com`, etc.).
- **Signal Generation**: Free email addresses generate `EMAIL_FREE_PROVIDER` (`severity: medium`, `"Recruiter/contact email utilizes a free or public webmail provider rather than a company domain."`).

### 2.3 URL Extraction & Domain Normalization
- **Parsing**: Extracts full HTTP/HTTPS URIs and naked domain representations using `urllib.parse` and `tldextract`.
- **Public Suffix List Normalization**: Uses `tldextract` with a local PSL snapshot (`suffix_list_urls=None`) to correctly distinguish registered domains from multi-part country code TLDs (e.g., `careers.example.co.uk` -> registered domain `example.co.uk`, subdomain `careers`).
- **Shortener & Anonymization Filtering**: Filters dataset anonymization hashes (`#URL_...#`) and identifies URL shortener services (`bit.ly`, `tinyurl.com`, `t.co`, `is.gd`, etc.).

---

## 3. Website & Domain Verification Methodology

### 3.1 Website Availability Check
- **Safe HTTP Methods**: Issues GET requests with `stream=True` and a strict `MAX_RESPONSE_BYTES` (250 KB) boundary to prevent memory bloat or large payload downloads.
- **Strict Timeouts & Safe User-Agent**: Configured with a default timeout of 3.5 seconds and identifiable User-Agent (`AuthentiHire-Intelligence/1.0 (+https://authentihire.local/bot; security-research)`).
- **Resilience**: Comprehensive exception handling captures DNS failures, socket timeouts, connection resets, and HTTP 4xx/5xx status codes without treating network failures as automatic fraud proof.

### 3.2 HTTPS & TLS / SSL Certificate Inspection
- **Direct Handshake**: Connects via `socket.create_connection` and wraps with `ssl.create_default_context()` on port 443 with server hostname SNI.
- **Certificate Metadata**: Extracts issuer organization, subject common name, and validity expiration date.
- **Strict Validation**: SSL verification is never disabled. Invalid certificates trigger `WEBSITE_SSL_INVALID` (`severity: medium`).

### 3.3 Redirect Analysis
- **Chain Tracking**: Inspects `response.history` to record the full redirect sequence.
- **Cross-Domain Detection**: Flags instances where the initial hostname redirects to an entirely distinct root domain (`WEBSITE_CROSS_DOMAIN_REDIRECT`).

### 3.4 Domain Registration & WHOIS Handling
- In accordance with rate limits and safe local execution, when WHOIS/RDAP is unavailable or unconfigured, the system returns `domain_age_status = "unavailable"`. No fabricated registration dates are created.

### 3.5 Suspicious Domain Heuristics
- **High Entropy / Consonant Clusters**: Flags domains with unnatural randomness or ≥6 consecutive consonants (`DOMAIN_HIGH_ENTROPY`).
- **Numeric-Heavy**: Flags domains where ≥40% of characters are digits or contains ≥5 sequential digits (`DOMAIN_NUMERIC_HEAVY`).
- **Raw IP Address**: Flags direct IP addresses used in place of domain names (`URL_RAW_IP_ADDRESS`, `severity: high`).
- **Uncommon TLDs**: Emits neutral observations for rare TLDs (`.top`, `.tk`, `.ml`, `.buzz`, etc.) without declaring them scams (`DOMAIN_UNCOMMON_TLD`, `severity: low`).

---

## 4. Cross-Attribute Consistency Framework

The module evaluates cross-attribute alignment across the extracted entity dimensions:

| Company Name | Website Domain | Recruiter Email Domain | Observed Consistency | Consistency Rating |
| :--- | :--- | :--- | :--- | :--- |
| `"Acme Corp"` | `acme.com` | `jobs@acme.com` | Corporate domain matches recruiter email and company brand | **HIGH** |
| `"Acme Corp"` | `acme.com` | `acmecareers@gmail.com` | Free email provider creates institutional mismatch | **LOW** |
| `"Acme Corp"` | `acme.com` | `jobs@external-recruiting.com` | Email domain differs from corporate domain | **MEDIUM / REVIEW** |
| `None` | `192.168.1.1` | `None` | No verified identity, raw IP address | **UNVERIFIED** |

---

## 5. Offline Dataset Scan Statistics (All 17,880 Postings)

Analysis across all 17,880 rows of `data/fake_job_postings.csv`:

| Metric | Count | Percentage |
| :--- | :--- | :--- |
| **Total Postings Analyzed** | 17,880 | 100.00% |
| **Postings with Confidently Extracted Company Name** | 5,566 | 31.13% |
| **Postings with Unidentified Company Identity** | 12,314 | 68.87% |
| **Postings Containing Non-Anonymized URLs** | 5,385 | 30.12% |
| **Total Unique Registered Domains Extracted** | 3,283 | — |
| **Postings with Non-Anonymized Emails** | 2 | 0.01% |
| **Postings Triggering Suspicious Domain Heuristics** | 83 | 0.46% |

> **Note on Dataset Anonymization**: In the Kaggle EMSCAD benchmark dataset, the dataset authors heavily pre-sanitized job postings by replacing sensitive recruiter emails with tokens (`#EMAIL_...#`) and URLs with tokens (`#URL_...#`). The AuthentiHire extraction engine properly ignores anonymization hashes while accurately parsing all real-world embedded URLs, recruiter emails, and company profiles.

---

## 6. Controlled Live-Check Results (25 Unique Domains)

A controlled deterministic live check was executed across 25 corporate and technology domains with persistent disk caching enabled (`cache/domain_cache.json`):

| Domain | Reachable | HTTP Status | HTTPS Valid | Response Time | TLS Issuer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `google.com` | True | 200 | True | 325.93 ms | Google Trust Services |
| `microsoft.com` | True | 200 | True | 258.83 ms | Microsoft Corporation |
| `amazon.com` | True | 200 | True | 1179.18 ms | Amazon |
| `apple.com` | True | 200 | True | 398.01 ms | Apple Inc. |
| `stripe.com` | True | 200 | True | 505.86 ms | DigiCert Inc |
| `github.com` | True | 200 | True | 154.56 ms | DigiCert Inc |
| `linkedin.com` | True | 200 | True | 455.87 ms | DigiCert Inc |
| `stackoverflow.com` | True | 403 (WAF) | True | 218.28 ms | Cloudflare Inc |
| `netflix.com` | True | 200 | True | 1866.91 ms | DigiCert Inc |
| `spotify.com` | True | 200 | True | 882.84 ms | Cloudflare Inc |
| `uber.com` | True | 200 | True | 1449.77 ms | DigiCert Inc |
| `airbnb.com` | True | 200 | True | 1944.04 ms | DigiCert Inc |
| `salesforce.com` | True | 200 | True | 928.82 ms | DigiCert Inc |
| `oracle.com` | True | 403 (WAF) | True | 1622.09 ms | DigiCert Inc |
| `ibm.com` | True | 200 | True | 635.54 ms | DigiCert Inc |
| `cisco.com` | True | 200 | True | 1303.16 ms | HydrantID |
| `adobe.com` | True | 200 | True | 353.17 ms | DigiCert Inc |
| `intel.com` | True | 200 | True | 1556.51 ms | Intel Corporation |
| `nvidia.com` | True | 200 | True | 1408.18 ms | DigiCert Inc |
| `cloudflare.com` | True | 200 | True | 611.89 ms | Cloudflare Inc |
| `dropbox.com` | True | 200 | True | 693.77 ms | DigiCert Inc |
| `atlassian.com` | True | 200 | True | 799.95 ms | Amazon |
| `shopify.com` | True | 200 | True | 310.62 ms | Cloudflare Inc |
| `zoom.us` | True | 200 | True | 285.23 ms | DigiCert Inc |
| `twilio.com` | True | 200 | True | 1184.94 ms | Amazon |

### Key Observations:
- **100% Reachability & TLS Compliance**: 25 out of 25 domains established secure TLS connections with valid certificate chains.
- **Neutral Bot Mitigation Handling**: StackOverflow and Oracle return HTTP 403 due to automated traffic mitigation policies (Cloudflare / Akamai). AuthentiHire accurately records this status without falsely categorizing legitimate enterprises as fraudulent.

---

## 7. Limitations & Risk Analysis

### 7.1 False-Positive Risks
- **Legitimate Startups and Small Businesses**: Early-stage companies may use Gmail or ProtonMail before establishing custom domain infrastructure. This is recorded as a neutral contextual warning (`EMAIL_FREE_PROVIDER`), never as definitive proof of fraud.
- **Third-Party Recruiting Agencies**: Staffing firms frequently use recruiter addresses with domains differing from the client company (`EMAIL_DOMAIN_MISMATCH`).
- **Strict Anti-Bot WAFs**: Legitimate career portals behind Cloudflare or Imperva may return HTTP 403 to automated bots.

### 7.2 False-Negative Risks
- **Domain Squatting / Typo-Squatting**: Sophisticated threat actors may register domains that mimic legitimate brands (e.g., `str1pe-careers.com`) with valid SSL certificates.
- **Compromised Corporate Accounts**: Phishing attacks conducted using compromised legitimate corporate email inboxes will match legitimate company domains.

### 7.3 Data Privacy & Security Controls
- **No Credentials or Script Execution**: The module never parses password fields, submits web forms, executes client-side JavaScript, or bypasses authentication barriers.
- **Local Caching**: All HTTP responses and SSL certificates are indexed locally by registered domain (`cache/domain_cache.json`) to prevent redundant network requests and avoid IP rate limits.

---

## 8. Exact Reproduction Commands

### 1. Run Unit Tests (100% Offline)
```bash
python3 -m unittest discover -s tests -v
```

### 2. Run Company Intelligence CLI Demo
```bash
python3 src/company_intelligence.py --demo
```

### 3. Run Offline Full-Dataset Scan
```bash
python3 src/company_intelligence.py --offline-dataset
```

### 4. Run Controlled Live Sample Check
```bash
python3 src/company_intelligence.py --live-sample 25
```

### 5. Run Custom Posting Analysis
```bash
python3 src/company_intelligence.py \
  --company "Stripe Inc." \
  --email "jobs@stripe.com" \
  --url "https://stripe.com" \
  --description "Hiring senior distributed systems engineers."
```
