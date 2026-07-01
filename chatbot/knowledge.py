"""Website knowledge base and response safeguards for the chatbot."""
import re
from pathlib import Path

KNOWLEDGE_BASE_PATH = Path(__file__).resolve().parent.parent / "chatbot_knowledge_base.md"

MAX_REPLY_CHARS = 200

PRICING_RESPONSE = (
    "Pricing is tailored to each project. "
    "The best way to get a quote is to schedule a free demo with our team."
)

_PRICING_QUESTION = re.compile(
    r"\b("
    r"how much|what(?:'s| is) the (?:price|cost)|"
    r"pric(?:e|ing)|cost(?:s|ing)?|fee(?:s)?|charge(?:s|d)?|"
    r"rate(?:s)?|quote|budget|afford(?:able)?|"
    r"how expensive|pay for|what do you charge"
    r")\b",
    re.IGNORECASE,
)

_PRICE_IN_RESPONSE = re.compile(
    r"(?:"
    r"[\£\$\€]\s*\d|"
    r"\d[\d,]*\s*(?:k|K|thousand|million|bn|per\s+(?:month|year|hour|day|week))|"
    r"(?:from|starting\s+at|around|approximately|between|up\s+to|roughly)\s+[\£\$\€]?\s*\d|"
    r"[\£\$\€]?\s*\d+(?:\.\d+)?\s*[kK]\s*[-–—]\s*[\£\$\€]?\s*\d+(?:\.\d+)?\s*[kK]|"
    r"[\£\$\€]?\s*\d{1,3}(?:,\d{3})+\s*[-–—]\s*[\£\$\€]?\s*\d{1,3}(?:,\d{3})+"
    r")",
    re.IGNORECASE,
)

_LINKS_ASTERISKS = re.compile(r"(https?://\S+|www\.\S+|\*)", re.IGNORECASE)

_SYSTEM_RULES = """You are the AI assistant for AI Solutions (UK). Answer ONLY using the knowledge base below.

STRICT RULES:
1. Use ONLY facts from the knowledge base — never invent services, stats, or prices.
2. NEVER quote prices, cost ranges, or currency amounts. Pricing is NOT on the website.
3. For pricing questions, say pricing is customized and direct users to contact the team.
4. Be helpful, professional, and concise.
5. NEVER include links or asterisks.
6. Keep replies under 200 characters.

KNOWLEDGE BASE:
"""


def load_knowledge_base() -> str:
    """Load the website knowledge base markdown file."""
    try:
        return KNOWLEDGE_BASE_PATH.read_text(encoding="utf-8").strip()
    except OSError:
        return ""


def get_system_prompt() -> str:
    """Build the full system prompt from website knowledge."""
    knowledge = load_knowledge_base()
    if not knowledge:
        knowledge = (
            "AI Solutions is based in Sunderland, UK. "
            "Services: AI Virtual Assistant Development (24/7 customer support, lead qualification, "
            "order tracking, FAQ handling), Chatbot Integration (website, app, WhatsApp, Messenger, CRM), "
            "Business Automation Tools (data entry, approvals, reporting, invoices), "
            "Software Prototyping (MVPs, interactive demos, AI validation), "
            "and Custom AI Solutions (predictive analytics, dashboards, document processing, enterprise automation). "
            "All solutions offer REST API integration with Python, Node.js, AWS, and Azure. "
            "No pricing is published on the website. "
            "Contact phone: +44 191 555 0140. Contact email: support@aisolutions.com. "
            "You may share this contact info when asked."
        )
    return _SYSTEM_RULES + knowledge


def is_pricing_question(text: str) -> bool:
    """Detect whether the user is asking about cost or pricing."""
    return bool(_PRICING_QUESTION.search(text or ""))


def strip_links_asterisks(text: str) -> str:
    if not text:
        return text
    return _LINKS_ASTERISKS.sub("", text).strip()


def enforce_max_length(text: str, max_chars: int = MAX_REPLY_CHARS) -> str:
    if not text:
        return text
    text = text.strip()
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 1].rstrip() + "."


def sanitize_response(text: str) -> str:
    if not text:
        return text
    text = strip_links_asterisks(text)
    if _PRICE_IN_RESPONSE.search(text):
        text = PRICING_RESPONSE
    return enforce_max_length(text)
