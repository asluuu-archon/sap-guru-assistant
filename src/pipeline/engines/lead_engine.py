"""
Lead Engine

Responsible for creating and enriching sales leads.

This engine is intentionally generic so it can be reused
across industries.
"""


def evaluate_lead(
    customer: dict,
    message: str,
    reply: dict,
) -> dict:

    return {
        "is_lead": False,
        "lead_score": 0,
        "temperature": "cold",
        "summary": "",
        "next_action": "",
    }