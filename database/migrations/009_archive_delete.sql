-- ============================================================
-- PayLens — Archive / soft-delete support
-- Migration: 009_archive_delete.sql
-- ============================================================

-- Analyses: add archived_at for soft-delete / archiving
ALTER TABLE analyses
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Datasets: add deleted_at for soft-delete
ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN analyses.archived_at IS 'Soft-delete / archive timestamp. NULL = active.';
COMMENT ON COLUMN datasets.deleted_at  IS 'Soft-delete timestamp. NULL = active.';
