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
        "pending_reply": False,
        "ai_replied": False,
        "manual_replied": False,
        "needs_human": False,
        "human_reason": "",
        "conversation_state": "new",
        "state_reason": "",
    }


def build_context(conversation: dict) -> str:
    history = conversation.get("history") or []
    recent = history[-10:]

    lines = []

    if conversation.get("conversation_state"):
        lines.append(f"Conversation state: {conversation['conversation_state']}")

    if conversation.get("summary"):
        lines.append(f"Known summary: {conversation['summary']}")

    if conversation.get("last_question"):
        lines.append(f"Last question asked: {conversation['last_question']}")

    if conversation.get("last_reply"):
        lines.append(f"Last reply sent: {conversation['last_reply']}")

    if recent:
        lines.append("Recent conversation:")
        for item in recent:
            user_text = item.get("user")
            assistant_text = item.get("assistant")

            if user_text:
                lines.append(f"User: {user_text}")

            if assistant_text:
                lines.append(f"Assistant: {assistant_text}")

    return "\n".join(lines)


def save_conversation(
    sender_id: str,
    user_message: str,
    assistant_reply: str,
    category: str = "",
):
    conversation = get_conversation(sender_id)
    history = conversation.get("history") or []

    now = datetime.utcnow().isoformat()

    history.append({
        "time": now,
        "user": user_message,
        "assistant": assistant_reply,
        "category": category,
    })

    history = history[-30:]

    summary = conversation.get("summary") or ""

    if user_message:
        summary = update_simple_summary(summary, user_message)

    state = "active"
    state_reason = "New user message received"

    if category == "learning_lead":
        state = "lead_collection"
        state_reason = "Learning enquiry detected"

    if category == "needs_human":
        state = "needs_human"
        state_reason = "Needs human review"

    payload = {
        "sender_id": sender_id,
        "summary": summary,
        "last_question": get_last_question(conversation, assistant_reply),
        "last_reply": assistant_reply,
        "history": history,
        "updated_at": now,
        "first_message_at": conversation.get("first_message_at") or now,

        "pending_reply": True,
        "ai_replied": False,
        "manual_replied": False,

        "needs_human": category == "needs_human",
        "human_reason": state_reason if category == "needs_human" else "",

        "conversation_state": state,
        "state_reason": state_reason,
        "closed_at": None,
    }

    supabase.table("conversations").upsert(payload).execute()


def mark_manual_replied(sender_id: str, manual_reply: str = ""):
    payload = {
        "manual_replied": True,
        "ai_replied": False,
        "pending_reply": False,
        "needs_human": False,
        "human_reason": "",
        "conversation_state": "active",
        "state_reason": "Manual reply sent",
        "updated_at": datetime.utcnow().isoformat(),
    }

    if manual_reply:
        payload["last_reply"] = manual_reply

    supabase.table("conversations").update(payload).eq("sender_id", sender_id).execute()


def mark_ai_replied(sender_id: str, ai_reply: str = "", history=None):
    payload = {
        "ai_replied": True,
        "manual_replied": False,
        "pending_reply": False,
        "needs_human": False,
        "human_reason": "",
        "conversation_state": "active",
        "state_reason": "AI reply sent",
        "updated_at": datetime.utcnow().isoformat(),
    }

    if ai_reply:
        payload["last_reply"] = ai_reply

    if history is not None:
        payload["history"] = history

    supabase.table("conversations").update(payload).eq("sender_id", sender_id).execute()


def mark_needs_human(sender_id: str, reason: str = "Needs human review"):
    supabase.table("conversations").update({
        "pending_reply": False,
        "ai_replied": False,
        "manual_replied": False,
        "needs_human": True,
        "human_reason": reason,
        "conversation_state": "needs_human",
        "state_reason": reason,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("sender_id", sender_id).execute()


def mark_closed(sender_id: str, reason: str = "Conversation closed"):
    now = datetime.utcnow().isoformat()

    supabase.table("conversations").update({
        "pending_reply": False,
        "ai_replied": False,
        "manual_replied": False,
        "needs_human": False,
        "human_reason": "",
        "conversation_state": "closed",
        "state_reason": reason,
        "closed_at": now,
        "updated_at": now,
    }).eq("sender_id", sender_id).execute()


def get_last_question(conversation: dict, assistant_reply: str) -> str:
    lower_reply = assistant_reply.lower().strip()

    casual_questions = [
        "how are you",
        "how about you",
        "where are you",
    ]

    if assistant_reply.endswith("?") and not any(q in lower_reply for q in casual_questions):
        return assistant_reply

    return conversation.get("last_question", "")


def update_simple_summary(existing_summary: str, message: str) -> str:
    text = message.lower()
    facts = []

    if "bcom" in text or "b.com" in text:
        facts.append("User has BCom background")

    if "mcom" in text or "m.com" in text:
        facts.append("User has MCom background")

    if "mba" in text:
        facts.append("User has MBA background")

    if "btech" in text or "b.tech" in text or "b tech" in text or "betch" in text:
        facts.append("User has BTech background")

    if ("btech" in text or "b.tech" in text or "b tech" in text or "betch" in text) and "it" in text:
        facts.append("User has BTech IT background")

    if "mechanical" in text:
        facts.append("User has mechanical background")

    if "civil" in text:
        facts.append("User has civil background")

    if "computer science" in text or "cse" in text:
        facts.append("User has computer science background")

    if "hr" in text or "hrbp" in text or "human resource" in text:
        facts.append("User has HR background")

    if "supply chain" in text or "logistics" in text or "procurement" in text:
        facts.append("User has supply chain/logistics background")

    if "fico" in text or "sap fi" in text or "finance" in text or "accounting" in text:
        facts.append("Interested in SAP FICO")

    if "abap" in text:
        facts.append("Interested in SAP ABAP")

    if "rap" in text:
        facts.append("Interested in SAP RAP")

    if "cap" in text:
        facts.append("Interested in SAP CAP")

    if "btp" in text:
        facts.append("Interested in SAP BTP")

    if "mm" in text:
        facts.append("Interested in SAP MM")

    if "sd" in text:
        facts.append("Interested in SAP SD")

    if "ewm" in text:
        facts.append("Interested in SAP EWM")

    if "successfactors" in text or "success factors" in text or "sf" in text:
        facts.append("Interested in SAP SuccessFactors")

    if "hcm" in text:
        facts.append("Interested in SAP HCM")

    if "non coding" in text or "non-coding" in text:
        facts.append("Prefers non-coding")

    if "coding" in text or "programming" in text or "developer" in text:
        facts.append("Interested in coding/development")

    if "fresher" in text or "freshers" in text:
        facts.append("User may be fresher")

    if "experience" in text or "years" in text:
        facts.append("User mentioned experience")

    if "career gap" in text or "carrier gap" in text or "gap" in text:
        facts.append("User mentioned career gap")

    combined = existing_summary or ""

    for fact in facts:
        if fact not in combined:
            combined = (combined + ". " + fact).strip(". ")

    return combined[:1000]

def update_conversation_goal(sender_id: str, goal_result: dict):
    goal = goal_result.get("goal", "general")
    confidence = goal_result.get("confidence", 0.0)

    state_map = {
        "learning_lead": "lead_collection",
        "lead_collection": "lead_collection",
        "appointment": "appointment_pending",
        "closing": "closed",
        "greeting": "active",
        "general": "active",
    }

    conversation_state = state_map.get(goal, "active")

    payload = {
        "conversation_state": conversation_state,
        "state_reason": f"Conversation goal detected: {goal} ({confidence})",
        "updated_at": datetime.utcnow().isoformat(),
    }

    if conversation_state == "closed":
        payload["closed_at"] = datetime.utcnow().isoformat()

    supabase.table("conversations").update(payload).eq("sender_id", sender_id).execute()