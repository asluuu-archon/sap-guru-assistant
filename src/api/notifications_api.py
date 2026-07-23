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

        # 1. Hot Leads — query only safe columns, filter in Python
        try:
            hot_res = supabase.table("leads").select("id, instagram_username, customer_name, created_at, temperature").order("created_at", desc=True).limit(50).execute()
            for row in (hot_res.data or []):
                if str(row.get("temperature", "")).lower() == "hot":
                    name = row.get("customer_name") or row.get("instagram_username") or "Unknown"
                    notifications.append({
                        "id": f"hot_{row['id']}",
                        "type": "hot_lead",
                        "title": "New Hot Lead",
                        "message": f"{name} was marked as a Hot Lead.",
                        "time": row.get("created_at"),
                        "action": "View Lead",
                        "target_page": "Leads",
                        "is_read": False
                    })
        except Exception as e:
            print(f"NOTIFICATIONS: hot leads query failed: {e}", flush=True)

        # 2. Needs Human Review — filter in Python to avoid missing-column errors
        try:
            human_res = supabase.table("leads").select("id, instagram_username, customer_name, created_at, needs_human_review").order("created_at", desc=True).limit(50).execute()
            for row in (human_res.data or []):
                if row.get("needs_human_review"):
                    name = row.get("customer_name") or row.get("instagram_username") or "Unknown"
                    notifications.append({
                        "id": f"human_{row['id']}",
                        "type": "needs_human",
                        "title": "Human Intervention Required",
                        "message": f"{name} requires manual review.",
                        "time": row.get("created_at"),
                        "action": "Review",
                        "target_page": "Conversations",
                        "is_read": False
                    })
        except Exception as e:
            print(f"NOTIFICATIONS: needs_human query failed: {e}", flush=True)

        # 3. Stale Conversations (no activity in 48h)
        try:
            forty_eight_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
            stale_res = supabase.table("conversations").select("id, updated_at").lt("updated_at", forty_eight_hours_ago).order("updated_at", desc=True).limit(3).execute()
            for row in (stale_res.data or []):
                notifications.append({
                    "id": f"stale_{row['id']}",
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
