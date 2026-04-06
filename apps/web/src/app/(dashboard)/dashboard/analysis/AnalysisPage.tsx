'use client'

import { useState, useTransition, useCallback, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
    Play, CheckCircle2, AlertTriangle, ChevronDown,
    BarChart3, Loader2, AlertCircle, TrendingDown, TrendingUp,
    ShieldAlert, ChevronDown as ChevronDownIcon, RefreshCw, Database, Landmark,
} from 'lucide-react'
import {
    runDatasetAnalysis,
    getAnalysisForDataset,
    getRecommendedWifFactors,
} from './actions'
import type { WifRecommendation } from './actions'
import { getExplanationsForAnalysis } from './explanations/actions'
import type { AnalysisResult, DepartmentResult } from '@/lib/calculations/types'
import type { BandContext } from '@/lib/band/getBandContext'
import EmployeesTab from './EmployeesTab'
import { PayGapChartGrid } from '@/components/dashboard/PayGapChartGrid'
import BandVisualizationChart from '@/components/dashboard/BandVisualizationChart'
import ComplianceHeatmap     from '@/components/dashboard/ComplianceHeatmap'

// ============================================================
// Gap badge
// ============================================================

function GapBadge({ value, suppressed = false }: { value: number | null; suppressed?: boolean }) {
    const t = useTranslations('analysis')
    if (suppressed || value === null) {
        return <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('anonymised')}</span>
    }
    const pct = value * 100
    const color = Math.abs(pct) >= 5 ? 'var(--color-pl-red)'
        : 'var(--color-pl-green)'
    const Icon = pct >= 0 ? TrendingUp : TrendingDown
    return (
        <span className="flex items-center gap-1 text-sm font-bold" style={{ color }}>
            <Icon size={14} />
            {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
        </span>
    )
}

// ============================================================
// Department accordion row
// ============================================================

function DeptRow({ dept }: { dept: DepartmentResult }) {
    const [open, setOpen] = useState(false)
    const t = useTranslations('analysis')
    const adjGap = dept.gap.adjusted_median ?? dept.gap.unadjusted_median

    return (
        <div className="border-b last:border-b-0" style={{ borderColor: 'var(--color-pl-border)' }}>
            <button
                onClick={() => !dept.suppressed && setOpen(v => !v)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left transition-colors"
                style={{ cursor: dept.suppressed ? 'default' : 'pointer' }}
                onMouseEnter={e => { if (!dept.suppressed) (e.currentTarget as HTMLElement).style.background = 'var(--theme-pl-action-ghost)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                        background: dept.suppressed ? 'var(--color-pl-text-tertiary)'
                            : Math.abs(adjGap * 100) >= 5 ? 'var(--color-pl-red)'
                            : 'var(--color-pl-green)'
                    }} />
                    <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {dept.department}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('employeeCount', { count: dept.employee_count })}
                            {dept.suppressed ? t('tooFewDataInline') : ` · ♀ ${dept.gap.female_count} ♂ ${dept.gap.male_count}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <GapBadge value={adjGap} suppressed={dept.suppressed} />
                    {!dept.suppressed && (
                        <ChevronDown size={16} style={{
                            color: 'var(--color-pl-text-tertiary)',
                            transform: open ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s',
                        }} />
                    )}
                </div>
            </button>

            {open && !dept.suppressed && (
                <div className="px-5 pb-4 grid grid-cols-2 gap-3">
                    {[
                        { label: t('unadjustedMedian'), value: dept.gap.unadjusted_median },
                        { label: t('adjustedMedian'), value: dept.gap.adjusted_median },
                        { label: t('unadjustedMean'), value: dept.gap.unadjusted_mean },
                        { label: t('adjustedMean'), value: dept.gap.adjusted_mean },
                    ].map(({ label, value }) => (
                        <div key={label} className="p-3 rounded-lg"
                            style={{ background: 'var(--theme-pl-action-ghost)', border: '1px solid var(--color-pl-border)' }}>
                            <p className="text-xs mb-1.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{label}</p>
                            <GapBadge value={value} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================================
// Types
// ============================================================

type Dataset = {
    id: string
    name: string
    reporting_year: number
    employee_count: number | null
    created_at: string
}

type AnalysisData = {
    id: string
    name: string
    created_at: string
    results: AnalysisResult
}

type Explanation = {
    id?: string
    employee_id: string
    category: string
    explanation: string
    max_justifiable_pct: number
    status: string
    created_at?: string
    categories_json?: Array<{ key: string; comment: string }>
    action_plan?: string
}

// ============================================================
// Dataset picklist — compact dropdown row
// ============================================================

function DatasetPicker({
    datasets,
    selectedId,
    onChange,
}: {
    datasets:   Dataset[]
    selectedId: string
    onChange:   (id: string) => void
}) {
    const t = useTranslations('analysis')
    if (datasets.length === 0) return null

    return (
        <div className="relative flex-shrink-0" style={{ maxWidth: 280 }}>
            <select
                value={selectedId}
                onChange={e => onChange(e.target.value)}
                className="w-full appearance-none text-xs py-1.5 pl-3 pr-8 rounded-lg cursor-pointer"
                style={{
                    background:    'var(--theme-pl-action-hover)',
                    border:        '1px solid var(--color-pl-border)',
                    color:         'var(--color-pl-text-primary)',
                    outline:       'none',
                    overflow:      'hidden',
                    textOverflow:  'ellipsis',
                }}>
                {datasets.map(d => (
                    <option key={d.id} value={d.id}>
                        {d.name} · {d.reporting_year} · {d.employee_count ?? '?'} {t('maShort')}
                    </option>
                ))}
            </select>
            <ChevronDownIcon size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-pl-text-tertiary)' }} />
        </div>
    )
}


// ============================================================
// WIF factor config (module-level to avoid re-allocation per render)
// ============================================================

const ALL_WIF = ['job_grade', 'employment_type', 'department', 'location'] as const
const WIF_LABEL_KEYS: Record<string, string> = {
    job_grade:       'wifGrade',
    employment_type: 'wifEmploymentType',
    department:      'wifDepartment',
    location:        'wifLocation',
}

// ============================================================
// Main analysis page (clean top-bar layout)
// ============================================================

export default function AnalysisPageClient({
    datasets,
    isAdmin,
    bandContext,
}: {
    datasets:    Dataset[]
    isAdmin:     boolean
    bandContext?: BandContext
}) {
    const t = useTranslations('analysis')
    const [selectedId, setSelectedId]             = useState(datasets[0]?.id ?? '')
    const [analysis, setAnalysis]                 = useState<AnalysisData | null>(null)
    const [existingExplanations, setExplanations]  = useState<Explanation[]>([])
    const [loadingAnalysis, setLoadingAnalysis]   = useState(true)   // true = loading on mount
    const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'bands'>('overview')
    const [runPending, startRunTransition]        = useTransition()
    const [runError, setRunError]                 = useState('')
    const [showRerunConfirm, setShowRerunConfirm] = useState(false)
    const [wifStats, setWifStats]                 = useState<WifRecommendation['stats']>({})
    const rerunRef = useRef<HTMLDivElement>(null)

    // Track 2 — WIF Factor selection (default: all 4)
    const [selectedWif, setSelectedWif] = useState<string[]>([...ALL_WIF])
    function toggleWif(factor: string) {
        if (factor === 'job_grade') return  // mandatory — cannot deselect
        setSelectedWif(prev =>
            prev.includes(factor)
                ? prev.length > 1 ? prev.filter(f => f !== factor) : prev  // always keep ≥1
                : [...prev, factor]
        )
    }

    const loadForDataset = useCallback(async (datasetId: string, resetWif = true) => {
        setLoadingAnalysis(true)
        setAnalysis(null)
        setExplanations([])
        setActiveTab('overview')

        if (resetWif) {
            // On dataset switch: load analysis + auto-recommend WIF in parallel
            const [data, wifRec] = await Promise.all([
                getAnalysisForDataset(datasetId) as Promise<AnalysisData | null>,
                getRecommendedWifFactors(datasetId),
            ])
            setWifStats(wifRec.stats)
            setSelectedWif(wifRec.recommended)

            // Auto-rerun if existing analysis used different WIF than recommended —
            // replaces the old result so user sees the correct view on first load.
            const existingWif = data?.results?.wif_factors_used
            const recSorted   = [...wifRec.recommended].sort().join(',')
            const existSorted = existingWif ? [...existingWif].sort().join(',') : null

            if (data && existSorted !== null && existSorted !== recSorted) {
                const ds   = datasets.find(d => d.id === datasetId)
                const name = ds?.name ?? t('analysisNameFallback', { year: ds?.reporting_year ?? new Date().getFullYear() })
                const result = await runDatasetAnalysis(datasetId, name, 'replace', data.id, wifRec.recommended)
                if (!result.error) {
                    const newData = await getAnalysisForDataset(datasetId) as AnalysisData | null
                    setAnalysis(newData)
                    if (newData?.id) {
                        const expl = await getExplanationsForAnalysis(newData.id) as Explanation[]
                        setExplanations(expl)
                    }
                    setLoadingAnalysis(false)
                    return
                }
                // On auto-run error: fall through and show original data with warning
            }

            setAnalysis(data)
            if (data?.id) {
                const expl = await getExplanationsForAnalysis(data.id) as Explanation[]
                setExplanations(expl)
            }
        } else {
            // After a manual re-run: reload results only, keep user's WIF selection intact
            const data = await getAnalysisForDataset(datasetId) as AnalysisData | null
            setAnalysis(data)
            if (data?.id) {
                const expl = await getExplanationsForAnalysis(data.id) as Explanation[]
                setExplanations(expl)
            }
        }

        setLoadingAnalysis(false)
    }, [datasets])

    // Auto-load the first (selected) dataset's latest analysis on mount
    useEffect(() => {
        if (selectedId) loadForDataset(selectedId)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function handleSelectDataset(id: string) {
        setSelectedId(id)
        loadForDataset(id)
    }

    function handleRerun() {
        if (!selectedId) return
        const ds  = datasets.find(d => d.id === selectedId)
        // Name = user-provided dataset name (e.g. "PayData 2027") — no date suffix since
        // analyses are already distinguished by created_at in the UI.
        const name = ds?.name ?? t('analysisNameFallback', { year: ds?.reporting_year ?? new Date().getFullYear() })
        setRunError('')
        setShowRerunConfirm(false)
        startRunTransition(async () => {
            const result = await runDatasetAnalysis(selectedId, name, 'archive', undefined, selectedWif)
            if (result.error) { setRunError(result.error); return }
            await loadForDataset(selectedId, false)  // keep user's WIF selection
        })
    }

    function handleReplace() {
        if (!selectedId || !analysis) return
        setRunError('')
        setShowRerunConfirm(false)
        startRunTransition(async () => {
            const result = await runDatasetAnalysis(selectedId, analysis.name, 'replace', analysis.id, selectedWif)
            if (result.error) { setRunError(result.error); return }
            await loadForDataset(selectedId, false)  // keep user's WIF selection
        })
    }

    const results    = analysis?.results ?? null
    const selectedDs = datasets.find(d => d.id === selectedId)

    if (!datasets.length) {
        return (
            <div className="space-y-6">
                <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('title')}</h1>
                <div className="glass-card p-10 text-center" style={{ borderStyle: 'dashed' }}>
                    <BarChart3 size={32} className="mx-auto mb-4" style={{ color: 'var(--color-pl-text-tertiary)' }} />
                    <p className="text-sm mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('noDatasets')}
                    </p>
                    <a href="/dashboard/import" className="btn-primary">{t('importDataBtn')}</a>
                </div>
            </div>
        )
    }

    return (
        <>
        <div className="space-y-5">

            {/* ── Top bar: title + dataset picker + run ── */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('title')}</h1>
                    {analysis && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {selectedDs?.name ?? analysis.name} · {selectedDs?.reporting_year ?? ''} · {new Date(analysis.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    )}
                </div>

                {/* Status badge */}
                {results && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${results.overall.exceeds_5pct ? 'status-red' : 'status-green'}`}>
                        {results.overall.exceeds_5pct
                            ? <><ShieldAlert size={13} /> {t('exceeds5pct')}</>
                            : <><CheckCircle2 size={13} /> {t('within5pct')}</>
                        }
                    </div>
                )}
                {/* Read-only badge for viewers */}
                {!isAdmin && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--color-pl-amber)', border: '1px solid rgba(245,158,11,0.25)' }}>
                        {t('readOnly')}
                    </span>
                )}
            </div>

            {/* ── Control bar: picker + refresh + re-run ── */}
            <div className="glass-card p-4 flex items-center gap-3 flex-wrap">

                {/* Datensatz label — matches Dashboard style */}
                <div className="flex items-center gap-2 flex-shrink-0" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    <Database size={14} />
                    <span className="text-xs font-medium" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('dataset')}</span>
                </div>
                <div className="w-px self-stretch flex-shrink-0" style={{ background: 'var(--color-pl-border)' }} />

                <DatasetPicker
                    datasets={datasets}
                    selectedId={selectedId}
                    onChange={handleSelectDataset}
                />

                {/* Refresh — separated by a thin divider */}
                <div className="w-px self-stretch flex-shrink-0" style={{ background: 'var(--color-pl-border)' }} />
                <button onClick={() => loadForDataset(selectedId)}
                    disabled={loadingAnalysis}
                    className="p-1.5 rounded-lg flex-shrink-0"
                    style={{ color: 'var(--color-pl-text-tertiary)' }}
                    title={t('refresh')}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-pl-action-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <RefreshCw size={15} className={loadingAnalysis ? 'animate-spin' : ''} />
                </button>

                <div className="flex-1" />

                {/* Re-run button — admin only */}
                {isAdmin && (
                <div className="relative flex-shrink-0" ref={rerunRef}>
                    <button
                        onClick={() => setShowRerunConfirm(v => !v)}
                        disabled={runPending || !selectedId}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all"
                        style={{
                            background:  'var(--theme-pl-action-hover)',
                            border:      '1px solid var(--color-pl-border)',
                            color:       'var(--color-pl-text-secondary)',
                            opacity:     runPending ? 0.6 : 1,
                        }}
                        title={analysis ? t('rerunTooltipExisting') : t('startAnalysis')}>
                        {runPending
                            ? <><Loader2 size={13} className="animate-spin" /> {t('running')}</>
                            : <><Play size={13} /> {analysis ? t('rerunAnalysis') : t('startAnalysis')}</>
                        }
                    </button>

                    {/* Confirmation popover */}
                    {showRerunConfirm && !runPending && (
                        <div className="absolute right-0 top-full mt-2 z-30 p-4 rounded-xl shadow-2xl"
                            style={{
                                background: 'var(--color-pl-surface)',
                                border:     '1px solid var(--color-pl-border)',
                                width: '17rem',
                            }}>
                            {analysis ? (
                                <>
                                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>
                                        {t('rerunConfirmTitle')}
                                    </p>
                                    <p className="text-xs mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        {t('rerunConfirmDesc')}
                                    </p>

                                    {/* Option 1 — Archive */}
                                    <button
                                        onClick={handleRerun}
                                        className="w-full text-left px-3 py-2.5 rounded-lg mb-2 transition-colors"
                                        style={{
                                            background: 'var(--theme-pl-action-ghost)',
                                            border: '1px solid var(--color-pl-border)',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-pl-action-hover)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--theme-pl-action-ghost)')}
                                    >
                                        <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                                            📂 {t('archiveAndRerun')}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            {t('archiveAndRerunDesc')}
                                        </p>
                                    </button>

                                    {/* Option 2 — Replace */}
                                    <button
                                        onClick={handleReplace}
                                        className="w-full text-left px-3 py-2.5 rounded-lg mb-3 transition-colors"
                                        style={{
                                            background: 'var(--theme-pl-action-ghost)',
                                            border: '1px solid var(--color-pl-border)',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-pl-action-hover)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--theme-pl-action-ghost)')}
                                    >
                                        <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                                            ♻️ {t('replaceAnalysis')}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            {t('replaceAnalysisDesc')}
                                        </p>
                                    </button>

                                    <button onClick={() => setShowRerunConfirm(false)}
                                        className="w-full btn-ghost text-xs py-1.5">{t('cancel')}</button>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>
                                        {t('startConfirmTitle')}
                                    </p>
                                    <p className="text-xs mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        {t('startConfirmDesc')}
                                    </p>
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowRerunConfirm(false)}
                                            className="flex-1 btn-ghost text-xs py-1.5">{t('cancel')}</button>
                                        <button onClick={handleRerun}
                                            className="flex-1 btn-primary text-xs py-1.5">
                                            {t('start')}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
                )}
            </div>

            {runError && (
                <div className="flex items-center gap-2 text-xs p-3 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                    <AlertCircle size={13} /> {runError}
                </div>
            )}

            {/* ── Loading ── */}
            {loadingAnalysis && (
                <div className="glass-card p-8 flex items-center justify-center gap-3">
                    <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-pl-brand)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('loadingResults')}</span>
                </div>
            )}

            {/* ── Empty state: selected but never analysed ── */}
            {!loadingAnalysis && !results && selectedId && (
                <div className="glass-card p-10 text-center" style={{ borderStyle: 'dashed' }}>
                    <BarChart3 size={32} className="mx-auto mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }} />
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('noAnalysisFor', { name: selectedDs?.name ?? '' })}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('clickStartAnalysis')}
                    </p>
                </div>
            )}

            {/* ── WIF Factor Selector ── admin only */}
            {selectedId && isAdmin && (
                <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                {t('wifTitle')}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {t('wifDescription')}
                            </p>
                        </div>
                        {selectedWif.length < ALL_WIF.length && (
                            <span className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--color-pl-amber)', border: '1px solid rgba(245,158,11,0.3)' }}>
                                {t('wifRestricted')}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {ALL_WIF.map(factor => {
                            const active = selectedWif.includes(factor)
                            const isMandatory = factor === 'job_grade'
                            const stat = wifStats[factor]
                            const tooltip = isMandatory
                                ? t('wifMandatoryTooltip')
                                : stat?.reason ?? ''
                            return (
                                <button key={factor} onClick={() => !isMandatory && toggleWif(factor)}
                                    title={tooltip}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                    style={{
                                        background: active ? 'rgba(59,130,246,0.2)' : 'var(--theme-pl-action-ghost)',
                                        border:     `1px solid ${active ? 'rgba(59,130,246,0.5)' : 'var(--color-pl-border)'}`,
                                        color:      active ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)',
                                        cursor:     isMandatory ? 'not-allowed' : 'pointer',
                                        opacity:    isMandatory ? 1 : undefined,
                                    }}>
                                    {active ? '✓ ' : ''}{t(WIF_LABEL_KEYS[factor])}
                                    {isMandatory && <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.7 }}>●</span>}
                                    {stat && !isMandatory && !stat.included && active === false && (
                                        <span style={{ fontSize: 9, marginLeft: 4, color: 'var(--color-pl-amber)' }}>⚠</span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                    {selectedWif.length < 2 && (
                        <p className="text-xs mt-2" style={{ color: 'var(--color-pl-amber)' }}>
                            {t('wifMinWarning')}
                        </p>
                    )}
                </div>
            )}

            {/* ── Tab bar ── */}
            {results && (
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--theme-pl-action-ghost)', border: '1px solid var(--color-pl-border)', width: 'fit-content' }}>
                    {(
                        isAdmin
                            ? [
                                { id: 'overview',  label: t('overviewTabLabel') },
                                { id: 'employees', label: t('employeesTabLabel', { count: results.individual_flags?.length ?? 0 }) },
                                ...(bandContext?.has_bands ? [{ id: 'bands', label: t('bandsTabLabel') }] : []),
                              ]
                            : [
                                { id: 'overview',  label: t('overviewTabLabel') },
                                ...(bandContext?.has_bands ? [{ id: 'bands', label: t('bandsTabLabel') }] : []),
                              ]
                    ).map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as 'overview' | 'employees' | 'bands')}
                            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                                background: activeTab === tab.id ? 'var(--color-pl-brand)' : 'transparent',
                                color: activeTab === tab.id ? '#fff' : 'var(--color-pl-text-tertiary)',
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Overview tab ── */}
            {results && activeTab === 'overview' && (
                <>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="glass-card p-5">
                            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {t('overviewUnadjustedTitle')}
                            </p>
                            <GapBadge value={results.overall.unadjusted_median} />
                            <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-secondary)' }}>
                                <span>♀ {(results.overall.female_median_salary ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/h</span>
                                <span>♂ {(results.overall.male_median_salary ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/h</span>
                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>♀ {results.overall.female_count} {t('persons')}</span>
                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>♂ {results.overall.male_count} {t('persons')}</span>
                            </div>
                        </div>
                        <div className="glass-card p-5">
                            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {t('overviewAdjustedTitle')}
                            </p>
                            <GapBadge value={results.overall.adjusted_median} />
                            <div className="mt-3 pt-3 border-t text-xs space-y-1" style={{ borderColor: 'var(--color-pl-border)' }}>
                                <p style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    {t('wifFactorsLabel')}: <span style={{ color: 'var(--color-pl-text-secondary)' }}>{results.wif_factors_used.join(', ')}</span>
                                </p>
                                {results.hours_coverage_pct < 100 && (
                                    <p style={{ color: 'var(--color-pl-amber)' }}>{t('hoursWarning', { pct: results.hours_coverage_pct })}</p>
                                )}
                                {/* Bug 1 fix: show mismatch warning when UI selection differs from stored results */
                                (() => {
                                    const used = [...results.wif_factors_used].sort().join(',')
                                    const sel  = [...selectedWif].sort().join(',')
                                    if (used === sel) return null
                                    return (
                                        <p className="mt-1 flex items-start gap-1" style={{ color: 'var(--color-pl-amber)' }}>
                                            {t('wifChangedWarning')}
                                        </p>
                                    )
                                })()}
                            </div>
                        </div>
                        {/* Nach Begründungen — only shown when explanations exist */}
                        {(() => {
                            const flags = results.individual_flags ?? []
                            if (flags.length === 0 || existingExplanations.length === 0) {
                                return (
                                    <div className="glass-card p-5" style={{ opacity: 0.45 }}>
                                        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(52,211,153,0.6)' }}>
                                            {t('afterExplanations')}
                                        </p>
                                        <p className="text-2xl font-bold" style={{ color: 'var(--color-pl-text-tertiary)' }}>—</p>
                                        <p className="text-xs mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}>
                                            {t('noExplanations')}
                                        </p>
                                    </div>
                                )
                            }
                            type CatEntry = { claimed_pct?: number }
                            const explMap = new Map(existingExplanations.map(e => [
                                e.employee_id,
                                ((e as unknown as { categories_json?: CatEntry[] }).categories_json ?? []),
                            ]))
                            const flaggedNonOk = flags.filter(f =>
                                Math.abs(f.gap_vs_cohort_pct) >= 0.05
                            )
                            // Proportional reduction of WIF-adjusted median:
                            // residualAdjusted = adjusted_median * (sumResiduals / sumRaw)
                            let sumRaw = 0, sumResiduals = 0
                            for (const f of flaggedNonOk) {
                                const rawGapPct = Math.abs(f.gap_vs_cohort_pct * 100)
                                const cats = explMap.get(f.employee_id) ?? []
                                const explained = Math.min(cats.reduce((s, c) => s + (c.claimed_pct ?? 0), 0), 25)
                                sumRaw += rawGapPct
                                sumResiduals += Math.max(0, rawGapPct - explained)
                            }
                            const adjustedMedianPct = (results.overall.adjusted_median ?? 0) * 100
                            const medianResidual = sumRaw > 0
                                ? adjustedMedianPct * (sumResiduals / sumRaw)
                                : adjustedMedianPct
                            return (() => {
                                const residualAbs = Math.abs(medianResidual)
                                const cardColor = residualAbs >= 5 ? 'var(--color-pl-red)' : 'var(--color-pl-green)'
                                return (
                                <div className="glass-card p-5" style={{ border: `1px solid ${cardColor}` }}>
                                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: cardColor }}>
                                        {t('afterExplanations')}
                                    </p>
                                    <GapBadge value={medianResidual / 100} />
                                    <div className="mt-3 pt-3 border-t text-xs space-y-1" style={{ borderColor: cardColor }}>
                                        <p style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            {t('personsExplained', { explained: existingExplanations.length, total: flaggedNonOk.length })}
                                        </p>
                                        <p style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('medianResidual')}</p>
                                    </div>
                                </div>
                                )
                            })()
                        })()}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-card p-4 flex items-center justify-between">
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('unadjustedMean')}</p>
                            <GapBadge value={results.overall.unadjusted_mean} />
                        </div>
                        <div className="glass-card p-4 flex items-center justify-between">
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('adjustedMean')}</p>
                            <GapBadge value={results.overall.adjusted_mean} />
                        </div>
                    </div>

                    {results.overall.exceeds_5pct && (
                        <div className="glass-card flex items-start gap-3 p-4 rounded-xl"
                            style={{ border: '1px solid var(--color-pl-red)' }}>
                            <AlertTriangle size={18} style={{ color: 'var(--color-pl-red)', flexShrink: 0, marginTop: 1 }} />
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-red)' }}>
                                    {t('jointAssessmentRequired')}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    {results.departments_exceeding_5pct.length > 0
                                        ? t('affectedAreas', { areas: results.departments_exceeding_5pct.join(', ') })
                                        : t('overallExceedsThreshold')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── 2×2 + 1 chart grid (shared with Dashboard) ── */}
                    <PayGapChartGrid results={results} />

                </>
            )}

            {/* ── Employees tab ── */}
            {isAdmin && results && activeTab === 'employees' && analysis?.id && (
                <EmployeesTab
                    flags={results.individual_flags ?? []}
                    analysisId={analysis.id}
                    existingExplanations={existingExplanations}
                    adjustedMedian={results.overall.adjusted_median ?? 0}
                    wifFactors={selectedWif}
                />
            )}

            {/* ── Band tab (EU Art. 9) ── */}
            {activeTab === 'bands' && bandContext?.has_bands && (
                <div className="space-y-5">
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Landmark size={16} style={{ color: 'var(--color-pl-brand-light)' }} />
                            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                {t('internalBands')}
                            </h2>
                            <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                · {bandContext.grades[0]?.band_name}
                            </span>
                        </div>
                        <BandVisualizationChart grades={bandContext.grades} />
                    </div>

                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Landmark size={16} style={{ color: 'var(--color-pl-brand-light)' }} />
                            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                {t('euArt9Compliance')}
                            </h2>
                        </div>
                        <ComplianceHeatmap grades={bandContext.grades} />
                    </div>
                </div>
            )}
        </div>
        </>
    )
}
