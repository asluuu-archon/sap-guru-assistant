"""
Delay Processor

Processes pending conversations and sends AI replies after a configurable delay.

The delay duration is read from the business_profile table per organisation,
so each client can configure their own preferred delay from the frontend.
Default fallback is 15 minutes if not configured.
"""

from datetime import datetime, timedelta

from .memory import supabase, build_context
from .assistant import suggest_reply
from .services.reply_service import send_reply


DEFAULT_DELAY_MINUTES = 15


def get_reply_delay_minutes(organization_id: int) -> int:
    """
    Reads the reply_delay_minutes setting from business_profile for the given org.
    Falls back to DEFAULT_DELAY_MINUTES if not set.
    """
    try:
        result = (
            supabase.table("business_profile")
            .select("reply_delay_minutes")
            .eq("organization_id", organization_id)
            .limit(1)
            .execute()
        )
        rows = result.data or []
        if rows and rows[0].get("reply_delay_minutes") is not None:
            delay = int(rows[0]["reply_delay_minutes"])
            return max(1, delay)  # Minimum 1 minute
    except Exception as e:
        print(f"DELAY_SETTINGS_ERROR: {e}", flush=True)

    return DEFAULT_DELAY_MINUTES


async def process_pending_replies():
    try:
        result = (
            supabase.table("conversations")
            .select("*")
            .eq("pending_reply", True)
            .eq("ai_replied", False)
            .eq("manual_replied", False)
            .execute()
        )

        rows = result.data or []
        sent_count = 0
        skipped_count = 0

        for conversation in rows:
            updated_at = conversation.get("updated_at")

            if not updated_at:
                skipped_count += 1
                continue

            # Get the organisation ID for this conversation (default to 1)
            organization_id = conversation.get("organization_id") or 1

            # Read the delay setting for this org from the database
            delay_minutes = get_reply_delay_minutes(organization_id)
            cutoff = datetime.utcnow() - timedelta(minutes=delay_minutes)

            updated_dt = datetime.fromisoformat(updated_at.replace("Z", ""))

            if updated_dt > cutoff:
                continue

            sender_id = conversation.get("sender_id")
            history = conversation.get("history") or []

            last_user_message = ""
            for item in reversed(history):
                if item.get("user"):
                    last_user_message = item.get("user")
                    break

            if not sender_id or not last_user_message:
                skipped_count += 1
                continue

            context = build_context(conversation)
            reply = await suggest_reply(last_user_message, "instagram", context)

            reply_text = (reply.get("suggested_reply") or "").strip()

            # Do NOT send a fallback "I will check" reply — skip instead
            # This prevents sending meaningless replies when AI has no good answer
            if not reply_text:
                print(f"DELAYED REPLY SKIPPED EMPTY AI REPLY FOR {sender_id}", flush=True)
                # CRITICAL FIX: Even if we skip the reply, we MUST clear the pending flag 
                # to prevent the cron job from looping on this lead forever.
                supabase.table("conversations").update({
                    "pending_reply": False,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("sender_id", sender_id).execute()
                skipped_count += 1
                continue

            send_result = send_reply(
                channel="instagram",
                recipient_id=sender_id,
                message=reply_text,
            )

            print(f"DELAYED SEND RESULT: {send_result}", flush=True)

            if send_result.get("status") == "error":
                skipped_count += 1
                print(f"DELAYED REPLY FAILED FOR {sender_id}", flush=True)
                continue

            history.append({
                "time": datetime.utcnow().isoformat(),
                "user": "",
                "assistant": reply_text,
                "category": reply.get("category", "general"),
            })

            history = history[-30:]

            supabase.table("conversations").update({
                "history": history,
                "last_reply": reply_text,
                "ai_replied": True,
                "pending_reply": False,
                "updated_at": datetime.utcnow().isoformat(),
            }).eq("sender_id", sender_id).execute()

            sent_count += 1
            print(f"DELAYED AUTO REPLY SENT TO {sender_id}", flush=True)

        return {
            "sent_count": sent_count,
            "skipped_count": skipped_count,
        }

    except Exception as e:
        print(f"DELAYED PROCESSOR ERROR: {e}", flush=True)
        return {"error": str(e)}
