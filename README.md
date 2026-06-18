
# SAP Guru Assistant - Pilot Version

This is the first proper pilot version of the Digital SAP Guru assistant.

Goal:

* Reply like Mohamed Aslam / The SAP Guru
* Answer SAP questions from a business/process perspective
* Give SAP career guidance
* Detect learning leads
* Keep replies in approval mode
* Avoid sounding like a training institute
* Ask for contact details only when it is a probable learning/career lead

## Important

For intelligent answers, this app needs an LLM API key.

Without an API key, it will still run in fallback mode, but fallback mode is only for basic testing.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
```

Add your OpenAI API key in `.env`:

```bash
OPENAI\\\_API\\\_KEY=your\\\_key\\\_here
OPENAI\\\_MODEL=gpt-4.1-mini
```

## Manual Test

```bash
python manual\\\_test.py
```

## Batch Test

```bash
python batch\\\_test.py
```

## Run API

```bash
uvicorn src.app:app --reload
```

Then test:

```bash
curl -X POST http://127.0.0.1:8000/suggest \\\\
-H "Content-Type: application/json" \\\\
-d '{"message":"I am BCom graduate. Which SAP module should I learn?","channel":"instagram"}'
```

## Philosophy

This is not a training bot.
This is not a FAQ bot.
This is a Digital SAP Guru assistant.

It should:

1. Understand the core question
2. Answer briefly and practically
3. Think like a senior SAP architect
4. Generate leads naturally only when relevant
5. Never fake confidence


