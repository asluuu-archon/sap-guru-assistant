\# AI Command Center - Project Progress



\## 1. Project Vision



We are building a reusable AI Customer Engagement Platform.



The first implementation is for The SAP Guru, but the architecture should support future customers by changing configuration, knowledge base, branding, and social channel credentials.



Core idea:



One AI. Multiple Channels. One Memory.



Channels planned:

\- Instagram

\- WhatsApp

\- Facebook

\- Future: Email / Web chat



\---



\## 2. Current Product Name



Working name:



AI Command Center



First workspace/customer:



The SAP Guru



\---



\## 3. Main Objectives



The platform should:



1\. Receive customer messages from social channels.

2\. Understand intent safely.

3\. Reply automatically only when confident.

4\. Stay silent and move to Human Queue when unclear.

5\. Learn from manual replies.

6\. Capture leads.

7\. Qualify leads.

8\. Provide sales-ready lead briefs.

9\. Allow staff to reply from Command Center.

10\. Support future clients without rebuilding from scratch.



\---



\## 4. Current Architecture



Backend:

\- FastAPI

\- Render deployment

\- Supabase database

\- OpenAI API

\- Instagram webhook

\- Cron-job.org delayed reply trigger



Frontend:

\- Next.js

\- Tailwind CSS

\- Local development on localhost:3000

\- Command Center UI



\---



\## 5. Backend Features Completed



\- Instagram webhook verification

\- Instagram DM receiving

\- Echo/manual reply detection

\- Delayed auto reply logic

\- Conversation memory

\- Lead capture

\- Manual reply learning

\- Reply bank

\- Human review flow

\- Closing message detection

\- Non-text message handling

\- Dashboard data API

\- Conversation detail API

\- Intent Engine started

\- Greeting intent handled safely



\---



\## 6. Frontend Features Completed



Pages created:



\- `/` Command Center Overview

\- `/inbox` Unified Inbox



Current UI:

\- Sidebar

\- Top header

\- KPI cards

\- Needs Human section

\- Conversation Queue

\- Conversation Preview

\- Chat History

\- Reply Box placeholder

\- Customer Intelligence panel placeholder



\---



\## 7. Important Backend Endpoints



Production backend:



https://sap-guru-assistant.onrender.com



Endpoints:



\- `GET /health`

\- `GET /run-delayed-replies`

\- `GET /dashboard-data`

\- `GET /conversation/{sender\_id}`

\- `POST /webhook`

\- `GET /webhook`

\- `POST /suggest`



\---



\## 8. Current Database Tables



Known Supabase tables:



\### conversations



Important fields:

\- sender\_id

\- summary

\- last\_question

\- last\_reply

\- history

\- updated\_at

\- first\_message\_at

\- ai\_replied

\- manual\_replied

\- pending\_reply

\- needs\_human

\- human\_reason

\- conversation\_state

\- closed\_at

\- state\_reason



\### leads



Important fields:

\- sender\_id

\- name

\- phone

\- email

\- location

\- mode

\- education

\- experience

\- interested\_module

\- notes

\- status

\- is\_qualified

\- qualified\_at

\- updated\_at



\### sap\_guru\_reply\_bank



Purpose:

Stores useful manual replies for AI learning.



\---



\## 9. Current Process Flow



Incoming Instagram message:



1\. Webhook receives message.

2\. Ignore non-DM webhooks.

3\. Ignore duplicate message IDs.

4\. If echo message:

&#x20;  - Treat as manual reply.

&#x20;  - Save useful reply to reply bank.

&#x20;  - Mark conversation as manually replied.

5\. If non-text:

&#x20;  - Move to Human Queue.

6\. If closing message:

&#x20;  - Mark closed.

&#x20;  - Do not reply.

7\. Build conversation context.

8\. Detect intent.

9\. Generate reply only when confident.

10\. Save conversation.

11\. Save possible lead.

12\. If AUTO\_REPLY true:

&#x20;  - Send reply.

13\. If AUTO\_REPLY false:

&#x20;  - Log WOULD HAVE SENT.



Delayed reply flow:



1\. Incoming message creates pending reply.

2\. Cron-job.org calls `/run-delayed-replies`.

3\. If no manual reply within delay period:

&#x20;  - Send AI reply.

4\. If manual replied:

&#x20;  - Do not send AI reply.



\---



\## 10. Intent Engine



File:



`src/engine/intent.py`



Purpose:

Classify incoming messages before OpenAI.



Current intents:

\- greeting

\- closing

\- learning\_lead

\- lead\_information

\- career\_guidance

\- job\_inquiry

\- needs\_human

\- general



Important requirement:

OpenAI should not be used for every message. Business rules should handle obvious cases.



\---



\## 11. Product Design Principles



1\. Safety first.

2\. Do not reply if unsure.

3\. Avoid vague replies like “Can you share more details?”

4\. Do not pollute reply bank with generic greetings.

5\. Keep architecture reusable for future clients.

6\. Do not build everything inside one large file.

7\. Move intelligence into engines.

8\. Command Center should be useful for staff, not just developers.

9\. Sales team should get clear lead briefs.

10\. Identity matching must be safe. Auto-merge only when phone number matches.



\---



\## 12. Important Concerns Noted



\### Instagram Name / Username



Current issue:

We mostly see sender\_id, not actual Instagram handle/name.



Future requirement:

Build Identity Engine.



Possible fields:

\- sender\_id

\- instagram\_username

\- display\_name

\- phone

\- email

\- channel

\- customer\_id



Need to check Instagram Graph API permissions for fetching username/profile.



\### AI Brief Accuracy



Current issue:

AI brief is weak because it uses conversation summary.



Future requirement:

Create proper Sales Lead Brief.



Fields:

\- lead\_requirement

\- lead\_summary

\- sales\_notes

\- next\_best\_action

\- lead\_temperature

\- qualification\_reason



\### Qualified Leads



Current issue:

Need a sales-ready qualified leads page.



Future requirement:

Build Leads CRM page for sales team.



Sales team should see:

\- name

\- phone

\- location

\- module

\- mode

\- background

\- requirement brief

\- recommended pitch

\- next action

\- lead temperature



\---



\## 13. Planned Phases



\### Phase 1 - AI Foundation



Completed / ongoing:

\- Instagram webhook

\- Conversation memory

\- Delayed reply

\- Lead capture

\- Human Queue

\- Intent Engine



\### Phase 2 - Command Center



Completed / ongoing:

\- Overview page

\- Unified Inbox

\- Conversation preview

\- Customer Intelligence UI



Pending:

\- Send reply from dashboard

\- Mark closed from dashboard

\- Keep human button action

\- Full lead details in inbox

\- Better customer identity



\### Phase 3 - Sales CRM



Pending:

\- Qualified Leads page

\- Lead pipeline

\- Lead status management

\- Sales-ready lead brief

\- Filters by date, module, location, status

\- Telecaller notes

\- Follow-up reminders



\### Phase 4 - AI Intelligence



Pending:

\- Sales Lead Brief generation

\- AI confidence score

\- Lead temperature

\- Next best action

\- Better summarization

\- Better multilingual understanding

\- Voice note transcription

\- Image understanding

\- Story/status context understanding



\### Phase 5 - Multi-channel



Pending:

\- WhatsApp

\- Facebook

\- Shared customer identity

\- Safe cross-channel memory

\- Phone-based merge



\### Phase 6 - Multi-client Deployment



Pending:

\- Workspace concept

\- Client-specific config

\- Client branding

\- Client knowledge base

\- Client social credentials

\- Easy deployment process



\---



\## 14. Development Workflow



Standard workflow:



1\. Make small safe change.

2\. Syntax check.

3\. Commit.

4\. Push.

5\. Render deploy.

6\. Test.

7\. Review Render logs.

8\. Improve.



Important commands:



```cmd

python -m py\_compile src\\app.py

python -m py\_compile src\\assistant.py

python -m py\_compile src\\engine\\intent.py

git status

git add .

git commit -m "message"

git push

