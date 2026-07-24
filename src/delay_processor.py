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
    NULL_UUID = "00000000-0000-0000-0000-000000000000"
    if not business_id or str(business_id) == NULL_UUID:
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
        print(f"DELAYED_PROCESSOR: Found {len(rows)} pending conversation(s)", flush=True)
        sent_count = 0
        skipped_count = 0

        for conversation in rows:
            sender_id_log = conversation.get("sender_id", "unknown")
            business_id_log = conversation.get("business_id", "")
            updated_at = conversation.get("updated_at")
            print(f"DELAYED_PROCESSOR: Checking sender={sender_id_log} business={business_id_log} updated_at={updated_at}", flush=True)

            if not updated_at:
                print(f"DELAYED_PROCESSOR: Skipping {sender_id_log} — no updated_at", flush=True)
                skipped_count += 1
                continue

            # Get the business_id (UUID) for this conversation
            business_id = conversation.get("business_id") or ""

            # Read the delay setting for this business from the database
            delay_minutes = get_reply_delay_minutes(business_id)
            print(f"DELAYED_PROCESSOR: delay_minutes={delay_minutes} for business={business_id}", flush=True)

            # If auto-reply is disabled for this business, skip
            if delay_minutes == -1:
                print(f"DELAYED REPLY SKIPPED: auto_reply_enabled=False for business {business_id}", flush=True)
                skipped_count += 1
                continue

            cutoff = datetime.utcnow() - timedelta(minutes=delay_minutes)
            updated_dt = datetime.fromisoformat(updated_at.replace("Z", ""))

            # Not enough time has passed yet — wait
            if updated_dt > cutoff:
                print(f"DELAYED_PROCESSOR: Too early for {sender_id_log} — updated={updated_at}, cutoff={cutoff.isoformat()}, delay={delay_minutes}min", flush=True)
                continue

            sender_id = conversation.get("sender_id")

            if not sender_id:
                skipped_count += 1
                continue

            # Use the pre-generated reply stored in last_reply — avoids re-generation
            # and prevents the "Last reply sent" context from confusing suggest_reply.
            reply_text = (conversation.get("last_reply") or "").strip()

            # Fallback: if last_reply is empty, re-generate from last user message
            if not reply_text:
                history_fb = conversation.get("history") or []
                last_user_message = ""
                for item in reversed(history_fb):
                    if item.get("user"):
                        last_user_message = item.get("user")
                        break
                if last_user_message:
                    context = build_context(conversation)
                    reply_gen = await suggest_reply(last_user_message, "instagram", context)
                    reply_text = (reply_gen.get("suggested_reply") or "").strip()
                    print(f"DELAYED_PROCESSOR: Re-generated reply for {sender_id}: {reply_text[:80]}", flush=True)

            # Do NOT send a fallback "I will check" reply — skip instead
            if not reply_text:
                print(f"DELAYED REPLY SKIPPED: Empty reply for {sender_id}", flush=True)
                supabase.table("conversations").update({
                    "pending_reply": False,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("sender_id", sender_id).execute()
                skipped_count += 1
                continue

            # Resolve the correct access token for this business's Instagram account
            ig_access_token = get_instagram_token_for_business(business_id)

            if not ig_access_token:
                print(f"DELAYED REPLY SKIPPED: No Instagram token for business {business_id}, sender {sender_id}", flush=True)
                skipped_count += 1
                continue

            print(f"DELAYED_PROCESSOR: Sending reply to {sender_id}: {reply_text[:80]}", flush=True)

            send_result = send_reply(
                channel="instagram",
                recipient_id=sender_id,
                message=reply_text,
                access_token=ig_access_token,
            )

            print(f"DELAYED SEND RESULT: {send_result}", flush=True)

            # send_reply() always wraps with status="sent" — check the inner result
            inner_result = send_result.get("result") or {}
            send_failed = (
                send_result.get("status") == "error"
                or inner_result.get("status") == "error"
                or "API Error" in str(inner_result.get("message", ""))
            )

            if send_failed:
                skipped_count += 1
                print(f"DELAYED REPLY FAILED FOR {sender_id}: {inner_result.get('message', '')[:120]}", flush=True)
                # Mark pending_reply=False so we don't retry forever on a bad token
                supabase.table("conversations").update({
                    "pending_reply": False,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("sender_id", sender_id).execute()
                continue

            # Update conversation history — use the history already in the conversation
            conv_history = conversation.get("history") or []
            conv_history.append({
                "time": datetime.utcnow().isoformat(),
                "user": "",
                "assistant": reply_text,
                "category": "general",
            })
            conv_history = conv_history[-30:]

            supabase.table("conversations").update({
                "history": conv_history,
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
