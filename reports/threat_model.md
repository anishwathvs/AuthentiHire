# AuthentiHire — Comprehensive Threat Model

**System:** AuthentiHire Fraud Detection Platform  
**Version:** 1.0.0 (Phase 11)  
**Date:** September 19, 2026  

---

## 1. Threat Actors & Motivation

| Threat Actor | Capabilities & Access Level | Primary Motivation |
|:---|:---|:---|
| **Anonymous Visitor** | Unauthenticated public API access, browser frontend access, anonymous session persistence. | Probe for public endpoints, bypass rate limits, submit fraudulent postings for reconnaissance. |
| **Authenticated User** | Valid user account, access to user dashboard and analysis history. | Normal platform usage; potential unauthorized access to other users' analyses. |
| **Malicious Authenticated User** | Legitimate account with active session, automated tooling (Burp Suite, Postman, scripts). | Exploit IDOR to read/delete other users' records, harvest system intelligence, trigger SSRF. |
| **Automated Attacker / Botnet** | High-concurrency automated scripts, rotating proxy networks, credential stuffing lists. | Credential stuffing on login/register, denial of service (DoS) via heavy inference or regex explosion. |
| **Malicious Job Posting Author** | Submits deceptive postings crafted with adversarial text, phishing URLs, or weaponized domains. | Erode platform detection accuracy, evade scam rules, lure server into internal network pivots (SSRF). |
| **Malicious External Website** | Host controlled by external adversary, capable of arbitrary HTTP redirects and DNS rebinding. | Exploit server-side company verification checks to scan internal infrastructure or access cloud metadata. |

---

## 2. Core Assets & Security Objectives

1. **User Accounts & Authentication Credentials**:
   * *Objective*: Confidentiality and integrity of Argon2id password hashes, JWT signing keys (`AUTH_SECRET_KEY`), and session cookies.
2. **Analysis History & Audit Snapshots**:
   * *Objective*: Strict confidentiality; users must only view, search, and delete their own verification records.
3. **Internal Network & Cloud Infrastructure**:
   * *Objective*: Complete isolation from outbound server requests initiated by company verification.
4. **Machine Learning & Rule Engine Availability**:
   * *Objective*: High availability and resistance to resource exhaustion / ReDoS attacks.
5. **System Metadata & Configuration Secrets**:
   * *Objective*: Prevention of credential leakage, debug stack traces, and database connection strings.

---

## 3. Threat Analysis & Mitigations

```
┌─────────────────────────┬───────────────────────────────┬──────────────────────────────────────────┐
│ Threat                  │ STRIDE Category               │ Mitigation Strategy                      │
├─────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ SSRF to Localhost/Cloud │ Elevation of Privilege / Info │ IP validation, private IP blocklist,     │
│ Metadata (169.254.169)  │ Disclosure                    │ DNS resolution pinning, redirect bounds  │
├─────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ IDOR / Cross-User Data  │ Information Disclosure /      │ Strict SQLAlchemy user_id query scoping, │
│ Access                  │ Tampering                     │ 404 response on unauthorized records     │
├─────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ Credential Stuffing &   │ Spoofing / Denial of Service  │ Sliding-window IP rate limiting,         │
│ Brute-Force Attacks     │                               │ Argon2id constant-time verification      │
├─────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ Oversized Request Body  │ Denial of Service             │ Pydantic field length bounds, streaming  │
│ (DoS / Memory Bloat)    │                               │ size caps on outbound downloads (100KB)  │
├─────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ SQL Injection           │ Tampering / Information Disc. │ 100% Parameterized queries, column       │
│                         │                               │ whitelist for sorting parameters         │
├─────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ Cross-Site Scripting    │ Tampering / Info Disclosure   │ React JSX automatic escaping, strict     │
│ (XSS) in Job Postings   │                               │ Content-Security-Policy header           │
├─────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ Session Hijacking / XSS │ Information Disclosure        │ HttpOnly, SameSite=Lax cookies,          │
│ Token Theft             │                               │ configurable Secure flag for HTTPS       │
├─────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ DNS Rebinding Attacks   │ Spoofing / Elevation of Priv  │ Pre-request DNS resolution & validation  │
│                         │                               │ for every HTTP hop and redirect          │
└─────────────────────────┴───────────────────────────────┴──────────────────────────────────────────┘
```

---

## 4. Trust Boundaries

1. **Client to API Boundary**: Untrusted input boundary. All inputs validated via Pydantic schemas with length limits; JWT/Cookie authentication required for private endpoints.
2. **API to Database Boundary**: Trusted data access boundary. Mediated exclusively by SQLAlchemy repository layer using parameterized statements.
3. **API to External Internet Boundary**: Highly untrusted outbound boundary. Managed strictly by `CompanyIntelligenceAnalyzer` with SSRF IP filters, connection timeouts, and response size limits.
