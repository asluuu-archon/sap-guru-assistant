"""
Lead Engine

Responsible for identifying and enriching possible sales leads.

This engine is intentionally generic so it can be reused
across industries.
"""


def evaluate_lead(
    customer: dict,
    message: str,
    reply: dict,
) -> dict:
    text = (message or "").lower().strip()

    if not text:
        return {
            "is_lead": False,
            "lead_score": 0,
            "temperature": "cold",
            "summary": "",
            "next_action": "",
        }

    lead_keywords = [
        "want to learn",
        "want learn",
        "interested",
        "course",
        "training",
        "fees",
        "fee",
        "contact",
        "call",
        "online",
        "offline",
        "admission",
        "join",
        "become",
        "career",
        "consultant",
        "functional consultant",
    ]

    contact_keywords = [
        "call me",
        "contact me",
        "whatsapp",
        "phone",
        "number",
    ]

    is_lead = any(keyword in text for keyword in lead_keywords)

    score = 0

    if is_lead:
        score += 50

    if any(keyword in text for keyword in contact_keywords):
        score += 20

    if len(text) > 80:
        score += 15

    if customer:
        score += 5

    score = min(score, 100)

    if score >= 75:
        temperature = "hot"
    elif score >= 50:
        temperature = "warm"
    else:
        temperature = "cold"

    return {
        "is_lead": is_lead,
        "lead_score": score,
        "temperature": temperature,
        "summary": message if is_lead else "",
        "next_action": "Collect contact details and pass to sales team." if is_lead else "",
    }