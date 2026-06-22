from .memory import supabase


def save_reply_example(
    category: str,
    user_question: str,
    sap_guru_reply: str,
    tags: str = ''
):
    try:
        supabase.table('sap_guru_reply_bank').insert({
            'category': category,
            'user_question': user_question,
            'sap_guru_reply': sap_guru_reply,
            'tags': tags
        }).execute()

    except Exception as e:
        print(f'REPLY BANK SAVE ERROR: {e}')


def find_similar_replies(question: str, limit: int = 5):
    try:
        result = (
            supabase
            .table("sap_guru_reply_bank")
            .select("*")
            .execute()
        )

        rows = result.data or []

        question = question.lower()

        scored = []

        for row in rows:

            score = 0

            q = (row.get("user_question") or "").lower()
            tags = (row.get("tags") or "").lower()
            category = (row.get("category") or "").lower()

            for word in question.split():

                if word in q:
                    score += 3

                if word in tags:
                    score += 5

                if word in category:
                    score += 2

            scored.append((score, row))

        scored.sort(
            key=lambda x: x[0],
            reverse=True
        )

        return [
            row
            for score, row in scored[:limit]
            if score > 0
        ]

    except Exception as e:
        print(f"REPLY BANK SEARCH ERROR: {e}")
        return []