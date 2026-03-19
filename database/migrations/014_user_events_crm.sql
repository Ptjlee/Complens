-- ─────────────────────────────────────────────────────────────────────
-- Migration 014: user_events
-- Purpose: CRM lifecycle event tracking and chatbot inquiry logging
-- Tables:  user_events, email_log, admin_notes
-- ─────────────────────────────────────────────────────────────────────

-- ── user_events ──────────────────────────────────────────────────────
-- Captures significant lifecycle and usage events per user.
-- event_type examples:
--   'first_upload'        — user uploaded their first dataset
--   'first_report'        — user generated their first report
--   'chatbot_inquiry'     — chatbot conversation logged (with topic)
--   'trial_extended'      — trial grace period activated
--   'license_activated'   — org moved to licensed plan
--   'churned'             — subscription ended without renewal

CREATE TABLE IF NOT EXISTS user_events (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type   text        NOT NULL,
    metadata     jsonb       DEFAULT '{}',
    created_at   timestamptz DEFAULT now() NOT NULL
);

-- Index for querying by user and event type
CREATE INDEX IF NOT EXISTS idx_user_events_user_id     ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type  ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at  ON user_events(created_at DESC);

-- RLS: users can write their own events; only service role can read all
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events"
    ON user_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own events"
    ON user_events FOR SELECT
    USING (auth.uid() = user_id);

-- ── email_log ────────────────────────────────────────────────────────
-- Tracks which lifecycle email sequence steps have been sent per user.

CREATE TABLE IF NOT EXISTS email_log (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sequence    text        NOT NULL,   -- 'never_activated' | 'trial_expiring' | 'win_back'
    step        integer     NOT NULL,
    sent_at     timestamptz DEFAULT now() NOT NULL,
    opened_at   timestamptz,
    clicked_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_email_log_user_id  ON email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_log_sequence ON email_log(sequence, step);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
-- Only service role / admin can read; no user-level access
CREATE POLICY "Service role only"
    ON email_log FOR ALL
    USING (false);

-- ── admin_notes ──────────────────────────────────────────────────────
-- Internal CRM notes an admin can attach to any user.

CREATE TABLE IF NOT EXISTS admin_notes (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note        text        NOT NULL,
    created_by  text        NOT NULL DEFAULT 'admin',
    created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_notes_user_id ON admin_notes(user_id);

ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
-- Only service role / admin
CREATE POLICY "Service role only"
    ON admin_notes FOR ALL
    USING (false);
