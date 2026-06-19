import os
from datetime import datetime
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_conversation(sender_id: str) -> dict:
    result = (
        supabase.table("conversations")
        .select("*")
        .eq("sender_id", sender_id)
        .execute()
    )

    if result.data:
        return result.data[0]

    return {
        "sender_id": sender_id,
        "summary": "",
        "last_question": "",
        "last_reply": "",
        "history": [],
    }


def build_context(conversation: dict) -> str:
    history = conversation.get("history") or []
    recent = history[-10:]

    lines = []

    if conversation.get("summary"):
        lines.append(f"Known summary: {conversation['summary']}")

    if conversation.get("last_question"):
        lines.append(f"Last question asked: {conversation['last_question']}")

    if conversation.get("last_reply"):
        lines.append(f"Last reply sent: {conversation['last_reply']}")

    if recent:
        lines.append("Recent conversation:")
        for item in recent:
            lines.append(f"User: {item.get('user')}")
            lines.append(f"Assistant: {item.get('assistant')}")

    return "\n".join(lines)


def save_conversation(
    sender_id: str,
    user_message: str,
    assistant_reply: str,
    category: str = "",
):
    conversation = get_conversation(sender_id)

    history = conversation.get("history") or []

    history.append({
        "time": datetime.utcnow().isoformat(),
        "user": user_message,
        "assistant": assistant_reply,
        "category": category,
    })

    history = history[-30:]

    summary = conversation.get("summary") or ""

    if user_message:
        summary = update_simple_summary(summary, user_message)

    payload = {
        "sender_id": sender_id,
        "summary": summary,
        "last_question": assistant_reply if assistant_reply.endswith("?") else conversation.get("last_question", ""),
        "last_reply": assistant_reply,
        "history": history,
        "updated_at": datetime.utcnow().isoformat(),
    }

    supabase.table("conversations").upsert(payload).execute()


def update_simple_summary(existing_summary: str, message: str) -> str:
    text = message.lower()
    facts = []

    if "bcom" in text or "b.com" in text:
        facts.append("User has BCom background")
    if "mba" in text:
        facts.append("User has MBA background")
    if "fico" in text or "fi" in text:
        facts.append("Interested in SAP FICO")
    if "mm" in text:
        facts.append("Interested in SAP MM")
    if "sd" in text:
        facts.append("Interested in SAP SD")
    if "ewm" in text:
        facts.append("Interested in SAP EWM")
    if "non coding" in text or "non-coding" in text:
        facts.append("Prefers non-coding")
    if "coding" in text:
        facts.append("Mentioned coding preference")
    if "fresher" in text:
        facts.append("User may be fresher")
    if "experience" in text:
        facts.append("User mentioned experience")

    combined = existing_summary

    for fact in facts:
        if fact not in combined:
            combined = (combined + ". " + fact).strip(". ")

    return combined[:1000]