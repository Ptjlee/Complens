'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
    Sparkles, Loader2, ChevronDown, ChevronRight,
    CheckCircle2, Clock, XCircle, Wrench,
    TrendingDown, AlertTriangle, Eye, Trash2, Save,
} from 'lucide-react'
import {
    getRemediationPlans,
    upsertRemediationPlan,
    deleteRemediationPlan,
    generateRemediationAiPlan,
    getExplanationForEmployee,
    getExplanationsForAnalysis,
} from './actions'
import type { RemediationPlan, ActionType, PlanStatus, PlanHorizon, PlanStep, EmployeeExplanation } from './actions'
import type { IndividualFlag, AnalysisResult } from '@/lib/calculations/types'

// ============================================================
// Constants (non-translatable)
// ============================================================

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, overpaid: 3 }

const SEVERITY_STYLES: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    high:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    icon: <AlertTriangle size={13} /> },
    medium:  { color: '#f97316', bg: 'rgba(249,115,22,0.1)',   icon: <Eye size={13} /> },
    low:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)',  icon: <Eye size={13} /> },
    overpaid:{ color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   icon: <TrendingDown size={13} /> },
}

const STATUS_ICONS: Record<PlanStatus, { icon: React.ReactNode; color: string }> = {
    open:        { icon: <Clock size={12} />,         color: '#64748b' },
    in_progress: { icon: <Loader2 size={12} />,       color: 'var(--color-pl-brand)' },
    completed:   { icon: <CheckCircle2 size={12} />,  color: '#22c55e' },
    dismissed:   { icon: <XCircle size={12} />,       color: '#6b7280' },
}

// ============================================================
// Hook: translated labels for remediation constants
// ============================================================

function useRemediationLabels() {
    const t = useTranslations('remediationPage')
    return {
        severityMeta: {
            high:    { label: t('severityHigh'),         ...SEVERITY_STYLES.high },
            medium:  { label: t('severityNonCompliant'), ...SEVERITY_STYLES.medium },
            low:     { label: t('severityNonCompliant'), ...SEVERITY_STYLES.low },
            overpaid:{ label: t('severityOverpaid'),     ...SEVERITY_STYLES.overpaid },
        } as Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }>,
        actionTypes: [
            { value: 'salary_increase'      as ActionType, label: t('actionSalaryIncrease') },
            { value: 'job_reclassification' as ActionType, label: t('actionReclassification') },
            { value: 'promotion'            as ActionType, label: t('actionPromotion') },
            { value: 'review'               as ActionType, label: t('actionReview') },
            // 'bonus_adjustment' intentionally omitted — legacy type, still rendered for existing steps
        ],
        statusMeta: {
            open:        { label: t('statusOpen'),       ...STATUS_ICONS.open },
            in_progress: { label: t('statusInProgress'), ...STATUS_ICONS.in_progress },
            completed:   { label: t('statusCompleted'),  ...STATUS_ICONS.completed },
            dismissed:   { label: t('statusDismissed'),  ...STATUS_ICONS.dismissed },
        } as Record<PlanStatus, { label: string; icon: React.ReactNode; color: string }>,
        deadlines: [
            { value: '6m'   as PlanHorizon, label: t('deadlineShort') },
            { value: '1y'   as PlanHorizon, label: t('deadlineMedium1y') },
            { value: '1.5y' as PlanHorizon, label: t('deadlineMedium18m') },
            { value: '2-3y' as PlanHorizon, label: t('deadlineLong') },
        ],
        horizonLabels: {
            '6m':   t('deadlineShort'),
            '1y':   t('deadlineMedium1y'),
            '1.5y': t('deadlineMedium18m'),
            '2-3y': t('deadlineLong'),
        } as Record<PlanHorizon, string>,
    }
}

const HORIZON_COLORS: Record<PlanHorizon, string> = {
    '6m':   '#34d399',
    '1y':   '#60a5fa',
    '1.5y': '#f59e0b',
    '2-3y': 'var(--color-pl-accent)',
}

function newStepId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function makeDefaultStep(n: number, horizon: PlanHorizon): PlanStep {
    return {
        id:                  newStepId(),
        step_number:         n,
        action_type:         'salary_increase',
        description:         '',
        horizon,
        target_salary:       null,
        target_variable_pay: null,
        responsible:         '',
        notes:               '',
        status:              'open',
    }
}

// ============================================================
// Types
// ============================================================

type AnalysisMeta = {
    id: string
    name: string
    created_at: string
    datasets: { reporting_year: number; name: string; employee_count: number } | null
}

type AnalysisData = {
    results: AnalysisResult
    org_name: string
}

// ============================================================
// Helpers
// ============================================================

function displayName(flag: IndividualFlag) {
    const n = [flag.first_name, flag.last_name].filter(Boolean).join(' ')
    return n || `ID ${flag.employee_id.slice(0, 8)}`
}

function eur(v: number | null | undefined, decimals = 0) {
    if (v == null) return '—'
    return v.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + ' €'
}

/**
 * Compute a flag employee's total annual compensation directly from the raw
 * imported fields — NOT from hourly_rate (which is a derived metric).
 * This prevents double-counting or rounding errors in the budget baseline.
 */
function calcAnnualTotal(flag: IndividualFlag): number {
    // Resolve annual base from the original import period
    let annualBase: number
    switch (flag.imported_salary_period) {
        case 'monthly': annualBase = flag.imported_salary_base * 12;               break
        case 'hourly':  annualBase = flag.imported_salary_base * flag.imported_annualised_hours; break
        default:        annualBase = flag.imported_salary_base;                    break
    }
    // Add supplement components (all already EUR/year from the engine)
    return annualBase
        + flag.imported_variable_pay_eur
        + flag.imported_overtime_pay
        + flag.imported_benefits_in_kind
}

/**
 * Annual base pay only (no variable/OT/benefits) — used for salary_increase delta.
 */
function calcAnnualBase(flag: IndividualFlag): number {
    switch (flag.imported_salary_period) {
        case 'monthly': return flag.imported_salary_base * 12
        case 'hourly':  return flag.imported_salary_base * flag.imported_annualised_hours
        default:        return flag.imported_salary_base
    }
}

// ============================================================
// Progression engine — single source of truth for multi-step plans
// Applies steps in horizon order and tracks running base/variable
// state BEFORE each step is applied. All UI and cost calculations
// derive from this to ensure staircase consistency.
// ============================================================

const HORIZON_ORDER: PlanHorizon[] = ['6m', '1y', '1.5y', '2-3y']

type StepState = {
    runningBase:     number
    runningVariable: number
    runningTotal:    number
    runningHourly:   number
}

function computeProgression(
    flag: IndividualFlag,
    steps: PlanStep[],
): { stateBeforeStep: Map<string, StepState>; final: StepState } {
    const sorted = [...steps].sort(
        (a, b) => HORIZON_ORDER.indexOf(a.horizon) - HORIZON_ORDER.indexOf(b.horizon)
    )
    let runningBase     = calcAnnualBase(flag)
    let runningVariable = flag.imported_variable_pay_eur
    const stateBeforeStep = new Map<string, StepState>()

    for (const step of sorted) {
        const snap: StepState = {
            runningBase,
            runningVariable,
            runningTotal:  runningBase + runningVariable,
            runningHourly: (runningBase + runningVariable) / flag.imported_annualised_hours,
        }
        stateBeforeStep.set(step.id, snap)

        if (step.action_type === 'bonus_adjustment') {
            // LEGACY: old steps stored variable amount in target_salary
            if (step.target_salary != null)
                runningVariable = Math.max(runningVariable, step.target_salary)
        } else {
            // NEW: target_salary = base, target_variable_pay = variable (both optional)
            if (step.target_salary != null)
                runningBase = Math.max(runningBase, step.target_salary)
            if (step.target_variable_pay != null)
                runningVariable = Math.max(runningVariable, step.target_variable_pay)
        }
    }
    return {
        stateBeforeStep,
        final: {
            runningBase,
            runningVariable,
            runningTotal:  runningBase + runningVariable,
            runningHourly: (runningBase + runningVariable) / flag.imported_annualised_hours,
        },
    }
}

function selectStyle(): React.CSSProperties {
    return {
        background: 'var(--color-pl-surface-raised)',
        border: '1px solid var(--color-pl-border)',
        color: 'var(--color-pl-text-primary)',
        borderRadius: 8,
        padding: '6px 10px',
        fontSize: 13,
        outline: 'none',
        width: '100%',
    }
}

// ============================================================
// Sub-components
// ============================================================

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="glass-card p-4 flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{label}</span>
            <span className="text-2xl font-bold" style={{ color }}>{value}</span>
        </div>
    )
}

// ─── Budget Simulation Panel ─────────────────────────────────

const HORIZON_BUCKET_COLORS: Record<PlanHorizon, string> = {
    '6m': '#34d399', '1y': '#60a5fa', '1.5y': '#f59e0b', '2-3y': '#a78bfa',
}

function BudgetSimPanel({
    allFlags,
    plans,
    planIndex,
    t,
}: {
    allFlags: IndividualFlag[]
    plans: RemediationPlan[]
    planIndex: Map<string, RemediationPlan>
    t: ReturnType<typeof useTranslations<'remediationPage'>>
}) {
    const horizonBuckets: { key: PlanHorizon; label: string; shortLabel: string; color: string }[] = [
        { key: '6m',   label: t('horizonShort6m'),     shortLabel: t('shortLabel6m'),     color: '#34d399' },
        { key: '1y',   label: t('horizonMedium1y'),    shortLabel: t('shortLabel1y'),     color: '#60a5fa' },
        { key: '1.5y', label: t('horizonMedium18m'),   shortLabel: t('shortLabel18m'),    color: '#f59e0b' },
        { key: '2-3y', label: t('horizonLong2to3y'),   shortLabel: t('shortLabel2to3y'),  color: '#a78bfa' },
    ]
    // ── 1. Payroll baseline from raw import fields ──────────────
    const totalPayroll = allFlags.reduce((sum, f) => sum + calcAnnualTotal(f), 0)

    // ── 2. Cost per horizon bucket using progression engine ─────────────
    // Each step's marginal cost = its target MINUS the running state
    // immediately before it executes (stateBeforeStep). This handles both
    // salary and bonus steps, including cross-type succession (bonus %
    // computed on a post-raise base).
    const horizonCosts: Record<PlanHorizon, number> = { '6m': 0, '1y': 0, '1.5y': 0, '2-3y': 0 }
    let totalMeasureCost = 0

    for (const plan of plans) {
        if (!plan.plan_steps?.length) continue
        const flag = allFlags.find(f => f.employee_id === plan.employee_id)
        if (!flag) continue

        const { stateBeforeStep } = computeProgression(flag, plan.plan_steps)
        const sortedSteps = [...plan.plan_steps].sort(
            (a, b) => HORIZON_ORDER.indexOf(a.horizon) - HORIZON_ORDER.indexOf(b.horizon)
        )

        for (const step of sortedSteps) {
            const before = stateBeforeStep.get(step.id)
            if (!before) continue

            if (step.action_type === 'bonus_adjustment') {
                // LEGACY: variable stored in target_salary
                const delta = step.target_salary != null
                    ? Math.max(0, step.target_salary - before.runningVariable) : 0
                if (delta > 0) {
                    horizonCosts[step.horizon] = (horizonCosts[step.horizon] ?? 0) + delta
                    totalMeasureCost += delta
                }
            } else {
                // Base delta
                const baseDelta = step.target_salary != null
                    ? Math.max(0, step.target_salary - before.runningBase) : 0
                // Variable delta
                const varDelta = step.target_variable_pay != null
                    ? Math.max(0, step.target_variable_pay - before.runningVariable) : 0
                const total = baseDelta + varDelta
                if (total > 0) {
                    horizonCosts[step.horizon] = (horizonCosts[step.horizon] ?? 0) + total
                    totalMeasureCost += total
                }
            }
        }
    }


    const impactPct = totalPayroll > 0 ? (totalMeasureCost / totalPayroll) * 100 : 0
    const afterPayroll = totalPayroll + totalMeasureCost
    const plannedEmployees = plans.filter(p => p.plan_steps?.some(s => s.target_salary != null)).length

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(52,211,153,0.05) 100%)',
                border: '1px solid rgba(99,102,241,0.2)',
            }}
        >
            {/* Panel header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: 'rgba(99,102,241,0.15)' }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-pl-accent)' }}>
                    💶 {t('budgetSimulation')}
                </span>
                <span className="text-xs ml-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('budgetProjection', { count: plannedEmployees })}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-indigo-500/10">

                {/* Status Quo */}
                <div className="px-5 py-4">
                    <p className="text-xs mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('totalPayrollCurrent')}</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{eur(totalPayroll)}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('employeesAnnualBasis', { count: allFlags.length })}</p>
                </div>

                {/* Measure cost */}
                <div className="px-5 py-4">
                    <p className="text-xs mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('totalMeasureCost')}</p>
                    <p className="text-xl font-bold" style={{ color: totalMeasureCost > 0 ? '#f59e0b' : '#64748b' }}>
                        {totalMeasureCost > 0 ? '+' : ''}{eur(totalMeasureCost)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {impactPct > 0 ? t('pctOfPayroll', { pct: impactPct.toFixed(2) }) : t('noTargetSalariesSet')}
                    </p>
                </div>

                {/* After-measure total */}
                <div className="px-5 py-4">
                    <p className="text-xs mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('payrollAfterMeasures')}</p>
                    <p className="text-xl font-bold" style={{ color: '#34d399' }}>{eur(afterPayroll)}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('ifFullyImplemented')}</p>
                </div>

                {/* Timeline breakdown */}
                <div className="px-5 py-4">
                    <p className="text-xs mb-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('costByHorizon')}</p>
                    <div className="space-y-1.5">
                        {horizonBuckets.map(b => (
                            <div key={b.key} className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                                    <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{b.shortLabel}</span>
                                </span>
                                <span className="text-xs font-semibold" style={{ color: horizonCosts[b.key] > 0 ? b.color : 'var(--color-pl-text-tertiary)' }}>
                                    {horizonCosts[b.key] > 0 ? `+${eur(horizonCosts[b.key])}` : '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            {impactPct > 0 && (
                <div className="px-5 py-3 border-t" style={{ borderColor: 'rgba(99,102,241,0.12)' }}>
                    <div className="flex items-center gap-3">
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('measureImpact')}</span>
                        <div className="flex-1 rounded-full overflow-hidden h-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.min(impactPct * 10, 100)}%`,
                                    background: impactPct < 2 ? '#34d399' : impactPct < 5 ? '#f59e0b' : '#ef4444',
                                }}
                            />
                        </div>
                        <span className="text-xs font-semibold flex-shrink-0" style={{ color: impactPct < 2 ? '#34d399' : impactPct < 5 ? '#f59e0b' : '#ef4444' }}>
                            +{impactPct.toFixed(2)}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================================
// Plan row / expansion panel
// ============================================================

function PlanRow({
    flag,
    plan,
    analysisId,
    orgName,
    reportingYear,
    standardWeeklyHours,
    onPlanChange,
    preloadedExplanation,
    labels,
    t,
}: {
    flag: IndividualFlag
    plan: RemediationPlan | undefined
    analysisId: string
    orgName: string
    reportingYear: number
    standardWeeklyHours: number
    onPlanChange: (p: RemediationPlan) => void
    preloadedExplanation: EmployeeExplanation | null
    labels: ReturnType<typeof useRemediationLabels>
    t: ReturnType<typeof useTranslations<'remediationPage'>>
}) {
    const [open, setOpen]               = useState(false)
    const [isSaving, setIsSaving]       = useState(false)
    const [aiLoading, setAiLoading]     = useState(false)
    const [aiText, setAiText]           = useState(plan?.ai_plan ?? '')
    const [aiError, setAiError]         = useState('')
    const [status, setStatus]           = useState<PlanStatus>(plan?.status ?? 'open')
    const [actionType, setActionType]   = useState<ActionType>(plan?.action_type ?? 'salary_increase')
    const [targetSalary, setTargetSalary] = useState<string>(
        plan?.target_salary ? String(Math.round(plan.target_salary)) : ''
    )
    const [deadlineMonths, setDeadlineMonths] = useState(plan?.deadline_months ?? 6)
    const [responsible, setResponsible] = useState(plan?.responsible ?? '')
    const [hrNotes, setHrNotes]         = useState(plan?.hr_notes ?? '')
    const [saveMsg, setSaveMsg]         = useState('')
    const [explanation, setExplanation] = useState<EmployeeExplanation | null>(preloadedExplanation)
    const [explLoading, setExplLoading] = useState(false)

    // Multi-step plan — initialise from DB or create 3 default steps
    const [planSteps, setPlanSteps] = useState<PlanStep[]>(() => {
        if (plan?.plan_steps?.length) return plan.plan_steps
        return [
            makeDefaultStep(1, '6m'),
            makeDefaultStep(2, '1y'),
            makeDefaultStep(3, '2-3y'),
        ]
    })

    // Raw % strings for salary_increase and bonus_adjustment inputs (keyed by step.id)
    // Kept separate from target_salary so the user can type freely without value snapping
    const [pctStrings, setPctStrings] = useState<Record<string, string>>({})

        // Fetch Begründung from Analysis module when row first expands
    useEffect(() => {
        if (!open || explanation !== null || explLoading) return
        setExplLoading(true)
        getExplanationForEmployee(analysisId, flag.employee_id)
            .then(ex => setExplanation(ex ?? null))
            .catch(console.error)
            .finally(() => setExplLoading(false))
    }, [open])  // eslint-disable-line react-hooks/exhaustive-deps

    // ── Sync form state when plan loads from DB (async after mount) ──
    useEffect(() => {
        if (!plan) return
        setAiText(plan.ai_plan ?? '')
        setStatus(plan.status ?? 'open')
        setActionType(plan.action_type ?? 'salary_increase')
        setTargetSalary(plan.target_salary ? String(Math.round(plan.target_salary)) : '')
        setDeadlineMonths(plan.deadline_months ?? 6)
        setResponsible(plan.responsible ?? '')
        setHrNotes(plan.hr_notes ?? '')
        if (plan.plan_steps?.length) setPlanSteps(plan.plan_steps)
    }, [plan?.id])  // fires when plan first arrives from DB

    const sev = labels.severityMeta[flag.severity] ?? labels.severityMeta.medium
    const annualCurrent = flag.hourly_rate * flag.imported_annualised_hours
    const annualMedian  = flag.cohort_median * flag.imported_annualised_hours
    // Cohort gap = basis for severity + EU Art.4 remediation; gender gap is a separate reporting KPI
    const gapPct        = (flag.gap_vs_cohort_pct * 100)
    const hasPlan       = !!plan

    // Derive residual directly from explanation state (no separate state needed)
    const explainedPct = explanation
        ? Math.min(
            (explanation.categories_json ?? []).reduce((s, c) => s + (c.claimed_pct ?? 0), 0),
            25  // Art. 18 cap
          )
        : 0
    const residualPct    = Math.max(0, Math.abs(gapPct) - explainedPct)
    const cachedResidual = explanation !== null ? residualPct : null  // null until first load

    // Adjusted hourly target: close only the residual gap
    // (if 0 residual, target = current; otherwise proportional)
    const adjustedTarget = flag.severity === 'overpaid'
        ? flag.hourly_rate       // overpaid: no increase target
        : residualPct > 0
            // Raise by exactly the residual gap expressed in cohort-median units:
            // target = currentRate + cohortMedian × residualPct/100
            // → gap-at-target = (target - median)/median = -(explainedPct/100) ✓
            ? flag.hourly_rate + flag.cohort_median * (residualPct / 100)
            : flag.cohort_median

    async function handleGenerate() {
        if (planSteps.length === 0) {
            setAiError(t('generateErrorNoSteps'))
            return
        }
        setAiLoading(true)
        setAiError('')
        const { text, error } = await generateRemediationAiPlan(
            flag, orgName, reportingYear, standardWeeklyHours, analysisId,
            residualPct, adjustedTarget, planSteps
        )
        setAiLoading(false)
        if (error) { setAiError(error); return }
        if (text) setAiText(text)
    }

    async function handleSave() {
        setIsSaving(true)
        setSaveMsg('')
        try {
            const ts = targetSalary
                ? parseFloat(targetSalary.replace(/\./g, '').replace(',', '.'))
                : null
            const { plan: saved, error } = await upsertRemediationPlan(analysisId, flag, {
                action_type:     actionType,
                target_salary:   ts,
                deadline_months: deadlineMonths,
                responsible,
                ai_plan:         aiText,
                hr_notes:        hrNotes,
                status,
                plan_steps:      planSteps,
            })
            if (error) {
                setSaveMsg('⚠️ ' + error)
                return
            }
            if (saved) {
                onPlanChange(saved)
                setSaveMsg('✓ ' + t('saved'))
                setTimeout(() => setSaveMsg(''), 3000)
            } else {
                setSaveMsg('⚠️ ' + t('saveFailedEmpty'))
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            setSaveMsg('⚠️ ' + msg)
            console.error('[handleSave]', err)
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete() {
        if (!plan?.id) return
        if (!confirm(t('confirmDelete'))) return
        const { error } = await deleteRemediationPlan(plan.id)
        if (!error) {
            // Notify parent to remove plan
            onPlanChange({ ...plan, status: 'dismissed' })
        }
    }

    return (
        <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-pl-border)', background: 'var(--color-pl-surface)' }}>
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-5 px-5 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
            >
                {/* Chevron: w-4 — matches header placeholder */}
                <span className="w-4 flex-shrink-0 flex items-center">
                    {open ? <ChevronDown size={14} style={{ color: 'var(--color-pl-text-tertiary)' }} />
                           : <ChevronRight size={14} style={{ color: 'var(--color-pl-text-tertiary)' }} />}
                </span>

                {/* Schwere: w-36 */}
                <span className="w-36 flex-shrink-0">
                    <span
                        className="inline-flex items-center justify-center min-w-[100px] gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                        style={{ background: sev.bg, color: sev.color }}
                    >
                        {sev.icon} {sev.label}
                    </span>
                </span>

                {/* Name & ID: w-56 flex-shrink-0 */}
                <span className="w-56 flex flex-col min-w-0 flex-shrink-0">
                    <span className="font-medium text-sm truncate" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {displayName(flag)}
                    </span>
                    <span className="text-xs truncate" style={{ color: 'var(--color-pl-text-tertiary)', marginTop: 2 }}>
                        {flag.employee_id || t('noId')}
                    </span>
                </span>

                {/* Abteilung: w-36 flex-shrink-0 hidden 2xl:flex */}
                <span className="w-36 flex-col justify-center min-w-0 flex-shrink-0 hidden 2xl:flex">
                    <span className="text-sm truncate" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {flag.department ?? t('noDepartment')}
                    </span>
                </span>
                
                {/* Gruppe: w-32 flex-shrink-0 hidden 2xl:flex */}
                <span className="w-32 flex-col justify-center min-w-0 flex-shrink-0 hidden 2xl:flex">
                    <span className="text-sm truncate" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {flag.job_grade ?? t('noGrade')}
                    </span>
                </span>

                {/* Gehalt: w-28 flex-shrink-0 hidden md:flex */}
                <span className="w-28 flex flex-col text-right flex-shrink-0 hidden md:flex">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {eur(flag.hourly_rate, 2)} / h
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-pl-text-tertiary)', marginTop: 2 }}>
                        {eur(annualCurrent)} p.a.
                    </span>
                </span>

                {/* Kohorte: w-28 flex-shrink-0 hidden md:flex */}
                <span className="w-28 flex flex-col text-right flex-shrink-0 hidden md:flex">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {eur(flag.cohort_median, 2)} / h
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-pl-text-tertiary)', marginTop: 2 }}>
                        {eur(annualMedian)} p.a.
                    </span>
                </span>

                {/* Lücke (Kohorte): w-24 — cohort gap, basis for severity + EU Art.4 */}
                <span className="w-24 flex flex-col text-right flex-shrink-0">
                    <span className="text-sm font-bold truncate" style={{ color: sev.color }}>
                        {gapPct >= 0 ? '+' : ''}{gapPct.toFixed(1)}%
                    </span>
                    <span className="text-[11px] font-medium hidden md:block" style={{ color: 'var(--color-pl-text-tertiary)', marginTop: 2 }}>
                        {t('gap')}
                    </span>
                </span>

                {/* Restlücke: w-24 — green/red once explanation is loaded */}
                <span
                    className="w-24 flex flex-col text-right flex-shrink-0 hidden md:flex"
                    title={cachedResidual != null ? t('residualGapTooltipLoaded') : t('residualGapTooltipExpand')}
                >
                    <span className="text-sm font-semibold truncate" style={{ color: cachedResidual == null ? 'var(--color-pl-text-tertiary)' : cachedResidual < 5 ? '#34d399' : '#ef4444' }}>
                        {cachedResidual != null
                            // Show with minus sign for consistency with Lücke column:
                            // Lücke = -39.8% · Restlücke = -27.8% (both indicate underpayment)
                            ? cachedResidual > 0 ? `-${cachedResidual.toFixed(1)}%` : '0%'
                            : '—'
                        }
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-pl-text-tertiary)', marginTop: 2 }}>
                        {t('residualGap')}
                    </span>
                </span>

                {/* Horizon indicators — short / mid / long term */}
                <span className="w-36 hidden min-[1800px]:flex items-center justify-around flex-shrink-0">
                    {(['6m', '1y', '2-3y'] as const).map((horizon, i) => {
                        const horizons = horizon === '2-3y'
                            ? ['1.5y', '2-3y'] as const
                            : [horizon] as const
                        const hasHorizon = plan?.plan_steps?.some(s => (horizons as readonly string[]).includes(s.horizon)) ?? false
                        return (
                            <span key={horizon} className="w-12 flex justify-center flex-shrink-0"
                                title={[
                                    t('horizonTooltipShort'),
                                    t('horizonTooltipMedium'),
                                    t('horizonTooltipLong'),
                                ][i]}>
                                {hasHorizon ? (
                                    <span style={{ color: '#34d399', fontSize: 13, fontWeight: 800 }}>✓</span>
                                ) : (
                                    <span style={{ color: 'var(--color-pl-text-tertiary)', fontSize: 13, opacity: 0.5 }}>–</span>
                                )}
                            </span>
                        )
                    })}
                </span>

                <span className="flex-1 min-w-0" />

                {/* Status: w-24 — plan chip or empty space */}
                <span className="w-24 flex-shrink-0 flex justify-end">
                    {hasPlan && (
                        <span
                            className="flex items-center justify-center min-w-[70px] gap-1.5 text-xs font-semibold px-2 py-1 rounded-full"
                            style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}
                        >
                            <Wrench size={11} strokeWidth={2.5} /> Plan
                        </span>
                    )}
                </span>
            </button>

            {/* Expanded panel */}
            {open && (
                <div className="px-4 pb-4 pt-2 border-t space-y-4" style={{ borderColor: 'var(--color-pl-border)' }}>
                    {/* Salary snapshot — 5 boxes */}
                    {(() => {
                        const hasPlanTarget = planSteps.some(s => s.target_salary != null)
                        const { final } = computeProgression(flag, planSteps)
                        const annualBase    = calcAnnualBase(flag)
                        const annualVariable = flag.imported_variable_pay_eur
                        const gapAfterPlan  = flag.imported_annualised_hours > 0
                            ? ((final.runningHourly - flag.cohort_median) / flag.cohort_median) * 100
                            : null
                        return (
                        <div className={`grid gap-3 grid-cols-3 ${hasPlanTarget || explanation ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>

                            {/* Box 1: Jahresgehalt with base/variable split */}
                            <div className="rounded-lg p-3" style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                                <p className="text-xs mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('annualCompensation')}</p>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{eur(annualCurrent)}</p>
                                <div className="mt-1 space-y-0.5">
                                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>&#9632; {t('basePay')} {eur(annualBase)}</p>
                                    {annualVariable > 0 && (
                                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>&#9632; {t('variablePay')} {eur(annualVariable)}</p>
                                    )}
                                </div>
                            </div>

                            {/* Box 2: Kohorte Median */}
                            <div className="rounded-lg p-3" style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                                <p className="text-xs mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('cohortMedian')}</p>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{eur(annualMedian)}</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{eur(flag.cohort_median, 2)}/h</p>
                            </div>

                            {/* Box 3: Zielvergütung (final plan state) — only when plan has targets */}
                            {hasPlanTarget && (
                                <div className="rounded-lg p-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.28)' }}>
                                    <p className="text-xs mb-1" style={{ color: 'var(--color-pl-accent)' }}>{t('targetCompensation')}</p>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-accent)' }}>{eur(final.runningTotal)}</p>
                                    <div className="mt-1 space-y-0.5">
                                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>&#9632; {t('basePay')} {eur(final.runningBase)}</p>
                                        {final.runningVariable > 0 && (
                                            <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>&#9632; {t('variablePay')} {eur(final.runningVariable)}</p>
                                        )}
                                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>→ {eur(final.runningHourly, 2)}/h</p>
                                        {gapAfterPlan != null && (
                                            <p className="text-xs font-semibold" style={{ color: Math.abs(gapAfterPlan) < 5 ? '#34d399' : '#ef4444' }}>
                                                {t('gapAfterPlan')} {gapAfterPlan >= 0 ? '+' : ''}{gapAfterPlan.toFixed(1)}%
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Box 4: Lücke */}
                            <div className="rounded-lg p-3" style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                                <p className="text-xs mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('gapCohort')}</p>
                                <p className="text-sm font-semibold" style={{ color: sev.color }}>{gapPct >= 0 ? '+' : ''}{gapPct.toFixed(1)}%</p>
                            </div>

                            {/* Box 5: Restlücke — conditional */}
                            {explanation && (
                                <div className="rounded-lg p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
                                    <p className="text-xs mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('remainingResidualGap')}</p>
                                    <p className="text-sm font-semibold" style={{ color: residualPct < 5 ? '#34d399' : '#ef4444' }}>{residualPct.toFixed(1)}%</p>
                                </div>
                            )}
                        </div>
                        )
                    })()}

                    {/* ── Begründung aus Analyse-Modul ── */}
                    {explLoading && (
                        <div className="flex items-center gap-2 text-xs py-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            <Loader2 size={11} className="animate-spin" /> {t('loadingExplanation')}
                        </div>
                    )}
                    {!explLoading && explanation && (
                        <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.18)' }}>
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold" style={{ color: '#34d399' }}>
                                    {t('explanationFromAnalysis')}
                                </p>
                                {(() => {
                                    const cats = explanation.categories_json ?? []
                                    const total = Math.min(cats.reduce((s, c) => s + (c.claimed_pct ?? 0), 0), 25)
                                    const gap   = Math.abs(flag.gap_vs_cohort_pct * 100)
                                    const residual = Math.max(0, gap - total)
                                    return (
                                        <span className="text-xs" style={{ color: residual < 0.5 ? '#34d399' : '#f59e0b' }}>
                                            {t('explainedResidualGap', { explained: total.toFixed(1), residual: residual.toFixed(1) })}
                                        </span>
                                    )
                                })()}
                            </div>

                            {/* Category chips */}
                            <div className="flex flex-wrap gap-1.5">
                                {(explanation.categories_json ?? []).map(cat => (
                                    <span
                                        key={cat.key}
                                        className="text-xs px-2 py-0.5 rounded-full"
                                        style={{ background: 'rgba(52,211,153,0.12)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.25)' }}
                                    >
                                        {cat.key}{cat.claimed_pct != null ? ` · ${cat.claimed_pct}%` : ''}
                                    </span>
                                ))}
                            </div>

                            {/* HR action plan from analysis */}
                            {explanation.action_plan && (
                                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    <span className="font-medium">{t('hrActionPlan')}</span>
                                    {explanation.action_plan}
                                </p>
                            )}
                        </div>
                    )}
                    {!explLoading && !explanation && (
                        <p className="text-xs italic" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('noExplanationRecorded')}
                        </p>
                    )}

                    {/* AI plan section */}
                    <div>
                        <div className="flex items-start justify-between mb-1">
                            <div>
                                <p className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('remediationPlan')}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    {planSteps.length > 0
                                        ? t('planGenerateHintWithSteps')
                                        : t('planGenerateHintNoSteps')}
                                </p>
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={aiLoading}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ml-3"
                                style={{
                                    background: planSteps.length > 0
                                        ? 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))'
                                        : 'rgba(99,102,241,0.07)',
                                    border: `1px solid ${planSteps.length > 0 ? 'rgba(99,102,241,0.45)' : 'rgba(99,102,241,0.2)'}`,
                                    color: planSteps.length > 0 ? 'var(--color-pl-accent)' : 'var(--color-pl-text-tertiary)',
                                }}
                            >
                                {aiLoading
                                    ? <><Loader2 size={11} className="animate-spin" /> {t('generating')}</>
                                    : <><Sparkles size={11} /> {aiText ? t('regenerate') : t('generatePlan')}</>}
                            </button>
                        </div>

                        {aiError && <p className="text-xs mb-2 mt-1" style={{ color: '#f87171' }}>{aiError}</p>}

                        {aiText ? (
                            <textarea
                                rows={6}
                                value={aiText}
                                onChange={e => setAiText(e.target.value)}
                                className="w-full text-xs rounded-lg resize-y p-3 mt-2"
                                style={{
                                    background: 'var(--color-pl-surface-raised)',
                                    border: '1px solid var(--color-pl-border)',
                                    color: 'var(--color-pl-text-primary)',
                                    lineHeight: 1.6,
                                    outline: 'none',
                                }}
                            />
                        ) : (
                            <div className="mt-2 rounded-lg px-4 py-5 text-center"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px dashed var(--color-pl-border)' }}>
                                {planSteps.length === 0 ? (<>
                                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                        {t('stepsFirstThenGenerate')}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)', lineHeight: 1.6 }}>
                                        {t('stepsFirstExplanation')}
                                    </p>
                                </>) : (<>
                                    <Sparkles size={16} className="mx-auto mb-2" style={{ color: 'var(--color-pl-accent)', opacity: 0.7 }} />
                                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                        {t('stepsReadyToGenerate', { count: planSteps.length })}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        {t('clickGeneratePlan')}
                                    </p>
                                </>)}
                            </div>
                        )}
                    </div>

                    {/* Multi-step plan builder */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                {t('phasedTimeline')}
                            </p>
                            <div className="flex items-center gap-2">
                                {planSteps.length < 5 && (
                                    <button
                                        onClick={() => setPlanSteps(s => [
                                            ...s,
                                            makeDefaultStep(s.length + 1, (['6m','1y','1.5y','2-3y'] as PlanHorizon[])[Math.min(s.length, 3)])
                                        ])}
                                        className="text-xs px-2.5 py-1 rounded-lg transition-all"
                                        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}
                                    >
                                        {t('addStep')}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {planSteps.map((step, idx) => {
                                const horizCol = HORIZON_COLORS[step.horizon]
                                function updateStep(patch: Partial<PlanStep>) {
                                    setPlanSteps(s => s.map((st, i) => i === idx ? { ...st, ...patch } : st))
                                }
                                return (
                                    <div key={step.id} className="rounded-xl overflow-hidden"
                                        style={{ border: `1px solid ${horizCol}30`, background: 'var(--theme-pl-action-ghost)' }}>
                                        {/* Step header */}
                                        <div className="flex items-center gap-2 px-3 py-2 border-b"
                                            style={{ borderColor: `${horizCol}25`, background: `${horizCol}08` }}>
                                            <span className="text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0"
                                                style={{ background: `${horizCol}20`, color: horizCol }}>
                                                {idx + 1}
                                            </span>
                                            <select
                                                value={step.horizon}
                                                onChange={e => updateStep({ horizon: e.target.value as PlanHorizon })}
                                                className="flex-1 text-xs rounded-lg px-2 py-1"
                                                style={{ background: 'transparent', border: 'none', color: horizCol, fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                                            >
                                                {labels.deadlines.map(d => (
                                                    <option key={d.value} value={d.value}
                                                        style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-text-primary)' }}>
                                                        {d.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {planSteps.length > 1 && (
                                                <button
                                                    onClick={() => setPlanSteps(s => s.filter((_, i) => i !== idx).map((st, i) => ({ ...st, step_number: i+1 })))}
                                                    className="ml-auto text-xs px-2 py-0.5 rounded"
                                                    style={{ color: 'rgba(248,113,113,0.7)', border: '1px solid rgba(248,113,113,0.2)' }}>
                                                    ×
                                                </button>
                                            )}
                                        </div>

                                        {/* Step body */}
                                        <div className="p-3 space-y-2">
                                            {/* Row 1: action + status */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('labelAction')}</label>
                                                    <select value={step.action_type} onChange={e => updateStep({ action_type: e.target.value as ActionType })} style={selectStyle()}>
                                                        {labels.actionTypes.map(a => (
                                                            <option key={a.value} value={a.value}>{a.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('labelStatus')}</label>
                                                    <select value={step.status} onChange={e => updateStep({ status: e.target.value as PlanStatus })} style={selectStyle()}>
                                                        {Object.entries(labels.statusMeta).map(([k, v]) => (
                                                            <option key={k} value={k}>{v.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Row 2: description */}
                                            <div>
                                                <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('labelDescription')}</label>
                                                <input
                                                    type="text"
                                                    value={step.description}
                                                    onChange={e => updateStep({ description: e.target.value })}
                                                    placeholder={t('descriptionPlaceholder')}
                                                    style={{ ...selectStyle() }}
                                                />
                                            </div>

                                                                                        {/* Row 3: action-type-aware planning fields */}
                                            {(step.action_type === 'salary_increase' || step.action_type === 'job_reclassification' || step.action_type === 'promotion') ? (<>
                                                {(() => {
                                                    // Use progression: step's % is relative to the running base BEFORE this step
                                                    const { stateBeforeStep } = computeProgression(flag, planSteps)
                                                     const before = stateBeforeStep.get(step.id)
                                                     const stepBase = before?.runningBase ?? annualCurrent
                                                     const showPrevNote = before && before.runningBase > calcAnnualBase(flag)
                                                     return (<>
                                                    {showPrevNote && (
                                                        <p className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(52,211,153,0.06)', color: 'var(--color-pl-text-tertiary)', border: '1px solid rgba(52,211,153,0.15)' }}>
                                                            {t('basisAfterPriorSteps')} <strong style={{ color: '#34d399' }}>{eur(stepBase)}</strong>
                                                        </p>
                                                    )}

                                                    {/* ── Compact 2-column: Grundgehalt │ Variables Entgelt ── */}
                                                    {(() => {
                                                        const bonusBase    = step.target_salary ?? stepBase
                                                        const prevVariable = before?.runningVariable ?? flag.imported_variable_pay_eur
                                                        const curBonusPct  = bonusBase > 0 ? (prevVariable / bonusBase) * 100 : 0
                                                        const newBonusPct  = step.target_variable_pay != null && bonusBase > 0
                                                            ? (step.target_variable_pay / bonusBase) * 100 : null

                                                        const newBase      = step.target_salary     ?? stepBase
                                                        const newVariable  = step.target_variable_pay ?? prevVariable
                                                        const curTotal     = stepBase + prevVariable
                                                        const newTotal     = newBase  + newVariable
                                                        const totalDelta   = newTotal - curTotal
                                                        const totalDeltaPct = curTotal > 0 ? (newTotal / curTotal - 1) * 100 : 0
                                                        const hasAnyTarget = step.target_salary != null || step.target_variable_pay != null

                                                        return (<>
                                                        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1px 1fr' }}>

                                                            {/* LEFT: Grundgehalt */}
                                                            <div className="space-y-1.5">
                                                                <p className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                                                    {t('baseSalaryLabel')} <span style={{ fontWeight: 400, color: 'var(--color-pl-text-tertiary)' }}>{t('currentPrefix', { amount: eur(stepBase) })}</span>
                                                                </p>
                                                                <div className="grid grid-cols-2 gap-1.5">
                                                                    <div>
                                                                        <label className="text-xs mb-0.5 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('increasePercent')}</label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="text" inputMode="decimal"
                                                                                value={pctStrings[step.id] !== undefined
                                                                                    ? pctStrings[step.id]
                                                                                    : step.target_salary
                                                                                        ? (((step.target_salary / stepBase) - 1) * 100).toFixed(1)
                                                                                        : ''}
                                                                                onChange={e => {
                                                                                    const raw = e.target.value
                                                                                    setPctStrings(s => ({ ...s, [step.id]: raw }))
                                                                                    const pct = parseFloat(raw.replace(',', '.'))
                                                                                    if (!isNaN(pct)) updateStep({ target_salary: Math.round(stepBase * (1 + pct / 100)) })
                                                                                    else if (raw.trim() === '') updateStep({ target_salary: null })
                                                                                }}
                                                                                onBlur={e => {
                                                                                    const pct = parseFloat(e.target.value.replace(',', '.'))
                                                                                    if (!isNaN(pct)) setPctStrings(s => ({ ...s, [step.id]: pct.toFixed(1) }))
                                                                                }}
                                                                                placeholder={t('pctPlaceholder')}
                                                                                style={{ ...selectStyle(), paddingRight: '1.8rem', fontSize: '0.75rem', padding: '0.35rem 1.8rem 0.35rem 0.6rem' }}
                                                                            />
                                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: 'var(--color-pl-text-tertiary)' }}>%</span>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs mb-0.5 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('targetSalaryEurYear')}</label>
                                                                        <input
                                                                            type="text"
                                                                            value={step.target_salary != null ? step.target_salary.toLocaleString('de-DE') : ''}
                                                                            onChange={e => {
                                                                                const v = e.target.value ? parseFloat(e.target.value.replace(/\./g,'').replace(',','.')) : null
                                                                                updateStep({ target_salary: v })
                                                                                setPctStrings(s => { const n = { ...s }; delete n[step.id]; return n })
                                                                            }}
                                                                            placeholder={eur(stepBase).replace(' €','')}
                                                                            style={{ ...selectStyle(), fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {step.target_salary != null && (
                                                                    <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
                                                                        style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)' }}>
                                                                        <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{eur(stepBase)}</span>
                                                                        <span style={{ color: '#34d399' }}>→</span>
                                                                        <span style={{ color: '#34d399', fontWeight: 700 }}>{eur(step.target_salary)}</span>
                                                                        <span style={{ color: 'var(--color-pl-text-tertiary)', marginLeft: 'auto' }}>
                                                                            +{(((step.target_salary / stepBase) - 1) * 100).toFixed(1)}%
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Divider */}
                                                            <div style={{ background: 'var(--color-pl-border)' }} />

                                                            {/* RIGHT: Variables Entgelt */}
                                                            <div className="space-y-1.5">
                                                                <p className="text-xs font-semibold" style={{ color: 'var(--color-pl-accent)' }}>
                                                                    {t('variablePayLabel')} <span style={{ fontWeight: 400, color: 'var(--color-pl-text-tertiary)'}}>· {eur(prevVariable)} ({curBonusPct.toFixed(1)}%)</span>
                                                                </p>
                                                                <div className="grid grid-cols-2 gap-1.5">
                                                                    <div>
                                                                        <label className="text-xs mb-0.5 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('bonusTargetPercent')}</label>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="text" inputMode="decimal"
                                                                                value={pctStrings[`vp_${step.id}`] !== undefined
                                                                                    ? pctStrings[`vp_${step.id}`]
                                                                                    : newBonusPct != null ? newBonusPct.toFixed(1) : ''}
                                                                                onChange={e => {
                                                                                    const raw = e.target.value
                                                                                    const key = `vp_${step.id}`
                                                                                    setPctStrings(s => ({ ...s, [key]: raw }))
                                                                                    const pct = parseFloat(raw.replace(',', '.'))
                                                                                    if (!isNaN(pct)) updateStep({ target_variable_pay: Math.round(bonusBase * pct / 100) })
                                                                                    else if (raw.trim() === '') updateStep({ target_variable_pay: null })
                                                                                }}
                                                                                onBlur={e => {
                                                                                    const key = `vp_${step.id}`
                                                                                    const pct = parseFloat(e.target.value.replace(',', '.'))
                                                                                    if (!isNaN(pct)) setPctStrings(s => ({ ...s, [key]: pct.toFixed(1) }))
                                                                                }}
                                                                                placeholder={curBonusPct.toFixed(1)}
                                                                                style={{ ...selectStyle(), paddingRight: '1.8rem', fontSize: '0.75rem', padding: '0.35rem 1.8rem 0.35rem 0.6rem' }}
                                                                            />
                                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none" style={{ color: 'var(--color-pl-text-tertiary)' }}>%</span>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs mb-0.5 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('bonusAmountEurYear')}</label>
                                                                        <input
                                                                            type="text"
                                                                            value={step.target_variable_pay != null ? step.target_variable_pay.toLocaleString('de-DE') : ''}
                                                                            onChange={e => {
                                                                                const v = e.target.value ? parseFloat(e.target.value.replace(/\./g,'').replace(',','.')) : null
                                                                                updateStep({ target_variable_pay: v })
                                                                                const key = `vp_${step.id}`
                                                                                setPctStrings(s => { const n = { ...s }; delete n[key]; return n })
                                                                            }}
                                                                            placeholder={eur(prevVariable).replace(' €','')}
                                                                            style={{ ...selectStyle(), fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {step.target_variable_pay != null && (
                                                                    <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
                                                                        style={{
                                                                            background: step.target_variable_pay >= prevVariable ? 'rgba(99,102,241,0.07)' : 'rgba(251,191,36,0.07)',
                                                                            border: `1px solid ${step.target_variable_pay >= prevVariable ? 'rgba(99,102,241,0.25)' : 'rgba(251,191,36,0.2)'}`,
                                                                        }}>
                                                                        <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{eur(prevVariable)}</span>
                                                                        <span style={{ color: step.target_variable_pay >= prevVariable ? 'var(--color-pl-accent)' : '#fbbf24' }}>→</span>
                                                                        <span style={{ fontWeight: 700, color: step.target_variable_pay >= prevVariable ? 'var(--color-pl-accent)' : '#fbbf24' }}>
                                                                            {eur(step.target_variable_pay)}
                                                                        </span>
                                                                        <span style={{ color: 'var(--color-pl-text-tertiary)', marginLeft: 'auto' }}>
                                                                            {newBonusPct != null ? `${newBonusPct.toFixed(1)}% ${t('ofBase')}` : ''}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* ── Consolidated total ── */}
                                                        {hasAnyTarget && (
                                                            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-pl-border)' }}>
                                                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('total')}</span>
                                                                <span style={{ color: 'var(--color-pl-text-secondary)' }}>{eur(curTotal)}</span>
                                                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>→</span>
                                                                <span style={{ color: '#34d399', fontWeight: 700 }}>{eur(newTotal)}</span>
                                                                <span style={{ color: 'var(--color-pl-text-tertiary)', marginLeft: 'auto' }}>
                                                                    {totalDelta >= 0 ? '+' : ''}{eur(totalDelta)} · {totalDeltaPct >= 0 ? '+' : ''}{totalDeltaPct.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        )}
                                                        </>)
                                                    })()}

                                                    <div>
                                                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('responsiblePerson')}</label>
                                                        <input type="text" value={step.responsible} onChange={e => updateStep({ responsible: e.target.value })} placeholder={t('responsiblePlaceholder')} style={{ ...selectStyle() }} />
                                                    </div>
                                                    </>)
                                                })()}
                                            </>) : step.action_type === 'bonus_adjustment' ? (<>
                                                {(() => {
                                                    // Bonus % applied to the running base AFTER all prior salary steps
                                                    const { stateBeforeStep } = computeProgression(flag, planSteps)
                                                    const before = stateBeforeStep.get(step.id)
                                                    const baseSalary     = before?.runningBase ?? calcAnnualBase(flag)
                                                    const prevVariable   = before?.runningVariable ?? flag.imported_variable_pay_eur
                                                    const currentBonusPct = baseSalary > 0 ? (prevVariable / baseSalary) * 100 : 0
                                                    const newBonusPct     = step.target_salary != null && baseSalary > 0
                                                        ? (step.target_salary / baseSalary) * 100 : null
                                                    const showPrevNote = before && before.runningBase > calcAnnualBase(flag)
                                                    return (<>
                                                    {showPrevNote && (
                                                        <p className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.06)', color: 'var(--color-pl-text-tertiary)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                                            Bonus-{t('basisAfterPriorSteps')} <strong style={{ color: 'var(--color-pl-accent)' }}>{eur(baseSalary)}</strong>
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs"
                                                        style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                                                        <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('currentBonus')}</span>
                                                        <span style={{ color: 'var(--color-pl-text-primary)', fontWeight: 700 }}>{eur(prevVariable)}</span>
                                                        {baseSalary > 0 && (
                                                            <span style={{ color: 'var(--color-pl-text-tertiary)' }}>({currentBonusPct.toFixed(1)}% {t('ofBaseSalary')})</span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('newBonusTargetPercent')}</label>
                                                            <div className="relative">
                                                                <input
                                                                    type="text" inputMode="decimal"
                                                                    value={pctStrings[`bonus_${step.id}`] !== undefined
                                                                        ? pctStrings[`bonus_${step.id}`]
                                                                        : newBonusPct != null ? newBonusPct.toFixed(1) : ''}
                                                                    onChange={e => {
                                                                        const raw = e.target.value
                                                                        const key = `bonus_${step.id}`
                                                                        setPctStrings(s => ({ ...s, [key]: raw }))
                                                                        const pct = parseFloat(raw.replace(',', '.'))
                                                                        // % of the running base at THIS step (not today's base)
                                                                        if (!isNaN(pct)) updateStep({ target_salary: Math.round(baseSalary * pct / 100) })
                                                                        else if (raw.trim() === '') updateStep({ target_salary: null })
                                                                    }}
                                                                    onBlur={e => {
                                                                        const key = `bonus_${step.id}`
                                                                        const pct = parseFloat(e.target.value.replace(',', '.'))
                                                                        if (!isNaN(pct)) setPctStrings(s => ({ ...s, [key]: pct.toFixed(1) }))
                                                                    }}
                                                                    placeholder={currentBonusPct.toFixed(1)}
                                                                    style={{ ...selectStyle(), paddingRight: '1.8rem' }}
                                                                />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                                                                    style={{ color: 'var(--color-pl-text-tertiary)' }}>%</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('newBonusAmountEurYear')}</label>
                                                            <input
                                                                type="text"
                                                                value={step.target_salary != null ? step.target_salary.toLocaleString('de-DE') : ''}
                                                                onChange={e => {
                                                                    const v = e.target.value ? parseFloat(e.target.value.replace(/\./g,'').replace(',','.')) : null
                                                                    updateStep({ target_salary: v })
                                                                    const key = `bonus_${step.id}`
                                                                    setPctStrings(s => { const n = { ...s }; delete n[key]; return n })
                                                                }}
                                                                placeholder={eur(prevVariable).replace(' €','')}
                                                                style={{ ...selectStyle() }}
                                                            />
                                                        </div>
                                                    </div>
                                                    {step.target_salary != null && (
                                                        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                                                            style={{
                                                                background: step.target_salary >= prevVariable ? 'rgba(52,211,153,0.07)' : 'rgba(251,191,36,0.07)',
                                                                border: `1px solid ${step.target_salary >= prevVariable ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
                                                            }}>
                                                            <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('previously', { amount: eur(prevVariable) })}</span>
                                                            <span style={{ color: step.target_salary >= prevVariable ? '#34d399' : '#fbbf24' }}>→</span>
                                                            <span style={{ fontWeight: 700, color: step.target_salary >= prevVariable ? '#34d399' : '#fbbf24' }}>
                                                                {eur(step.target_salary)}
                                                            </span>
                                                            <span style={{ color: 'var(--color-pl-text-tertiary)', marginLeft: 'auto' }}>
                                                                {step.target_salary >= prevVariable ? '+' : ''}{(step.target_salary - prevVariable).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                                                            </span>
                                                            {baseSalary > 0 && newBonusPct != null && (
                                                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>({newBonusPct.toFixed(1)}% {t('ofBase')})</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('responsiblePerson')}</label>
                                                        <input type="text" value={step.responsible} onChange={e => updateStep({ responsible: e.target.value })} placeholder={t('responsiblePlaceholder')} style={{ ...selectStyle() }} />
                                                    </div>
                                                    </>)
                                                })()}
                                            </>) : (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('responsiblePerson')}</label>
                                                        <input type="text" value={step.responsible} onChange={e => updateStep({ responsible: e.target.value })} placeholder={t('responsiblePlaceholder')} style={{ ...selectStyle() }} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('targetSalaryEurYearOptional')}</label>
                                                        <input
                                                            type="text"
                                                            value={step.target_salary != null ? String(Math.round(step.target_salary)) : ''}
                                                            onChange={e => updateStep({ target_salary: e.target.value ? parseFloat(e.target.value.replace(/\./g,'').replace(',','.')) : null })}
                                                            placeholder={eur(flag.cohort_median * flag.imported_annualised_hours).replace(' €','')}
                                                            style={{ ...selectStyle() }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Row 4: notes */}
                                            <div>
                                                <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('notesLabel')}</label>
                                                <input
                                                    type="text"
                                                    value={step.notes}
                                                    onChange={e => updateStep({ notes: e.target.value })}
                                                    placeholder={t('notesPlaceholder')}
                                                    style={{ ...selectStyle() }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {planSteps.length < 3 && (
                            <p className="text-xs mt-2" style={{ color: '#f59e0b' }}>
                                {t('minStepsWarning')}
                            </p>
                        )}
                    </div>

                    {/* HR Notes (global) */}
                    <div>
                        <label className="text-xs mb-1 block font-semibold uppercase tracking-wide" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('hrGlobalNote')}</label>
                        <input
                            type="text"
                            value={hrNotes}
                            onChange={e => setHrNotes(e.target.value)}
                            placeholder={t('hrGlobalNotePlaceholder')}
                            style={{ ...selectStyle() }}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                        <div>
                            {plan && (
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                                    style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.05)' }}
                                >
                                    <Trash2 size={11} /> {t('delete')}
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {saveMsg && (
                                <span
                                    className="text-xs max-w-xs truncate"
                                    title={saveMsg}
                                    style={{ color: saveMsg.startsWith('⚠') ? '#f87171' : '#22c55e' }}
                                >
                                    {saveMsg}
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg font-semibold transition-all"
                                style={{
                                    background: 'linear-gradient(135deg,var(--color-pl-brand),#6366f1)',
                                    color: '#fff',
                                    opacity: isSaving ? 0.6 : 1,
                                }}
                            >
                                {isSaving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                                {t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================================
// Main component
// ============================================================

export default function RemediationClient({
    analyses,
    initialPlans,
}: {
    analyses: AnalysisMeta[]
    initialPlans: RemediationPlan[]
}) {
    const t = useTranslations('remediationPage')
    const labels = useRemediationLabels()
    const [selectedId, setSelectedId]     = useState(analyses[0]?.id ?? '')
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
    const [plans, setPlans]               = useState<RemediationPlan[]>(initialPlans)
    const [explanations, setExplanations] = useState<Record<string, EmployeeExplanation>>({})
    const [loading, setLoading]           = useState(false)
    const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'overpaid' | 'planned' | 'open'>('all')
    const [genAllLoading, setGenAllLoading] = useState(false)

    // Load analysis results (+ plans when switching away from the default analysis)
    const loadAnalysis = useCallback(async (id: string, forceRefreshPlans = false) => {
        if (!id) return
        setLoading(true)
        try {
            const [planData, analysisRes, explanationMap] = await Promise.all([
                forceRefreshPlans ? getRemediationPlans(id) : Promise.resolve(null),
                fetch(`/api/analysis/${id}/results`).then(r => r.json()).catch(() => null),
                getExplanationsForAnalysis(id),
            ])
            if (planData !== null) setPlans(planData)
            if (analysisRes) setAnalysisData(analysisRes as AnalysisData)
            setExplanations(explanationMap)
        } catch (err) {
            console.error('[RemediationClient] loadAnalysis error', err)
        } finally {
            setLoading(false)
        }
    }, [])

    // On mount: only load analysis results (plans already in state via initialPlans)
    useEffect(() => {
        if (selectedId) loadAnalysis(selectedId, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])  // intentionally only on mount

    // On analysis switch: reload BOTH results AND plans
    const handleAnalysisChange = useCallback(async (id: string) => {
        setSelectedId(id)
        setPlans([])      // clear stale plans for previous analysis
        setAnalysisData(null)
        await loadAnalysis(id, true)
    }, [loadAnalysis])

    function handlePlanChange(updated: RemediationPlan) {
        setPlans(prev => {
            const idx = prev.findIndex(p => p.employee_id === updated.employee_id)
            if (idx >= 0) {
                const next = [...prev]
                next[idx] = updated
                return next
            }
            return [...prev, updated]
        })
        // Also re-fetch from DB after a short delay to guarantee DB consistency
        setTimeout(() => {
            getRemediationPlans(selectedId).then(fresh => {
                if (fresh.length > 0) setPlans(fresh)
            }).catch(console.error)
        }, 300)
    }

    const flags = analysisData?.results?.individual_flags ?? []
    const actionableFlags = flags
        .filter(f => f.severity !== 'ok')
        .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9))

    const planIndex = new Map(plans.map(p => [p.employee_id, p]))

    const filteredFlags = actionableFlags.filter(f => {
        if (filter === 'high')     return f.severity === 'high'
        if (filter === 'medium')   return f.severity === 'medium'
        if (filter === 'overpaid') return f.severity === 'overpaid'
        if (filter === 'planned')  return planIndex.has(f.employee_id)
        if (filter === 'open')     return !planIndex.has(f.employee_id)
        return true
    })

    const selectedAnalysis = analyses.find(a => a.id === selectedId)
    const orgName = analysisData?.org_name ?? selectedAnalysis?.datasets?.name ?? 'Organisation'
    const reportingYear = selectedAnalysis?.datasets?.reporting_year ?? new Date().getFullYear()
    const stdHours = analysisData?.results?.standard_weekly_hours ?? 40

    const highCount   = actionableFlags.filter(f => f.severity === 'high').length
    const medCount    = actionableFlags.filter(f => f.severity === 'medium').length
    const overpaidCount = actionableFlags.filter(f => f.severity === 'overpaid').length
    const plannedCount= actionableFlags.filter(f => planIndex.has(f.employee_id)).length

    // ── Render ──────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="pb-5 border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('pageTitle')}
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('pageSubtitle')}
                        </p>
                    </div>

                    {/* Analysis picker */}
                    <select
                        value={selectedId}
                        onChange={e => handleAnalysisChange(e.target.value)}
                        className="text-sm rounded-xl px-3 py-2"
                        style={{
                            background: 'var(--color-pl-surface-raised)',
                            border: '1px solid var(--color-pl-border)',
                            color: 'var(--color-pl-text-primary)',
                            outline: 'none',
                            minWidth: 220,
                        }}
                    >
                        {analyses.length === 0 && <option value="">{t('noAnalysesAvailable')}</option>}
                        {analyses.map(a => (
                            <option key={a.id} value={a.id}>
                                {a.datasets?.name ?? a.name} ({a.datasets?.reporting_year ?? '?'})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-pl-brand)' }} />
                    </div>
                ) : analyses.length === 0 ? (
                    <div className="glass-card p-10 text-center">
                        <p style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('noAnalysesFound')}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Stats strip */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <StatCard label={t('statTotal')}                      value={actionableFlags.length} color="var(--color-pl-text-primary)" />
                            <StatCard label={t('statCritical')}  value={highCount}     color="#ef4444" />
                            <StatCard label={t('statNonCompliant')}       value={medCount}      color="#f97316" />
                            <StatCard label={t('statOverpaid')}           value={overpaidCount} color="#8b5cf6" />
                            <StatCard label={t('statPlansCreated')}               value={plannedCount}  color="var(--color-pl-brand)" />
                        </div>

                        {/* Budget Simulation Panel */}
                        <BudgetSimPanel
                            allFlags={flags}
                            plans={plans}
                            planIndex={planIndex}
                            t={t}
                        />

                        {/* Filter tabs */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {([
                                ['all',      t('filterAll'),           actionableFlags.length],
                                ['high',     t('filterCritical'),      highCount],
                                ['medium',   t('filterNonCompliant'),  medCount],
                                ['overpaid', t('filterOverpaid'),      overpaidCount],
                                ['planned',  t('filterWithPlan'),      plannedCount],
                                ['open',     t('filterWithoutPlan'),   actionableFlags.length - plannedCount],
                            ] as const).map(([k, l, c]) => (
                                <button
                                    key={k}
                                    onClick={() => setFilter(k as typeof filter)}
                                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                                    style={{
                                        background: filter === k ? 'var(--color-pl-brand)' : 'var(--color-pl-surface-raised)',
                                        color: filter === k ? '#fff' : 'var(--color-pl-text-secondary)',
                                        border: '1px solid var(--color-pl-border)',
                                    }}
                                >
                                    {l} <span className="opacity-70">({c})</span>
                                </button>
                            ))}
                        </div>

                        {/* Employee list */}
                        {filteredFlags.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    {t('noEmployeesInFilter')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Column headers */}
                                <div className="flex items-center gap-5 px-5 py-1 text-xs font-semibold"
                                    style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    <span className="w-4 flex-shrink-0" />
                                    <span className="w-36 flex-shrink-0">{t('colSeverity')}</span>
                                    <span className="w-56 flex-shrink-0">{t('colNameId')}</span>
                                    <span className="w-36 flex-shrink-0 hidden 2xl:block">{t('colDepartment')}</span>
                                    <span className="w-32 flex-shrink-0 hidden 2xl:block">{t('colGrade')}</span>

                                    <span className="w-28 text-right flex-shrink-0 hidden md:block">{t('colSalary')}</span>
                                    <span className="w-28 text-right flex-shrink-0 hidden md:block">{t('colCohortMedian')}</span>
                                    <span className="w-24 text-right flex-shrink-0">{t('colGap')}</span>
                                    <span className="w-24 text-right flex-shrink-0 hidden md:block">{t('colResidualGap')}</span>

                                    <span className="w-36 hidden min-[1800px]:flex items-center justify-around flex-shrink-0">
                                        <span className="w-12 text-center" title={t('horizonTooltipShort')}>{t('colShort')}</span>
                                        <span className="w-12 text-center" title={t('horizonTooltipMedium')}>{t('colMedium')}</span>
                                        <span className="w-12 text-center" title={t('horizonTooltipLong')}>{t('colLong')}</span>
                                    </span>

                                    <span className="flex-1 min-w-0" />

                                    <span className="w-24 text-right flex-shrink-0">{t('colStatus')}</span>
                                </div>
                                {filteredFlags.map(flag => (
                                    <PlanRow
                                        key={flag.employee_id}
                                        flag={flag}
                                        plan={planIndex.get(flag.employee_id)}
                                        analysisId={selectedId}
                                        orgName={orgName}
                                        reportingYear={reportingYear}
                                        standardWeeklyHours={stdHours}
                                        onPlanChange={handlePlanChange}
                                        preloadedExplanation={explanations[flag.employee_id] ?? null}
                                        labels={labels}
                                        t={t}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
