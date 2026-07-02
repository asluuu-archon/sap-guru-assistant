from src.pipeline.engines.intent_engine import detect_intent
from src.pipeline.engines.lead_engine import evaluate_lead
from src.pipeline.engines.confidence_engine import evaluate_confidence
from src.pipeline.engines.decision_engine import make_decision


def test_greeting_intent():
    result = detect_intent("hi")
    assert result["intent"] == "greeting"


def test_training_lead_detection():
    result = evaluate_lead(
        customer={},
        message="I want to learn SAP FICO and become a consultant",
        reply={},
    )
    assert result["is_lead"] is True
    assert result["lead_score"] >= 50


def test_confidence_allows_good_intent():
    intent = {
        "intent": "training_enquiry",
        "confidence": 0.95,
    }
    result = evaluate_confidence(intent)
    assert result["should_continue"] is True


def test_decision_reply_for_confident_message():
    intent = {
        "intent": "training_enquiry",
        "confidence": 0.95,
    }
    confidence = evaluate_confidence(intent)
    decision = make_decision(intent, confidence)

    assert decision["action"] == "reply"
    assert decision["should_reply"] is True