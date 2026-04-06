'use client'

import { useState, useMemo, useRef } from 'react'
import React from 'react'
import { useTranslations } from 'next-intl'
import {
    ChevronRight, Search, CheckCircle2,
    Clock, XCircle, AlertTriangle, Info, X, Save,
    Eye, EyeOff,
} from 'lucide-react'
import type { IndividualFlag } from '@/lib/calculations/types'
import { EXPLANATION_CATEGORIES, MAX_JUSTIFIABLE_CAP } from '@/app/(dashboard)/dashboard/import/constants'
import { saveExplanation } from './explanations/actions'

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

type Explanation = {
    id?: string
    employee_id: string
    category: string
    explanation: string
    max_justifiable_pct: number
    status: string
    created_at?: string
    categories_json?: Array<{ key: string; comment: string; claimed_pct?: number }>
    action_plan?: string
}

// ────────────────────────────────────────────────────────────
// Cohort recalculation helpers
// ────────────────────────────────────────────────────────────

function calcMedian(values: number[]): number | null {
    if (!values.length) return null
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function getCohortKey(f: IndividualFlag, factors: string[]): string {
    return factors.map(factor => {
        if (factor === 'job_grade')       return f.job_grade ?? '__'
        if (factor === 'employment_type') return f.employment_type ?? '__'
        if (factor === 'department')      return f.department ?? '__'
        return '__'  // location not stored in flags — skip
    }).join('|')
}

function pctFmt(val: number | null) {
    if (val === null) return '—'
    const p = (val * 100).toFixed(1)
    return val > 0 ? `+${p}%` : `${p}%`
}

function hrFmt(val: number) {
    return val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €/h'
}

function numFmt(val: number | null, suffix = ' €') {
    if (val === null || val === 0) return ''
    return val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + suffix
}

const SEVERITY_CONFIG: Record<IndividualFlag['severity'], {
    bg: string; border: string; dot: string; labelKey: string
}> = {
    high:     { bg: 'rgba(239,68,68,0.10)',    border: 'rgba(239,68,68,0.35)',    dot: '#ef4444', labelKey: 'severityHigh'       },
    medium:   { bg: 'rgba(249,115,22,0.10)',   border: 'rgba(249,115,22,0.35)',   dot: '#f97316', labelKey: 'severityMedium'  },
    low:      { bg: 'rgba(249,115,22,0.08)',   border: 'rgba(249,115,22,0.20)',   dot: '#f97316', labelKey: 'severityMedium'  },  // legacy
    ok:       { bg: 'transparent',             border: 'transparent',             dot: '#34d399', labelKey: 'severityOk'        },
    overpaid: { bg: 'rgba(139,92,246,0.12)',   border: 'rgba(139,92,246,0.40)',   dot: '#8b5cf6', labelKey: 'severityOverpaid'    },
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; labelKey: string; color: string }> = {
    open:      { icon: <AlertTriangle size={13} />,  labelKey: 'statusOpen',       color: '#f59e0b' },
    in_review: { icon: <Clock size={13} />,           labelKey: 'statusInReview',   color: '#60a5fa' },
    explained: { icon: <CheckCircle2 size={13} />,   labelKey: 'statusExplained',  color: '#34d399' },
    konform:   { icon: <CheckCircle2 size={13} />,   labelKey: 'statusKonform',    color: '#6ee7b7' },
    rejected:  { icon: <XCircle size={13} />,         labelKey: 'statusRejected',   color: '#ef4444' },
}

// ────────────────────────────────────────────────────────────
// Small number input that shows placeholder when empty
// ────────────────────────────────────────────────────────────

function PayField({
    label, value, onChange, placeholder = '0,00', suffix = '€', hint,
}: {
    label: string; value: string; onChange: (v: string) => void
    placeholder?: string; suffix?: string; hint?: string
}) {
    return (
        <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                {label}
            </label>
            <div className="relative flex items-center">
                <input
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="input-base text-xs py-1.5 pr-6 w-full"
                />
                <span className="absolute right-2 text-xs pointer-events-none"
                    style={{ color: 'var(--color-pl-text-tertiary)' }}>{suffix}</span>
            </div>
            {hint && <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{hint}</p>}
        </div>
    )
}

// ────────────────────────────────────────────────────────────
// TooltipHeader — column header with hover tooltip
// Uses React state so it works inside overflow-hidden containers
// ────────────────────────────────────────────────────────────

function TooltipHeader({ label, children }: { label: string; children?: React.ReactNode }) {
    const [show, setShow] = useState(false)
    return (
        <div
            className="relative inline-flex items-center gap-0.5 cursor-help select-none"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <span>{label}</span>
            <Info size={10} style={{ color: 'var(--color-pl-text-tertiary)', flexShrink: 0 }} />
            {show && (
                <div
                    className="absolute top-full right-0 mt-1 w-56 p-3 rounded-lg z-50 text-left normal-case"
                    style={{
                        background: 'var(--color-pl-surface)',
                        border: '1px solid var(--color-pl-border)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        pointerEvents: 'none',
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    )
}


// ────────────────────────────────────────────────────────────
// Explanation Drawer
// ────────────────────────────────────────────────────────────

function ExplanationDrawer({
    flag, analysisId, existing, onClose, onSaved, showNames,
}: {
    flag:             IndividualFlag
    analysisId:       string
    existing:         Explanation | null
    onClose:          () => void
    onSaved:          (ex: Explanation) => void
    showNames:        boolean
}) {
    const t = useTranslations('employees')
    const te = useTranslations('explanations')
    const initCats: Array<{ key: string; comment: string; claimed_pct?: number }> = existing
        ? ((existing as Explanation & { categories_json?: Array<{ key: string; comment: string; claimed_pct?: number }> }).categories_json ?? [])
        : []

    const [selected, setSelected] = useState<Set<string>>(
        () => new Set(initCats.map(c => c.key))
    )
    const [comments, setComments] = useState<Record<string, string>>(
        () => Object.fromEntries(initCats.map(c => [c.key, c.comment]))
    )
    // claimed_pct: the HR-chosen justification amount per category (slider value)
    // Defaults to 50% of ceiling on first selection; restored from saved data on re-open
    const [claimedPcts, setClaimedPcts] = useState<Record<string, number>>(
        () => Object.fromEntries(
            initCats.map(c => [
                c.key,
                c.claimed_pct ?? (() => {
                    const cat = EXPLANATION_CATEGORIES.find(x => x.key === c.key)
                    return Math.round((cat?.max_justifiable_pct ?? 10) * 0.5 * 2) / 2
                })(),
            ])
        )
    )
    const [actionPlan, setActionPlan] = useState(
        (existing as Explanation & { action_plan?: string })?.action_plan ?? ''
    )
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')

    const totalGapPct = Math.abs(flag.gap_vs_cohort_pct * 100)

    const justifiedPctRaw = useMemo(() => {
        // Sum the HR-chosen claimed amounts (not the ceilings)
        return [...selected].reduce((sum, key) => sum + (claimedPcts[key] ?? 0), 0)
    }, [selected, claimedPcts])

    // Apply the 25% combined cap (Art. 18 — burden of proof)
    const justifiedPct      = Math.min(justifiedPctRaw, MAX_JUSTIFIABLE_CAP)
    const capFillPct        = Math.min(100, (justifiedPctRaw / MAX_JUSTIFIABLE_CAP) * 100)
    const isCapped          = justifiedPctRaw > MAX_JUSTIFIABLE_CAP

    const residualPct = Math.max(0, totalGapPct - justifiedPct)

    function toggleCategory(key: string) {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(key)) {
                next.delete(key)
            } else {
                next.add(key)
                // Initialise claimed_pct at 50% of ceiling when first selecting
                if (claimedPcts[key] === undefined) {
                    const cat = EXPLANATION_CATEGORIES.find(c => c.key === key)
                    const half = Math.round((cat?.max_justifiable_pct ?? 10) * 0.5 * 2) / 2
                    setClaimedPcts(p => ({ ...p, [key]: half }))
                }
            }
            return next
        })
    }

    async function handleSave() {
        if (selected.size === 0) { setError(t('selectAtLeastOne')); return }
        setError('')
        const categories = [...selected].map(key => ({
            key,
            comment:     comments[key] ?? '',
            claimed_pct: claimedPcts[key] ?? 0,
        }))
        setIsSaving(true)
        try {
            const res = await saveExplanation({ analysisId, employeeId: flag.employee_id, categories, actionPlan })
            if (res.error) { setError(res.error); return }
            onSaved({
                id: res.id, employee_id: flag.employee_id,
                category: [...selected][0] ?? 'other',
                explanation: categories.map(c => c.comment).join(' | '),
                max_justifiable_pct: justifiedPct,
                status: 'explained',
                created_at: new Date().toISOString(),
                categories_json: categories,
                action_plan: actionPlan,
            })
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            setError(t('errorPrefix') + msg)
            console.error('[handleSave Begründung]', err)
        } finally {
            setIsSaving(false)
        }
    }

    const displayName = showNames && (flag.first_name || flag.last_name)
        ? `${flag.first_name ?? ''} ${flag.last_name ?? ''}`.trim()
        : flag.employee_ref ?? flag.employee_id.slice(0, 8)
    const sc = SEVERITY_CONFIG[flag.severity]
    const genderLabel = flag.gender === 'female' ? '♀' : flag.gender === 'male' ? '♂' : '⚥'

    return (
        <div className="fixed inset-0 z-50 flex items-stretch">
            <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="w-[540px] flex flex-col h-full overflow-y-auto"
                style={{ background: 'var(--color-pl-surface)', borderLeft: '1px solid var(--color-pl-border)' }}>

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b flex-shrink-0"
                    style={{ borderColor: 'var(--color-pl-border)' }}>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                            style={{ color: 'var(--color-pl-text-tertiary)' }}>{te('drawerTitle')}</p>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {displayName}
                            <span className="ml-2 font-normal" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {genderLabel} · {flag.job_grade ?? '—'} · {flag.department ?? '—'}
                            </span>
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg"
                        style={{ color: 'var(--color-pl-text-tertiary)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-pl-action-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <X size={18} />
                    </button>
                </div>

                {/* Pay comparison strip */}
                <div className="px-6 py-3 grid grid-cols-3 gap-2 border-b flex-shrink-0"
                    style={{ borderColor: 'var(--color-pl-border)', background: 'var(--theme-pl-action-ghost)' }}>
                    {[
                        { label: t('hourlyRate'), value: hrFmt(flag.hourly_rate) },
                        { label: t('cohortMedian'), value: hrFmt(flag.cohort_median) },
                        { label: t('oppositeGenderMedian'), value: flag.opposite_gender_median ? hrFmt(flag.opposite_gender_median) : '—' },
                    ].map(({ label, value }) => (
                        <div key={label} className="p-2.5 rounded-lg text-center"
                            style={{ background: 'var(--theme-pl-action-ghost)', border: '1px solid var(--color-pl-border)' }}>
                            <p className="text-xs mb-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{label}</p>
                            <p className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                            style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {te('categoriesTitle')}
                        </p>

                        {/* 25% combined cap progress bar — Art. 18 */}
                        <div className="mb-3 p-3 rounded-xl"
                            style={{ background: 'var(--theme-pl-action-ghost)', border: `1px solid ${isCapped ? 'rgba(245,158,11,0.4)' : 'var(--theme-pl-action-hover)'}` }}>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    {te('capTitle')}
                                </span>
                                <span className="text-xs font-bold"
                                    style={{ color: isCapped ? '#f59e0b' : justifiedPctRaw > 20 ? '#f59e0b' : 'var(--color-pl-text-secondary)' }}>
                                    {Math.min(justifiedPctRaw, MAX_JUSTIFIABLE_CAP).toFixed(0)} / {MAX_JUSTIFIABLE_CAP}%
                                    {isCapped && ` — ${te('capLimited')}`}
                                </span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-pl-action-hover)' }}>
                                <div className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${capFillPct}%`,
                                        background: capFillPct >= 100 ? '#f59e0b' : capFillPct > 80 ? '#f59e0b' : '#6366f1',
                                    }} />
                            </div>
                            <p className="text-xs mt-1.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {isCapped
                                    ? te('capExceeded', { pct: justifiedPctRaw, cap: MAX_JUSTIFIABLE_CAP })
                                    : te('capNormal', { cap: MAX_JUSTIFIABLE_CAP })
                                }
                            </p>
                        </div>

                        <div className="space-y-2">
                            {EXPLANATION_CATEGORIES.map(cat => {
                                const isSelected = selected.has(cat.key)
                                return (
                                    <div key={cat.key}
                                        style={{
                                            border: `1px solid ${isSelected ? cat.color : 'var(--color-pl-border)'}`,
                                            background: isSelected ? `${cat.color}18` : 'var(--theme-pl-action-ghost)',
                                            borderRadius: 10, transition: 'all 0.15s',
                                        }}>
                                        <button
                                            onClick={() => toggleCategory(cat.key)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 text-left">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                                                    style={{
                                                        background: isSelected ? cat.color : 'transparent',
                                                        border: `1.5px solid ${isSelected ? cat.color : 'var(--color-pl-text-tertiary)'}`,
                                                    }}>
                                                    {isSelected && (
                                                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                                            <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>
                                                        {cat.label}
                                                    </p>
                                                    {!isSelected && (
                                                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                            {cat.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold ml-2 flex-shrink-0"
                                                style={{ color: isSelected ? cat.color : 'var(--color-pl-text-tertiary)' }}>
                                                {te('upTo', { pct: cat.max_justifiable_pct })}
                                            </span>
                                        </button>
                                        {isSelected && (
                                            <div className="px-3 pb-3 pt-1" onClick={e => e.stopPropagation()}>

                                                {/* Slider + numeric readout */}
                                                <div className="mb-3">
                                                    <div className="flex justify-between items-baseline mb-2">
                                                        <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                            {te('claimedAmount')}
                                                        </span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-base font-bold tabular-nums" style={{ color: cat.color }}>
                                                                {(claimedPcts[cat.key] ?? 0).toFixed(1)}%
                                                            </span>
                                                            <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                                / {te('upTo', { pct: cat.max_justifiable_pct })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Custom slider: invisible range on top of coloured track */}
                                                    <div className="relative h-5 flex items-center">
                                                        {/* Track bg */}
                                                        <div className="absolute inset-x-0 h-1.5 rounded-full"
                                                            style={{ background: 'var(--color-pl-border)' }} />
                                                        {/* Fill */}
                                                        <div className="absolute left-0 h-1.5 rounded-full transition-all duration-100"
                                                            style={{
                                                                width: `${Math.min(100, ((claimedPcts[cat.key] ?? 0) / cat.max_justifiable_pct) * 100)}%`,
                                                                background: cat.color,
                                                            }} />
                                                        {/* Thumb dot overlay */}
                                                        <div className="absolute h-3.5 w-3.5 rounded-full border-2 transition-all duration-100 pointer-events-none"
                                                            style={{
                                                                left: `calc(${Math.min(100, ((claimedPcts[cat.key] ?? 0) / cat.max_justifiable_pct) * 100)}% - 7px)`,
                                                                background: cat.color,
                                                                borderColor: 'var(--color-pl-surface)',
                                                                boxShadow: `0 0 6px ${cat.color}80`,
                                                            }} />
                                                        {/* Native range — transparent, covers full area for interaction */}
                                                        <input
                                                            type="range"
                                                            min={0}
                                                            max={cat.max_justifiable_pct}
                                                            step={0.5}
                                                            value={claimedPcts[cat.key] ?? 0}
                                                            onChange={e => setClaimedPcts(p => ({ ...p, [cat.key]: parseFloat(e.target.value) }))}
                                                            className="absolute inset-0 w-full cursor-pointer"
                                                            style={{ opacity: 0, height: '100%' }}
                                                        />
                                                    </div>

                                                    {/* Min/max labels */}
                                                    <div className="flex justify-between mt-1">
                                                        <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>0%</span>
                                                        <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{cat.max_justifiable_pct}%</span>
                                                    </div>
                                                </div>

                                                {/* Comment */}
                                                <p className="text-xs mb-1.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                    {t('commentOn', { label: cat.label })}
                                                </p>
                                                <textarea
                                                    rows={2}
                                                    value={comments[cat.key] ?? ''}
                                                    onChange={e => setComments(p => ({ ...p, [cat.key]: e.target.value }))}
                                                    placeholder={t('commentPlaceholder', { pct: (claimedPcts[cat.key] ?? 0).toFixed(1), label: cat.label.toLowerCase() })}
                                                    className="input-base text-xs resize-none w-full"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* ── Gap calculator ── */}
                    {selected.size > 0 && (
                        <div className="p-4 rounded-xl space-y-2"
                            style={{ background: 'var(--theme-pl-action-ghost)', border: '1px solid var(--color-pl-border)' }}>
                            <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                                style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('gapCalculation')}</p>
                            <div className="flex justify-between text-xs">
                                <span style={{ color: 'var(--color-pl-text-secondary)' }}>{t('identifiedGap')}</span>
                                <span style={{ color: '#ef4444', fontWeight: 700 }}>{totalGapPct.toFixed(1)}%</span>
                            </div>
                            {[...selected].map(key => {
                                const cat = EXPLANATION_CATEGORIES.find(c => c.key === key)!
                                const claimed = claimedPcts[key] ?? 0
                                return (
                                    <div key={key} className="flex justify-between text-xs">
                                        <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('claimedBy', { category: cat.label })}</span>
                                        <span style={{ color: cat.color, fontWeight: 600 }}>
                                            −{Math.min(claimed, totalGapPct).toFixed(1)}%
                                        </span>
                                    </div>
                                )
                            })}
                            <div className="border-t pt-2 flex justify-between text-xs"
                                style={{ borderColor: 'var(--color-pl-border)' }}>
                                <span style={{ color: 'var(--color-pl-text-primary)', fontWeight: 600 }}>{t('remainingResidualGap')}</span>
                                <span style={{ color: residualPct > 5 ? '#ef4444' : '#34d399', fontWeight: 700 }}>
                                    {residualPct > 0 ? `-${residualPct.toFixed(1)}%` : '0%'}
                                </span>
                            </div>
                            {residualPct > 5 && (
                                <p className="text-xs pt-1" style={{ color: '#f59e0b' }}>
                                    {t('residualOver5Warning')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── Action plan ── */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1.5"
                            style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('actionPlanTitle')}</p>
                        <p className="text-xs mb-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('actionPlanDesc')}
                        </p>
                        <textarea rows={4} value={actionPlan} onChange={e => setActionPlan(e.target.value)}
                            placeholder={t('actionPlanPlaceholder')}
                            className="input-base text-sm resize-none w-full" />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-xs p-3 rounded-lg"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                            <Info size={13} /> {error}
                        </div>
                    )}

                    {existing && (
                        <div className="p-3 rounded-lg text-xs"
                            style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
                            <p style={{ color: '#34d399', fontWeight: 600 }}>{t('explanationSaved')}</p>
                            <p style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {new Date(existing.created_at ?? '').toLocaleDateString('de-DE')}
                                {' · '}{t('categoriesCount', { count: selected.size, pct: justifiedPct })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t flex gap-3 flex-shrink-0"
                    style={{ borderColor: 'var(--color-pl-border)', background: 'var(--theme-pl-action-ghost)' }}>
                    <button onClick={onClose} className="btn-ghost flex-1 text-sm">{t('closeBtn')}</button>
                    <button onClick={handleSave} disabled={isSaving} className="btn-primary flex-1 text-sm">
                        {isSaving ? t('saving') : <><Save size={14} /> {t('saveExplanation')}</>}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ────────────────────────────────────────────────────────────
// Main EmployeesTab
// ────────────────────────────────────────────────────────────

export default function EmployeesTab({
    flags, analysisId, existingExplanations, adjustedMedian, wifFactors,
}: {
    flags:                IndividualFlag[]
    analysisId:           string
    existingExplanations: Explanation[]
    adjustedMedian:       number   // overall.adjusted_median (fraction, e.g. 0.071 = 7.1%)
    wifFactors?:          string[] // from AnalysisPage selectedWif — triggers live recalc
}) {
    const t = useTranslations('employees')
    const [search, setSearch]           = useState('')
    const [filterDept, setFilterDept]   = useState('')
    const [filterGrade, setFilterGrade] = useState('')
    const [filterSeverity, setFilterSeverity] = useState('')
    const [filterStatus, setFilterStatus]     = useState('')
    const [showNames, setShowNames]     = useState(true)
    const [selected, setSelected]       = useState<IndividualFlag | null>(null)

    const [explanations, setExplanations] = useState<Map<string, Explanation>>(() => {
        const m = new Map<string, Explanation>()
        existingExplanations.forEach(e => m.set(e.employee_id, e))
        return m
    })

    // ── Regrounded flags: live cohort recalculation based on selectedWif ──────
    // job_grade, employment_type, department are available per-employee.
    // location is NOT stored in individual_flags, so it is silently omitted
    // when present in wifFactors — the remaining available factors are used.
    const { regroundedFlags, liveAdjustedMedian } = useMemo(() => {
        const availableFactors = (wifFactors ?? ['job_grade', 'employment_type'])
            .filter(f => ['job_grade', 'employment_type', 'department'].includes(f))

        type CohortGroup = { male: number[]; female: number[] }
        const cohortGroups = new Map<string, CohortGroup>()
        for (const f of flags) {
            const key = getCohortKey(f, availableFactors)
            if (!cohortGroups.has(key)) cohortGroups.set(key, { male: [], female: [] })
            const g = cohortGroups.get(key)!
            ;(f.gender === 'male' ? g.male : g.female).push(f.hourly_rate)
        }

        // Live adjusted median: weighted average of cohort-level gender gaps
        let sumWeightedGap = 0
        let totalWeight = 0
        for (const [, g] of cohortGroups) {
            const fm = calcMedian(g.female)
            const mm = calcMedian(g.male)
            if (fm !== null && mm !== null && mm > 0 && g.female.length >= 2 && g.male.length >= 2) {
                const gap = (fm - mm) / mm
                sumWeightedGap += gap * g.female.length
                totalWeight    += g.female.length
            }
        }
        const liveAdjustedMedian = totalWeight > 0 ? sumWeightedGap / totalWeight : adjustedMedian

        const regroundedFlags = flags.map(f => {
            const key          = getCohortKey(f, availableFactors)
            const g            = cohortGroups.get(key)!
            const allRates     = [...g.male, ...g.female]
            const cohortMedian = calcMedian(allRates) ?? f.cohort_median
            const oppRates     = f.gender === 'male' ? g.female : g.male
            const oppMedian    = oppRates.length >= 2 ? calcMedian(oppRates) : null
            const oppCount     = oppRates.length

            const gapVsCohort  = cohortMedian ? (f.hourly_rate - cohortMedian) / cohortMedian
                                              : f.gap_vs_cohort_pct
            const gapVsGender  = oppMedian !== null
                                 ? (f.hourly_rate - oppMedian) / oppMedian
                                 : null

            const gapRef       = gapVsGender ?? gapVsCohort
            const severity: IndividualFlag['severity'] =
                gapRef <= -0.25 ? 'high'
              : gapRef <= -0.05 ? 'medium'
              : gapRef >=  0.05 ? 'overpaid'
              : 'ok'

            return {
                ...f,
                cohort_median:          cohortMedian,
                cohort_size:            allRates.length,
                opposite_gender_count:  oppCount,
                opposite_gender_median: oppMedian,
                gap_vs_cohort_pct:      gapVsCohort,
                gap_vs_gender_pct:      gapVsGender,
                severity,
            }
        })
        return { regroundedFlags, liveAdjustedMedian }
    }, [flags, wifFactors, adjustedMedian])

    const departments = useMemo(() => [...new Set(regroundedFlags.map(f => f.department).filter(Boolean))].sort() as string[], [regroundedFlags])
    const grades      = useMemo(() => [...new Set(regroundedFlags.map(f => f.job_grade).filter(Boolean))].sort() as string[], [regroundedFlags])
    const hasNames    = regroundedFlags.some(f => f.first_name || f.last_name)

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return regroundedFlags
            .filter(f => {
                if (filterDept     && f.department !== filterDept)     return false
                if (filterGrade    && f.job_grade  !== filterGrade)    return false
                if (filterSeverity && f.severity   !== filterSeverity) return false
                if (filterStatus) {
                    const ex = explanations.get(f.employee_id)
                    const st = ex?.status ?? (f.severity === 'ok' ? 'konform' : 'open')
                    if (st !== filterStatus) return false
                }
                if (q) {
                    const name = `${f.first_name ?? ''} ${f.last_name ?? ''} ${f.employee_ref ?? ''}`.toLowerCase()
                    if (!name.includes(q) && !(f.department ?? '').toLowerCase().includes(q)) return false
                }
                return true
            })
            .sort((a, b) => Math.abs(b.gap_vs_cohort_pct) - Math.abs(a.gap_vs_cohort_pct))
    }, [regroundedFlags, search, filterDept, filterGrade, filterSeverity, filterStatus, explanations])

    const openCount = regroundedFlags.filter(f => {
        if (f.severity === 'ok') return false
        const ex = explanations.get(f.employee_id)
        if (!ex) return true  // no explanation at all
        const rawGapPct = Math.abs(f.gap_vs_cohort_pct * 100)
        const cats = ex.categories_json ?? []
        const explained = Math.min(cats.reduce((s: number, c: { claimed_pct?: number }) => s + (c.claimed_pct ?? 0), 0), 25)
        return Math.max(0, rawGapPct - explained) >= 5  // explanation exists but residual ≥ 5%
    }).length
    const explainedCount = regroundedFlags.filter(f => explanations.get(f.employee_id)?.status === 'explained').length
    const excludedCount  = 0  // Vergütungsdetails removed; keep stat chip for future use

    function getDisplayName(f: IndividualFlag) {
        if (showNames && hasNames && (f.first_name || f.last_name))
            return `${f.first_name ?? ''} ${f.last_name ?? ''}`.trim()
        return f.employee_ref ?? f.employee_id.slice(0, 8)
    }

    return (
        <div className="space-y-4">
            {/* Stats bar */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: t('totalLabel'),   value: flags.length,      color: 'var(--color-pl-text-secondary)' },
                    { label: t('openLabel'),    value: openCount,         color: '#f59e0b' },
                    { label: t('explainedLabel'), value: explainedCount,    color: '#34d399' },
                    { label: t('excludedLabel'), value: excludedCount, color: '#f87171' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="glass-card p-3 text-center">
                        <p className="text-xl font-bold" style={{ color }}>{value}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{label}</p>
                    </div>
                ))}
            </div>

            {/* ── {t('adjustedGapAfterExplanations')} ── */}
            {existingExplanations.length > 0 && (() => {
                type CatEntry = { claimed_pct?: number }
                const explMap = new Map(existingExplanations.map(e => [
                    e.employee_id,
                    ((e as unknown as { categories_json?: CatEntry[] }).categories_json ?? []),
                ]))
                const flaggedNonOk = regroundedFlags.filter(f => f.severity !== 'ok')
                // Proportional reduction of the WIF-adjusted median
                // sumRaw = total individual gap magnitudes; sumResiduals = what remains after explanations
                let sumRaw = 0
                let sumResiduals = 0
                let fullyExplained = 0
                let erklaertCount = 0
                for (const f of flaggedNonOk) {
                    const rawGapPct = Math.abs(f.gap_vs_cohort_pct * 100)
                    const cats = explMap.get(f.employee_id) ?? []
                    const explained = Math.min(cats.reduce((s, c) => s + (c.claimed_pct ?? 0), 0), 25)
                    const residual = Math.max(0, rawGapPct - explained)
                    sumRaw += rawGapPct
                    sumResiduals += residual
                    if (residual < 5) fullyExplained++
                    const exStatus = explanations.get(f.employee_id)?.status
                    if (exStatus === 'explained') erklaertCount++
                }
                const adjustedMedianPct = Math.abs(liveAdjustedMedian) * 100
                const residualAdjusted = sumRaw > 0
                    ? adjustedMedianPct * (sumResiduals / sumRaw)
                    : adjustedMedianPct
                const residualColor = residualAdjusted < 5 ? '#34d399' : '#f87171'

                return (
                    <div className="glass-card p-4" style={{ border: '1px solid rgba(52,211,153,0.2)' }}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(52,211,153,0.75)' }}>
                                    {t('adjustedGapAfterExplanations')}
                                </p>
                                <div className="flex gap-6 text-xs">
                                    <div>
                                        <p style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('justified')}</p>
                                        <p className="font-semibold mt-0.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                                            {existingExplanations.length} / {flaggedNonOk.length}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('explained')}</p>
                                        <p className="font-semibold mt-0.5" style={{ color: 'var(--color-pl-text-primary)' }}>{erklaertCount}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('fullyExplainedLabel')}</p>
                                        <p className="font-semibold mt-0.5" style={{ color: '#34d399' }}>{fullyExplained}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('stillOpen')}</p>
                                        <p className="font-semibold mt-0.5" style={{ color: flaggedNonOk.length - fullyExplained > 0 ? '#f59e0b' : '#34d399' }}>
                                            {flaggedNonOk.length - fullyExplained}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('medianResidualGap')}</p>
                                <p className="text-2xl font-bold" style={{ color: residualColor }}>
                                    {residualAdjusted > 0 ? `-${residualAdjusted.toFixed(1)}%` : '0%'}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            })()}

            {/* Filters */}
            <div className="glass-card p-3 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-48">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: 'var(--color-pl-text-tertiary)' }} />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder={t('searchPlaceholder')} className="input-base text-xs py-1.5 w-full"
                        style={{ paddingLeft: '2rem' }} />
                </div>
                <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                    className="input-base text-xs py-1.5">
                    <option value="">{t('allDepartments')}</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
                    className="input-base text-xs py-1.5">
                    <option value="">{t('allGrades')}</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
                    className="input-base text-xs py-1.5">
                    <option value="">{t('allSeverities')}</option>
                    <option value="high">{t('severityHighFilter')}</option>
                    <option value="medium">{t('severityMediumFilter')}</option>
                    <option value="overpaid">{t('severityOverpaidFilter')}</option>
                    <option value="ok">{t('severityOkFilter')}</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="input-base text-xs py-1.5">
                    <option value="">{t('allStatuses')}</option>
                    <option value="open">{t('statusOpenFilter')}</option>
                    <option value="in_review">{t('statusInReviewFilter')}</option>
                    <option value="explained">{t('statusExplainedFilter')}</option>
                    <option value="konform">{t('statusKonformFilter')}</option>
                </select>
                {hasNames && (
                    <button onClick={() => setShowNames(v => !v)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
                        style={{
                            background: showNames ? 'rgba(99,102,241,0.15)' : 'var(--theme-pl-action-hover)',
                            border: `1px solid ${showNames ? 'rgba(99,102,241,0.5)' : 'var(--color-pl-border)'}`,
                            color: showNames ? '#818cf8' : 'var(--color-pl-text-tertiary)',
                        }}>
                        {showNames ? <Eye size={12} /> : <EyeOff size={12} />}
                        {showNames ? t('namesVisible') : t('anonymous')}
                    </button>
                )}
                <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('ofTotal', { filtered: filtered.length, total: flags.length })}
                </span>
            </div>

            {/* Table — explicit column widths for balanced distribution */}
            <div className="glass-card" style={{ overflow: 'visible' }}>
                {/* Inner wrapper clips the rounded table row borders but lets tooltip escape via the card being overflow-visible */}
                <div className="rounded-xl overflow-hidden">
                <div className="grid px-4 py-2.5 border-b text-xs font-semibold uppercase tracking-wide"
                    style={{
                        borderColor: 'var(--color-pl-border)',
                        color: 'var(--color-pl-text-tertiary)',
                        gridTemplateColumns: '1.1fr 0.75fr 0.9fr 1fr 1fr 1fr 1fr 1.3fr 1.1fr 1fr 0.8fr 0.2fr',
                    }}>
                    <div>{t('colEmployee')}</div>
                    <div>{t('colDeptGrade')}</div>
                    <div className="text-right">{t('colBaseSalary')}</div>
                    <div className="text-right">{t('colVariablePay')}</div>
                    <div className="text-right">
                        <TooltipHeader label={t('colOtherPay')}>
                            <p className="font-semibold text-xs mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>{t('colOtherPayTooltipTitle')}</p>
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('colOtherPayTooltipDesc')}</p>
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('colOtherPayOvertime')}</p>
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('colOtherPayBenefits')}</p>
                            <p className="text-xs mt-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('colOtherPayNote')}</p>
                        </TooltipHeader>
                    </div>
                    <div className="text-right">{t('colHourlyRate')}</div>
                    <div className="text-right">{t('colCohort')}</div>
                    <div className="text-right">{t('colGap')}</div>
                    <div className="text-center">{t('colSeverity')}</div>
                    <div className="text-center">{t('colAfterExplanation')}</div>
                    <div className="text-center">{t('colStatus')}</div>
                    <div></div>
                </div>

                {filtered.length === 0 && (
                    <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('noEntries')}
                    </div>
                )}

                {filtered.map(f => {
                    const sc     = SEVERITY_CONFIG[f.severity]
                    const ex     = explanations.get(f.employee_id)
                    const status = ex?.status ?? (f.severity === 'ok' ? 'konform' : 'open')
                    const stCfg  = STATUS_CONFIG[status] ?? STATUS_CONFIG.open
                    const gapVal = f.gap_vs_cohort_pct   // cohort gap = basis for EU Art.4 remediation

                    return (
                        <div key={f.employee_id}
                            onClick={() => setSelected(f)}
                            className="grid px-4 py-3 border-b last:border-b-0 items-center cursor-pointer transition-colors"
                            style={{
                                borderColor: 'var(--color-pl-border)',
                                background:  f === selected ? 'var(--theme-pl-action-ghost)' : 'transparent',
                                opacity:     1,
                                gridTemplateColumns: '1.1fr 0.75fr 0.9fr 1fr 1fr 1fr 1fr 1.3fr 1.1fr 1fr 0.8fr 0.2fr',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-pl-action-ghost)')}
                            onMouseLeave={e => (e.currentTarget.style.background = f === selected ? 'var(--theme-pl-action-ghost)' : 'transparent')}>

                            {/* Name */}
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
                                <div>
                                    <p className="text-xs font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>
                                        {getDisplayName(f)}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        {f.gender === 'female' ? '♀' : f.gender === 'male' ? '♂' : '⚥'} · {f.employment_type}
                                    </p>
                                </div>
                            </div>

                            {/* Dept / Grade */}
                            <div>
                                <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>{f.department ?? '—'}</p>
                                <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{f.job_grade ?? '—'}</p>
                            </div>

                            {/* Grundgehalt */}
                            <div className="text-right">
                                {(() => {
                                    const base   = f.imported_salary_base
                                    const period = f.imported_salary_period
                                    if (!base) return <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>—</span>
                                    const annual = period === 'monthly' ? base * 12 : period === 'hourly' ? base * (f.imported_annualised_hours || 2080) : base
                                    return (
                                        <>
                                            <p className="text-xs font-medium" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                                {numFmt(annual)}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('perAnnum')}</p>
                                        </>
                                    )
                                })()}
                            </div>

                            {/* Var. Vergütung */}
                            <div className="text-right">
                                {(() => {
                                    const eurDisplay    = f.imported_variable_pay_eur
                                    const annualBase    = f.imported_salary_base > 0 ? f.imported_salary_base : null
                                    const varPctDisplay = eurDisplay && annualBase && eurDisplay > 0
                                        ? (eurDisplay / annualBase) * 100
                                        : null
                                    if ((!eurDisplay || eurDisplay === 0) && !varPctDisplay) return <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>—</span>
                                    return (
                                        <>
                                            {eurDisplay != null && eurDisplay > 0 && (
                                                <p className="text-xs font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>
                                                    {numFmt(eurDisplay)}
                                                </p>
                                            )}
                                            {varPctDisplay != null && varPctDisplay > 0 && (
                                                <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                    {varPctDisplay.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %
                                                </p>
                                            )}
                                        </>
                                    )
                                })()}
                            </div>

                            {/* Andere Bezüge = overtime + benefits_in_kind */}
                            <div className="col-span-1 text-right">
                                {(() => {
                                    const sum = (f.imported_overtime_pay ?? 0) + (f.imported_benefits_in_kind ?? 0)
                                    if (sum === 0) return <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>—</span>
                                    return <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>{numFmt(sum)}</p>
                                })()}
                            </div>

                            {/* Std.-Lohn */}
                            <div className="text-right">
                                <p className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                    {hrFmt(f.hourly_rate)}
                                </p>
                            </div>

                            {/* Kohorte */}
                            <div className="text-right">
                                <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    {hrFmt(f.cohort_median)}
                                </p>
                            </div>

                            {/* Lücke — cohort gap vs. peer group (EU Art. 4 basis) */}
                            <div
                                className="text-right"
                                title={`Kohorte: ${f.job_grade ?? '—'} · ${f.employment_type} · ${f.department ?? '—'} (${f.cohort_size} Personen)\nKohorte-Median: ${f.cohort_median.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/h`}
                            >
                                <p className="text-xs font-bold"
                                    style={{ color: Math.abs(gapVal) >= 0.10 ? sc.dot : 'var(--color-pl-text-secondary)' }}>
                                    {pctFmt(gapVal)}
                                </p>
                            </div>

                            {/* Schwere */}
                            <div className="flex justify-center">
                                {f.severity !== 'ok' ? (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.dot }}>
                                        {t(sc.labelKey)}
                                    </span>
                                ) : (
                                    <span className="text-xs" style={{ color: '#34d399' }}>✓</span>
                                )}
                            </div>

                            {/* Nach Erklärung */}
                            <div className="flex justify-center items-center">
                                {ex ? (() => {
                                    const rawGapPct = Math.abs(f.gap_vs_cohort_pct * 100)
                                    const cats = ex.categories_json ?? []
                                    const explained = Math.min(cats.reduce((s, c) => s + (c.claimed_pct ?? 0), 0), 25)
                                    const residual = Math.max(0, rawGapPct - explained)
                                    const col = residual < 5 ? '#34d399' : '#f87171'
                                    return (
                                        <div className="text-center">
                                            <p className="text-xs font-bold" style={{ color: col }}>
                                            {residual > 0 ? `-${residual.toFixed(1)}%` : '0%'}</p>
                                            <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('residualGap')}</p>
                                        </div>
                                    )
                                })() : (
                                    <span className="text-xs" style={{ color: 'var(--color-pl-border)' }}>—</span>
                                )}
                            </div>

                            {/* Status */}
                            <div className="flex justify-center items-center gap-1" style={{ color: stCfg.color }}>
                                {stCfg.icon}
                                <span className="text-xs hidden xl:inline">{t(stCfg.labelKey)}</span>
                            </div>

                            {/* Arrow */}
                            <div className="flex justify-end">
                                <ChevronRight size={14} style={{ color: 'var(--color-pl-text-tertiary)' }} />
                            </div>
                        </div>
                    )
                })}
            </div> {/* end inner overflow-hidden */}
            </div> {/* end glass-card */}

            {/* Drawer */}
            {selected && (
                <ExplanationDrawer
                    flag={selected}
                    analysisId={analysisId}
                    existing={explanations.get(selected.employee_id) ?? null}
                    showNames={showNames && hasNames}
                    onClose={() => setSelected(null)}
                    onSaved={ex => {
                        setExplanations(prev => new Map(prev).set(ex.employee_id, ex))
                        setSelected(null)
                    }}
                />
            )}
        </div>
    )
}
