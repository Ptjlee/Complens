-- ============================================================
-- Migration 016: Add profile fields to organisation_members
--               and name/job_title to pending_invitations
-- ============================================================

-- Profile fields on active members (editable in Profile tab)
ALTER TABLE organisation_members
  ADD COLUMN IF NOT EXISTS full_name  TEXT,
  ADD COLUMN IF NOT EXISTS job_title  TEXT;

-- Pre-fill fields on the invite so they transfer on acceptance
ALTER TABLE pending_invitations
  ADD COLUMN IF NOT EXISTS full_name  TEXT,
  ADD COLUMN IF NOT EXISTS job_title  TEXT;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_org_members_name ON organisation_members(full_name);
