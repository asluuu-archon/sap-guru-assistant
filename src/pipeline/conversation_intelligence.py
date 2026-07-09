"""
Conversation Intelligence

Scores the latest message against multiple conversation goals.
This is different from simple intent detection.

Intent = what the message says.
Conversation Goal = what the AI should try to achieve now.
"""


def contains_any(text: str, words: list[str]) -> bool:
    return any(word in text for word in words)


def build_recent_context(conversation: dict, latest: str) -> str:
    history_text = ""

    if conversation:
        history = conversation.get("history") or []
        recent = history[-6:]

        history_text = " ".join(
            (item.get("user") or "")
            for item in recent
        ).lower()

    return f"{history_text} {latest}".strip()


def score_greeting(latest: str) -> float:
    greetings = [
        "hi",
        "hello",
        "hey",
        "good morning",
        "good evening",
        "good afternoon",
        "assalamu alaikum",
        "asalamualaikum",
        "salam",
    ]

    if latest.strip() in greetings:
        return 0.98

    if latest.startswith("hi ") or latest.startswith("hello "):
        return 0.70

    return 0.0


def score_appointment(latest: str, full_context: str, conversation: dict) -> float:
    appointment_words = [
        "meeting",
        "appointment",
        "call",
        "schedule",
        "zoom",
        "google meet",
        "talk",
        "speak",
        "connect",
        "discuss",
    ]

    time_words = [
        "tomorrow",
        "today",
        "next week",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
        "am",
        "pm",
        "ist",
        "gst",
        "utc",
    ]

    last_question = (conversation.get("last_question") or "").lower()
    summary = (conversation.get("summary") or "").lower()

    if contains_any(latest, appointment_words):
        return 0.95

    if contains_any(full_context, appointment_words) and contains_any(latest, time_words):
        return 0.90

    if contains_any(summary, ["meeting", "appointment", "call"]):
        if contains_any(latest, ["tomorrow", "today", "pm", "am", "ist", "email", "@"]):
            return 0.88

    if contains_any(last_question, ["preferred day", "preferred time", "email id", "meeting confirmation"]):
        return 0.90

    if contains_any(latest, time_words):
        return 0.65

    return 0.0

def score_learning_lead(latest: str) -> float:
    learning_words = [
        "want to learn",
        "learn sap",
        "course",
        "fees",
        "fee details",
        "training",
        "internship",
        "mentorship",
        "classes",
        "online class",
        "offline class",
    ]

    if contains_any(latest, learning_words):
        return 0.95

    return 0.0


def score_lead_collection(latest: str, full_context: str, conversation: dict) -> float:
    state = conversation.get("conversation_state") or ""

    if state == "lead_collection":
        return 0.75

    if contains_any(latest, ["phone", "email", "location", "course", "fees", "details", "interested"]):
        return 0.70

    if "@" in latest:
        return 0.80

    if any(char.isdigit() for char in latest) and len(latest) >= 8:
        if contains_any(latest, ["am", "pm", "ist", "gst", "utc", "tomorrow", "today"]):
            return 0.20

        return 0.75

    return 0.0


def score_closing(latest: str) -> float:
    closing_words = [
        "thanks",
        "thank you",
        "thankyou",
        "ok thanks",
        "okay thank you",
        "got it",
        "done",
    ]

    if latest.strip() in closing_words:
        return 0.90

    return 0.0


def detect_conversation_goal(
    conversation: dict,
    latest_message: str,
) -> dict:
    latest = (latest_message or "").lower().strip()
    full_context = build_recent_context(conversation, latest)

    scores = {
        "greeting": score_greeting(latest),
        "appointment": score_appointment(latest, full_context, conversation),
        "learning_lead": score_learning_lead(latest),
        "lead_collection": score_lead_collection(latest, full_context, conversation),
        "closing": score_closing(latest),
        "general": 0.50,
    }

    goal = max(scores, key=scores.get)
    confidence = scores[goal]

    return {
        "goal": goal,
        "confidence": confidence,
        "scores": scores,
    }