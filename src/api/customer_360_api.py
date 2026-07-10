"""
Customer 360° API

Returns a complete customer profile combining lead data, conversation history,
AI-generated summary, and recommended next action.
Designed to be business-agnostic — works for any industry.
"""

from fastapi import APIRouter
from ..memory import supabase
import os
from openai import OpenAI

router = APIRouter()
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_API_BASE"),
)


@router.get("/customer/{sender_id}")
def get_customer_360(sender_id: str):
    """
    Returns the full 360° profile for a customer by sender_id.
    Combines lead record + conversation record + AI-generated profile summary.
    """
    try:
        # ── 1. Fetch lead record ──────────────────────────────────────────────
        lead_res = (
            supabase.table("leads")
            .select("*")
            .eq("sender_id", sender_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        lead = lead_res.data[0] if lead_res.data else None

        # ── 2. Fetch conversation record ──────────────────────────────────────
        conv_res = (
            supabase.table("conversations")
            .select("*")
            .eq("sender_id", sender_id)
            .limit(1)
            .execute()
        )
        conv = conv_res.data[0] if conv_res.data else None

        if not lead and not conv:
            return {"status": "not_found", "message": "No customer found with this sender_id"}

        # ── 3. Build display name and profile ─────────────────────────────────
        # Try name fields in priority order: name > customer_name > instagram_username > sender_id
        display_name = (
            (lead.get("name") if lead and lead.get("name") else None)
            or (lead.get("customer_name") if lead and lead.get("customer_name") else None)
            or (lead.get("instagram_username") if lead and lead.get("instagram_username") else None)
            or sender_id
        )
        instagram_username = (
            (lead.get("instagram_username") if lead else None)
            or sender_id
        )

        # ── 4. Build conversation history for AI summary ──────────────────────
        history = conv.get("history", []) if conv else []
        message_count = conv.get("message_count", 0) if conv else 0

        # ── 5. Generate AI profile summary ───────────────────────────────────
        ai_profile = None
        if history and len(history) > 0:
            try:
                # Build a compact conversation transcript
                transcript_lines = []
                for item in history[-20:]:  # last 20 exchanges max
                    if item.get("user"):
                        transcript_lines.append(f"Customer: {item['user']}")
                    if item.get("assistant"):
                        transcript_lines.append(f"AI: {item['assistant']}")
                transcript = "\n".join(transcript_lines)

                prompt = f"""You are a CRM analyst. Analyse this customer conversation and extract a structured profile.
Be concise and business-agnostic — this system works for any type of business.

Conversation:
{transcript}

Return a JSON object with these exact keys:
{{
  "one_liner": "One sentence describing who this customer is and what they want",
  "interest": "What product, service, or topic they are interested in",
  "intent": "Their primary intent (e.g. enquiry, purchase, support, comparison, etc.)",
  "stage": "Where they are in the buying journey (e.g. just browsing, actively considering, ready to buy, post-purchase)",
  "key_facts": ["fact 1", "fact 2", "fact 3"],
  "contact_info_shared": "What contact info they shared (phone, email, location, etc.) or 'None'",
  "sentiment": "positive / neutral / negative",
  "urgency": "high / medium / low",
  "recommended_action": "The single most important next action the business should take",
  "follow_up_message": "A short, personalised follow-up message the business could send to this customer"
}}

Return only valid JSON, no markdown."""

                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=600,
                )
                import json
                raw = response.choices[0].message.content.strip()
                # Strip markdown code fences if present
                if raw.startswith("```"):
                    raw = raw.split("```")[1]
                    if raw.startswith("json"):
                        raw = raw[4:]
                ai_profile = json.loads(raw.strip())
            except Exception as e:
                ai_profile = {"error": str(e)}

        # ── 6. Build timeline events ──────────────────────────────────────────
        timeline = []

        if conv and conv.get("first_message_at"):
            timeline.append({
                "event": "First message",
                "description": "Customer sent their first message",
                "timestamp": conv["first_message_at"],
                "type": "start",
            })

        if lead and lead.get("created_at"):
            timeline.append({
                "event": "Lead captured",
                "description": f"Lead record created · Temperature: {lead.get('temperature', 'cold')}",
                "timestamp": lead["created_at"],
                "type": "lead",
            })

        if lead and lead.get("is_qualified") and lead.get("qualified_at"):
            timeline.append({
                "event": "Qualified",
                "description": "Lead manually qualified by team",
                "timestamp": lead["qualified_at"],
                "type": "qualified",
            })

        if conv and conv.get("updated_at"):
            timeline.append({
                "event": "Last activity",
                "description": f"Last message · State: {conv.get('conversation_state', 'active')}",
                "timestamp": conv["updated_at"],
                "type": "activity",
            })

        # Sort timeline by timestamp
        timeline.sort(key=lambda x: x.get("timestamp") or "", reverse=False)

        # ── 7. Build the full 360° profile ────────────────────────────────────
        profile = {
            "status": "success",
            "sender_id": sender_id,
            "display_name": display_name,
            "instagram_username": instagram_username,

            # Identity
            "identity": {
                "name": (lead.get("name") or lead.get("customer_name") or lead.get("instagram_username")) if lead else None,
                "phone": lead.get("phone") if lead else None,
                "email": lead.get("email") if lead else None,
                "location": lead.get("location") if lead else None,
                "education": lead.get("education") if lead else None,
                "experience": lead.get("experience") if lead else None,
                "source": lead.get("source") if lead else "instagram",
            },

            # Lead data
            "lead": {
                "has_lead": lead is not None,
                "lead_id": lead.get("id") if lead else None,
                "temperature": lead.get("temperature") if lead else None,
                "lead_stage": lead.get("lead_stage") if lead else None,
                "status": lead.get("status") if lead else None,
                "is_qualified": lead.get("is_qualified", False) if lead else False,
                "qualified_at": lead.get("qualified_at") if lead else None,
                "interested_in": lead.get("interested_module") if lead else None,
                "mode": lead.get("mode") if lead else None,
                "lead_score": lead.get("customer_lead_score") if lead else None,
                "notes": lead.get("notes") if lead else None,
                "created_at": lead.get("created_at") if lead else None,
            },

            # Conversation data
            "conversation": {
                "has_conversation": conv is not None,
                "message_count": message_count,
                "conversation_state": conv.get("conversation_state") if conv else None,
                "needs_human": conv.get("needs_human", False) if conv else False,
                "human_reason": conv.get("human_reason") if conv else None,
                "ai_replied": conv.get("ai_replied", False) if conv else False,
                "manual_replied": conv.get("manual_replied", False) if conv else False,
                "pending_reply": conv.get("pending_reply", False) if conv else False,
                "last_message": conv.get("last_message") if conv else None,
                "last_sender": conv.get("last_sender") if conv else None,
                "first_message_at": conv.get("first_message_at") if conv else None,
                "last_active": conv.get("updated_at") if conv else None,
                "ai_summary": conv.get("summary") if conv else None,
                "history": history,
            },

            # AI-generated profile
            "ai_profile": ai_profile,

            # Timeline
            "timeline": timeline,
        }

        return profile

    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc(),
        }


@router.get("/customers/search")
def search_customers(q: str = "", limit: int = 20):
    """
    Search customers by name, phone, email, or sender_id.
    Returns a lightweight list for the search/browse UI.
    """
    try:
        query = supabase.table("leads").select("*")

        if q:
            # Supabase ilike search on name
            query = query.ilike("name", f"%{q}%")

        res = query.order("updated_at", desc=True).limit(limit).execute()

        customers = []
        for row in (res.data or []):
            customers.append({
                "sender_id": row.get("sender_id"),
                "name": row.get("name") or row.get("customer_name") or row.get("instagram_username") or row.get("sender_id"),
                "phone": row.get("phone"),
                "email": row.get("email"),
                "location": row.get("location"),
                "temperature": row.get("temperature"),
                "lead_stage": row.get("lead_stage"),
                "status": row.get("status"),
                "is_qualified": row.get("is_qualified", False),
                "interested_in": row.get("interested_module"),
                "instagram_username": row.get("instagram_username"),
                "updated_at": row.get("updated_at"),
            })

        return {"status": "success", "customers": customers, "total": len(customers)}

    except Exception as e:
        return {"status": "error", "message": str(e), "customers": []}
