"""
Business Brain v2 API

Full CRUD for the business_rules table.
This replaces the old business_contexts approach with a structured,
keyword-triggered rule system that the AI uses to reply intelligently.

Each rule has:
- rule_name: A friendly label (e.g. "SAP MM Enquiry")
- category: Type of rule (greeting, business_rule, lead_collection, etc.)
- trigger_keywords: List of words that activate this rule
- response_template: What the AI should say when this rule is triggered
- is_active: Toggle on/off without deleting
- priority: Higher priority rules are matched first
- notes: Internal notes (not shown to customers)
"""

from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

from ..memory import supabase

router = APIRouter()

ORGANIZATION_ID = 1  # Will be dynamic in multi-tenant phase


class BusinessRuleCreate(BaseModel):
    rule_name: str
    category: str = "business_rule"
    trigger_keywords: List[str] = []
    response_template: str
    priority: int = 10
    notes: str = ""


class BusinessRuleUpdate(BaseModel):
    rule_name: Optional[str] = None
    category: Optional[str] = None
    trigger_keywords: Optional[List[str]] = None
    response_template: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


# --- List all rules ---
@router.get("/brain/rules")
def list_brain_rules():
    try:
        result = (
            supabase.table("business_rules")
            .select("*")
            .eq("organization_id", ORGANIZATION_ID)
            .order("priority", desc=True)
            .order("updated_at", desc=True)
            .execute()
        )

        rules = result.data or []

        # Deduplicate by rule_name + response_template for display
        # (does not delete from DB, just groups for UI awareness)
        return {
            "status": "success",
            "rules": rules,
            "total": len(rules),
        }

    except Exception as e:
        print(f"BRAIN RULES LIST ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}


# --- Create a new rule ---
@router.post("/brain/rules")
def create_brain_rule(req: BusinessRuleCreate):
    try:
        if not req.rule_name.strip():
            return {"status": "error", "message": "rule_name is required"}

        if not req.response_template.strip():
            return {"status": "error", "message": "response_template is required"}

        # Clean up keywords — strip whitespace, lowercase
        clean_keywords = [k.strip().lower() for k in req.trigger_keywords if k.strip()]

        payload = {
            "organization_id": ORGANIZATION_ID,
            "rule_name": req.rule_name.strip(),
            "category": req.category.strip() or "business_rule",
            "trigger_keywords": clean_keywords,
            "response_template": req.response_template.strip(),
            "priority": req.priority,
            "is_active": True,
            "notes": req.notes.strip(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }

        result = supabase.table("business_rules").insert(payload).execute()

        return {
            "status": "success",
            "rule": result.data[0] if result.data else payload,
        }

    except Exception as e:
        print(f"BRAIN RULE CREATE ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}


# --- Update a rule (edit or toggle active/inactive) ---
@router.patch("/brain/rules/{rule_id}")
def update_brain_rule(rule_id: int, req: BusinessRuleUpdate):
    try:
        updates = {}

        if req.rule_name is not None:
            updates["rule_name"] = req.rule_name.strip()
        if req.category is not None:
            updates["category"] = req.category.strip()
        if req.trigger_keywords is not None:
            updates["trigger_keywords"] = [k.strip().lower() for k in req.trigger_keywords if k.strip()]
        if req.response_template is not None:
            updates["response_template"] = req.response_template.strip()
        if req.priority is not None:
            updates["priority"] = req.priority
        if req.is_active is not None:
            updates["is_active"] = req.is_active
        if req.notes is not None:
            updates["notes"] = req.notes.strip()

        if not updates:
            return {"status": "error", "message": "No fields to update"}

        updates["updated_at"] = datetime.utcnow().isoformat()

        result = (
            supabase.table("business_rules")
            .update(updates)
            .eq("id", rule_id)
            .eq("organization_id", ORGANIZATION_ID)
            .execute()
        )

        return {
            "status": "success",
            "rule": result.data[0] if result.data else {},
        }

    except Exception as e:
        print(f"BRAIN RULE UPDATE ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}


# --- Toggle active/inactive (quick shortcut) ---
@router.patch("/brain/rules/{rule_id}/toggle")
def toggle_brain_rule(rule_id: int):
    try:
        # Get current state
        current = (
            supabase.table("business_rules")
            .select("is_active")
            .eq("id", rule_id)
            .eq("organization_id", ORGANIZATION_ID)
            .single()
            .execute()
        )

        if not current.data:
            return {"status": "error", "message": "Rule not found"}

        new_state = not current.data.get("is_active", True)

        result = (
            supabase.table("business_rules")
            .update({"is_active": new_state, "updated_at": datetime.utcnow().isoformat()})
            .eq("id", rule_id)
            .eq("organization_id", ORGANIZATION_ID)
            .execute()
        )

        return {
            "status": "success",
            "is_active": new_state,
            "rule": result.data[0] if result.data else {},
        }

    except Exception as e:
        print(f"BRAIN RULE TOGGLE ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}


# --- Delete a rule ---
@router.delete("/brain/rules/{rule_id}")
def delete_brain_rule(rule_id: int):
    try:
        supabase.table("business_rules").delete().eq("id", rule_id).eq(
            "organization_id", ORGANIZATION_ID
        ).execute()

        return {"status": "success", "message": f"Rule {rule_id} deleted"}

    except Exception as e:
        print(f"BRAIN RULE DELETE ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}
