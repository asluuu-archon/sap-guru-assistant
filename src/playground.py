from datetime import datetime

history = []


def save_playground_result(result: dict):
    history.insert(0, {
        "time": datetime.utcnow().isoformat(),
        "result": result,
    })

    del history[100:]


def get_playground_history():
    return history