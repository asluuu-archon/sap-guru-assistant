from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from datetime import datetime, timedelta, timezone
import os
from supabase import create_client, Client

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def _supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise Exception("Supabase credentials not configured")
    return create_client(url, key)

@router.get("/")
async def get_notifications(business_id: Optional[str] = Header(None, alias="X-Business-ID")):
    """Get all alerts for the active business: hot leads, needs human review, stale conversations."""
    try:
        supabase = _supabase()
        notifications = []
        
        # We need to filter by business_id if the tables have it, otherwise fallback to global
        # Currently the tables might not have business_id populated for existing data
        # We will query all data for now and format it as notifications

        # 1. Hot Leads — use real columns: id, name, sender_id, temperature, updated_at
        try:
            hot_res = supabase.table("leads").select("id, name, sender_id, temperature, updated_at").order("updated_at", desc=True).limit(50).execute()
            for row in (hot_res.data or []):
                if str(row.get("temperature", "")).lower() == "hot":
                    name = row.get("name") or row.get("sender_id") or "Unknown"
                    notifications.append({
                        "id": f"hot_{row['id']}",
                        "type": "hot_lead",
                        "title": "New Hot Lead",
                        "message": f"{name} was marked as a Hot Lead.",
                        "time": row.get("updated_at"),
                        "action": "View Lead",
                        "target_page": "Leads",
                        "is_read": False
                    })
        except Exception as e:
            print(f"NOTIFICATIONS: hot leads query failed: {e}", flush=True)

        # 2. Needs Human Review — use conversations table (needs_human field lives there)
        try:
            human_res = supabase.table("conversations").select("sender_id, needs_human, updated_at, conversation_state").eq("needs_human", True).order("updated_at", desc=True).limit(5).execute()
            for row in (human_res.data or []):
                sid = row.get("sender_id") or "Unknown"
                notifications.append({
                    "id": f"human_{sid}",
                    "type": "needs_human",
                    "title": "Human Intervention Required",
                    "message": f"Conversation with {sid} requires manual review.",
                    "time": row.get("updated_at"),
                    "action": "Review",
                    "target_page": "Conversations",
                    "is_read": False
                })
        except Exception as e:
            print(f"NOTIFICATIONS: needs_human query failed: {e}", flush=True)

        # 3. Stale Conversations (no activity in 48h) — use sender_id, not id
        try:
            forty_eight_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
            stale_res = supabase.table("conversations").select("sender_id, updated_at, conversation_state").lt("updated_at", forty_eight_hours_ago).order("updated_at", desc=True).limit(3).execute()
            for row in (stale_res.data or []):
                sid = row.get("sender_id") or "unknown"
                notifications.append({
                    "id": f"stale_{sid}",
                    "type": "stale_conversation",
                    "title": "Stale Conversation",
                    "message": "No reply from user in 48 hours.",
                    "time": row.get("updated_at"),
                    "action": "Follow Up",
                    "target_page": "Conversations",
                    "is_read": False
                })
        except Exception as e:
            print(f"NOTIFICATIONS: stale conversations query failed: {e}", flush=True)

        # Sort by time descending
        notifications.sort(key=lambda x: x["time"] or "", reverse=True)

        return {
            "status": "success",
            "unread_count": len(notifications),
            "notifications": notifications
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
