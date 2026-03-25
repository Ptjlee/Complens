// ============================================================
// PayLens — Pay Gap Calculation Engine
// EU Pay Transparency Directive 2023/970 / EntgTranspG
//
// Legal requirement: gaps are computed on HOURLY RATES (Bruttostundenverdienst)
// Priority for hours derivation: weekly_hours > monthly_hours > fte_ratio
// ============================================================

import type {
    EmployeeRecord, NormalisedEmployee, GapResult,
    QuartileResult, DepartmentResult, GradeResult,
    IndividualFlag, AnalysisResult,
    DispersionPoint, GenderDistRow,
} from './types'

// ============================================================
// Statistical utilities
// ============================================================

function median(values: number[]): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2
}

function mean(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((s, v) => s + v, 0) / values.length
}

/** Gap formula: (male - female) / male → positive = women earn less */
function gap(maleVal: number, femaleVal: number): number {
    if (maleVal === 0) return 0
    return (maleVal - femaleVal) / maleVal
}

// ============================================================
// Step 1 — Derive annualised hours and hourly rate
//
// Priority:
//   weekly_hours  → × 52
//   monthly_hours → × 12
//   fte_ratio     → fte × std_weekly × 52
//   fallback      → std_weekly × 52  (full-time assumption)
//
// Salary annualisation:
//   'annual'  → use as-is
//   'monthly' → × 12
//   'hourly'  → × annualised_hours
// ============================================================

const WEEKS_PER_YEAR  = 52
const MONTHS_PER_YEAR = 12

function normalise(
    employees: EmployeeRecord[],
    standardWeeklyHours: number,
): NormalisedEmployee[] {
    const stdAnnualHours = standardWeeklyHours * WEEKS_PER_YEAR

    return employees.map(e => {
        // 1. Derive annualised contractual hours
        let annualisedHours: number
        let hasHoursData = false

        if (e.weekly_hours !== null && e.weekly_hours > 0) {
            annualisedHours = e.weekly_hours * WEEKS_PER_YEAR
            hasHoursData = true
        } else if (e.monthly_hours !== null && e.monthly_hours > 0) {
            annualisedHours = e.monthly_hours * MONTHS_PER_YEAR
            hasHoursData = true
        } else {
            // FTE ratio fallback (clamped 0.1–1.0)
            const fte = Math.min(1, Math.max(0.1, e.fte_ratio || 1))
            annualisedHours = fte * stdAnnualHours
        }

        // Guard against division by zero
        if (annualisedHours <= 0) annualisedHours = stdAnnualHours

        // 2. Annualise base salary based on period
        let annualBase: number
        switch (e.salary_period) {
            case 'monthly': annualBase = e.salary_base * MONTHS_PER_YEAR; break
            case 'hourly':  annualBase = e.salary_base * annualisedHours;  break
            default:        annualBase = e.salary_base                      // 'annual'
        }

        // 3. Resolve salary_variable to annual EUR
        //    'eur'  → use as-is (it’s already an annual cash amount)
        //    'pct'  → fraction × annualBase  (e.g. 0.10 × 50000 = 5000)
        //    'auto' → heuristic: if raw value is < 5 assume it’s a fraction;
        //              otherwise assume it’s EUR. This handles the common case
        //              where user exports 0.10 (10%) without telling us the unit.
        const rawVar = e.salary_variable ?? 0
        let variablePayEur: number
        const vtype = e.variable_pay_type ?? 'auto'
        if (vtype === 'pct') {
            // stored as a percent value (e.g. 10 means 10%) — divide by 100 to get fraction
            // Guard: if raw value is < 2 it's already a decimal fraction (0.15 = 15%) — treat same as auto
            variablePayEur = rawVar < 2
                ? rawVar * annualBase
                : (rawVar / 100) * annualBase
        } else if (vtype === 'eur') {
            variablePayEur = rawVar
        } else {
            // 'auto' heuristic:
            //   < 2        → almost certainly a decimal fraction (0.10 = 10%)  → × salary
            //   2 – 99     → almost certainly a percentage value (10 = 10%)    → ÷ 100 × salary
            //   ≥ 100      → almost certainly an absolute EUR amount            → use as-is
            if (rawVar > 0 && rawVar < 2) {
                variablePayEur = rawVar * annualBase
            } else if (rawVar >= 2 && rawVar < 100) {
                variablePayEur = (rawVar / 100) * annualBase
            } else {
                variablePayEur = rawVar
            }
        }

        // 4. Compute hourly rate — all components per EU Art. 3 definition of remuneration:
        //    base + variable (EUR) + overtime + benefits in kind
        const hourlyRate = (annualBase + variablePayEur + e.overtime_pay + e.benefits_in_kind) / annualisedHours

        return {
            ...e,
            annualised_hours: annualisedHours,
            annual_base_eur:  annualBase,
            hourly_rate:      hourlyRate,
            fte_derived:      annualisedHours / stdAnnualHours,
            has_hours_data:   hasHoursData,
            variable_pay_eur: variablePayEur,
        }
    })
}

// ============================================================
// Step 2 — Compute gap for a cohort (on hourly_rate)
// ============================================================

const MIN_DISPLAY_SIZE             = 5   // Minimum for showing any gap result
const MIN_WIF_SIZE                 = 10  // Minimum for adjusted (WIF) calculations per legal/GDPR
// Minimum opposite-gender occupants in a WIF cell before gender comparison is trusted.
// With only 1 opposite-gender employee their salary IS the median — that single value
// can produce >100% gaps for everyone else in the cell. 2 is the minimum to get a
// meaningful median; real deployments should aim for ≥5 per gender per cell.
const MIN_OPPOSITE_GENDER_COUNT    = 2

type WifCellsFn = (employees: NormalisedEmployee[]) => Map<string, NormalisedEmployee[]>

function computeGap(
    employees: NormalisedEmployee[],
    wifCellsFn: WifCellsFn = groupByWifCell,
): GapResult {
    const male   = employees.filter(e => e.gender === 'male')
    const female = employees.filter(e => e.gender === 'female')

    const rates      = (arr: NormalisedEmployee[]) => arr.map(e => e.hourly_rate)
    // Base salary only (Grundgehalt — no variable, OT, or BIK)
    const baseOnlyRate  = (e: NormalisedEmployee) =>
        e.annualised_hours > 0
            ? e.annual_base_eur / e.annualised_hours
            : 0
    const baseOnlyRates = (arr: NormalisedEmployee[]) => arr.map(baseOnlyRate)

    const maleMedian   = median(rates(male))
    const femaleMedian = median(rates(female))
    const maleMean     = mean(rates(male))
    const femaleMean   = mean(rates(female))

    const maleBaseOnlyMedian   = median(baseOnlyRates(male))
    const femaleBaseOnlyMedian = median(baseOnlyRates(female))
    const maleBaseOnlyMean     = mean(baseOnlyRates(male))
    const femaleBaseOnlyMean   = mean(baseOnlyRates(female))

    const unadjustedMedian = gap(maleMedian, femaleMedian)
    const unadjustedMean   = gap(maleMean, femaleMean)

    // Adjusted gap: WIF cells built with the selected factor set
    let adjustedMean:   number | null = null
    let adjustedMedian: number | null = null

    if (employees.length >= MIN_WIF_SIZE) {
        const cells = wifCellsFn(employees)
        const cellGaps: Array<{ gapMean: number; gapMedian: number; weight: number }> = []

        for (const cell of cells.values()) {
            const m = cell.filter(e => e.gender === 'male')
            const f = cell.filter(e => e.gender === 'female')
            if (m.length === 0 || f.length === 0) continue
            cellGaps.push({
                gapMean:   gap(mean(rates(m)),   mean(rates(f))),
                gapMedian: gap(median(rates(m)), median(rates(f))),
                weight: cell.length,
            })
        }

        if (cellGaps.length > 0) {
            const totalWeight = cellGaps.reduce((s, c) => s + c.weight, 0)
            adjustedMean   = cellGaps.reduce((s, c) => s + c.gapMean   * c.weight, 0) / totalWeight
            adjustedMedian = cellGaps.reduce((s, c) => s + c.gapMedian * c.weight, 0) / totalWeight
        } else {
            adjustedMean   = unadjustedMean
            adjustedMedian = unadjustedMedian
        }
    }

    return {
        unadjusted_mean:      unadjustedMean,
        unadjusted_median:    unadjustedMedian,
        adjusted_mean:        adjustedMean,
        adjusted_median:      adjustedMedian,
        exceeds_5pct:         Math.abs(adjustedMedian ?? unadjustedMedian) >= 0.05,
        female_count:         female.length,
        male_count:           male.length,
        total_count:          employees.length,
        female_median_salary:          femaleMedian,
        male_median_salary:            maleMedian,
        female_mean_salary:            femaleMean,
        male_mean_salary:              maleMean,
        female_base_only_median_salary: femaleBaseOnlyMedian,
        male_base_only_median_salary:   maleBaseOnlyMedian,
        female_base_only_mean_salary:   femaleBaseOnlyMean,
        male_base_only_mean_salary:     maleBaseOnlyMean,
    }
}

// ---- WIF factor helpers ----
const WIF_FIELD_MAP: Record<string, (e: NormalisedEmployee) => string> = {
    job_grade:       e => e.job_grade       ?? '_',
    employment_type: e => e.employment_type ?? '_',
    department:      e => e.department      ?? '_',
    location:        e => e.location        ?? '_',
}

const DEFAULT_WIF_FACTORS = ['job_grade', 'employment_type', 'department', 'location']

function groupByWifCell(
    employees: NormalisedEmployee[],
    wifFactors: string[] = DEFAULT_WIF_FACTORS,
): Map<string, NormalisedEmployee[]> {
    const factors = wifFactors.filter(f => WIF_FIELD_MAP[f])
    if (factors.length === 0) return groupByWifCell(employees, DEFAULT_WIF_FACTORS)

    const cells = new Map<string, NormalisedEmployee[]>()
    for (const e of employees) {
        const key = factors.map(f => WIF_FIELD_MAP[f](e)).join('|')
        if (!cells.has(key)) cells.set(key, [])
        cells.get(key)!.push(e)
    }
    return cells
}

// ============================================================
// Step 3 — Quartile analysis (on hourly_rate)
// ============================================================

function computeQuartiles(employees: NormalisedEmployee[]): QuartileResult {
    const sorted = [...employees].sort((a, b) => a.hourly_rate - b.hourly_rate)
    const n = sorted.length
    const q = Math.floor(n / 4)

    const quartiles = [
        sorted.slice(0, q),
        sorted.slice(q, q * 2),
        sorted.slice(q * 2, q * 3),
        sorted.slice(q * 3),
    ]

    function pcts(group: NormalisedEmployee[]) {
        const f = group.filter(e => e.gender === 'female').length
        const m = group.filter(e => e.gender === 'male').length
        const total = group.length || 1
        return { female_pct: Math.round((f / total) * 100), male_pct: Math.round((m / total) * 100), count: group.length }
    }

    return { q1: pcts(quartiles[0]), q2: pcts(quartiles[1]), q3: pcts(quartiles[2]), q4: pcts(quartiles[3]) }
}

// ============================================================
// Step 4 — Department & grade breakdowns
// ============================================================

function blankGap(count: number): GapResult {
    return {
        unadjusted_mean: 0, unadjusted_median: 0,
        adjusted_mean: null, adjusted_median: null,
        exceeds_5pct: false,
        female_count: 0, male_count: 0, total_count: count,
        female_median_salary: 0, male_median_salary: 0,
        female_mean_salary:   0, male_mean_salary:   0,
        female_base_only_median_salary: 0, male_base_only_median_salary: 0,
        female_base_only_mean_salary:   0, male_base_only_mean_salary:   0,
    }
}

function computeByDepartment(
    employees: NormalisedEmployee[],
    wifCellsFn: WifCellsFn = groupByWifCell,
): DepartmentResult[] {
    const map = new Map<string, NormalisedEmployee[]>()
    for (const e of employees) {
        const k = e.department ?? 'Unbekannt'
        if (!map.has(k)) map.set(k, [])
        map.get(k)!.push(e)
    }
    return [...map.entries()].map(([dept, members]) => {
        const suppressed = members.length < MIN_DISPLAY_SIZE
        return { department: dept, gap: suppressed ? blankGap(members.length) : computeGap(members, wifCellsFn), employee_count: members.length, suppressed }
    }).sort((a, b) =>
        (b.gap.adjusted_median ?? b.gap.unadjusted_median) - (a.gap.adjusted_median ?? a.gap.unadjusted_median)
    )
}

function computeByGrade(
    employees: NormalisedEmployee[],
    wifCellsFn: WifCellsFn = groupByWifCell,
): GradeResult[] {
    const map = new Map<string, NormalisedEmployee[]>()
    for (const e of employees) {
        const k = e.job_grade ?? 'Unbekannt'
        if (!map.has(k)) map.set(k, [])
        map.get(k)!.push(e)
    }
    return [...map.entries()].map(([grade, members]) => {
        const suppressed = members.length < MIN_DISPLAY_SIZE
        return { grade, gap: suppressed ? blankGap(members.length) : computeGap(members, wifCellsFn), employee_count: members.length, suppressed }
    }).sort((a, b) => a.grade.localeCompare(b.grade))
}

// ============================================================
// Step 5 — Individual employee flags
// Flags employees whose pay deviates > threshold from cohort
// (cohort = same job_grade + employment_type)
// Returns ALL employees enriched with cohort context for UI table
// ============================================================

function computeIndividualFlags(
    employees: NormalisedEmployee[],
    threshold = 0.10,
    wifFactors: string[] = DEFAULT_WIF_FACTORS,
): IndividualFlag[] {
    // Build cohort map using the SAME factor key as the adjusted gap (groupByWifCell)
    // so that every employee's cohort_median aligns exactly with the structural WIF cells
    // chosen by the analyst. EU Art. 9: cohort definition must match the WIF model used.
    const activeFactors = wifFactors.filter(f => WIF_FIELD_MAP[f])
    const cohorts = new Map<string, NormalisedEmployee[]>()
    for (const e of employees) {
        const key = activeFactors.map(f => WIF_FIELD_MAP[f](e)).join('|')
        if (!cohorts.has(key)) cohorts.set(key, [])
        cohorts.get(key)!.push(e)
    }

    return employees.map(e => {
        const key = activeFactors.map(f => WIF_FIELD_MAP[f](e)).join('|')
        const cohort = cohorts.get(key) ?? [e]
        const cohortRates = cohort.map(c => c.hourly_rate)
        const cohortMedian = median(cohortRates)

        // Opposite gender median in same cohort (requires MIN_OPPOSITE_GENDER_COUNT
        // to be statistically meaningful — a single person IS the median, creating
        // misleading >100% gaps for all other-gender peers in the cell).
        const oppositeGender = e.gender === 'male' ? 'female'
            : e.gender === 'female' ? 'male' : null
        const oppositeRates = oppositeGender
            ? cohort.filter(c => c.gender === oppositeGender).map(c => c.hourly_rate)
            : []
        const oppositeGenderCount = oppositeRates.length
        const oppositeMedian = oppositeGenderCount >= MIN_OPPOSITE_GENDER_COUNT
            ? median(oppositeRates) : null

        const gapVsCohort  = cohortMedian > 0 ? (e.hourly_rate - cohortMedian) / cohortMedian : 0
        const gapVsGender  = oppositeMedian != null && oppositeMedian > 0
            ? (e.hourly_rate - oppositeMedian) / oppositeMedian : null

        // Directive-aligned DIRECTIONAL severity logic:
        // The EU Pay Transparency Directive (2023/970) mandates remediation only for
        // employees paid LESS than peers. Overpay is an explanation/budget risk, not
        // a legal discrimination risk — it must never reach 'high' (Kritisch).
        //
        //  Underpaid (negative gap) — two bands only:
        //    ≤ -25%              → high     (Kritisch: discrimination risk, pay raise required)
        //    ≤  -5% to -24.99%  → medium   (Nicht konform: investigate and document)
        //    > -5%              → ok       (within tolerable range)
        //
        //  Overpaid (positive gap):
        //    ≥ +5%              → overpaid  (Bevorzugt: document with objective justification)
        //    anything else      → ok        (no pay equity issue)

        const refGapSigned = gapVsGender ?? gapVsCohort  // signed: negative = underpaid

        const severity: IndividualFlag['severity'] =
            refGapSigned <= -0.25 ? 'high'     :  // ≥25% underpaid — Kritisch (Red)
            refGapSigned <= -0.05 ? 'medium'   :  // 5–24.99% underpaid — Nicht konform
            refGapSigned >=  0.05 ? 'overpaid' :  // ≥25% favored vs opposite gender — Bevorzugt
            'ok'

        return {
            employee_id:            e.id,
            employee_ref:           e.employee_ref ?? null,
            first_name:             e.first_name ?? null,
            last_name:              e.last_name ?? null,
            gender:                 e.gender,
            department:             e.department ?? null,
            job_grade:              e.job_grade ?? null,
            employment_type:        e.employment_type,
            hourly_rate:            e.hourly_rate,
            cohort_median:          cohortMedian,
            cohort_size:            cohort.length,
            gap_vs_cohort_pct:      gapVsCohort,
            opposite_gender_median: oppositeMedian,
            opposite_gender_count:  oppositeGenderCount,
            gap_vs_gender_pct:      gapVsGender,
            severity,
            // Raw imported compensation (for Vergütungsdetails pre-fill)
            imported_salary_base:       e.salary_base,
            imported_salary_period:     e.salary_period,
            imported_salary_variable:   e.salary_variable,
            imported_variable_pay_type: e.variable_pay_type ?? 'auto',
            imported_variable_pay_eur:  e.variable_pay_eur,
            imported_overtime_pay:      e.overtime_pay,
            imported_benefits_in_kind:  e.benefits_in_kind,
            imported_weekly_hours:      e.weekly_hours,
            imported_monthly_hours:     e.monthly_hours,
            imported_fte_ratio:         e.fte_ratio,
            imported_annualised_hours:  e.annualised_hours,
        }
    })
}

// ============================================================
// Step 6 — Variable pay gap
// Always operates on variable_pay_eur (post-conversion) so that
// EUR and %-expressed datasets are compared on the same basis.
// ============================================================

function computeVariablePayGap(employees: NormalisedEmployee[]) {
    // Only include employees who actually receive variable pay
    const withVar = employees.filter(e => (e.variable_pay_eur ?? 0) > 0)
    if (withVar.length < MIN_WIF_SIZE) return { mean: null, median: null }
    const male   = withVar.filter(e => e.gender === 'male').map(e => e.variable_pay_eur)
    const female = withVar.filter(e => e.gender === 'female').map(e => e.variable_pay_eur)
    if (!male.length || !female.length) return { mean: null, median: null }
    return { mean: gap(mean(male), mean(female)), median: gap(median(male), median(female)) }
}

// ============================================================
// Step 7 — Dispersion points (Track 1)
// Salary dot-plot data: one point per employee, suppressing
// grades/departments with < MIN_DISPERSION_SIZE employees.
// ============================================================

const MIN_DISPERSION_SIZE = 5
const MAX_DISPERSION_POINTS = 500

function computeDispersionPoints(employees: NormalisedEmployee[]): DispersionPoint[] {
    // Count per grade for suppression check
    const gradeCounts = new Map<string, number>()
    for (const e of employees) {
        const g = e.job_grade ?? '_none_'
        gradeCounts.set(g, (gradeCounts.get(g) ?? 0) + 1)
    }

    const eligible = employees.filter(e => {
        const g = e.job_grade ?? '_none_'
        return (gradeCounts.get(g) ?? 0) >= MIN_DISPERSION_SIZE
    })

    // Shuffle and limit to MAX_DISPERSION_POINTS to avoid huge payloads
    const shuffled = [...eligible].sort(() => Math.random() - 0.5).slice(0, MAX_DISPERSION_POINTS)

    return shuffled.map(e => ({
        gender:       e.gender === 'male' ? 'male' : e.gender === 'female' ? 'female' : 'other',
        annual_salary: e.annualised_hours * e.hourly_rate,   // reconstruct annual total pay
        grade:        e.job_grade ?? null,
        department:   e.department ?? null,
    } satisfies DispersionPoint))
}

// ============================================================
// Step 8 — Gender distribution (Track 1)
// Counts per grade and per department for stacked bar chart.
// ============================================================

function computeGenderDist(employees: NormalisedEmployee[], groupBy: 'grade' | 'department'): GenderDistRow[] {
    const map = new Map<string, { f: number; m: number; o: number }>()
    for (const e of employees) {
        const label = groupBy === 'grade'
            ? (e.job_grade   ?? 'Unbekannt')
            : (e.department  ?? 'Unbekannt')
        if (!map.has(label)) map.set(label, { f: 0, m: 0, o: 0 })
        const row = map.get(label)!
        if (e.gender === 'female') row.f++
        else if (e.gender === 'male') row.m++
        else row.o++
    }
    return [...map.entries()]
        .map(([label, { f, m, o }]) => {
            const total = f + m + o || 1
            return {
                label,
                female_count: f,
                male_count:   m,
                other_count:  o,
                total: f + m + o,
                female_pct: Math.round((f / total) * 100),
                male_pct:   Math.round((m / total) * 100),
            } satisfies GenderDistRow
        })
        .sort((a, b) => a.label.localeCompare(b.label))
}

// ============================================================
// Main export — runAnalysis()
// ============================================================

export interface RunAnalysisOptions {
    /** Which WIF factors to use for the adjusted gap. Defaults to all 4. */
    wifFactors?: string[]
}

export function runAnalysis(
    employees: EmployeeRecord[],
    meta: { dataset_id: string; org_id: string; reporting_year: number; standard_weekly_hours?: number },
    options: RunAnalysisOptions = {},
): AnalysisResult {
    const stdHours    = meta.standard_weekly_hours ?? 40
    const wifFactors  = (options.wifFactors && options.wifFactors.length >= 1)
        ? options.wifFactors
        : DEFAULT_WIF_FACTORS
    const normalised  = normalise(employees, stdHours)

    const withHoursData = normalised.filter(e => e.has_hours_data).length
    const hoursCoveragePct = normalised.length > 0
        ? Math.round((withHoursData / normalised.length) * 100)
        : 0

    // Human-readable assumption description
    let hoursAssumption: string
    if (hoursCoveragePct === 100) {
        hoursAssumption = 'Arbeitsstunden aus Importdaten (100% Abdeckung)'
    } else if (hoursCoveragePct > 0) {
        hoursAssumption = `${hoursCoveragePct}% aus Importdaten, Rest: FTE-Anteil × ${stdHours}h Vollzeit-Referenz`
    } else {
        hoursAssumption = `Keine Stundenangabe — FTE-Anteil × ${stdHours}h Vollzeit-Referenz (Annahme)`
    }

    const wifCells: WifCellsFn = (emps) => groupByWifCell(emps, wifFactors)

    const overall         = computeGap(normalised, wifCells)
    const quartiles       = computeQuartiles(normalised)
    const byDepartment    = computeByDepartment(normalised, wifCells)
    const byGrade         = computeByGrade(normalised, wifCells)
    const variablePay     = computeVariablePayGap(normalised)
    const THRESHOLD       = 0.10
    const individualFlags = computeIndividualFlags(normalised, THRESHOLD, wifFactors)

    // Track 1 — dispersion + gender distribution
    const dispersionPoints   = computeDispersionPoints(normalised)
    const genderByGrade      = computeGenderDist(normalised, 'grade')
    const genderByDepartment = computeGenderDist(normalised, 'department')

    // Track 6 — benefits coverage quality indicator
    const withBenefits = normalised.filter(e => (e.benefits_in_kind ?? 0) > 0).length
    const benefitsCoveragePct = normalised.length > 0
        ? Math.round((withBenefits / normalised.length) * 100)
        : 0

    return {
        dataset_id:            meta.dataset_id,
        org_id:                meta.org_id,
        reporting_year:        meta.reporting_year,
        computed_at:           new Date().toISOString(),
        standard_weekly_hours: stdHours,
        overall,
        quartiles,
        by_department:         byDepartment,
        by_grade:              byGrade,
        total_employees:       normalised.length,
        departments_exceeding_5pct: byDepartment.filter(d => !d.suppressed && d.gap.exceeds_5pct).map(d => d.department),
        wif_factors_used:      wifFactors,
        wif_factors_selected:  options.wifFactors,
        hours_coverage_pct:    hoursCoveragePct,
        hours_assumption:      hoursAssumption,
        variable_pay_gap_mean:   variablePay.mean,
        variable_pay_gap_median: variablePay.median,
        individual_flags:        individualFlags,
        flag_threshold_pct:      THRESHOLD,
        dispersion_points:       dispersionPoints,
        gender_by_grade:         genderByGrade,
        gender_by_department:    genderByDepartment,
        benefits_coverage_pct:   benefitsCoveragePct,
    }
}

// ============================================================
// Formatters
// ============================================================

/** Format a gap ratio as a percentage string e.g. 0.124 → "+12.4%" */
export function formatGap(value: number | null, decimals = 1): string {
    if (value === null) return '—'
    const pct = (value * 100).toFixed(decimals)
    return value >= 0 ? `+${pct}%` : `${pct}%`
}

/** Return severity colour token */
export function gapSeverity(value: number | null): 'green' | 'amber' | 'red' | 'neutral' {
    if (value === null) return 'neutral'
    const abs = Math.abs(value)
    if (abs >= 0.05) return 'red'
    if (abs >= 0.02) return 'amber'
    return 'green'
}
