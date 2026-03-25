-- ============================================================
-- Migration 023: Salary Band Extended Columns
-- Adds naming_scheme, auto_computed, and all internal statistics
-- columns referenced by getBandContext.ts / BandGradeSummary type.
-- Also rebuilds salary_band_summary view to include all fields.
-- ============================================================

-- ── salary_bands: naming metadata ────────────────────────────
ALTER TABLE salary_bands
    ADD COLUMN IF NOT EXISTS naming_scheme TEXT,          -- e.g. 'G-Skala', 'TVöD', 'L-Skala'
    ADD COLUMN IF NOT EXISTS auto_computed BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN salary_bands.naming_scheme IS 'Auto-detected grade naming scheme (G-Skala, TVöD, etc.)';
COMMENT ON COLUMN salary_bands.auto_computed IS 'TRUE = created by one-click auto-detect; FALSE = manually configured';

-- ── salary_band_grades: computed internal statistics ─────────
ALTER TABLE salary_band_grades
    ADD COLUMN IF NOT EXISTS internal_min_base      NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS internal_p25_base      NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS internal_median_base   NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS internal_p75_base      NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS internal_max_base      NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS internal_median_total  NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS internal_min_total     NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS internal_max_total     NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS internal_female_median NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS internal_male_median   NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS internal_female_count  INT,
    ADD COLUMN IF NOT EXISTS internal_male_count    INT,
    ADD COLUMN IF NOT EXISTS internal_n             INT,
    ADD COLUMN IF NOT EXISTS computed_at            TIMESTAMPTZ;

COMMENT ON COLUMN salary_band_grades.internal_median_base   IS 'Computed from employee data — median base salary for this grade';
COMMENT ON COLUMN salary_band_grades.internal_female_median IS 'Female median base salary — used for EU Art. 9 intra-grade gap';
COMMENT ON COLUMN salary_band_grades.internal_male_median   IS 'Male median base salary — used for EU Art. 9 intra-grade gap';
COMMENT ON COLUMN salary_band_grades.internal_n             IS 'Total employee count for this grade at time of computation';
COMMENT ON COLUMN salary_band_grades.computed_at            IS 'Timestamp of last internal stats computation';

-- ── salary_band_market_data ───────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_band_market_data (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_id     UUID NOT NULL REFERENCES salary_band_grades(id) ON DELETE CASCADE,
    source_name  TEXT NOT NULL,           -- e.g. 'Kienbaum', 'Radford', 'Stepstone'
    ref_year     INT  NOT NULL,
    region       TEXT,                    -- e.g. 'DE', 'DACH', 'Berlin'
    p25_salary   NUMERIC(12,2),
    p50_salary   NUMERIC(12,2),
    p75_salary   NUMERIC(12,2),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(grade_id, source_name, ref_year)
);

CREATE INDEX IF NOT EXISTS idx_salary_band_market_grade ON salary_band_market_data(grade_id);

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'salary_band_market_data_updated_at'
    ) THEN
        CREATE TRIGGER salary_band_market_data_updated_at
            BEFORE UPDATE ON salary_band_market_data
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

ALTER TABLE salary_band_market_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Members can view market data"
    ON salary_band_market_data FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM salary_band_grades sbg
            JOIN salary_bands sb ON sb.id = sbg.band_id
            WHERE sbg.id = salary_band_market_data.grade_id
              AND sb.org_id = get_user_org_id()
        )
    );

CREATE POLICY IF NOT EXISTS "Admins can manage market data"
    ON salary_band_market_data FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM salary_band_grades sbg
            JOIN salary_bands sb ON sb.id = sbg.band_id
            WHERE sbg.id = salary_band_market_data.grade_id
              AND sb.org_id = get_user_org_id()
              AND get_user_role() IN ('admin', 'analyst')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM salary_band_grades sbg
            JOIN salary_bands sb ON sb.id = sbg.band_id
            WHERE sbg.id = salary_band_market_data.grade_id
              AND sb.org_id = get_user_org_id()
              AND get_user_role() IN ('admin', 'analyst')
        )
    );

-- ── Rebuild salary_band_summary with all fields ───────────────
DROP VIEW IF EXISTS salary_band_summary;

CREATE VIEW salary_band_summary AS
SELECT
    sbg.id,
    sbg.band_id,
    sb.org_id,
    sb.name            AS band_name,
    sb.naming_scheme,
    sb.auto_computed,
    sb.reporting_year,
    sb.currency,
    sbg.job_grade,
    sbg.job_family,
    sbg.level_label,
    sbg.min_salary,
    sbg.max_salary,
    COALESCE(sbg.mid_salary, ROUND((sbg.min_salary + sbg.max_salary) / 2, 2)) AS mid_salary,
    -- Internal computed stats
    sbg.internal_min_base,
    sbg.internal_p25_base,
    sbg.internal_median_base,
    sbg.internal_p75_base,
    sbg.internal_max_base,
    -- Internal total comp stats
    sbg.internal_min_total,
    sbg.internal_median_total,
    sbg.internal_max_total,
    -- Gender breakdown
    sbg.internal_female_median,
    sbg.internal_male_median,
    sbg.internal_female_count,
    sbg.internal_male_count,
    sbg.internal_n,
    sbg.computed_at,
    -- EU Art. 9: intra-grade gender pay gap (♀ vs ♂ median, as %)
    CASE
        WHEN sbg.internal_male_median IS NOT NULL
         AND sbg.internal_male_median > 0
         AND sbg.internal_female_median IS NOT NULL
        THEN ROUND(
            (sbg.internal_female_median - sbg.internal_male_median)
            / sbg.internal_male_median * 100, 1
        )
        ELSE NULL
    END AS intra_grade_gap_pct,
    -- EU Art. 9 compliance flag: gap ≥ 5% = exceeds_5pct
    CASE
        WHEN sbg.internal_male_median IS NOT NULL
         AND sbg.internal_male_median > 0
         AND sbg.internal_female_median IS NOT NULL
        THEN ABS(
            (sbg.internal_female_median - sbg.internal_male_median)
            / sbg.internal_male_median * 100
        ) >= 5
        ELSE FALSE
    END AS exceeds_5pct,
    -- Band spread as % of midpoint
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
    'EU Art. 9 view: salary bands with internal statistics, intra-grade gender pay gap, and compliance flag. '
    'Used by Dashboard, Analysis, Remediation, and PDF/PPT exports.';
