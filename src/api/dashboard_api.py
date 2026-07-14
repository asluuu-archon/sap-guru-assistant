from fastapi import APIRouter

from ..memory import supabase

router = APIRouter()


def build_customer_lookup():
    customers_result = (
        supabase.table("customers")
        .select("*")
        .execute()
    )

    customers = customers_result.data or []
    lookup = {}

    for customer in customers:
        attributes = customer.get("attributes") or {}

        lookup[customer["channel_user_id"]] = {
            "customer_name": customer.get("name") or "",
            "instagram_username": attributes.get("instagram_username", ""),
            "profile_pic": attributes.get("profile_pic", ""),
            "customer_status": customer.get("status", ""),
            "lead_score": customer.get("lead_score", 0),
            "lead_temperature": customer.get("lead_temperature", ""),
        }

    return lookup


def enrich_with_customer_profile(row: dict, customer_lookup: dict) -> dict:
    customer = customer_lookup.get(row.get("sender_id"), {})

    row["customer_name"] = customer.get("customer_name") or row.get("name") or ""
    row["instagram_username"] = customer.get("instagram_username") or row.get("instagram_username") or ""
    row["profile_pic"] = customer.get("profile_pic", "")
    row["customer_status"] = customer.get("customer_status", "")
    row["customer_lead_score"] = customer.get("lead_score", 0)
    row["customer_lead_temperature"] = customer.get("lead_temperature", "")

    return row


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

    customer_lookup = build_customer_lookup()

    enriched_conversations = [
        enrich_with_customer_profile(conversation, customer_lookup)
        for conversation in conversations
    ]

    enriched_leads = [
        enrich_with_customer_profile(lead, customer_lookup)
        for lead in leads
    ]

    needs_human = [
        row
        for row in enriched_conversations
        if row.get("needs_human") is True
        or row.get("conversation_state") == "needs_human"
    ]

    lead_collection = [
        row
        for row in enriched_conversations
        if row.get("conversation_state") == "lead_collection"
    ]

    qualified_leads = [
        row
        for row in enriched_leads
        if row.get("is_qualified") is True
        or row.get("status") == "qualified"
        or row.get("lead_stage") == "qualified"
    ]

    recent_conversations = enriched_conversations[:30]

    return {
        "counts": {
            "needs_human": len(needs_human),
            "lead_collection": len(lead_collection),
            "qualified_leads": len(qualified_leads),
            "recent_conversations": len(recent_conversations),
            "total_leads": len(enriched_leads),
            "total_conversations": len(enriched_conversations),
        },
        "needs_human": needs_human[:30],
        "lead_collection": lead_collection[:30],
        "qualified_leads": qualified_leads[:30],
        "recent_conversations": recent_conversations,
    }


@router.get("/all-leads")
def all_leads():
    leads_result = (
        supabase.table("leads")
        .select("*")
        .order("updated_at", desc=True)
        .limit(500)
        .execute()
    )

    leads = leads_result.data or []
    customer_lookup = build_customer_lookup()

    enriched = [
        enrich_with_customer_profile(lead, customer_lookup)
        for lead in leads
    ]

    return {
        "status": "success",
        "total": len(enriched),
        "leads": enriched,
    }