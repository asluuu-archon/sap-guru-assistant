from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/businesses", tags=["Businesses"])


def _supabase():
    from src.memory import supabase
    return supabase


class BusinessCreate(BaseModel):
    name: str
    industry: str
    instagram_handle: str
    description: Optional[str] = ""


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    instagram_handle: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/")
async def list_businesses():
    """List all businesses for the switcher."""
    try:
        supabase = _supabase()
        # Fallback mock if table doesn't exist yet
        try:
            res = supabase.table("businesses").select("*").order("created_at", desc=False).execute()
            return {"status": "success", "businesses": res.data or []}
        except Exception:
            # Mock data so UI doesn't crash before SQL is run
            return {
                "status": "success",
                "businesses": [
                    {
                        "id": "00000000-0000-0000-0000-000000000000",
                        "name": "SAP Guru Assistant",
                        "industry": "Education / Training",
                        "instagram_handle": "@sap_guru",
                        "is_active": True
                    }
                ],
                "note": "Table might not exist yet"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_business(biz: BusinessCreate):
    """Register a new business workspace."""
    try:
        supabase = _supabase()
        data = {
            "name": biz.name,
            "industry": biz.industry,
            "instagram_handle": biz.instagram_handle,
            "description": biz.description,
            "is_active": True
        }
        res = supabase.table("businesses").insert(data).execute()
        
        # When a business is created, also create a default business_profile
        biz_id = res.data[0]["id"]
        try:
            supabase.table("business_profile").insert({
                "business_id": biz_id,
                "business_name": biz.name,
                "business_description": biz.description,
                "ai_tone": "professional",
                "auto_reply_enabled": False
            }).execute()
        except Exception:
            pass # ignore if table structure differs
            
        return {"status": "success", "business": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{business_id}/stats")
async def get_business_stats(business_id: str):
    """Get high-level stats for the Businesses admin page."""
    try:
        supabase = _supabase()
        # This will fail gracefully if the columns don't exist yet
        try:
            leads_res = supabase.table("leads").select("id", count="exact").eq("business_id", business_id).execute()
            conv_res = supabase.table("conversations").select("id", count="exact").eq("business_id", business_id).execute()
            return {
                "status": "success",
                "stats": {
                    "total_leads": leads_res.count or 0,
                    "total_conversations": conv_res.count or 0
                }
            }
        except Exception:
            # Fallback if business_id column isn't added to leads/conversations yet
            return {
                "status": "success",
                "stats": {
                    "total_leads": 0,
                    "total_conversations": 0,
                    "note": "business_id column might not exist yet"
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
