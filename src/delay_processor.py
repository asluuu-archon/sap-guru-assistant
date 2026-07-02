from datetime import datetime, timedelta
from .memory import supabase, build_context
from .assistant import suggest_reply
from .services.reply_service import send_reply


SAFE_FALLBACK_REPLY = "I will check this and update you."


def process_pending_replies():
    try:
        cutoff = datetime.utcnow() - timedelta(minutes=15)

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
            reply = suggest_reply(last_user_message, "instagram", context)

            reply_text = (reply.get("suggested_reply") or "").strip()

            if not reply_text:
                reply_text = SAFE_FALLBACK_REPLY

            if not reply_text.strip():
                print(f"DELAYED REPLY SKIPPED EMPTY TEXT FOR {sender_id}", flush=True)
                skipped_count += 1
                continue

            result = send_reply(
                               channel="instagram",
                               recipient_id=sender_id,
                               message=reply_text,
                     )

            print(f"DELAYED INSTAGRAM SEND RESULT: {result}", flush=True)

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