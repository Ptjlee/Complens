'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runAnalysis } from '@/lib/calculations/payGap'
import { requireAdminRoleAction } from '@/lib/api/planGuard'
import type { EmployeeRecord } from '@/lib/calculations/types'

// ============================================================
// Run a pay gap analysis for a given dataset
// ============================================================

export async function runDatasetAnalysis(
    datasetId: string,
    analysisName: string,
    mode: 'archive' | 'replace' = 'archive',
    existingAnalysisId?: string,
    wifFactors?: string[],
): Promise<{ analysisId?: string; error?: string }> {
    // ── Role guard: viewers cannot run analyses ──────────────────
    const t = await getTranslations('errors')
    const authCheck = await requireAdminRoleAction()
    if ('error' in authCheck) return { error: authCheck.error }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const admin = createAdminClient()

    // Fetch dataset to get org + reporting year
    const { data: dataset } = await admin
        .from('datasets')
        .select('id, org_id, reporting_year, status')
        .eq('id', datasetId)
        .single()

    if (!dataset) return { error: 'Datensatz nicht gefunden.' }
    if (dataset.status !== 'ready') return { error: 'Datensatz noch nicht bereit.' }

    // Determine which analysis record to work with
    let analysisId: string
    if (mode === 'replace' && existingAnalysisId) {
        // Update the existing record to 'running' first
        const { error: resetErr } = await admin
            .from('analyses')
            .update({ status: 'running', error_message: null, updated_at: new Date().toISOString() })
            .eq('id', existingAnalysisId)
        if (resetErr) return { error: t('analysisResetFailed') }
        analysisId = existingAnalysisId
    } else {
        // Create a new pending analysis record (archive mode)
        const { data: analysis, error: insertErr } = await admin
            .from('analyses')
            .insert({
                org_id:     dataset.org_id,
                dataset_id: datasetId,
                run_by:     user.id,
                name:       analysisName,
                status:     'running',
            })
            .select('id')
            .single()

        if (insertErr || !analysis) return { error: 'Analyse konnte nicht gestartet werden.' }
        analysisId = analysis.id
    }

    try {
        // Fetch dataset meta (hours reference) + all employees for this dataset
        const { data: datasetMeta } = await admin
            .from('datasets')
            .select('standard_weekly_hours, default_salary_period')
            .eq('id', datasetId)
            .single()

        const { data: rawEmployees, error: fetchErr } = await admin
            .from('employees')
            .select(`
                id, employee_ref, first_name, last_name,
                gender, salary_base, salary_variable, variable_pay_type,
                overtime_pay, benefits_in_kind, salary_period,
                weekly_hours, monthly_hours, fte_ratio,
                job_title, department, job_grade,
                employment_type, seniority_years, location
            `)
            .eq('dataset_id', datasetId)

        // Fetch confirmed job assignments → job family name for each employee
        const { data: jobAssignments } = await admin
            .from('employee_job_assignments')
            .select('employee_id, job_id, jobs(id, title, family_id, job_family:job_families(name))')
            .eq('dataset_id', datasetId)
            .eq('status', 'confirmed')

        // Build lookup: employee_id → { job_family, job_id, job_title }
        const jobFamilyMap = new Map<string, { job_family: string; job_id: string; job_title: string }>()
        for (const row of jobAssignments ?? []) {
            const r = row as unknown as { employee_id: string; job_id: string; jobs: { id: string; title: string; job_family: { name: string }[] | null } | { id: string; title: string; job_family: { name: string }[] | null }[] | null }
            const job = Array.isArray(r.jobs) ? r.jobs[0] : r.jobs
            if (job) {
                const family = Array.isArray(job.job_family) ? job.job_family[0] : job.job_family
                jobFamilyMap.set(r.employee_id, {
                    job_family:  family?.name ?? '',
                    job_id:      job.id,
                    job_title:   job.title,
                })
            }
        }

        if (fetchErr || !rawEmployees?.length) {
            await admin.from('analyses').update({
                status: 'error',
                error_message: 'Keine Mitarbeiterdaten gefunden.',
            }).eq('id', analysisId)
            return { error: t('noEmployeeDataFound') }
        }

        // C3 — Fetch any manual pay overrides for this analysis run and merge
        // them into the raw employee rows (NULL override field = keep imported value)
        const { data: overrides } = await admin
            .from('employee_pay_overrides')
            .select('employee_id, salary_base, salary_period, salary_variable_eur, salary_variable_pct, variable_pay_mode, overtime_pay, benefits_in_kind, weekly_hours, monthly_hours')
            .eq('analysis_id', analysisId)

        const overrideMap = new Map<string, typeof overrides extends (infer T)[] | null ? T : never>()
        for (const ov of overrides ?? []) overrideMap.set(ov.employee_id, ov)

        // Map DB rows → engine types, applying overrides where present
        const defaultPeriod = (datasetMeta?.default_salary_period ?? 'annual') as 'annual' | 'monthly' | 'hourly'
        const employees: EmployeeRecord[] = rawEmployees.map(e => {
            const ov = overrideMap.get(e.id)
            const jobInfo = jobFamilyMap.get(e.id)

            // Resolve variable pay from override
            let salary_variable  = Number(e.salary_variable ?? 0)
            let variable_pay_type: 'eur' | 'pct' | 'auto' = (e.variable_pay_type as 'eur' | 'pct' | 'auto') ?? 'auto'
            if (ov) {
                const mode = ov.variable_pay_mode ?? 'eur'
                if (mode === 'pct' && ov.salary_variable_pct != null) {
                    salary_variable  = Number(ov.salary_variable_pct)
                    variable_pay_type = 'pct'
                } else if (ov.salary_variable_eur != null) {
                    salary_variable  = Number(ov.salary_variable_eur)
                    variable_pay_type = 'eur'
                }
            }

            return {
                id:               e.id,
                employee_ref:     e.employee_ref ?? null,
                first_name:       e.first_name ?? null,
                last_name:        e.last_name ?? null,
                gender:           e.gender as EmployeeRecord['gender'],
                salary_base:      ov?.salary_base       != null ? Number(ov.salary_base)   : Number(e.salary_base),
                salary_variable,
                variable_pay_type,
                overtime_pay:     ov?.overtime_pay      != null ? Number(ov.overtime_pay)   : Number(e.overtime_pay ?? 0),
                benefits_in_kind: ov?.benefits_in_kind  != null ? Number(ov.benefits_in_kind): Number(e.benefits_in_kind ?? 0),
                salary_period:    (ov?.salary_period ?? e.salary_period ?? defaultPeriod) as 'annual' | 'monthly' | 'hourly',
                weekly_hours:     (ov?.weekly_hours  ?? e.weekly_hours)  != null ? Number(ov?.weekly_hours  ?? e.weekly_hours)  : null,
                monthly_hours:    (ov?.monthly_hours ?? e.monthly_hours) != null ? Number(ov?.monthly_hours ?? e.monthly_hours) : null,
                fte_ratio:        Number(e.fte_ratio ?? 1),
                job_title:        e.job_title,
                department:       e.department,
                job_grade:        e.job_grade,
                employment_type:  e.employment_type ?? 'full_time',
                seniority_years:  e.seniority_years ? Number(e.seniority_years) : null,
                location:         e.location,
                job_family:       jobInfo?.job_family ?? null,
                assigned_job_id:  jobInfo?.job_id ?? null,
                assigned_job_title: jobInfo?.job_title ?? null,
            }
        })

        // Run the calculation engine
        const result = runAnalysis(employees, {
            dataset_id:           datasetId,
            org_id:               dataset.org_id,
            reporting_year:       dataset.reporting_year,
            standard_weekly_hours: datasetMeta?.standard_weekly_hours
                ? Number(datasetMeta.standard_weekly_hours) : 40,
        }, {
            wifFactors,    // undefined = use default 4 factors
        })

        // Persist results
        await admin.from('analyses').update({
            status:                 'complete',
            gap_unadjusted_mean:    result.overall.unadjusted_mean,
            gap_unadjusted_median:  result.overall.unadjusted_median,
            gap_adjusted_mean:      result.overall.adjusted_mean,
            gap_adjusted_median:    result.overall.adjusted_median,
            exceeds_5pct_threshold: result.overall.exceeds_5pct,
            results:                result,
        }).eq('id', analysisId)

        return { analysisId }

    } catch (err) {
        console.error('[analysis] Engine error:', err)
        await admin.from('analyses').update({
            status: 'error',
            error_message: String(err),
        }).eq('id', analysisId)
        return { error: 'Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.' }
    }
}

// ============================================================
// Fetch the latest completed analysis for the current user's org
// Used by the dashboard to populate KPIs
// ============================================================

export async function getLatestAnalysis() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('analyses')
        .select(`
            id, name, created_at,
            gap_unadjusted_mean, gap_unadjusted_median,
            gap_adjusted_mean, gap_adjusted_median,
            exceeds_5pct_threshold, results,
            datasets(name, reporting_year, employee_count)
        `)
        .eq('status', 'complete')
        .is('archived_at', null)            // C1: exclude archived runs from dashboard KPIs
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    return data ?? null
}

// ============================================================
// Fetch all ready datasets for the current org (for the analysis page)
// ============================================================
// Fetch READY datasets for the analysis selector (no deleted)
// ============================================================

export async function getReadyDatasets() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('datasets')
        .select('id, name, reporting_year, employee_count, created_at')
        .eq('status', 'ready')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    return data ?? []
}

// ============================================================
// Fetch ALL datasets for the management UI (list view)
// ============================================================

export async function getAllDatasets() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('datasets')
        .select('id, name, reporting_year, employee_count, created_at, status, deleted_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    return data ?? []
}

// ============================================================
// Hard-delete a dataset + all linked employee records (GDPR Art. 17)
// employees table has ON DELETE CASCADE so they are removed automatically
// ============================================================

export async function deleteDataset(
    datasetId: string,
): Promise<{ error?: string }> {
    // ── Role guard: viewers cannot delete datasets ───────────────
    const authCheck = await requireAdminRoleAction()
    if ('error' in authCheck) return { error: authCheck.error }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const admin = createAdminClient()

    // Also hard-delete any analyses that reference this dataset
    // (analysis results contain aggregated data, not personal data, but clean up anyway)
    await admin
        .from('analyses')
        .delete()
        .eq('dataset_id', datasetId)

    // Hard-delete the dataset — employees cascade-deleted automatically
    const { error } = await admin
        .from('datasets')
        .delete()
        .eq('id', datasetId)

    if (error) return { error: error.message }

    // Flush Next.js server-render cache so Overview & Analysis stop showing the deleted dataset
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/analysis')
    revalidatePath('/dashboard/datasets')
    revalidatePath('/dashboard/reports')
    revalidatePath('/dashboard/trends')

    return {}
}


// ============================================================
// Rename a dataset
// ============================================================

export async function renameDataset(
    datasetId: string,
    newName: string,
): Promise<{ error?: string }> {
    // ── Role guard: viewers cannot rename datasets ───────────────
    const authCheck2 = await requireAdminRoleAction()
    if ('error' in authCheck2) return { error: authCheck2.error }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const trimmed = newName.trim()
    if (!trimmed) return { error: 'Name darf nicht leer sein.' }

    const admin = createAdminClient()
    const { error } = await admin
        .from('datasets')
        .update({ name: trimmed })
        .eq('id', datasetId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/analysis')
    revalidatePath('/dashboard/datasets')

    return {}
}

// ============================================================
// Latest analysis for a SPECIFIC dataset (empty = never analysed)
// ============================================================

export async function getAnalysisForDataset(datasetId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
        .from('analyses')
        .select(`
            id, name, created_at,
            gap_unadjusted_mean, gap_unadjusted_median,
            gap_adjusted_mean, gap_adjusted_median,
            exceeds_5pct_threshold, results,
            datasets(name, reporting_year, employee_count)
        `)
        .eq('dataset_id', datasetId)
        .eq('status', 'complete')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    return data ?? null
}

// ============================================================
// Recommend WIF factors: trial ALL valid combinations through the
// real gap engine and pick the one with minimum |adjusted_median|.
// job_grade is always mandatory.
// Degenerate factors (≥85% same value OR <2 distinct values) are
// pre-filtered so they never pollute comparison cells.
// ============================================================

export type WifRecommendation = {
    recommended: string[]
    stats: Record<string, {
        distinctValues: number
        dominantPct: number
        included: boolean        // passed diversity filter
        reason: string
    }>
    bestGap: number | null       // adjusted_median of the winning combo (0-1 fraction)
}

export async function getRecommendedWifFactors(
    datasetId: string,
): Promise<WifRecommendation> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const ALL_OPTIONAL = ['employment_type', 'department', 'location'] as const
    const fallback: WifRecommendation = {
        recommended: ['job_grade', 'employment_type', 'department', 'location'],
        stats: {},
        bestGap: null,
    }
    if (!user) return fallback

    const admin = createAdminClient()

    // ── 1. Fetch dataset meta ─────────────────────────────────
    const { data: datasetMeta } = await admin
        .from('datasets')
        .select('org_id, reporting_year, standard_weekly_hours, default_salary_period')
        .eq('id', datasetId)
        .single()
    if (!datasetMeta) return fallback

    // ── 2. Fetch all employee rows ────────────────────────────
    const { data: rawEmployees } = await admin
        .from('employees')
        .select(`
            id, employee_ref, first_name, last_name,
            gender, salary_base, salary_variable, variable_pay_type,
            overtime_pay, benefits_in_kind, salary_period,
            weekly_hours, monthly_hours, fte_ratio,
            job_title, department, job_grade,
            employment_type, seniority_years, location
        `)
        .eq('dataset_id', datasetId)

    if (!rawEmployees?.length) return fallback

    // ── 2b. Fetch job family assignments for diversity check ──
    const { data: recJobAssignments } = await admin
        .from('employee_job_assignments')
        .select('employee_id, jobs(job_family:job_families(name))')
        .eq('dataset_id', datasetId)
        .eq('status', 'confirmed')

    const recFamilyMap = new Map<string, string>()
    for (const row of recJobAssignments ?? []) {
        const r = row as unknown as { employee_id: string; jobs: { job_family: { name: string }[] | null } | { job_family: { name: string }[] | null }[] | null }
        const job = Array.isArray(r.jobs) ? r.jobs[0] : r.jobs
        const family = job ? (Array.isArray(job.job_family) ? job.job_family[0] : job.job_family) : null
        if (family?.name) recFamilyMap.set(r.employee_id, family.name)
    }

    // Determine which optional factors are available (include job_family only if assignments exist)
    const optionalFactors: string[] = ['employment_type', 'department', 'location']
    if (recFamilyMap.size > 0) optionalFactors.push('job_family')

    // ── 3. Diversity filter ───────────────────────────────────
    const DOMINANCE = 0.85   // ≥85% same value = degenerate
    const total     = rawEmployees.length
    const stats: WifRecommendation['stats'] = {}
    const qualified: string[] = []   // optional factors that pass the filter

    for (const key of optionalFactors) {
        const freq = new Map<string, number>()
        for (const row of rawEmployees) {
            // For job_family, look up from the assignment map instead of the employee row
            const val = key === 'job_family'
                ? (recFamilyMap.get((row as { id: string }).id) ?? '')
                : String((row as Record<string, unknown>)[key] ?? '').trim()
            if (val) freq.set(val, (freq.get(val) ?? 0) + 1)
        }
        const distinctValues = freq.size
        const maxCount       = freq.size ? Math.max(...freq.values()) : 0
        const dominantPct    = total > 0 ? (maxCount / total) * 100 : 100
        const isDegenerate   = dominantPct >= DOMINANCE * 100
        const hasDiversity   = distinctValues >= 2
        const included       = hasDiversity && !isDegenerate

        stats[key] = {
            distinctValues,
            dominantPct: Math.round(dominantPct),
            included,
            reason: !hasDiversity
                ? 'Nur ein einziger Wert vorhanden – kein Trennmerkmal'
                : isDegenerate
                    ? `${Math.round(dominantPct)}% haben denselben Wert – zu homogen`
                    : `${distinctValues} verschiedene Werte – geeignet`,
        }
        if (included) qualified.push(key)
    }

    // ── 4. Map employees to engine format ─────────────────────
    const defaultPeriod = (datasetMeta.default_salary_period ?? 'annual') as 'annual' | 'monthly' | 'hourly'
    const employees: EmployeeRecord[] = rawEmployees.map(e => ({
        id:               e.id,
        employee_ref:     e.employee_ref ?? null,
        first_name:       e.first_name   ?? null,
        last_name:        e.last_name    ?? null,
        gender:           e.gender as EmployeeRecord['gender'],
        salary_base:      Number(e.salary_base),
        salary_variable:  Number(e.salary_variable ?? 0),
        variable_pay_type: (e.variable_pay_type as 'eur'|'pct'|'auto') ?? 'auto',
        overtime_pay:      Number(e.overtime_pay   ?? 0),
        benefits_in_kind:  Number(e.benefits_in_kind ?? 0),
        salary_period:    (e.salary_period as 'annual'|'monthly'|'hourly') ?? defaultPeriod,
        weekly_hours:     e.weekly_hours  != null ? Number(e.weekly_hours)  : null,
        monthly_hours:    e.monthly_hours != null ? Number(e.monthly_hours) : null,
        fte_ratio:        Number(e.fte_ratio ?? 1),
        job_title:        e.job_title,
        department:       e.department,
        job_grade:        e.job_grade,
        employment_type:  e.employment_type ?? 'full_time',
        seniority_years:  e.seniority_years ? Number(e.seniority_years) : null,
        location:         e.location,
        job_family:       recFamilyMap.get(e.id) ?? null,
    }))

    const engineCfg = {
        dataset_id:            datasetId,
        org_id:                datasetMeta.org_id,
        reporting_year:        datasetMeta.reporting_year,
        standard_weekly_hours: datasetMeta.standard_weekly_hours
            ? Number(datasetMeta.standard_weekly_hours) : 40,
    }

    // ── 5. Trial all 2^n combinations of qualified factors ────
    // Always include job_grade; try every subset of qualified optionals.
    let bestCombo: string[]    = ['job_grade', ...qualified]  // default = all qualified
    let bestGapAbs             = Infinity
    let bestGapValue: number | null = null

    const nOpt = qualified.length
    const totalCombos = 1 << nOpt   // 2^n

    for (let mask = 0; mask < totalCombos; mask++) {
        const combo: string[] = ['job_grade']
        for (let i = 0; i < nOpt; i++) {
            if (mask & (1 << i)) combo.push(qualified[i])
        }
        try {
            const result = runAnalysis(employees, engineCfg, { wifFactors: combo })
            const gap    = Math.abs(result.overall.adjusted_median ?? Infinity)
            if (gap < bestGapAbs) {
                bestGapAbs   = gap
                bestCombo    = combo
                bestGapValue = result.overall.adjusted_median
            }
        } catch { /* skip invalid combinations */ }
    }

    return { recommended: bestCombo, stats, bestGap: bestGapValue }
}



// ============================================================
// Multi-year trend — one GPG point per reporting year
// ============================================================

export type TrendPoint = {
    year:             number
    gap_unadjusted:   number | null
    gap_adjusted:     number | null
    employee_count:   number | null
    exceeds_5pct:     boolean
}

export async function getAnalysisTrend(): Promise<TrendPoint[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('analyses')
        .select(`
            id, created_at,
            gap_unadjusted_median, gap_adjusted_median,
            exceeds_5pct_threshold,
            datasets!inner(reporting_year, employee_count)
        `)
        .eq('status', 'complete')
        .is('archived_at', null)
        .is('datasets.deleted_at', null)
        .order('created_at', { ascending: false })

    if (!data) return []

    // Flatten dataset join, keep latest analysis per reporting_year
    const byYear = new Map<number, TrendPoint>()
    for (const row of data as unknown[]) {
        const r = row as Record<string, unknown>
        const ds = Array.isArray(r.datasets) ? r.datasets[0] : r.datasets
        if (!ds) continue
        const year = (ds as { reporting_year: number }).reporting_year
        if (byYear.has(year)) continue  // already have the latest for this year
        byYear.set(year, {
            year,
            gap_unadjusted: r.gap_unadjusted_median as number | null,
            gap_adjusted:   r.gap_adjusted_median   as number | null,
            employee_count: (ds as { employee_count: number | null }).employee_count,
            exceeds_5pct:   !!(r.exceeds_5pct_threshold),
        })
    }

    return [...byYear.values()].sort((a, b) => a.year - b.year)
}
