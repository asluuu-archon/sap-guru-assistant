from fastapi import FastAPI, Request, Query
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

VERIFY_TOKEN = "sap_guru_2026"
AUTO_REPLY = os.getenv("AUTO_REPLY", "false").lower() == "true"

processed_message_ids = set()



@app.get("/health")
def health():
    return {"status": "ok", "auto_reply": AUTO_REPLY}


@app.get("/run-delayed-replies")
def run_delayed_replies():
    return process_pending_replies()



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


@app.post("/webhook")
async def receive_webhook(request: Request):
    data = await request.json()
    service_preview = await process_instagram_webhook(data)
    print(f"WEBHOOK_SERVICE_PREVIEW: {service_preview.get('status')}", flush=True)

    print("========== WEBHOOK ==========", flush=True)
    print(data, flush=True)

    try:
        entry = data.get("entry", [{}])[0]

        if "messaging" not in entry:
            print("Ignoring non-DM webhook", flush=True)
            return {"status": "ignored_non_dm"}

        messaging = entry["messaging"][0]

        if "message" not in messaging:
            print("Ignoring non-message event", flush=True)
            return {"status": "ignored_non_message"}

        sender_id = messaging["sender"]["id"]
        recipient_id = messaging["recipient"]["id"]
        message = messaging.get("message", {})

        if message.get("is_echo"):
            manual_reply_text = message.get("text", "")
            target_user_id = recipient_id

            pipeline_result = process_incoming_message(
                organization_id=1,
                channel="instagram",
                sender_id=sender_id,
                message_text=manual_reply_text,
                raw_payload=messaging,
            )

            print(f"PIPELINE_LOGS: {pipeline_result.get('logs')}", flush=True)

            if should_ignore_manual_reply(manual_reply_text):
                print("Manual echo ignored. Not useful for learning.", flush=True)
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

        pipeline_result = process_incoming_message(
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
            result = send_reply(
                 channel="instagram",
                 recipient_id=sender_id,
                 message=reply_text,
            )

            print(f"AUTO REPLY SENT: {result}", flush=True)
        else:
            print("AUTO REPLY DISABLED", flush=True)
            print(f"WOULD HAVE SENT: {reply_text}", flush=True)

        return {"status": "received", "auto_reply": AUTO_REPLY}

     

    except Exception as e:
        print(f"ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}