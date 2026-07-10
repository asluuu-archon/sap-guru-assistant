"""
Settings API

Provides GET and PATCH endpoints for the business_profile table.
Allows the dashboard to read and update all configurable settings
for an organisation without touching the database directly.

Settings managed here:
- reply_delay_minutes   : How long to wait before sending AI reply (int)
- ai_tone               : Tone of AI replies (friendly / professional / formal)
- business_name         : Display name of the business
- business_description  : Short description used in AI prompts
- working_hours_start   : Working hours start (e.g. "09:00")
- working_hours_end     : Working hours end (e.g. "18:00")
- working_days          : Comma-separated days (e.g. "Mon,Tue,Wed,Thu,Fri")
- auto_reply_enabled    : Whether AI replies are sent automatically (bool)
- out_of_hours_message  : Message to send outside working hours
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from ..memory import supabase

router = APIRouter()

ORGANIZATION_ID = 1

# Default values shown when no record exists yet
DEFAULTS = {
    "business_name": "",
    "business_description": "",
    "reply_delay_minutes": 15,
    "ai_tone": "friendly",
    "working_hours_start": "09:00",
    "working_hours_end": "18:00",
    "working_days": "Mon,Tue,Wed,Thu,Fri",
    "auto_reply_enabled": False,
    "out_of_hours_message": "",
}


class SettingsUpdateRequest(BaseModel):
    business_name: Optional[str] = None
    business_description: Optional[str] = None
    reply_delay_minutes: Optional[int] = None
    ai_tone: Optional[str] = None
    working_hours_start: Optional[str] = None
    working_hours_end: Optional[str] = None
    working_days: Optional[str] = None
    auto_reply_enabled: Optional[bool] = None
    out_of_hours_message: Optional[str] = None


@router.get("/settings")
def get_settings():
    """
    Returns current settings for the organisation.
    Merges database values with defaults so the frontend always gets a complete object.
    """
    try:
        result = (
            supabase.table("business_profile")
            .select("*")
            .eq("organization_id", ORGANIZATION_ID)
            .limit(1)
            .execute()
        )

        rows = result.data or []
        db_row = rows[0] if rows else {}

        # Merge defaults with whatever is in the database
        settings = {**DEFAULTS}
        for key in DEFAULTS:
            if db_row.get(key) is not None:
                settings[key] = db_row[key]

        # Include metadata fields if present
        settings["id"] = db_row.get("id")
        settings["organization_id"] = ORGANIZATION_ID
        settings["updated_at"] = db_row.get("updated_at")

        return {"status": "success", "settings": settings}

    except Exception as e:
        print(f"SETTINGS GET ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}


@router.patch("/settings")
def update_settings(req: SettingsUpdateRequest):
    """
    Updates one or more settings fields for the organisation.
    Only fields explicitly provided in the request body are updated.
    """
    try:
        # Build payload from only the fields that were provided
        payload = {}

        if req.business_name is not None:
            payload["business_name"] = req.business_name.strip()

        if req.business_description is not None:
            payload["business_description"] = req.business_description.strip()

        if req.reply_delay_minutes is not None:
            delay = int(req.reply_delay_minutes)
            if delay < 1:
                return {"status": "error", "message": "reply_delay_minutes must be at least 1"}
            payload["reply_delay_minutes"] = delay

        if req.ai_tone is not None:
            valid_tones = {"friendly", "professional", "formal"}
            if req.ai_tone not in valid_tones:
                return {"status": "error", "message": f"ai_tone must be one of: {', '.join(valid_tones)}"}
            payload["ai_tone"] = req.ai_tone

        if req.working_hours_start is not None:
            payload["working_hours_start"] = req.working_hours_start.strip()

        if req.working_hours_end is not None:
            payload["working_hours_end"] = req.working_hours_end.strip()

        if req.working_days is not None:
            payload["working_days"] = req.working_days.strip()

        if req.auto_reply_enabled is not None:
            payload["auto_reply_enabled"] = req.auto_reply_enabled

        if req.out_of_hours_message is not None:
            payload["out_of_hours_message"] = req.out_of_hours_message.strip()

        if not payload:
            return {"status": "error", "message": "No fields provided to update"}

        payload["updated_at"] = datetime.utcnow().isoformat()

        # Check if a record exists for this org
        existing = (
            supabase.table("business_profile")
            .select("id")
            .eq("organization_id", ORGANIZATION_ID)
            .limit(1)
            .execute()
        )

        rows = existing.data or []

        if rows:
            # Update existing record
            result = (
                supabase.table("business_profile")
                .update(payload)
                .eq("organization_id", ORGANIZATION_ID)
                .execute()
            )
        else:
            # Insert new record
            payload["organization_id"] = ORGANIZATION_ID
            result = supabase.table("business_profile").insert(payload).execute()

        updated = result.data[0] if result.data else payload
        print(f"SETTINGS UPDATED: {list(payload.keys())}", flush=True)

        return {"status": "success", "settings": updated}

    except Exception as e:
        print(f"SETTINGS UPDATE ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}
