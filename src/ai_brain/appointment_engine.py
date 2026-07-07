"""
Appointment Engine

Detects meeting / call / appointment requests.
Calendar booking will be added later.
"""


def detect_appointment_request(message: str) -> dict | None:
    text = (message or "").lower().strip()

    appointment_phrases = [
        "can we talk",
        "can i talk",
        "can we speak",
        "can i speak",
        "schedule a meeting",
        "book a meeting",
        "fix a meeting",
        "arrange a meeting",
        "need a meeting",
        "want to meet",
        "can we meet",
        "appointment",
        "call me",
        "can you call",
        "can we have a call",
        "need to discuss",
        "want to discuss",
    ]

    if any(phrase in text for phrase in appointment_phrases):
        return {
            "category": "appointment_request",
            "should_reply": True,
            "should_capture_contact": True,
            "suggested_reply": (
                "Sure, we can schedule a call. Please share your preferred day and time, "
                "and also your email ID so I can send the meeting confirmation."
            ),
            "reason": "Appointment request detected",
        }

    return None