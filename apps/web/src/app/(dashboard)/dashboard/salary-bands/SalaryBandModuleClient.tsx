'use client'

import { useState, useTransition, useCallback } from 'react'
import {
    Loader2, AlertTriangle, CheckCircle2, RefreshCw,
    ChevronDown, ChevronRight, Landmark, TrendingUp,
    TrendingDown, Info, Plus, Trash2, BarChart2, Settings,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { BandContext, BandGradeSummary, DatasetOption } from '@/lib/band/getBandContext'
import {
    computeInternalBands,
    createBandFromDetectedGrades,
    upsertMarketBenchmark,
} from '@/lib/band/getBandContext'
import BandVisualizationChart  from '@/components/dashboard/BandVisualizationChart'
import ComplianceHeatmap       from '@/components/dashboard/ComplianceHeatmap'

// ============================================================
// Helpers
// ============================================================

const eur = (v: number | null) =>
    v == null ? '—' : v.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €'

function Tip({ text }: { text: string }) {
    const [show, setShow] = useState(false)
    return (
        <span className="relative inline-flex items-center ml-1 cursor-help">
            <Info size={11} style={{ color: 'var(--color-pl-text-tertiary)' }}
                onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
            {show && (
                <span className="absolute z-50 bottom-5 left-0 px-2.5 py-1.5 text-xs rounded-lg shadow-lg w-60"
                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-secondary)', lineHeight: 1.5 }}>
                    {text}
                </span>
            )}
        </span>
    )
}

// ============================================================
// Market Benchmark form (per grade)
// ============================================================
function MarketBenchmarkForm({ grade, onSaved, t }: { grade: BandGradeSummary; onSaved: () => void; t: (key: string, values?: Record<string, any>) => string }) {
    const [open, setOpen] = useState(false)
    const [source, setSource] = useState(grade.market_source ?? '')
    const [year,   setYear]   = useState(grade.market_year  ?? new Date().getFullYear())
    const [p25,    setP25]    = useState<string>(grade.market_p25?.toString() ?? '')
    const [p50,    setP50]    = useState<string>(grade.market_p50?.toString() ?? '')
    const [p75,    setP75]    = useState<string>(grade.market_p75?.toString() ?? '')
    const [saving, setSaving] = useState(false)
    const [ok,     setOk]     = useState(false)

    const save = async () => {
        setSaving(true)
        const res = await upsertMarketBenchmark(grade.id, {
            source_name: source,
            ref_year:    year,
            p25_salary:  p25 ? parseFloat(p25) : null,
            p50_salary:  p50 ? parseFloat(p50) : null,
            p75_salary:  p75 ? parseFloat(p75) : null,
        })
        setSaving(false)
        if (res.success) { setOk(true); setTimeout(() => { setOk(false); setOpen(false); onSaved() }, 1200) }
    }

    const marketRatio = grade.market_p50 && grade.internal_median_base
        ? Math.round(grade.internal_median_base / grade.market_p50 * 100) : null

    return (
        <div className="mt-2">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: 'var(--color-pl-text-tertiary)' }}
            >
                {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {t('marketData')}
                {grade.market_p50 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-semibold" style={{
                        background: marketRatio != null && marketRatio < 90 ? 'rgba(239,68,68,0.1)' : marketRatio != null && marketRatio > 110 ? 'rgba(139,92,246,0.1)' : 'rgba(52,211,153,0.1)',
                        color:      marketRatio != null && marketRatio < 90 ? 'var(--color-pl-red)'  : marketRatio != null && marketRatio > 110 ? '#8b5cf6'              : 'var(--color-pl-green)',
                    }}>
                        {t('marketRatio', { ratio: marketRatio })}
                    </span>
                )}
            </button>

            {open && (
                <div className="mt-2 p-3 rounded-lg" style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {t('sourceLabel')}
                            </label>
                            <input
                                className="w-full px-2 py-1 text-xs rounded"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                                value={source}
                                onChange={e => setSource(e.target.value)}
                                placeholder={t('sourcePlaceholder')}
                            />
                        </div>
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('yearLabel')}</label>
                            <input type="number" min={2020} max={2030}
                                className="w-full px-2 py-1 text-xs rounded"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                                value={year}
                                onChange={e => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {[['P25', p25, setP25, t('marketP25Label')], ['P50 (Median)', p50, setP50, t('marketP50Label')], ['P75', p75, setP75, t('marketP75Label')]].map(([label, val, set, displayLabel]) => (
                            <div key={label as string}>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    {displayLabel as string}
                                </label>
                                <input type="number" min={0} step={500}
                                    className="w-full px-2 py-1 text-xs rounded"
                                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                                    value={val as string}
                                    onChange={e => (set as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                                    placeholder={t('marketPlaceholder')}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        disabled={saving || !source || !p50}
                        onClick={save}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: 'var(--color-pl-brand)', color: '#fff', opacity: saving || !source || !p50 ? 0.6 : 1 }}
                    >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : ok ? <CheckCircle2 size={12} /> : null}
                        {ok ? t('saved') : t('saveButton')}
                    </button>
                </div>
            )}
        </div>
    )
}

// ============================================================
// Dataset picker — shown when org has multiple datasets
// ============================================================
function DatasetPicker({
    datasets,
    selectedId,
    onChange,
    datasetLabel,
    empLabel,
}: {
    datasets:   DatasetOption[]
    selectedId: string | null
    onChange:   (id: string) => void
    datasetLabel: string
    empLabel: string
}) {
    if (datasets.length <= 1) return null
    return (
        <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{datasetLabel}</span>
            <select
                className="text-xs px-2 py-1 rounded-lg"
                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                value={selectedId ?? ''}
                onChange={e => onChange(e.target.value)}
            >
                {datasets.map(d => (
                    <option key={d.id} value={d.id}>
                        {d.name}{d.reporting_year ? ` (${d.reporting_year})` : ''} — {d.employee_count} {empLabel}
                    </option>
                ))}
            </select>
        </div>
    )
}

function OnboardingCard({
    detectedGrades,
    namingScheme,
    datasets,
    selectedDatasetId,
    onDatasetChange,
    onCreated,
    t,
}: {
    detectedGrades:    string[]
    namingScheme:      string | null
    datasets:          DatasetOption[]
    selectedDatasetId: string | null
    onDatasetChange:   (id: string) => void
    onCreated:         () => void
    t:                 (key: string, values?: Record<string, any>) => string
}) {
    const [name,      setName]      = useState(t('defaultBandName', { year: new Date().getFullYear() }))
    const [isPending, startTransition] = useTransition()
    const [error,     setError]     = useState<string | null>(null)

    const handleCreate = () => {
        setError(null)
        startTransition(async () => {
            const res = await createBandFromDetectedGrades(name, detectedGrades)
            if (!res.success) setError(res.error ?? t('createError'))
            else onCreated()
        })
    }

    return (
        <div className="glass-card p-6">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                    <Landmark size={22} style={{ color: 'var(--color-pl-brand-light)' }} />
                </div>
                <div className="flex-1">
                    <h2 className="text-base font-bold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('gradesDetected')}
                    </h2>
                    <p className="text-sm mb-3" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {detectedGrades.length > 0 ? (
                            <>
                                <strong>{t('gradesFoundPrefix', { count: detectedGrades.length })}</strong> {t('gradesFoundSuffix')}
                                <span className="ml-1 font-semibold" style={{ color: 'var(--color-pl-brand-light)' }}>
                                    {detectedGrades.join(' · ')}
                                </span>
                                {namingScheme && <span className="ml-1 text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>· {t('schemaLabel', { scheme: namingScheme })}</span>}
                            </>
                        ) : (
                            t('noGradesFound')
                        )}
                    </p>

                    {detectedGrades.length > 0 && (
                        <>
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <DatasetPicker datasets={datasets} selectedId={selectedDatasetId} onChange={onDatasetChange} datasetLabel={t('dataset')} empLabel={t('employeesShort')} />
                                <input
                                    className="flex-1 max-w-xs px-3 py-1.5 text-sm rounded-lg"
                                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder={t('bandNamePlaceholder')}
                                />
                                <button
                                    disabled={isPending || !name.trim()}
                                    onClick={handleCreate}
                                    className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                                    style={{ background: 'var(--color-pl-brand)', color: '#fff', opacity: isPending || !name.trim() ? 0.7 : 1 }}
                                >
                                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <BarChart2 size={14} />}
                                    {t('generateBands')}
                                </button>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {t('generateDesc')}
                            </p>
                            {error && <p className="text-xs mt-2" style={{ color: 'var(--color-pl-red)' }}>{error}</p>}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// ============================================================
// Main Band Module Client
// ============================================================
type Tab = 'overview' | 'heatmap' | 'market'

export default function SalaryBandModuleClient({
    initialContext,
}: {
    initialContext: BandContext
}) {
    const t = useTranslations('salaryBands')
    const [ctx,    setCtx]    = useState<BandContext>(initialContext)
    const [tab,    setTab]    = useState<Tab>('overview')
    const [isPending, startTransition] = useTransition()
    const [refreshKey, setRefreshKey]  = useState(0)

    // Dataset selection — default to active_dataset_id from server context
    const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(
        initialContext.active_dataset_id ?? initialContext.datasets[0]?.id ?? null
    )

    const reload = useCallback(() => {
        setRefreshKey(k => k + 1)
        window.location.reload()
    }, [])

    const handleDatasetChange = (id: string) => {
        setSelectedDatasetId(id)
        // Trigger recompute with new dataset and reload
        const bandId = ctx.grades[0]?.band_id
        if (!bandId || !ctx.has_bands) return
        startTransition(async () => {
            await computeInternalBands(bandId, id)
            window.location.reload()
        })
    }

    const handleRecompute = () => {
        if (!ctx.has_bands || ctx.grades.length === 0) return
        const bandId = ctx.grades[0]?.band_id
        if (!bandId) return
        startTransition(async () => {
            await computeInternalBands(bandId, selectedDatasetId ?? undefined)
            window.location.reload()
        })
    }

    const TABS: { key: Tab; label: string }[] = [
        { key: 'overview', label: t('tabOverview') },
        { key: 'heatmap',  label: t('tabHeatmap') },
        { key: 'market',   label: t('tabMarket') },
    ]

    // ── No bands yet ──────────────────────────────────────────
    if (!ctx.has_bands) {
        return (
            <OnboardingCard
                detectedGrades={ctx.detected_grades}
                namingScheme={ctx.naming_scheme}
                datasets={ctx.datasets}
                selectedDatasetId={selectedDatasetId}
                onDatasetChange={setSelectedDatasetId}
                onCreated={reload}
                t={t}
            />
        )
    }

    const { grades, total_non_compliant, total_grades, naming_scheme } = ctx
    const lastComputed = grades.find(g => g.computed_at)?.computed_at
    const lastComputedStr = lastComputed
        ? new Date(lastComputed).toLocaleString('de-DE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : null

    return (
        <div className="space-y-5">
            {/* ── Status bar ─────────────────────────────────── */}
            <div className="glass-card p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Landmark size={16} style={{ color: 'var(--color-pl-brand-light)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {grades[0]?.band_name}
                    </span>
                    {naming_scheme && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-text-tertiary)', border: '1px solid var(--color-pl-border)' }}>
                            {naming_scheme}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    {/* Dataset picker */}
                    <DatasetPicker
                        datasets={ctx.datasets}
                        selectedId={selectedDatasetId}
                        onChange={handleDatasetChange}
                        datasetLabel={t('dataset')}
                        empLabel={t('employeesShort')}
                    />

                    {/* Compliance badge */}
                    {total_non_compliant > 0 ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-pl-red)', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <AlertTriangle size={12} />
                            {t('nonCompliant', { count: total_non_compliant, total: total_grades })}
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                            style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--color-pl-green)', border: '1px solid rgba(52,211,153,0.25)' }}>
                            <CheckCircle2 size={12} />
                            {t('allCompliant', { total: total_grades })}
                        </span>
                    )}

                    {/* Last computed */}
                    {lastComputedStr && (
                        <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('computed', { date: lastComputedStr })}
                        </span>
                    )}

                    {/* Recompute button */}
                    <button
                        disabled={isPending}
                        onClick={handleRecompute}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-secondary)' }}
                    >
                        {isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        {t('recompute')}
                    </button>
                </div>
            </div>

            {/* ── Non-compliance alert ───────────────────────── */}
            {total_non_compliant > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle size={16} style={{ color: 'var(--color-pl-red)', flexShrink: 0 }} />
                    <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-red)' }}>
                            {t('actionNeeded')}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {grades.filter(g => g.exceeds_5pct).map(g => (
                                <span key={g.id} className="mr-3">
                                    <strong>{g.job_grade}</strong>: {g.intra_grade_gap_pct != null ? `${g.intra_grade_gap_pct > 0 ? '+' : ''}${g.intra_grade_gap_pct.toFixed(1)}%` : '?'}
                                </span>
                            ))}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('actionNeededDesc')}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Tab navigation ─────────────────────────────── */}
            <div className="flex border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
                        style={{
                            borderColor: tab === t.key ? 'var(--color-pl-brand)' : 'transparent',
                            color:       tab === t.key ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)',
                        }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Tab content ────────────────────────────────── */}
            {tab === 'overview' && (
                <div className="glass-card p-5">
                    <div className="mb-4">
                        <h2 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('internalBands')}
                        </h2>
                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('internalBandsDesc')}
                        </p>
                    </div>
                    <BandVisualizationChart grades={grades} />
                </div>
            )}

            {tab === 'heatmap' && (
                <div className="glass-card p-5">
                    <div className="mb-4">
                        <h2 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('heatmapTitle')}
                        </h2>
                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('heatmapDesc')}
                        </p>
                    </div>
                    <ComplianceHeatmap grades={grades} />
                </div>
            )}

            {tab === 'market' && (
                <div className="glass-card p-5">
                    <div className="mb-4">
                        <h2 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('marketTitle')}
                        </h2>
                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('marketDesc')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {grades.map(g => (
                            <div key={g.id} className="p-4 rounded-xl" style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{g.job_grade}</span>
                                    <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        {t('internalMedian', { value: eur(g.internal_median_base) })}
                                    </span>
                                    {g.market_p50 != null && (
                                        <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            · {t('marketP50Info', { value: eur(g.market_p50), source: g.market_source ?? '', year: g.market_year ?? '' })}
                                        </span>
                                    )}
                                </div>
                                <MarketBenchmarkForm grade={g} onSaved={reload} t={t} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
