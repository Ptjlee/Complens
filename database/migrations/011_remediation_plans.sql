-- ============================================================
-- Migration 011: Remediation Plans
-- Stores AI-generated + HR-edited action plans for flagged
-- employees identified by the pay gap analysis engine.
-- ============================================================

CREATE TABLE IF NOT EXISTS remediation_plans (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    analysis_id     UUID NOT NULL REFERENCES analyses(id)     ON DELETE CASCADE,

    -- Employee reference (from individual_flags in the results JSON)
    employee_id     TEXT NOT NULL,   -- same as IndividualFlag.employee_id
    first_name      TEXT,
    last_name       TEXT,
    department      TEXT,
    job_grade       TEXT,
    gender          TEXT,

    -- Gap snapshot at time of plan creation (for audit trail)
    severity        TEXT NOT NULL CHECK (severity IN ('high','medium','low','overpaid')),
    gap_pct         NUMERIC NOT NULL,         -- gap_vs_cohort_pct × 100
    current_hourly  NUMERIC,                  -- IndividualFlag.hourly_rate
    cohort_median   NUMERIC,                  -- IndividualFlag.cohort_median

    -- Remediation action
    action_type     TEXT NOT NULL DEFAULT 'salary_increase'
                    CHECK (action_type IN ('salary_increase','job_reclassification','promotion','bonus_adjustment','review')),
    target_salary   NUMERIC,                  -- new annual gross target (EUR)
    deadline_months INTEGER NOT NULL DEFAULT 6,
    responsible     TEXT,

    -- AI & HR content
    ai_plan         TEXT,                     -- Gemini-generated narrative
    hr_notes        TEXT,

    -- Lifecycle
    status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','completed','dismissed')),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One plan per employee per analysis
    UNIQUE (analysis_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_remediation_org      ON remediation_plans(org_id);
CREATE INDEX IF NOT EXISTS idx_remediation_analysis ON remediation_plans(analysis_id);
CREATE INDEX IF NOT EXISTS idx_remediation_status   ON remediation_plans(org_id, status);

-- Trigger: keep updated_at fresh
CREATE OR REPLACE FUNCTION touch_remediation_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE OR REPLACE TRIGGER trg_remediation_updated
    BEFORE UPDATE ON remediation_plans
    FOR EACH ROW EXECUTE FUNCTION touch_remediation_updated_at();

-- RLS
ALTER TABLE remediation_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their org's remediation plans"
    ON remediation_plans FOR SELECT
    USING (org_id = get_user_org_id());

CREATE POLICY "Analysts and admins can manage remediation plans"
    ON remediation_plans FOR ALL
    USING (
        org_id = get_user_org_id()
        AND get_user_role() IN ('analyst', 'admin')
    )
    WITH CHECK (
        org_id = get_user_org_id()
        AND get_user_role() IN ('analyst', 'admin')
    );
