'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminRoleAction } from '@/lib/api/planGuard'
import type { AnalysisResult } from '@/lib/calculations/types'

type DatasetRef = { name: string; reporting_year: number; employee_count: number | null } | null

export type AnalysisSummary = {
    id: string
    name: string
    created_at: string
    status: string
    gap_unadjusted_median: number | null
    gap_adjusted_median: number | null
    exceeds_5pct_threshold: boolean | null
    report_notes: string | null
    published_at: string | null
    archived_at: string | null      // null = active, string = archived
    datasets: DatasetRef
}

// ============================================================
// Fetch all completed analyses for the current org
// ============================================================

export async function getAllAnalyses(): Promise<AnalysisSummary[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('analyses')
        .select(`
            id, name, created_at, status,
            gap_unadjusted_median, gap_adjusted_median,
            exceeds_5pct_threshold,
            report_notes, published_at, archived_at,
            datasets!inner(name, reporting_year, employee_count)
        `)
        .eq('status', 'complete')
        .is('datasets.deleted_at', null)
        .order('created_at', { ascending: false })

    // Supabase returns datasets as array for joined relations; take first element
    return ((data ?? []) as unknown[]).map((a: unknown) => {
        const row = a as Record<string, unknown>
        const ds  = Array.isArray(row.datasets) ? row.datasets[0] ?? null : row.datasets
        return { ...row, datasets: ds } as AnalysisSummary
    })
}

// ============================================================
// Fetch a single analysis + its explanations for the report view
// ============================================================

export async function getAnalysisForReport(id: string): Promise<{
    analysis: {
        id: string
        name: string
        created_at: string
        report_notes: string | null
        published_at: string | null
        results: AnalysisResult
        datasets: { name: string; reporting_year: number; employee_count: number | null } | null
    } | null
    explanations: Array<{
        id: string
        employee_id: string
        category: string
        categories_json: Array<{ key: string; comment: string; claimed_pct?: number }>
        action_plan: string
        max_justifiable_pct: number
        status: string
        created_at: string
    }>
    remediationPlans: Array<{
        employee_id: string
        action_type: string
        status: string
        deadline_months: number
        plan_steps: Array<{ horizon: string; description: string }>
    }>
    org: { name: string } | null
}> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { analysis: null, explanations: [], remediationPlans: [], org: null }

    const [analysisRes, orgRes] = await Promise.all([
        supabase
            .from('analyses')
            .select(`
                id, name, created_at, report_notes, published_at, results,
                datasets(name, reporting_year, employee_count)
            `)
            .eq('id', id)
            .eq('status', 'complete')
            .single(),
        supabase
            .from('organisations')
            .select('name')
            .single(),
    ])

    if (!analysisRes.data) return { analysis: null, explanations: [], remediationPlans: [], org: null }

    const [explRes, plansRes] = await Promise.all([
        supabase
            .from('pay_gap_explanations')
            .select('id, employee_id, category, categories_json, action_plan, max_justifiable_pct, status, created_at')
            .eq('analysis_id', id)
            .order('created_at', { ascending: false }),
        supabase
            .from('remediation_plans')
            .select('employee_id, action_type, status, deadline_months, plan_steps')
            .eq('analysis_id', id),
    ])

    const rawAnalysis = analysisRes.data as Record<string, unknown>
    const ds = Array.isArray(rawAnalysis.datasets) ? rawAnalysis.datasets[0] ?? null : rawAnalysis.datasets

    const analysis = {
        ...rawAnalysis,
        datasets: ds as DatasetRef,
        results:  rawAnalysis.results as AnalysisResult,
    } as {
        id: string; name: string; created_at: string
        report_notes: string | null; published_at: string | null
        results: AnalysisResult
        datasets: DatasetRef
    }

    return {
        analysis,
        explanations: (explRes.data ?? []) as Array<{
            id: string
            employee_id: string
            category: string
            categories_json: Array<{ key: string; comment: string; claimed_pct?: number }>
            action_plan: string
            max_justifiable_pct: number
            status: string
            created_at: string
        }>,
        remediationPlans: (plansRes.data ?? []) as Array<{
            employee_id: string
            action_type: string
            status: string
            deadline_months: number
            plan_steps: Array<{ horizon: string; description: string }>
        }>,
        org: orgRes.data,
    }
}

// ============================================================
// Save / update report notes
// ============================================================

export async function saveReportNotes(
    analysisId: string,
    notes: string,
): Promise<{ error?: string }> {
    const authCheck = await requireAdminRoleAction()
    if ('error' in authCheck) return { error: authCheck.error }

    const supabase = await createClient()

    const { error } = await supabase
        .from('analyses')
        .update({ report_notes: notes })
        .eq('id', analysisId)

    return error ? { error: error.message } : {}
}

// ============================================================
// Archive (soft-delete) a report
// ============================================================

export async function archiveAnalysis(
    analysisId: string,
): Promise<{ error?: string }> {
    const authCheck = await requireAdminRoleAction()
    if ('error' in authCheck) return { error: authCheck.error }

    const admin = createAdminClient()
    const { error } = await admin
        .from('analyses')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', analysisId)

    return error ? { error: error.message } : {}
}

// ============================================================
// Unarchive a report
// ============================================================

export async function unarchiveAnalysis(
    analysisId: string,
): Promise<{ error?: string }> {
    const authCheck = await requireAdminRoleAction()
    if ('error' in authCheck) return { error: authCheck.error }

    const admin = createAdminClient()
    const { error } = await admin
        .from('analyses')
        .update({ archived_at: null })
        .eq('id', analysisId)

    return error ? { error: error.message } : {}
}

// ============================================================
// Hard-delete a report (and its explanations via CASCADE)
// ============================================================

export async function deleteAnalysis(
    analysisId: string,
): Promise<{ error?: string }> {
    const authCheck = await requireAdminRoleAction()
    if ('error' in authCheck) return { error: authCheck.error }

    const admin = createAdminClient()
    const { error } = await admin
        .from('analyses')
        .delete()
        .eq('id', analysisId)

    return error ? { error: error.message } : {}
}
