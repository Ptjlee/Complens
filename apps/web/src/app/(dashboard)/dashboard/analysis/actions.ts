'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runAnalysis } from '@/lib/calculations/payGap'
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
        if (resetErr) return { error: 'Analyse konnte nicht zurückgesetzt werden.' }
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

        if (fetchErr || !rawEmployees?.length) {
            await admin.from('analyses').update({
                status: 'error',
                error_message: 'Keine Mitarbeiterdaten gefunden.',
            }).eq('id', analysisId)
            return { error: 'Keine Mitarbeiterdaten für diesen Datensatz gefunden.' }
        }

        // Map DB rows → engine types (all fields)
        const defaultPeriod = (datasetMeta?.default_salary_period ?? 'annual') as 'annual' | 'monthly' | 'hourly'
        const employees: EmployeeRecord[] = rawEmployees.map(e => ({
            id:               e.id,
            employee_ref:     e.employee_ref ?? null,
            first_name:       e.first_name ?? null,
            last_name:        e.last_name ?? null,
            gender:           e.gender as EmployeeRecord['gender'],
            salary_base:      Number(e.salary_base),
            salary_variable:     Number(e.salary_variable ?? 0),
            variable_pay_type:   (e.variable_pay_type as 'eur' | 'pct' | 'auto') ?? 'auto',
            overtime_pay:        Number(e.overtime_pay ?? 0),
            benefits_in_kind: Number(e.benefits_in_kind ?? 0),
            salary_period:    (e.salary_period as 'annual' | 'monthly' | 'hourly') ?? defaultPeriod,
            weekly_hours:     e.weekly_hours  != null ? Number(e.weekly_hours)  : null,
            monthly_hours:    e.monthly_hours != null ? Number(e.monthly_hours) : null,
            fte_ratio:        Number(e.fte_ratio ?? 1),
            job_title:        e.job_title,
            department:       e.department,
            job_grade:        e.job_grade,
            employment_type:  e.employment_type ?? 'full_time',
            seniority_years:  e.seniority_years ? Number(e.seniority_years) : null,
            location:         e.location,
        }))

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
// Soft-delete a dataset
// ============================================================

export async function deleteDataset(
    datasetId: string,
): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const admin = createAdminClient()
    const { error } = await admin
        .from('datasets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', datasetId)

    return error ? { error: error.message } : {}
}

// ============================================================
// Rename a dataset
// ============================================================

export async function renameDataset(
    datasetId: string,
    newName: string,
): Promise<{ error?: string }> {
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

    return error ? { error: error.message } : {}
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
            datasets(reporting_year, employee_count)
        `)
        .eq('status', 'complete')
        .is('archived_at', null)
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
