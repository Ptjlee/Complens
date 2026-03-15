'use client'

import { useState, useTransition, useCallback, useEffect, useRef } from 'react'
import {
    Play, CheckCircle2, AlertTriangle, ChevronDown,
    BarChart3, Loader2, AlertCircle, TrendingDown, TrendingUp,
    ShieldAlert, ChevronDown as ChevronDownIcon, RefreshCw, Database,
} from 'lucide-react'
import {
    runDatasetAnalysis,
    getAnalysisForDataset,
} from './actions'
import { getExplanationsForAnalysis } from './explanations/actions'
import type { AnalysisResult, DepartmentResult } from '@/lib/calculations/types'
import EmployeesTab from './EmployeesTab'
import { PayGapChartGrid } from '@/components/dashboard/PayGapChartGrid'
import AnalysisChatbot from './AnalysisChatbot'

// ============================================================
// Gap badge
// ============================================================

function GapBadge({ value, suppressed = false }: { value: number | null; suppressed?: boolean }) {
    if (suppressed || value === null) {
        return <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>— anonymisiert</span>
    }
    const pct = value * 100
    const color = Math.abs(pct) >= 5 ? 'var(--color-pl-red)'
        : Math.abs(pct) >= 2 ? 'var(--color-pl-amber)'
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
                            : Math.abs(adjGap * 100) >= 2 ? 'var(--color-pl-amber)'
                            : 'var(--color-pl-green)'
                    }} />
                    <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {dept.department}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {dept.employee_count} Mitarbeitende
                            {dept.suppressed ? ' · Zu wenige Daten (< 5)' : ` · ♀ ${dept.gap.female_count} ♂ ${dept.gap.male_count}`}
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
                        { label: 'Unbereinigt (Median)', value: dept.gap.unadjusted_median },
                        { label: 'Bereinigt (Median)', value: dept.gap.adjusted_median },
                        { label: 'Unbereinigt (Mittelwert)', value: dept.gap.unadjusted_mean },
                        { label: 'Bereinigt (Mittelwert)', value: dept.gap.adjusted_mean },
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
                        {d.name} · {d.reporting_year} · {d.employee_count ?? '?'} MA
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
const WIF_LABELS: Record<string, string> = {
    job_grade:       'Entgeltgruppe',
    employment_type: 'Beschäftigungsart',
    department:      'Bereich / Abt.',
    location:        'Standort',
}

// ============================================================
// Main analysis page (clean top-bar layout)
// ============================================================

export default function AnalysisPageClient({
    datasets,
}: {
    datasets: Dataset[]
}) {
    const [selectedId, setSelectedId]             = useState(datasets[0]?.id ?? '')
    const [analysis, setAnalysis]                 = useState<AnalysisData | null>(null)
    const [existingExplanations, setExplanations]  = useState<Explanation[]>([])
    const [loadingAnalysis, setLoadingAnalysis]   = useState(true)   // true = loading on mount
    const [activeTab, setActiveTab]               = useState<'overview' | 'employees'>('overview')
    const [runPending, startRunTransition]        = useTransition()
    const [runError, setRunError]                 = useState('')
    const [showRerunConfirm, setShowRerunConfirm] = useState(false)
    const rerunRef = useRef<HTMLDivElement>(null)

    // Track 2 — WIF Factor selection (default: all 4)
    const [selectedWif, setSelectedWif] = useState<string[]>([...ALL_WIF])
    function toggleWif(factor: string) {
        setSelectedWif(prev =>
            prev.includes(factor)
                ? prev.length > 1 ? prev.filter(f => f !== factor) : prev  // always keep ≥1
                : [...prev, factor]
        )
    }

    const loadForDataset = useCallback(async (datasetId: string) => {
        setLoadingAnalysis(true)
        setAnalysis(null)
        setExplanations([])
        setActiveTab('overview')
        const data = await getAnalysisForDataset(datasetId) as AnalysisData | null
        setAnalysis(data)
        if (data?.id) {
            const expl = await getExplanationsForAnalysis(data.id) as Explanation[]
            setExplanations(expl)
        }
        setLoadingAnalysis(false)
    }, [])

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
        const name = `${ds?.name ?? 'Datensatz'} · Analyse (${new Date().toLocaleDateString('de-DE')})`
        setRunError('')
        setShowRerunConfirm(false)
        startRunTransition(async () => {
            const result = await runDatasetAnalysis(selectedId, name, 'archive', undefined, selectedWif)
            if (result.error) { setRunError(result.error); return }
            await loadForDataset(selectedId)
        })
    }

    function handleReplace() {
        if (!selectedId || !analysis) return
        setRunError('')
        setShowRerunConfirm(false)
        startRunTransition(async () => {
            const result = await runDatasetAnalysis(selectedId, analysis.name, 'replace', analysis.id, selectedWif)
            if (result.error) { setRunError(result.error); return }
            await loadForDataset(selectedId)
        })
    }

    const results    = analysis?.results ?? null
    const selectedDs = datasets.find(d => d.id === selectedId)

    if (!datasets.length) {
        return (
            <div className="space-y-6">
                <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>Analyse</h1>
                <div className="glass-card p-10 text-center" style={{ borderStyle: 'dashed' }}>
                    <BarChart3 size={32} className="mx-auto mb-4" style={{ color: 'var(--color-pl-text-tertiary)' }} />
                    <p className="text-sm mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        Importieren Sie zuerst einen Datensatz, bevor Sie eine Analyse starten.
                    </p>
                    <a href="/dashboard/import" className="btn-primary">Daten importieren</a>
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
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>Analyse</h1>
                    {analysis && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {analysis.name} · {new Date(analysis.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    )}
                </div>

                {/* Status badge */}
                {results && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${results.overall.exceeds_5pct ? 'status-red' : 'status-green'}`}>
                        {results.overall.exceeds_5pct
                            ? <><ShieldAlert size={13} /> 5%-Schwelle überschritten</>
                            : <><CheckCircle2 size={13} /> Unter 5%-Schwelle</>
                        }
                    </div>
                )}
            </div>

            {/* ── Control bar: picker + refresh + re-run ── */}
            <div className="glass-card p-4 flex items-center gap-3 flex-wrap">

                {/* Datensatz label — matches Dashboard style */}
                <div className="flex items-center gap-2 flex-shrink-0" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    <Database size={14} />
                    <span className="text-xs font-medium" style={{ color: 'var(--color-pl-text-secondary)' }}>Datensatz</span>
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
                    title="Aktualisieren"
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-pl-action-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <RefreshCw size={15} className={loadingAnalysis ? 'animate-spin' : ''} />
                </button>

                <div className="flex-1" />

                {/* Re-run button (with confirmation popover) */}
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
                        title={analysis ? 'Neue Analyse berechnen (erstellt eine neue Version)' : 'Analyse starten'}>
                        {runPending
                            ? <><Loader2 size={13} className="animate-spin" /> Läuft…</>
                            : <><Play size={13} /> {analysis ? 'Neu analysieren' : 'Analyse starten'}</>
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
                                        Analyse neu berechnen?
                                    </p>
                                    <p className="text-xs mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        Wählen Sie, wie mit der bisherigen Analyse verfahren werden soll.
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
                                            📂 Neu berechnen &amp; Archivieren
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            Neue Version erstellen. Bisherige Analyse bleibt im Bericht-Archiv.
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
                                            ♻️ Ersetzen
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            Aktuelle Analyse überschreiben. Kein neuer Archiv-Eintrag.
                                        </p>
                                    </button>

                                    <button onClick={() => setShowRerunConfirm(false)}
                                        className="w-full btn-ghost text-xs py-1.5">Abbrechen</button>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>
                                        Analyse starten?
                                    </p>
                                    <p className="text-xs mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        Berechnet die Lohngefälleanalyse für den gewählten Datensatz.
                                    </p>
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowRerunConfirm(false)}
                                            className="flex-1 btn-ghost text-xs py-1.5">Abbrechen</button>
                                        <button onClick={handleRerun}
                                            className="flex-1 btn-primary text-xs py-1.5">
                                            Starten
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
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
                    <span className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>Lade Analyseergebnisse…</span>
                </div>
            )}

            {/* ── Empty state: selected but never analysed ── */}
            {!loadingAnalysis && !results && selectedId && (
                <div className="glass-card p-10 text-center" style={{ borderStyle: 'dashed' }}>
                    <BarChart3 size={32} className="mx-auto mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }} />
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        Noch keine Analyse für „{selectedDs?.name}"
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Klicken Sie auf „Analyse starten", um die Berechnungen durchzuführen.
                    </p>
                </div>
            )}

            {/* ── WIF Factor Selector ── only shown when a dataset is selected */}
            {selectedId && (
                <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                WIF-Faktoren für bereinigten Gender Pay Gap
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                Faktoren zur Bildung der Vergleichszelle (EU Art. 9). Wirksam beim nächsten Analyselauf.
                            </p>
                        </div>
                        {selectedWif.length < ALL_WIF.length && (
                            <span className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--color-pl-amber)', border: '1px solid rgba(245,158,11,0.3)' }}>
                                Eingeschränkt
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {ALL_WIF.map(factor => {
                            const active = selectedWif.includes(factor)
                            return (
                                <button key={factor} onClick={() => toggleWif(factor)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                    style={{
                                        background: active ? 'rgba(59,130,246,0.2)' : 'var(--theme-pl-action-ghost)',
                                        border:     `1px solid ${active ? 'rgba(59,130,246,0.5)' : 'var(--color-pl-border)'}`,
                                        color:      active ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)',
                                    }}>
                                    {active ? '✓ ' : ''}{WIF_LABELS[factor]}
                                </button>
                            )
                        })}
                    </div>
                    {selectedWif.length < 2 && (
                        <p className="text-xs mt-2" style={{ color: 'var(--color-pl-amber)' }}>
                            ⚠ Mindestens 2 Faktoren empfohlen für methodisch valide Bereinigung (EU Art. 9).
                        </p>
                    )}
                </div>
            )}

            {/* ── Tab bar ── */}
            {results && (
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--theme-pl-action-ghost)', border: '1px solid var(--color-pl-border)', width: 'fit-content' }}>
                    {([
                        { id: 'overview',  label: 'Übersicht' },
                        { id: 'employees', label: `Mitarbeitende (${results.individual_flags?.length ?? 0})` },
                    ] as const).map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
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
                                Unbereinigter Gender Pay Gap (Median)
                            </p>
                            <GapBadge value={results.overall.unadjusted_median} />
                            <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-secondary)' }}>
                                <span>♀ {(results.overall.female_median_salary ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/h</span>
                                <span>♂ {(results.overall.male_median_salary ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/h</span>
                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>♀ {results.overall.female_count} Personen</span>
                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>♂ {results.overall.male_count} Personen</span>
                            </div>
                        </div>
                        <div className="glass-card p-5">
                            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                Bereinigter Gender Pay Gap · EU Art. 9 (Median)
                            </p>
                            <GapBadge value={results.overall.adjusted_median} />
                            <div className="mt-3 pt-3 border-t text-xs space-y-1" style={{ borderColor: 'var(--color-pl-border)' }}>
                                <p style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    WIF-Faktoren: <span style={{ color: 'var(--color-pl-text-secondary)' }}>{results.wif_factors_used.join(', ')}</span>
                                </p>
                                {results.hours_coverage_pct < 100 && (
                                    <p style={{ color: 'var(--color-pl-amber)' }}>⚠ {results.hours_coverage_pct}% Stundendaten</p>
                                )}
                            </div>
                        </div>
                        {/* Nach Begründungen — only shown when explanations exist */}
                        {(() => {
                            const flags = results.individual_flags ?? []
                            if (flags.length === 0 || existingExplanations.length === 0) {
                                return (
                                    <div className="glass-card p-5" style={{ opacity: 0.45 }}>
                                        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(52,211,153,0.6)' }}>
                                            Nach Begründungen
                                        </p>
                                        <p className="text-2xl font-bold" style={{ color: 'var(--color-pl-text-tertiary)' }}>—</p>
                                        <p className="text-xs mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}>
                                            Keine Begründungen erfasst
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
                            return (
                                <div className="glass-card p-5" style={{ border: '1px solid var(--color-pl-green)' }}>
                                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-pl-green)' }}>
                                        Nach Begründungen
                                    </p>
                                    <GapBadge value={medianResidual / 100} />
                                    <div className="mt-3 pt-3 border-t text-xs space-y-1" style={{ borderColor: 'var(--color-pl-green)' }}>
                                        <p style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            {existingExplanations.length} von {flaggedNonOk.length} Pers. begründet
                                        </p>
                                        <p style={{ color: 'var(--color-pl-text-tertiary)' }}>Median Restlücke</p>
                                    </div>
                                </div>
                            )
                        })()}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-card p-4 flex items-center justify-between">
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>Unbereinigt (Mittelwert)</p>
                            <GapBadge value={results.overall.unadjusted_mean} />
                        </div>
                        <div className="glass-card p-4 flex items-center justify-between">
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>Bereinigt (Mittelwert)</p>
                            <GapBadge value={results.overall.adjusted_mean} />
                        </div>
                    </div>

                    {results.overall.exceeds_5pct && (
                        <div className="glass-card flex items-start gap-3 p-4 rounded-xl"
                            style={{ border: '1px solid var(--color-pl-red)' }}>
                            <AlertTriangle size={18} style={{ color: 'var(--color-pl-red)', flexShrink: 0, marginTop: 1 }} />
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-red)' }}>
                                    Gemeinsame Entgeltbewertung erforderlich (Art. 9 EU-Richtlinie)
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    {results.departments_exceeding_5pct.length > 0
                                        ? `Betroffene Bereiche: ${results.departments_exceeding_5pct.join(', ')}`
                                        : 'Die Gesamtlücke überschreitet den Schwellenwert.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── 2×2 + 1 chart grid (shared with Dashboard) ── */}
                    <PayGapChartGrid results={results} />

                </>
            )}

            {/* ── Employees tab ── */}
            {results && activeTab === 'employees' && analysis?.id && (
                <EmployeesTab
                    flags={results.individual_flags ?? []}
                    analysisId={analysis.id}
                    existingExplanations={existingExplanations}
                    adjustedMedian={results.overall.adjusted_median ?? 0}
                    wifFactors={selectedWif}
                />
            )}
        </div>

        {/* ── Floating AI Chatbot ── */}
        {results && analysis?.id && (
            <AnalysisChatbot analysisId={analysis.id!} />
        )}
        </>
    )
}
