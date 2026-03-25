'use server'

import { createClient }      from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { GoogleGenerativeAI } from '@google/generative-ai'
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
    if (!user) return { error: 'Nicht angemeldet.' }

    // Resolve org_id from membership
    const { data: memData } = await supabase
        .from('organisation_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single()

    if (!memData?.org_id) return { error: 'Organisation nicht gefunden.' }

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
    if (!user) return { error: 'Nicht angemeldet.' }

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
    if (!user) return { error: 'Nicht angemeldet.' }

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
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { error: 'Gemini API-Key fehlt.' }

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
    if (!user) return { error: 'Nicht angemeldet.' }

    const hasExplanation = !!explData

    // Build Begründungen context block for the prompt
    type CategoryEntry = { key: string; comment?: string; claimed_pct?: number }
    let begSection = 'Keine HR-Begründung vorhanden.'
    if (hasExplanation && explData) {
        const cats: CategoryEntry[] = Array.isArray(explData.categories_json)
            ? (explData.categories_json as CategoryEntry[])
            : []
        const catLines = cats.map((c: CategoryEntry) =>
            `  • ${c.key}${c.claimed_pct != null ? ` (${c.claimed_pct}% geltend gemacht)` : ''}${c.comment ? ': ' + c.comment : ''}`
        ).join('\n')
        const totalClaimed = cats.reduce((s: number, c: CategoryEntry) => s + (c.claimed_pct ?? 0), 0)

        begSection = [
            `Status: ${explData.status}`,
            catLines ? `Kategorien:\n${catLines}` : '',
            `Gesamt geltend gemachte Begründung: ${totalClaimed.toFixed(1)}% (Deckel gem. Art. 18: 25%)`,
            explData.explanation ? `HR-Freitext: ${explData.explanation}` : '',
            explData.action_plan ? `Bereits skizzierter Aktionsplan (HR): ${explData.action_plan}` : '',
        ].filter(Boolean).join('\n')
    }

    const rawGapPct  = (flag.gap_vs_cohort_pct * 100).toFixed(1)
    const annualCurrent = (flag.hourly_rate * flag.imported_annualised_hours).toFixed(0)
    const annualMedian  = (flag.cohort_median * flag.imported_annualised_hours).toFixed(0)

    // Use the adjusted target (closes only the residual) if available; fall back to median
    const effectiveTargetHourly = adjustedTargetHourly > 0 ? adjustedTargetHourly : flag.cohort_median
    const adjustedTargetAnnual = (effectiveTargetHourly * flag.imported_annualised_hours).toFixed(0)

    const name = [flag.first_name, flag.last_name].filter(Boolean).join(' ') || `Mitarbeiter:in ${flag.employee_id}`

    // ── Build plan-steps narrative (if user has defined steps) ──
    const HORIZON_ORDER = ['6m', '1y', '1.5y', '2-3y']
    const HORIZON_LABEL: Record<string, string> = {
        '6m':   'Kurzfristig (≤ 6 Monate)',
        '1y':   'Mittelfristig (ca. 1 Jahr)',
        '1.5y': 'Mittelfristig (ca. 1,5 Jahre)',
        '2-3y': 'Langfristig (2–3 Jahre)',
    }
    const ACTION_LABEL: Record<string, string> = {
        salary_increase:      'Gehaltsanpassung',
        job_reclassification: 'Neueinstufung',
        promotion:            'Beförderung',
        bonus_adjustment:     'Bonusanpassung',
        review:               'Manuelle Prüfung',
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
                ? ` Grundgehalt: ${Math.round(prevBase).toLocaleString('de-DE')} € → ${s.target_salary.toLocaleString('de-DE')} € (+${(((s.target_salary / prevBase) - 1) * 100).toFixed(1)}%)`
                : ''
            const effVarTarget = s.action_type === 'bonus_adjustment' ? s.target_salary : (s.target_variable_pay ?? null)
            const varLine = effVarTarget != null
                ? ` Variabler Anteil: ${Math.round(prevVar).toLocaleString('de-DE')} € → ${Math.round(effVarTarget).toLocaleString('de-DE')} €`
                : ''
            const total = `Gesamt nach Schritt: ${(runBase + runVar).toLocaleString('de-DE', { maximumFractionDigits: 0 })} €/Jahr`
            const resp  = s.responsible ? ` | Zuständig: ${s.responsible}` : ''
            const desc  = s.description ? ` | Hinweis: "${s.description}"` : ''
            return `  Schritt ${i + 1} [${HORIZON_LABEL[s.horizon] ?? s.horizon}] — ${ACTION_LABEL[s.action_type] ?? s.action_type}:${baseLine}${varLine}. ${total}${resp}${desc}`
        })
        const finalTotal = runBase + runVar
        const changeVsNow = ((finalTotal / currentTotal - 1) * 100).toFixed(1)
        stepLines.push(`  → ENDZUSTAND: Grundgehalt ${Math.round(runBase).toLocaleString('de-DE')} €, Variable ${Math.round(runVar).toLocaleString('de-DE')} €, Gesamt ${Math.round(finalTotal).toLocaleString('de-DE')} €/Jahr (${changeVsNow > '0' ? '+' : ''}${changeVsNow}% ggü. heute)`)
        planSection = stepLines.join('\n')
    }

    // hasPlan is always true here (client guards the empty case)
    const prompt = `Du bist Experte für EU-Entgelttransparenz (Richtlinie 2023/970 / EntgTranspG).
Der HR hat bereits einen konkreten Vergütungsplan definiert. Erstelle einen schriftlichen Maßnahmenplan, der AUSSCHLIEßLICH auf diesen definierten Schritten basiert. Erfinde keine eigenen Zahlen.

Organisation: ${orgName}
Berichtsjahr: ${reportingYear}
Mitarbeiter:in: ${name} (${flag.gender === 'female' ? 'weiblich' : flag.gender === 'male' ? 'männlich' : 'divers'})
Abteilung: ${flag.department ?? '—'}
Entgeltgruppe: ${flag.job_grade ?? '—'}
Beschäftigungsart: ${flag.employment_type}

ENTGELTLÜCKENANALYSE:
- Aktueller Bruttostundenlohn: ${flag.hourly_rate.toFixed(2)} €/h
- Kohorten-Median (gleiche WIF-Gruppe): ${flag.cohort_median.toFixed(2)} €/h
- Festgestellte Rohlücke: ${rawGapPct}% (${flag.severity === 'high' ? 'KRITISCH' : flag.severity === 'overpaid' ? 'ÜBERBEZAHLT' : 'ZU PRÜFEN'})
- Aktuelle Jahresvergütung (annualisiert): ${Number(annualCurrent).toLocaleString('de-DE')} € (Basis: ${Math.round(currentBase).toLocaleString('de-DE')} €, Variable: ${Math.round(currentVariable).toLocaleString('de-DE')} €)
- Kohortenmedian (Jahresbasis): ${Number(annualMedian).toLocaleString('de-DE')} €
${hasExplanation
    ? `- Durch HR-Begründung erklärter Anteil: ${(Number(rawGapPct) - residualPct).toFixed(1)}%
- ⚠ VERBLEIBENDE UNERKLÄRTE RESTLÜCKE: ${residualPct.toFixed(1)}% — dieser Anteil erfordert Maßnahmen
- Empfohlenes Zielgehalt (schließt nur Restlücke): ${Number(adjustedTargetAnnual).toLocaleString('de-DE')} €/Jahr`
    : `- Empfohlenes Zielgehalt: ${Number(adjustedTargetAnnual).toLocaleString('de-DE')} €/Jahr`}

BEREITS ERFASSTE HR-BEGRÜNDUNG (aus Analyse-Modul):
${begSection}

VOM HR DEFINIERTER VERGÜTUNGSPLAN (GRUNDLAGE DES MASSNAHMENPLANS):
${planSection}

WICHTIG: Verwende AUSSCHLIEßLICH diese Schritte und ihre Zahlen. Der Plan ist bereits entschieden — formuliere ihn als schriftlichen Maßnahmenplan.
${hasExplanation
    ? `Fokussiere außerdem auf die verbleibende Restlücke von ${residualPct.toFixed(1)}%. Die durch HR-Begründung erklärten ${(Number(rawGapPct) - residualPct).toFixed(1)}% müssen NICHT angepasst werden.`
    : ''}

Erstelle einen Maßnahmenplan mit diesen Abschnitten (Deutsch, sachlich, direkt):
1. **Handlungsbedarf** — Rohlücke, erklärter Anteil, Restlücke (3 Zahlen klar nennen)
2. **Geplante Maßnahmen** — Jeden definierten Schritt mit Zeithorizont, konkreten EUR-Beträgen (Basis+Variable) und Endzustand beschreiben
3. **Zielgehalt** — Endzustand nach allen Schritten (Basis + Variable + Gesamt), Vergleich zu Kohortenmedian
4. **Zeitplan** — Zeitstrahl der definierten Schritte (Horizonte aus Plan)
5. **Zuständigkeit** — Verantwortliche aus den Schritten
6. **Risiko bei Untätigkeit** — rechtlich / reputational

Max. 380 Wörter. Keine Marketing-Sprache. Direkt und professionell.`

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        const response = await model.generateContent(prompt)
        return { text: response.response.text().trim() }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[generateRemediationAiPlan]', msg)
        return { error: `Fehler: ${msg}` }
    }
}
