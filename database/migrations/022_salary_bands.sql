-- ============================================================
-- Migration 022: Salary Bands (Entgeltstufen / Entgeltbänder)
-- EU Pay Transparency Directive 2023/970 — Art. 5, 9
-- EntgTranspG §18 (Germany): employers must be able to publish
-- salary ranges per job grade / worker category on request.
--
-- Design notes (adapted from HR Street App 3 Job Architecture):
--   • One "structure" per org (salary_bands) linked to a year.
--   • One row per grade (salary_band_grades) with min/mid/max.
--   • job_grade in salary_band_grades matches employees.job_grade.
--   • Each analysis can optionally reference a salary_band_id so
--     the engine can flag employees outside their band (compa-ratio).
-- ============================================================

-- ============================================================
-- TABLE: salary_bands
-- Named salary structure for an org (e.g. "Vergütungsstruktur 2025")
-- An org may have multiple structures for different years.
-- ============================================================

CREATE TABLE IF NOT EXISTS salary_bands (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,              -- e.g. "Vergütungsstruktur 2025"
    reporting_year  INT,                        -- NULL = not year-specific
    currency        TEXT NOT NULL DEFAULT 'EUR',
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, name)
);

CREATE INDEX idx_salary_bands_org ON salary_bands(org_id);

CREATE TRIGGER salary_bands_updated_at
    BEFORE UPDATE ON salary_bands
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: salary_band_grades
-- One row per job_grade within a salary_bands structure.
-- min_salary / max_salary are annual gross amounts in EUR.
-- mid_salary is optional (can be computed as (min+max)/2 in UI).
-- ============================================================

CREATE TABLE IF NOT EXISTS salary_band_grades (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    band_id     UUID NOT NULL REFERENCES salary_bands(id) ON DELETE CASCADE,

    -- Matches employees.job_grade — free text so any grade scheme works
    job_grade   TEXT NOT NULL,

    -- Annual gross salary range (EUR)
    min_salary  NUMERIC(12,2) NOT NULL CHECK (min_salary >= 0),
    max_salary  NUMERIC(12,2) NOT NULL CHECK (max_salary >= min_salary),
    mid_salary  NUMERIC(12,2),             -- Optional explicit midpoint

    -- Optional EU Directive fields (EntgTranspG §18)
    job_family  TEXT,                      -- e.g. "Engineering", "Finance"
    level_label TEXT,                      -- e.g. "Senior", "L4", "Band 5"
    notes       TEXT,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(band_id, job_grade)
);

CREATE INDEX idx_salary_band_grades_band    ON salary_band_grades(band_id);
CREATE INDEX idx_salary_band_grades_grade   ON salary_band_grades(band_id, job_grade);

CREATE TRIGGER salary_band_grades_updated_at
    BEFORE UPDATE ON salary_band_grades
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Link analyses to a salary band structure (optional)
-- When set, the engine can compute compa-ratio and flag employees
-- below band minimum or above band maximum.
-- ============================================================

ALTER TABLE analyses
    ADD COLUMN IF NOT EXISTS salary_band_id UUID REFERENCES salary_bands(id) ON DELETE SET NULL;

COMMENT ON COLUMN analyses.salary_band_id IS
    'Optional link to a salary_bands row. When set, individual_flags '
    'include compa_ratio and band_position fields. NULL = no band check.';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE salary_bands       ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_band_grades ENABLE ROW LEVEL SECURITY;

-- salary_bands: all members read; admins/analysts write
CREATE POLICY "Members can view their org salary bands"
    ON salary_bands FOR SELECT
    USING (org_id = get_user_org_id());

CREATE POLICY "Analysts and admins can insert salary bands"
    ON salary_bands FOR INSERT
    WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Analysts and admins can update salary bands"
    ON salary_bands FOR UPDATE
    USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins can delete salary bands"
    ON salary_bands FOR DELETE
    USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- salary_band_grades: inherits access via band_id → salary_bands
CREATE POLICY "Members can view salary band grades"
    ON salary_band_grades FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM salary_bands sb
            WHERE sb.id = salary_band_grades.band_id
              AND sb.org_id = get_user_org_id()
        )
    );

CREATE POLICY "Analysts and admins can insert salary band grades"
    ON salary_band_grades FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM salary_bands sb
            WHERE sb.id = salary_band_grades.band_id
              AND sb.org_id = get_user_org_id()
              AND get_user_role() IN ('admin', 'analyst')
        )
    );

CREATE POLICY "Analysts and admins can update salary band grades"
    ON salary_band_grades FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM salary_bands sb
            WHERE sb.id = salary_band_grades.band_id
              AND sb.org_id = get_user_org_id()
              AND get_user_role() IN ('admin', 'analyst')
        )
    );

CREATE POLICY "Admins can delete salary band grades"
    ON salary_band_grades FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM salary_bands sb
            WHERE sb.id = salary_band_grades.band_id
              AND sb.org_id = get_user_org_id()
              AND get_user_role() = 'admin'
        )
    );

-- ============================================================
-- HELPER VIEW: salary_band_summary
-- Shows each grade with its compa-ratio midpoint and spread.
-- Referenced from the Analysis and Remediation pages.
-- ============================================================

CREATE OR REPLACE VIEW salary_band_summary AS
SELECT
    sbg.id,
    sbg.band_id,
    sb.org_id,
    sb.name          AS band_name,
    sb.reporting_year,
    sb.currency,
    sbg.job_grade,
    sbg.job_family,
    sbg.level_label,
    sbg.min_salary,
    sbg.max_salary,
    COALESCE(sbg.mid_salary, ROUND((sbg.min_salary + sbg.max_salary) / 2, 2)) AS mid_salary,
    -- Spread as % of midpoint (a useful "range width" indicator)
    CASE
        WHEN sbg.min_salary = sbg.max_salary THEN 0
        ELSE ROUND(
            (sbg.max_salary - sbg.min_salary)
            / COALESCE(sbg.mid_salary, (sbg.min_salary + sbg.max_salary) / 2)
            * 100, 1
        )
    END AS spread_pct
FROM salary_band_grades sbg
JOIN salary_bands sb ON sb.id = sbg.band_id
WHERE sb.is_active = TRUE;

COMMENT ON VIEW salary_band_summary IS
    'Active salary bands with computed midpoints and spread %. '
    'Used by the Analysis and Remediation modules to compute compa-ratios.';
