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
| **Dashboard summary API** | **Done** | `app/api/dashboard/summary` |
| **Survive Indicator** | **Done** | `components/SurviveIndicator.jsx` (Weekly/Monthly/Flex) |
| **Spending Donut** | **Done** | `components/SpendingDonut.jsx` (Recharts) |
| **Income vs Expense Bar** | **Done** | `components/IncomeExpenseBar.jsx` (Recharts) |
| **AI Chat Assistant** | **Done** | `components/ChatBot.jsx` (with context injection) |
| **Statement Import (PDF/CSV)** | **Done** | `components/StatementImport.jsx`, `api/ai/statement` |
| **Receipt Scanner** | **Done** | `ReceiptScanner.jsx` (Tesseract.js OCR + Groq text) |
| **Supabase schema file** | **Updated** | `supabase/schema.sql` (TIMESTAMPTZ) |
| **AI Insights** | **Done** | `AIInsights.jsx` (reveal-on-demand) |
| **Daily Spend Line** | **Done** | `DailySpendLine.jsx` (7-day area chart) |
| **Savings Trend** | **Done** | `SavingsTrend.jsx` (30-day balance) |
| **History** | **Done** | `HistorySection.jsx` (search + filter + group) |
| **Budgets** | **Done** | `BudgetsView.jsx` (progress + heatmap) |
| **User Management** | **Done** | `Navbar.jsx` (logout + delete), `api/user/delete` |

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
| `TransactionForm` | **Done** | `/dashboard/transactions` |
| `TransactionList` | **Done** | same |
| `TransactionsView` | **Done** | wires form + list + scanner |
| `OnboardingFlow` | **Done** | `/onboarding` |
| `Navbar` | **Done** | dashboard layout (logout + delete account) |
| `BottomNav` | **Done** | dashboard layout |
| `SpendingDonut` | **Done** | dashboard |
| `IncomeExpenseBar` | **Done** | dashboard |
| `DailySpendLine` | **Done** | dashboard |
| `SavingsTrend` | **Done** | dashboard |
| `BudgetsView` | **Done** | `/dashboard/budgets` |
| `ReceiptScanner` | **Done** | `/dashboard/transactions` (Tesseract.js OCR) |
| `ChatBot` | **Done** | `/dashboard/chat` (Savage Coach) |
| `StatementImport` | **Done** | `/dashboard/chat` (PDF/CSV) |
| `HistorySection` | **Done** | `/dashboard/history` (search + filter) |
| `AIInsights` | **Done** | dashboard (reveal-on-demand) |
| `SurviveIndicator` | **Done** | dashboard |
| `GoldTracker`, `GoldChart` | Stub | gold page |

---

## Changelog (newest first)

### 2026-05-16 — Version 1.1 (Polish, OCR, Auth, Savage Mode)
- **Ask:** Fix receipt scanner, add user management, improve timestamps, and add personality.
- **Changed:**
  - `components/ReceiptScanner.jsx` — Complete rewrite using Tesseract.js (in-browser OCR) + Groq text parsing. No vision model needed.
  - `components/Navbar.jsx` — Added user menu with Sign Out and Delete Account features.
  - `app/api/user/delete/route.js` — New API to wipe all user financial data.
  - `lib/groq.js` — "Savage Finance Coach" persona: witty, critical, Indian student slang.
  - `app/api/ai/insights/route.js` — Updated to savage/roast tone.
  - `app/api/transactions/route.js` — Full ISO timestamps (not date-only) for correct IST display.
  - `app/api/ai/chat/route.js` — Same timestamp fix + better JSON extraction.
  - `lib/schemas/receipt.js` — Removed strict URL validation; added category field.
  - All chart components — Added `minWidth`/`minHeight` to fix Recharts container warnings.
  - `components/TransactionsView.jsx` — Manual entry first, scanner below (UX improvement).
- **Product:** Receipt scanner works without vision API. Users can logout/switch/delete. AI has personality. Timestamps are accurate.
- **Notes:** Installed `tesseract.js` for browser-side OCR. Groq vision models not available on free tier.

### 2026-05-16 — Version 1.0 Release (Dashboard & AI Complete)
- **Ask:** Finalize all dashboard charts, implement history/budgets, and polish AI insights.
- **Changed:**
  - `components/HistorySection.jsx` — Searchable, grouped, and filtered transaction archive.
  - `components/BudgetsView.jsx` — Complete budget management system with progress heatmaps.
  - `components/DailySpendLine.jsx` — Smooth area chart for 7-day spending trends.
  - `components/SavingsTrend.jsx` — Step-line chart for 30-day wallet growth visualization.
  - `components/AIInsights.jsx` — Redesigned "Reveal-on-Demand" AI coaching component.
  - `app/api/dashboard/summary` — Updated to provide daily trends and historical balance data.
  - `README.md` — Created professional, emoji-free documentation for launch.
- **Product:** SpendSense is now a complete V1.0 financial powerhouse with 5 interactive charts and a demand-based AI coach.
- **Notes:** All major roadmap items from the guide are now implemented and functional.

### 2026-05-16 — Dashboard Visualization & AI Features (Phase Build)
- **Ask:** Support Weekly/Flexible transfers, build dashboard charts, AI chat, and PDF statement import.
- **Changed:**
  - `user_profile` + `OnboardingFlow` — Added support for Weekly, Monthly, and Flexible transfer frequencies.
  - `transactions` schema — Changed `date` to `TIMESTAMPTZ` for automatic precise time tracking.
  - `components/SurviveIndicator.jsx` — Live daily allowance calculator with student-focused countdown.
  - `components/SpendingDonut.jsx` — Interactive Recharts donut for category breakdown.
  - `components/IncomeExpenseBar.jsx` — Side-by-side comparison with savings/overspending status.
  - `components/ChatBot.jsx` — AI Assistant with spending context injection (Groq).
  - `components/StatementImport.jsx` — Intelligent PDF/CSV parser using local extraction + Groq.
  - `app/api/ai/statement` — New route for AI-powered bank statement parsing.
  - `lib/utils.js` — Added date helpers for next-transfer countdowns.
- **Product:** Users can now visualize their spending, get advice from a "Student Finance Coach" AI, and import messy UPI PDF statements directly.
- **Notes:** Created `receipts` storage bucket in Supabase. Fixed `DOMMatrix` SSR error by lazy-loading `pdfjs-dist`.

### 2026-05-16 — Auth configuration for testing
- **Ask:** Disable email confirmation for local testing; record for deployment.
- **Changed:**
  - `docs/PROJECT_HANDOFF.md` — added deployment requirement to re-enable email confirmation and added Developer Note.
- **Product:** Smoother testing flow—users can sign up without email verification during development.
- **Notes:** Email confirmation must be disabled manually in Supabase Dashboard -> Auth -> Providers -> Email.

### 2026-05-16 — Database & Storage Setup (Steps 1 & 2)
- **Ask:** Create Supabase project and set up the engine.
- **Changed:**
  - `supabase/schema.sql` — successfully executed in Supabase Dashboard (all tables, triggers, and RLS active)
  - Supabase Storage — created `csv-imports` bucket with authenticated upload policies
- **Product:** The backend "engine" is now fully powered and ready to handle data.
- **Notes:** Marked Steps 1 & 2 as Done in the checklist.

### 2026-05-16 — AI route hardening (Step 6)
- **Ask:** Carry out next steps from handoff; update and explain with analogies.
- **Changed:**
  - `lib/schemas/receipt.js` — created Zod schema for receipt vision API
  - `lib/schemas/insights.js` — created Zod schema for monthly insights API
  - `app/api/ai/receipt/route.js` — implemented strict Zod validation + robust JSON extraction
  - `app/api/ai/insights/route.js` — implemented Zod validation + error handling
- **Product:** Receipt and Insights APIs are now "hardened"—they won't crash on bad input or weird AI formatting.
- **Notes:** Marked Step 6 as Done in the checklist.

### 2026-05-16 — Project reorganization & GitHub linkage
- **Ask:** Flatten structure (move `spendsense/` contents to root), organize docs, and link to GitHub.
- **Changed:**
  - Root directory — flattened (moved all app files from `spendsense/` to root)
  - `docs/` — created and moved `PROJECT_HANDOFF.md`, `SpendSense_Guide.md`, and architecture guide there
  - `.cursor/rules/update-project-handoff.mdc` — updated paths to `docs/`
  - `.gitignore` — recreated at root for flattened structure
  - Git — linked to `https://github.com/pranavrajgali/Spndr.git` and pushed to `main`
- **Product:** Clean repo structure with documentation in `docs/` and code at the root. GitHub repo is now live.
- **Notes:** Use `npm install` and `npm run dev` from the root now.

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

1. [x] **Run** `supabase/schema.sql` in Supabase SQL Editor
2. [x] **Storage:** Create private bucket `csv-imports` + upload policy for authenticated users
3. [ ] **Manual API test:** `GET /api/dashboard/summary` while logged in (DevTools → fetch)
4. [ ] **Test budgets:** POST budget → POST expense in category → GET budgets (spent should rise)
5. [ ] **Test CSV:** upload file to Storage → POST `/api/csv` → POST `/api/csv/confirm`
6. [x] **AI routes:** Hardened `insights` + `receipt` with Zod (chat/categorize done)
7. [ ] **Optional:** Gold auto-create linked `transactions` row on buy/sell (guide mentions it)

---

## Next up — UI later (when backend checklist is solid)

1. [x] Wire charts to aggregated API responses
2. [x] `BudgetCard` / `BudgetProgress` → `/api/budgets`
3. [x] `ChatBot` → `/api/ai/chat`
4. [x] `CSVImport` + `ReceiptScanner` → storage + AI routes
5. [x] Design polish (colors, glass cards, PWA icons)
6. [ ] **Saved Logins:** UI to remember previous users on login page for quick selection
7. [ ] **Security:** Re-enable "Confirm email" in Supabase Auth settings before public launch
8. [ ] Deploy to Vercel with env vars

---

## Developer Notes
- **Auth:** Email confirmation is currently **DISABLED** in Supabase Dashboard for faster testing.

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
