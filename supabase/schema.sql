-- SpendSense — run once in Supabase SQL Editor (Dashboard → SQL → New query)
-- Source: SpendSense_Guide.md §3 + RLS from §2.2

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_profile (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name          TEXT,
  currency              TEXT DEFAULT 'INR',
  gold_price_per_gram   NUMERIC(10,2) DEFAULT 0,
  expected_transfer_day INT,
  avg_transfer_amount   NUMERIC(12,2) DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS balances (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL,
  note       TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT CHECK (type IN ('income','expense')) NOT NULL,
  amount      NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  source      TEXT DEFAULT 'manual',
  receipt_id  UUID,
  is_deleted  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
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

CREATE TABLE IF NOT EXISTS gold (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type           TEXT CHECK (type IN ('buy','sell')) NOT NULL,
  grams          NUMERIC(8,4) NOT NULL,
  price_per_gram NUMERIC(10,2) NOT NULL,
  total_paid     NUMERIC(12,2) NOT NULL,
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  notes          TEXT
);

CREATE TABLE IF NOT EXISTS receipts (
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

CREATE TABLE IF NOT EXISTS ai_insights (
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

CREATE TABLE IF NOT EXISTS chat_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role           TEXT CHECK (role IN ('user','assistant')) NOT NULL,
  content        TEXT NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS csv_imports (
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

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_balances_user_id ON balances(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_gold_user_id ON gold(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_messages(user_id);

-- ---------------------------------------------------------------------------
-- Wallet balance trigger (INSERT / hard DELETE on transactions)
-- ---------------------------------------------------------------------------

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

DROP TRIGGER IF EXISTS on_transaction_change ON transactions;
CREATE TRIGGER on_transaction_change
AFTER INSERT OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE gold ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running (idempotent-ish)
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_profile','balances','wallets','transactions','budgets',
    'gold','receipts','ai_insights','chat_messages','csv_imports'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS user_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY user_isolation ON %I FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
      t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Storage: create bucket "csv-imports" in Dashboard → Storage (private).
-- Add policy so authenticated users can upload/read own paths.
-- ---------------------------------------------------------------------------
