-- ============================================================
-- PayLens — Pay gap individual explanations
-- Migration: 006_pay_gap_explanations.sql
-- EU Directive 2023/970 Art. 10 — justified pay differences
-- ============================================================

CREATE TABLE IF NOT EXISTS pay_gap_explanations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id       UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    analysis_id  UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    -- Explanation details
    category     TEXT NOT NULL,     -- see EXPLANATION_CATEGORIES in constants
    explanation  TEXT NOT NULL,     -- free-text HR justification
    max_justifiable_pct NUMERIC(5,2) NOT NULL DEFAULT 0,  -- % of gap this category can justify

    -- Workflow status
    status       TEXT NOT NULL DEFAULT 'open',  -- open | in_review | explained | rejected

    -- Audit
    created_by   UUID REFERENCES auth.users(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- One explanation per employee per analysis (upsert target)
    UNIQUE (analysis_id, employee_id)
);

-- Index for common lookups
CREATE INDEX IF NOT EXISTS idx_explanations_analysis ON pay_gap_explanations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_explanations_employee ON pay_gap_explanations(employee_id);

COMMENT ON TABLE pay_gap_explanations IS 'EU Directive Art.10: documented justifications for individual pay gaps';
COMMENT ON COLUMN pay_gap_explanations.max_justifiable_pct IS 'Maximum % of gap this category can objectively justify per directive guidance';
