"""
Campaign Context Engine API

Allows the admin to describe today's active campaigns, posts, offers,
job openings, and announcements in plain English.

The AI automatically uses this context when replying to customer enquiries.

Each campaign context entry has:
- title        : Short label (e.g. "July Batch Offer", "New Job Opening")
- context_type : post | offer | job | announcement | reel | story | general
- description  : Plain English description of the campaign/post/offer
- valid_until  : Optional expiry date (auto-deactivated after this date)
- is_active    : Toggle on/off without deleting
- priority     : Higher priority = injected first into AI prompt

The pipeline reads from this table via business_context.py (Source 3).
"""

from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional

from ..memory import supabase

router = APIRouter()

ORGANIZATION_ID = 1  # Will be dynamic in multi-tenant phase

CONTEXT_TYPES = ["post", "offer", "job", "announcement", "reel", "story", "general"]


class CampaignContextCreate(BaseModel):
    title: str
    context_type: str = "general"
    description: str
    valid_until: Optional[str] = None  # ISO date string YYYY-MM-DD
    priority: int = 10


class CampaignContextUpdate(BaseModel):
    title: Optional[str] = None
    context_type: Optional[str] = None
    description: Optional[str] = None
    valid_until: Optional[str] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None


# ─── LIST ─────────────────────────────────────────────────────────────────────

@router.get("/campaign-context")
def list_campaign_contexts(include_inactive: bool = False):
    """List all campaign contexts, optionally including inactive ones."""
    try:
        query = (
            supabase.table("business_contexts")
            .select("*")
            .eq("organization_id", ORGANIZATION_ID)
            .order("priority", desc=True)
            .order("updated_at", desc=True)
        )

        if not include_inactive:
            query = query.eq("status", "active")

        result = query.execute()
        rows = result.data or []

        # Auto-expire entries past their valid_until date
        today = date.today().isoformat()
        expired_ids = []
        active_rows = []

        for row in rows:
            valid_until = row.get("valid_until")
            if valid_until and valid_until < today and row.get("status") == "active":
                expired_ids.append(row["id"])
            else:
                active_rows.append(row)

        if expired_ids:
            supabase.table("business_contexts").update({
                "status": "inactive",
                "updated_at": datetime.utcnow().isoformat(),
            }).in_("id", expired_ids).execute()
            print(f"CAMPAIGN_CONTEXT: Auto-expired {len(expired_ids)} entries", flush=True)

        return {
            "status": "success",
            "contexts": active_rows if not include_inactive else rows,
            "total": len(active_rows if not include_inactive else rows),
            "expired_count": len(expired_ids),
        }

    except Exception as e:
        print(f"CAMPAIGN_CONTEXT LIST ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}


# ─── CREATE ───────────────────────────────────────────────────────────────────

@router.post("/campaign-context")
def create_campaign_context(req: CampaignContextCreate):
    """Create a new campaign context entry."""
    try:
        if not req.title.strip():
            return {"status": "error", "message": "title is required"}
        if not req.description.strip():
            return {"status": "error", "message": "description is required"}
        if req.context_type not in CONTEXT_TYPES:
            return {"status": "error", "message": f"context_type must be one of: {', '.join(CONTEXT_TYPES)}"}

        now = datetime.utcnow().isoformat()

        payload = {
            "organization_id": ORGANIZATION_ID,
            "title": req.title.strip(),
            "context_text": f"[{req.context_type.upper()}] {req.description.strip()}",
            "status": "active",
            "priority": req.priority,
            "created_at": now,
            "updated_at": now,
        }
        # valid_until is optional — only add if column exists in schema
        if req.valid_until:
            payload["valid_until"] = req.valid_until

        result = supabase.table("business_contexts").insert(payload).execute()

        return {
            "status": "success",
            "context": result.data[0] if result.data else payload,
        }

    except Exception as e:
        print(f"CAMPAIGN_CONTEXT CREATE ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}


# ─── UPDATE ───────────────────────────────────────────────────────────────────

@router.patch("/campaign-context/{context_id}")
def update_campaign_context(context_id: int, req: CampaignContextUpdate):
    """Update an existing campaign context entry."""
    try:
        updates = {"updated_at": datetime.utcnow().isoformat()}

        if req.title is not None:
            updates["title"] = req.title.strip()
        if req.description is not None or req.context_type is not None:
            # Re-build context_text if either field changes
            # Fetch current values first
            current = supabase.table("business_contexts").select("title, context_text").eq("id", context_id).execute()
            current_text = (current.data[0].get("context_text", "") if current.data else "")
            current_type = current_text.split("]")[0].lstrip("[") if "]" in current_text else "GENERAL"
            new_type = (req.context_type or current_type).upper()
            new_desc = req.description.strip() if req.description else current_text.split("] ", 1)[-1]
            updates["context_text"] = f"[{new_type}] {new_desc}"
        if req.is_active is not None:
            updates["status"] = "active" if req.is_active else "inactive"
        if req.priority is not None:
            updates["priority"] = req.priority
        # valid_until is optional — only update if provided and column exists
        if req.valid_until:
            updates["valid_until"] = req.valid_until

        result = (
            supabase.table("business_contexts")
            .update(updates)
            .eq("id", context_id)
            .eq("organization_id", ORGANIZATION_ID)
            .execute()
        )

        return {
            "status": "success",
            "context": result.data[0] if result.data else {},
        }

    except Exception as e:
        print(f"CAMPAIGN_CONTEXT UPDATE ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}


# ─── TOGGLE ───────────────────────────────────────────────────────────────────

@router.patch("/campaign-context/{context_id}/toggle")
def toggle_campaign_context(context_id: int):
    """Toggle a campaign context active/inactive."""
    try:
        current = (
            supabase.table("business_contexts")
            .select("status")
            .eq("id", context_id)
            .eq("organization_id", ORGANIZATION_ID)
            .execute()
        )

        if not current.data:
            return {"status": "error", "message": "Context not found"}

        current_status = current.data[0].get("status", "active")
        new_status = "inactive" if current_status == "active" else "active"

        supabase.table("business_contexts").update({
            "status": new_status,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", context_id).execute()

        return {"status": "success", "new_status": new_status}

    except Exception as e:
        print(f"CAMPAIGN_CONTEXT TOGGLE ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}


# ─── DELETE ───────────────────────────────────────────────────────────────────

@router.delete("/campaign-context/{context_id}")
def delete_campaign_context(context_id: int):
    """Delete a campaign context entry."""
    try:
        supabase.table("business_contexts").delete().eq("id", context_id).eq(
            "organization_id", ORGANIZATION_ID
        ).execute()

        return {"status": "success", "message": f"Campaign context {context_id} deleted"}

    except Exception as e:
        print(f"CAMPAIGN_CONTEXT DELETE ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}
