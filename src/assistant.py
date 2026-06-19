import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

try:
    from openai import OpenAI
except Exception:
    OpenAI = None


ROOT = Path(__file__).resolve().parent.parent
SYSTEM_PROMPT = (ROOT / "knowledge" / "system_prompt.txt").read_text(encoding="utf-8")
KB = json.loads((ROOT / "knowledge" / "knowledge_base.json").read_text(encoding="utf-8"))


def _fallback(message: str) -> dict:
    """
    Fallback only if OpenAI fails.
    Keep this simple, short and safe.
    """
    text = message.lower().strip()

    category = "general"
    reply = "Can you explain what exactly you are looking for?"
    lead_score = 20
    priority = "normal"
    should_capture = False
    approval_status = "needs_review"
    reason = "Fallback mode used because LLM was unavailable."

    if text in {"hi", "hello", "hello sir", "good morning", "good evening", "hey"}:
        category = "greeting"
        reply = "Hi, how are you doing? How can I help you?"
        lead_score = 0
        approval_status = "safe_to_send"

    elif "how are you" in text:
        category = "greeting"
        reply = "I'm good.. how can I help you?"
        lead_score = 0
        approval_status = "safe_to_send"

    elif "what is sap" in text or text == "sap":
        category = "sap_basic_question"
        reply = KB["common_replies"].get(
            "what_is_sap",
            "SAP helps companies automate and integrate their business processes."
        )
        lead_score = 10
        approval_status = "safe_to_send"

    elif any(w in text for w in ["opening", "job", "vacancy"]):
        category = "job_inquiry"
        reply = "What's your profile?"
        lead_score = 50
        approval_status = "safe_to_send"

    elif any(w in text for w in ["course", "training", "fees", "mentor", "internship"]):
        category = "learning_lead"
        reply = "Please provide your contact details and my office will contact you."
        lead_score = 90
        should_capture = True
        approval_status = "safe_to_send"

    elif any(w in text for w in ["learn sap", "start sap", "upskill", "module"]):
        category = "career_guidance"
        reply = "Can you tell me your educational background and current role?"
        lead_score = 70
        approval_status = "safe_to_send"

    elif "certification" in text or "certificate" in text:
        category = "certification_guidance"
        reply = "Make sure it is official SAP Global Certification, not an institute course completion certificate."
        lead_score = 60
        approval_status = "safe_to_send"

    return {
        "category": category,
        "lead_score": lead_score,
        "priority": priority,
        "approval_status": approval_status,
        "should_capture_contact": should_capture,
        "reason": reason,
        "suggested_reply": reply
    }


def _build_user_prompt(message: str, channel: str, context: str) -> str:
    """
    Build a stronger prompt for the model.
    We send context, knowledge base and strict output format.
    """
    payload = {
        "channel": channel,
        "current_user_message": message,
        "previous_context": context,
        "knowledge_base": KB,
        "instructions": {
            "reply_style": [
                "Reply like Mohamed Aslam in Instagram DM.",
                "Keep reply short and natural.",
                "Usually 1 to 3 sentences.",
                "Ask only one question at a time.",
                "Do not sound like ChatGPT.",
                "Do not give long roadmap unless clearly asked.",
                "If unclear, ask a short clarification question.",
                "Always reply in English.",
                "Understand Malayalam/Hindi/Tamil written in English letters if possible.",
                "Do not repeat the same question if already asked in previous_context.",
                "Do not repeat the same reply again and again.",
                "Answer only what the user asked."
            ],
            "personal_profile_rules": {
                "where_from": "I am from Kerala, India.",
                "current_location": "I am currently based in Sydney.",
                "professional_profile": "I am an SAP architect and consultant. I have worked across multiple SAP areas including Basis, ABAP, RAP, CAP, SAC, BTP, integrations and analytics.",
                "the_sap_guru": "The SAP Guru is where I share practical SAP career guidance and business process knowledge."
            },
            "lead_rules": [
                "If user is clearly asking for training, course, mentoring, internship or office follow-up, mark should_capture_contact true.",
                "If it is only a general SAP knowledge question, do not ask for contact details.",
                "If user asks about job openings but profile is unclear, ask 'What's your profile?'",
                "If user asks about specific institute, do not comment on the institute.",
                "If no clear opportunity, say 'I will check and update' or 'Currently no openings from my side.'"
            ],
            "output_format": {
                "category": "string",
                "lead_score": "integer 0-100",
                "priority": "low|normal|high|urgent",
                "approval_status": "safe_to_send|needs_review|ignore",
                "should_capture_contact": "boolean",
                "reason": "short internal reason",
                "suggested_reply": "short natural Instagram DM reply"
            }
        }
    }

    return json.dumps(payload, ensure_ascii=False)


def _validate_response(data: dict) -> dict:
    required = {
        "category": "general",
        "lead_score": 20,
        "priority": "normal",
        "approval_status": "needs_review",
        "should_capture_contact": False,
        "reason": "",
        "suggested_reply": "Can you explain what exactly you are looking for?"
    }

    for key, default in required.items():
        if key not in data or data[key] is None:
            data[key] = default

    # Keep responses short. If the model becomes too long, trim softly.
    reply = str(data.get("suggested_reply", "")).strip()

    if not reply:
        reply = "Can you explain what exactly you are looking for?"

    # Avoid very long replies in Instagram DMs.
    if len(reply) > 450:
        reply = reply[:430].rsplit(" ", 1)[0] + "..."

    data["suggested_reply"] = reply

    try:
        data["lead_score"] = int(data.get("lead_score", 20))
    except Exception:
        data["lead_score"] = 20

    if data["lead_score"] < 0:
        data["lead_score"] = 0

    if data["lead_score"] > 100:
        data["lead_score"] = 100

    if data["priority"] not in {"low", "normal", "high", "urgent"}:
        data["priority"] = "normal"

    if data["approval_status"] not in {"safe_to_send", "needs_review", "ignore"}:
        data["approval_status"] = "needs_review"

    data["should_capture_contact"] = bool(data["should_capture_contact"])

    return data


def suggest_reply(message: str, channel: str = "instagram", context: str = "") -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    if not api_key or OpenAI is None:
        return _fallback(message)

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

        return _validate_response(data)

    except Exception as e:
        fallback = _fallback(message)
        fallback["reason"] = f"LLM failed, fallback used: {e}"
        fallback["approval_status"] = "needs_review"
        return fallback