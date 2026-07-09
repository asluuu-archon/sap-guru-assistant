"""
Greeting Engine

Handles safe deterministic replies for greetings,
thanks, acknowledgements, and simple polite messages.

IMPORTANT: These shortcuts only fire when there is NO prior conversation history.
If the person has spoken before, the message goes to the full AI with context,
so the AI can reply naturally based on what it already knows about the person.
"""


def normalize_text(message: str) -> str:
    return (message or "").lower().strip().replace(".", "").replace("!", "")


def get_greeting_reply(message: str, has_prior_conversation: bool = False) -> dict | None:
    """
    Returns a deterministic greeting reply if appropriate.

    Args:
        message: The incoming message text.
        has_prior_conversation: True if this person has spoken before.
                                If True, simple greetings and acknowledgements
                                are passed to the full AI instead of using shortcuts.
    """

    text = normalize_text(message)

    # Islamic greetings — always reply deterministically regardless of history
    assalam_variants = [
        "assalamu alaikum",
        "asalamualaikum",
        "assalamualaikum",
        "as salam alaikum",
        "salam alaikum",
        "salam",
    ]

    if any(phrase in text for phrase in assalam_variants):
        return {
            "category": "greeting",
            "should_reply": True,
            "suggested_reply": "Wa Alaikum Assalam 😊 How are you doing?",
            "reason": "Islamic greeting detected",
        }

    # For returning customers, skip all shortcuts — let the full AI handle it with context
    if has_prior_conversation:
        return None

    # First-time greeting shortcuts (only for new conversations)
    morning_variants = [
        "good morning",
        "gm",
    ]

    if text in morning_variants:
        return {
            "category": "greeting",
            "should_reply": True,
            "suggested_reply": "Good morning 😊 How are you doing?",
            "reason": "Morning greeting detected",
        }

    simple_greetings = [
        "hi",
        "hii",
        "hiii",
        "hello",
        "helo",
        "hey",
        "hello sir",
        "hi sir",
        "hey sir",
    ]

    if text in simple_greetings:
        return {
            "category": "greeting",
            "should_reply": True,
            "suggested_reply": "Hi, how are you doing? How can I help you?",
            "reason": "Simple greeting detected",
        }

    thanks_variants = [
        "thanks",
        "thank you",
        "thank u",
        "thankyou",
        "tq",
    ]

    if text in thanks_variants:
        return {
            "category": "thanks",
            "should_reply": True,
            "suggested_reply": "You're most welcome 😊",
            "reason": "Thanks detected",
        }

    acknowledgement_variants = [
        "ok",
        "okay",
        "okk",
        "sure",
        "noted",
        "got it",
    ]

    if text in acknowledgement_variants:
        return {
            "category": "acknowledgement",
            "should_reply": True,
            "suggested_reply": "Sure 😊",
            "reason": "Acknowledgement detected",
        }

    return None
