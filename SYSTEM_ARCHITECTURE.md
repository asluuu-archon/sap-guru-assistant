\# AI Command Center - System Architecture



\## Product Direction



AI Command Center is a SaaS-based AI Customer Engagement Platform.



The platform will support multiple organizations. Each organization can connect its own social channels, knowledge base, users, leads, customers, workflows, and AI settings.



The SAP Guru is the first organization/workspace.



\## Core Principle



Every major business record must eventually belong to an organization.



Standard key:



organization\_id



\## SaaS Model



There will be two levels:



\### Platform Console



Used by platform owner/admin.



Purpose:

\- Manage organizations

\- Manage subscriptions

\- Monitor usage

\- Manage deployments

\- Manage templates

\- Monitor system logs

\- Control OpenAI usage



\### Organization Command Center



Used by each client/company.



Purpose:

\- Manage inbox

\- Manage leads

\- Manage customers

\- Manage channels

\- Manage knowledge

\- View analytics

\- Reply to customers

\- Configure AI behavior



\## Main Entities



\### organizations



Fields planned:

\- id

\- name

\- industry

\- status

\- timezone

\- branding

\- subscription\_plan

\- created\_at

\- updated\_at



\### organization\_users



Fields planned:

\- id

\- organization\_id

\- name

\- email

\- role

\- status

\- created\_at

\- updated\_at



\### channels



Fields planned:

\- id

\- organization\_id

\- channel\_type

\- channel\_name

\- credentials

\- status

\- created\_at

\- updated\_at



\### customers



Fields planned:

\- id

\- organization\_id

\- name

\- phone

\- email

\- location

\- attributes JSON

\- lead\_score

\- lead\_temperature

\- status

\- created\_at

\- updated\_at



\### customer\_channels



Fields planned:

\- id

\- organization\_id

\- customer\_id

\- channel\_type

\- channel\_user\_id

\- username

\- display\_name

\- phone

\- email

\- created\_at

\- updated\_at



\### conversations



Fields planned:

\- id

\- organization\_id

\- customer\_id

\- channel\_type

\- channel\_user\_id

\- summary

\- state

\- last\_message

\- last\_reply

\- needs\_human

\- human\_reason

\- history JSON

\- created\_at

\- updated\_at



\### leads



Fields planned:

\- id

\- organization\_id

\- customer\_id

\- source\_channel

\- status

\- lead\_score

\- lead\_temperature

\- requirement\_summary

\- sales\_brief

\- next\_best\_action

\- assigned\_to

\- follow\_up\_at

\- created\_at

\- updated\_at



\## Engines



\### Intent Engine



Detects message intent before using OpenAI.



\### Conversation Engine



Orchestrates incoming messages.



\### Channel Engine



Sends and receives messages across Instagram, WhatsApp, Facebook, website chat, and email.



\### Customer Intelligence Engine



Extracts customer profile, interest, needs, and lead information.



\### Lead Engine



Creates, qualifies, and updates leads.



\### Knowledge Engine



Loads organization-specific knowledge.



\### Confidence Engine



Decides whether AI should reply or move to Human Queue.



\## Cross-Channel Identity



Auto-merge customers only when phone number matches.



Manual review required for:

\- email match

\- name match

\- location match

\- similar conversation

\- user says they contacted via another channel



\## Current Implementation



Backend:

\- FastAPI

\- Supabase

\- OpenAI

\- Instagram webhook

\- Render deployment



Frontend:

\- Next.js

\- Tailwind CSS

\- AI Command Center

\- Unified Inbox



Current default organization:

\- The SAP Guru



\## Important Design Rules



1\. Core platform must not be SAP-specific.

2\. SAP-specific logic belongs in organization knowledge/configuration.

3\. Every future table should support organization\_id.

4\. Every future channel should go through Channel Engine.

5\. Every customer should eventually map to customer\_id.

6\. AI should not reply when confidence is low.

7\. Sales users should get lead briefs, not raw chat only.

8\. Platform owner should have a separate Platform Console.

9\. Client users should only access their own Organization Command Center.

10\. Future onboarding should be configuration-driven.



\## Documentation Standards



The project maintains five permanent documents:



\### PROJECT\_PROGRESS.md



Tracks implementation progress.



\### SYSTEM\_ARCHITECTURE.md



Defines technical architecture.



\### PRODUCT\_ROADMAP.md



Defines product evolution.



\### IDEAS\_BACKLOG.md



Stores future enhancements and ideas.



\### DECISIONS.md



Stores important design decisions.



\---



\## Campaign Context Engine



Status:

Planned



Purpose:



Allow each organization to describe current campaigns, offers, stories, reels, announcements, or job openings using natural language.



Examples:



\* Product launch

\* Discount offer

\* Recruitment campaign

\* Holiday announcement

\* Training batch

\* Marketing campaign



The AI should automatically include active campaign context while generating replies.



Campaigns should support:



\* Valid From

\* Valid Until

\* Active / Paused / Expired

\* Priority

\* Related Channels



\---



\## Customer Intelligence Philosophy



The platform should not rely only on conversation history.



Instead, every customer should gradually build a Customer Intelligence Profile.



This profile should evolve over time and become the primary source of information for telecallers and sales teams.



The profile should remain generic and work across industries.



Examples of customer attributes:



\* Interests

\* Requirements

\* Preferences

\* Previous interactions

\* AI summary

\* Lead score

\* Lead temperature

\* AI confidence

\* Recommended next action



Industry-specific information should be stored as configurable customer attributes rather than hardcoded database columns.



\---



\## Multi-Tenant Philosophy



The platform should always be designed with multiple organizations in mind.



Every organization should have:



\* Independent users

\* Independent customers

\* Independent conversations

\* Independent leads

\* Independent AI knowledge

\* Independent channels

\* Independent analytics



The Platform Console should manage organizations, while each organization should only access its own Command Center.



