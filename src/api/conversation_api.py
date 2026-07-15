"""
Conversation API

Real columns in conversations table:
sender_id, summary, last_question, last_reply, history,
updated_at, first_message_at, ai_replied, manual_replied,
pending_reply, needs_human, human_reason, conversation_state,
closed_at, state_reason
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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
    channel: Optional[str] = "instagram"


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

        channel = req.channel or "instagram"
        result = send_reply(
            channel=channel,
            recipient_id=req.sender_id,
            message=req.message.strip(),
        )

        print(f"DASHBOARD SEND RESULT: {result}", flush=True)
        
        if result.get("status") == "error":
            return {
                "status": "error",
                "message": result.get("message", f"Failed to send to {channel}")
            }
            
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


class ConversationStatusUpdateRequest(BaseModel):
    sender_id: str
    status: str  # e.g., "closed", "needs_human", "pending_reply"
    reason: Optional[str] = None


@router.post("/conversations/{sender_id}/status")
def update_conversation_status(sender_id: str, status: str):
    try:
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        if status == "closed":
            update_data["closed_at"] = datetime.utcnow().isoformat()
            update_data["conversation_state"] = "closed"
            update_data["needs_human"] = False
            update_data["pending_reply"] = False
            update_data["human_reason"] = None
        elif status == "needs_human":
            update_data["needs_human"] = True
            update_data["human_reason"] = "Marked by human"
            update_data["conversation_state"] = "needs_human"
            update_data["pending_reply"] = False
        else:
            return {"status": "error", "message": "Invalid status provided"}

        supabase.table("conversations").update(update_data).eq("sender_id", sender_id).execute()

        return {"status": "success", "message": f"Conversation {sender_id} status updated to {status}"}

    except Exception as e:
        print(f"UPDATE CONVERSATION STATUS ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}


# ─── LIST ALL CONVERSATIONS ───────────────────────────────────────────────────

@router.get("/conversations")
def list_conversations(
    filter: Optional[str] = Query(default="all"),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=100),
    offset: int = Query(default=0),
):
    """
    Returns paginated list of conversations for the inbox.
    Uses only real columns: sender_id, summary, last_question, last_reply,
    history, updated_at, first_message_at, needs_human, conversation_state,
    human_reason, ai_replied, manual_replied, pending_reply
    """
    try:
        # Only select columns that actually exist
        result = (
            supabase.table("conversations")
            .select(
                "sender_id, summary, last_question, last_reply, history, "
                "updated_at, first_message_at, needs_human, conversation_state, "
                "human_reason, ai_replied, manual_replied, pending_reply"
            )
            .order("updated_at", desc=True)
            .limit(500)
            .execute()
        )
        all_convs = result.data or []

        # Customer name lookup
        customers_result = supabase.table("customers").select("channel_user_id, name").execute()
        name_map = {
            c["channel_user_id"]: c.get("name", "")
            for c in (customers_result.data or [])
        }

        def get_display_name(conv):
            sid = conv.get("sender_id", "")
            return name_map.get(sid) or (f"User ...{sid[-4:]}" if sid else "Unknown")

        def get_last_message(conv):
            # Try history first
            history = conv.get("history") or []
            for item in reversed(history):
                if item.get("user"):
                    return item["user"]
                if item.get("assistant"):
                    return item["assistant"]
            # Fall back to last_question or last_reply
            return conv.get("last_question") or conv.get("last_reply") or conv.get("summary") or ""

        def get_last_sender(conv):
            history = conv.get("history") or []
            for item in reversed(history):
                if item.get("user"):
                    return "user"
                if item.get("assistant"):
                    return "ai"
            return "unknown"

        def get_message_count(conv):
            return len(conv.get("history") or [])

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
            enriched = [c for c in enriched if c.get("pending_reply") or c.get("conversation_state") in ("pending_reply", "lead_collection")]
        elif filter == "ai_replied":
            enriched = [c for c in enriched if c.get("ai_replied") or c.get("conversation_state") in ("ai_replied", "replied")]
        elif filter == "manual_replied":
            enriched = [c for c in enriched if c.get("manual_replied") or c.get("conversation_state") == "manual_replied"]

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

        # Strip full history from list view to save bandwidth
        for conv in page:
            full_history = conv.get("history") or []
            conv["history_preview"] = full_history[-2:] if full_history else []

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
