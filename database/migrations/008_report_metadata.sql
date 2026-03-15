-- ============================================================
-- PayLens — Report metadata
-- Migration: 008_report_metadata.sql
-- ============================================================

ALTER TABLE analyses
    ADD COLUMN IF NOT EXISTS report_notes TEXT,
    ADD COLUMN IF NOT EXISTS published_at  TIMESTAMPTZ;

COMMENT ON COLUMN analyses.report_notes  IS 'HR manager notes added before publishing the report';
COMMENT ON COLUMN analyses.published_at  IS 'When the report was marked as officially published';
