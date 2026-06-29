# AI Command Center - Project Progress

## Project Vision

We are building a reusable SaaS-based AI Customer Engagement Platform.

The first implementation is for The SAP Guru, but the architecture should support future customers by changing configuration, knowledge base, branding, and social channel credentials.

Core idea:

One AI. Multiple Channels. One Memory.

## Current Product Name

Working name:

AI Command Center

First workspace/customer:

The SAP Guru

## Main Objectives

The platform should:

1. Receive customer messages from social channels.
2. Understand intent safely.
3. Reply automatically only when confident.
4. Stay silent and move to Human Queue when unclear.
5. Learn from manual replies.
6. Capture leads.
7. Qualify leads.
8. Provide sales-ready lead briefs.
9. Allow staff to reply from Command Center.
10. Support multiple clients as a SaaS platform.

## Current Architecture

Backend:
- FastAPI
- Render deployment
- Supabase database
- OpenAI API
- Instagram webhook
- Cron-job.org delayed reply trigger

Frontend:
- Next.js
- Tailwind CSS
- Local development on localhost:3000
- Command Center UI

## Backend Features Completed

- Instagram webhook verification
- Instagram DM receiving
- Echo/manual reply detection
- Delayed auto reply logic
- Conversation memory
- Lead capture
- Manual reply learning
- Reply bank
- Human review flow
- Closing message detection
- Non-text message handling
- Dashboard data API
- Conversation detail API
- Dashboard manual reply endpoint
- Intent Engine started
- Channel Engine started
- Greeting intent handled safely

## Frontend Features Completed

Pages created:
- `/` Command Center Overview
- `/inbox` Unified Inbox

Current UI:
- Sidebar
- Top header
- KPI cards
- Needs Human section
- Conversation Queue
- Conversation Preview
- Chat History
- Reply Box placeholder
- Customer Intelligence panel placeholder

## Important Backend Endpoints

Production backend:

https://sap-guru-assistant.onrender.com

Endpoints:
- GET `/health`
- GET `/run-delayed-replies`
- GET `/dashboard-data`
- GET `/conversation/{sender_id}`
- POST `/conversation/send-reply`
- POST `/webhook`
- GET `/webhook`
- POST `/suggest`

## Current Database Tables

### conversations

Important fields:
- sender_id
- summary
- last_question
- last_reply
- history
- updated_at
- first_message_at
- ai_replied
- manual_replied
- pending_reply
- needs_human
- human_reason
- conversation_state
- closed_at
- state_reason

### leads

Important fields:
- sender_id
- name
- phone
- email
- location
- mode
- education
- experience
- interested_module
- notes
- status
- is_qualified
- qualified_at
- updated_at

### sap_guru_reply_bank

Purpose:
Stores useful manual replies for AI learning.

## Current Process Flow

Incoming Instagram message:

1. Webhook receives message.
2. Ignore non-DM webhooks.
3. Ignore duplicate message IDs.
4. If echo message:
   - Treat as manual reply.
   - Save useful reply to reply bank.
   - Mark conversation as manually replied.
5. If non-text:
   - Move to Human Queue.
6. If closing message:
   - Mark closed.
   - Do not reply.
7. Build conversation context.
8. Detect intent.
9. Generate reply only when confident.
10. Save conversation.
11. Save possible lead.
12. If AUTO_REPLY true:
   - Send reply through Channel Engine.
13. If AUTO_REPLY false:
   - Log WOULD HAVE SENT.

Delayed reply flow:

1. Incoming message creates pending reply.
2. Cron-job.org calls `/run-delayed-replies`.
3. If no manual reply within delay period:
   - Send AI reply.
4. If manual replied:
   - Do not send AI reply.

## Important Concerns Noted

### Instagram Name / Username

Current issue:
We mostly see sender_id, not actual Instagram handle/name.

Future requirement:
Build Identity Engine and check Instagram Graph API permissions for fetching username/profile.

### AI Brief Accuracy

Current issue:
AI brief is weak because it uses conversation summary.

Future requirement:
Create proper Sales Lead Brief.

Fields:
- lead_requirement
- lead_summary
- sales_notes
- next_best_action
- lead_temperature
- qualification_reason

### Qualified Leads

Future requirement:
Build Leads CRM page for sales team.

Sales team should see:
- name
- phone
- location
- interest/product/service
- mode/preference
- background
- requirement brief
- recommended pitch
- next action
- lead temperature

## Planned Phases

### Phase 1 - AI Foundation

Completed / ongoing:
- Instagram webhook
- Conversation memory
- Delayed reply
- Lead capture
- Human Queue
- Intent Engine
- Channel Engine

### Phase 2 - Command Center

Completed / ongoing:
- Overview page
- Unified Inbox
- Conversation preview
- Customer Intelligence UI

Pending:
- Connect Send Reply button
- Mark closed from Command Center
- Keep Human button action
- Better customer identity

### Phase 3 - Sales CRM

Pending:
- Qualified Leads page
- Lead pipeline
- Lead status management
- Sales-ready lead brief
- Filters by date, interest, location, status
- Telecaller notes
- Follow-up reminders

### Phase 4 - AI Intelligence

Pending:
- Customer Intelligence Engine
- Sales Lead Brief generation
- AI confidence score
- Lead temperature
- Next best action
- Better summarization
- Better multilingual understanding
- Voice note transcription
- Image understanding
- Story/status context understanding

### Phase 5 - Multi-channel

Pending:
- WhatsApp
- Facebook
- Shared customer identity
- Safe cross-channel memory
- Phone-based merge

### Phase 6 - SaaS Platform

Pending:
- organizations table
- organization_id support
- Workspace concept
- Client-specific config
- Client branding
- Client knowledge base
- Client social credentials
- Platform Console
- Organization Command Center
- Billing/subscription support

## Development Workflow

Standard workflow:

1. Make small safe change.
2. Syntax check.
3. Commit.
4. Push.
5. Render deploy.
6. Test.
7. Review Render logs.
8. Improve.

Important commands:

```cmd
python -m py_compile src\app.py
python -m py_compile src\assistant.py
python -m py_compile src\engine\intent.py
git status
git add .
git commit -m "message"
git push


## Documentation Standards

The project maintains the following permanent documents:

### PROJECT_PROGRESS.md

Tracks day-to-day development progress, completed work, pending work, and immediate next steps.

### SYSTEM_ARCHITECTURE.md

Defines the overall SaaS architecture, engines, entities, folder structure, and long-term technical design.

### PRODUCT_ROADMAP.md

Defines the product vision, planned modules, release phases, and long-term feature roadmap.

### IDEAS_BACKLOG.md

Stores ideas, enhancements, observations, and future improvements that arise during development.

### DECISIONS.md

Records important architectural and product decisions together with the reasoning behind them.

---

## Major Milestones Achieved

### SaaS Direction Confirmed

The project direction has officially changed from a single-business AI assistant to a reusable SaaS-based AI Customer Engagement Platform.

The SAP Guru will become the first organization/workspace using the platform.

Future organizations should be onboarded through configuration rather than code changes.

---

### Channel Engine Introduced

Business logic has started to be separated from communication channels.

Current implementation:

* Instagram

Future channels:

* WhatsApp
* Facebook
* Website Chat
* Email

---

### Customer Intelligence Direction

The platform will not simply store conversations.

Instead, it will continuously build a Customer Intelligence Profile that can be used by sales teams.

The Customer Intelligence Profile will eventually include:

* Customer identity
* Customer attributes
* AI summary
* Lead score
* Lead temperature
* AI confidence
* Sales brief
* Recommended next action

---

### Sales CRM Direction

The Qualified Leads section will not simply display conversations.

Instead, it will become a Sales Workspace that provides:

* Customer profile
* Requirement summary
* AI-generated sales brief
* Recommended sales pitch
* Follow-up tracking
* Lead status management

---

### Campaign Context Engine (Planned)

The platform will support temporary campaign context.

Examples:

* Today's Instagram post
* Today's Story
* Current Offer
* Job Opening
* Product Launch
* Announcement

Administrators should be able to explain campaign context using natural language.

AI should automatically use this information while replying to customer enquiries.

## Latest Development Session

Date:
2026-06-28

Completed

- Introduced Customer Engine.
- Created customers table in Supabase.
- Created src/crm/customer_engine.py.
- Every incoming Instagram message now creates or updates a customer record.
- Customer Engine successfully integrated into webhook.
- Project documentation expanded.
- Product Roadmap, Ideas Backlog and Decisions documents created.

Architecture Direction

The platform is no longer conversation-centric.

The Customer becomes the central business entity.

Future flow:

Incoming Message
↓

Customer
↓

Conversation
↓

Lead
↓

Sales CRM
↓

Analytics

Next Session

- Verify Customer Engine after Render deployment.
- Begin Customer Intelligence Engine.
- Start automatic customer attribute extraction.
