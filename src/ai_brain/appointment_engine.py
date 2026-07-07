"""
Appointment Engine

Detects meeting / call / appointment requests.
Calendar booking will be added later.
"""


def detect_appointment_request(message: str) -> dict | None:
    text = (message or "").lower().strip()

    action_words = [
        "schedule", "book", "arrange", "fix", "set up",
        "have", "need", "want", "plan"
    ]

    meeting_words = [
        "call", "meeting", "appointment", "discussion",
        "talk", "speak", "connect", "zoom", "google meet",
        "meet"
    ]

    direct_phrases = [
        "call me",
        "can you call",
        "can i call",
        "can we talk",
        "can i talk",
        "can we speak",
        "can i speak",
        "need to discuss",
        "want to discuss",
        "available for a call",
        "available for meeting",
    ]

    if any(phrase in text for phrase in direct_phrases):
        return appointment_reply()

    has_action = any(word in text for word in action_words)
    has_meeting = any(word in text for word in meeting_words)

    if has_action and has_meeting:
        return appointment_reply()

    return None


def appointment_reply() -> dict:
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