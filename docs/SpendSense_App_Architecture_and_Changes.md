# SpendSense App — Architecture & Implementation Guide

> **Living changelog & handoff:** See [`docs/PROJECT_HANDOFF.md`](./docs/PROJECT_HANDOFF.md) for the always-updated status matrix, file map, and session-by-session change log. That file is the one to open when switching editors or AI tools. After you change code, append a new changelog entry to docs/PROJECT_HANDOFF.md (newest first). Do not skip updating docs/PROJECT_HANDOFF.md.

This document explains **what was built** inside the root folder, **how the pieces fit together**, and **how that affects the product** for someone new to Next.js full-stack apps. It assumes you know basic programming (variables, HTTP, databases at a high level).

---

## 1. What is this project?

**SpendSense** is a web app idea from your `docs/SpendSense_Guide.md`: students track spending without linking a bank. The **executable code** lives at the **repo root**.

| Piece | Role (simple analogy) |
| ------ | ---------------------- |
| **Next.js** | Both the “website UI” *and* the “mini backend” in one project. |
| **Supabase** | Remote Postgres database + login (auth) + optional file storage. |
| **Groq** | AI API (Llama-family models) for categorizing text, chat, receipts, insights. |
| **Vercel** (later) | Where you deploy — not required while developing locally. |

---

## 2. Big picture: How a button click reaches the database

When you tap **Save** on a transaction form:

```
Browser (React)
    → sends HTTP POST to /api/transactions (same Next.js server)
      → reads your login cookies → knows which user you are (Supabase)
      → validates input with Zod
      → INSERT into Supabase `transactions`
      → database trigger adds that row’s signed `amount` to `wallets.balance`
    ← responds with JSON success/error
React updates UI (refetch list, show message)
```

That pattern — **React calls `fetch("/api/...")`** — is repeated for budgets, CSV, AI routes, etc.

**Why `/api/` routes:** In Next.js **App Router**, any file named `route.js` under `app/api/...` becomes an HTTP endpoint. No separate Express server.

---

## 3. Folder map (mental model)

```
root/
├── app/                    # Pages AND API routes (file = URL)
│   ├── layout.jsx          # Wrapper for ALL pages (font, manifest)
│   ├── page.jsx            # Landing “/”
│   ├── (auth)/             # Route groups — parentheses DON’T appear in URL
│   │   ├── login/
│   │   └── signup/
│   ├── onboarding/
│   ├── dashboard/          # Logged-in area
│   └── api/                # Backend endpoints
├── components/             # Reusable UI (some are still placeholders)
├── docs/                   # Handoff, guides, and spec
├── lib/                    # Shared logic (clients, schemas, prompts)
├── middleware.js           # Runs before many requests — auth redirects
├── public/                 # Static files (icons, manifest)
└── package.json           # Dependencies and scripts
```

---

## 4. Middleware — the “bouncer” at the door

**File:** `middleware.js`

**What it does:** Runs on most requests *before* the page loads. It:

1. Builds a Supabase server client wired to **cookies** (your session lives in cookies after login).
2. Asks Supabase **“who is logged in?”** (`getUser()`).

Then:

| Situation | What happens |
|-----------|----------------|
| No user tries `/dashboard` or `/onboarding` | Redirect to **`/login`**, remembers `redirect` query for after login |
| User is logged in visits `/login` or `/signup` | Looks up **`user_profile`**: if missing → **`/onboarding`**, else → **`/dashboard`** |
| User is logged in visits `/onboarding` but profile already exists | Redirect to **`/dashboard`** |

**Product effect:** Users can’t casually open the dashboard without an account; and new users don’t skip onboarding by bookmarking URLs.

---

## 5. Two Supabase clients (common confusion point)

Why two files?

| File | Runs where | Typical use |
|------|-------------|-------------|
| `lib/supabase.js` | **Browser** (client components only) | Login forms, onboarding form (`createClient()` from `@supabase/ssr`) |
| `lib/supabase-server.js` | **Server** (layouts, route handlers, server components) | Read session securely, DB queries from API routes |

Never put secrets in `NEXT_PUBLIC_*` vars. **Groq key** stays server-only (`GROQ_API_KEY`), so AI calls happen in **`/api/ai/*`**, not from the browser.

---

## 6. Pages (`app/`): Who renders what?

### `app/layout.jsx`

Root layout for the whole site: font (Plus Jakarta Sans), **`metadata`** title, **`manifest`** for PWA, background colors matching the guide palette.

### `app/page.jsx`

Marketing-style landing with links to sign up / log in.

### `app/(auth)/login/page.jsx` & `signup/page.jsx`

**Client components** (“use client”): they handle form state (`useState`). They call the **browser Supabase client** to `signInWithPassword` / `signUp`. After signup, navigation goes toward onboarding flow (middleware also enforces redirects).

Login wraps `useSearchParams` in **`Suspense`** — Next.js expects that so static generation doesn’t break.

### `app/onboarding/page.jsx`

**Server component:** Before showing the form it checks Supabase:

- Not logged in → `/login`
- `user_profile` row already exists → `/dashboard`

**Product effect:** You can’t get stuck viewing onboarding if already set up.

### `app/dashboard/layout.jsx`

Also a **server component:** Verifies logged-in user and **`user_profile`**; if missing, **`redirect('/onboarding')`**. Wraps dashboard pages with **`Navbar`** + **`BottomNav`**.

### `app/dashboard/page.jsx`

**Server component:** Fetches **`wallets.balance`** and shows it next to placeholders for charts (“Survive”, donut, bars, etc. — components still stubs for many charts).

### `app/dashboard/transactions/page.jsx`

Renders **`TransactionsView`** — the real transaction UI built in the last implementation pass.

Other dashboard subtrees (`budgets`, `history`, …) still compose **stub components** from the scaffold; wiring them comes in later phases of your guide.

---

## 7. API routes (`app/api/.../route.js`)

Each `route.js` can export **`GET`**, **`POST`**, **`PATCH`**, **`DELETE`** as separate async functions. They receive a Web **`Request`** and return **`NextResponse.json(...)`**.

### `app/api/transactions/route.js` — **central to the money logic**

Implementations worth understanding:

#### **POST — create**

- Validates body with **`Zod`** (`lib/schemas/transaction.js`).
- **`type`** is `"income"` or `"expense"`; **`amount`** in JSON is **always positive**.
- **`signedAmountForInsert`** converts to what the DB expects:
  - **Expense** → **negative** number (money leaves wallet)
  - **Income** → **positive**
- Checks **category** is in **`EXPENSE_CATEGORIES`** or **`INCOME_CATEGORIES`** (`lib/categories.js`).
- Inserts row with **`source: "manual"`** (or csv/chat/receipt later).

**Why negative for expenses:** Your SQL guide installs a trigger: on **INSERT**, `wallets.balance = balance + NEW.amount`. So `+(-100)` lowers balance by 100.

#### **GET — list with pagination**

- Query params **`page`** and **`limit`** (default limit 20).
- Returns **`data`** plus **`meta.hasMore`** using Supabase **`count`** and **`range`**.

#### **PATCH** and **DELETE** — soft delete

Both set **`is_deleted: true`** instead of deleting the row.**Important design detail:**

- Postgres trigger in the guide fires on **physical DELETE**, not on `UPDATE is_deleted`.
- So when we “undo” an active transaction, we **must adjust the wallet in code**.
- **`lib/wallet.js` → `adjustWalletAfterRemovedTransaction`** does  
  **`new_balance = wallet.balance - transaction.amount`**. That matches “reverse the INSERT effect”, including when `amount` is negative.

**Product effect:** History can keep rows for auditing; deleting from the UI stays consistent with wallet balance.

---

## 8. AI routes (`app/api/ai/...`)

| Route | Purpose |
|-------|---------|
| **`categorize`** | Body: `{ description, type }`. Picks expense vs income category list in **`lib/groq.js`** and calls Llama instant model. Validates against your category arrays. Browser never sees `GROQ_API_KEY`. |
| **`chat`** | Parses NL → JSON-ish action; inserts transactions or soft-deletes last; adjusts wallet on delete (**same helper as transactions API**). |
| **`receipt`** | Placeholder-ish: vision model on image URL — depends on Groq multimodal naming in production. |
| **`insights`** | Monthly summary cached in **`ai_insights`** table conceptually; uses 70B when keys work. |

**Product effect:** Cheap AI-assisted UX without exposing secrets to clients.

---

## 9. Components — what helps with what?

### Fully implemented flow (transactions)

| Component | Role |
|-----------|------|
| **`TransactionsView.jsx`** | Parent coordinator: **`reloadKey`** state; passes **`onSaved`** to form so list resets after insert. Shows page title once. |
| **`TransactionForm.jsx`** | Controlled inputs; calls **`POST /api/ai/categorize`** on blur or “AI” button; submits **`POST /api/transactions`**. Handles loading/error UX. |
| **`TransactionList.jsx`** | **`GET /api/transactions`**; **`PATCH`** to remove row; optional “Load more”. Colors income vs expense. |

### Navigation & shell

| Component | Role |
|-----------|------|
| **`Navbar.jsx`** | Desktop-ish top links (`/dashboard`, history, budgets, chat). |
| **`BottomNav.jsx`** | Mobile bottom bar; FAB-style center button linking to **`/dashboard/transactions`**. **`usePathname`** highlights active tab. |

### Onboarding

| Component | Role |
|-----------|------|
| **`OnboardingFlow.jsx`** | Client form: **`user_profile`** + **`wallets`** insert via browser Supabase. |

Server pages **also** gate onboarding so UX + security stay aligned once RLS is on.

### Stubs (intentionally minimal until you implement those phases)

These render a **placeholder card** so routes don’t crash while you iterate:

**Charts / dashboard:** `SpendingDonut`, `IncomeExpenseBar`, `DailySpendLine`, `SavingsTrend`

**Features:** `BudgetCard`, `BudgetProgress`, `ReceiptScanner`, `GoldTracker`, `GoldChart`, `SurviveIndicator`, `AIInsights`, `ChatBot`, `HistorySection`, `CSVImport`

**Design intent:** Matches your guide’s checklist — you swap bodies for **Recharts** + real queries phase by phase.

### UI primitives

**`components/ui/button.jsx`** — Shadcn-style button (variants/sizes); used everywhere for consistency.

---

## 10. Supporting libraries (`lib/`)

| File | Purpose |
|------|---------|
| **`categories.js`** | Single source of truth for dropdowns & AI prompts. |
| **`utils.js`** | `cn()` (merge Tailwind classes), **`formatCurrency`**, **`formatDate`**. |
| **`csvParser.js`** | Parses bank CSV-ish columns into normalized rows (`papaparse`). |
| **`schemas/transaction.js`** | **Zod** schema + **`signedAmountForInsert`** + category validation helpers. |
| **`wallet.js`** | Wallet reversal after soft-delete. |
| **`groq.js`** | Groq SDK instance, **`MODELS`**, categorize prompts for expense vs income, chat system prompt |

---

## 11. Configuration & secrets

| File | Purpose |
|------|---------|
| **`.env.local`** | Real keys (**gitignored**) — copied from `.env.local.example`. |
| **`middleware.js`** + **`lib/supabase-server.js`** | Need **`NEXT_PUBLIC_SUPABASE_*`** available at runtime on server |

**Reminder:** Deploying or sharing the repo — never commit **`.env.local`**.

---

## 12. How this affects the actual product experience

### What already “feels real” for a user

1. Landing → signup/login flow with middleware protection.
2. Onboarding collects profile + optional transfer day + starting wallet balance.
3. Dashboard shows **wallet balance** (live from DB if schema + RLS are set).
4. **Transactions** page: add money in/out with categories, AI suggest category, pagination, soft remove consistent with wallet.
5. Prepared API surface for CSV, budgets, gold, receipts, insights.

### What still behaves like scaffolding

Dashboard charts and many secondary pages render **stub** components until you connect them to Supabase queries exactly like **`TransactionList`** does.

### Database dependency

The app assumes you ran **`SpendSense_Guide.md` §3 SQL** and **RLS policies**. Without tables, inserts error — errors surface in UI / network tab — that’s normal while learning.

---

## 13. Suggested learning path (matches your codebase)

1. **Trace login:** `signup` → Supabase dashboard user → middleware redirect.
2. **Trace one transaction POST** in DevTools Network tab vs `transactions/route.js`.
3. Read **`lib/schemas/transaction.js`** line by line alongside the JSON from the browser.
4. Simulate soft-delete: wallet before/after in Supabase dashboard.
5. Add one small feature yourself: e.g. show **recent 3 transactions** on dashboard by copy-pasting the query pattern from `dashboard/page.jsx`.

---

## 14. Glossary (quick definitions)

| Term | Meaning |
|------|---------|
| **Server Component** (default in `app/`) | Runs only on server; can `await createClient()`, no `useState`. |
| **Client Component** (`"use client"`) | Runs in browser; hooks allowed; sees user typing. |
| **Route Handler** (`route.js`) | HTTP API endpoint. |
| **RLS** (Row Level Security) | Postgres rules like “each user reads only rows where **`user_id = auth.uid()`**”. Essential before multi-user beta. |
| **Soft delete** | `is_deleted=true` hides row logically; avoids losing history vs `DELETE`. |
| **Zod** | Runtime schema checker so bad input never hits SQL blindly. |

---

## 15. Who “did what” historically (conversation summary)

Rough timeline of implementation (so you trust this doc reflects code, not guesses):

1. **Scaffold:** Next.js App Router tree, stubs, deps, **`public/manifest.json`**, basic layouts.
2. **Auth/onboarding/dashboard shell:** Middleware, login/signup, onboarding form, dashboard layout/nav.
3. **Transactions milestone:** Typed API, pagination, **`TransactionForm` / `TransactionsView` / `TransactionList`**, AI categorize with **`type`**, wallet fix on soft-delete, chat-delete wallet fix.
4. **Dashboard balance card:** Server-rendered **`wallets`** read-through.

---

**End of guide.** Copy this path for reference:

`SpendSense_App_Architecture_and_Changes.md` — at the workspace root (`Documents/SpendSense/`).

If you extend the app later, append a dated “Changelog” section at the bottom for your coursework / portfolio reviewers.
