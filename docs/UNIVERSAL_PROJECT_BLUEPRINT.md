# Universal Project Blueprint

A platform-agnostic framework for planning, building, managing, and handing off any modern web or app development project. Derived from real-world experience building production applications using a multi-AI, multi-tool workflow.

---

## Table of Contents

1. [The Multi-AI Development Workflow](#the-multi-ai-development-workflow)
2. [Universal File Structure](#universal-file-structure)
3. [Project Lifecycle Phases](#project-lifecycle-phases)
4. [Project Management Framework](#project-management-framework)
5. [The Living Handoff System](#the-living-handoff-system)
6. [Milestone Tracking Template](#milestone-tracking-template)
7. [Handoff Checklist](#handoff-checklist)
8. [Free-Tier Infrastructure Guide](#free-tier-infrastructure-guide)
9. [Risk Management](#risk-management)

---

## The Multi-AI Development Workflow

Modern development is not about one tool. It is about orchestrating multiple AI systems, each used for what it does best. The following workflow has been tested and refined across real projects.

### Stage 1: Ideation (Manus AI or equivalent)

**Purpose:** Transform a vague concept into a structured product spec.

**Input:** Your raw idea, target audience, and 2-3 reference apps.

**Output:**
- Color palette and design language
- Feature list (prioritized as Must/Should/Could/Won't)
- User flow diagrams
- Component hierarchy

**Validation step:** Upload the design output to a second AI (Claude, GPT, Gemini) and ask:
- "What is missing from this design?"
- "What would break at scale?"
- "Is this achievable with free-tier tools?"

### Stage 2: Research and Validation (Gemini Deep Research or equivalent)

**Purpose:** Verify technical feasibility and discover free-tier tools.

**Input:** The validated design spec from Stage 1.

**Tasks:**
- Identify the best free-tier database, hosting, and AI providers
- Check API rate limits and pricing tiers
- Find open-source alternatives for paid services
- Verify that your chosen stack can handle the feature list

**Output:** A confirmed technology stack with fallback options for every paid service.

### Stage 3: Architecture Finalization (Claude or equivalent)

**Purpose:** Lock down the technical blueprint before writing code.

**Input:** The validated spec + confirmed tech stack.

**Output:**
- Database schema (every table, column, relationship, index)
- API contracts (method, path, request/response JSON shapes)
- Component tree (what renders what, data flow)
- Step-by-step implementation plan (ordered by dependency)
- File structure

**Critical rule:** This document becomes the "Constitution" of the project. Every coding decision references it. If you skip this step, you will waste 40% of your time on mid-coding architecture debates.

### Stage 4: Implementation (Cursor or equivalent code editor)

**Purpose:** Write the actual code, following the implementation plan.

**Input:** The step-by-step plan from Stage 3 + the living handoff log.

**Workflow:**
1. Paste the implementation plan into the editor
2. Work through it step by step
3. After every session, update the handoff log
4. If you hit a blocker, return to Stage 3 AI for architectural guidance
5. If you hit a bug, use the code editor AI for debugging

### Workflow Diagram

```
Idea
  |
  v
[Manus AI] --> Design Spec + Color Palette
  |
  v
[Claude/GPT] --> Validation ("What's missing?")
  |
  v
[Gemini Research] --> Tech Stack Confirmation + Free Tools
  |
  v
[Claude] --> Database Schema + API Contracts + Implementation Plan
  |
  v
[Cursor] --> Code Implementation (with living handoff log)
  |
  v
[GitHub + Vercel] --> Deploy
```

---

## Universal File Structure

The following structure works for Next.js, Nuxt, SvelteKit, Remix, or any component-based framework. Adapt folder names to your framework's conventions.

```
project-root/
|
|-- app/                        # Pages and routes
|   |-- (auth)/                 # Authentication routes (login, signup, reset)
|   |-- (public)/               # Public-facing pages (landing, about, pricing)
|   |-- dashboard/              # Protected user area
|   |   |-- page.jsx            # Main dashboard
|   |   |-- settings/           # User settings
|   |   |-- [feature-a]/        # Feature-specific pages
|   |   |-- [feature-b]/
|   |   |-- layout.jsx          # Shared layout (navbar, sidebar)
|   |-- api/                    # Backend API routes
|   |   |-- auth/               # Auth callbacks
|   |   |-- [resource]/         # CRUD endpoints per resource
|   |   |-- ai/                 # AI-powered endpoints
|   |   |-- admin/              # Admin-only endpoints
|   |-- layout.jsx              # Root layout (fonts, metadata, providers)
|   |-- page.jsx                # Landing page
|
|-- components/                 # Reusable UI components
|   |-- ui/                     # Primitive UI (buttons, inputs, modals)
|   |-- features/               # Feature-specific components
|   |-- layout/                 # Layout components (navbar, sidebar, footer)
|   |-- charts/                 # Data visualization components
|
|-- lib/                        # Shared logic (NO UI here)
|   |-- db.js                   # Database client initialization
|   |-- db-server.js            # Server-side database client
|   |-- ai.js                   # AI client and prompt templates
|   |-- schemas/                # Zod/Yup validation schemas per resource
|   |-- utils.js                # Formatting, helpers, constants
|   |-- constants.js            # App-wide constants (categories, enums)
|
|-- public/                     # Static assets
|   |-- manifest.json           # PWA manifest
|   |-- icons/                  # App icons
|
|-- docs/                       # Living documentation
|   |-- PROJECT_HANDOFF.md      # Current state + changelog (THE critical file)
|   |-- PRODUCT_SPEC.md         # Original product specification
|   |-- ARCHITECTURE.md         # Technical architecture guide
|   |-- BLUEPRINT.md            # This file (development process)
|
|-- database/                   # Database migrations and seeds
|   |-- schema.sql              # Full schema (run once)
|   |-- migrations/             # Incremental changes
|   |-- seeds/                  # Test data
|
|-- .env.local                  # Environment variables (NEVER commit)
|-- .env.example                # Template for env vars (commit this)
|-- .gitignore
|-- package.json
|-- README.md                   # Setup instructions (emoji-free, professional)
```

### File Structure Rules

1. **One resource = one API folder.** `/api/users/`, `/api/posts/`, `/api/payments/`.
2. **One schema = one file.** `lib/schemas/user.js`, `lib/schemas/post.js`.
3. **Components never fetch data.** They receive props. Pages or hooks fetch.
4. **`lib/` has zero imports from `components/`.** Logic flows one way: lib -> components.
5. **`docs/` is never optional.** Every project gets a handoff log on Day 1.

---

## Project Lifecycle Phases

Every project, regardless of size, follows these phases. The time allocation changes based on deadline.

| Phase | Solo (1 week) | Hackathon (12 hrs) | Team (1 month) |
|-------|--------------|-------------------|----------------|
| 0. Ideation | 1 day | 1 hour | 3 days |
| 1. Architecture | 1 day | 1 hour | 5 days |
| 2. Backend | 1-2 days | 2-3 hours | 1 week |
| 3. Core UI | 1-2 days | 2-3 hours | 1 week |
| 4. Advanced Features | 1 day | 2 hours | 1 week |
| 5. Polish | 0.5 day | 1 hour | 3 days |
| 6. Launch | 0.5 day | 30 min | 2 days |

### Phase 0: Ideation

**Deliverables:**
- [ ] Problem statement (1 sentence)
- [ ] Target user persona (1 paragraph)
- [ ] Feature list (MoSCoW prioritized)
- [ ] Color palette and design language
- [ ] 3 competitor/reference apps analyzed

### Phase 1: Architecture

**Deliverables:**
- [ ] Database schema (tables, columns, relationships, indexes)
- [ ] API route contracts (method, path, request/response shapes)
- [ ] Component tree diagram
- [ ] Technology stack confirmation (with free-tier verification)
- [ ] Step-by-step implementation plan
- [ ] Living handoff log initialized

### Phase 2: Backend

**Deliverables:**
- [ ] Database schema executed and verified
- [ ] All CRUD API routes with validation
- [ ] Authentication flow (signup, login, session management)
- [ ] Row-level security or equivalent authorization
- [ ] API routes tested via console/Postman

### Phase 3: Core UI

**Deliverables:**
- [ ] Auth pages (login, signup, password reset)
- [ ] Onboarding flow (if applicable)
- [ ] Main CRUD interface (create, read, update, delete)
- [ ] Navigation (navbar, sidebar, mobile bottom nav)
- [ ] Loading states and error boundaries

### Phase 4: Advanced Features

**Deliverables:**
- [ ] Data visualization (charts, graphs, dashboards)
- [ ] AI integrations (chat, classification, generation)
- [ ] File processing (upload, parse, import/export)
- [ ] Search, filter, and sort functionality
- [ ] Notifications or alerts

### Phase 5: Polish

**Deliverables:**
- [ ] Responsive design verified on mobile
- [ ] Console warnings eliminated
- [ ] Timezone and locale handling confirmed
- [ ] User management (logout, delete account, profile edit)
- [ ] Performance audit (no unnecessary re-renders, lazy loading)

### Phase 6: Launch

**Deliverables:**
- [ ] README.md with setup instructions
- [ ] Environment variables documented
- [ ] Deployed to hosting platform
- [ ] Git repository clean (no secrets, no node_modules)
- [ ] Handoff log finalized

---

## Project Management Framework

### The "Kanban Column" System

Maintain a simple status for every feature:

| Status | Meaning |
|--------|---------|
| Planned | In the spec but no code written |
| In Progress | Currently being built |
| Blocked | Waiting on external dependency or decision |
| Done | Working, tested, and merged |
| Cut | Removed from scope (document why) |

### Decision Log

Every architectural decision gets logged. Format:

```markdown
### Decision: [Title]
- Date: YYYY-MM-DD
- Context: What situation prompted this decision?
- Options considered: What alternatives existed?
- Decision: What was chosen and why?
- Consequences: What trade-offs were accepted?
```

Example:
```markdown
### Decision: Tesseract.js over Groq Vision
- Date: 2026-05-16
- Context: Groq removed vision models from free tier
- Options: (a) Pay for vision API (b) Use Tesseract.js locally (c) Remove feature
- Decision: Tesseract.js + Groq text model pipeline
- Consequences: Slower OCR (~5s), but zero cost and no API dependency
```

### Session Log Format

After every coding session, append one entry:

```markdown
### YYYY-MM-DD -- Short title
- **Ask:** What was requested
- **Changed:** `path/file` -- one-line what and why
- **Product:** What the user can do now
- **Blocked:** Any issues preventing progress
- **Next:** What to do in the next session
```

---

## The Living Handoff System

This is the most critical part of the entire framework. The handoff log is the "brain" of your project. It ensures that any person or AI can resume work at any point.

### Handoff Log Template

```markdown
# [Project Name] -- Living Handoff Log

> **Purpose:** Single source of truth for current state and every change.
> **Use when:** Switching editors, handing to a teammate, or resuming after a break.

**Last updated:** YYYY-MM-DD
**Code location:** [path or repo URL]
**Spec:** [path to product spec]
**Strategy:** [e.g., "Backend first" or "Feature-complete MVP"]

---

## Quick Start

[bash commands to get running]

## Environment Variables

| Variable | Where to get it | Required? |
|----------|----------------|-----------|

## Current Status (at a glance)

| Area | Status | Main files |
|------|--------|------------|

## Architecture (30 seconds)

[Simple diagram: User -> Frontend -> API -> Database -> AI]

## Key Files Map

### Pages
| Path | Role |
|------|------|

### API Routes
| Route | Methods | Purpose |
|-------|---------|---------|

### Shared Logic
| File | Role |
|------|------|

### Components
| Component | Status | Used on |
|-----------|--------|---------|

## Changelog (newest first)

[Session logs go here]

## Next Up

[Prioritized checklist of remaining work]

## Prompt Template (for any AI)

[Copy-paste prompt to onboard a new AI assistant]
```

### Handoff Rules

1. **Update after every session.** No exceptions. If the AI did not update it, you do it manually.
2. **Newest changes first.** The changelog reads top-to-bottom as newest-to-oldest.
3. **Include the "Next Up" section.** This is what makes resumption instant.
4. **Include a prompt template.** A copy-paste block that any AI can use to get oriented.
5. **Never delete old entries.** The log is append-only. History matters.

---

## Milestone Tracking Template

Use this table at the top of your handoff log to track progress at a glance.

```markdown
## Milestones

| # | Milestone | Target Date | Status | Notes |
|---|-----------|-------------|--------|-------|
| 1 | Spec + Schema finalized | Day 1 | Done | |
| 2 | All API routes working | Day 2 | Done | |
| 3 | Auth flow complete | Day 3 | Done | |
| 4 | Core CRUD UI working | Day 3 | Done | |
| 5 | Dashboard with charts | Day 4 | Done | |
| 6 | AI features integrated | Day 5 | In Progress | Chat done, insights pending |
| 7 | Polish + bug fixes | Day 6 | Planned | |
| 8 | README + deploy | Day 6 | Planned | |
```

### Milestone Definition Rules

1. Each milestone must have a **verifiable outcome** (not "work on X" but "X is working").
2. Milestones are **ordered by dependency** (you cannot do #5 before #2).
3. No milestone should take more than **2 days** for a solo developer.
4. If a milestone is blocked for more than 4 hours, **split it** or **cut scope**.

---

## Handoff Checklist

Use this checklist when transitioning a project to a different developer, editor, or AI assistant.

### Code Readiness

- [ ] All code is committed and pushed to the repository
- [ ] No uncommitted changes or stashed work
- [ ] Branch strategy is documented (main only? feature branches?)
- [ ] `.env.example` exists with all required variables listed
- [ ] `package.json` scripts section is complete (`dev`, `build`, `start`, `lint`)

### Documentation Readiness

- [ ] `README.md` has setup instructions that work from a fresh clone
- [ ] `PROJECT_HANDOFF.md` is current (last session is logged)
- [ ] "Next Up" section has clear, actionable items
- [ ] Prompt template is included for AI onboarding
- [ ] Architecture diagram exists (even if simple ASCII)

### Database Readiness

- [ ] Schema file exists and can be run from scratch
- [ ] Migrations are ordered and documented
- [ ] Row-level security is enabled on all user-facing tables
- [ ] Test data or seed scripts exist (if applicable)

### Infrastructure Readiness

- [ ] Hosting platform identified and configured
- [ ] Environment variables are set in production
- [ ] Domain/DNS configured (if applicable)
- [ ] Storage buckets created with correct policies
- [ ] API keys are active and have sufficient quota

### Knowledge Transfer

- [ ] Known bugs and workarounds are documented
- [ ] Decisions that were NOT obvious are logged in the Decision Log
- [ ] Free-tier limitations are documented
- [ ] Third-party API rate limits are noted

---

## Free-Tier Infrastructure Guide

| Need | Free Option | Limits | Fallback |
|------|------------|--------|----------|
| Frontend Hosting | Vercel | 100GB bandwidth/mo | Netlify, Cloudflare Pages |
| Database | Supabase | 500MB, 50k rows | PlanetScale, Neon |
| Authentication | Supabase Auth | 50k MAU | Clerk, Auth.js |
| File Storage | Supabase Storage | 1GB | Cloudflare R2 |
| AI Text Models | Groq | Rate limited | Together.ai, Hugging Face |
| AI Vision | Tesseract.js | None (runs locally) | OCR.space (25k req/mo) |
| PDF Parsing | pdfjs-dist | None (runs locally) | pdf-parse |
| Email | Resend | 100 emails/day | Mailgun |
| Analytics | Plausible Cloud | 10k pageviews/mo | Umami (self-host) |
| Monitoring | Sentry | 5k errors/mo | LogRocket |
| CI/CD | GitHub Actions | 2000 min/mo | None needed |
| Domain | Freenom/GitHub Pages | Subdomain only | Namecheap ($1/yr) |

### Rule: Always have a fallback

For every paid or rate-limited service in your stack, identify a free alternative before you start coding. If the service goes down or changes pricing mid-project, you should be able to swap in the fallback within 2 hours.

---

## Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Free-tier API removed or rate-limited | High | Critical | Always have a local fallback (Tesseract, pdfjs) |
| Database hits row/storage limit | Medium | High | Monitor usage; archive old data early |
| AI returns unparseable responses | High | Medium | Never trust AI JSON; always extract with indexOf/lastIndexOf |
| Session/auth breaks silently | Medium | High | Test auth flow after every deployment |
| Timezone bugs | High | Low | Always store UTC; convert on display only |
| SSR/hydration mismatches | High | Medium | Lazy-load browser-only libraries; use "use client" |
| Scope creep | Very High | Critical | Reference the MoSCoW list; if it is not a "Must", it waits |

---

## The Golden Rules

1. **Spec before code.** The implementation plan is the most valuable deliverable.
2. **Backend before frontend.** APIs first, UI second.
3. **One source of truth.** The handoff log is the "brain." Update it religiously.
4. **Free does not mean fragile.** Free-tier tools are production-ready if you respect their limits.
5. **Polish is not optional.** Loading states, error messages, and correct timezones separate amateur from professional.
6. **Documentation is a feature.** If a stranger cannot run your project in 5 minutes, your docs are incomplete.
7. **Build for the laziest user.** Every feature should reduce friction, not add steps.
