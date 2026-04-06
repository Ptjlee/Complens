'use server'

import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getTranslations }   from 'next-intl/server'
import type { IndividualFlag } from '@/lib/calculations/types'

// ============================================================
// Types
// ============================================================

export type ActionType =
    | 'salary_increase'
    | 'job_reclassification'
    | 'promotion'
    | 'bonus_adjustment'
    | 'review'

export type PlanStatus = 'open' | 'in_progress' | 'completed' | 'dismissed'

export type PlanHorizon = '6m' | '1y' | '1.5y' | '2-3y'

export interface PlanStep {
    id:                  string          // client-generated UUID
    step_number:         number
    action_type:         ActionType
    description:         string
    horizon:             PlanHorizon
    target_salary:        number | null   // base salary target (annual €)
    target_variable_pay?: number | null   // variable/bonus target (annual €); undefined = no change
    responsible:         string
    notes:               string
    status:              PlanStatus
}

// Horizon display labels — defined in RemediationClient.tsx (not here, 'use server' allows only async functions)
export interface RemediationPlan {
    id:             string
    analysis_id:    string
    employee_id:    string
    first_name:     string | null
    last_name:      string | null
    department:     string | null
    job_grade:      string | null
    gender:         string | null
    severity:       string
    gap_pct:        number
    current_hourly: number | null
    cohort_median:  number | null
    action_type:    ActionType
    target_salary:  number | null
    deadline_months:number
    responsible:    string | null
    ai_plan:        string | null
    hr_notes:       string | null
    status:         PlanStatus
    plan_steps:     PlanStep[]    // ordered multi-step plan (3–5 steps)
    created_at:     string
    updated_at:     string
}

// ============================================================
// Fetch analyses available for remediation
// ============================================================

export async function getRemediationAnalyses() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('analyses')
        .select(`
            id, name, created_at, dataset_id,
            datasets(reporting_year, name, employee_count)
        `)
        .eq('status', 'complete')
        .is('archived_at', null)
        .order('created_at', { ascending: false })

    if (!data) return []

    // Keep only the latest analysis per dataset — mirrors the behaviour of
    // getAnalysisForDataset() in the Analysis page so both views are always
    // in sync when the same org has multiple datasets or re-runs.
    const seen = new Set<string>()
    const deduped = data.filter(a => {
        const key = a.dataset_id as string
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
    })

    return deduped as unknown as Array<{
        id: string
        name: string
        created_at: string
        datasets: { reporting_year: number; name: string; employee_count: number } | null
    }>
}


// ============================================================
// Fetch remediation plans for an analysis
// ============================================================

export async function getRemediationPlans(analysisId: string): Promise<RemediationPlan[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
        .from('remediation_plans')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('created_at', { ascending: true })

    return (data ?? []) as RemediationPlan[]
}

// ============================================================
// Fetch a single employee's Begründung (pay_gap_explanation)
// Uses adminClient because pay_gap_explanations has no RLS yet
// ============================================================

export interface EmployeeExplanation {
    id:                  string
    employee_id:         string   // for batch indexing
    category:            string
    explanation:         string
    max_justifiable_pct: number
    categories_json:     Array<{ key: string; comment: string; claimed_pct?: number }>
    action_plan:         string
    status:              string
}

// Batch-fetch all explanations for an analysis (one query instead of N)
export async function getExplanationsForAnalysis(
    analysisId: string,
): Promise<Record<string, EmployeeExplanation>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    const admin = createAdminClient()
    const { data } = await admin
        .from('pay_gap_explanations')
        .select('id, employee_id, category, explanation, max_justifiable_pct, categories_json, action_plan, status')
        .eq('analysis_id', analysisId)

    const result: Record<string, EmployeeExplanation> = {}
    for (const row of (data ?? [])) {
        result[row.employee_id] = row as EmployeeExplanation
    }
    return result
}

export async function getExplanationForEmployee(
    analysisId: string,
    employeeId: string,
): Promise<EmployeeExplanation | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const admin = createAdminClient()
    const { data } = await admin
        .from('pay_gap_explanations')
        .select('id, category, explanation, max_justifiable_pct, categories_json, action_plan, status')
        .eq('analysis_id', analysisId)
        .eq('employee_id', employeeId)
        .maybeSingle()

    return (data ?? null) as EmployeeExplanation | null
}

// ============================================================
// Upsert plan (create or update)
// ============================================================

export async function upsertRemediationPlan(
    analysisId: string,
    flag: IndividualFlag,
    patch: Partial<{
        action_type:     ActionType
        target_salary:   number | null
        deadline_months: number
        responsible:     string
        ai_plan:         string
        hr_notes:        string
        status:          PlanStatus
        plan_steps:      PlanStep[]
    }>
): Promise<{ plan?: RemediationPlan; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        const t = await getTranslations('remediation')
        return { error: t('notLoggedIn') }
    }

    // Resolve org_id from membership
    const { data: memData } = await supabase
        .from('organisation_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single()

    if (!memData?.org_id) {
        const t = await getTranslations('remediation')
        return { error: t('orgNotFound') }
    }

    const row = {
        org_id:          memData.org_id,
        analysis_id:     analysisId,
        employee_id:     flag.employee_id,
        first_name:      flag.first_name,
        last_name:       flag.last_name,
        department:      flag.department,
        job_grade:       flag.job_grade,
        gender:          flag.gender,
        severity:        flag.severity,
        gap_pct:         flag.gap_vs_cohort_pct * 100,
        current_hourly:  flag.hourly_rate,
        cohort_median:   flag.cohort_median,
        ...patch,
    }

    const { data, error } = await supabase
        .from('remediation_plans')
        .upsert(row, { onConflict: 'analysis_id,employee_id' })
        .select()
        .single()

    if (error) return { error: error.message }
    return { plan: data as RemediationPlan }
}

// ============================================================
// Update plan fields only (status, notes, etc.)
// ============================================================

export async function updateRemediationPlan(
    planId: string,
    patch: Partial<{
        action_type:    ActionType
        target_salary:  number | null
        deadline_months:number
        responsible:    string
        hr_notes:       string
        status:         PlanStatus
    }>
): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        const t = await getTranslations('remediation')
        return { error: t('notLoggedIn') }
    }

    const { error } = await supabase
        .from('remediation_plans')
        .update(patch)
        .eq('id', planId)

    return error ? { error: error.message } : {}
}

// ============================================================
// Delete a plan
// ============================================================

export async function deleteRemediationPlan(planId: string): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        const t = await getTranslations('remediation')
        return { error: t('notLoggedIn') }
    }

    const { error } = await supabase
        .from('remediation_plans')
        .delete()
        .eq('id', planId)

    return error ? { error: error.message } : {}
}

// ============================================================
// AI: generate remediation plan for a single employee flag
// ============================================================

export async function generateRemediationAiPlan(
    flag: IndividualFlag,
    orgName: string,
    reportingYear: number,
    standardWeeklyHours: number,
    analysisId: string,
    residualPct = 0,
    adjustedTargetHourly = 0,
    planSteps: PlanStep[] = [],   // user-defined compensation steps
): Promise<{ text?: string; error?: string }> {
    const t = await getTranslations('remediation')
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { error: t('apiKeyMissing') }

    const supabase = await createClient()

    // ── Fetch existing Begründung (pay_gap_explanations) for this employee ──
    const admin = createAdminClient()
    const { data: explData } = await admin
        .from('pay_gap_explanations')
        .select('category, explanation, max_justifiable_pct, categories_json, action_plan, status')
        .eq('analysis_id', analysisId)
        .eq('employee_id', flag.employee_id)
        .maybeSingle()

    // auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: t('notLoggedIn') }

    const hasExplanation = !!explData

    // Build Begründungen context block for the prompt
    type CategoryEntry = { key: string; comment?: string; claimed_pct?: number }
    let begSection = t('noExplanation')
    if (hasExplanation && explData) {
        const cats: CategoryEntry[] = Array.isArray(explData.categories_json)
            ? (explData.categories_json as CategoryEntry[])
            : []
        const catLines = cats.map((c: CategoryEntry) =>
            `  • ${c.key}${c.claimed_pct != null ? ` (${c.claimed_pct}%)` : ''}${c.comment ? ': ' + c.comment : ''}`
        ).join('\n')
        const totalClaimed = cats.reduce((s: number, c: CategoryEntry) => s + (c.claimed_pct ?? 0), 0)

        begSection = [
            t('statusLabel', { status: explData.status }),
            catLines ? `${t('categoriesLabel')}\n${catLines}` : '',
            t('totalClaimed', { pct: totalClaimed.toFixed(1) }),
            explData.explanation ? t('hrFreetext', { text: explData.explanation }) : '',
            explData.action_plan ? t('existingPlan', { plan: explData.action_plan }) : '',
        ].filter(Boolean).join('\n')
    }

    const rawGapPct  = (flag.gap_vs_cohort_pct * 100).toFixed(1)
    const annualCurrent = (flag.hourly_rate * flag.imported_annualised_hours).toFixed(0)
    const annualMedian  = (flag.cohort_median * flag.imported_annualised_hours).toFixed(0)

    // Use the adjusted target (closes only the residual) if available; fall back to median
    const effectiveTargetHourly = adjustedTargetHourly > 0 ? adjustedTargetHourly : flag.cohort_median
    const adjustedTargetAnnual = (effectiveTargetHourly * flag.imported_annualised_hours).toFixed(0)

    const name = [flag.first_name, flag.last_name].filter(Boolean).join(' ') || t('employeeFallback', { id: flag.employee_id })

    // ── Build plan-steps narrative (if user has defined steps) ──
    const HORIZON_ORDER = ['6m', '1y', '1.5y', '2-3y']
    const HORIZON_LABEL: Record<string, string> = {
        '6m':   t('horizon6m'),
        '1y':   t('horizon1y'),
        '1.5y': t('horizon1_5y'),
        '2-3y': t('horizon2_3y'),
    }
    const ACTION_LABEL: Record<string, string> = {
        salary_increase:      t('actionSalaryIncrease'),
        job_reclassification: t('actionReclassification'),
        promotion:            t('actionPromotion'),
        bonus_adjustment:     t('actionBonusAdjustment'),
        review:               t('actionReview'),
    }
    const currentBase     = flag.hourly_rate * flag.imported_annualised_hours - flag.imported_variable_pay_eur
    const currentVariable = flag.imported_variable_pay_eur
    const currentTotal    = currentBase + currentVariable

    let planSection = ''
    if (planSteps.length > 0) {
        const sorted = [...planSteps].sort(
            (a, b) => HORIZON_ORDER.indexOf(a.horizon) - HORIZON_ORDER.indexOf(b.horizon)
        )
        let runBase = currentBase
        let runVar  = currentVariable
        const stepLines = sorted.map((s, i) => {
            const prevBase = runBase
            const prevVar  = runVar
            if (s.action_type === 'bonus_adjustment') {
                if (s.target_salary != null) runVar = Math.max(runVar, s.target_salary)
            } else {
                if (s.target_salary        != null) runBase = Math.max(runBase, s.target_salary)
                if (s.target_variable_pay  != null) runVar  = Math.max(runVar,  s.target_variable_pay)
            }
            const baseLine = (s.action_type !== 'bonus_adjustment' && s.target_salary != null)
                ? ` ${t('baseSalary')}: ${Math.round(prevBase).toLocaleString('de-DE')} € → ${s.target_salary.toLocaleString('de-DE')} € (+${(((s.target_salary / prevBase) - 1) * 100).toFixed(1)}%)`
                : ''
            const effVarTarget = s.action_type === 'bonus_adjustment' ? s.target_salary : (s.target_variable_pay ?? null)
            const varLine = effVarTarget != null
                ? ` ${t('variablePay')}: ${Math.round(prevVar).toLocaleString('de-DE')} € → ${Math.round(effVarTarget).toLocaleString('de-DE')} €`
                : ''
            const total = `${t('totalAfterStep')}: ${(runBase + runVar).toLocaleString('de-DE', { maximumFractionDigits: 0 })} ${t('totalPerYear')}`
            const resp  = s.responsible ? ` | ${t('responsible')}: ${s.responsible}` : ''
            const desc  = s.description ? ` | ${t('note')}: "${s.description}"` : ''
            return `  ${t('stepLabel', { num: i + 1 })} [${HORIZON_LABEL[s.horizon] ?? s.horizon}] — ${ACTION_LABEL[s.action_type] ?? s.action_type}:${baseLine}${varLine}. ${total}${resp}${desc}`
        })
        const finalTotal = runBase + runVar
        const changeVsNow = ((finalTotal / currentTotal - 1) * 100).toFixed(1)
        stepLines.push(`  → ${t('finalState')}: ${t('baseSalary')} ${Math.round(runBase).toLocaleString('de-DE')} €, ${t('variablePay')} ${Math.round(runVar).toLocaleString('de-DE')} €, ${t('totalAfterStep')} ${Math.round(finalTotal).toLocaleString('de-DE')} ${t('totalPerYear')} (${changeVsNow > '0' ? '+' : ''}${changeVsNow}% ${t('vsToday')})`)
        planSection = stepLines.join('\n')
    }

    // hasPlan is always true here (client guards the empty case)
    const tp = (key: string, values?: Record<string, any>) => t(`prompt.${key}` as any, values as any)
    const genderLabel = flag.gender === 'female' ? t('genderFemale') : flag.gender === 'male' ? t('genderMale') : t('genderDiverse')
    const severityLabel = flag.severity === 'high' ? t('severityCritical') : flag.severity === 'overpaid' ? t('severityOverpaid') : t('severityReview')

    const prompt = `${tp('role')}
${tp('instruction')}

${tp('orgLabel')}: ${orgName}
${tp('yearLabel')}: ${reportingYear}
${tp('employeeLabel')}: ${name} (${genderLabel})
${tp('deptLabel')}: ${flag.department ?? '—'}
${tp('gradeLabel')}: ${flag.job_grade ?? '—'}
${tp('employmentTypeLabel')}: ${flag.employment_type}

${tp('gapAnalysisTitle')}:
- ${tp('currentHourly')}: ${flag.hourly_rate.toFixed(2)} €/h
- ${tp('cohortMedian')}: ${flag.cohort_median.toFixed(2)} €/h
- ${tp('rawGap')}: ${rawGapPct}% (${severityLabel})
- ${tp('currentAnnual')}: ${Number(annualCurrent).toLocaleString('de-DE')} € (${t('baseSalary')}: ${Math.round(currentBase).toLocaleString('de-DE')} €, ${t('variablePay')}: ${Math.round(currentVariable).toLocaleString('de-DE')} €)
- ${tp('cohortMedianAnnual')}: ${Number(annualMedian).toLocaleString('de-DE')} €
${hasExplanation
    ? `- ${tp('explainedPortion')}: ${(Number(rawGapPct) - residualPct).toFixed(1)}%
- ⚠ ${tp('residualGap')}: ${residualPct.toFixed(1)}% — ${tp('residualRequiresAction')}
- ${tp('targetSalary')}: ${Number(adjustedTargetAnnual).toLocaleString('de-DE')} ${t('totalPerYear')}`
    : `- ${tp('targetSalaryGeneral')}: ${Number(adjustedTargetAnnual).toLocaleString('de-DE')} ${t('totalPerYear')}`}

${tp('existingExplanationTitle')}:
${begSection}

${tp('planTitle')}:
${planSection}

${tp('useOnlySteps')}
${hasExplanation
    ? tp('focusResidual', { residualPct: residualPct.toFixed(1), explainedPct: (Number(rawGapPct) - residualPct).toFixed(1) })
    : ''}

${tp('outputInstructions')}`

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        const response = await model.generateContent(prompt)
        return { text: response.response.text().trim() }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[generateRemediationAiPlan]', msg)
        return { error: t('aiError', { message: msg }) }
    }
}
