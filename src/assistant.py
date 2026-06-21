import os
import json
import re
from pathlib import Path
from dotenv import load_dotenv
from .reply_bank import find_similar_replies

load_dotenv()

try:
    from openai import OpenAI
except Exception:
    OpenAI = None


ROOT = Path(__file__).resolve().parent.parent
SYSTEM_PROMPT = (ROOT / "knowledge" / "system_prompt.txt").read_text(encoding="utf-8")
KB = json.loads((ROOT / "knowledge" / "knowledge_base.json").read_text(encoding="utf-8"))


def _extract_name(message: str) -> str:
    patterns = [
        r"\bmy name is\s+([A-Za-z][A-Za-z ]{1,30})",
        r"\bthis is\s+([A-Za-z][A-Za-z ]{1,30})",
        r"\bi am\s+([A-Za-z][A-Za-z ]{1,30})",
        r"\bi'm\s+([A-Za-z][A-Za-z ]{1,30})",
    ]

    for pattern in patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            stop_words = ["bcom", "b tech", "btech", "mba", "sap", "from", "pursuing", "working"]
            words = name.split()
            clean_words = []
            for word in words:
                if word.lower() in stop_words:
                    break
                clean_words.append(word)
            if clean_words:
                return " ".join(clean_words).title()

    return ""


def _simple_fallback(message: str, context: str = "") -> dict:
    text = message.lower().strip()
    name = _extract_name(message)
    prefix = f"Hi {name}, " if name else ""

    if text in {"hi", "hello", "hey", "hello sir", "good morning", "good evening", "good afternoon"}:
        reply = "Hi, how are you doing? How can I help you?"
    elif "how are you" in text or "how you doing" in text:
        reply = "I'm good.. how are you?"
    elif "bcom" in text or "b.com" in text or "commerce" in text:
        reply = prefix + "SAP FICO will suit your commerce background. Are you looking for consultant level or end user level?"
    elif "btech" in text or "b.tech" in text or "it" in text:
        reply = prefix + "Since you are from IT background, SAP ABAP, RAP, CAP or BTP can be good options. Do you prefer coding side?"
    elif "job" in text or "opening" in text or "vacancy" in text:
        reply = "What is your current profile and experience?"
    elif "internship" in text or "training" in text or "course" in text:
        reply = "Please share your contact number, email and location. My office will get in touch with you."
    else:
        reply = "Can you explain a little more?"

    return {
        "category": "fallback",
        "lead_score": 20,
        "priority": "normal",
        "approval_status": "needs_review",
        "should_capture_contact": False,
        "reason": "Fallback used because OpenAI failed or was unavailable.",
        "suggested_reply": reply
    }


def _build_user_prompt(message: str, channel: str, context: str) -> str:
    detected_name = _extract_name(message)
    similar_replies = find_similar_replies(message, limit=5)

    payload = {
        "current_user_message": message,
        "detected_name_from_current_message": detected_name,
        "previous_conversation_context": context,
        "knowledge_base": KB,
        "similar_sap_guru_replies": similar_replies,
        "instruction": """
Reply as Mohamed Aslam / The SAP Guru in Instagram DM.

Use intelligence, not fixed scripts.

First check similar_sap_guru_replies. If there are relevant previous Mohamed Aslam replies, follow that style and reasoning.

Do not copy blindly. Use it as style and guidance.

Read the current message carefully. If the user already gave name, education, role, experience or interest, use it. Do not ask again.

If user gives name, naturally address them by name once.

If user asks multiple things in one message, answer briefly instead of asking profile again.

If user is clearly a learning/training lead, collect contact number, email and location naturally.

If user asks about career/module, guide based on available information.

If user asks something casual like "how are you", reply casually.

Avoid repeated questions.

Never reply with "Can you tell me your educational background and current role?" if education/current role is already available.

Return only valid JSON.
""",
        "required_json_format": {
            "category": "career_guidance | learning_lead | job_inquiry | greeting | personal | certification | general",
            "should_capture_contact": "true or false",
            "suggested_reply": "short natural Instagram DM reply"
        }
    }

    return json.dumps(payload, ensure_ascii=False)

def _normalize_output(data: dict, message: str, context: str) -> dict:
    reply = str(data.get("suggested_reply", "")).strip()

    bad_replies = [
        "can you tell me your educational background and current role",
        "can you explain what exactly you are looking for",
        "can you share a little more context",
    ]

    if not reply or any(bad in reply.lower() for bad in bad_replies):
        return _simple_fallback(message, context)

    if len(reply) > 500:
        reply = reply[:480].rsplit(" ", 1)[0] + "..."

    should_capture = bool(data.get("should_capture_contact", False))

    return {
        "category": data.get("category", "general"),
        "lead_score": 80 if should_capture else 30,
        "priority": "normal",
        "approval_status": "safe_to_send",
        "should_capture_contact": should_capture,
        "reason": "Generated by OpenAI using Mohamed Aslam persona, memory and knowledge base.",
        "suggested_reply": reply
    }


def suggest_reply(message: str, channel: str = "instagram", context: str = "") -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    if not api_key or OpenAI is None:
        return _simple_fallback(message, context)

    client = OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model=model,
            temperature=0.8,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(message, channel, context)}
            ],
            response_format={"type": "json_object"}
        )

        raw = response.choices[0].message.content
        data = json.loads(raw)

        return _normalize_output(data, message, context)

    except Exception as e:
        fallback = _simple_fallback(message, context)
        fallback["reason"] = f"OpenAI failed, fallback used: {e}"
        return fallback