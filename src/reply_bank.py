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
            .table('sap_guru_reply_bank')
            .select('*')
            .execute()
        )

        rows = result.data or []
        question_words = set(question.lower().split())
        scored = []

        for row in rows:
            q = (row.get('user_question') or '').lower()
            score = len(question_words.intersection(set(q.split())))
            scored.append((score, row))

        scored.sort(key=lambda x: x[0], reverse=True)

        return [x[1] for x in scored[:limit]]

    except Exception as e:
        print(f'REPLY BANK SEARCH ERROR: {e}')
        return []