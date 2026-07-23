from fastapi import FastAPI, Request, Query
from .services.follower_polling_service import poll_new_followers
import asyncio

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import re
import requests
from .api.playground_api import router as playground_router
from .api.dashboard_api import router as dashboard_router
from .api.business_api import router as business_router
from .api.conversation_api import router as conversation_router
from .api.suggest_api import router as suggest_router
from .api.business_brain_api import router as brain_router
from .api.settings_api import router as settings_router
from .api.leads_api import router as leads_router
from .api.overview_api import router as overview_router
from .api.debug_api import router as debug_router
from .api.customer_360_api import router as customer_360_router
from .api.reports_api import router as reports_router
from .api.automation_api import router as automation_router
from .api.businesses_api import router as businesses_router
from .api.integrations_api import router as integrations_router
from .api.notifications_api import router as notifications_router
from .api.whatsapp_api import router as whatsapp_router
from .api.publisher_api import router as publisher_router
from .api.google_reviews_api import router as google_reviews_router
from .api.hot_leads_api import router as hot_leads_router
from .api.lead_import_export_api import router as lead_import_export_router
from .api.website_chat_api import router as website_chat_router
from .api.whatsapp_broadcast_api import router as whatsapp_broadcast_router
from .api.briefing_api import router as briefing_router
from .api.appointment_api import router as appointment_router
from .api.campaign_context_api import router as campaign_context_router
from .api.auth_api import router as auth_router
from .api.follower_dm_api import router as follower_dm_router
from .api.instagram_oauth_api import router as instagram_oauth_router
from .services.webhook_service import process_instagram_webhook


from .assistant import suggest_reply
from .services.reply_service import send_reply
from .memory import (
    get_conversation,
    save_conversation,
    mark_manual_replied,
    mark_needs_human,
    mark_closed,
    supabase,
)
from .reply_bank import save_manual_reply_to_bank
from .leads import save_lead
from .delay_processor import process_pending_replies
from .pipeline.message_pipeline import process_incoming_message
from .playground import (
    save_playground_result,
    get_playground_history,
)


app = FastAPI(title="SAP Guru Assistant", version="pilot_3")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(dashboard_router)
app.include_router(playground_router)
app.include_router(business_router)
app.include_router(conversation_router)
app.include_router(suggest_router)
app.include_router(brain_router)
app.include_router(settings_router)
app.include_router(leads_router)
app.include_router(overview_router)
app.include_router(debug_router)
app.include_router(customer_360_router)
app.include_router(reports_router)
app.include_router(automation_router)
app.include_router(businesses_router)
app.include_router(integrations_router)
app.include_router(notifications_router)
app.include_router(whatsapp_router)
app.include_router(publisher_router)
app.include_router(google_reviews_router)
app.include_router(hot_leads_router)
app.include_router(lead_import_export_router)
app.include_router(website_chat_router)
app.include_router(whatsapp_broadcast_router)
app.include_router(briefing_router)
app.include_router(appointment_router)
app.include_router(campaign_context_router)
app.include_router(auth_router)
app.include_router(follower_dm_router)
app.include_router(instagram_oauth_router)

VERIFY_TOKEN = os.getenv("WEBHOOK_VERIFY_TOKEN", "sap_guru_2026")
AUTO_REPLY = os.getenv("AUTO_REPLY", "false").lower() == "true"

processed_message_ids = set()



@app.get("/health")
def health():
    return {"status": "ok", "auto_reply": AUTO_REPLY}


@app.get("/run-delayed-replies")
async def run_delayed_replies():
    return await process_pending_replies()



@app.get("/test-instagram-profile/{sender_id}")
def test_instagram_profile(sender_id: str):
    token = os.getenv("INSTAGRAM_ACCESS_TOKEN")

    if not token:
        return {"status": "error", "message": "INSTAGRAM_ACCESS_TOKEN missing"}

    r = requests.get(
        f"https://graph.instagram.com/v23.0/{sender_id}",
        params={
            "fields": "id,username,name",
            "access_token": token,
        },
        timeout=15,
    )

    return {
        "status_code": r.status_code,
        "response": r.json(),
    }

@app.get("/webhook")
def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return int(hub_challenge)

    return {"error": "Verification failed"}


def extract_phone(text: str) -> str:
    match = re.search(r"(\+?\d[\d\s\-]{8,}\d)", text or "")
    return match.group(1).strip() if match else ""


def extract_email(text: str) -> str:
    match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text or "")
    return match.group(0).strip() if match else ""


def is_closing_message(text: str) -> bool:
    lower = (text or "").lower().strip()

    closing_messages = {
        "ok", "okay", "oh ok", "oh okay", "okk",
        "ok bro", "ok brother", "ok sir", "okay sir",
        "sure", "fine", "good", "great",
        "tq", "ty", "got it", "understood", "noted",
        "no problem", "np", "👍", "🙏",
    }

    cleaned = lower.replace(".", "").replace("!", "").strip()
    return lower in closing_messages or cleaned in closing_messages


def detect_lead_intent(text: str, reply: dict) -> bool:
    lower = (text or "").lower().strip()

    weak_messages = {
        "hi", "hii", "hello", "hey", "ok", "okay",
        "yes", "no", "thanks", "thank you", "sure",
        "fine", "good", "great", "noted", "done",
        "welcome", "oh its ok", "oh it's ok",
    }

    if lower in weak_messages:
        return False

    if extract_phone(text) or extract_email(text):
        return True

    strong_lead_phrases = [
        "want to learn", "interested in learning", "learn sap",
        "how to learn sap", "want to join", "course details",
        "fee details", "fees", "online class", "offline class",
        "contact me", "call me", "internship", "mentorship",
        "career guidance", "placement support",
    ]

    if any(phrase in lower for phrase in strong_lead_phrases):
        return True

    return reply.get("should_capture_contact") is True


def save_possible_lead(sender_id: str, message_text: str, reply: dict, category: str):
    if not detect_lead_intent(message_text, reply):
        return

    save_lead(
        sender_id=sender_id,
        phone=extract_phone(message_text),
        email=extract_email(message_text),
        interested_module=category,
        notes=message_text,
    )


def should_ignore_manual_reply(manual_reply_text: str) -> bool:
    text = (manual_reply_text or "").lower().strip()

    junk_replies = [
        "please send your question as text",
        "i can reply properly",
        "i will check and update",
    ]

    short_replies = {
        "",
        "ok",
        "okay",
        "thanks",
        "thank you",
        "sure",
        "noted",
    }

    return text in short_replies or any(junk in text for junk in junk_replies)


def _get_business_id_from_ig(ig_id: str) -> str:
    """Find the business ID associated with this Instagram Page/Account ID."""
    try:
        from .memory import supabase
        res = supabase.table("business_integrations").select("business_id, credentials").eq("provider", "instagram").execute()
        for row in res.data or []:
            creds = row.get("credentials") or {}
            if str(creds.get("instagram_account_id")) == str(ig_id) or str(creds.get("page_id")) == str(ig_id):
                return row["business_id"]
    except Exception as e:
        print(f"Error looking up business ID: {e}", flush=True)
    return None

@app.post("/webhook")
async def receive_webhook(request: Request):
    data = await request.json()
    service_preview = await process_instagram_webhook(data)
    print(f"WEBHOOK_SERVICE_PREVIEW: {service_preview.get('status')}", flush=True)

    print("========== WEBHOOK ==========", flush=True)
    print(data, flush=True)

    try:
        entry = data.get("entry", [{}])[0]

        # ── Follow event detection ──────────────────────────────────────────
        from .services.follower_dm_service import (
            is_follow_event, extract_follow_sender, handle_new_follower, handle_follower_reply
        )

        # Check for follow events in changes (subscriptions format)
        if "changes" in entry:
            for change in entry.get("changes", []):
                val = change.get("value", {})
                if val.get("item") == "follow" and val.get("verb") == "add":
                    follower_id = str(val.get("sender_id") or val.get("from", {}).get("id", ""))
                    if follower_id:
                        print(f"FOLLOW_EVENT: New follower {follower_id}", flush=True)
                        ig_id = entry.get('id', '')
                        biz_id = _get_business_id_from_ig(ig_id)
                        await handle_new_follower(sender_id=follower_id, business_id=biz_id)
                        return {"status": "follow_dm_sent"}

        if "messaging" not in entry:
            print("Ignoring non-DM webhook", flush=True)
            return {"status": "ignored_non_dm"}

        messaging = entry["messaging"][0]

        # Check for follow event in messaging format
        if "follow" in messaging:
            follower_id = str(messaging["sender"]["id"])
            print(f"FOLLOW_EVENT (messaging): New follower {follower_id}", flush=True)
            ig_id = entry.get('id', '')
            biz_id = _get_business_id_from_ig(ig_id)
            await handle_new_follower(sender_id=follower_id, business_id=biz_id)
            return {"status": "follow_dm_sent"}

        if "message" not in messaging:
            print("Ignoring non-message event", flush=True)
            return {"status": "ignored_non_message"}

        sender_id = messaging["sender"]["id"]
        recipient_id = messaging["recipient"]["id"]
        message = messaging.get("message", {})

        if message.get("is_echo"):
            manual_reply_text = message.get("text", "")
            target_user_id = recipient_id

            pipeline_result = await process_incoming_message(
                organization_id=1,
                channel="instagram",
                sender_id=sender_id,
                message_text=manual_reply_text,
                raw_payload=messaging,
            )

            print(f"PIPELINE_LOGS: {pipeline_result.get('logs')}", flush=True)

            if should_ignore_manual_reply(manual_reply_text):
                print("Manual echo ignored for learning, but clearing pending flag.", flush=True)
                # CRITICAL FIX: Even if we ignore the reply for "learning", we MUST clear the pending flag
                # so the AI doesn't reply after Mohamed has already sent a short/manual message.
                mark_manual_replied(target_user_id, manual_reply_text)
                return {"status": "manual_reply_ignored"}

            conversation = get_conversation(target_user_id)
            history = conversation.get("history") or []

            last_user_message = ""
            for item in reversed(history):
                if item.get("user"):
                    last_user_message = item.get("user")
                    break

            if last_user_message and manual_reply_text:
                save_manual_reply_to_bank(
                    user_question=last_user_message,
                    sap_guru_reply=manual_reply_text,
                    category="manual",
                    tags="manual_reply",
                )

                mark_manual_replied(target_user_id, manual_reply_text)
                print("MANUAL REPLY LEARNED", flush=True)
            else:
                print("Manual echo found but no matching user message", flush=True)

            return {"status": "manual_reply_learned"}

        message_id = message.get("mid")
        message_text = message.get("text") or ""

        # VOICE NOTE DETECTION
        attachments = message.get("attachments", [])
        for attachment in attachments:
            if attachment.get("type") == "audio":
                audio_url = attachment.get("payload", {}).get("url")
                if audio_url:
                    print(f"VOICE_NOTE_DETECTED: {audio_url}", flush=True)
                    from .services.voice_transcriber import transcribe_voice_note
                    transcribed_text = transcribe_voice_note(audio_url)
                    if transcribed_text:
                        # Append transcription to message text so the AI can read it
                        message_text = (message_text + " " + transcribed_text).strip()
                        print(f"VOICE_NOTE_TRANSCRIBED: {message_text}", flush=True)

        # ── FOLLOWER DM REPLY ROUTING ─────────────────────────────────────────
        # If this sender is in an active follower DM flow, handle it there
        # instead of the main AI pipeline.
        if message_text and not message.get("is_echo"):
            ig_id = entry.get('id', '')
            biz_id = _get_business_id_from_ig(ig_id)
            follower_result = await handle_follower_reply(
                sender_id=sender_id,
                message_text=message_text,
                business_id=biz_id,
            )
            if follower_result.get("handled"):
                print(f"FOLLOWER_DM: Handled reply from {sender_id}, intent={follower_result.get('intent')}", flush=True)
                return {"status": "follower_dm_handled", "intent": follower_result.get("intent")}
        # ─────────────────────────────────────────────────────────────────────

        # ── KEEP HUMAN / CLOSED GUARD ────────────────────────────────────────
        # If this conversation is already marked needs_human or closed,
        # do NOT run the AI pipeline. Save the message and stay silent.
        existing_conv = get_conversation(sender_id)
        existing_state = existing_conv.get("conversation_state", "")
        existing_needs_human = existing_conv.get("needs_human", False)

        if existing_needs_human or existing_state in ("needs_human", "closed", "keep_human"):
            print(f"KEEP_HUMAN_GUARD: Skipping AI for {sender_id} (state={existing_state}, needs_human={existing_needs_human})", flush=True)
            save_conversation(sender_id, message_text, "", existing_state or "needs_human")
            return {
                "status": "keep_human_active",
                "reason": "Conversation is marked for human handling — AI skipped.",
                "sender_id": sender_id,
            }
        # ─────────────────────────────────────────────────────────────────────

        pipeline_result = await process_incoming_message(
            organization_id=1,
            channel="instagram",
            sender_id=sender_id,
            message_text=message_text,
            raw_payload=messaging,
        )

        customer = pipeline_result.get("customer") or {}
        pipeline_reply = pipeline_result.get("reply") or {}
        decision = pipeline_reply.get("decision") or {}

        reply_text = pipeline_reply.get("reply_text", "")
        category = pipeline_reply.get("category", "general")
        should_reply = pipeline_reply.get("should_reply", False)
        action = pipeline_reply.get("action", "human")

        print(f"CUSTOMER_ID: {customer.get('id')}", flush=True)
        print(f"PIPELINE_LOGS: {pipeline_result.get('logs')}", flush=True)

        if not message_id:
            print("No message ID found. Skipping.", flush=True)
            return {"status": "ignored"}

        if message_id in processed_message_ids:
            print(f"Duplicate ignored: {message_id}", flush=True)
            return {"status": "duplicate_ignored"}

        processed_message_ids.add(message_id)

        if not message_text:
            print("Non-text message received. Staying silent.", flush=True)
            mark_needs_human(sender_id, "Non-text message received.")
            return {"status": "non_text_needs_human"}

        if is_closing_message(message_text):
            print("Closing message received. Staying silent.", flush=True)
            mark_closed(sender_id, "Closing message received.")
            return {"status": "closing_message_ignored"}

        print(f"SENDER: {sender_id}", flush=True)
        print(f"MESSAGE: {message_text}", flush=True)
        print(f"ACTION: {action}", flush=True)
        print(f"REPLY: {reply_text}", flush=True)
        print(f"SHOULD_REPLY: {should_reply}", flush=True)

        if action == "human" or should_reply is False or not reply_text:
            reason = decision.get("reason", "Low confidence or unclear message.")
            print(f"NEEDS HUMAN: {reason}", flush=True)

            # Save the conversation so the inbox shows this message
            # Mark as pending_reply=True so the delay processor can attempt a reply later
            save_conversation(sender_id, message_text, "", "needs_human")
            mark_needs_human(sender_id, reason)

            return {
                "status": "needs_human",
                "reason": reason,
                "auto_reply": False,
            }

        save_conversation(sender_id, message_text, reply_text, category)

        save_possible_lead(
            sender_id=sender_id,
            message_text=message_text,
            reply=pipeline_reply.get("generated_reply") or pipeline_reply,
            category=category,
        )

        if AUTO_REPLY:
            # Resolve per-business Instagram token if available
            ig_access_token = None
            try:
                ig_biz_id = _get_business_id_from_ig(recipient_id)
                if ig_biz_id:
                    from .api.integrations_api import get_business_credentials
                    ig_creds = get_business_credentials(ig_biz_id, "instagram")
                    ig_access_token = ig_creds.get("page_access_token")
            except Exception as tok_err:
                print(f"TOKEN_LOOKUP_ERROR: {tok_err}", flush=True)
            result = send_reply(
                 channel="instagram",
                 recipient_id=sender_id,
                 message=reply_text,
                 access_token=ig_access_token,
            )

            print(f"AUTO REPLY SENT: {result}", flush=True)
        else:
            print("AUTO REPLY DISABLED", flush=True)
            print(f"WOULD HAVE SENT: {reply_text}", flush=True)

        return {"status": "received", "auto_reply": AUTO_REPLY}

     

    except Exception as e:
        print(f"ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}

# Background task for polling followers
async def follower_polling_task():
    while True:
        try:
            await poll_new_followers()
        except Exception as e:
            print(f"Error in follower polling task: {e}", flush=True)
        # Sleep for 15 minutes (900 seconds)
        await asyncio.sleep(900)

@app.on_event("startup")
async def startup_event():
    # Start the background task
    asyncio.create_task(follower_polling_task())
