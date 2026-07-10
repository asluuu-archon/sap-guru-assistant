from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional

from ..services.reply_service import send_reply
from ..memory import (
    get_conversation,
    mark_manual_replied,
    supabase,
)

router = APIRouter()


class ManualReplyRequest(BaseModel):
    sender_id: str
    message: str


@router.get("/conversation/{sender_id}")
def get_conversation_detail(sender_id: str):
    try:
        conversation = get_conversation(sender_id)
        return {
            "status": "success",
            "sender_id": sender_id,
            "conversation": conversation,
        }
    except Exception as e:
        print(f"CONVERSATION DETAIL ERROR: {e}", flush=True)
        return {
            "status": "error",
            "message": str(e),
        }


@router.post("/conversation/send-reply")
def send_manual_reply_from_dashboard(req: ManualReplyRequest):
    try:
        if not req.sender_id or not req.message.strip():
            return {
                "status": "error",
                "message": "sender_id and message are required",
            }

        result = send_reply(
            channel="instagram",
            recipient_id=req.sender_id,
            message=req.message.strip(),
        )

        print(f"DASHBOARD SEND RESULT: {result}", flush=True)
        mark_manual_replied(req.sender_id, req.message.strip())

        return {
            "status": "success",
            "message": "Reply sent successfully",
            "result": result,
        }

    except Exception as e:
        print(f"DASHBOARD SEND REPLY ERROR: {e}", flush=True)
        return {
            "status": "error",
            "message": str(e),
        }


# ─── LIST ALL CONVERSATIONS ───────────────────────────────────────────────────

@router.get("/conversations")
def list_conversations(
    filter: Optional[str] = Query(default="all"),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=100),
    offset: int = Query(default=0),
):
    """
    Returns a paginated list of conversations for the inbox.
    Supports filter: all | needs_human | pending_reply | ai_replied | manual_replied
    Supports search by sender_id or last message content.
    Enriches each row with customer name from the customers table.
    """
    try:
        # Fetch conversations
        query = (
            supabase.table("conversations")
            .select("sender_id, updated_at, created_at, needs_human, conversation_state, category, history, last_question, summary")
            .order("updated_at", desc=True)
            .limit(500)  # Fetch more, filter in Python for accuracy
        )
        result = query.execute()
        all_convs = result.data or []

        # Fetch customer name map
        customers_result = supabase.table("customers").select("channel_user_id, name").execute()
        name_map = {
            c["channel_user_id"]: c.get("name", "")
            for c in (customers_result.data or [])
        }

        # Enrich with customer name and last message
        def get_display_name(conv):
            sid = conv.get("sender_id", "")
            return name_map.get(sid) or (f"User ...{sid[-4:]}" if sid else "Unknown")

        def get_last_message(conv):
            history = conv.get("history") or []
            for item in reversed(history):
                if item.get("user"):
                    return item["user"]
                if item.get("assistant"):
                    return item["assistant"]
            return conv.get("last_question") or conv.get("summary") or ""

        def get_message_count(conv):
            return len(conv.get("history") or [])

        def get_last_sender(conv):
            """Returns 'user' or 'ai' depending on who sent the last message."""
            history = conv.get("history") or []
            for item in reversed(history):
                if item.get("user"):
                    return "user"
                if item.get("assistant"):
                    return "ai"
            return "unknown"

        enriched = []
        for conv in all_convs:
            state = conv.get("conversation_state") or ""
            needs_human = conv.get("needs_human") or state == "needs_human"

            enriched.append({
                **conv,
                "display_name": get_display_name(conv),
                "last_message": get_last_message(conv),
                "message_count": get_message_count(conv),
                "last_sender": get_last_sender(conv),
                "needs_human": needs_human,
            })

        # Apply filter
        if filter == "needs_human":
            enriched = [c for c in enriched if c.get("needs_human")]
        elif filter == "pending_reply":
            enriched = [c for c in enriched if c.get("conversation_state") in ("pending_reply", "awaiting_reply", "lead_collection")]
        elif filter == "ai_replied":
            enriched = [c for c in enriched if c.get("conversation_state") in ("ai_replied", "replied")]
        elif filter == "manual_replied":
            enriched = [c for c in enriched if c.get("conversation_state") == "manual_replied"]

        # Apply search
        if search and search.strip():
            q = search.strip().lower()
            enriched = [
                c for c in enriched
                if q in (c.get("display_name") or "").lower()
                or q in (c.get("last_message") or "").lower()
                or q in (c.get("sender_id") or "").lower()
            ]

        total = len(enriched)
        page = enriched[offset: offset + limit]

        # Strip full history from list view (save bandwidth) — only keep last 2 messages
        for conv in page:
            full_history = conv.get("history") or []
            conv["history_preview"] = full_history[-2:] if full_history else []
            # Keep full history for the detail panel
            # (frontend fetches full history via /conversation/{sender_id})

        return {
            "status": "success",
            "total": total,
            "offset": offset,
            "limit": limit,
            "conversations": page,
        }

    except Exception as e:
        print(f"LIST CONVERSATIONS ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}
