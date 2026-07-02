from fastapi import APIRouter
from pydantic import BaseModel

from ..memory import supabase

router = APIRouter()


class BusinessContextRequest(BaseModel):
    title: str
    context_text: str
    status: str = "active"
    priority: int = 1


@router.get("/business-contexts")
def list_business_contexts():
    try:
        result = (
            supabase.table("business_contexts")
            .select("*")
            .eq("organization_id", 1)
            .order("updated_at", desc=True)
            .limit(50)
            .execute()
        )

        return {"status": "success", "contexts": result.data or []}

    except Exception as e:
        print(f"BUSINESS CONTEXT LIST ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}


@router.post("/business-contexts")
def create_business_context(req: BusinessContextRequest):
    try:
        payload = {
            "organization_id": 1,
            "title": req.title.strip(),
            "context_text": req.context_text.strip(),
            "status": req.status,
            "priority": req.priority,
        }

        if not payload["title"] or not payload["context_text"]:
            return {"status": "error", "message": "title and context_text are required"}

        result = supabase.table("business_contexts").insert(payload).execute()

        return {
            "status": "success",
            "context": result.data[0] if result.data else payload,
        }

    except Exception as e:
        print(f"BUSINESS CONTEXT CREATE ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}