from src.assistant import suggest_reply
import json
import asyncio

print("SAP Guru Assistant - Manual Test")
print("Type a DM/message. Type 'exit' to quit.\n")

async def main():
    while True:
        msg = input("Message: ").strip()
        if msg.lower() in {"exit", "quit"}:
            break
        result = await suggest_reply(msg, channel="manual_test")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("-" * 60)

if __name__ == "__main__":
    asyncio.run(main())
