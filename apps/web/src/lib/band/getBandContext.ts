'use server'

import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { detectNamingScheme, naturalSort } from './bandHelpers'

// ============================================================
// Shared types
// ============================================================

export type BandGradeSummary = {
    id:                    string
    band_id:               string
    band_name:             string
    naming_scheme:         string | null
    reporting_year:        number | null
    currency:              string
    auto_computed:         boolean
    job_grade:             string
    job_family:            string | null
    level_label:           string | null
    // Manual / target band (published min–mid–max)
    min_salary:            number | null
    mid_salary:            number | null
    max_salary:            number | null
    // Internal (from employee data)
    internal_min_base:     number | null
    internal_p25_base:     number | null
    internal_median_base:  number | null
    internal_p75_base:     number | null
    internal_max_base:     number | null
    internal_min_total:    number | null   // total comp (base + variable) min
    internal_median_total: number | null
    internal_max_total:    number | null   // total comp (base + variable) max
    internal_female_median:number | null
    internal_male_median:  number | null
    internal_female_count: number | null
    internal_male_count:   number | null
    internal_n:            number | null
    computed_at:           string | null
    // Computed in DB view
    intra_grade_gap_pct:   number | null
    exceeds_5pct:          boolean
    spread_pct:            number
    // Market benchmark (most recent source)
    market_p25:            number | null
    market_p50:            number | null
    market_p75:            number | null
    market_source:         string | null
    market_year:           number | null
}

export type DatasetOption = {
    id:             string
    name:           string
    reporting_year: number | null
    employee_count: number
}

export type BandContext = {
    has_bands:           boolean
    detected_grades:     string[]
    naming_scheme:       string | null
    total_non_compliant: number
    total_grades:        number
    grades:              BandGradeSummary[]
    datasets:            DatasetOption[]   // all available datasets for the org
    active_dataset_id:   string | null     // which dataset the stats were computed from
}

// ============================================================
// getBandContext — single source of truth for all surfaces
// ============================================================
export async function getBandContext(datasetId?: string): Promise<BandContext> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const empty = { has_bands: false, detected_grades: [], naming_scheme: null, total_non_compliant: 0, total_grades: 0, grades: [], datasets: [], active_dataset_id: datasetId ?? null }
    if (!user) return empty

    // Resolve org_id for secure filtering
    const { data: member } = await supabase
        .from('organisation_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single()
    if (!member?.org_id) return empty
    const orgId = member.org_id

    // Load available datasets for this org (for the picker)
    const { data: dsRows } = await supabase
        .from('datasets')
        .select('id, name, reporting_year')
        .eq('org_id', orgId)
        .order('reporting_year', { ascending: false })

    // Count employees per dataset
    const { data: empCounts } = await supabase
        .from('employees')
        .select('dataset_id')
        .eq('org_id', orgId)
        .not('job_grade', 'is', null)

    const countMap = new Map<string, number>()
    for (const e of (empCounts ?? []) as { dataset_id: string }[]) {
        countMap.set(e.dataset_id, (countMap.get(e.dataset_id) ?? 0) + 1)
    }

    const datasets: DatasetOption[] = (dsRows ?? []).map((d: Record<string, unknown>) => ({
        id:             d.id as string,
        name:           d.name as string,
        reporting_year: d.reporting_year as number | null,
        employee_count: countMap.get(d.id as string) ?? 0,
    })).filter(d => d.employee_count > 0)

    const { data: rows } = await supabase
        .from('salary_band_summary')
        .select('*')
        .eq('org_id', orgId)
        .order('job_grade')

    if (!rows || rows.length === 0) {
        const { grades, scheme } = await getDetectedGrades(datasetId)
        return {
            has_bands:           false,
            detected_grades:     grades,
            naming_scheme:       scheme,
            total_non_compliant: 0,
            total_grades:        0,
            grades:              [],
            datasets,
            active_dataset_id:   datasetId ?? datasets[0]?.id ?? null,
        }
    }

    // Load market data for all grade IDs in one query
    const gradeIds = rows.map((r: Record<string, unknown>) => r.id as string)
    const { data: marketRows } = await supabase
        .from('salary_band_market_data')
        .select('grade_id, p25_salary, p50_salary, p75_salary, source_name, ref_year')
        .in('grade_id', gradeIds)
        .order('ref_year', { ascending: false })

    type MarketRow = { grade_id: string; p25_salary: number | null; p50_salary: number | null; p75_salary: number | null; source_name: string; ref_year: number }
    const marketByGrade = new Map<string, MarketRow>()
    for (const m of (marketRows ?? []) as MarketRow[]) {
        if (!marketByGrade.has(m.grade_id)) marketByGrade.set(m.grade_id, m)
    }

    const grades: BandGradeSummary[] = (rows as Record<string, unknown>[]).map(r => {
        const mkt = marketByGrade.get(r.id as string)

        const rawMid       = r.mid_salary            as number | null
        const rawMin       = r.min_salary            as number | null
        const rawMax       = r.max_salary            as number | null
        const internalMed  = r.internal_median_base  as number | null

        // For auto-computed bands, min_salary = max_salary = 0, so the DB view
        // returns COALESCE(null, (0+0)/2) = 0 as mid_salary.
        // A midpoint of 0 makes compa ratios meaningless (division by zero → null).
        // Fallback: use internal_median_base as the effective midpoint so compa
        // ratios are available as soon as "Interne Bänder berechnen" is run.
        const effectiveMid: number | null =
            (rawMid != null && rawMid > 0)
                ? rawMid
                : (rawMin != null && rawMax != null && rawMin + rawMax > 0)
                    ? (rawMin + rawMax) / 2
                    : internalMed   // ← surrogate midpoint for auto bands

        return {
            id:                    r.id                    as string,
            band_id:               r.band_id               as string,
            band_name:             r.band_name             as string,
            naming_scheme:         r.naming_scheme         as string | null,
            reporting_year:        r.reporting_year        as number | null,
            currency:              (r.currency as string)  ?? 'EUR',
            auto_computed:         (r.auto_computed as boolean) ?? false,
            job_grade:             r.job_grade             as string,
            job_family:            r.job_family            as string | null,
            level_label:           r.level_label           as string | null,
            min_salary:            rawMin,
            mid_salary:            effectiveMid,
            max_salary:            rawMax,
            internal_min_base:     r.internal_min_base     as number | null,
            internal_p25_base:     r.internal_p25_base     as number | null,
            internal_median_base:  internalMed,
            internal_p75_base:     r.internal_p75_base     as number | null,
            internal_max_base:     r.internal_max_base     as number | null,
            internal_min_total:    r.internal_min_total    as number | null,
            internal_median_total: r.internal_median_total as number | null,
            internal_max_total:    r.internal_max_total    as number | null,
            internal_female_median:r.internal_female_median as number | null,
            internal_male_median:  r.internal_male_median  as number | null,
            internal_female_count: r.internal_female_count as number | null,
            internal_male_count:   r.internal_male_count   as number | null,
            internal_n:            r.internal_n            as number | null,
            computed_at:           r.computed_at           as string | null,
            intra_grade_gap_pct:   r.intra_grade_gap_pct  as number | null,
            exceeds_5pct:          (r.exceeds_5pct as boolean) ?? false,
            spread_pct:            (r.spread_pct   as number)  ?? 0,
            market_p25:            mkt?.p25_salary ?? null,
            market_p50:            mkt?.p50_salary ?? null,
            market_p75:            mkt?.p75_salary ?? null,
            market_source:         mkt?.source_name ?? null,
            market_year:           mkt?.ref_year   ?? null,
        }
    })

    return {
        has_bands:           true,
        detected_grades:     grades.map(g => g.job_grade),
        naming_scheme:       grades[0]?.naming_scheme ?? null,
        total_non_compliant: grades.filter(g => g.exceeds_5pct).length,
        total_grades:        grades.length,
        grades,
        datasets,
        active_dataset_id:   datasetId ?? datasets[0]?.id ?? null,
    }
}

// ============================================================
// getDetectedGrades — read distinct job_grade values from employees
// ============================================================
export async function getDetectedGrades(datasetId?: string): Promise<{ grades: string[]; scheme: string | null }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { grades: [], scheme: null }

    const { data: member } = await supabase
        .from('organisation_members').select('org_id').eq('user_id', user.id).single()
    if (!member?.org_id) return { grades: [], scheme: null }

    let q = supabase.from('employees').select('job_grade').eq('org_id', member.org_id).not('job_grade', 'is', null)
    if (datasetId) q = q.eq('dataset_id', datasetId)

    const { data } = await q
    const unique = [...new Set(
        (data ?? []).map((e: { job_grade: string | null }) => e.job_grade ?? '').filter(Boolean)
    )].sort(naturalSort)

    return { grades: unique, scheme: detectNamingScheme(unique) }
}

// ============================================================
// computeInternalBands — reads employees, writes stats to salary_band_grades
// datasetId: which dataset to read employee data from.
//   If omitted, uses the most recent dataset with job_grade data.
// ============================================================
export async function computeInternalBands(
    bandId: string,
    datasetId?: string,
): Promise<{ success: boolean; error?: string; grades_updated: number }> {
    const supabase      = await createClient()
    const adminSupabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht autorisiert.', grades_updated: 0 }

    const { data: member } = await supabase
        .from('organisation_members')
        .select('role, org_id')
        .eq('user_id', user.id)
        .single()
    if (!member || !['admin', 'analyst'].includes(member.role)) {
        return { success: false, error: 'Keine Berechtigung.', grades_updated: 0 }
    }

    // Verify band belongs to this user's org
    const { data: band } = await supabase
        .from('salary_bands')
        .select('id')
        .eq('id', bandId)
        .eq('org_id', member.org_id)
        .single()
    if (!band) {
        return { success: false, error: 'Band nicht gefunden.', grades_updated: 0 }
    }

    // Resolve dataset: if not given, use the latest dataset that has job_grade data
    let resolvedDatasetId = datasetId
    if (!resolvedDatasetId) {
        const { data: latest } = await supabase
            .from('datasets')
            .select('id')
            .order('reporting_year', { ascending: false })
            .limit(1)
            .single()
        resolvedDatasetId = latest?.id
    }
    if (!resolvedDatasetId) {
        return { success: false, error: 'Kein Datensatz gefunden.', grades_updated: 0 }
    }

    // Fetch employees with variable pay type info — filtered to selected dataset
    let empQuery = supabase
        .from('employees')
        .select('job_grade, salary_base, salary_variable, variable_pay_type, salary_period, gender')
        .eq('dataset_id', resolvedDatasetId)
        .not('job_grade', 'is', null)
        .not('salary_base', 'is', null)

    const { data: employees } = await empQuery

    if (!employees || employees.length === 0) {
        return { success: false, error: 'Keine Mitarbeiterdaten im gewählten Datensatz gefunden.', grades_updated: 0 }
    }

    const { data: existingGrades } = await adminSupabase
        .from('salary_band_grades')
        .select('id, job_grade')
        .eq('band_id', bandId)

    if (!existingGrades || existingGrades.length === 0) {
        return { success: false, error: 'Keine Entgeltgruppen in diesem Band. Bitte zuerst Gruppen anlegen.', grades_updated: 0 }
    }

    // ── Variable pay resolver (same logic as payGap.ts normalise()) ──────────
    // salary_variable may be stored as:
    //   • percentage like 20 (= 20% of base) → most common when imported from HR exports
    //   • absolute EUR like 14000 (= €14,000 bonus)
    //   • decimal fraction like 0.20 (treated as 20%)
    // variable_pay_type: 'pct' | 'eur' | 'auto' (default)
    function resolveTotal(e: { salary_base: number; salary_variable: number | null; variable_pay_type: string | null; salary_period: string | null }): number {
        const base = e.salary_base
        const rawVar = e.salary_variable ?? 0
        const vtype = e.variable_pay_type ?? 'auto'
        let varEur: number

        if (vtype === 'pct') {
            // stored as percent value e.g. 20 = 20%
            varEur = rawVar < 2 ? rawVar * base : (rawVar / 100) * base
        } else if (vtype === 'eur') {
            varEur = rawVar
        } else {
            // 'auto' heuristic — same thresholds as payGap.ts:
            //   < 2     → decimal fraction (0.20 = 20%)  → × base
            //   2–99    → percent value   (20 = 20%)     → ÷ 100 × base
            //   ≥ 100   → nominal EUR                    → use as-is
            if (rawVar > 0 && rawVar < 2) {
                varEur = rawVar * base
            } else if (rawVar >= 2 && rawVar < 100) {
                varEur = (rawVar / 100) * base
            } else {
                varEur = rawVar
            }
        }
        return base + varEur
    }

    type EmpRow = { job_grade: string; salary_base: number; salary_variable: number | null; variable_pay_type: string | null; salary_period: string | null; gender: string }
    const byGrade = new Map<string, EmpRow[]>()
    for (const e of employees as EmpRow[]) {
        if (!e.job_grade) continue
        if (!byGrade.has(e.job_grade)) byGrade.set(e.job_grade, [])
        byGrade.get(e.job_grade)!.push(e)
    }

    const percentile = (arr: number[], pct: number): number | null => {
        if (arr.length === 0) return null
        const idx = (pct / 100) * (arr.length - 1)
        const lo = Math.floor(idx), hi = Math.ceil(idx)
        return lo === hi ? arr[lo] : arr[lo] + (arr[hi] - arr[lo]) * (idx - lo)
    }
    const median = (arr: number[]) => percentile(arr, 50)

    let updatedCount = 0
    const now = new Date().toISOString()

    for (const grade of existingGrades as { id: string; job_grade: string }[]) {
        const emps = byGrade.get(grade.job_grade) ?? []
        if (emps.length === 0) continue

        const base  = emps.map(e => e.salary_base).sort((a, b) => a - b)
        const total = emps.map(e => resolveTotal(e)).sort((a, b) => a - b)
        const fBase = emps.filter(e => e.gender === 'female').map(e => e.salary_base).sort((a, b) => a - b)
        const mBase = emps.filter(e => e.gender === 'male').map(e => e.salary_base).sort((a, b) => a - b)

        const { error } = await adminSupabase
            .from('salary_band_grades')
            .update({
                internal_min_base:      base[0]  ?? null,
                internal_p25_base:      percentile(base, 25),
                internal_median_base:   median(base),
                internal_p75_base:      percentile(base, 75),
                internal_max_base:      base[base.length - 1] ?? null,
                internal_min_total:     total[0] ?? null,
                internal_median_total:  median(total),
                internal_max_total:     total[total.length - 1] ?? null,
                internal_female_median: median(fBase),
                internal_male_median:   median(mBase),
                internal_female_count:  fBase.length,
                internal_male_count:    mBase.length,
                internal_n:             emps.length,
                computed_at:            now,
            })
            .eq('id', grade.id)

        if (!error) updatedCount++
    }

    return { success: true, grades_updated: updatedCount }
}

// ============================================================
// createBandFromDetectedGrades — one-click auto-setup
// ============================================================
export async function createBandFromDetectedGrades(
    bandName: string,
    grades:   string[],
): Promise<{ success: boolean; bandId?: string; error?: string }> {
    const supabase      = await createClient()
    const adminSupabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht autorisiert.' }

    // Fetch member row (role + org_id)
    const { data: member } = await adminSupabase
        .from('organisation_members')
        .select('role, org_id')
        .eq('user_id', user.id)
        .single()
    if (!member || member.role !== 'admin') return { success: false, error: 'Nur Admins können Bänder anlegen.' }

    const scheme = detectNamingScheme(grades)

    // Use adminSupabase so the insert is not blocked by RLS
    const { data: band, error: bandErr } = await adminSupabase
        .from('salary_bands')
        .insert({
            org_id:        member.org_id,
            name:          bandName,
            naming_scheme: scheme,
            auto_computed: true,
            is_active:     true,
        })
        .select('id')
        .single()

    if (bandErr || !band) return { success: false, error: bandErr?.message ?? 'Band konnte nicht erstellt werden.' }

    // Insert grade stubs — statistics filled by computeInternalBands below
    const { error: gradeErr } = await adminSupabase
        .from('salary_band_grades')
        .insert(grades.map(g => ({ band_id: band.id, job_grade: g, min_salary: 0, max_salary: 0 })))

    if (gradeErr) return { success: false, error: gradeErr.message }

    const result = await computeInternalBands(band.id)
    if (!result.success) return { success: false, error: result.error }

    return { success: true, bandId: band.id }
}

// ============================================================
// upsertMarketBenchmark
// ============================================================
export async function upsertMarketBenchmark(
    gradeId: string,
    input: { source_name: string; ref_year: number; region?: string; p25_salary?: number | null; p50_salary?: number | null; p75_salary?: number | null }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Nicht autorisiert.' }

    // Verify grade belongs to a band in the user's org
    const { data: grade } = await supabase
        .from('salary_band_grades')
        .select('id, band:salary_bands!inner(org_id)')
        .eq('id', gradeId)
        .single()
    if (!grade) return { success: false, error: 'Grade nicht gefunden.' }

    const { error } = await supabase
        .from('salary_band_market_data')
        .upsert({
            grade_id:    gradeId,
            source_name: input.source_name,
            ref_year:    input.ref_year,
            region:      input.region    ?? null,
            p25_salary:  input.p25_salary ?? null,
            p50_salary:  input.p50_salary ?? null,
            p75_salary:  input.p75_salary ?? null,
        }, { onConflict: 'grade_id,source_name,ref_year' })

    if (error) return { success: false, error: error.message }
    return { success: true }
}

// Pure helpers are re-exported from bandHelpers.ts (see top of file)
