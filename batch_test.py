from src.assistant import suggest_reply
from pathlib import Path
import json
import asyncio

cases = Path("examples/test_cases.txt").read_text(encoding="utf-8").splitlines()
async def main():
    for msg in cases:
        if not msg.strip():
            continue
        print("MESSAGE:", msg)
        print(json.dumps(await suggest_reply(msg), indent=2, ensure_ascii=False))
        print("=" * 80)

if __name__ == "__main__":
    asyncio.run(main())
