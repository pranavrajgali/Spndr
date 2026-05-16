# SpendSense — Living Project Handoff Log

> **Purpose:** Single source of truth for *everything built so far* and *every change made*.  
> **Use this when:** You switch editors (VS Code, Windsurf, another Cursor account), hand work to a teammate, or resume after weeks away.  
> **For new AI assistants:** Read this file **first**, then `docs/SpendSense_Guide.md` (product spec), then `docs/SpendSense_App_Architecture_and_Changes.md` (deeper explanations).

**Last updated:** 2026-05-17  
**Code location:** root `/` (Next.js app)  
**Spec / roadmap:** `docs/SpendSense_Guide.md`  
**Current strategy:** **Backend first** — API routes, DB, auth, validation; UI polish later.

---

## Development strategy: backend first

You chose to nail **data + API + auth** before pretty UI. That fits this project well.

| Why backend first | What it means here |
|-------------------|-------------------|
| UI can be stubbed | Dashboard chart components can stay placeholders while `/api/*` works. |
| Test without design | Use browser DevTools, **Thunder Client**, or **curl** on `http://localhost:3000/api/...` while logged in. |
| Fewer rework loops | Category lists, wallet math, and RLS are defined once in `lib/` + SQL, not scattered in components. |
| Next.js still has “pages” | Auth pages (`login`, `onboarding`) are minimal UI you need anyway to get a session cookie for API tests. |

**Backend =** Supabase SQL + RLS, `middleware.js`, `app/api/**/route.js`, `lib/*` (schemas, wallet, groq, parsers).  
**UI later =** `components/*` charts, forms styling, mobile polish.

**How to test a route while logged in:** Sign up once in the browser → DevTools → Application → Cookies → copy session, or stay logged in and use `fetch` from the browser console on `/api/transactions`.

---

## How to keep this file updated

| Who | What to do |
|-----|------------|
| **You (human)** | After a coding session, add one line under [Changelog](#changelog-newest-first) if the AI didn’t. |
| **Cursor AI** | Project rule `.cursor/rules/update-project-handoff.mdc` requires updating this file in `docs/` after **any** code change. |
| **Other editors** | Paste this file into chat: *“Read docs/PROJECT_HANDOFF.md and continue from Next up.”* |

**Changelog entry format** (copy for each session):

```markdown
### YYYY-MM-DD — Short title
- **Ask:** What you requested
- **Changed:** `path/file.jsx` — one-line what/why
- **Product:** What the user can do now
- **Notes:** Blockers, env, DB migrations needed
```

---

## Quick start (any editor)

```bash
npm install
cp .env.local.example .env.local   # then fill real keys
npm run dev                        # http://localhost:3000
```

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same (anon/public key only) |
| `GROQ_API_KEY` | console.groq.com (server-only, no `NEXT_PUBLIC_`) |

**Database:** Run SQL from `docs/SpendSense_Guide.md` §3 in Supabase SQL Editor + enable RLS before transactions/onboarding work end-to-end.

---

## Current product status (at a glance)

| Area | Status | Main files |
|------|--------|------------|
| Landing `/` | Done | `app/page.jsx` |
| Login / Signup | Done | `app/(auth)/login`, `signup` |
| Middleware auth redirects | Done | `middleware.js` |
| Onboarding (profile + wallet) | Done | `OnboardingFlow.jsx`, `app/onboarding/page.jsx` |
| Dashboard shell (nav) | Done | `app/dashboard/layout.jsx`, `Navbar`, `BottomNav` |
| Dashboard balance card | Done | `app/dashboard/page.jsx` |
| **Transactions CRUD UI** | **Done** | `TransactionForm`, `TransactionList`, `TransactionsView` |
| **Transactions API** | **Done** | `app/api/transactions/route.js` (+ budget sync) |
| **AI categorize (expense/income)** | **Done** | `app/api/ai/categorize/route.js` |
| Wallet fix on soft-delete | Done | `lib/wallet.js` |
| **Budgets API** | **Done** | `app/api/budgets`, `budgets/recalculate` |
| **Balance API** | **Done** | `app/api/balance/route.js` |
| **Gold API** | **Done** | `app/api/gold/route.js` |
| **CSV import API** | **Done** | `app/api/csv`, `app/api/csv/confirm` |
| **Dashboard summary API** | **Done** | `app/api/dashboard/summary` (backend test endpoint) |
| **Supabase schema file** | **Ready to run** | `supabase/schema.sql` |
| AI chat API | Done (no UI) | `app/api/ai/chat/route.js` |
| AI insights / receipt | Partial | routes exist; need keys + testing |
| Charts on dashboard | Stub UI | use `GET /api/dashboard/summary` when wiring |

---

## Architecture cheat sheet (30 seconds)

```
User browser → Next.js pages (React)
            → fetch("/api/...") → route.js (server)
            → Supabase (Postgres + Auth)
            → Groq (AI, server-only key)
```

- **Expenses** stored as **negative** `amount` in DB; **income** positive. Wallet trigger: `balance += amount` on INSERT.
- **Soft delete:** `is_deleted = true`; wallet adjusted in code (`lib/wallet.js`) because trigger only runs on hard DELETE.

---

## Key files map (what helps what)

### Pages (`app/`)

| Path | Role |
|------|------|
| `layout.jsx` | Site-wide font, metadata, PWA manifest link |
| `page.jsx` | Public landing |
| `(auth)/login/page.jsx` | Email/password login |
| `(auth)/signup/page.jsx` | Sign up → onboarding |
| `onboarding/page.jsx` | Server gate; renders `OnboardingFlow` |
| `dashboard/layout.jsx` | Requires profile; navbar + bottom nav |
| `dashboard/page.jsx` | Wallet balance + chart placeholders |
| `dashboard/transactions/page.jsx` | Full add/list transaction flow |

### API (`app/api/`)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/transactions` | GET, POST, PATCH, DELETE | List (paginated), create, soft-delete |
| `/api/ai/categorize` | POST | Groq category from description + type |
| `/api/ai/chat` | POST | NL → transaction / delete last |
| `/api/ai/insights` | POST | Monthly summary (cached in DB) |
| `/api/ai/receipt` | POST | Vision parse receipt URL |
| `/api/budgets` | GET, POST, PATCH | Monthly budgets + `percent_used`, over/warning flags |
| `/api/budgets/recalculate` | POST | Rebuild `spent_amount` from transactions |
| `/api/gold` | GET, POST | Gold ledger + `grams_owned` summary |
| `/api/balance` | GET, POST | Wallet read / set absolute balance + log |
| `/api/csv` | POST | Parse storage file; optional `categorize: true` |
| `/api/csv/confirm` | POST | Bulk insert reviewed rows (`skip` for duplicates) |
| `/api/dashboard/summary` | GET | Month aggregates (income, expense, top category, budgets at risk) |
| `/api/auth/[...supabase]` | GET | OAuth/email callback code exchange |

### Lib (`lib/`)

| File | Role |
|------|------|
| `supabase.js` | Browser Supabase client |
| `supabase-server.js` | Server client + `getUser()` |
| `groq.js` | Groq SDK, prompts, models |
| `categories.js` | 13 expense + 8 income category names |
| `schemas/transaction.js` | Zod validation + signed amounts |
| `wallet.js` | Reverse wallet on soft-delete |
| `budgets.js` | Update `spent_amount` on txn add/remove; recalculate helper |
| `csvParser.js` | PapaParse normalize bank CSV rows |
| `csvImport.js` | Batch categorize + duplicate detection |
| `schemas/budget.js`, `balance.js`, `gold.js`, `csv.js` | Zod validation per API |
| `utils.js` | `cn`, `formatCurrency`, `formatDate` |

### Components (`components/`)

| Component | Status | Used on |
|-----------|--------|---------|
| `TransactionForm` | Implemented | `/dashboard/transactions` |
| `TransactionList` | Implemented | same |
| `TransactionsView` | Implemented | wires form + list refresh |
| `OnboardingFlow` | Implemented | `/onboarding` |
| `Navbar`, `BottomNav` | Implemented | dashboard layout |
| `SpendingDonut`, `IncomeExpenseBar`, `DailySpendLine`, `SavingsTrend` | Stub | dashboard |
| `BudgetCard`, `BudgetProgress` | Stub | budgets page |
| `ReceiptScanner` | Stub | receipts page |
| `GoldTracker`, `GoldChart` | Stub | gold page |
| `ChatBot`, `CSVImport` | Stub | chat page |
| `HistorySection`, `AIInsights`, `SurviveIndicator` | Stub | history / dashboard |

---

## Changelog (newest first)

### 2026-05-17 — Backend batch: DB schema, budgets, CSV, gold, summary
- **Ask:** Continue backend work; update handoff as you go.
- **Changed:**
  - `supabase/schema.sql` — all tables, indexes, wallet trigger, RLS policies (run in Supabase)
  - `lib/budgets.js`, `lib/schemas/*` — budget/balance/gold/csv validation
  - `lib/csvImport.js` — batch AI categorize + duplicate flags
  - `app/api/budgets/route.js` — Zod, alert/over flags on GET
  - `app/api/budgets/recalculate/route.js` — sync spent from transactions
  - `app/api/balance/route.js` — set balance with adjustment log
  - `app/api/gold/route.js` — validated buy/sell + grams summary
  - `app/api/csv/route.js` + `csv/confirm/route.js` — parse → review → bulk insert
  - `app/api/dashboard/summary/route.js` — monthly aggregates for charts later
  - `app/api/transactions/route.js`, `app/api/ai/chat/route.js` — hook budget spent on add/remove
- **Product:** Backend can manage budgets, wallet corrections, gold entries, CSV pipeline, and month stats without new UI. Run `schema.sql` in Supabase to activate DB.
- **Notes:** Create Storage bucket `csv-imports`. Test APIs while logged in. UI still stubs for charts/budgets pages.

### 2026-05-16 — Backend-first development strategy
- **Ask:** Focus on backend before UI changes.
- **Changed:** `docs/PROJECT_HANDOFF.md` — added strategy section; reordered “Next up” into backend vs UI tracks.
- **Product:** No code change; roadmap prioritizes API/DB work.
- **Notes:** Existing transaction UI can stay; new work should target `app/api/` and Supabase until backend checklist is done.

### 2026-05-16 — Living handoff log created
- **Ask:** Persistent MD updated on every change for continuing in other editors after Cursor credits end.
- **Changed:**
  - `docs/PROJECT_HANDOFF.md` — this file (master log + status matrix + changelog template)
  - `.cursor/rules/update-project-handoff.mdc` — Cursor rule to update this file after code changes
  - `docs/SpendSense_App_Architecture_and_Changes.md` — linked to this handoff log
- **Product:** No user-facing change; documentation / continuity only.
- **Notes:** True auto-sync requires you (or AI) to append changelog entries; Cursor rule enforces updates when using Cursor.

### 2026-05-16 — Transactions + onboarding polish (implementation session)
- **Ask:** Continue building after initial scaffold.
- **Changed:**
  - `app/api/transactions/route.js` — Zod validation, pagination, signed amounts, PATCH/DELETE soft-delete
  - `lib/schemas/transaction.js`, `lib/wallet.js` — validation + wallet reversal on soft-delete
  - `components/TransactionForm.jsx`, `TransactionList.jsx`, `TransactionsView.jsx` — full UI
  - `app/api/ai/categorize/route.js` — income vs expense categories
  - `app/api/ai/chat/route.js` — wallet adjust on chat delete; correct income sign
  - `middleware.js`, `app/dashboard/layout.jsx`, `app/onboarding/page.jsx` — profile-based redirects
  - `app/dashboard/page.jsx` — live wallet balance
  - `docs/SpendSense_App_Architecture_and_Changes.md` — student-friendly architecture doc
- **Product:** Users can add/list/remove transactions with AI category suggest; wallet stays consistent on delete; onboarding/dashboard routing works with profile row.
- **Notes:** Charts and most secondary pages still stubs.

### 2026-05-16 — Initial scaffold
- **Ask:** Build project structure from `docs/SpendSense_Guide.md` §6.
- **Changed:** Created Next.js app, folder tree, API route stubs, component stubs, `middleware.js`, lib clients, shadcn button, `public/manifest.json`.
- **Product:** Runnable shell; login/signup/onboarding paths exist; most features placeholder UI.
- **Notes:** App lives in the root directory.

---

## Next up — backend first (do these before UI polish)

1. [ ] **Run** `supabase/schema.sql` in Supabase SQL Editor
2. [ ] **Storage:** Create private bucket `csv-imports` + upload policy for authenticated users
3. [ ] **Manual API test:** `GET /api/dashboard/summary` while logged in (DevTools → fetch)
4. [ ] **Test budgets:** POST budget → POST expense in category → GET budgets (spent should rise)
5. [ ] **Test CSV:** upload file to Storage → POST `/api/csv` → POST `/api/csv/confirm`
6. [ ] **AI routes:** Harden `insights` + `receipt` with Zod (chat/categorize done)
7. [ ] **Optional:** Gold auto-create linked `transactions` row on buy/sell (guide mentions it)

---

## Next up — UI later (when backend checklist is solid)

1. [ ] Wire charts to aggregated API responses (or new `/api/dashboard/summary` route)
2. [ ] `BudgetCard` / `BudgetProgress` → `/api/budgets`
3. [ ] `ChatBot` → `/api/ai/chat`
4. [ ] `CSVImport` + `ReceiptScanner` → storage + AI routes
5. [ ] Design polish (colors, glass cards, PWA icons)
6. [ ] Deploy to Vercel with env vars

---

## Related docs

| File | Use when |
|------|----------|
| `docs/SpendSense_Guide.md` | Original product spec, SQL, design, phased roadmap |
| `docs/SpendSense_App_Architecture_and_Changes.md` | Long-form “how it works” for learning |
| `docs/PROJECT_HANDOFF.md` | **This file** — current state + every change log |

---

## Prompt template for any AI (copy-paste)

```
I'm continuing SpendSense. Read docs/PROJECT_HANDOFF.md first.
Code is at the root. Backend-first: follow "Next up — backend first" before UI tasks.
After you change code, append a new changelog entry to docs/PROJECT_HANDOFF.md (newest first).
Do not skip updating docs/PROJECT_HANDOFF.md.
```
