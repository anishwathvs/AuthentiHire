"""
AuthentiHire - Rule-Based Scam Detection Engine
===============================================
A modular, explainable, and rule-based heuristic system for detecting
employment and internship scams.

Key Architectural Principles:
1. Complete Transparency: Every triggered rule outputs its rule_id, rule_name,
   category, severity, assigned points, clear explanation, and extracted evidence text.
2. Anti-Double-Counting: Uses category-level score capping to prevent redundant
   co-occurring phrases from runaway score inflation.
3. Strict Modularity: Each rule is an independent, testable object registered in
   the central rule registry.
"""

from typing import Dict, List, Any, Optional, Tuple, Callable
from dataclasses import dataclass
import re
import html


@dataclass
class RuleResult:
    rule_id: str
    rule_name: str
    category: str
    severity: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    score: int
    triggered: bool
    explanation: str
    evidence: Optional[str] = None


@dataclass
class Rule:
    rule_id: str
    rule_name: str
    category: str
    severity: str
    base_score: int
    description: str
    detection_func: Callable[[Dict[str, Any], str], Tuple[bool, Optional[str], Optional[str]]]

    def evaluate(self, posting: Dict[str, Any], full_text: str) -> RuleResult:
        triggered, explanation, evidence = self.detection_func(posting, full_text)
        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            category=self.category,
            severity=self.severity,
            score=self.base_score if triggered else 0,
            triggered=triggered,
            explanation=explanation or self.description,
            evidence=evidence,
        )


# ==============================================================================
# DETECTION HEURISTICS & LOGIC
# ==============================================================================

def _get_full_text(posting: Dict[str, Any]) -> str:
    """Aggregates all textual fields into a single unified search string."""
    fields = ["title", "company_profile", "description", "requirements", "benefits"]
    chunks = [str(posting.get(f, "") or "") for f in fields]
    raw = " ".join(chunks)
    return html.unescape(raw)


# --- Category A: Payment / Money Requests ---

def detect_upfront_fees(posting: Dict[str, Any], text: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Detects demands for upfront registration, application, onboarding, or training fees."""
    patterns = [
        r"(?:pay|deposit|transfer|send|wire)\s+(?:a|an|\$\d+|\d+)?\s*(?:registration|application|processing|onboarding|training|background\s+check|starter|joining)\s+fee",
        r"(?:registration|application|processing|onboarding|training|background\s+check|membership)\s+fee\s+(?:is\s+)?(?:required|mandatory|must\s+be\s+paid)",
        r"(?:refundable\s+)?security\s+deposit\s+(?:required|needed|of\s+\$\d+)",
        r"pay\s+to\s+get\s+hired",
        r"payment\s+required\s+before\s+(?:joining|starting|interview|employment)",
        r"candidate\s+must\s+pay\s+for\s+(?:training|materials|modules|certification)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return (
                True,
                "Posting explicitly requests an upfront fee (registration, processing, training, or security deposit) prior to employment.",
                m.group(0),
            )
    return False, None, None


def detect_equipment_cashier_check(posting: Dict[str, Any], text: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Detects fake check / advance-fee equipment purchase scams."""
    patterns = [
        r"(?:send|mail|issue|receive)\s+(?:you\s+)?(?:a\s+)?(?:cashier'?s?|check|cheque)\s+(?:to\s+)?(?:purchase|buy)\s+(?:home\s+office\s+)?(?:equipment|supplies|software|materials|laptop|tools)",
        r"purchase\s+(?:your\s+)?(?:equipment|software|laptop|materials)\s+(?:from|through)\s+(?:our|an?)\s+(?:approved|certified|authorized|recommended)\s+vendor",
        r"we\s+will\s+send\s+(?:you\s+)?a\s+check\s+for\s+(?:equipment|supplies|home\s+office)",
        r"funds\s+will\s+be\s+provided\s+via\s+(?:check|cheque)\s+to\s+purchase",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return (
                True,
                "Posting exhibits classic fake-check / advance-fee scam phrasing where the employer promises a check to purchase equipment from a specific vendor.",
                m.group(0),
            )
    return False, None, None


def detect_wire_crypto_payment(posting: Dict[str, Any], text: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Detects requests for irreversible payment methods (wire transfer, cryptocurrency, gift cards)."""
    if re.search(r"\b(?:blockchain\s+developer|smart\s+contract|crypto\s+engineer|web3\s+developer)\b", text, re.IGNORECASE):
        return False, None, None

    patterns = [
        r"(?:send|transfer|pay|deposit)\s+(?:via|through|using)\s+(?:western\s+union|moneygram|wire\s+transfer|bitcoin|cryptocurrency|crypto|gift\s+card|greendot)",
        r"(?:payment|fees?)\s+(?:must\s+be\s+made|accepted)\s+(?:in|via)\s+(?:crypto|bitcoin|gift\s+cards?|wire)",
        r"buy\s+bitcoin\s+(?:and\s+send|for\s+verification|as\s+part\s+of)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return (
                True,
                "Posting requests payment or money transfers via irreversible/untraceable channels (wire transfer, cryptocurrency, gift cards).",
                m.group(0),
            )
    return False, None, None


# --- Category B: Financial & Banking Information Requests ---

def detect_banking_credential_requests(posting: Dict[str, Any], text: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Detects early requests for sensitive banking credentials, credit cards, PIN, or OTPs."""
    patterns = [
        r"(?:provide|enter|submit|send)\s+(?:your\s+)?(?:online\s+)?banking\s+(?:credentials|password|login|pin)",
        r"(?:provide|send|submit)\s+(?:your\s+)?(?:credit|debit)\s+card\s+(?:number|details|information|cvv|pin)",
        r"(?:share|provide|send)\s+(?:the\s+)?(?:otp|one-time\s+password|verification\s+code)",
        r"(?:provide|submit)\s+(?:your\s+)?bank\s+(?:account|routing)\s+(?:number|details)\s+(?:for\s+verification|to\s+apply|during\s+interview)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return (
                True,
                "Posting solicits sensitive financial credentials (bank login, credit card, PIN, or OTP) directly within the application phase.",
                m.group(0),
            )
    return False, None, None


# --- Category C: Personal Identity / Government ID Requests ---

def detect_excessive_pii_requests(posting: Dict[str, Any], text: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Detects premature requests for government ID numbers (SSN, Passport, Aadhaar, PAN, Driver's License)."""
    if re.search(r"\b(?:form\s+i-9|equal\s+opportunity|verify\s+identity\s+upon\s+hire|after\s+offer\s+acceptance)\b", text, re.IGNORECASE):
        return False, None, None

    patterns = [
        r"(?:submit|send|provide|email|upload)\s+(?:a\s+copy\s+of\s+)?(?:your\s+)?(?:social\s+security\s+number|ssn|passport\s+copy|aadhaar|pan\s+card|driver'?s?\s+license)\s+(?:to\s+apply|with\s+application|before\s+interview)",
        r"(?:send|submit)\s+front\s+and\s+back\s+(?:of\s+)?(?:your\s+)?(?:id|driver'?s?\s+license|passport)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return (
                True,
                "Posting requests high-risk government identity documents (SSN, Passport, Aadhaar, Driver's License) upfront before formal interview/offer.",
                m.group(0),
            )
    return False, None, None


# --- Category D: Unrealistic Compensation ---

def detect_unrealistic_compensation(posting: Dict[str, Any], text: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Detects exaggerated, 'guaranteed', or astronomical payout promises."""
    patterns = [
        r"earn\s+(?:\$\d{3,5}|\d{3,5}\s*dollars?)\s+(?:per\s+|a\s+)?(?:day|daily|hour|hr)\s*(?:guaranteed|easily|from\s+home)?",
        r"guaranteed\s+(?:income|salary|payout|earnings?)\s+(?:of\s+)?(?:\$\d+|\d+k)",
        r"earn\s+(?:\$\d{4,6}|\d{4,6}\s*dollars?)\s+(?:per\s+|a\s+)?week",
        r"make\s+(?:anywhere\s+from\s+)?\$\d+[\s-]+\$?\d+(?:,\d+)?\s+(?:a|per)\s+month",
        r"make\s+(?:over\s+)?\$\d{4,}\s+(?:daily|weekly)\s+part\s+time",
        r"(?:paid\s+to\s+take\s+vacations|be\s+your\s+own\s+boss\s+and\s+set\s+your\s+own\s+schedule)",
        r"unlimited\s+earning\s+potential\s+with\s+no\s+(?:effort|work)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return (
                True,
                "Posting advertises implausibly exaggerated compensation claims (e.g. thousands per week/day guaranteed, paid vacations, get rich fast).",
                m.group(0),
            )
    return False, None, None


# --- Category E: Urgency & High-Pressure Tactics ---

def detect_urgency_pressure(posting: Dict[str, Any], text: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Detects high-pressure urgency tactics designed to bypass candidate skepticism."""
    patterns = [
        r"(?:urgent|urgently|immediate|immediately)\s+(?:looking\s+for|hiring|opening|start)[\s!.,]+(?:only\s+\d+\s+spots?\s+left|act\s+(?:fast|now)|apply\s+(?:now|immediately)|start\s+today|the\s+following\s+positions)?",
        r"(?:limited|few)\s+(?:slots?|openings?|positions?)\s+(?:available|left)[\s!.,]+(?:apply\s+(?:now|immediately)|act\s+fast|first\s+come)",
        r"respond\s+(?:within|in)\s+24\s+hours\s+or\s+(?:lose|forfeit)",
        r"instant\s+hiring\s+no\s+interview",
        r"start\s+(?:work\s+)?today\s+and\s+get\s+paid\s+(?:today|tomorrow|daily)",
        r"act\s+now\s*!\s*limited\s+(?:time|spots?)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return (
                True,
                "Posting utilizes coercive urgency and artificial scarcity (e.g. instant hiring without interview, 24-hour expiration, limited slots).",
                m.group(0),
            )
    return False, None, None


# --- Category F: No Experience + High Pay Combination ---

def detect_no_exp_high_pay(posting: Dict[str, Any], text: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Detects combination of zero experience/skills required paired with lucrative pay claims or simple clerical tasks."""
    has_no_exp = bool(re.search(r"(?:no\s+experience\s+(?:required|needed|necessary)|anyone\s+can\s+apply|no\s+skills?\s+or\s+qualifications?\s+needed|no\s+prior\s+knowledge\s+needed|no\s+experience\s+or\s+degree)", text, re.IGNORECASE))
    has_high_pay = bool(re.search(r"(?:\$(?:3[5-9]|[4-9]\d|\d{3,})\s*(?:per\s+|/)?\s*(?:hour|hr)|earn\s+(?:\$\d{3,}|huge|high|lucrative)\s*(?:weekly|daily|salary)|high\s+hourly\s+pay|\$\d{4,}\s+per\s+week)", text, re.IGNORECASE))
    has_simple_task = bool(re.search(r"(?:data\s+entry|typing|envelope\s+stuffing|re-shipping|repackaging|form\s+filling|payroll\s+assistant|clerk|virtual\s+assistant)", text, re.IGNORECASE))

    if has_no_exp and (has_high_pay or has_simple_task and ("earn" in text.lower() or "$" in text)):
        exp_match = re.search(r"(?:no\s+experience\s+(?:required|needed|necessary)|anyone\s+can\s+apply|no\s+experience\s+or\s+degree)", text, re.IGNORECASE)
        snippet = exp_match.group(0) if exp_match else "No experience required + Lucrative clerical pay claim"
        return (
            True,
            "Posting pairs 'no experience required / anyone can apply' with high hourly/weekly compensation promises or simple clerical tasks.",
            snippet,
        )
    return False, None, None


# --- Category G: Suspicious Communication Channels ---

def detect_suspicious_messaging(posting: Dict[str, Any], text: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Detects insistence on moving official hiring interviews/conversations exclusively to Telegram, WhatsApp, or Signal."""
    patterns = [
        r"(?:contact|message|interview|reach)\s+(?:us\s+)?(?:only|strictly|exclusively)\s+(?:on|via|through)\s+(?:telegram|whatsapp|signal)",
        r"(?:telegram|whatsapp)\s+interview\s+(?:only|required|scheduled)",
        r"(?:send\s+message|add\s+recruiter)\s+on\s+telegram\s+@[\w\d_]+",
        r"do\s+not\s+contact\s+(?:the\s+)?company\s+directly[,\s]+(?:message|contact)\s+on\s+telegram",
        r"interview\s+will\s+be\s+conducted\s+(?:via|on)\s+telegram",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return (
                True,
                "Posting directs candidates away from standard corporate channels to conduct interviews exclusively via instant messaging platforms (Telegram/WhatsApp).",
                m.group(0),
            )
    return False, None, None


# --- Category H: Suspicious Email Patterns ---

def detect_suspicious_email_domains(posting: Dict[str, Any], text: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Detects corporate / enterprise roles using free public email domains (gmail, yahoo, hotmail)."""
    emails = re.findall(r"\b[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b", text)
    if not emails:
        return False, None, None

    free_domains = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "mail.com", "zoho.com", "yandex.com", "protonmail.com"}
    for em in emails:
        if em.lower() in free_domains:
            company_text = str(posting.get("company_profile", "") or "")
            title = str(posting.get("title", "") or "")
            if len(company_text) > 100 or re.search(r"\b(?:inc|corp|corporation|technologies|solutions|group|holdings|enterprises|hospital|bank)\b", title + " " + company_text, re.IGNORECASE):
                return (
                    True,
                    f"Recruiter contact specifies a free generic webmail address (@{em.lower()}) while representing a corporate or enterprise employer.",
                    f"@{em.lower()}",
                )
    return False, None, None


# --- Category I: Suspicious URL / Link Patterns ---

def detect_suspicious_urls(posting: Dict[str, Any], text: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Detects obfuscated, shortened, or suspicious link structures."""
    shortener_patterns = [
        r"\b(?:https?://)?(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|cutt\.ly|rb\.gy)/[\w\d]+",
        r"\b(?:https?://)?\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?(?:/\S*)?",
        r"\b(?:https?://)?[\w\d-]+\.(?:xyz|top|work|click|loan|gq|cf|tk)/[^\s]*",
    ]
    for pat in shortener_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return (
                True,
                "Posting embeds suspicious, shortened, or raw IP/uncommon TLD URLs to obscure the actual destination page.",
                m.group(0),
            )
    return False, None, None


# --- Category J: Sparse / Vague Company Identity Metadata ---

def detect_sparse_company_identity(posting: Dict[str, Any], text: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Flags postings that lack any corporate profile, logo, and screening questions with brief descriptions."""
    profile = str(posting.get("company_profile", "") or "").strip()
    has_logo = int(posting.get("has_company_logo", 1 if profile else 0))
    has_questions = int(posting.get("has_questions", 0))

    if not profile and has_logo == 0 and has_questions == 0:
        desc = str(posting.get("description", "") or "").strip()
        if len(desc) < 400:
            return (
                True,
                "Posting is completely devoid of company profile, company logo, screening questions, and contains exceptionally brief job details (<400 chars).",
                "Missing company_profile, no company logo, no screening questions, and brief description",
            )
    return False, None, None


# --- Category K: Generic / Template-like Scam Phrasing ---

def detect_generic_template_promises(posting: Dict[str, Any], text: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Detects combination of generic promises, check/wire processing, and vague role requirements."""
    patterns = [
        r"(?:we\s+are\s+looking\s+for\s+an?\s+honest|looking\s+for\s+a\s+trustworthy|reliable\s+person)\s+to\s+(?:assist|help|work\s+from\s+home)",
        r"(?:package\s+forwarding|mail\s+processing|mystery\s+shopper|secret\s+shopper)\s+(?:position|assistant|assignment)",
        r"(?:handle|process)\s+(?:financial\s+transactions|payments|invoices|funds)\s+from\s+(?:your|home)\s+(?:account|computer)",
        r"(?:tired\s+of\s+working\s+a\s+9-5|be\s+your\s+own\s+boss)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return (
                True,
                "Posting matches recognized fraudulent template archetypes (e.g. package reshipping, mystery shopping, or personal account payment forwarding).",
                m.group(0),
            )
    return False, None, None


# ==============================================================================
# RULE ENGINE ARCHITECTURE & REGISTRY
# ==============================================================================

def get_default_rules() -> List[Rule]:
    """Instantiates and registers all active scam pattern rules."""
    return [
        Rule(
            rule_id="PAY_001",
            rule_name="Upfront Registration / Application Fee",
            category="Payment Request",
            severity="HIGH",
            base_score=20,
            description="Posting requests an upfront application, registration, training, or onboarding fee before hiring.",
            detection_func=detect_upfront_fees,
        ),
        Rule(
            rule_id="PAY_002",
            rule_name="Advance Check Equipment Purchase",
            category="Payment Request",
            severity="CRITICAL",
            base_score=25,
            description="Posting instructs candidate to receive a check and purchase equipment through an approved vendor.",
            detection_func=detect_equipment_cashier_check,
        ),
        Rule(
            rule_id="PAY_003",
            rule_name="Untraceable Payment Channel Request",
            category="Payment Request",
            severity="HIGH",
            base_score=18,
            description="Posting requests payments or fund transfers via wire transfer, cryptocurrency, or gift cards.",
            detection_func=detect_wire_crypto_payment,
        ),
        Rule(
            rule_id="FIN_001",
            rule_name="Direct Banking / Account Credentials Request",
            category="Financial Credentials",
            severity="CRITICAL",
            base_score=25,
            description="Posting asks for sensitive bank account details, login credentials, PIN, or OTPs during application.",
            detection_func=detect_banking_credential_requests,
        ),
        Rule(
            rule_id="ID_001",
            rule_name="Premature Government ID Solicitation",
            category="Identity Documents",
            severity="MEDIUM",
            base_score=12,
            description="Posting requires submission of SSN, passport, or driver's license scans upfront.",
            detection_func=detect_excessive_pii_requests,
        ),
        Rule(
            rule_id="COMP_001",
            rule_name="Unrealistic High Compensation Claim",
            category="Compensation",
            severity="MEDIUM",
            base_score=10,
            description="Posting advertises implausibly high daily/weekly earnings or guaranteed income claims.",
            detection_func=detect_unrealistic_compensation,
        ),
        Rule(
            rule_id="EXP_001",
            rule_name="No Experience with High Compensation",
            category="Compensation",
            severity="MEDIUM",
            base_score=12,
            description="Posting combines 'no experience necessary' with high compensation or simple clerical tasks.",
            detection_func=detect_no_exp_high_pay,
        ),
        Rule(
            rule_id="URG_001",
            rule_name="High-Pressure Urgency Tactics",
            category="Urgency & Pressure",
            severity="LOW",
            base_score=6,
            description="Posting uses artificial pressure language such as instant hiring without interview or expiring slots.",
            detection_func=detect_urgency_pressure,
        ),
        Rule(
            rule_id="COMM_001",
            rule_name="Exclusive Instant Messaging Interviews",
            category="Communication Channels",
            severity="HIGH",
            base_score=16,
            description="Posting insists on conducting interviews or communications exclusively via Telegram or WhatsApp.",
            detection_func=detect_suspicious_messaging,
        ),
        Rule(
            rule_id="EMAIL_001",
            rule_name="Free Webmail Used for Corporate Role",
            category="Contact Information",
            severity="LOW",
            base_score=5,
            description="Recruiter uses a free public email provider while representing a corporate or enterprise employer.",
            detection_func=detect_suspicious_email_domains,
        ),
        Rule(
            rule_id="URL_001",
            rule_name="Suspicious / Shortened Link Structure",
            category="URL Risk",
            severity="MEDIUM",
            base_score=8,
            description="Posting contains shortened URLs or suspicious external domain structures.",
            detection_func=detect_suspicious_urls,
        ),
        Rule(
            rule_id="CO_001",
            rule_name="Completely Sparse Company Metadata",
            category="Company Information",
            severity="LOW",
            base_score=6,
            description="Posting is completely missing company profile, logo, questions, and has minimal text content.",
            detection_func=detect_sparse_company_identity,
        ),
        Rule(
            rule_id="GEN_001",
            rule_name="Recognized Scam Archetype (Reshipping / Payment Forwarding)",
            category="Job Description Quality",
            severity="HIGH",
            base_score=15,
            description="Posting matches known fraudulent schemes like package forwarding or payment processing from home.",
            detection_func=detect_generic_template_promises,
        ),
    ]


class ScamRuleEngine:
    """Evaluates job postings against an extensible suite of scam detection rules.

    Includes anti-double-counting logic and transparent score thresholding.
    """

    def __init__(
        self,
        rules: Optional[List[Rule]] = None,
        category_caps: Optional[Dict[str, int]] = None,
    ) -> None:
        self.rules = rules if rules is not None else get_default_rules()
        self.category_caps = category_caps or {
            "Payment Request": 30,
            "Financial Credentials": 30,
            "Identity Documents": 18,
            "Compensation": 18,
            "Urgency & Pressure": 10,
            "Communication Channels": 20,
            "Contact Information": 10,
            "URL Risk": 12,
            "Company Information": 8,
            "Job Description Quality": 20,
        }

    def analyze_posting(self, posting: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluates all rules on a single job posting and returns transparent suspicion analysis."""
        full_text = _get_full_text(posting)

        triggered_results: List[RuleResult] = []
        category_scores: Dict[str, int] = {}

        for rule in self.rules:
            res = rule.evaluate(posting, full_text)
            if res.triggered:
                triggered_results.append(res)
                cat = res.category
                category_scores[cat] = category_scores.get(cat, 0) + res.score

        # Apply Anti-Double-Counting category caps
        capped_total_score = 0
        for cat, raw_score in category_scores.items():
            cap = self.category_caps.get(cat, 30)
            capped_score = min(raw_score, cap)
            capped_total_score += capped_score

        # Determine Rule Suspicion Level
        if capped_total_score >= 30:
            suspicion_level = "High Suspicion"
        elif capped_total_score >= 15:
            suspicion_level = "Moderate Suspicion"
        elif capped_total_score > 0:
            suspicion_level = "Low Suspicion"
        else:
            suspicion_level = "Clean / No Suspicious Patterns"

        # Format output payload
        formatted_rules = []
        for r in triggered_results:
            formatted_rules.append({
                "rule_id": r.rule_id,
                "rule_name": r.rule_name,
                "category": r.category,
                "severity": r.severity,
                "score": r.score,
                "explanation": r.explanation,
                "evidence": r.evidence,
            })

        return {
            "title": posting.get("title", "Untitled Posting"),
            "rule_suspicion_score": capped_total_score,
            "raw_uncapped_score": sum(r.score for r in triggered_results),
            "suspicion_level": suspicion_level,
            "triggered_rules_count": len(triggered_results),
            "triggered_rules": formatted_rules,
            "category_breakdown": category_scores,
        }


# ==============================================================================
# CLI & DEMO
# ==============================================================================

def run_demo():
    """Runs demonstration of the rule engine across authentic and scam postings."""
    engine = ScamRuleEngine()

    test_postings = [
        {
            "name": "Upfront Fee & Fake Check Scam",
            "data": {
                "title": "Administrative Assistant - Remote Office",
                "company_profile": "",
                "description": "We are seeking an honest, reliable person to assist from home. We will send you a cashier check to purchase equipment from our certified vendor. Note: A $50 registration fee is required before onboarding.",
                "requirements": "Basic computer skills, ability to deposit checks, and wire transfer funds.",
                "benefits": "Earn $3,500 per week guaranteed.",
                "has_company_logo": 0,
                "has_questions": 0,
            },
        },
        {
            "name": "Telegram Only + High Pay Scam",
            "data": {
                "title": "Data Entry Specialist",
                "company_profile": "",
                "description": "Urgent hiring! Limited slots available! Earn $60/hour with no experience required. Anyone can apply. Interview will be conducted via Telegram @HiringManager.",
                "requirements": "No qualifications needed. Must have Telegram account.",
                "benefits": "Immediate payout.",
                "has_company_logo": 0,
                "has_questions": 0,
            },
        },
        {
            "name": "Legitimate Job with Benign Payment Keywords",
            "data": {
                "title": "Senior Payment Systems Engineer",
                "company_profile": "Stripe-like Fintech Infrastructure Inc. We build reliable payment gateways for global commerce.",
                "description": "We are hiring an engineer for our payment processing core team. You will handle credit card tokenization, bank transfer integrations, and fraud prevention algorithms. We offer competitive salary and 401(k) matching.",
                "requirements": "5+ years backend development in Go/Python. Deep knowledge of payment gateway APIs and PCI-DSS compliance.",
                "benefits": "Health insurance, equity grants, annual bonus.",
                "has_company_logo": 1,
                "has_questions": 1,
            },
        },
    ]

    print("=" * 80)
    print("             AUTHENTIHIRE RULE-BASED SCAM DETECTION ENGINE DEMO")
    print("=" * 80)

    for item in test_postings:
        print(f"\n>>> Scenario: {item['name']}")
        res = engine.analyze_posting(item["data"])
        print(f"Title:                 {res['title']}")
        print(f"Rule Suspicion Score:  {res['rule_suspicion_score']} pts")
        print(f"Suspicion Level:       {res['suspicion_level']}")
        print(f"Triggered Rules Count: {res['triggered_rules_count']}")
        if res["triggered_rules"]:
            print("Triggered Rules:")
            for tr in res["triggered_rules"]:
                print(f"  - [{tr['rule_id']}] {tr['rule_name']} ({tr['severity']}, +{tr['score']} pts)")
                print(f"    Evidence:    \"{tr['evidence']}\"")
                print(f"    Explanation: {tr['explanation']}")
        else:
            print("  (No suspicious scam rules triggered — Clean posting)")


if __name__ == "__main__":
    import json
    import argparse

    parser = argparse.ArgumentParser(description="AuthentiHire Rule-Based Scam Engine")
    parser.add_argument("--demo", action="store_true", default=False)
    parser.add_argument("--title", type=str, default=None)
    parser.add_argument("--description", type=str, default=None)
    args = parser.parse_args()

    if args.title or args.description:
        engine = ScamRuleEngine()
        posting = {
            "title": args.title or "",
            "description": args.description or "",
        }
        result = engine.analyze_posting(posting)
        print(json.dumps(result, indent=2))
    else:
        run_demo()
