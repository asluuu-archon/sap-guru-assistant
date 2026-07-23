"""
Delay Processor

Processes pending conversations and sends AI replies after a configurable delay.

The delay duration is read from the business_profile table per business (UUID),
so each tenant can configure their own preferred delay from the frontend dashboard.
Default fallback is 15 minutes if not configured.

Multi-tenancy: each conversation stores a business_id (UUID). The processor
resolves the correct Instagram access token and reply delay per business.
"""

from datetime import datetime, timedelta

from .memory import supabase, build_context
from .assistant import suggest_reply
from .services.reply_service import send_reply


DEFAULT_DELAY_MINUTES = 15


def get_reply_delay_minutes(business_id: str) -> int:
    """
    Reads the reply_delay_minutes setting from business_profile for the given
    business UUID. Falls back to DEFAULT_DELAY_MINUTES if not set.
    """
    try:
        result = (
            supabase.table("business_profile")
            .select("reply_delay_minutes, auto_reply_enabled")
            .eq("business_id", business_id)
            .limit(1)
            .execute()
        )
        rows = result.data or []
        if rows:
            row = rows[0]
            # If auto_reply is explicitly disabled for this business, skip
            if row.get("auto_reply_enabled") is False:
                return -1  # Sentinel: auto-reply disabled for this business
            if row.get("reply_delay_minutes") is not None:
                delay = int(row["reply_delay_minutes"])
                return max(1, delay)  # Minimum 1 minute
    except Exception as e:
        print(f"DELAY_SETTINGS_ERROR: {e}", flush=True)

    return DEFAULT_DELAY_MINUTES


def get_instagram_token_for_business(business_id: str) -> str | None:
    """
    Resolves the Instagram access token for a given business UUID.
    Returns None if not found — the caller should skip sending.
    """
    if not business_id:
        return None
    try:
        res = (
            supabase.table("business_integrations")
            .select("credentials")
            .eq("business_id", business_id)
            .eq("provider", "instagram")
            .limit(1)
            .execute()
        )
        rows = res.data or []
        if rows:
            creds = rows[0].get("credentials") or {}
            return creds.get("page_access_token") or creds.get("access_token")
    except Exception as e:
        print(f"TOKEN_LOOKUP_ERROR: {e}", flush=True)
    return None


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

            # Get the business_id (UUID) for this conversation
            business_id = conversation.get("business_id") or ""

            # Read the delay setting for this business from the database
            delay_minutes = get_reply_delay_minutes(business_id)

            # If auto-reply is disabled for this business, skip silently
            if delay_minutes == -1:
                print(f"DELAYED REPLY SKIPPED: auto_reply_enabled=False for business {business_id}", flush=True)
                skipped_count += 1
                continue

            cutoff = datetime.utcnow() - timedelta(minutes=delay_minutes)
            updated_dt = datetime.fromisoformat(updated_at.replace("Z", ""))

            # Not enough time has passed yet — wait
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

            # Resolve the correct access token for this business's Instagram account
            ig_access_token = get_instagram_token_for_business(business_id)

            if not ig_access_token:
                print(f"DELAYED REPLY SKIPPED: No Instagram token for business {business_id}, sender {sender_id}", flush=True)
                skipped_count += 1
                continue

            context = build_context(conversation)
            reply = await suggest_reply(last_user_message, "instagram", context)

            reply_text = (reply.get("suggested_reply") or "").strip()

            # Do NOT send a fallback "I will check" reply — skip instead
            # This prevents sending meaningless replies when AI has no good answer
            if not reply_text:
                print(f"DELAYED REPLY SKIPPED EMPTY AI REPLY FOR {sender_id}", flush=True)
                # Clear the pending flag to prevent the cron job from looping forever
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
                access_token=ig_access_token,
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
            print(f"DELAYED AUTO REPLY SENT TO {sender_id} (business={business_id})", flush=True)

        return {
            "sent_count": sent_count,
            "skipped_count": skipped_count,
        }

    except Exception as e:
        print(f"DELAYED PROCESSOR ERROR: {e}", flush=True)
        return {"error": str(e)}
