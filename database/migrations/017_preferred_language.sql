-- ============================================================
-- Migration 017: Add preferred_language to organisation_members
-- ============================================================
-- Valid values: 'de' (default) | 'en'
-- Used for UI language selection per user

ALTER TABLE organisation_members
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'de'
    CHECK (preferred_language IN ('de', 'en'));
