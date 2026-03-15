-- ============================================================
-- Migration 010: Employee pay overrides
-- Manual compensation data entered per employee in the individual
-- case view. Used to correct or supplement imported data for more
-- accurate hourly rate calculation. Can be excluded from reports.
-- ============================================================

CREATE TABLE IF NOT EXISTS employee_pay_overrides (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id              UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    analysis_id         UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

    -- Compensation components (all optional — NULL = use imported value)
    salary_base         NUMERIC(12,2),      -- Annual gross base salary (EUR)
    salary_period       TEXT,               -- 'annual' | 'monthly' | 'hourly'
    salary_variable_eur NUMERIC(12,2),      -- Variable pay expressed as EUR amount
    salary_variable_pct NUMERIC(6,4),       -- Variable pay as fraction of base (e.g. 0.10 = 10%)
    variable_pay_mode   TEXT DEFAULT 'eur', -- 'eur' | 'pct' — which of the two above is active
    overtime_pay        NUMERIC(12,2),      -- Annual overtime compensation (EUR)
    benefits_in_kind    NUMERIC(12,2),      -- Annual value of non-cash benefits (EUR)
    weekly_hours        NUMERIC(5,2),       -- Contractual hours/week
    monthly_hours       NUMERIC(6,2),       -- Contractual hours/month

    -- Reporting
    exclude_from_report BOOLEAN NOT NULL DEFAULT FALSE,  -- If true, this employee is omitted from PDF/reports
    note                TEXT,               -- Optional HR note about the override

    -- Audit
    created_by          UUID REFERENCES auth.users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (analysis_id, employee_id)
);

CREATE INDEX idx_pay_overrides_analysis ON employee_pay_overrides(analysis_id);
CREATE INDEX idx_pay_overrides_employee ON employee_pay_overrides(employee_id);

CREATE TRIGGER pay_overrides_updated_at
    BEFORE UPDATE ON employee_pay_overrides
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE employee_pay_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their org's pay overrides"
    ON employee_pay_overrides FOR SELECT
    USING (org_id = get_user_org_id());

CREATE POLICY "Analysts and admins can insert pay overrides"
    ON employee_pay_overrides FOR INSERT
    WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Analysts and admins can update pay overrides"
    ON employee_pay_overrides FOR UPDATE
    USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));
