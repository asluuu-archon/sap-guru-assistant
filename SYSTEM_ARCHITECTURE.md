\# AI Command Center - System Architecture



> Last Updated: 2026-06-30



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



The SAP Guru is the first organization/workspace.



\---



\# Architecture Philosophy



The platform is built around one principle:



> AI should behave like a knowledgeable employee rather than a chatbot.



The platform's primary purpose is to build and maintain a Customer Brain.



Replying is only one capability that uses the accumulated understanding.



\---



\# High-Level Architecture



```text

Incoming Business Event

&#x20;       ↓

Channel Engine

&#x20;       ↓

Message Pipeline

&#x20;       ↓

MessageContext

&#x20;       ↓

Customer Stage

&#x20;       ↓

Identity Stage

&#x20;       ↓

Conversation Stage

&#x20;       ↓

Customer Brain Stage

&#x20;       ↓

Business Brain Stage

&#x20;       ↓

Knowledge Engine

&#x20;       ↓

Intent Stage

&#x20;       ↓

Confidence / Reply Decision Stage

&#x20;       ↓

Reply Generation Stage

&#x20;       ↓

Lead Stage

&#x20;       ↓

Channel Engine









Message Pipeline



The Message Pipeline is the central orchestrator for incoming business events.



Current connected stages:



Customer Stage

Identity Stage



Next stage:



Conversation Stage



Future stages:



Customer Brain Stage

Business Brain Stage

Intent Stage

Reply Decision Stage

Reply Generation Stage

Lead Stage

MessageContext



MessageContext is the shared object passed through all pipeline stages.



Each stage reads from and enriches the same context object.



Purpose:



Keep app.py small

Avoid duplicate logic across channels

Make future channels easier to add

Allow every stage to contribute intelligence

Conversation Stage



Purpose:



Load previous customer conversation and enrich MessageContext.



Responsibilities:



Load previous conversation history

Detect first-time versus returning customer

Provide previous context to downstream stages



Does not:



Generate replies

Detect intent

Capture leads

Multi-Tenant Architecture



The platform supports multiple organizations.



Every business entity ultimately belongs to an organization.



Standard key:



organization\_id



No future feature should assume a single organization.



SaaS Structure

Platform Console



Used by platform administrators.



Responsibilities:



Manage organizations

Manage subscriptions

Manage billing

AI usage monitoring

Deployment management

Template management

Global analytics

Platform health

Organization Command Center



Used by client organizations.



Responsibilities:



Unified Inbox

Customer Management

Lead Management

Business Brain

Knowledge Base

Analytics

AI Settings

Team Management

Reply Management

Core Business Entities

organizations



Represents one customer of the SaaS platform.



organization\_users



Users belonging to one organization.



Examples:



Sales

Marketing

Support

Administrator

channels



Connected communication channels.



Examples:



Instagram

WhatsApp

Facebook

Website Chat

Email

customers



Master customer record.



One customer may communicate through multiple channels.



customer\_channels



Maps one customer to multiple communication identities.



Examples:



Instagram ID

WhatsApp Number

Facebook Messenger ID

Website Visitor ID

conversations



Stores channel-specific conversations.



Conversation history should remain channel-specific.



Customer intelligence should remain customer-specific.



leads



Represents sales opportunities.



Leads should reference the customer.



business\_contexts



Temporary operational knowledge.



Examples:



Current campaigns

Offers

Job openings

Events

Announcements

Office closures



Business Context is temporary.



Knowledge Base is permanent.



AI Engines

Channel Engine



Handles communication with all supported channels.



Identity Engine



Identifies customers across channels.



Responsible for:



Channel identity

Username

Display name

Cross-channel mapping

Customer Engine



Creates and maintains customer records.



Customer Intelligence Engine / Customer Brain



Continuously extracts structured customer knowledge.



Examples:



Interests

Requirements

Education

Experience

Preferences

Location

Contact details

Conversation Engine



Maintains conversation history and context.



Business Brain



Stores temporary business intelligence.



Examples:



Today's offer

Today's recruitment

Today's campaign

Today's announcement

Current business priorities



Business Brain should influence every AI reply.



Knowledge Engine



Provides long-term organizational knowledge.



Examples:



Products

Services

FAQs

Policies

Training material

Intent Engine



Determines customer intent before LLM processing.



Confidence Engine



Determines whether AI should reply automatically or move to Human Queue.



Lead Engine



Creates, qualifies, and enriches sales leads.



Sales Intelligence Engine



Future engine for sales-ready summaries.



Outputs:



Lead Brief

Next Best Action

Lead Temperature

Sales Pitch

AI Confidence

Customer Brain Philosophy



Conversation history alone is not enough.



Every interaction should continuously improve the Customer Brain.



Customer Brain becomes the primary source of truth.



Eventually it will contain:



Identity

Interests

Requirements

Contact information

Preferences

AI Summary

Lead Score

Lead Temperature

Sales Brief

Recommended Next Action

Business Brain Philosophy



Business Brain represents the organization's current operational memory.



Unlike Knowledge Base, Business Brain changes frequently.



Examples:



Today we launched SAP MM Weekend Batch.

Offer ends Friday.

Office closed tomorrow.

Recruiting SAP HCM Freshers.



The AI should automatically consider Business Brain before generating replies.



Business owners should maintain Business Brain using natural language.



Cross-Channel Identity



Customer merge rules:



Automatic:



Phone number match



Manual Review:



Email

Name

Similar profile

Similar location

Customer explicitly mentions another channel



Wrong merges are more dangerous than duplicate customers.



Current Technology Stack



Backend:



FastAPI

Supabase

OpenAI

Render

Instagram Graph API



Frontend:



Next.js

Tailwind CSS

Current Implementation Status



Implemented:



Instagram Webhook

Conversation Memory

Intent Engine

Reply Bank

Customer Engine

Identity Engine

Customer Intelligence Engine

Business Context Engine

Business Context API

Message Pipeline

MessageContext

Customer Stage

Identity Stage

Unified Inbox

Manual Reply



In Progress:



Conversation Stage

Business Brain UI

Customer Intelligence UI

Sales CRM



Planned:



Business Event Pipeline

Organization Management

Multi-tenant Platform

WhatsApp

Facebook

Website Chat

Analytics

Billing

Design Principles

Platform must remain industry independent.

Industry knowledge belongs in organization configuration.

Business Brain stores temporary operational information.

Knowledge Base stores permanent business knowledge.

Customers remain the central business entity.

Conversations belong to customers.

Leads belong to customers.

Every organization remains isolated.

AI should reply only when sufficiently confident.

Human users should receive structured business intelligence rather than raw conversations.

app.py should remain thin.

New capabilities should be added through pipeline stages and engines.

Documentation



The project maintains the following permanent documents:



PROJECT\_PROGRESS.md

SYSTEM\_ARCHITECTURE.md

PRODUCT\_ROADMAP.md

DECISIONS.md

IDEAS\_BACKLOG.md



Planned:



CHANGELOG.md

DATABASE\_SCHEMA.md

API\_REFERENCE.md

DEPLOYMENT.md

FOLDER\_STRUCTURE.md

