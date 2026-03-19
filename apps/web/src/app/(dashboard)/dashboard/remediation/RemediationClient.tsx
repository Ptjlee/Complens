'use client'

import { useState, useEffect, useCallback } from 'react'
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
// Constants
// ============================================================

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, overpaid: 3 }

const SEVERITY_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    high:    { label: 'Kritisch',      color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    icon: <AlertTriangle size={13} /> },
    medium:  { label: 'Nicht konform', color: '#f97316', bg: 'rgba(249,115,22,0.1)',   icon: <Eye size={13} /> },
    low:     { label: 'Nicht konform', color: '#f97316', bg: 'rgba(249,115,22,0.08)',  icon: <Eye size={13} /> },
    overpaid:{ label: 'Lohnvorteil',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   icon: <TrendingDown size={13} /> },
}

const ACTION_TYPES: { value: ActionType; label: string }[] = [
    { value: 'salary_increase',      label: 'Gehaltserhöhung' },
    { value: 'job_reclassification', label: 'Neueinstufung' },
    { value: 'promotion',            label: 'Beförderung' },
    { value: 'bonus_adjustment',     label: 'Bonusanpassung' },
    { value: 'review',               label: 'Manuelle Prüfung' },
]

const STATUS_META: Record<PlanStatus, { label: string; icon: React.ReactNode; color: string }> = {
    open:        { label: 'Offen',         icon: <Clock size={12} />,         color: '#64748b' },
    in_progress: { label: 'In Bearbeitung',icon: <Loader2 size={12} />,       color: 'var(--color-pl-brand)' },
    completed:   { label: 'Abgeschlossen', icon: <CheckCircle2 size={12} />,  color: '#22c55e' },
    dismissed:   { label: 'Abgelehnt',     icon: <XCircle size={12} />,       color: '#6b7280' },
}

const DEADLINES: { value: PlanHorizon; label: string }[] = [
    { value: '6m',   label: 'Kurzfristig · 6 Monate' },
    { value: '1y',   label: 'Mittelfristig · 1 Jahr' },
    { value: '1.5y', label: 'Mittelfristig · 18 Monate' },
    { value: '2-3y', label: 'Langfristig · 2–3 Jahre' },
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const HORIZON_LABELS: Record<PlanHorizon, string> = {
    '6m':   'Kurzfristig · 6 Monate',
    '1y':   'Mittelfristig · 1 Jahr',
    '1.5y': 'Mittelfristig · 18 Monate',
    '2-3y': 'Langfristig · 2–3 Jahre',
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
        id:            newStepId(),
        step_number:   n,
        action_type:   'salary_increase',
        description:   '',
        horizon,
        target_salary: null,
        responsible:   '',
        notes:         '',
        status:        'open',
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
}: {
    flag: IndividualFlag
    plan: RemediationPlan | undefined
    analysisId: string
    orgName: string
    reportingYear: number
    standardWeeklyHours: number
    onPlanChange: (p: RemediationPlan) => void
    preloadedExplanation: EmployeeExplanation | null
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

    const sev = SEVERITY_META[flag.severity] ?? SEVERITY_META.medium
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
            ? flag.hourly_rate * (1 + residualPct / 100)
            : flag.cohort_median

    async function handleGenerate() {
        setAiLoading(true)
        setAiError('')
        const { text, error } = await generateRemediationAiPlan(
            flag, orgName, reportingYear, standardWeeklyHours, analysisId,
            residualPct, adjustedTarget
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
                setSaveMsg('✓ Gespeichert')
                setTimeout(() => setSaveMsg(''), 3000)
            } else {
                setSaveMsg('⚠️ Plan konnte nicht gespeichert werden (DB-Antwort leer)')
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
        if (!confirm('Plan wirklich löschen?')) return
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

                {/* Schwere: w-44 */}
                <span className="w-44 flex-shrink-0">
                    <span
                        className="inline-flex items-center justify-center min-w-[100px] gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                        style={{ background: sev.bg, color: sev.color }}
                    >
                        {sev.icon} {sev.label}
                    </span>
                </span>

                {/* Name & ID: w-72 flex-shrink-0 */}
                <span className="w-72 flex flex-col min-w-0 flex-shrink-0">
                    <span className="font-medium text-sm truncate" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {displayName(flag)}
                    </span>
                    <span className="text-xs truncate" style={{ color: 'var(--color-pl-text-tertiary)', marginTop: 2 }}>
                        {flag.employee_id || 'Ohne ID'}
                    </span>
                </span>

                {/* Abteilung: w-48 flex-shrink-0 hidden xl:flex */}
                <span className="w-48 flex-col justify-center min-w-0 flex-shrink-0 hidden xl:flex">
                    <span className="text-sm truncate" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {flag.department ?? 'Keine Abteilung'}
                    </span>
                </span>
                
                {/* Gruppe: w-40 flex-shrink-0 hidden xl:flex */}
                <span className="w-40 flex-col justify-center min-w-0 flex-shrink-0 hidden xl:flex">
                    <span className="text-sm truncate" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {flag.job_grade ?? 'Keine Gruppe'}
                    </span>
                </span>

                {/* Gehalt: w-32 flex-shrink-0 hidden md:flex */}
                <span className="w-32 flex flex-col text-right flex-shrink-0 hidden md:flex">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {eur(flag.hourly_rate, 2)} / h
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-pl-text-tertiary)', marginTop: 2 }}>
                        {eur(annualCurrent)} p.a.
                    </span>
                </span>

                {/* Kohorte: w-32 flex-shrink-0 hidden md:flex */}
                <span className="w-32 flex flex-col text-right flex-shrink-0 hidden md:flex">
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
                        Lücke
                    </span>
                </span>

                {/* Restlücke: w-24 — green/red once explanation is loaded */}
                <span
                    className="w-24 flex flex-col text-right flex-shrink-0 hidden md:flex"
                    title={cachedResidual != null ? 'Verbleibende Restlücke nach Begründung' : 'Expandieren um Begründung zu laden'}
                >
                    <span className="text-sm font-semibold truncate" style={{ color: cachedResidual == null ? 'var(--color-pl-text-tertiary)' : cachedResidual < 5 ? '#34d399' : '#ef4444' }}>
                        {cachedResidual != null ? `${cachedResidual.toFixed(1)}%` : '—'}
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-pl-text-tertiary)', marginTop: 2 }}>
                        Restlücke
                    </span>
                </span>

                {/* Horizon indicators — short / mid / long term */}
                <span className="w-48 hidden lg:flex items-center justify-around flex-shrink-0">
                    {(['6m', '1y', '2-3y'] as const).map((horizon, i) => {
                        const horizons = horizon === '2-3y'
                            ? ['1.5y', '2-3y'] as const
                            : [horizon] as const
                        const hasHorizon = plan?.plan_steps?.some(s => (horizons as readonly string[]).includes(s.horizon)) ?? false
                        return (
                            <span key={horizon} className="w-12 flex justify-center flex-shrink-0"
                                title={[
                                    'Kurzfristig (0–6 Monate)',
                                    'Mittelfristig (6–12 Monate)',
                                    'Langfristig (12+ Monate)',
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
                    {/* Salary snapshot */}
                    <div className={`grid gap-3 ${explanation ? 'grid-cols-4' : 'grid-cols-3'}`}>
                        {[
                            { label: 'Jahresgehalt',           value: eur(annualCurrent) },
                            { label: 'Kohorte Median',         value: eur(annualMedian) },
                            { label: 'Lücke (Kohorte)',        value: `${gapPct >= 0 ? '+' : ''}${gapPct.toFixed(1)}%`, color: sev.color },
                            ...(explanation ? [{
                                label: 'Verbleibende Restlücke',
                                value: `${residualPct.toFixed(1)}%`,
                                color: residualPct < 5 ? '#34d399' : '#ef4444',
                                highlight: true,
                            }] : []),
                        ].map(({ label, value, color, highlight }) => (
                            <div key={label} className="rounded-lg p-3" style={{
                                background: highlight ? 'rgba(245,158,11,0.06)' : 'var(--color-pl-surface-raised)',
                                border: `1px solid ${highlight ? 'rgba(245,158,11,0.25)' : 'var(--color-pl-border)'}`,
                            }}>
                                <p className="text-xs mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{label}</p>
                                <p className="text-sm font-semibold" style={{ color: color ?? 'var(--color-pl-text-primary)' }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Begründung aus Analyse-Modul ── */}
                    {explLoading && (
                        <div className="flex items-center gap-2 text-xs py-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            <Loader2 size={11} className="animate-spin" /> Lade Begründung…
                        </div>
                    )}
                    {!explLoading && explanation && (
                        <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.18)' }}>
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold" style={{ color: '#34d399' }}>
                                    Begründung aus Analyse
                                </p>
                                {(() => {
                                    const cats = explanation.categories_json ?? []
                                    const total = Math.min(cats.reduce((s, c) => s + (c.claimed_pct ?? 0), 0), 25)
                                    const gap   = Math.abs(flag.gap_vs_cohort_pct * 100)
                                    const residual = Math.max(0, gap - total)
                                    return (
                                        <span className="text-xs" style={{ color: residual < 0.5 ? '#34d399' : '#f59e0b' }}>
                                            {total.toFixed(1)}% erklärt · {residual.toFixed(1)}% Restlücke
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
                                    <span className="font-medium">HR-Aktionsplan: </span>
                                    {explanation.action_plan}
                                </p>
                            )}
                        </div>
                    )}
                    {!explLoading && !explanation && (
                        <p className="text-xs italic" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Keine Begründung im Analyse-Modul erfasst.
                        </p>
                    )}

                    {/* AI plan section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>Maßnahmenplan</p>
                            <button
                                onClick={handleGenerate}
                                disabled={aiLoading}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                                style={{
                                    background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))',
                                    border: '1px solid rgba(99,102,241,0.35)',
                                    color: 'var(--color-pl-accent)',
                                }}
                            >
                                {aiLoading
                                    ? <><Loader2 size={11} className="animate-spin" /> Generiert…</>
                                    : <><Sparkles size={11} /> {aiText ? 'Neu generieren' : 'Plan generieren'}</>}
                            </button>
                        </div>
                        {aiError && <p className="text-xs mb-2" style={{ color: '#f87171' }}>{aiError}</p>}
                        <textarea
                            rows={6}
                            value={aiText}
                            onChange={e => setAiText(e.target.value)}
                            placeholder="Klicken Sie 'Plan generieren' oder geben Sie Ihren Plan manuell ein…"
                            className="w-full text-xs rounded-lg resize-y p-3"
                            style={{
                                background: 'var(--color-pl-surface-raised)',
                                border: '1px solid var(--color-pl-border)',
                                color: 'var(--color-pl-text-primary)',
                                lineHeight: 1.6,
                                outline: 'none',
                            }}
                        />
                    </div>

                    {/* Multi-step plan builder */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                Maßnahmenplan · Phasierter Zeitplan
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
                                        + Schritt
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
                                                {DEADLINES.map(d => (
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
                                                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>Maßnahme</label>
                                                    <select value={step.action_type} onChange={e => updateStep({ action_type: e.target.value as ActionType })} style={selectStyle()}>
                                                        {ACTION_TYPES.map(a => (
                                                            <option key={a.value} value={a.value}>{a.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>Status</label>
                                                    <select value={step.status} onChange={e => updateStep({ status: e.target.value as PlanStatus })} style={selectStyle()}>
                                                        {Object.entries(STATUS_META).map(([k, v]) => (
                                                            <option key={k} value={k}>{v.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Row 2: description */}
                                            <div>
                                                <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>Beschreibung</label>
                                                <input
                                                    type="text"
                                                    value={step.description}
                                                    onChange={e => updateStep({ description: e.target.value })}
                                                    placeholder="z. B. Gehaltsanpassung um 3 % an Kohortennmedian…"
                                                    style={{ ...selectStyle() }}
                                                />
                                            </div>

                                                                                        {/* Row 3: action-type-aware planning fields */}
                                            {step.action_type === 'salary_increase' ? (<>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>Erhöhung %</label>
                                                        <div className="relative">
                                                            <input
                                                                type="text" inputMode="decimal"
                                                                value={pctStrings[step.id] !== undefined
                                                                    ? pctStrings[step.id]
                                                                    : step.target_salary
                                                                        ? (((step.target_salary / annualCurrent) - 1) * 100).toFixed(1)
                                                                        : ''}
                                                                onChange={e => {
                                                                    const raw = e.target.value
                                                                    setPctStrings(s => ({ ...s, [step.id]: raw }))
                                                                    const pct = parseFloat(raw.replace(',', '.'))
                                                                    if (!isNaN(pct)) updateStep({ target_salary: Math.round(annualCurrent * (1 + pct / 100)) })
                                                                    else if (raw.trim() === '') updateStep({ target_salary: null })
                                                                }}
                                                                onBlur={e => {
                                                                    // Normalise display on blur
                                                                    const pct = parseFloat(e.target.value.replace(',', '.'))
                                                                    if (!isNaN(pct)) setPctStrings(s => ({ ...s, [step.id]: pct.toFixed(1) }))
                                                                }}
                                                                placeholder="z. B. 5"
                                                                style={{ ...selectStyle(), paddingRight: '1.8rem' }}
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                                                                style={{ color: 'var(--color-pl-text-tertiary)' }}>%</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>Neues Zielgehalt (€/Jahr)</label>
                                                        <input
                                                            type="text"
                                                            value={step.target_salary != null ? step.target_salary.toLocaleString('de-DE') : ''}
                                                            onChange={e => {
                                                             const v = e.target.value ? parseFloat(e.target.value.replace(/\./g,'').replace(',','.')) : null
                                                             updateStep({ target_salary: v })
                                                             setPctStrings(s => { const n = { ...s }; delete n[step.id]; return n })
                                                         }}
                                                            placeholder={eur(annualCurrent).replace(' €','')}
                                                            style={{ ...selectStyle() }}
                                                        />
                                                    </div>
                                                </div>
                                                {step.target_salary != null && (
                                                    <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                                                        style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)' }}>
                                                        <span style={{ color: 'var(--color-pl-text-tertiary)' }}>Aktuell {eur(annualCurrent)}</span>
                                                        <span style={{ color: '#34d399' }}>→</span>
                                                        <span style={{ color: '#34d399', fontWeight: 700 }}>{eur(step.target_salary)}</span>
                                                        <span style={{ color: 'var(--color-pl-text-tertiary)', marginLeft: 'auto' }}>
                                                            +{(((step.target_salary / annualCurrent) - 1) * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>Verantwortliche Person</label>
                                                    <input type="text" value={step.responsible} onChange={e => updateStep({ responsible: e.target.value })} placeholder="z. B. HR-Leitung" style={{ ...selectStyle() }} />
                                                </div>
                                            </>) : step.action_type === 'bonus_adjustment' ? (<>
                                                {(() => {
                                                    const baseSalary = annualCurrent - flag.imported_variable_pay_eur
                                                    const currentBonusPct = baseSalary > 0 ? (flag.imported_variable_pay_eur / baseSalary) * 100 : 0
                                                    const newBonusPct = step.target_salary != null && baseSalary > 0
                                                        ? (step.target_salary / baseSalary) * 100 : null
                                                    return (<>
                                                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs"
                                                            style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                                                            <span style={{ color: 'var(--color-pl-text-tertiary)' }}>Aktueller Bonus:</span>
                                                            <span style={{ color: 'var(--color-pl-text-primary)', fontWeight: 700 }}>{eur(flag.imported_variable_pay_eur)}</span>
                                                            {baseSalary > 0 && (
                                                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>({currentBonusPct.toFixed(1)}% des Grundgehalts)</span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>Neues Bonus-Ziel %</label>
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
                                                                <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>Neuer Bonusbetrag (€/Jahr)</label>
                                                                <input
                                                                    type="text"
                                                                    value={step.target_salary != null ? step.target_salary.toLocaleString('de-DE') : ''}
                                                                    onChange={e => {
                                                                        const v = e.target.value ? parseFloat(e.target.value.replace(/\./g,'').replace(',','.')) : null
                                                                        updateStep({ target_salary: v })
                                                                        const key = `bonus_${step.id}`
                                                                        setPctStrings(s => { const n = { ...s }; delete n[key]; return n })
                                                                    }}
                                                                    placeholder={eur(flag.imported_variable_pay_eur).replace(' €','')}
                                                                    style={{ ...selectStyle() }}
                                                                />
                                                            </div>
                                                        </div>
                                                        {step.target_salary != null && (
                                                            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                                                                style={{
                                                                    background: step.target_salary >= flag.imported_variable_pay_eur ? 'rgba(52,211,153,0.07)' : 'rgba(251,191,36,0.07)',
                                                                    border: `1px solid ${step.target_salary >= flag.imported_variable_pay_eur ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
                                                                }}>
                                                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>Bisher {eur(flag.imported_variable_pay_eur)}</span>
                                                                <span style={{ color: step.target_salary >= flag.imported_variable_pay_eur ? '#34d399' : '#fbbf24' }}>→</span>
                                                                <span style={{ fontWeight: 700, color: step.target_salary >= flag.imported_variable_pay_eur ? '#34d399' : '#fbbf24' }}>
                                                                    {eur(step.target_salary)}
                                                                </span>
                                                                <span style={{ color: 'var(--color-pl-text-tertiary)', marginLeft: 'auto' }}>
                                                                    {step.target_salary >= flag.imported_variable_pay_eur ? '+' : ''}{(step.target_salary - flag.imported_variable_pay_eur).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>Verantwortliche Person</label>
                                                            <input type="text" value={step.responsible} onChange={e => updateStep({ responsible: e.target.value })} placeholder="z. B. HR-Leitung" style={{ ...selectStyle() }} />
                                                        </div>
                                                    </>)
                                                })()}
                                            </>) : (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>Verantwortliche Person</label>
                                                        <input type="text" value={step.responsible} onChange={e => updateStep({ responsible: e.target.value })} placeholder="z. B. HR-Leitung" style={{ ...selectStyle() }} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>Zielgehalt (€/Jahr, optional)</label>
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
                                                <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>Notiz</label>
                                                <input
                                                    type="text"
                                                    value={step.notes}
                                                    onChange={e => updateStep({ notes: e.target.value })}
                                                    placeholder="Interne Anmerkung…"
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
                                ⚠ Empfehlung: Mindestens 3 Schritte für einen vollständigen Maßnahmenplan (EU Art. 9).
                            </p>
                        )}
                    </div>

                    {/* HR Notes (global) */}
                    <div>
                        <label className="text-xs mb-1 block font-semibold uppercase tracking-wide" style={{ color: 'var(--color-pl-text-tertiary)' }}>HR-Gesamtnotiz</label>
                        <input
                            type="text"
                            value={hrNotes}
                            onChange={e => setHrNotes(e.target.value)}
                            placeholder="Übergreifende Anmerkung zum Maßnahmenplan…"
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
                                    <Trash2 size={11} /> Löschen
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
                                Speichern
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
                            Maßnahmen
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Maßnahmenpläne für Entgeltlücken · EU-Richtlinie 2023/970 Art. 9
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
                        {analyses.length === 0 && <option value="">Keine Analysen vorhanden</option>}
                        {analyses.map(a => (
                            <option key={a.id} value={a.id}>
                                {a.name} ({a.datasets?.reporting_year ?? '?'})
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
                            Keine abgeschlossenen Analysen gefunden. Bitte führen Sie zuerst eine Analyse durch.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Stats strip */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <StatCard label="Gesamt"                      value={actionableFlags.length} color="var(--color-pl-text-primary)" />
                            <StatCard label="Kritisch (Unterverg. ≥25%)"  value={highCount}     color="#ef4444" />
                            <StatCard label="Nicht konform (5–25%)"       value={medCount}      color="#f97316" />
                            <StatCard label="Lohnvorteil (≥+5%)"           value={overpaidCount} color="#8b5cf6" />
                            <StatCard label="Pläne erstellt"               value={plannedCount}  color="var(--color-pl-brand)" />
                        </div>

                        {/* Filter tabs */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {([
                                ['all',      'Alle',             actionableFlags.length],
                                ['high',     'Kritisch',         highCount],
                                ['medium',   'Nicht konform',    medCount],
                                ['overpaid', 'Lohnvorteil',      overpaidCount],
                                ['planned',  'Mit Plan',         plannedCount],
                                ['open',     'Ohne Plan',        actionableFlags.length - plannedCount],
                            ] as const).map(([k, l, c]) => (
                                <button
                                    key={k}
                                    onClick={() => setFilter(k)}
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
                                    Keine Mitarbeitenden in diesem Filter.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Column headers */}
                                <div className="flex items-center gap-5 px-5 py-1 text-xs font-semibold"
                                    style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    <span className="w-4 flex-shrink-0" />
                                    <span className="w-44 flex-shrink-0">Schwere</span>
                                    <span className="w-72 flex-shrink-0">Name & ID</span>
                                    <span className="w-48 flex-shrink-0 hidden xl:block">Abteilung</span>
                                    <span className="w-40 flex-shrink-0 hidden xl:block">Gruppe</span>
                                    
                                    <span className="w-32 text-right flex-shrink-0 hidden md:block">Gehalt</span>
                                    <span className="w-32 text-right flex-shrink-0 hidden md:block">Kohorte (Median)</span>
                                    <span className="w-24 text-right flex-shrink-0">Lücke</span>
                                    <span className="w-24 text-right flex-shrink-0 hidden md:block">Restlücke</span>
                                    
                                    <span className="w-48 hidden lg:flex items-center justify-around flex-shrink-0">
                                        <span className="w-12 text-center" title="Kurzfristig: 0–6 Monate">Kurz</span>
                                        <span className="w-12 text-center" title="Mittelfristig: 6–12 Monate">Mittel</span>
                                        <span className="w-12 text-center" title="Langfristig: 12+ Monate">Lang</span>
                                    </span>
                                    
                                    <span className="flex-1 min-w-0" />
                                    
                                    <span className="w-24 text-right flex-shrink-0">Status</span>
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
