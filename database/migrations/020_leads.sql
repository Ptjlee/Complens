-- ─────────────────────────────────────────────────────────────────────
-- Migration 020: leads
-- Purpose: Store data captured from the pre-signup /apply flow
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name     text        NOT NULL,
    last_name      text        NOT NULL,
    email          text        NOT NULL,
    company_name   text        NOT NULL,
    company_size   text        NOT NULL,
    hris           text        NOT NULL,
    urgency        text        NOT NULL,
    created_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at  ON leads(created_at DESC);

-- RLS: Service role only can access leads (written via a server-side route)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
    ON leads FOR ALL
    USING (false);
