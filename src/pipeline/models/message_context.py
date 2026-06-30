from dataclasses import dataclass, field
from typing import Any


@dataclass
class MessageContext:
    """
    Shared object passed through the Message Pipeline.

    Every pipeline stage can read from this object and add information to it.
    This keeps app.py and message_pipeline.py clean as the platform grows.
    """

    organization_id: int = 1
    channel: str = "instagram"
    sender_id: str = ""
    message_text: str = ""
    raw_payload: dict[str, Any] = field(default_factory=dict)

    customer: dict[str, Any] = field(default_factory=dict)
    customer_id: int | None = None

    identity: dict[str, Any] = field(default_factory=dict)
    conversation: dict[str, Any] = field(default_factory=dict)
    business_context: str = ""
    intent: dict[str, Any] = field(default_factory=dict)
    reply: dict[str, Any] = field(default_factory=dict)
    lead: dict[str, Any] = field(default_factory=dict)

    logs: list[str] = field(default_factory=list)

    def add_log(self, message: str) -> None:
        self.logs.append(message)

    def to_dict(self) -> dict[str, Any]:
        return {
            "organization_id": self.organization_id,
            "channel": self.channel,
            "sender_id": self.sender_id,
            "message_text": self.message_text,
            "customer": self.customer,
            "customer_id": self.customer_id,
            "identity": self.identity,
            "conversation": self.conversation,
            "business_context": self.business_context,
            "intent": self.intent,
            "reply": self.reply,
            "lead": self.lead,
            "logs": self.logs,
        }