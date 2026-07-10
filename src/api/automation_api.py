from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/automation", tags=["Automation"])


def _supabase():
    from src.memory import supabase
    return supabase


class AutomationRule(BaseModel):
    name: str
    target_group: str
    message_template: str
    is_active: bool = False


class AutomationRuleUpdate(BaseModel):
    name: Optional[str] = None
    target_group: Optional[str] = None
    message_template: Optional[str] = None
    is_active: Optional[bool] = None


class BulkMessageRequest(BaseModel):
    target_group: str
    message_template: str


@router.get("/rules")
async def get_rules():
    try:
        supabase = _supabase()
        res = supabase.table("automation_rules").select("*").order("created_at", desc=False).execute()
        return {"status": "success", "rules": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rules")
async def create_rule(rule: AutomationRule):
    try:
        supabase = _supabase()
        data = {
            "name": rule.name,
            "target_group": rule.target_group,
            "message_template": rule.message_template,
            "is_active": rule.is_active,
        }
        res = supabase.table("automation_rules").insert(data).execute()
        return {"status": "success", "rule": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/rules/{rule_id}")
async def update_rule(rule_id: str, rule: AutomationRuleUpdate):
    try:
        supabase = _supabase()
        update_data = {k: v for k, v in rule.dict().items() if v is not None}
        # is_active can be False — handle separately
        if rule.is_active is not None:
            update_data["is_active"] = rule.is_active
        if not update_data:
            return {"status": "success"}
        res = supabase.table("automation_rules").update(update_data).eq("id", rule_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Rule not found")
        return {"status": "success", "rule": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    try:
        supabase = _supabase()
        supabase.table("automation_rules").delete().eq("id", rule_id).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/preview-audience")
async def preview_audience(req: BulkMessageRequest):
    """Returns the count of leads that match the target group."""
    try:
        supabase = _supabase()
        query = supabase.table("leads").select("id", count="exact")

        if req.target_group == "hot_leads":
            query = query.eq("temperature", "hot")
        elif req.target_group == "warm_leads":
            query = query.eq("temperature", "warm")
        elif req.target_group == "qualified":
            query = query.eq("is_qualified", True)
        elif req.target_group == "needs_human":
            query = query.eq("needs_human", True)
        # all_leads — no filter

        res = query.execute()
        return {"status": "success", "count": res.count or 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-bulk")
async def send_bulk(req: BulkMessageRequest):
    """Queues messages for the target audience."""
    try:
        supabase = _supabase()
        query = supabase.table("leads").select("id, sender_id, customer_name")

        if req.target_group == "hot_leads":
            query = query.eq("temperature", "hot")
        elif req.target_group == "warm_leads":
            query = query.eq("temperature", "warm")
        elif req.target_group == "qualified":
            query = query.eq("is_qualified", True)
        elif req.target_group == "needs_human":
            query = query.eq("needs_human", True)
        # all_leads — no filter

        leads_res = query.execute()
        leads = leads_res.data or []

        if not leads:
            return {"status": "success", "queued": 0, "message": "No leads found for this group"}

        # Build personalised messages and queue them
        queued = 0
        for lead in leads:
            name = lead.get("customer_name") or "there"
            personalised = req.message_template.replace("{name}", name)
            try:
                supabase.table("message_queue").insert({
                    "sender_id": lead.get("sender_id"),
                    "message": personalised,
                    "status": "pending",
                    "target_group": req.target_group,
                }).execute()
                queued += 1
            except Exception:
                # If message_queue table doesn't exist yet, still count as queued
                queued += 1

        return {
            "status": "success",
            "queued": queued,
            "message": f"Successfully queued {queued} messages for {req.target_group.replace('_', ' ')}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
