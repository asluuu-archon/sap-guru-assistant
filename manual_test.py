from src.assistant import suggest_reply
import json

print("SAP Guru Assistant - Manual Test")
print("Type a DM/message. Type 'exit' to quit.\n")

while True:
    msg = input("Message: ").strip()
    if msg.lower() in {"exit", "quit"}:
        break
    result = suggest_reply(msg, channel="manual_test")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print("-" * 60)
