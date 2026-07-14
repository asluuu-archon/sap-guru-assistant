"""
Hot Lead Action Queue API

Surfaces the highest-priority leads that need immediate human follow-up.
Scoring logic:
  - temperature = hot        → +40 pts
  - temperature = warm       → +20 pts
  - is_qualified = True      → +20 pts
  - has phone number         → +15 pts
  - has email                → +10 pts
  - conversation_state = needs_human → +15 pts
  - last activity < 24h      → +10 pts
  - last activity < 1h       → +10 pts bonus
  - has interested_module    → +5 pts
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/hot-leads", tags=["Hot Leads"])


def _supabase():
    from src.memory import supabase
    return supabase


def score_lead(lead: dict, conv: dict) -> int:
    score = 0

    # Temperature
    temp = (lead.get("temperature") or "").lower()
    if temp == "hot":
        score += 40
    elif temp == "warm":
        score += 20

    # Qualification
    if lead.get("is_qualified"):
        score += 20

    # Contact info
    if lead.get("phone"):
        score += 15
    if lead.get("email"):
        score += 10

    # Conversation state
    state = (conv.get("conversation_state") or "").lower()
    if state == "needs_human":
        score += 15

    # Recency
    updated_raw = conv.get("updated_at") or lead.get("updated_at")
    if updated_raw:
        try:
            updated = datetime.fromisoformat(updated_raw.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            age = now - updated
            if age < timedelta(hours=1):
                score += 20  # Very recent — urgent
            elif age < timedelta(hours=24):
                score += 10  # Active today
        except Exception:
            pass

    # Has module interest
    if lead.get("interested_module"):
        score += 5

    return score


@router.get("/queue")
async def get_hot_lead_queue(
    limit: int = 20,
    business_id: Optional[str] = Header(None, alias="X-Business-ID")
):
    """
    Returns a prioritised list of leads that need immediate action.
    Sorted by score descending.
    """
    try:
        supabase = _supabase()

        # Fetch recent leads
        leads_res = supabase.table("leads").select("*").order("updated_at", desc=True).limit(200).execute()
        leads = leads_res.data or []

        if not leads:
            return {"status": "success", "queue": [], "total": 0}

        # Fetch conversations for these leads
        sender_ids = list({l["sender_id"] for l in leads if l.get("sender_id")})
        conv_map = {}
        if sender_ids:
            # Fetch in batches to avoid URL length limits
            batch_size = 50
            for i in range(0, len(sender_ids), batch_size):
                batch = sender_ids[i:i+batch_size]
                conv_res = supabase.table("conversations").select("sender_id, conversation_state, updated_at, history").in_("sender_id", batch).execute()
                for c in (conv_res.data or []):
                    sid = c["sender_id"]
                    # Keep the most recent conversation per sender
                    if sid not in conv_map or (c.get("updated_at", "") > conv_map[sid].get("updated_at", "")):
                        conv_map[sid] = c

        # Fetch customer names for these leads to fix "Unknown" names
        cust_res = supabase.table("customers").select("channel_user_id, name, attributes").in_("channel_user_id", sender_ids).execute()
        cust_map = {c["channel_user_id"]: c for c in (cust_res.data or [])}

        # Score and build queue
        scored = []
        for lead in leads:
            sid = lead.get("sender_id", "")
            conv = conv_map.get(sid, {})
            score = score_lead(lead, conv)
            
            # Better name fallback
            cust = cust_map.get(sid, {})
            display_name = lead.get("name") or cust.get("name") or cust.get("attributes", {}).get("instagram_username") or "Unknown"

            # Only include leads with meaningful score
            if score < 10:
                continue

            # Get last message from conversation history
            history = conv.get("history") or []
            last_message = ""
            last_message_time = None
            for item in reversed(history):
                if item.get("user"):
                    last_message = item["user"]
                    break

            conv_state = conv.get("conversation_state") or "unknown"
            updated_at = conv.get("updated_at") or lead.get("updated_at")

            # Determine urgency label
            if score >= 80:
                urgency = "critical"
            elif score >= 50:
                urgency = "high"
            elif score >= 30:
                urgency = "medium"
            else:
                urgency = "low"

            scored.append({
                "id": lead.get("id"),
                "sender_id": sid,
                "name": display_name,
                "phone": lead.get("phone") or "",
                "email": lead.get("email") or "",
                "temperature": lead.get("temperature") or "cold",
                "interested_module": lead.get("interested_module") or "",
                "is_qualified": lead.get("is_qualified") or False,
                "conversation_state": conv_state,
                "last_message": last_message,
	                "last_active": updated_at,
	                "score": score,
	                "urgency": urgency,
	                "notes": lead.get("notes") or "",
	                "source": lead.get("source") or "instagram",
	            })

        # Sort by score descending
        scored.sort(key=lambda x: x["score"], reverse=True)
        queue = scored[:limit]

        return {
            "status": "success",
            "queue": queue,
            "total": len(scored),
        }

    except Exception as e:
        print(f"HOT LEADS ERROR: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))


class NoteUpdate(BaseModel):
    lead_id: int
    notes: str


@router.post("/note")
async def update_lead_note(data: NoteUpdate):
    """Update notes on a lead from the action queue."""
    try:
        supabase = _supabase()
        supabase.table("leads").update({
            "notes": data.notes,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", data.lead_id).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class StageUpdate(BaseModel):
    lead_id: int
    stage: str  # 'contacted' | 'demo_scheduled' | 'enrolled' | 'lost'


@router.post("/stage")
async def update_lead_stage(data: StageUpdate):
    """Update the stage of a lead from the action queue."""
    valid_stages = {"contacted", "demo_scheduled", "enrolled", "lost", "qualified", "new"}
    if data.stage not in valid_stages:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Must be one of: {valid_stages}")
    try:
        supabase = _supabase()
        supabase.table("leads").update({
            "lead_stage": data.stage,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", data.lead_id).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
