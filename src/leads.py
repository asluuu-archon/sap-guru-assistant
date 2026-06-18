from datetime import datetime

def save_lead(sender_id, message_text, reply_text):
    line = (
        f"{datetime.utcnow().isoformat()} | "
        f"sender_id={sender_id} | "
        f"message={message_text} | "
        f"reply={reply_text}\n"
    )

    with open("/tmp/leads.txt", "a", encoding="utf-8") as f:
        f.write(line)

    print("LEAD SAVED", flush=True)