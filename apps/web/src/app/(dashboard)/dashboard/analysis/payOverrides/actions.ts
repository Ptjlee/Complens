'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminRoleAction } from '@/lib/api/planGuard'

// ============================================================
// Types
// ============================================================

export type PayOverride = {
    id?:                  string
    employee_id:          string
    analysis_id:          string
    salary_base:          number | null
    salary_period:        'annual' | 'monthly' | 'hourly' | null
    salary_variable_eur:  number | null
    salary_variable_pct:  number | null
    variable_pay_mode:    'eur' | 'pct'
    overtime_pay:         number | null
    benefits_in_kind:     number | null
    weekly_hours:         number | null
    monthly_hours:        number | null
    exclude_from_report:  boolean
    note:                 string
}

// ============================================================
// Save (upsert) manual pay override for one employee
// ============================================================

export async function savePayOverride(
    params: Omit<PayOverride, 'id'>,
): Promise<{ id?: string; error?: string }> {
    // ── Role guard: viewers cannot set pay overrides ──
    const authCheck = await requireAdminRoleAction()
    if ('error' in authCheck) return { error: authCheck.error }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const admin = createAdminClient()

    // Verify the analysis belongs to this org
    const { data: analysis } = await admin
        .from('analyses')
        .select('org_id')
        .eq('id', params.analysis_id)
        .single()
    if (!analysis) return { error: 'Analyse nicht gefunden.' }

    const { data, error } = await admin
        .from('employee_pay_overrides')
        .upsert({
            org_id:              analysis.org_id,
            analysis_id:         params.analysis_id,
            employee_id:         params.employee_id,
            salary_base:         params.salary_base,
            salary_period:       params.salary_period,
            salary_variable_eur: params.salary_variable_eur,
            salary_variable_pct: params.salary_variable_pct,
            variable_pay_mode:   params.variable_pay_mode,
            overtime_pay:        params.overtime_pay,
            benefits_in_kind:    params.benefits_in_kind,
            weekly_hours:        params.weekly_hours,
            monthly_hours:       params.monthly_hours,
            exclude_from_report: params.exclude_from_report,
            note:                params.note,
            created_by:          user.id,
            updated_at:          new Date().toISOString(),
        }, { onConflict: 'analysis_id,employee_id' })
        .select('id')
        .single()

    if (error) return { error: error.message }
    return { id: data?.id }
}

// ============================================================
// Fetch all overrides for an analysis
// ============================================================

export async function getPayOverridesForAnalysis(
    analysisId: string,
): Promise<PayOverride[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('employee_pay_overrides')
        .select(`
            id, employee_id, analysis_id,
            salary_base, salary_period,
            salary_variable_eur, salary_variable_pct, variable_pay_mode,
            overtime_pay, benefits_in_kind,
            weekly_hours, monthly_hours,
            exclude_from_report, note
        `)
        .eq('analysis_id', analysisId)

    return (data ?? []).map(r => ({
        ...r,
        salary_base:         r.salary_base         != null ? Number(r.salary_base)         : null,
        salary_variable_eur: r.salary_variable_eur != null ? Number(r.salary_variable_eur) : null,
        salary_variable_pct: r.salary_variable_pct != null ? Number(r.salary_variable_pct) : null,
        overtime_pay:        r.overtime_pay         != null ? Number(r.overtime_pay)         : null,
        benefits_in_kind:    r.benefits_in_kind     != null ? Number(r.benefits_in_kind)     : null,
        weekly_hours:        r.weekly_hours         != null ? Number(r.weekly_hours)         : null,
        monthly_hours:       r.monthly_hours        != null ? Number(r.monthly_hours)        : null,
        salary_period:       (r.salary_period as PayOverride['salary_period']) ?? null,
        variable_pay_mode:   (r.variable_pay_mode as 'eur' | 'pct') ?? 'eur',
        exclude_from_report: r.exclude_from_report ?? false,
        note:                r.note ?? '',
    }))
}
