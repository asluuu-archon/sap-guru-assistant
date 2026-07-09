# AI Command Center — Manus Session Context
> Saved: 2026-07-10 | This file preserves all key findings for continuity across sessions.

---

## Handover Note
From this point forward, development is being done by Manus AI (not ChatGPT).
Git tag `manus-handover` should be created on the current commit as a rollback point.

---

## Product Vision
AI Command Center is a **multi-tenant AI Customer Engagement Platform** — an "AI employee" that any business can configure and deploy without writing code. It started as a tool for SAP Guru / Archon Solutions (Instagram DMs) but is being built generically so any business (hospital, law firm, real estate, etc.) can use it.

**The Golden Rules (never break these):**
1. No hardcoded business logic in Python — everything must come from the database
2. Preserve and extend the pipeline architecture — never bypass it
3. Every organisation has isolated data, Business Brain, and configuration
4. The AI should behave like the business owner, not like a bot

---

## Tech Stack
- Backend: Python, FastAPI, Uvicorn (hosted on Render)
- Frontend: Next.js (React) — hosted separately or on Render
- Database: Supabase (PostgreSQL)
- AI: OpenAI (gpt-4.1-mini currently)
- Version Control: GitHub — https://github.com/asluuu-archon/sap-guru-assistant

---

## Supabase Tables (confirmed from screenshots + CSV exports)
| Table | Status | Notes |
|---|---|---|
| conversations | Active, has data | Stores full history, summary, state |
| customers | Active, has data | Instagram sender profiles |
| leads | Active, has data | CRM lead records |
| business_contexts | Active | Free-text context injection (v1 Business Brain) |
| business_profile | Active | 1 row: org_id=1, AI Command Center Demo Business, persona config |
| business_rules | Active | 4 rows: 3x Default Greeting + 1 BTP Interest Test rule |
| appointments | Empty | Table created, workflow not implemented |
| sap_guru_reply_bank | Active | Manual reply learning bank |

**business_profile row (org_id=1):**
- business_name: AI Command Center Demo Business
- business_type: Training and Consulting
- ai_persona: "Reply like the business owner. Be warm, practical, concise and helpful."
- ai_tone: friendly
- reply_style: short_natural
- should_speak_as_owner: true
- owner_display_name: Mohamed Aslam
- timezone: Asia/Kolkata

**business_rules rows:**
- 3x Default Greeting (trigger: hi/hello/hey/good morning → "Hi, how are you doing?")
- 1x BTP Interest Test (trigger: btp → BTP guidance reply)

---

## Critical Bugs Found in Render Logs + Code Review

### Bug 1 — MOST CRITICAL: Conversation History Not Passed to AI
- `conversation_stage.py` loads conversation from DB correctly
- BUT `message_pipeline.py` never passes the loaded conversation history into `reply_engine`
- `build_context(conversation)` IS called in pipeline but only when `decision == "reply"`
- The `conversation` object used is `context.conversation` which IS populated
- **Root cause**: Need to verify if `context.conversation` is actually populated with history before reply stage
- **Impact**: AI replies without seeing previous messages → no continuity

### Bug 2 — Instagram Profile API Error on Every Message
- Error: `Tried accessing nonexisting field (profile_pic)`
- Fires on EVERY message, adds ~400ms overhead
- Fix: Remove `profile_pic` from the Graph API fields request in `services/instagram_profile.py`

### Bug 3 — Business Brain Stage Always Returns "Active: False"
- Every log shows: `Business Brain Stage completed. Active: False`
- `business_rules` table HAS data (4 rows) but stage reports no context
- The stage uses `business_contexts` table (free-text), NOT `business_rules` table
- The `business_rules` matching engine exists but may not be wired to the stage
- **Impact**: AI never uses business rules

### Bug 4 — Delay Processor Sends Second Reply Without Full Context
- `delay_processor.py` calls `suggest_reply(last_user_message)` after 15 min
- Does pass `build_context(conversation)` — so context IS included
- But it re-runs the full AI call independently of the webhook decision
- Can cause duplicate or inconsistent replies
- **Fix needed**: Make delay configurable per org (not hardcoded 15 min)

### Bug 5 — Pipeline Intent Engine Too Primitive
- Only recognises 7 exact greetings, "job/opening/vacancy/hire", "course/training/learn/fee"
- Everything else → `general` with 0.60 confidence
- This means most real conversations are classified as generic
- The richer `assistant.py` intent logic is bypassed by the pipeline

### Bug 6 — Duplicate Business Rules
- `business_rules` has 3 identical "Default Greeting" rows (ids 1, 2, 3)
- Should be deduplicated

---

## Pipeline Flow (confirmed from code)
```
Webhook → app.py → process_incoming_message()
  → message_pipeline.py → run_pipeline()
    → customer_stage (identify/create customer)
    → identity_stage (enrich profile, triggers Instagram API → BUG 2)
    → conversation_stage (loads history from DB)
    → business_brain_stage (loads business_contexts → BUG 3)
    → customer_brain_stage (extract facts)
    → intent_stage (primitive classifier → BUG 5)
    → lead_stage (detect lead intent)
    → decision_stage (reply/human/silent)
    → reply_stage (if decision=reply → calls assistant.py → OpenAI)
  → save_conversation()
  → if AUTO_REPLY: send_reply()
```

---

## Key Files
| File | Purpose |
|---|---|
| src/app.py | FastAPI app, webhook handler, routing |
| src/assistant.py | AI prompt builder, OpenAI call, persona logic |
| src/memory.py | Conversation persistence, build_context() |
| src/leads.py | CRM lead persistence |
| src/delay_processor.py | 15-min delayed reply worker (hardcoded) |
| src/pipeline/message_pipeline.py | Pipeline orchestrator |
| src/pipeline/stages/business_brain_stage.py | Loads business_contexts (NOT business_rules) |
| src/pipeline/engines/intent_engine.py | Primitive intent classifier |
| src/pipeline/engines/reply_engine.py | Calls suggest_reply() from assistant.py |
| src/api/dashboard_api.py | Dashboard + /all-leads endpoints |
| src/api/business_api.py | Business contexts CRUD |
| src/services/instagram_profile.py | Instagram Graph API profile fetch (has bug) |
| src/crm/customer_engine.py | Customer create/enrich |
| knowledge/system_prompt.txt | Mohamed Aslam AI persona (excellent, well written) |
| frontend/app/leads/page.tsx | NEW: Leads CRM page (built by Manus) |
| frontend/app/api/all-leads/route.ts | NEW: Proxy route for /all-leads (built by Manus) |

---

## How AUTO_REPLY and Delay Actually Work (confirmed from app.py)

- `AUTO_REPLY = os.getenv("AUTO_REPLY", "false").lower() == "true"` — set in Render env vars
- When `AUTO_REPLY = false`: webhook processes message, generates reply, saves to DB, but does NOT send. Prints "AUTO REPLY DISABLED".
- When `AUTO_REPLY = true`: webhook sends reply immediately (no delay).
- `delay_processor.py` runs on `/run-delayed-replies` endpoint (called by external cron every few minutes). It reads `pending_reply=True` rows and sends them after the configured delay.
- The delay processor does NOT check `AUTO_REPLY` — it always sends. So the workflow IS correct:
  - `AUTO_REPLY=false` → no instant reply → delay processor sends after X minutes
  - `AUTO_REPLY=true` → instant reply sent immediately
- Aslu's intended workflow: `AUTO_REPLY=false` always. Delay processor handles sending after delay. Manual replies from dashboard OR Instagram direct cancel the pending reply.
- Echo detection (is_echo=True) already exists in app.py and calls `mark_manual_replied()` correctly.
- The `CONVERSATION_GOAL` field in logs is new — suggests a newer intent engine may be running in parallel.

## Current Issue: "Hi" from returning customer returns empty reply
- When returning customer says "Hi", greeting shortcuts are now skipped (our fix works)
- But then it falls into OpenAI which returns `should_reply: false`
- This causes `action=human` path → saves as `needs_human` → delay processor will NOT send (no reply_text saved)
- Fix needed: improve prompt so AI continues the conversation naturally for returning customers
- Also: `app.py` line 310 — if `should_reply is False or not reply_text` → marks as needs_human and saves empty reply. Delay processor then has nothing to send.

## test-instagram-profile endpoint still has profile_pic bug
- Line 80 in app.py: `"fields": "id,username,name,profile_pic"` — this test endpoint was not fixed
- Only the main instagram_profile.py was fixed

---

## Immediate Fix Priority (agreed with Aslu)
1. Create Git tag `manus-handover` as rollback point
2. Fix conversational continuity (Bug 1) — most impactful
3. Fix Instagram profile API error (Bug 2) — quick win
4. Fix Business Brain stage to use business_rules (Bug 3)
5. Make delay configurable per org (Bug 4)
6. Improve intent engine (Bug 5)

---

## Development Roadmap (from spec docs)
- Phase A: Fix broken features (Bugs 1-6) ← CURRENT
- Phase B: Business Brain v2 (natural language UI, not technical fields)
- Phase C: Customer Profile page + Customer 360
- Phase D: Appointment Engine
- Phase E: Google Calendar integration
- Phase F: Email confirmations
- Phase G: Multi-tenant foundation (organisations table, onboarding)
- Phase H: WhatsApp/Facebook/Web Chat
- Phase I: Vector memory
- Phase J: Analytics

---

## Aslu's Key Decisions
- Auto reply: ENABLED (AUTO_REPLY=true on Render)
- Delay: 15 minutes (wants this configurable from frontend per org)
- Business Brain vision: Each org configures their own promotions/rules; AI replies based on that
- Scalability: Adding a hospital as second client should be trivial (new org record + Business Brain)
- No SAP-specific hardcoding — system must work for any business vertical
- Rollback: Git tag before any major change

---

## Environment Variables (on Render)
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- OPENAI_API_KEY
- META_PAGE_ACCESS_TOKEN
- META_VERIFY_TOKEN
- INSTAGRAM_APP_SECRET
- AUTO_REPLY_ENABLED (set to true)
- RENDER_EXTERNAL_URL
