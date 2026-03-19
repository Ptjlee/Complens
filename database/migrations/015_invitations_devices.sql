-- ─────────────────────────────────────────────────────────────────────
-- Migration 015: Team Invitations + Device Fingerprinting
-- Purpose:
--   1. pending_invitations — token-based email invitations
--   2. device_sessions     — trusted-device tracking per user
-- ─────────────────────────────────────────────────────────────────────

-- ── 1. pending_invitations ───────────────────────────────────────────
-- Stores an invitation for a specific email + role, created by an admin.
-- When the invitee clicks the link and signs up, we look up this record
-- to join them to the correct org with the correct role.

CREATE TABLE IF NOT EXISTS pending_invitations (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    invited_by  uuid        NOT NULL REFERENCES auth.users(id),
    email       text        NOT NULL,
    role        member_role NOT NULL DEFAULT 'viewer',
    -- One-time token sent in the invite email URL
    token       text        NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    -- Expires 7 days after creation
    expires_at  timestamptz NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    accepted_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (org_id, email)  -- Can't have two open invites for same email in same org
);

CREATE INDEX IF NOT EXISTS idx_pending_invitations_token   ON pending_invitations(token);
CREATE INDEX IF NOT EXISTS idx_pending_invitations_email   ON pending_invitations(email);
CREATE INDEX IF NOT EXISTS idx_pending_invitations_org_id  ON pending_invitations(org_id);

ALTER TABLE pending_invitations ENABLE ROW LEVEL SECURITY;

-- Admin of the org can view and insert invitations
CREATE POLICY "Admins can view their org invitations"
    ON pending_invitations FOR SELECT
    USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can insert invitations"
    ON pending_invitations FOR INSERT
    WITH CHECK (org_id = get_user_org_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete invitations"
    ON pending_invitations FOR DELETE
    USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- ── 2. device_sessions ───────────────────────────────────────────────
-- Tracks trusted devices / browsers per user.
-- Fingerprint is a hash: browser UA + screen resolution + timezone,
-- computed client-side. Not perfect but prevents casual sharing.
-- 
-- On every login:
--   - If fingerprint matches a known trusted device → allow
--   - If new fingerprint → mark session as 'new_device', send warning email
--   - If org admin configured 'strict' mode → block new devices until approved
--
-- max trusted devices per user: 3 (prevents account sharing across offices)

CREATE TABLE IF NOT EXISTS device_sessions (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id          uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    -- Fingerprint: SHA-256 of (userAgent + screenRes + timezone + platform)
    fingerprint     text        NOT NULL,
    label           text,       -- e.g. "MacBook Pro — Chrome" auto-generated or user-named
    trusted         boolean     NOT NULL DEFAULT true,
    last_seen_at    timestamptz NOT NULL DEFAULT now(),
    first_seen_at   timestamptz NOT NULL DEFAULT now(),
    last_ip         text,       -- Stored for audit only; not used for auth decisions
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id     ON device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_fingerprint ON device_sessions(fingerprint);

ALTER TABLE device_sessions ENABLE ROW LEVEL SECURITY;

-- Users can see and manage their own devices
CREATE POLICY "Users can view own devices"
    ON device_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
    ON device_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Insert/update via service role only (from server action after login)
CREATE POLICY "Service role manages devices"
    ON device_sessions FOR INSERT
    WITH CHECK (false);  -- Blocked for normal users; service role bypasses RLS
