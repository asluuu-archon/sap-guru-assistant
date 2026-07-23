"""
Follower DM Service
===================
Handles the full smart auto-DM flow when a new user follows the Instagram page.

Flow:
  1. Instagram sends a "follow" webhook event
  2. We fetch the follower's username/name from the Graph API
  3. Send a warm welcome DM asking their intent
  4. When they reply, detect intent via AI:
       - job_support   → send WhatsApp group link from settings
       - training      → ask for contact details (phone/email)
       - content       → acknowledge and engage
       - other         → smart AI-generated reply
  5. If training intent + contact captured → save as lead

Settings are stored per-business in business_profile under follower_dm_settings:
  {
    "enabled": true,
    "welcome_message": "Hi {name}! ...",
    "whatsapp_group_link": "https://chat.whatsapp.com/...",
    "business_context": "SAP training and career support"
  }
"""

import os
import re
import json
import requests
from datetime import datetime
from typing import Optional


# ── Supabase helper ──────────────────────────────────────────────────────────

def _supabase():
    from src.memory import supabase
    return supabase


# ── Instagram Graph API helpers ──────────────────────────────────────────────

def _get_token(business_id: Optional[str] = None) -> str:
    """Get Instagram access token — from business_integrations or env fallback."""
    if business_id:
        try:
            sb = _supabase()
            res = sb.table("business_integrations") \
                .select("credentials, is_connected") \
                .eq("business_id", business_id) \
                .eq("provider", "instagram") \
                .execute()
            if res.data and res.data[0].get("is_connected"):
                creds = res.data[0].get("credentials") or {}
                token = creds.get("page_access_token")
                if token and not token.startswith("**"):
                    return token
        except Exception:
            pass
    return (
        os.getenv("META_PAGE_ACCESS_TOKEN") or
        os.getenv("INSTAGRAM_ACCESS_TOKEN") or ""
    )


def get_instagram_user_info(sender_id: str, token: str) -> dict:
    """Fetch follower's name and username from Instagram Graph API."""
    try:
        r = requests.get(
            f"https://graph.facebook.com/v23.0/{sender_id}",
            params={"fields": "id,name", "access_token": token},
            timeout=10,
        )
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        print(f"FOLLOWER_DM: Failed to fetch user info: {e}", flush=True)
    return {}


def send_instagram_dm(recipient_id: str, message: str, token: str) -> bool:
    """Send a DM via Instagram Graph API."""
    try:
        r = requests.post(
            "https://graph.facebook.com/v23.0/me/messages",
            json={
                "recipient": {"id": recipient_id},
                "message": {"text": message},
                "messaging_type": "MESSAGE_TAG",
                "tag": "HUMAN_AGENT",
            },
            params={"access_token": token},
            timeout=10,
        )
        if r.status_code == 200:
            print(f"FOLLOWER_DM: Sent DM to {recipient_id}", flush=True)
            return True
        else:
            # Fallback: try without tag (works for 24h window)
            r2 = requests.post(
                "https://graph.facebook.com/v23.0/me/messages",
                json={
                    "recipient": {"id": recipient_id},
                    "message": {"text": message},
                },
                params={"access_token": token},
                timeout=10,
            )
            print(f"FOLLOWER_DM: Fallback send status {r2.status_code}", flush=True)
            return r2.status_code == 200
    except Exception as e:
        print(f"FOLLOWER_DM: Send error: {e}", flush=True)
        return False


# ── Settings helpers ─────────────────────────────────────────────────────────

def get_follower_dm_settings(business_id: Optional[str]) -> dict:
    """Load follower DM settings from business_profile."""
    defaults = {
        "enabled": True,
        "welcome_message": (
            "Hi {name}! 👋 Thanks for following — really glad to have you here!\n\n"
            "I'm Mohamed Aslam, SAP Trainer & Career Coach. "
            "Just curious — what brought you here? 😊\n\n"
            "Are you:\n"
            "🔹 Looking for SAP training or career guidance?\n"
            "🔹 Searching for job support or placement help?\n"
            "🔹 Just exploring SAP content?\n\n"
            "Let me know and I'll point you in the right direction!"
        ),
        "whatsapp_group_link": "https://chat.whatsapp.com/",
        "business_context": "SAP ERP training, career guidance, and job placement support",
    }
    if not business_id:
        return defaults
    try:
        sb = _supabase()
        res = sb.table("business_profile") \
            .select("follower_dm_settings") \
            .eq("business_id", business_id) \
            .execute()
        if res.data and res.data[0].get("follower_dm_settings"):
            saved = res.data[0]["follower_dm_settings"]
            defaults.update(saved)
    except Exception as e:
        print(f"FOLLOWER_DM: Settings load error: {e}", flush=True)
    return defaults


# ── Conversation state helpers ────────────────────────────────────────────────

def _get_follower_state(sender_id: str) -> dict:
    """Get the current follower DM conversation state from Supabase."""
    try:
        sb = _supabase()
        res = sb.table("follower_dm_state") \
            .select("*") \
            .eq("sender_id", sender_id) \
            .execute()
        if res.data:
            return res.data[0]
    except Exception:
        pass
    return {}


def _save_follower_state(sender_id: str, state: dict):
    """Upsert the follower DM conversation state."""
    try:
        sb = _supabase()
        existing = _get_follower_state(sender_id)
        payload = {
            "sender_id": sender_id,
            "updated_at": datetime.utcnow().isoformat(),
            **state,
        }
        if existing.get("id"):
            sb.table("follower_dm_state").update(payload).eq("id", existing["id"]).execute()
        else:
            sb.table("follower_dm_state").insert(payload).execute()
    except Exception as e:
        print(f"FOLLOWER_DM: State save error: {e}", flush=True)


# ── Intent detection ─────────────────────────────────────────────────────────

INTENT_PROMPT = """You are an intent classifier for Instagram DMs.

A new follower replied to a welcome message from an SAP training and career coaching page.
Classify their reply into exactly ONE of these intents:

- job_support     : They are looking for job placement help, referrals, job openings, or career support
- training        : They want to learn SAP, join a course, know fees/batches, or get career guidance
- content         : They follow for content, tips, videos, or general SAP knowledge
- greeting_only   : Their reply is just a greeting (hi, hello, thanks, ok, 👍) with no clear intent
- other           : Any other reason not covered above

Reply with ONLY a JSON object like this (no explanation):
{"intent": "job_support", "confidence": "high", "summary": "User is looking for job placement"}

User message: "{message}"
"""


def detect_intent(message_text: str, business_context: str) -> dict:
    """Use OpenAI to detect the follower's intent from their reply."""
    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_API_BASE") or "https://api.openai.com/v1",
        )
        prompt = INTENT_PROMPT.replace("{message}", message_text[:500])
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=120,
        )
        raw = response.choices[0].message.content.strip()
        # Extract JSON even if wrapped in markdown
        json_match = re.search(r'\{.*\}', raw, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        print(f"FOLLOWER_DM: Intent detection error: {e}", flush=True)

    # Keyword fallback
    lower = message_text.lower()
    if any(w in lower for w in ["job", "placement", "opening", "referral", "work", "opportunity", "hiring"]):
        return {"intent": "job_support", "confidence": "low", "summary": "Keyword match: job"}
    if any(w in lower for w in ["learn", "course", "training", "fee", "batch", "join", "enroll", "sap"]):
        return {"intent": "training", "confidence": "low", "summary": "Keyword match: training"}
    if any(w in lower for w in ["content", "video", "tips", "post", "reel", "follow"]):
        return {"intent": "content", "confidence": "low", "summary": "Keyword match: content"}
    return {"intent": "other", "confidence": "low", "summary": "No clear intent"}


# ── Smart reply generator ─────────────────────────────────────────────────────

SMART_REPLY_PROMPT = """You are Mohamed Aslam, an SAP Trainer and Career Coach replying to an Instagram DM.

Context about your business: {business_context}

A new follower said: "{message}"
Their detected intent: {intent}
Conversation stage: {stage}

Write a warm, natural, conversational reply (2-4 sentences max).
- Do NOT sound like a bot or use generic templates
- Be friendly and personal, like a real mentor
- If intent is "other", engage genuinely with what they said

Reply with ONLY the message text, no quotes or labels.
"""


def generate_smart_reply(message_text: str, intent: str, stage: str, business_context: str) -> str:
    """Generate a contextual smart reply for non-standard intents."""
    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_API_BASE") or "https://api.openai.com/v1",
        )
        prompt = (SMART_REPLY_PROMPT
                  .replace("{business_context}", business_context)
                  .replace("{message}", message_text[:500])
                  .replace("{intent}", intent)
                  .replace("{stage}", stage))
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=200,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"FOLLOWER_DM: Smart reply error: {e}", flush=True)
        return "Thanks for reaching out! I'll get back to you shortly. 😊"


# ── Lead capture ──────────────────────────────────────────────────────────────

def _extract_phone(text: str) -> str:
    match = re.search(r"(\+?\d[\d\s\-]{8,}\d)", text or "")
    return match.group(1).strip() if match else ""


def _extract_email(text: str) -> str:
    match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text or "")
    return match.group(0).strip() if match else ""


def _save_lead_from_follower(sender_id: str, username: str, phone: str, email: str,
                              notes: str, business_id: Optional[str]):
    """Save a training prospect as a lead."""
    try:
        from src.leads import save_lead
        save_lead(
            sender_id=sender_id,
            phone=phone,
            email=email,
            interested_module="SAP Training (Follower DM)",
            notes=f"[New Follower] @{username} — {notes}",
            business_id=business_id,
        )
        print(f"FOLLOWER_DM: Lead saved for @{username}", flush=True)
    except Exception as e:
        print(f"FOLLOWER_DM: Lead save error: {e}", flush=True)


# ── Main entry points ─────────────────────────────────────────────────────────

async def handle_new_follower(sender_id: str, business_id: Optional[str] = None):
    """
    Called when a new follow event is received.
    Sends the welcome DM and initialises conversation state.
    """
    settings = get_follower_dm_settings(business_id)
    if not settings.get("enabled", True):
        print(f"FOLLOWER_DM: Disabled for business {business_id}", flush=True)
        return {"status": "disabled"}

    token = _get_token(business_id)
    if not token:
        print("FOLLOWER_DM: No Instagram token available", flush=True)
        return {"status": "no_token"}

    # Fetch follower info
    user_info = get_instagram_user_info(sender_id, token)
    name = user_info.get("name") or user_info.get("username") or "there"
    username = user_info.get("username") or sender_id

    # Build welcome message
    welcome = settings["welcome_message"].replace("{name}", name.split()[0])

    # Send it
    sent = send_instagram_dm(sender_id, welcome, token)

    # Save state
    _save_follower_state(sender_id, {
        "username": username,
        "name": name,
        "stage": "awaiting_intent",
        "business_id": business_id,
        "welcome_sent": sent,
        "intent": None,
        "contact_requested": False,
    })

    print(f"FOLLOWER_DM: Welcome sent to @{username} (sent={sent})", flush=True)
    return {"status": "welcome_sent", "username": username, "sent": sent}


async def handle_follower_reply(sender_id: str, message_text: str,
                                 business_id: Optional[str] = None) -> dict:
    """
    Called when a message arrives from someone in the follower DM flow.
    Returns {"handled": True/False, "reply_sent": True/False}
    """
    state = _get_follower_state(sender_id)
    if not state:
        return {"handled": False}  # Not in follower DM flow

    stage = state.get("stage", "awaiting_intent")
    username = state.get("username", "")
    name = state.get("name", "there")
    first_name = name.split()[0] if name else "there"
    stored_biz_id = state.get("business_id") or business_id

    settings = get_follower_dm_settings(stored_biz_id)
    token = _get_token(stored_biz_id)
    if not token:
        return {"handled": False}

    business_context = settings.get("business_context", "SAP training and career support")
    whatsapp_link = settings.get("whatsapp_group_link", "")

    # ── Stage: awaiting_intent ────────────────────────────────────────────────
    if stage == "awaiting_intent":
        intent_result = detect_intent(message_text, business_context)
        intent = intent_result.get("intent", "other")

        print(f"FOLLOWER_DM: @{username} intent={intent}", flush=True)

        if intent == "job_support":
            reply = (
                f"Got it {first_name}! 🙌 For job support, placement help, and referrals — "
                f"our WhatsApp community is the best place to be. "
                f"Lots of people there sharing openings and helping each other out.\n\n"
                f"Join here 👇\n{whatsapp_link}\n\n"
                f"Once you're in, introduce yourself and mention what module/experience you have. "
                f"The community will guide you! 💪"
            )
            _save_follower_state(sender_id, {**state, "stage": "completed", "intent": "job_support"})

        elif intent == "training":
            reply = (
                f"That's great {first_name}! 😊 SAP is a fantastic career choice right now.\n\n"
                f"To help you with the right batch and module, could you share:\n"
                f"📱 Your phone number or\n"
                f"📧 Your email address\n\n"
                f"I'll have someone from my team reach out with all the details — "
                f"fees, schedule, and what's best for your background!"
            )
            _save_follower_state(sender_id, {**state, "stage": "awaiting_contact", "intent": "training"})

        elif intent == "content":
            reply = (
                f"Awesome {first_name}! 🎉 Really glad you're here for the content.\n\n"
                f"I post regularly on SAP modules, career tips, and what's happening in the ERP world. "
                f"Feel free to drop questions anytime — happy to help!\n\n"
                f"Is there any specific SAP topic you'd love me to cover? 🤔"
            )
            _save_follower_state(sender_id, {**state, "stage": "engaged", "intent": "content"})

        elif intent == "greeting_only":
            reply = (
                f"Hey {first_name}! 😊 Welcome!\n\n"
                f"Just curious — what brings you to my page? "
                f"SAP learning, job search, or just exploring? "
                f"Happy to help with whatever you need! 🙌"
            )
            # Stay in awaiting_intent stage for one more round
            _save_follower_state(sender_id, {**state, "stage": "awaiting_intent_retry", "intent": None})

        else:  # "other"
            reply = generate_smart_reply(message_text, intent, stage, business_context)
            _save_follower_state(sender_id, {**state, "stage": "engaged", "intent": "other"})

        sent = send_instagram_dm(sender_id, reply, token)
        return {"handled": True, "reply_sent": sent, "intent": intent}

    # ── Stage: awaiting_intent_retry (after greeting-only) ───────────────────
    elif stage == "awaiting_intent_retry":
        intent_result = detect_intent(message_text, business_context)
        intent = intent_result.get("intent", "other")

        if intent == "job_support":
            reply = (
                f"Perfect! For job support, join our WhatsApp community 👇\n{whatsapp_link}\n\n"
                f"Lots of openings and referrals shared there daily! 💼"
            )
            _save_follower_state(sender_id, {**state, "stage": "completed", "intent": "job_support"})

        elif intent == "training":
            reply = (
                f"Great choice! 🎯 Share your phone number or email and "
                f"I'll get you all the details on batches and fees!"
            )
            _save_follower_state(sender_id, {**state, "stage": "awaiting_contact", "intent": "training"})

        else:
            reply = generate_smart_reply(message_text, intent, stage, business_context)
            _save_follower_state(sender_id, {**state, "stage": "engaged", "intent": intent})

        sent = send_instagram_dm(sender_id, reply, token)
        return {"handled": True, "reply_sent": sent, "intent": intent}

    # ── Stage: awaiting_contact (training prospect gave their details) ────────
    elif stage == "awaiting_contact":
        phone = _extract_phone(message_text)
        email = _extract_email(message_text)

        if phone or email:
            # Save as lead
            _save_lead_from_follower(
                sender_id=sender_id,
                username=username,
                phone=phone,
                email=email,
                notes=message_text,
                business_id=stored_biz_id,
            )
            reply = (
                f"Perfect {first_name}! ✅ Got your details.\n\n"
                f"Our team will reach out to you within 24 hours with the batch schedule, "
                f"fees, and everything you need to get started. "
                f"Really excited to have you on this SAP journey! 🚀"
            )
            _save_follower_state(sender_id, {**state, "stage": "completed", "contact_captured": True})
        else:
            # They replied but didn't share contact — nudge once more
            reply = (
                f"No worries {first_name}! Just drop your WhatsApp number or email "
                f"and I'll get you all the details. It's completely free to enquire! 😊"
            )
            # Mark contact_requested so we don't loop forever
            if state.get("contact_requested"):
                # Second nudge failed — gracefully exit
                reply = (
                    f"No problem at all! Whenever you're ready, just DM me your number "
                    f"and I'll share all the details. Have a great day! 🙏"
                )
                _save_follower_state(sender_id, {**state, "stage": "completed"})
            else:
                _save_follower_state(sender_id, {**state, "contact_requested": True})

        sent = send_instagram_dm(sender_id, reply, token)
        return {"handled": True, "reply_sent": sent, "intent": "training"}

    # ── Stage: engaged or completed — hand off to main AI pipeline ───────────
    else:
        return {"handled": False}  # Let normal DM pipeline handle it


# ── Webhook event detector ────────────────────────────────────────────────────

def is_follow_event(messaging: dict) -> bool:
    """
    Detect if a webhook messaging event is a new follow.
    Meta sends follow events in two ways:
      1. entry.changes[].value.item == "follow" (via Webhooks subscriptions)
      2. messaging[].follow event (older format)
    """
    # Format 1: changes-based
    changes = messaging.get("changes", [])
    for change in changes:
        val = change.get("value", {})
        if val.get("item") == "follow" and val.get("verb") == "add":
            return True

    # Format 2: direct follow field
    if "follow" in messaging:
        return True

    return False


def extract_follow_sender(entry: dict) -> Optional[str]:
    """Extract the sender_id from a follow event entry."""
    # Format 1: changes-based follow
    changes = entry.get("changes", [])
    for change in changes:
        val = change.get("value", {})
        if val.get("item") == "follow":
            sender = val.get("sender_id") or val.get("from", {}).get("id")
            if sender:
                return str(sender)

    # Format 2: messaging-based follow
    for msg in entry.get("messaging", []):
        if "follow" in msg:
            return str(msg["sender"]["id"])

    return None
