import os
import json
import re
from pathlib import Path
from dotenv import load_dotenv
from .reply_bank import find_similar_replies
from .engine.intent import detect_intent

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
            stop_words = [
                "bcom", "b", "btech", "b.tech", "mba", "sap",
                "from", "pursuing", "working", "completed"
            ]

            words = name.split()
            clean_words = []

            for word in words:
                if word.lower().strip(".,") in stop_words:
                    break
                clean_words.append(word)

            if clean_words:
                return " ".join(clean_words).title()

    return ""


def _should_stay_silent(message: str) -> bool:
    text = message.lower().strip()

    very_short_unclear = {
        "athe", "athe sathyam", "sathyam", "correct", "true",
        "yes true", "yeah true", "same", "exactly", "👍", "🙏"
    }

    if text in very_short_unclear:
        return True

    if len(text.split()) <= 2 and not any(x in text for x in ["sap", "job", "learn", "course", "number", "email"]):
        return True

    return False


def _human_review(reason: str = "Low confidence or unclear message") -> dict:
    return {
        "category": "needs_human",
        "lead_score": 0,
        "priority": "normal",
        "approval_status": "needs_human",
        "should_capture_contact": False,
        "should_reply": False,
        "human_reason": reason,
        "reason": reason,
        "suggested_reply": "",
    }


def _is_clear_learning_lead(message: str) -> bool:
    lower = message.lower()

    lead_phrases = [
        "want to learn",
        "i want to learn",
        "interested in learning",
        "i am interested in learning",
        "i'm interested in learning",
        "need to learn",
        "learn sap",
        "sap course",
        "course details",
        "fees",
        "fee details",
        "join",
        "want to join",
        "offline class",
        "online class",
        "classes",
        "mentorship",
        "internship",
        "career guidance",
        "placement support",
    ]

    if any(phrase in lower for phrase in lead_phrases):
        return True

    module_words = [
        "sap mm", "sap fico", "sap sd", "sap abap", "sap hcm",
        "successfactors", "sap ewm", "sap btp", "sap sac",
        "sap datasphere", "sap basis", "sap security"
    ]

    return any(module in lower for module in module_words) and any(
        word in lower for word in ["learn", "interested", "join", "course"]
    )


def _learning_lead_reply(message: str) -> dict:
    lower = message.lower()

    module_name = ""
    module_map = {
        "sap mm": "MM",
        "sap fico": "FICO",
        "sap sd": "SD",
        "sap abap": "ABAP",
        "sap hcm": "HCM",
        "successfactors": "SuccessFactors",
        "sap ewm": "EWM",
        "sap btp": "BTP",
        "sap sac": "SAC",
        "sap datasphere": "Datasphere",
        "sap basis": "Basis",
        "sap security": "Security",
    }

    for key, value in module_map.items():
        if key in lower:
            module_name = value
            break

    if module_name:
        reply = (
            f"{module_name} is a good choice.. please share your name, contact number, "
            "location and whether you prefer online or offline. My office will contact you."
        )
    else:
        reply = (
            "Sure.. please share your name, contact number, location and whether you prefer "
            "online or offline. My office will contact you."
        )

    return {
        "category": "learning_lead",
        "lead_score": 90,
        "priority": "high",
        "approval_status": "safe_to_send",
        "should_capture_contact": True,
        "should_reply": True,
        "human_reason": "",
        "reason": "Clear learning enquiry.",
        "suggested_reply": reply,
    }


def _simple_fallback(message: str, context: str = "") -> dict:
    text = message.lower().strip()
    name = _extract_name(message)
    prefix = f"Hi {name}, " if name else ""

    if _should_stay_silent(message):
        return _human_review("Short or unclear message. Better for Mohamed to review.")

    if text in {"hi", "hello", "hey", "hello sir", "good morning", "good evening", "good afternoon"}:
        reply = "Hi, how are you doing? How can I help you?"
    elif "how are you" in text or "how you doing" in text:
        reply = "I'm good.. how are you?"
    elif "bcom" in text or "b.com" in text or "commerce" in text:
        reply = prefix + "SAP FICO will suit your commerce background. Are you looking for consultant level or end user level?"
    elif "btech" in text or "b.tech" in text:
        reply = prefix + "Since you are from IT background, SAP ABAP, RAP, CAP or BTP can be good options. Do you prefer coding side?"
    elif "job" in text or "opening" in text or "vacancy" in text:
        reply = "What is your current profile and experience?"
    elif _is_clear_learning_lead(message):
        return _learning_lead_reply(message)
    else:
        return _human_review("Fallback could not understand the message confidently.")

    return {
        "category": "fallback",
        "lead_score": 20,
        "priority": "normal",
        "approval_status": "safe_to_send",
        "should_capture_contact": False,
        "should_reply": True,
        "human_reason": "",
        "reason": "Fallback reply used.",
        "suggested_reply": reply,
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

If the message is unclear, too short, regional-language slang you are not sure about, or you are not confident about the intent, do not reply.

In such cases return:
{
  "should_reply": false,
  "human_reason": "Unclear message or low confidence"
}

Never force a reply.

Never ask vague questions like:
- Can you share a bit more detail?
- Can you explain a little more?
- Can you share more context?

Do not use "I will check and update" as a filler unless the user is asking about a job or opportunity that genuinely needs checking.

If user clearly says they want to learn SAP, join, get course details, fees, online/offline sessions, mentorship, internship, or learning support, treat it as a learning lead. Ask for name, contact number, location and preferred mode. Do not use the word training.

If user asks about career/module, guide based on available information.

If user asks something casual like "how are you", reply casually.

Return only valid JSON.
""",
        "required_json_format": {
            "category": "career_guidance | learning_lead | job_inquiry | greeting | personal | certification | general | needs_human",
            "should_capture_contact": "true or false",
            "should_reply": "true or false",
            "human_reason": "reason if should_reply is false",
            "suggested_reply": "short natural Instagram DM reply or empty string",
        },
    }

    return json.dumps(payload, ensure_ascii=False)


def _normalize_output(data: dict, message: str, context: str) -> dict:
    should_reply = data.get("should_reply", True)

    if should_reply is False:
        return _human_review(data.get("human_reason", "OpenAI marked this as low confidence."))

    reply = str(data.get("suggested_reply", "")).strip()

    last_reply = ""
    if "Last reply sent:" in context:
        last_reply = context.split("Last reply sent:", 1)[1].split("\n", 1)[0].strip()

    bad_replies = [
        "can you tell me your educational background and current role",
        "can you explain what exactly you are looking for",
        "can you share a little more context",
        "can you share a bit more detail",
        "can you explain a little more",
        "can you share more details",
        "can you share more context",
        "hello sathyam",
        "hi sathyam",
    ]

    if not reply:
        return _human_review("Empty reply from OpenAI.")

    if any(bad in reply.lower() for bad in bad_replies):
        return _human_review("Bad or vague reply detected.")

    if last_reply and reply.lower().strip() == last_reply.lower().strip():
        return _human_review("Duplicate reply detected.")

    if len(reply) > 500:
        reply = reply[:480].rsplit(" ", 1)[0] + "..."

    should_capture = bool(data.get("should_capture_contact", False))

    return {
        "category": data.get("category", "general"),
        "lead_score": 80 if should_capture else 30,
        "priority": "normal",
        "approval_status": "safe_to_send",
        "should_capture_contact": should_capture,
        "should_reply": True,
        "human_reason": "",
        "reason": "Generated by OpenAI using persona, memory and knowledge base.",
        "suggested_reply": reply,
    }


def suggest_reply(message: str, channel: str = "instagram", context: str = "") -> dict:
    intent = detect_intent(message)
    print(f"INTENT: {intent.get('intent')}", flush=True)
    print(f"INTENT_CONFIDENCE: {intent.get('confidence')}", flush=True)
    print(f"INTENT_REASON: {intent.get('reason')}", flush=True)




    if intent.get("intent") == "greeting":
        return {
            "category": "greeting",
            "lead_score": 0,
            "priority": "normal",
            "approval_status": "safe_to_send",
            "should_capture_contact": False,
            "should_reply": True,
            "human_reason": "",
            "reason": intent.get("reason", "Greeting detected"),
            "suggested_reply": "Hi, how are you doing? How can I help you?",
        }

    if intent.get("intent") == "lead_information":
        return {
            "category": "lead_information",
            "lead_score": 90,
            "priority": "high",
            "approval_status": "safe_to_send",
            "should_capture_contact": True,
            "should_reply": True,
            "human_reason": "",
            "reason": intent.get("reason", "Lead contact information detected"),
            "suggested_reply": "Thank you. My office will contact you soon.",
        }

    if _should_stay_silent(message):
        return _human_review("Short or unclear message. Better for manual reply.")

    

    if _is_clear_learning_lead(message):
        return _learning_lead_reply(message)

    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    if not api_key or OpenAI is None:
        return _simple_fallback(message, context)

    client = OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model=model,
            temperature=0.4,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(message, channel, context)},
            ],
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content
        data = json.loads(raw)

        return _normalize_output(data, message, context)

    except Exception as e:
        fallback = _simple_fallback(message, context)
        fallback["reason"] = f"OpenAI failed, fallback used: {e}"
        return fallback