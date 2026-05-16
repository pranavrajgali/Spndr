# SpendSense: Complete Independent Build Guide

**AI-Powered Personal Finance Planner for Indian College Students**  
Stack: Next.js + Supabase + Groq + Vercel | Cost: 100% Free  
Version 1.0 | May 2026

---

## Table of Contents

1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [Tools & Resources](#2-tools--resources)
   - 2.1 [Next.js](#21-nextjs-frontend--backend)
   - 2.2 [Supabase](#22-supabase-database--auth--storage--realtime)
   - 2.3 [Groq Cloud](#23-groq-cloud-ai--llm-engine)
   - 2.4 [Vercel](#24-vercel-deployment--hosting)
   - 2.5 [Antigravity + Google Pro](#25-antigravity--google-pro)
   - 2.6 [Supporting Libraries](#26-supporting-libraries)
3. [Database Schema](#3-database-schema)
4. [Design Specifications](#4-design-specifications)
5. [Feature Breakdown](#5-feature-breakdown)
6. [Project Structure](#6-project-structure)
7. [Free Tier Limits & Constraints](#7-free-tier-limits--constraints)
8. [Implementation Roadmap & Timeline](#8-implementation-roadmap--timeline)
9. [Phase-by-Phase Build Plan](#9-phase-by-phase-build-plan)
10. [Security Checklist](#10-security-checklist)

---

## 1. Project Overview & Architecture

### What SpendSense is

SpendSense is a full-stack web application that helps Indian college students track their money without connecting to a bank. It combines manual entry, CSV uploads from any UPI app or bank, AI auto-categorization, receipt scanning, and natural language chat — all on a 100% free infrastructure stack.

### Who it's for

- Students who receive weekly/monthly transfers from family
- Anyone using PhonePe, GPay, Paytm, HDFC, Axis, DCB, or any UPI app
- People who want spending insights without sharing bank credentials

### Core Architecture

```
User Browser (React / Next.js)
        |
        | HTTP requests
        v
Vercel Serverless Functions  (app/api/**/route.js)
        |                    |
        v                    v
Supabase (Postgres)      Groq API (Llama 3)
  - transactions          - categorize
  - budgets               - parse CSV rows
  - gold entries          - read receipts
  - chat history          - monthly insights
  - user profiles         - chatbot NL -> action
```

### Data Flow

Every user action follows the same linear path:

```
1. User does something in UI (types, uploads, chats)
2. React component calls fetch('/api/something')
3. Vercel function receives request
4. Function talks to Supabase and/or Groq
5. Response sent back to UI
6. UI updates instantly via Supabase Realtime
```

---

## 2. Tools & Resources

### 2.1 Next.js (Frontend + Backend)

Next.js is a React framework that handles both your frontend pages and backend API endpoints in a single project. No separate Express server or Python Flask backend needed. Everything lives in one codebase and deploys to Vercel in one command.

**Why Next.js for this project**

- App Router: files in `app/` automatically become URLs
- API Routes: files in `app/api/**/route.js` become REST endpoints
- Server Components: fetch data on server, send HTML to browser (faster)
- Built-in Image Optimization: useful for receipt image handling
- First-class Vercel support: zero-config deployment

**Key concepts**

```
app/page.jsx              -> renders at /
app/dashboard/page.jsx   -> renders at /dashboard
app/api/transactions/
  route.js               -> handles GET/POST at /api/transactions
```

```js
// A basic route.js looks like this:
export async function GET(request) {
  // fetch from supabase, return JSON
  return Response.json({ data: [...] })
}

export async function POST(request) {
  const body = await request.json()
  // save to supabase
  return Response.json({ success: true })
}
```

**Installation**

```bash
npx create-next-app@latest spendsense
# - Would you like to use TypeScript? No
# - Would you like to use Tailwind CSS?  Yes
# - Would you like to use App Router?    Yes
# - Would you like to use src/ directory? No
```

---

### 2.2 Supabase (Database + Auth + Storage + Realtime)

Supabase is a hosted PostgreSQL database with built-in authentication, file storage, and real-time subscriptions. It replaces what would normally require a separate database server, auth library, and websocket server.

**What Supabase gives you**

- PostgreSQL database: 500MB free, full SQL support
- Auth: email/password + Google OAuth, JWT tokens, session management
- Row Level Security: data isolation between users at database level
- Storage: 1GB for receipt images and CSV files
- Realtime: websocket subscriptions so UI updates without refresh
- REST API: auto-generated from your tables

**Critical: Row Level Security (RLS)**

You MUST enable RLS on every table. Without it, any logged-in user can read every other user's data.

```sql
-- Run this for EVERY table you create:
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_isolation" ON transactions
FOR ALL TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);
```

**Critical: Index user_id columns**

```sql
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
-- repeat for every table
```

**Critical: Database pauses after 7 days inactivity**

On the free tier, if no queries are made for 7 days, Supabase pauses the database. First load after pause takes 5-10 seconds. Fix: set up a free cron job on cron-job.org to ping your Supabase URL every 4 days.

**Setup steps**

```
1. Go to supabase.com -> New Project
2. Save your Project URL and anon key
3. Put them in .env.local:
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
4. npm install @supabase/supabase-js @supabase/ssr
```

---

### 2.3 Groq Cloud (AI / LLM Engine)

Groq provides free access to Llama 3 models running on their custom LPU hardware. Significantly faster than OpenAI's free tier and does not require a credit card. SpendSense uses Groq for five distinct AI tasks.

**Models and when to use each**

| Model | Use in SpendSense | Speed | Daily Limit |
|---|---|---|---|
| llama-3.1-8b-instant | Transaction categorization | 840 tok/s | 500K tokens |
| llama-3.1-8b-instant | Chatbot (add/delete transactions) | 840 tok/s | 500K tokens |
| llama-3.1-8b-instant | CSV row parsing | 840 tok/s | 500K tokens |
| llama-3.3-70b-versatile | Monthly AI insights | Slower | 100K tokens |
| llava-v1.5-7b | Receipt image scanning | Fast | Limited |

**Categorization prompt (8B model)**

```
You are a transaction categorizer for Indian spending.
Categorize this transaction into exactly one of these categories:
[Food & Drinks, Transport, Entertainment, Shopping,
 Utilities, Health, Education, Travel, Investments,
 Gold, Rent & Housing, Gifts & Social, Other]
Transaction: 'Swiggy order 450'
Reply with ONLY the category name, nothing else.
```

**Chatbot prompt (8B model)**

```
You are a finance assistant. The user will describe a transaction
in natural language. Extract: type (income/expense), amount,
description, category. Return JSON only:
{"type":"expense","amount":20,"description":"coffee",
 "category":"Food & Drinks", "action":"add"}
If user says delete/remove, set action to 'delete'.
```

**Rate limits to know**

- 30 requests per minute (shared across all users)
- Batch multiple transactions in one prompt to save RPM
- For CSV imports: categorize in batches of 10 rows per Groq call
- For insights: call once per month per user, cache result in DB

**Setup**

```
1. Go to console.groq.com -> API Keys -> Create
2. Add to .env.local:
   GROQ_API_KEY=gsk_...
3. npm install groq-sdk
```

---

### 2.4 Vercel (Deployment + Hosting)

Vercel is the company that makes Next.js. Deploying a Next.js app to Vercel is the simplest deployment experience available. Push to GitHub, connect repo to Vercel, done. Every git push auto-deploys.

**Free tier limits**

| Resource | Free Limit | Impact on SpendSense |
|---|---|---|
| Function invocations | 1,000,000/month | ~33,000 daily API calls |
| Function duration | 100 GB-hours | Keep functions fast |
| Bandwidth | 100 GB/month | Compress images |
| Function timeout | 10s default, 60s max | Batch CSV processing |
| Request body limit | 4.5 MB | Direct-upload CSVs to Supabase |
| Build minutes | 6,000/month | More than enough |

**The 4.5MB problem and fix**

Large CSV bank statements will exceed Vercel's 4.5MB body limit if sent through the API route. Fix: upload directly from browser to Supabase Storage, then send only the file URL to your API route.

```js
// In your React component:
const { data } = await supabase.storage
  .from('csv-imports')
  .upload(filename, file)  // goes directly to Supabase, not Vercel

// Then call your API with just the URL:
await fetch('/api/csv', {
  method: 'POST',
  body: JSON.stringify({ fileUrl: data.path })
})
```

**Deployment steps**

```
1. Push your project to GitHub
2. Go to vercel.com -> New Project -> Import from GitHub
3. Add environment variables (same as .env.local)
4. Deploy
5. Every future 'git push' auto-deploys
```

---

### 2.5 Antigravity + Google Pro

Antigravity is an AI coding assistant that integrates with your Google Pro account. In the SpendSense workflow, it serves as your primary development accelerator for boilerplate generation, debugging, and refactoring.

**Where Antigravity fits in the workflow**

- Scaffold repetitive code: generate CRUD route.js files from schema
- Debug Supabase RLS errors: paste error, get fix
- Write Groq prompts: iterate on prompt engineering
- Generate Shadcn component wrappers: forms, modals, charts
- Google Docs/Sheets integration: export SpendSense data to Sheets via API

**Google Pro account benefits**

- Gemini 1.5 Pro access: longer context window for debugging large files
- Google Cloud free credits: useful if you ever need Cloud Functions
- Firebase Studio: alternative to Supabase if you hit free tier limits
- Google Sheets API: let users export transaction data to Sheets

**Recommended Antigravity workflow**

```
Phase 1 (Setup):    Use Antigravity to scaffold all route.js files
Phase 2 (Features): Use for each new component + API endpoint
Phase 3 (Debug):    Paste Supabase/Vercel errors for instant fix
Phase 4 (Polish):   Use for responsive CSS and accessibility fixes
```

---

### 2.6 Supporting Libraries

| Library | Install | Purpose |
|---|---|---|
| @supabase/supabase-js | `npm install @supabase/supabase-js` | Supabase client |
| @supabase/ssr | `npm install @supabase/ssr` | Server-side auth |
| groq-sdk | `npm install groq-sdk` | Groq API client |
| shadcn/ui | `npx shadcn@latest init` | Pre-built components |
| recharts | `npm install recharts` | Charts and graphs |
| papaparse | `npm install papaparse` | CSV parsing |
| react-dropzone | `npm install react-dropzone` | File upload UI |
| date-fns | `npm install date-fns` | Date formatting |
| zod | `npm install zod` | Input validation |
| next-pwa | `npm install next-pwa` | PWA / installable app |
| lucide-react | `npm install lucide-react` | Icons (used by shadcn) |

---

## 3. Database Schema

All tables go in Supabase. Run these SQL statements in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query). Run them in order.

### users
Managed automatically by Supabase Auth. Do not create manually. Reference with `auth.uid()` in RLS policies.

### user_profile

```sql
CREATE TABLE user_profile (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name         TEXT,
  currency             TEXT DEFAULT 'INR',
  gold_price_per_gram  NUMERIC(10,2) DEFAULT 0,
  expected_transfer_day INT,
  avg_transfer_amount  NUMERIC(12,2) DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_user_profile_user_id ON user_profile(user_id);
```

### balances (balance change log)

```sql
CREATE TABLE balances (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL,
  note       TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_balances_user_id ON balances(user_id);
```

### wallets (current balance — maintained by trigger)

```sql
CREATE TABLE wallets (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0
);
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Trigger to auto-update balance on transaction insert/delete:
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE wallets SET balance = balance + NEW.amount
    WHERE user_id = NEW.user_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE wallets SET balance = balance - OLD.amount
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_transaction_change
AFTER INSERT OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();
```

### transactions

```sql
CREATE TABLE transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT CHECK (type IN ('income','expense')) NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  source      TEXT DEFAULT 'manual',
  -- source values: manual | csv | chat | receipt
  receipt_id  UUID,
  is_deleted  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
```

### budgets

```sql
CREATE TABLE budgets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category         TEXT NOT NULL,
  limit_amount     NUMERIC(12,2) NOT NULL,
  spent_amount     NUMERIC(12,2) DEFAULT 0,
  month            INT NOT NULL,
  year             INT NOT NULL,
  alert_at_percent INT DEFAULT 80,
  UNIQUE(user_id, category, month, year)
);
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
```

### gold

```sql
CREATE TABLE gold (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type           TEXT CHECK (type IN ('buy','sell')) NOT NULL,
  grams          NUMERIC(8,4) NOT NULL,
  price_per_gram NUMERIC(10,2) NOT NULL,
  total_paid     NUMERIC(12,2) NOT NULL,
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  notes          TEXT
);
ALTER TABLE gold ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_gold_user_id ON gold(user_id);
```

### receipts

```sql
CREATE TABLE receipts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url      TEXT NOT NULL,
  parsed_data    JSONB,
  merchant_name  TEXT,
  amount         NUMERIC(12,2),
  date           DATE,
  transaction_id UUID REFERENCES transactions(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
```

### ai_insights

```sql
CREATE TABLE ai_insights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month           INT NOT NULL,
  year            INT NOT NULL,
  summary_text    TEXT,
  top_category    TEXT,
  savings_rate    NUMERIC(5,2),
  biggest_expense NUMERIC(12,2),
  suggestions     JSONB,
  generated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
```

### chat_messages

```sql
CREATE TABLE chat_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role           TEXT CHECK (role IN ('user','assistant')) NOT NULL,
  content        TEXT NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_chat_user_id ON chat_messages(user_id);
```

### csv_imports

```sql
CREATE TABLE csv_imports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename       TEXT,
  source         TEXT,
  total_rows     INT DEFAULT 0,
  processed_rows INT DEFAULT 0,
  failed_rows    INT DEFAULT 0,
  status         TEXT DEFAULT 'pending',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;
```

---

## 4. Design Specifications

### Color Palette

| Role | Name | Hex | Usage |
|---|---|---|---|
| Primary | Dark Teal | #0D9488 | Buttons, links, primary actions |
| Accent | Mint Green | #2DD4BF | Highlights, progress fills, charts |
| Background | Off White | #F0FDFA | Page background |
| Highlight | Soft Purple | #A855F7 | Income, gold, secondary accent |
| Danger | Coral Red | #F43F5E | Expenses, budget alerts, delete |
| Text Primary | Near Black | #134E4A | Headings, main text |
| Text Muted | Gray | #6B7280 | Subtext, timestamps, labels |

### Typography

- Font: **Plus Jakarta Sans** (Google Fonts — free)
- Import in `app/layout.jsx` via `next/font/google`
- Weights: 400 (body), 600 (labels), 700 (headings/amounts)
- Base size: 14px mobile, 16px desktop

### Component Design Rules

- Cards: `border-radius: 20px`, glassmorphism (`bg white/55%`, `backdrop-blur-md`)
- Card border: `1px solid rgba(13,148,136,0.18)`
- Buttons: `border-radius: 100px` (fully rounded), teal fill
- Inputs: `border-radius: 12px`, teal focus ring
- Charts: gradient area fills, no grid lines on Y axis
- Icons: Lucide React, outline style, 18-20px

### Layout

- Mobile first: design for 375px width, scale up
- Bottom navigation bar on mobile (5 tabs)
- Sidebar navigation on desktop
- Max content width: 480px mobile, 1200px desktop
- Spacing unit: 4px base (multiples: 8, 12, 16, 20, 24)

### Mobile Navigation

```
[ Home ]  [ History ]  [ + Add ]  [ Budgets ]  [ Profile ]
  The center + button is larger and teal-filled (FAB style)
```

### Shadcn Components to install

```bash
npx shadcn@latest add button input card dialog sheet badge tabs select toast progress
```

---

## 5. Feature Breakdown

### 5.1 Authentication & Onboarding

- Signup with email/password via Supabase Auth
- Login page with Google OAuth option
- After signup: onboarding screen asks for current balance and display name
- Creates `user_profile` and `wallets` rows on first login
- `middleware.js` redirects unauthenticated users away from `/dashboard`

**Onboarding screen fields:**
```
Display name        (text)
Current balance     (number, INR)
Expected transfer day (Mon/Tue/Wed... or 'varies')
Typical transfer amount (number, optional)
```

---

### 5.2 Transaction Logging & AI Chatbot

**Two ways to add transactions:**

Manual Form:
```
Type:        Income / Expense toggle
Description: text input
Amount:      number input (INR)
Date:        date picker (default today)
Category:    auto-filled by AI, user can override
```

AI Chatbot:
```
User: "spent 20 on coffee"
Bot:  categorizes, saves, confirms with updated balance

User: "dad sent 5000"
Bot:  logs as income, Family Transfer category

User: "delete last entry"
Bot:  soft deletes, confirms

User: "how much did i spend on food this week"
Bot:  queries DB, returns answer in plain text
```

**Income Categories:**
```
Family Transfer | Internship/Salary | Prize/Reward
Scholarship | Freelance | Sold Something | Refund | Other
```

**Expense Categories:**
```
Food & Drinks | Transport | Entertainment | Shopping
Utilities | Health | Education | Travel | Investments
Gold | Rent & Housing | Gifts & Social | Other
```

---

### 5.3 CSV Import

- Accepts CSV and XLSX from any Indian bank or UPI app
- Multiple files can be uploaded simultaneously (PhonePe + HDFC = fine)
- File uploaded directly to Supabase Storage (bypasses 4.5MB Vercel limit)
- Groq reads rows in batches of 10, categorizes each
- Duplicate detection: same amount + date + description flagged
- User reviews flagged duplicates before confirming import

**CSV processing flow:**
```
1. User drops file -> uploaded to Supabase Storage
2. API gets file URL -> fetches and parses with papaparse
3. Rows sent to Groq in batches of 10
4. Groq returns: description, amount, date, category for each
5. All rows bulk-inserted via single Supabase RPC call
6. csv_imports row updated with counts
```

---

### 5.4 Budget System

- User sets monthly limit per category (e.g. Food = ₹3,000)
- Budget rows scoped to month + year
- `spent_amount` updates whenever a transaction is added in that category
- Progress bar shows used / limit visually
- Alert when `spent_amount > (limit * alert_at_percent / 100)`
- Default alert threshold: 80%, user can change per category

**Budget progress display:**
```
Food & Drinks   [==========]  3200/3000  107%  OVER BUDGET
Transport       [====      ]  1200/3000   40%  OK
Entertainment   [========  ]  1600/2000   80%  WARNING
```

---

### 5.5 Receipt Scanning

- User taps camera icon or uploads photo of physical receipt
- Image compressed client-side before upload (to save Storage quota)
- Image uploaded to Supabase Storage
- URL sent to `/api/ai/receipt`
- Groq llava reads image, extracts merchant, amount, date
- Form pre-filled with extracted data
- User confirms or edits, then saves
- Receipt image linked to transaction in `receipts` table

---

### 5.6 Gold Tracker

- Separate module for PhonePe Gold or any gold savings
- Log buy entries: date, grams, price per gram, total paid
- Log sell entries: date, grams sold, amount received
- Dashboard shows: grams owned, current value, invested, profit/loss
- `Current value = grams_owned * current_price_per_gram`
- Gold price updated manually by user once a day (simple input)
- Area chart shows gold value over time
- Gold buys logged as expense under Gold category
- Gold sells logged as income, balance updated

---

### 5.7 AI Monthly Insights

- Generated once per month per user by Groq 70B model
- Stored in `ai_insights` table — not regenerated on every dashboard load
- Regenerate button available if user wants fresh analysis
- Output: 2-3 paragraph plain text summary

**Insights cover:**
```
- Total spent vs previous month (% change)
- Top spending category with specific amount
- Number of food delivery orders and cost
- Savings rate and projected annual savings
- Over-budget categories and suggestions
- Zero-spend categories flagged (e.g. no Health spend)
```

---

### 5.8 History Section

- Scrollable list of months, newest first
- Each month shows total spent beside month name
- Arrow indicator: up = spent more than prev month, down = less
- Tap month -> expands to week-by-week breakdown
- Tap week -> shows individual transactions
- Tap transaction -> full detail with edit / delete options

**Visual structure:**
```
May 2026          ₹28,470 spent  [v]
  Week 3 (13-19)   ₹8,200
  Week 2 (6-12)   ₹11,430
  Week 1 (1-5)     ₹8,840
April 2026        ₹31,200 spent  [^]
```

---

### 5.9 Survive Till Next Transfer Indicator

- Shown on dashboard when balance is below a threshold
- Calculates expected next transfer date from `user_profile`
- Shows days remaining, current balance, safe daily spend

```
Last transfer:     May 10
Expected next:     May 17  (in 3 days)
Remaining balance: ₹1,840
Safe daily budget: ₹613/day
```

---

## 6. Project Structure

```
spendsense/
|
+-- app/
|   +-- layout.jsx                    Root layout, fonts, providers
|   +-- page.jsx                      Landing page (/)
|   +-- (auth)/
|   |   +-- login/page.jsx            /login
|   |   +-- signup/page.jsx           /signup
|   +-- onboarding/page.jsx           /onboarding (after signup)
|   +-- dashboard/
|   |   +-- page.jsx                  /dashboard (main overview)
|   |   +-- transactions/page.jsx     /dashboard/transactions
|   |   +-- history/page.jsx          /dashboard/history
|   |   +-- budgets/page.jsx          /dashboard/budgets
|   |   +-- receipts/page.jsx         /dashboard/receipts
|   |   +-- gold/page.jsx             /dashboard/gold
|   |   +-- chat/page.jsx             /dashboard/chat
|   +-- api/
|       +-- auth/[...supabase]/route.js
|       +-- transactions/route.js     GET, POST, PATCH, DELETE
|       +-- budgets/route.js          GET, POST, PATCH
|       +-- gold/route.js             GET, POST
|       +-- balance/route.js          GET, POST
|       +-- csv/route.js              POST (file URL -> parse -> insert)
|       +-- ai/
|           +-- categorize/route.js   POST -> Groq 8B -> category
|           +-- receipt/route.js      POST -> Groq llava -> parsed data
|           +-- chat/route.js         POST -> Groq 8B -> DB action
|           +-- insights/route.js     POST -> Groq 70B -> summary
|
+-- components/
|   +-- ui/                           Shadcn auto-generated
|   +-- Navbar.jsx
|   +-- BottomNav.jsx                 Mobile navigation
|   +-- TransactionForm.jsx
|   +-- TransactionList.jsx
|   +-- BudgetCard.jsx
|   +-- BudgetProgress.jsx
|   +-- ReceiptScanner.jsx
|   +-- SpendingDonut.jsx
|   +-- IncomeExpenseBar.jsx
|   +-- DailySpendLine.jsx
|   +-- SavingsTrend.jsx
|   +-- GoldTracker.jsx
|   +-- GoldChart.jsx
|   +-- SurviveIndicator.jsx
|   +-- AIInsights.jsx
|   +-- ChatBot.jsx
|   +-- HistorySection.jsx
|   +-- CSVImport.jsx
|   +-- OnboardingFlow.jsx
|
+-- lib/
|   +-- supabase.js                   Supabase browser client
|   +-- supabase-server.js            Supabase server client
|   +-- groq.js                       Groq client + prompt templates
|   +-- categories.js                 Master list: 13 expense + 8 income
|   +-- csvParser.js                  CSV normalize + clean
|   +-- utils.js                      formatCurrency, formatDate, etc
|
+-- middleware.js                      Redirect unauthenticated users
+-- .env.local                         API keys (never commit to git)
+-- public/
    +-- manifest.json                  PWA manifest
    +-- icons/                         192x192 and 512x512 app icons
```

---

## 7. Free Tier Limits & Constraints

| Service | Limit | Risk | Mitigation |
|---|---|---|---|
| Vercel | 1M function calls/mo | Low for personal | Efficient routes |
| Vercel | 4.5MB body limit | HIGH for CSV | Direct-to-Supabase upload |
| Vercel | 10s function timeout | Med for CSV | Batch processing |
| Supabase DB | 500MB storage | Low for personal | Paginate queries |
| Supabase | 5GB egress/mo | Med for heavy use | Client-side caching |
| Supabase | 1GB file storage | Med for receipts | Compress images |
| Supabase | 7-day inactivity pause | HIGH for UX | Ping cron job |
| Supabase | 200 realtime connections | Low | Disconnect when idle |
| Groq | 30 RPM | Med for multi-user | Batch categorization |
| Groq 70B | 1000 req/day | Low for insights | Cache in DB |

**Key rules to follow while building:**

- Never send raw CSV files through Vercel API routes
- Always enable RLS before testing any multi-user scenario
- Always index `user_id` on every table you create
- Cache AI insights — don't call Groq 70B on every dashboard load
- Batch CSV categorization — 10 rows per Groq call, not 1
- Compress receipt images client-side before upload
- Use soft deletes (`is_deleted` flag) not hard DELETE on transactions
- Set up a cron job to ping Supabase every 4 days

---

## 8. Implementation Roadmap & Timeline

Estimated total: **8-10 weeks part-time** (2-3 hrs/day) or **3-4 weeks full-time** (6+ hrs/day).

| Phase | Features | Duration | Milestone |
|---|---|---|---|
| Phase 1 | Project setup, env config, Supabase tables, RLS | 3-4 days | App runs locally |
| Phase 2 | Auth: signup, login, session, middleware | 3-4 days | Login works |
| Phase 3 | Onboarding flow, user_profile, wallet setup | 2-3 days | New user onboarded |
| Phase 4 | Transaction CRUD, manual form, balance update | 4-5 days | Add/view expenses |
| Phase 5 | AI categorization via Groq, category list | 2-3 days | Auto-categorization |
| Phase 6 | Dashboard: summary cards, 3 chart types | 4-5 days | Dashboard live |
| Phase 7 | CSV import: upload, parse, bulk insert | 4-5 days | Import bank CSV |
| Phase 8 | Budget system: set, track, alerts | 3-4 days | Budget alerts work |
| Phase 9 | AI Chatbot: NL -> action -> DB | 4-5 days | Chat logs expenses |
| Phase 10 | Receipt scanning: image -> Groq -> form | 3-4 days | Scan receipts |
| Phase 11 | Gold tracker module | 3-4 days | Gold tracking live |
| Phase 12 | History section: monthly/weekly view | 3-4 days | History scrollable |
| Phase 13 | AI monthly insights panel | 2-3 days | Insights generated |
| Phase 14 | Survive indicator, income categories | 1-2 days | Indicator on dash |
| Phase 15 | PWA setup, mobile nav, polish | 3-4 days | Installable on phone |
| Phase 16 | Deploy to Vercel, env vars, domain | 1-2 days | Live on internet |

---

## 9. Phase-by-Phase Build Plan

### Phase 1: Project Setup

```bash
npx create-next-app@latest spendsense
cd spendsense
npm install @supabase/supabase-js @supabase/ssr groq-sdk
npm install recharts papaparse date-fns zod lucide-react
npm install react-dropzone
npx shadcn@latest init
```

Steps:
1. Create `.env.local` with Supabase + Groq keys
2. Create `lib/supabase.js` and `lib/groq.js`
3. Run all SQL schema statements in Supabase SQL editor
4. Enable RLS on all tables
5. Add indexes on all `user_id` columns
6. Set up wallet balance trigger
7. `npm run dev` -> verify app loads at localhost:3000

---

### Phase 2: Authentication

Files to create:
```
app/(auth)/login/page.jsx
app/(auth)/signup/page.jsx
middleware.js
lib/supabase-server.js
app/api/auth/[...supabase]/route.js
```

Steps:
1. Enable Email auth in Supabase Dashboard -> Auth -> Providers
2. Build login form with email + password
3. Build signup form
4. Add middleware to protect `/dashboard` routes
5. Test: signup -> redirects to `/onboarding`
6. Test: login -> redirects to `/dashboard`
7. Test: visit `/dashboard` logged out -> redirects to `/login`

---

### Phase 3: Onboarding

Files to create:
```
app/onboarding/page.jsx
components/OnboardingFlow.jsx
```

Steps:
1. After signup, redirect to `/onboarding`
2. Form: display name, current balance, transfer day
3. On submit: INSERT into `user_profile`, INSERT into `wallets`
4. Redirect to `/dashboard`
5. If `user_profile` exists, skip onboarding on future logins

---

### Phase 4: Transactions

Files to create:
```
app/api/transactions/route.js
components/TransactionForm.jsx
components/TransactionList.jsx
app/dashboard/transactions/page.jsx
```

`route.js` handles:
```
GET   -> fetch user's transactions (paginated, 20 per page)
POST  -> insert new transaction, trigger updates wallet
PATCH -> soft delete (set is_deleted = true)
```

---

### Phase 5: AI Categorization

Files to create:
```
app/api/ai/categorize/route.js
lib/categories.js
lib/groq.js
```

Flow:
```
POST /api/ai/categorize
Body: { description: 'Swiggy order', amount: 450 }
-> send to Groq 8B with categorization prompt
-> return { category: 'Food & Drinks' }
TransactionForm calls this on description blur
```

---

### Phases 6-16: Continued Build

Each phase follows the same pattern:
```
1. Create the API route(s) for the feature
2. Create the React component(s)
3. Wire them together
4. Test the happy path
5. Test edge cases (empty state, errors, zero balance)
```

Recommended order within each phase:
```
a. Build the API route first (test with curl or Postman)
b. Build the component with hardcoded data
c. Connect component to API
d. Add loading and error states
```

---

## 10. Security Checklist

Complete before going live:

### Supabase
- [ ] RLS enabled on: transactions, budgets, gold, receipts, wallets, user_profile, balances, ai_insights, chat_messages, csv_imports
- [ ] `user_id` indexed on every table listed above
- [ ] Wallet balance trigger installed and tested
- [ ] Supabase anon key used on client side (not service role key)
- [ ] Service role key NEVER exposed to frontend

### Vercel / Next.js
- [ ] All secret keys in `.env.local`, never hardcoded
- [ ] `.env.local` in `.gitignore`
- [ ] `GROQ_API_KEY` server-side only (no `NEXT_PUBLIC_` prefix)
- [ ] `middleware.js` protects all `/dashboard` routes
- [ ] API routes validate that user is authenticated before any DB query

### Data
- [ ] Soft deletes used for transactions (`is_deleted` flag)
- [ ] Input validation with zod on all API route bodies
- [ ] Amount fields validated as positive numbers
- [ ] Dates validated as valid date strings
- [ ] File uploads checked for type (CSV/XLSX/JPG/PNG only)

---

*SpendSense | BackProp Bandits | 2026*  
*Stack: Next.js + Supabase + Groq + Vercel | Cost: Free*
