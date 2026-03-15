-- ============================================================
-- PayLens — Working hours & salary period fields
-- Migration: 004_working_hours.sql
-- EU Directive 2023/970 / EntgTranspG compliance
-- Hourly rate (Bruttostundenverdienst) is the required unit
-- ============================================================

-- Org-level full-time reference hours
-- e.g. 40h (most German companies), 37.5h, 38h for Tarifvertrag
ALTER TABLE organisations
    ADD COLUMN IF NOT EXISTS standard_weekly_hours NUMERIC(5,2) NOT NULL DEFAULT 40;

-- Per-employee working hours — accept either weekly or monthly
-- Priority for FTE derivation: weekly_hours > monthly_hours > fte_ratio
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS weekly_hours   NUMERIC(5,2)  DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS monthly_hours  NUMERIC(6,2)  DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS salary_period  TEXT          NOT NULL DEFAULT 'annual';

-- salary_period values: 'annual' | 'monthly' | 'hourly'
ALTER TABLE employees
    ADD CONSTRAINT chk_salary_period
    CHECK (salary_period IN ('annual', 'monthly', 'hourly'));

-- Dataset: store reference hours + whether hours data was present
ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS standard_weekly_hours NUMERIC(5,2) NOT NULL DEFAULT 40,
    ADD COLUMN IF NOT EXISTS default_salary_period TEXT         NOT NULL DEFAULT 'annual',
    ADD COLUMN IF NOT EXISTS hours_data_present    BOOLEAN      NOT NULL DEFAULT false;

COMMENT ON COLUMN employees.weekly_hours   IS 'Contractual hours per week (e.g. 32.0). Takes priority over fte_ratio.';
COMMENT ON COLUMN employees.monthly_hours  IS 'Contractual hours per month. Used if weekly_hours absent.';
COMMENT ON COLUMN employees.salary_period  IS 'How salary_base is expressed: annual | monthly | hourly';
COMMENT ON COLUMN datasets.standard_weekly_hours IS 'Full-time reference hours/week for this dataset (org standard)';
COMMENT ON COLUMN datasets.hours_data_present    IS 'Whether any employee rows have weekly/monthly hours mapped';
