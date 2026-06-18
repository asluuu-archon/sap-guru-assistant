import os, json
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

try:
    from openai import OpenAI
except Exception:
    OpenAI = None

ROOT = Path(__file__).resolve().parent.parent
SYSTEM_PROMPT = (ROOT / "knowledge" / "system_prompt.txt").read_text(encoding="utf-8")
KB = json.loads((ROOT / "knowledge" / "knowledge_base.json").read_text(encoding="utf-8"))

def _fallback(message: str) -> dict:
    """Basic fallback only. Real intelligence needs LLM API."""
    text = message.lower().strip()
    category = "general"
    reply = "Can you share a little more context? I will suggest accordingly."
    lead_score = 20
    priority = "normal"
    should_capture = False
    approval_status = "needs_review"
    reason = "Fallback mode used because no LLM API key is configured."

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
        reply = KB["common_replies"]["what_is_sap"]
        lead_score = 10
        approval_status = "safe_to_send"
    elif "bcom" in text and ("module" in text or "learn" in text or "sap" in text):
        category = "career_guidance"
        reply = "Since you are from B.Com background, I would recommend SAP FICO. Try to focus more on the Controlling side also because it is relatively niche and many people ignore that area. Please share your contact details and my office will contact you."
        lead_score = 85
        should_capture = True
        approval_status = "safe_to_send"
    elif any(w in text for w in ["teach sap", "learn sap", "course", "training", "fees"]):
        category = "learning_lead"
        reply = "It is better to learn SAP under experienced consultants. If you are seriously interested, I can connect you with consultants who guide students with practical sessions/internships. Please share your contact details and my office will contact you."
        lead_score = 90
        should_capture = True
        approval_status = "safe_to_send"
    elif "certification" in text or "certificate" in text:
        category = "certification_guidance"
        reply = "Certification helps, but make sure it is the official SAP Global Certification from SAP, not an institute course completion certificate. Many students confuse both."
        lead_score = 60
        approval_status = "safe_to_send"
    elif any(w in text for w in ["opening", "job", "vacancy"]):
        category = "job_inquiry"
        reply = "Which module and how many years of experience?"
        lead_score = 50
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

def suggest_reply(message: str, channel: str = "instagram", context: str = "") -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    if not api_key or OpenAI is None:
        return _fallback(message)

    client = OpenAI(api_key=api_key)
    user_payload = {"channel": channel, "context": context, "message": message}

    try:
        response = client.chat.completions.create(
            model=model,
            temperature=1,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)}
            ],
            response_format={"type": "json_object"}
        )
        raw = response.choices[0].message.content
        data = json.loads(raw)
        required = ["category", "lead_score", "priority", "approval_status", "should_capture_contact", "reason", "suggested_reply"]
        for key in required:
            data.setdefault(key, None)
        return data
    except Exception as e:
        fallback = _fallback(message)
        fallback["reason"] = f"LLM failed, fallback used: {e}"
        fallback["approval_status"] = "needs_review"
        return fallback
