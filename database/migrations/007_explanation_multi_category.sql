-- ============================================================
-- PayLens — Multi-category explanation support
-- Migration: 007_explanation_multi_category.sql
-- Extends pay_gap_explanations with:
--   categories_json: [{key, comment}] — one entry per selected category
--   action_plan:     free-text remediation plan
-- ============================================================

ALTER TABLE pay_gap_explanations
    ADD COLUMN IF NOT EXISTS categories_json JSONB    NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS action_plan      TEXT     NOT NULL DEFAULT '';

COMMENT ON COLUMN pay_gap_explanations.categories_json IS
    'Array of selected EU Art.10 categories with per-category justification amounts: [{key, comment, claimed_pct}]. claimed_pct is the HR-chosen partial credit (0 to max_justifiable_pct, capped at MAX_JUSTIFIABLE_CAP=25 total)';
COMMENT ON COLUMN pay_gap_explanations.action_plan IS
    'HR action plan: steps to remediate unexplained residual gap';
