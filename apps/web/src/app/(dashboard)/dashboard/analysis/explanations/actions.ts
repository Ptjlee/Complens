'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminRoleAction } from '@/lib/api/planGuard'
import { EXPLANATION_CATEGORIES } from '@/app/(dashboard)/dashboard/import/constants'

// ============================================================
// Save or update a gap explanation for an employee
// ============================================================

export async function saveExplanation(params: {
    analysisId:   string
    employeeId:   string
    categories:   Array<{ key: string; comment: string }>
    actionPlan:   string
    status?:      'open' | 'in_review' | 'explained'
}): Promise<{ id?: string; error?: string }> {
    // ── Role guard ──
    const authCheck = await requireAdminRoleAction()
    if ('error' in authCheck) return { error: authCheck.error }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const admin = createAdminClient()

    const { data: analysis } = await admin
        .from('analyses')
        .select('org_id')
        .eq('id', params.analysisId)
        .single()
    if (!analysis) return { error: 'Analyse nicht gefunden.' }

    // Sum max_justifiable_pct across all selected categories
    const totalMaxPct = params.categories.reduce((sum, c) => {
        const cat = EXPLANATION_CATEGORIES.find(ec => ec.key === c.key)
        return sum + (cat?.max_justifiable_pct ?? 0)
    }, 0)

    // Primary category = first selected (for legacy `category` column)
    const primaryKey = params.categories[0]?.key ?? 'other'

    const { data, error } = await admin
        .from('pay_gap_explanations')
        .upsert({
            org_id:               analysis.org_id,
            analysis_id:          params.analysisId,
            employee_id:          params.employeeId,
            category:             primaryKey,
            explanation:          params.categories.map(c => c.comment).filter(Boolean).join(' | '),
            categories_json:      params.categories,
            action_plan:          params.actionPlan,
            max_justifiable_pct:  totalMaxPct,
            status:               params.status ?? 'explained',
            created_by:           user.id,
            updated_at:           new Date().toISOString(),
        }, { onConflict: 'analysis_id,employee_id' })
        .select('id')
        .single()

    if (error) return { error: error.message }
    return { id: data?.id }
}

// ============================================================
// Update only the status of an existing explanation
// ============================================================

export async function updateExplanationStatus(
    explanationId: string,
    status: 'open' | 'in_review' | 'explained' | 'rejected',
): Promise<{ error?: string }> {
    // ── Role guard ──
    const authCheck = await requireAdminRoleAction()
    if ('error' in authCheck) return { error: authCheck.error }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const admin = createAdminClient()
    const { error } = await admin
        .from('pay_gap_explanations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', explanationId)

    return error ? { error: error.message } : {}
}

// ============================================================
// Fetch all explanations for a given analysis
// ============================================================

export async function getExplanationsForAnalysis(
    analysisId: string,
): Promise<Array<{
    id: string
    employee_id: string
    category: string
    explanation: string
    max_justifiable_pct: number
    categories_json: Array<{ key: string; comment: string; claimed_pct?: number }>
    action_plan: string
    status: string
    created_at: string
}>> {
    // Auth check — ensure caller is authenticated (admin client bypasses RLS but not auth)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Use admin client: pay_gap_explanations has no RLS policies yet (migration 006/007
    // didn't add them), so the authenticated client silently returns empty rows.
    // Migration 012 will add proper RLS; until then adminClient + analysisId filter is safe.
    const admin = createAdminClient()
    const { data, error } = await admin
        .from('pay_gap_explanations')
        .select('id, employee_id, category, explanation, max_justifiable_pct, categories_json, action_plan, status, created_at')
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[getExplanationsForAnalysis]', error.message)
        return []
    }

    return (data ?? []) as Awaited<ReturnType<typeof getExplanationsForAnalysis>>
}
