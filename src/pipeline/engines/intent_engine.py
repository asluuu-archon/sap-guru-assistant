"""
Intent Engine

Determines the customer's intent before the LLM
generates a reply.

The goal is to make intent detection reusable
across every communication channel.
"""


from typing import Dict


def detect_intent(message: str) -> Dict:
    text = (message or "").lower().strip()

    if not text:
        return {
            "intent": "empty",
            "confidence": 1.0,
            "reason": "No message",
        }

    greetings = {
        "hi",
        "hello",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
        "hii",
    }

    if text in greetings:
        return {
            "intent": "greeting",
            "confidence": 0.99,
            "reason": "Greeting detected",
        }

    if any(word in text for word in ["job", "opening", "vacancy", "hire"]):
        return {
            "intent": "job_enquiry",
            "confidence": 0.95,
            "reason": "Job keywords found",
        }

    if any(word in text for word in ["course", "training", "learn", "fee"]):
        return {
            "intent": "training_enquiry",
            "confidence": 0.95,
            "reason": "Training keywords found",
        }

    return {
        "intent": "general",
        "confidence": 0.60,
        "reason": "No rule matched",
    }