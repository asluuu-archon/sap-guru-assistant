import os
import json
import re
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


def _response(
    category="general",
    reply="Can you tell me your educational background and current role?",
    lead_score=20,
    priority="normal",
    should_capture=False,
    approval_status="safe_to_send",
    reason="Rule based reply"
):
    return {
        "category": category,
        "lead_score": lead_score,
        "priority": priority,
        "approval_status": approval_status,
        "should_capture_contact": should_capture,
        "reason": reason,
        "suggested_reply": reply
    }


def _has_context(context: str, words: list[str]) -> bool:
    ctx = (context or "").lower()
    return any(w in ctx for w in words)


def _rule_based_reply(message: str, context: str = "") -> dict | None:
    text = message.lower().strip()
    ctx = (context or "").lower()

    # Ignore own echo / read receipts handled mostly in app.py, but safe here too
    if not text:
        return _response(reply="Please send your question as text so I can reply properly.")

    # Greetings
    if text in {"hi", "hello", "hello sir", "hey", "good morning", "good evening", "good afternoon"}:
        return _response("greeting", "Hi, how are you doing? How can I help you?", 0)

    if "how are you" in text and len(text) < 40:
        return _response("greeting", "I'm good.. how can I help you?", 0)

    # Personal profile questions
    if "where are you from" in text:
        return _response("personal", "I am from Kerala, India.", 0)

    if "where are you now" in text or "where are you currently" in text or "where do you live" in text:
        return _response("personal", "I am currently based in Sydney.", 0)

    if "your profile" in text or "about you" in text or "what do you do" in text:
        return _response(
            "personal",
            "I am an SAP architect and consultant. I have worked across multiple SAP areas like Basis, ABAP, RAP, CAP, SAC, BTP, integrations and analytics.",
            0
        )

    # Job enquiries
    if any(w in text for w in ["job", "opening", "vacancy", "opportunity", "hiring"]):
        if any(w in text for w in ["fico", "mm", "sd", "abap", "basis", "ewm", "successfactor", "hana", "security"]):
            return _response("job_inquiry", "I will check and update.", 55)
        return _response("job_inquiry", "What's your profile?", 50)

    # Institute questions
    if "institute" in text or "atos" in text or "training center" in text:
        return _response(
            "institute_question",
            "I prefer not to comment on any institute. Tell me a bit about your background and I can guide you.",
            40
        )

    # Certificate confusion
    if "certificate" in text or "certification" in text:
        if "institute" in text or "course completion" in text or "completed course" in text:
            return _response(
                "certification_guidance",
                "This is not SAP certification brother. This is a course completion certificate.",
                50
            )
        return _response(
            "certification_guidance",
            "Make sure it is official SAP Global Certification, not just an institute course completion certificate.",
            50
        )

    # If user gives education after bot asked background
    if any(w in text for w in ["btech", "b.tech", "engineering", "computer science", "it"]) and any(w in ctx for w in ["educational background", "current role", "what did you study"]):
        if "coding" in ctx or "coding" in text:
            return _response(
                "career_guidance",
                "Since you are from IT background and interested in coding, SAP ABAP, RAP, CAP or BTP development will suit you.",
                75
            )
        return _response(
            "career_guidance",
            "Since you are from IT background, you can look at SAP ABAP, RAP, CAP or BTP. Are you interested in coding side?",
            75
        )

    if any(w in text for w in ["bcom", "b.com", "commerce", "mcom", "m.com"]) and any(w in ctx for w in ["educational background", "current role", "what did you study"]):
        return _response(
            "career_guidance",
            "For commerce background, SAP FICO is usually a good option. Are you looking for consultant level or end user level?",
            75
        )

    if "mba" in text and any(w in ctx for w in ["educational background", "current role", "what did you study"]):
        return _response(
            "career_guidance",
            "MBA background can fit well with functional modules. Which specialization did you do?",
            70
        )

    # Coding interest
    if "coding" in text or "developer" in text or "programming" in text:
        if _has_context(context, ["btech", "b.tech", "it background", "engineering"]):
            return _response(
                "career_guidance",
                "Then SAP ABAP, RAP, CAP or BTP development will suit you better.",
                80
            )
        return _response(
            "career_guidance",
            "If you are interested in coding, SAP ABAP, RAP, CAP and BTP development are good areas to explore. What is your educational background?",
            75
        )

    # Module selection questions
    if any(p in text for p in ["which sap module", "which module", "what should i learn", "what can i learn", "learn sap"]):
        if _has_context(context, ["btech", "b.tech", "it background", "coding"]):
            return _response(
                "career_guidance",
                "Since you are from IT background, SAP ABAP, RAP, CAP or BTP development will be a better fit.",
                80
            )
        if _has_context(context, ["bcom", "commerce"]):
            return _response(
                "career_guidance",
                "Since you are from commerce background, SAP FICO will be a better fit.",
                80
            )
        return _response(
            "career_guidance",
            "Can you tell me your educational background and current role?",
            65
        )

    # Training / mentoring lead
    if any(w in text for w in ["course", "training", "fees", "mentor", "mentorship", "internship", "placement support"]):
        return _response(
            "learning_lead",
            "Please provide your contact details and my office will contact you.",
            90,
            should_capture=True
        )

    # SAP basic
    if text == "sap" or "what is sap" in text:
        return _response(
            "sap_basic_question",
            KB.get("common_replies", {}).get("what_is_sap", "SAP helps companies automate and integrate their business processes."),
            10
        )

    return None


def _fallback(message: str, context: str = "") -> dict:
    rule = _rule_based_reply(message, context)
    if rule:
        rule["reason"] = "Fallback rule used because LLM was unavailable."
        return rule

    return _response(
        category="general",
        reply="Can you tell me your educational background and current role?",
        lead_score=20,
        approval_status="needs_review",
        reason="Fallback mode used because LLM was unavailable."
    )


def _build_user_prompt(message: str, channel: str, context: str) -> str:
    payload = {
        "channel": channel,
        "current_user_message": message,
        "previous_conversation_context": context,
        "knowledge_base": KB,
        "task": (
            "Reply as Mohamed Aslam / The SAP Guru. "
            "Use previous context if available. "
            "Do not behave like a rule-based bot. "
            "Think like an experienced SAP architect and reply naturally."
        ),
        "output_format": {
            "category": "string",
            "should_capture_contact": "boolean",
            "suggested_reply": "short natural Instagram DM reply"
        }
    }
    return json.dumps(payload, ensure_ascii=False)

def _validate_response(data: dict, message: str, context: str) -> dict:
    required = {
        "category": "general",
        "lead_score": 20,
        "priority": "normal",
        "approval_status": "safe_to_send",
        "should_capture_contact": False,
        "reason": "",
        "suggested_reply": ""
    }

    for key, default in required.items():
        if key not in data or data[key] is None:
            data[key] = default

    reply = str(data.get("suggested_reply", "")).strip()

    bad_replies = {
        "can you explain what exactly you are looking for?",
        "can you share a little more context?",
        "can you share a little more context? i will suggest accordingly."
    }

    if not reply or reply.lower() in bad_replies:
        rule = _rule_based_reply(message, context)
        if rule:
            return rule
        reply = "Can you tell me your educational background and current role?"

    if len(reply) > 350:
        reply = reply[:330].rsplit(" ", 1)[0] + "..."

    data["suggested_reply"] = reply

    try:
        data["lead_score"] = int(data.get("lead_score", 20))
    except Exception:
        data["lead_score"] = 20

    data["lead_score"] = max(0, min(100, data["lead_score"]))

    if data["priority"] not in {"low", "normal", "high", "urgent"}:
        data["priority"] = "normal"

    if data["approval_status"] not in {"safe_to_send", "needs_review", "ignore"}:
        data["approval_status"] = "safe_to_send"

    data["should_capture_contact"] = bool(data["should_capture_contact"])

    return data


def _build_user_prompt(message: str, channel: str, context: str) -> str:
    payload = {
        "channel": channel,
        "current_user_message": message,
        "previous_conversation_context": context,
        "knowledge_base": KB,
        "task": (
            "Reply as Mohamed Aslam / The SAP Guru. "
            "Use previous context if available. "
            "Do not behave like a rule-based bot. "
            "Think like an experienced SAP architect and reply naturally."
        ),
        "output_format": {
            "category": "string",
            "should_capture_contact": "boolean",
            "suggested_reply": "short natural Instagram DM reply"
        }
    }
    return json.dumps(payload, ensure_ascii=False)


def suggest_reply(message: str, channel: str = "instagram", context: str = "") -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    if not api_key or OpenAI is None:
        return _fallback(message, context)

    client = OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model=model,
            temperature=0.75,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _build_user_prompt(message, channel, context)}
            ],
            response_format={"type": "json_object"}
        )

        raw = response.choices[0].message.content
        data = json.loads(raw)

        # Minimal validation only
        reply = str(data.get("suggested_reply", "")).strip()

        if not reply:
            fallback = _fallback(message, context)
            return fallback

        return {
            "category": data.get("category", "general"),
            "lead_score": 50 if data.get("should_capture_contact") else 20,
            "priority": "normal",
            "approval_status": "safe_to_send",
            "should_capture_contact": bool(data.get("should_capture_contact", False)),
            "reason": "Generated by GPT using Mohamed Aslam persona and memory",
            "suggested_reply": reply
        }

    except Exception as e:
        fallback = _fallback(message, context)
        fallback["reason"] = f"LLM failed, fallback used: {e}"
        fallback["approval_status"] = "needs_review"
        return fallback