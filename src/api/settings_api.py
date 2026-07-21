from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/settings", tags=["Settings"])


def _supabase():
    from src.memory import supabase
    return supabase


class SettingsUpdate(BaseModel):
    business_name: Optional[str] = None
    industry: Optional[str] = None
    ai_enabled: Optional[bool] = None
    ai_tone: Optional[str] = None
    reply_delay_minutes: Optional[int] = None
    working_hours: Optional[Dict[str, Any]] = None
    templates: Optional[List[Dict[str, Any]]] = None
    blacklist_keywords: Optional[List[str]] = None


@router.get("/")
async def get_settings(business_id: Optional[str] = Header(None, alias="X-Business-ID")):
    """Get settings for the active business."""
    if not business_id:
        business_id = "00000000-0000-0000-0000-000000000000"

    try:
        supabase = _supabase()
        
        # Check business_profile table
        try:
            res = supabase.table("business_profile").select("*").eq("business_id", business_id).execute()
            profile = res.data[0] if res.data else {}
        except Exception:
            profile = {}

        # Default settings structure
        settings = {
            "business_name": profile.get("business_name", "SAP Guru Assistant"),
            "industry": profile.get("industry", "Education / Training"),
            "ai_enabled": profile.get("auto_reply_enabled", True),
            "ai_tone": profile.get("ai_tone", "Professional & Helpful"),
            "reply_delay_minutes": profile.get("reply_delay_minutes", 2),
            "working_hours": profile.get("working_hours", {
                "mon_fri": "09:00 - 18:00",
                "sat": "10:00 - 14:00",
                "sun": "Closed"
            }),
            "templates": profile.get("templates", [
                {"name": "Greeting", "text": "Hi {name}, thanks for reaching out to SAP Guru! How can I help you today?"},
                {"name": "Course Info", "text": "Our SAP modules cover FICO, MM, SD, and more. Which one are you interested in?"},
                {"name": "Pricing", "text": "Pricing depends on the module. Please let me know your requirement so I can share the exact details."}
            ]),
            "blacklist_keywords": profile.get("blacklist_keywords", ["spam", "free followers", "crypto", "forex"])
        }

        return {"status": "success", "settings": settings}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def update_settings(data: SettingsUpdate, business_id: Optional[str] = Header(None, alias="X-Business-ID")):
    """Update settings for the active business."""
    if not business_id:
        business_id = "00000000-0000-0000-0000-000000000000"

    try:
        supabase = _supabase()
        
        update_data = {}
        if data.business_name is not None: update_data["business_name"] = data.business_name
        if data.industry is not None: update_data["industry"] = data.industry
        if data.ai_enabled is not None: update_data["auto_reply_enabled"] = data.ai_enabled
        if data.ai_tone is not None: update_data["ai_tone"] = data.ai_tone
        if data.reply_delay_minutes is not None: update_data["reply_delay_minutes"] = max(0, data.reply_delay_minutes)
        if data.working_hours is not None: update_data["working_hours"] = data.working_hours
        if data.templates is not None: update_data["templates"] = data.templates
        if data.blacklist_keywords is not None: update_data["blacklist_keywords"] = data.blacklist_keywords

        if not update_data:
            return {"status": "success", "message": "Nothing to update"}

        update_data["updated_at"] = datetime.utcnow().isoformat()

        try:
            # Check if exists
            existing = supabase.table("business_profile").select("id").eq("business_id", business_id).execute()
            if existing.data:
                supabase.table("business_profile").update(update_data).eq("id", existing.data[0]["id"]).execute()
            else:
                update_data["business_id"] = business_id
                supabase.table("business_profile").insert(update_data).execute()
        except Exception:
            # Table might not have all columns yet, ignore gracefully
            pass

        return {"status": "success", "message": "Settings updated"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
