"""
Follower DM API
===============
REST endpoints for the New Follower Auto-DM feature.

Endpoints:
  GET  /follower-dm/settings          — Load current settings for a business
  POST /follower-dm/settings          — Save settings
  POST /follower-dm/test              — Manually trigger a test welcome DM
  GET  /follower-dm/conversations     — List recent follower DM conversations
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/follower-dm", tags=["Follower DM"])


def _supabase():
    from src.memory import supabase
    return supabase


# ── Models ────────────────────────────────────────────────────────────────────

class FollowerDMSettings(BaseModel):
    enabled: bool = True
    welcome_message: str
    whatsapp_group_link: str
    business_context: str


class TestDMRequest(BaseModel):
    test_sender_id: str  # Instagram user ID to send test DM to


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/settings")
async def get_follower_dm_settings(
    business_id: Optional[str] = Header(None, alias="X-Business-ID")
):
    from src.services.follower_dm_service import get_follower_dm_settings
    settings = get_follower_dm_settings(business_id)
    return {"status": "success", "settings": settings}


@router.post("/settings")
async def save_follower_dm_settings(
    data: FollowerDMSettings,
    business_id: Optional[str] = Header(None, alias="X-Business-ID")
):
    if not business_id:
        raise HTTPException(status_code=400, detail="X-Business-ID header required")
    try:
        sb = _supabase()
        payload = {
            "follower_dm_settings": data.dict(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        # Check if business_profile row exists
        existing = sb.table("business_profile") \
            .select("id") \
            .eq("business_id", business_id) \
            .execute()
        if existing.data:
            sb.table("business_profile").update(payload).eq("business_id", business_id).execute()
        else:
            sb.table("business_profile").insert({
                "business_id": business_id,
                **payload,
            }).execute()
        return {"status": "success", "message": "Follower DM settings saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test")
async def test_follower_dm(
    data: TestDMRequest,
    business_id: Optional[str] = Header(None, alias="X-Business-ID")
):
    """Send a test welcome DM to a specific Instagram user ID."""
    from src.services.follower_dm_service import handle_new_follower
    try:
        result = await handle_new_follower(
            sender_id=data.test_sender_id,
            business_id=business_id,
        )
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations")
async def get_follower_conversations(
    business_id: Optional[str] = Header(None, alias="X-Business-ID"),
    limit: int = 50,
):
    """List recent follower DM conversations with their intent and stage."""
    try:
        sb = _supabase()
        query = sb.table("follower_dm_state") \
            .select("*") \
            .order("updated_at", desc=True) \
            .limit(limit)
        if business_id:
            query = query.eq("business_id", business_id)
        res = query.execute()
        return {"status": "success", "conversations": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
