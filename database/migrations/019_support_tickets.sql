-- ─── 019: Internal Support Ticket System ──────────────────────────────────────
-- Users submit tickets from the Help section.
-- Admin panel receives and responds. AI auto-classifies and drafts replies.

CREATE TABLE IF NOT EXISTS support_tickets (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id           uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- User-submitted fields
    subject          text        NOT NULL,
    body             text        NOT NULL,
    user_category_hint text,    -- optional hint from user ('technical','billing','other')

    -- AI classification (populated asynchronously by /api/support/ai-analyze)
    category         text        CHECK (category IN ('technical','billing','legal','feature','general','other')),
    priority         text        NOT NULL DEFAULT 'normal'
                                 CHECK (priority IN ('critical','high','normal','low')),
    ai_summary       text,       -- one-line AI summary shown to admin
    ai_draft_reply   text,       -- AI-drafted reply for admin to review/edit

    -- Status tracking
    status           text        NOT NULL DEFAULT 'open'
                                 CHECK (status IN ('open','in_progress','resolved','wont_fix','waiting')),
    admin_reply      text,       -- final reply after human-in-the-loop review
    admin_id         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at      timestamptz,

    -- Denormalised for admin display (avoids joins)
    user_email       text,
    org_name         text,

    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── Trigger: keep updated_at current ────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_support_ticket_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION handle_support_ticket_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Regular users: can create their own tickets and read their own
CREATE POLICY "Users can insert own ticket"
    ON support_tickets FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own tickets"
    ON support_tickets FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Note: admin read/write is handled via service_role in server-side routes,
-- which bypasses RLS entirely.

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS support_tickets_org_idx       ON support_tickets(org_id);
CREATE INDEX IF NOT EXISTS support_tickets_user_idx      ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx    ON support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_created_idx   ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_priority_idx  ON support_tickets(priority);
