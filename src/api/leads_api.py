"""
Leads API

Provides endpoints for lead actions from the dashboard:
- PATCH /leads/{lead_id}/qualify  — mark a lead as qualified
- GET  /leads/{sender_id}/summary — AI-generated conversation summary
"""

import os
from fastapi import APIRouter
from datetime import datetime
from openai import OpenAI

from ..memory import supabase

router = APIRouter()

ORGANIZATION_ID = 1


# ─── QUALIFY LEAD ────────────────────────────────────────────────────────────

@router.patch("/leads/{lead_id}/qualify")
def qualify_lead(lead_id: int):
    """
    Marks a lead as qualified and sets lead_stage = 'qualified'.
    Also upgrades temperature to 'hot' since a human has manually qualified them.
    """
    try:
        result = (
            supabase.table("leads")
            .update({
                "is_qualified": True,
                "status": "qualified",
                "lead_stage": "qualified",
                "temperature": "hot",
                "qualified_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            })
            .eq("id", lead_id)
            .execute()
        )

        if result.data:
            print(f"LEAD QUALIFIED: {lead_id}", flush=True)
            return {"status": "success", "lead": result.data[0]}

        return {"status": "error", "message": "Lead not found"}

    except Exception as e:
        print(f"LEAD QUALIFY ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}


# ─── AI CONVERSATION SUMMARY ─────────────────────────────────────────────────

def build_conversation_text(history: list) -> str:
    """
    Converts raw conversation history array into a readable text block
    for the AI to summarise.
    """
    lines = []
    for item in history:
        if item.get("user"):
            lines.append(f"Customer: {item['user']}")
        if item.get("assistant"):
            lines.append(f"AI: {item['assistant']}")
    return "\n".join(lines)


def generate_summary(conversation_text: str, lead_data: dict) -> dict:
    """
    Calls OpenAI to generate a structured summary of the conversation.
    Returns a dict with summary fields.
    """
    client = OpenAI()

    name = lead_data.get("name") or "this customer"
    module = lead_data.get("interested_module") or "unknown"
    phone = lead_data.get("phone") or "not provided"
    email = lead_data.get("email") or "not provided"

    system_prompt = """You are an AI assistant that reads customer conversations and produces a concise, structured summary for a sales team.

Your job is to extract the key facts and give a clear picture of where this lead stands.

Always respond in this exact JSON format:
{
  "one_liner": "One sentence summary of who this person is and what they want",
  "intent": "What the customer is looking for (e.g. SAP FICO training, job in Dubai, etc.)",
  "stage": "Where are they in the journey (e.g. just enquiring, ready to enroll, needs follow-up)",
  "key_facts": ["fact 1", "fact 2", "fact 3"],
  "recommended_action": "What the sales person should do next",
  "urgency": "low | medium | high"
}

Be concise. No fluff. Facts only. Max 2 sentences per field."""

    user_prompt = f"""Customer Name: {name}
Interested Module: {module}
Phone: {phone}
Email: {email}

Conversation:
{conversation_text}

Summarise this conversation for the sales team."""

    try:
        resp = client.chat.completions.create(
            model="gpt-5-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "conversation_summary",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "one_liner": {"type": "string"},
                            "intent": {"type": "string"},
                            "stage": {"type": "string"},
                            "key_facts": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "recommended_action": {"type": "string"},
                            "urgency": {"type": "string"},
                        },
                        "required": ["one_liner", "intent", "stage", "key_facts", "recommended_action", "urgency"],
                        "additionalProperties": False,
                    },
                },
            },
        )

        import json
        content = resp.choices[0].message.content
        return json.loads(content)

    except Exception as e:
        print(f"SUMMARY AI ERROR: {e}", flush=True)
        return {
            "one_liner": "Could not generate summary.",
            "intent": "Unknown",
            "stage": "Unknown",
            "key_facts": [],
            "recommended_action": "Review conversation manually.",
            "urgency": "low",
        }


@router.get("/leads/{sender_id}/summary")
def get_lead_summary(sender_id: str):
    """
    Fetches the conversation history for a sender_id and returns
    an AI-generated summary. Uses gpt-5-mini for speed and cost.
    """
    try:
        # Get lead data
        lead_result = (
            supabase.table("leads")
            .select("*")
            .eq("sender_id", sender_id)
            .order("id", desc=True)
            .limit(1)
            .execute()
        )
        lead_data = lead_result.data[0] if lead_result.data else {}

        # Get conversation history
        conv_result = (
            supabase.table("conversations")
            .select("history, updated_at, conversation_state")
            .eq("sender_id", sender_id)
            .order("updated_at", desc=True)
            .limit(1)
            .execute()
        )

        if not conv_result.data:
            return {
                "status": "no_conversation",
                "message": "No conversation found for this lead.",
                "summary": None,
            }

        conv = conv_result.data[0]
        history = conv.get("history") or []

        if not history:
            return {
                "status": "empty_conversation",
                "message": "Conversation exists but has no messages yet.",
                "summary": None,
            }

        # Build readable text from history (last 30 messages max)
        recent_history = history[-30:]
        conversation_text = build_conversation_text(recent_history)

        if not conversation_text.strip():
            return {
                "status": "empty_conversation",
                "message": "No readable messages found.",
                "summary": None,
            }

        # Generate AI summary
        summary = generate_summary(conversation_text, lead_data)

        return {
            "status": "success",
            "sender_id": sender_id,
            "message_count": len(history),
            "last_active": conv.get("updated_at"),
            "conversation_state": conv.get("conversation_state"),
            "summary": summary,
        }

    except Exception as e:
        print(f"LEAD SUMMARY ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}
