from fastapi import APIRouter

from ..memory import supabase

router = APIRouter()


@router.get("/dashboard-data")
def dashboard_data():
    conversations_result = (
        supabase.table("conversations")
        .select("*")
        .order("updated_at", desc=True)
        .limit(100)
        .execute()
    )

    leads_result = (
        supabase.table("leads")
        .select("*")
        .order("updated_at", desc=True)
        .limit(100)
        .execute()
    )

    conversations = conversations_result.data or []
    leads = leads_result.data or []

    needs_human = [
        row for row in conversations
        if row.get("needs_human") is True
        or row.get("conversation_state") == "needs_human"
    ]

    lead_collection = [
        row for row in conversations
        if row.get("conversation_state") == "lead_collection"
    ]

    qualified_leads = [
        row for row in leads
        if row.get("is_qualified") is True
        or row.get("status") == "qualified"
        or row.get("lead_stage") == "qualified"
    ]

    recent_conversations = conversations[:30]

    return {
        "counts": {
            "needs_human": len(needs_human),
            "lead_collection": len(lead_collection),
            "qualified_leads": len(qualified_leads),
            "recent_conversations": len(recent_conversations),
            "total_leads": len(leads),
            "total_conversations": len(conversations),
        },
        "needs_human": needs_human[:30],
        "lead_collection": lead_collection[:30],
        "qualified_leads": qualified_leads[:30],
        "recent_conversations": recent_conversations,
    }