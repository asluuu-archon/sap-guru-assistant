import re


GREETING_MESSAGES = {
    "hi",
    "hii",
    "hello",
    "hey",
    "hello sir",
    "hi sir",
    "good morning",
    "good afternoon",
    "good evening",
    "goodmorning",
    "goodafternoon",
    "goodevening",
    "gm",
}

CLOSING_MESSAGES = {
    "ok",
    "okay",
    "oh ok",
    "oh okay",
    "okk",
    "ok bro",
    "ok brother",
    "ok sir",
    "okay sir",
    "sure",
    "fine",
    "good",
    "great",
    "thanks",
    "thank you",
    "thankyou",
    "thank u",
    "tq",
    "ty",
    "got it",
    "understood",
    "noted",
    "no problem",
    "np",
    "👍",
    "🙏",
}

SHORT_UNCLEAR_MESSAGES = {
    "athe",
    "athe sathyam",
    "sathyam",
    "correct",
    "true",
    "yes true",
    "yeah true",
    "same",
    "exactly",
}

LEARNING_PHRASES = [
    "want to learn",
    "i want to learn",
    "interested in learning",
    "i am interested in learning",
    "i'm interested in learning",
    "need to learn",
    "learn sap",
    "sap course",
    "course details",
    "fees",
    "fee details",
    "want to join",
    "offline class",
    "online class",
    "classes",
    "mentorship",
    "internship",
    "career guidance",
    "placement support",
]

SAP_MODULES = [
    "sap mm",
    "sap fico",
    "sap sd",
    "sap abap",
    "sap hcm",
    "successfactors",
    "success factors",
    "sap ewm",
    "sap btp",
    "sap sac",
    "sap datasphere",
    "sap basis",
    "sap security",
]


def clean_text(message: str) -> str:
    return (message or "").lower().strip()


def normalize_text(message: str) -> str:
    text = clean_text(message)
    return text.replace(".", "").replace("!", "").strip()


def has_phone(message: str) -> bool:
    return bool(re.search(r"(\+?\d[\d\s\-]{8,}\d)", message or ""))


def has_email(message: str) -> bool:
    return bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", message or ""))


def detect_intent(message: str) -> dict:
    """
    Returns a safe intent decision.

    Possible intents:
    - greeting
    - closing
    - learning_lead
    - lead_information
    - career_guidance
    - job_inquiry
    - advice_or_friend
    - needs_human
    - general
    """

    text = clean_text(message)
    normalized = normalize_text(message)

    if not text:
        return {
            "intent": "needs_human",
            "confidence": 0.2,
            "should_reply": False,
            "reason": "Empty message",
        }

    if text in GREETING_MESSAGES or normalized in GREETING_MESSAGES:
        return {
            "intent": "greeting",
            "confidence": 0.98,
            "should_reply": True,
            "reason": "Clear greeting",
        }

    if text in CLOSING_MESSAGES or normalized in CLOSING_MESSAGES:
        return {
            "intent": "closing",
            "confidence": 0.98,
            "should_reply": False,
            "reason": "Closing message",
        }

    if has_phone(message) or has_email(message):
        return {
            "intent": "lead_information",
            "confidence": 0.95,
            "should_reply": True,
            "reason": "Phone or email detected",
        }

    if any(phrase in text for phrase in LEARNING_PHRASES):
        return {
            "intent": "learning_lead",
            "confidence": 0.95,
            "should_reply": True,
            "reason": "Clear learning enquiry",
        }
    

    if any(module in text for module in SAP_MODULES) and any(
        word in text for word in ["learn", "interested", "join", "course", "details"]
    ):
        return {
            "intent": "learning_lead",
            "confidence": 0.9,
            "should_reply": True,
            "reason": "SAP module learning enquiry",
        }

    if any(word in text for word in ["job", "opening", "vacancy", "hiring", "opportunity"]):
        return {
            "intent": "job_inquiry",
            "confidence": 0.85,
            "should_reply": True,
            "reason": "Job enquiry",
        }

    if any(module in text for module in SAP_MODULES):
        return {
            "intent": "career_guidance",
            "confidence": 0.8,
            "should_reply": True,
            "reason": "SAP module mentioned",
        }

    if text in SHORT_UNCLEAR_MESSAGES or normalized in SHORT_UNCLEAR_MESSAGES:
        return {
            "intent": "needs_human",
            "confidence": 0.35,
            "should_reply": False,
            "reason": "Short unclear or regional-language message",
        }
        
    # Friend or Advice intent (casual long message, emojis, life advice)
    if any(word in text for word in ["bro", "brother", "machan", "mate", "dude", "advice", "suggestion", "help me"]):
        return {
            "intent": "advice_or_friend",
            "confidence": 0.75,
            "should_reply": True,
            "reason": "Casual friend or advice seeking",
        }

    if len(text.split()) <= 2:
        return {
            "intent": "needs_human",
            "confidence": 0.35,
            "should_reply": False,
            "reason": "Short message with unclear intent",
        }

    return {
        "intent": "general",
        "confidence": 0.65,
        "should_reply": True,
        "reason": "General message",
    }
