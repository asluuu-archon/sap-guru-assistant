\# AI Command Center - System Architecture



> Last Updated: 2026-06-29



\---



\# Product Direction



AI Command Center is a reusable SaaS-based AI Customer Engagement Platform.



Every organization should be able to connect its own:



\- Social channels

\- AI knowledge

\- Business Brain

\- Customers

\- Leads

\- Sales users

\- Analytics

\- Workflows



without changing application code.



The SAP Guru is the first organization (workspace).



\---



\# Architecture Philosophy



The platform is built around one principle:



> AI should behave like a knowledgeable employee rather than a chatbot.



Every AI decision should be based on multiple intelligence sources instead of only the latest customer message.



\---



\# High-Level Architecture



```

Customer



&#x20;       │



&#x20;       ▼



Channel Engine



&#x20;       │



&#x20;       ▼



Identity Engine



&#x20;       │



&#x20;       ▼



Customer Engine



&#x20;       │



&#x20;       ▼



Customer Intelligence Engine



&#x20;       │



&#x20;       ▼



Conversation Memory



&#x20;       │



&#x20;       ▼



Business Brain



&#x20;       │



&#x20;       ▼



Knowledge Engine



&#x20;       │



&#x20;       ▼



Intent Engine



&#x20;       │



&#x20;       ▼



Confidence Engine



&#x20;       │



&#x20;       ▼



OpenAI



&#x20;       │



&#x20;       ▼



Reply

```



OpenAI is intentionally placed near the end of the pipeline.



Business rules and platform intelligence should make as many decisions as possible before using the LLM.



\---



\# Multi-Tenant Architecture



The platform supports multiple organizations.



Every business entity ultimately belongs to an organization.



Standard key:



```

organization\_id

```



No future feature should assume a single organization.



\---



\# SaaS Structure



\## Platform Console



Used by platform administrators.



Responsibilities



\- Manage organizations

\- Manage subscriptions

\- Manage billing

\- AI usage monitoring

\- Deployment management

\- Template management

\- Global analytics

\- Platform health



\---



\## Organization Command Center



Used by client organizations.



Responsibilities



\- Unified Inbox

\- Customer Management

\- Lead Management

\- Business Brain

\- Knowledge Base

\- Analytics

\- AI Settings

\- Team Management

\- Reply Management



\---



\# Core Business Entities



\## organizations



Represents one customer of the SaaS platform.



\---



\## organization\_users



Users belonging to one organization.



Examples



\- Sales

\- Marketing

\- Support

\- Administrator



\---



\## channels



Connected communication channels.



Examples



\- Instagram

\- WhatsApp

\- Facebook

\- Website Chat

\- Email



\---



\## customers



Master customer record.



One customer may communicate through multiple channels.



\---



\## customer\_channels



Maps one customer to multiple communication identities.



Examples



Instagram ID



WhatsApp Number



Facebook Messenger ID



Website Visitor ID



\---



\## conversations



Stores channel-specific conversations.



Conversation history should remain channel-specific.



Customer intelligence should remain customer-specific.



\---



\## leads



Represents sales opportunities.



Leads should never depend only on conversation history.



They should reference the customer.



\---



\## business\_contexts



Temporary operational knowledge.



Examples



\- Current campaigns

\- Offers

\- Job openings

\- Events

\- Announcements

\- Office closures



Business Context is temporary.



Knowledge Base is permanent.



\---



\# AI Engines



\## Channel Engine



Handles communication with all supported channels.



\---



\## Identity Engine



Identifies customers across channels.



Responsible for:



\- Channel identity

\- Username

\- Display name

\- Cross-channel mapping



\---



\## Customer Engine



Creates and maintains customer records.



Responsible for customer lifecycle.



\---



\## Customer Intelligence Engine



Continuously extracts structured customer knowledge.



Examples



\- Interests

\- Requirements

\- Education

\- Experience

\- Preferences

\- Location

\- Contact details



\---



\## Conversation Engine



Maintains conversation history and context.



\---



\## Business Brain



Stores temporary business intelligence.



Examples



Today's offer



Today's recruitment



Today's campaign



Today's announcement



Current business priorities



Business Brain should influence every AI reply.



\---



\## Knowledge Engine



Provides long-term organizational knowledge.



Examples



Products



Services



FAQs



Policies



Training material



Knowledge remains relatively permanent.



\---



\## Intent Engine



Determines customer intent before LLM processing.



\---



\## Confidence Engine



Determines whether AI should reply automatically or move to Human Queue.



\---



\## Lead Engine



Creates, qualifies and enriches sales leads.



\---



\## Sales Intelligence Engine (Future)



Creates sales-ready summaries.



Outputs



\- Lead Brief

\- Next Best Action

\- Lead Temperature

\- Sales Pitch

\- AI Confidence



\---



\# Customer Intelligence Philosophy



Conversation history alone is not enough.



Every interaction should continuously improve the Customer Profile.



Customer Profile becomes the primary source of truth.



Eventually it will contain



\- Identity

\- Interests

\- Requirements

\- Contact information

\- Preferences

\- AI Summary

\- Lead Score

\- Lead Temperature

\- Sales Brief

\- Recommended Next Action



\---



\# Business Brain Philosophy



Business Brain represents the organization's current operational memory.



Unlike Knowledge Base, Business Brain changes frequently.



Examples



Today we launched SAP MM Weekend Batch.



Offer ends Friday.



Office closed tomorrow.



Recruiting SAP HCM Freshers.



The AI should automatically consider Business Brain before generating replies.



Business owners should maintain Business Brain using natural language.



\---



\# Cross-Channel Identity



Customer merge rules



Automatic



\- Phone number match



Manual Review



\- Email

\- Name

\- Similar profile

\- Similar location

\- Customer explicitly mentions another channel



\---



\# Current Technology Stack



Backend



\- FastAPI

\- Supabase

\- OpenAI

\- Render

\- Instagram Graph API



Frontend



\- Next.js

\- Tailwind CSS



\---



\# Current Implementation Status



Implemented



\- Instagram Webhook

\- Conversation Memory

\- Intent Engine

\- Reply Bank

\- Customer Engine

\- Identity Engine

\- Customer Intelligence Engine

\- Business Context Engine

\- Business Context API

\- Unified Inbox

\- Manual Reply



In Progress



\- Business Brain UI

\- Customer Intelligence UI

\- Sales CRM



Planned



\- Organization Management

\- Multi-tenant Platform

\- WhatsApp

\- Facebook

\- Website Chat

\- Analytics

\- Billing



\---



\# Design Principles



1\. Platform must remain industry independent.



2\. Industry knowledge belongs in organization configuration.



3\. Business Brain stores temporary operational information.



4\. Knowledge Base stores permanent business knowledge.



5\. Customers remain the central business entity.



6\. Conversations belong to customers.



7\. Leads belong to customers.



8\. Every organization remains isolated.



9\. AI should reply only when sufficiently confident.



10\. Human users should receive structured business intelligence rather than raw conversations.



\---



\# Documentation



The project maintains the following permanent documents.



PROJECT\_PROGRESS.md



Current implementation status.



SYSTEM\_ARCHITECTURE.md



Long-term technical architecture.



PRODUCT\_ROADMAP.md



Future product roadmap.



DECISIONS.md



Important architectural decisions.



IDEAS\_BACKLOG.md



Future ideas.



CHANGELOG.md (planned)



Chronological development history.

