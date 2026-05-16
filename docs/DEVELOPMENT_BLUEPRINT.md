# Development Blueprint: SpendSense

A reusable reference for building full-stack AI applications from scratch.
Based on the complete development lifecycle of SpendSense, a student financial dashboard.

---

## Phase 0: Ideation and Scoping (Day 0)

### What I Did

1. Identified the core problem: Students receive money periodically (weekly/monthly) and have no simple way to track if they will survive until the next transfer.
2. Defined the target user: Indian college students who use UPI apps (PhonePe, GPay) and eat out frequently.
3. Chose a "killer feature" to differentiate: AI-powered financial coaching that actually understands Indian student life.

### Key Decisions

| Decision | Why |
|----------|-----|
| Mobile-first PWA | Students live on their phones |
| Supabase over Firebase | PostgreSQL with Row Level Security out of the box |
| Groq over OpenAI | Free tier, fast inference, good enough for text tasks |
| Next.js App Router | Full-stack in one repo, API routes built in |

### Reusable Lesson

> Before writing a single line of code, answer: Who is the user? What is the ONE thing they need that nothing else does well? For SpendSense it was: "Will I survive until Dad sends money next week?"

---

## Phase 1: Architecture and Foundation (Day 1)

### What I Did

1. Created a detailed Product Specification (`docs/SpendSense_Guide.md`) covering:
   - Database schema (every table, column, and relationship)
   - API route contracts (method, path, request/response shapes)
   - Component tree (what goes where)
   - Phased delivery plan (what to build first)

2. Set up the project scaffold:
   - `npx create-next-app` for the framework
   - Supabase project for database and auth
   - Folder structure matching the spec

3. Created a Living Handoff Log (`docs/PROJECT_HANDOFF.md`):
   - Updated after every single coding session
   - Contains status matrix, changelog, and "next up" checklist
   - Designed so any AI or human can pick up where the last one left off

### File Structure Strategy

```
app/
  (auth)/login, signup     -- Auth pages
  dashboard/               -- Protected area
    page.jsx               -- Main dashboard
    transactions/           -- CRUD page
    history/                -- Archive
    budgets/                -- Budget management
    chat/                   -- AI assistant
  api/                      -- Backend routes
    transactions/           -- CRUD API
    ai/chat, insights, receipt, categorize, statement
    budgets/, balance/, gold/, csv/
    dashboard/summary       -- Aggregation endpoint
    user/delete             -- Account management
components/                 -- Reusable UI
lib/                        -- Shared logic (schemas, clients, utils)
docs/                       -- Living documentation
supabase/                   -- SQL migrations
```

### Reusable Lesson

> The spec document is not optional. It is the single most important deliverable of Day 1. Without it, you will waste 40% of your time on "what should this API return?" decisions mid-coding.

---

## Phase 2: Backend First (Day 1-2)

### What I Did

1. Wrote and executed the full database schema (`supabase/schema.sql`):
   - Tables, indexes, wallet balance trigger, Row Level Security
   - Ran it once in the Supabase SQL Editor

2. Built all API routes with strict validation:
   - Used Zod schemas for every request/response
   - Signed amounts (expenses negative, income positive) to simplify wallet math
   - Soft-delete pattern (never actually remove data)

3. Tested APIs using browser DevTools:
   - Sign up once, stay logged in
   - Use `fetch('/api/transactions')` in the console to verify

### Strategy: Why Backend First?

| Advantage | Impact |
|-----------|--------|
| UI can be stubs | Frontend developers or AI can work in parallel |
| Test without design | Verify correctness before investing in polish |
| Fewer rework loops | Data model is locked down early |
| API contracts are stable | Frontend knows exactly what to `fetch()` |

### Reusable Lesson

> Build the "engine" before the "paint job." A beautiful UI on top of broken APIs is worse than an ugly UI on a solid backend. Test every API route before touching a single component.

---

## Phase 3: Core UI and Auth Flow (Day 2-3)

### What I Did

1. Implemented the authentication flow:
   - Login/Signup pages with Supabase Auth
   - Middleware-based route protection
   - Onboarding flow for new users (profile setup, initial balance)

2. Built the Transaction CRUD interface:
   - `TransactionForm` (add with AI category suggestion)
   - `TransactionList` (paginated, deletable)
   - `TransactionsView` (wires form + list + scanner together)

3. Connected the wallet:
   - Dashboard shows live balance from `wallets` table
   - Wallet auto-updates via database trigger on INSERT
   - Soft-delete adjusts wallet via application code

### Reusable Lesson

> Get the "write path" working end-to-end first (form to database to display). Once users can input and see data, every subsequent feature (charts, AI, export) becomes a read on top of existing data.

---

## Phase 4: Data Visualization (Day 3-4)

### What I Did

1. Built five interactive charts using Recharts:
   - `SurviveIndicator` -- Daily allowance countdown
   - `SpendingDonut` -- Category breakdown (PieChart)
   - `IncomeExpenseBar` -- Cash flow comparison (BarChart)
   - `DailySpendLine` -- 7-day spending trends (AreaChart)
   - `SavingsTrend` -- 30-day wallet growth (AreaChart, step type)

2. Created a single aggregation API (`/api/dashboard/summary`) that returns all data needed by every chart in one call.

3. Design choices:
   - Glassmorphic cards (semi-transparent, blur, borders)
   - Teal color palette (#0D9488, #134E4A, #2DD4BF)
   - Loading skeletons for every async component

### Reusable Lesson

> Never make 5 API calls from 5 charts. Build ONE summary endpoint that aggregates everything, then pass slices of that data to each chart. It is faster, simpler, and easier to cache.

---

## Phase 5: AI Integration (Day 4-5)

### What I Did

1. **AI Chat (Groq Llama 3.3 70B):**
   - System prompt with "Savage Finance Coach" persona
   - Context injection: balance + last 10 transactions sent with every message
   - Action parsing: AI returns JSON to add/delete transactions via chat
   - Persistent history: messages saved to `chat_messages` table

2. **Statement Import (Groq text model):**
   - Local PDF text extraction using `pdfjs-dist` (lazy-loaded to avoid SSR errors)
   - CSV parsing using `papaparse`
   - Raw text sent to Groq for structured transaction extraction

3. **Receipt Scanner (Tesseract.js + Groq):**
   - In-browser OCR using Tesseract.js (no API key needed)
   - Extracted text sent to Groq text model for parsing
   - Client-side image compression before OCR

4. **AI Insights (reveal-on-demand):**
   - Monthly spending summary generated by Groq
   - Cached in `ai_insights` table to avoid repeat API calls
   - "Reveal" button pattern to save space and API costs

### Key AI Architecture Decision

```
Original Plan:  Image --> Vision AI Model --> Structured Data
                (Failed: Groq removed vision models from free tier)

Final Solution:  Image --> Tesseract.js (browser) --> Raw Text --> Text AI --> Structured Data
                (Works: Uses models we already have, zero extra cost)
```

### Reusable Lesson

> Always have a fallback for AI features. Vision models are expensive and unreliable. The "OCR to text, then text model" pipeline is more robust, cheaper, and often more accurate than direct vision. Also: never trust the AI to return perfect JSON -- always extract with `indexOf('{')` and `lastIndexOf('}')`.

---

## Phase 6: Polish and UX (Day 5-6)

### What I Did

1. **User Management:** Added logout, switch user, and delete account to the Navbar.
2. **Timestamp Fixes:** Changed from date-only to full ISO timestamps for accurate IST display.
3. **Recharts Warnings:** Added `minWidth`/`minHeight` to all chart containers.
4. **Layout Order:** Put manual entry above receipt scanner (most common action first).
5. **Duplicate Key Fix:** Used `new Set()` to deduplicate category lists.
6. **Chat Persistence:** Removed hard page reload; chat history now survives navigation.

### Reusable Lesson

> Polish is not optional. The difference between a "student project" and a "portfolio piece" is 20 small fixes: loading states, error messages, correct timezones, smooth animations, and removing console warnings.

---

## Phase 7: Documentation and Launch (Day 6)

### What I Did

1. Created a professional, emoji-free `README.md` with setup instructions.
2. Updated `PROJECT_HANDOFF.md` with every change logged chronologically.
3. Pushed to GitHub with a clean commit message: "Version 1.0 Release."
4. Created this blueprint document for future reference.

### Reusable Lesson

> Documentation is a feature. If you cannot hand your project to a stranger and have them run it in 5 minutes, your documentation is incomplete.

---

## The Toolkit (What I Used and Why)

| Tool | Purpose | Cost |
|------|---------|------|
| Next.js 16 | Full-stack framework (frontend + API) | Free |
| Supabase | Database, Auth, Storage, RLS | Free tier |
| Groq | AI text models (Llama 3.3 70B, 3.1 8B) | Free tier |
| Recharts | Data visualization (Pie, Bar, Area charts) | Free |
| Tesseract.js | In-browser OCR for receipt scanning | Free |
| pdfjs-dist | Client-side PDF text extraction | Free |
| Zod | Runtime validation for API requests | Free |
| date-fns | Date formatting and manipulation | Free |
| Lucide React | Icon library | Free |

Total infrastructure cost: **$0**

---

## Common Pitfalls I Hit (and How I Fixed Them)

| Problem | Root Cause | Fix |
|---------|-----------|-----|
| `DOMMatrix is not defined` | pdfjs-dist loaded during SSR | Lazy import inside component |
| `ssr: false` not allowed | Dynamic import in Server Component | Move to Client Component |
| Vision model "failed to process" | Groq removed vision from free tier | Switched to Tesseract.js + text model |
| All transactions show 5:30 AM | Saving date-only string to TIMESTAMPTZ | Save full ISO timestamp |
| Chat history disappears | `window.location.reload()` after action | Removed hard reload |
| Duplicate key warning | "Other" exists in both category lists | `new Set()` to deduplicate |
| Recharts container warnings | Container has 0 size on initial render | Added `minWidth`/`minHeight` |
| Receipt URL validation fails | Zod `.url()` rejects base64 data | Changed to `.string()` |

---

## Hackathon Speed Run (If I Had to Rebuild in 12 Hours)

| Hour | Task |
|------|------|
| 0-1 | Write the spec: tables, API contracts, component tree |
| 1-2 | Set up Next.js, Supabase, Groq. Run schema.sql |
| 2-4 | Build all API routes with Zod validation |
| 4-5 | Auth flow (login, signup, middleware, onboarding) |
| 5-7 | Transaction CRUD (form, list, wallet sync) |
| 7-9 | Dashboard charts (summary API + 3 charts) |
| 9-10 | AI Chat with context injection |
| 10-11 | Receipt scanner (Tesseract.js) |
| 11-12 | Polish, README, deploy to Vercel |

### The Non-Negotiables (Even in a Rush)

1. Zod validation on every API route
2. Row Level Security on every table
3. Loading states on every async component
4. At least one "wow" feature (AI chat or receipt scanner)
5. Clean README with setup instructions

---

## Final Takeaway

The most important lesson from SpendSense is this:

> Build for the user's laziest moment. If they have to type more than 3 fields to log an expense, they will not use the app. Every feature should reduce friction: AI categorization, receipt scanning, chat-based entry, and PDF import all exist because typing "Food and Drinks, 200, Burger, 2026-05-16" is too much work for someone who just wants to know if they can afford dinner tonight.
