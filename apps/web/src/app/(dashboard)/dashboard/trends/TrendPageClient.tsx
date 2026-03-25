'use client'

import { useState, useMemo } from 'react'
import {
    TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight,
    BarChart3, ChevronDown, ChevronUp, GitCompare, Check, AlertCircle,
} from 'lucide-react'
import type { TrendPoint } from './page'

// ─── Colour palette for comparison series ───────────────────────────────────

const PALETTE = [
    '#818cf8', // indigo
    '#34d399', // emerald
    '#f87171', // rose
    '#fbbf24', // amber
    '#60a5fa', // blue
    '#a78bfa', // violet
    '#f472b6', // pink
    '#2dd4bf', // teal
    '#fb923c', // orange
    '#86efac', // light-green
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pctFmt(v: number | null, decimals = 1) {
    if (v == null) return '—'
    return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`
}

function gapColor(v: number | null): string {
    if (v == null) return 'var(--color-pl-text-tertiary)'
    return Math.abs(v) >= 5 ? 'var(--color-pl-red)' : 'var(--color-pl-green)'
}

function delta(a: number | null, b: number | null): number | null {
    if (a == null || b == null) return null
    return b - a
}

/** Deduplicate to one point per year: picks the one with the latest createdAt */
function dedupeByYear(pts: TrendPoint[]): TrendPoint[] {
    const byYear = new Map<number, TrendPoint>()
    for (const p of pts) {
        const existing = byYear.get(p.year)
        if (!existing || p.createdAt > existing.createdAt) byYear.set(p.year, p)
    }
    return [...byYear.values()].sort((a, b) => a.year - b.year)
}

/** Smart default: latest analysis per reporting_year */
function buildSmartDefault(points: TrendPoint[]): Set<string> {
    return new Set(dedupeByYear(points).map(p => p.analysisId))
}

// ─── SVG Line Chart ──────────────────────────────────────────────────────────

type Series = { label: string; color: string; values: (number | null)[] }

function LineChart({ xLabels, series, h = 200 }: {
    xLabels: (string | number)[]
    series:  Series[]
    h?:      number
}) {
    const W = 1000, H = h, PL = 44, PR = 16, PT = 12, PB = 30
    const cw = W - PL - PR
    const ch = H - PT - PB
    if (xLabels.length < 2) return null

    const allVals = series.flatMap(s => s.values).filter((v): v is number => v != null)
    if (allVals.length === 0) return null
    const minV = Math.min(...allVals, 0)
    const maxV = Math.max(...allVals, 5)
    const pad  = (maxV - minV) * 0.15
    const lo   = minV - pad
    const hi   = maxV + pad

    const xPos  = (i: number) => PL + (i / (xLabels.length - 1)) * cw
    const yPos  = (v: number) => PT + (1 - (v - lo) / (hi - lo)) * ch
    const zeroY = yPos(0)

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(p => {
                const val = lo + (p / 100) * (hi - lo)
                const y   = yPos(val)
                return y >= PT - 2 && y <= PT + ch + 2 ? (
                    <g key={p}>
                        <line x1={PL} y1={y} x2={PL + cw} y2={y} stroke="var(--color-pl-border)" strokeWidth={1} />
                        <text x={PL - 6} y={y + 3.5} fontSize={10} fill="var(--color-pl-text-secondary)" textAnchor="end">
                            {val.toFixed(0)}%
                        </text>
                    </g>
                ) : null
            })}

            {/* Zero line */}
            {zeroY >= PT && zeroY <= PT + ch && (
                <line x1={PL} y1={zeroY} x2={PL + cw} y2={zeroY}
                    stroke="var(--color-pl-border)" strokeWidth={1} strokeDasharray="3 3" />
            )}

            {/* 5% threshold */}
            {yPos(5) >= PT && yPos(5) <= PT + ch && (
                <line x1={PL} y1={yPos(5)} x2={PL + cw} y2={yPos(5)}
                    stroke="rgba(239,68,68,0.4)" strokeWidth={1} strokeDasharray="4 2" />
            )}

            {/* Series */}
            {series.map(s => {
                const pts = xLabels.map((_, i) => s.values[i])
                const segments: Array<[number, number, number, number][]> = [[]]
                pts.forEach((v, i) => {
                    if (v == null) { segments.push([]); return }
                    segments[segments.length - 1].push([i, v, xPos(i), yPos(v)])
                })
                return (
                    <g key={s.label}>
                        {segments.filter(seg => seg.length >= 2).map((seg, si) => (
                            <polyline key={si}
                                points={seg.map(([,, x, y]) => `${x},${y}`).join(' ')}
                                fill="none" stroke={s.color} strokeWidth={2}
                                strokeLinejoin="round" strokeLinecap="round" opacity={0.9}
                            />
                        ))}
                        {pts.map((v, i) => v != null ? (
                            <circle key={i} cx={xPos(i)} cy={yPos(v)} r={3.5}
                                fill={s.color} stroke="var(--color-pl-bg, #0f1629)" strokeWidth={1.5} />
                        ) : null)}
                    </g>
                )
            })}

            {/* X-axis labels */}
            {xLabels.map((lbl, i) => (
                <text key={i} x={xPos(i)} y={H - 8} fontSize={11}
                    fill="var(--color-pl-text-secondary)" textAnchor="middle">
                    {String(lbl).length > 16 ? String(lbl).slice(0, 15) + '…' : String(lbl)}
                </text>
            ))}
        </svg>
    )
}

// ─── Department heatmap ──────────────────────────────────────────────────────

function DeptHeatmap({ points }: { points: TrendPoint[] }) {
    const allDepts = Array.from(new Set(points.flatMap(p => p.deptGaps.map(d => d.dept)))).sort()
    if (allDepts.length === 0) return null

    const cellBg = (v: number | null) => {
        if (v == null) return 'var(--theme-pl-action-ghost)'
        const abs = Math.abs(v)
        if (abs >= 10) return 'rgba(239,68,68,0.25)'
        if (abs >= 5)  return 'rgba(239,68,68,0.12)'
        return 'rgba(52,211,153,0.08)'
    }

    return (
        <div className="overflow-x-auto">
            <table className="text-xs w-full border-collapse">
                <thead>
                    <tr>
                        <th className="text-left py-2 pr-4 font-medium" style={{ color: 'var(--color-pl-text-tertiary)', minWidth: '140px' }}>Bereich</th>
                        {points.map(p => (
                            <th key={p.analysisId} className="px-2 py-2 font-medium text-center whitespace-nowrap"
                                style={{ color: 'var(--color-pl-text-tertiary)', minWidth: '70px' }}>
                                {p.year}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {allDepts.map(dept => (
                        <tr key={dept} className="border-t" style={{ borderColor: 'var(--color-pl-border)' }}>
                            <td className="py-1.5 pr-4 font-medium" style={{ color: 'var(--color-pl-text-secondary)' }} title={dept}>
                                {dept.length > 20 ? dept.slice(0, 19) + '…' : dept}
                            </td>
                            {points.map(p => {
                                const dg = p.deptGaps.find(d => d.dept === dept)
                                const v  = dg?.adj ?? dg?.unadj ?? null
                                return (
                                    <td key={p.analysisId} className="px-2 py-1.5 text-center rounded"
                                        style={{ background: cellBg(v), color: gapColor(v) }}>
                                        {pctFmt(v)}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// ─── Delta summary card ──────────────────────────────────────────────────────

function DeltaCard({ label, from, to }: { label: string; from: number | null; to: number | null }) {
    const d        = delta(from, to)
    const improved = d != null && d < 0
    const worsened = d != null && d > 0
    const Icon     = improved ? TrendingDown : worsened ? TrendingUp : ArrowRight

    return (
        <div className="glass-card p-4 space-y-1">
            <p className="text-xs font-medium" style={{ color: 'var(--color-pl-text-tertiary)' }}>{label}</p>
            <div className="flex items-end gap-3">
                <div>
                    <p className="text-lg font-bold" style={{ color: gapColor(to) }}>{pctFmt(to)}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>aktuell</p>
                </div>
                {d != null && (
                    <div className="flex items-center gap-1 pb-1"
                        style={{ color: improved ? 'var(--color-pl-green)' : worsened ? 'var(--color-pl-red)' : 'var(--color-pl-text-tertiary)' }}>
                        <Icon size={13} />
                        <span className="text-xs font-semibold">{pctFmt(d, 2)}</span>
                        <span className="text-xs opacity-60">ggü. Vorjahr</span>
                    </div>
                )}
            </div>
            <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>Vorjahr: {pctFmt(from)}</p>
        </div>
    )
}

// ─── Dataset selector ────────────────────────────────────────────────────────

function DatasetSelector({
    all,
    selected,
    onChange,
    conflicts,
}: {
    all:       TrendPoint[]
    selected:  Set<string>
    onChange:  (next: Set<string>) => void
    conflicts: Map<number, TrendPoint[]>  // year → points that share it
}) {
    const [open, setOpen] = useState(false)

    // Sort: latest year first, then most recent createdAt
    const sorted = [...all].sort((a, b) =>
        b.year !== a.year ? b.year - a.year : b.createdAt.localeCompare(a.createdAt)
    )

    const allSelected  = all.every(p => selected.has(p.analysisId))
    const noneSelected = all.every(p => !selected.has(p.analysisId))

    function toggle(id: string) {
        const next = new Set(selected)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        onChange(next)
    }

    function selectAll()  { onChange(new Set(all.map(p => p.analysisId))) }
    function selectNone() { onChange(new Set()) }
    function selectSmart(){ onChange(buildSmartDefault(all)) }

    const selectedCount = all.filter(p => selected.has(p.analysisId)).length

    return (
        <div className="glass-card overflow-hidden" style={{ border: '1px solid var(--color-pl-border)' }}>
            {/* Header bar — always visible */}
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                style={{ background: 'var(--theme-pl-action-ghost)' }}
            >
                <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Datensatz-Auswahl
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                        {selectedCount} / {all.length} aktiv
                    </span>
                    {conflicts.size > 0 && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                            <AlertCircle size={11} />
                            {conflicts.size} Jahr-Konflikt{conflicts.size > 1 ? 'e' : ''} — letzter Stand wird verwendet
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {open && (
                        <>
                            <button onClick={e => { e.stopPropagation(); selectAll() }}
                                className="text-xs px-2 py-1 rounded-md transition-colors"
                                style={{ color: 'var(--color-pl-text-tertiary)', background: 'var(--theme-pl-action-hover)' }}>
                                Alle
                            </button>
                            <button onClick={e => { e.stopPropagation(); selectSmart() }}
                                className="text-xs px-2 py-1 rounded-md transition-colors"
                                style={{ color: 'var(--color-pl-text-tertiary)', background: 'var(--theme-pl-action-hover)' }}>
                                Standard
                            </button>
                            <button onClick={e => { e.stopPropagation(); selectNone() }}
                                className="text-xs px-2 py-1 rounded-md transition-colors"
                                style={{ color: 'var(--color-pl-text-tertiary)', background: 'var(--theme-pl-action-hover)' }}>
                                Keine
                            </button>
                        </>
                    )}
                    {open ? <ChevronUp size={15} style={{ color: 'var(--color-pl-text-tertiary)' }} />
                           : <ChevronDown size={15} style={{ color: 'var(--color-pl-text-tertiary)' }} />}
                </div>
            </button>

            {/* Expanded list */}
            {open && (
                <div className="divide-y" style={{ borderColor: 'var(--color-pl-border)' }}>
                    {sorted.map((p, i) => {
                        const isSelected  = selected.has(p.analysisId)
                        const hasConflict = conflicts.has(p.year) && isSelected
                        const isLatestForYear = conflicts.get(p.year)?.[0]?.analysisId === p.analysisId

                        return (
                            <button
                                key={p.analysisId}
                                onClick={() => toggle(p.analysisId)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                                style={{
                                    background: isSelected
                                        ? 'rgba(99,102,241,0.05)'
                                        : 'transparent',
                                    borderColor: 'var(--color-pl-border)',
                                    opacity: selectedCount > 0 && !isSelected ? 0.65 : 1,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-pl-action-ghost)')}
                                onMouseLeave={e => (e.currentTarget.style.background = isSelected ? 'rgba(99,102,241,0.05)' : 'transparent')}
                            >
                                {/* Checkbox */}
                                <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                                    style={{
                                        border: `1.5px solid ${isSelected ? '#818cf8' : 'var(--color-pl-text-tertiary)'}`,
                                        background: isSelected ? '#818cf8' : 'transparent',
                                    }}>
                                    {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                                </span>

                                {/* Colour dot (for comparison mode legend correlation) */}
                                <span className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ background: PALETTE[i % PALETTE.length] }} />

                                {/* Labels */}
                                <span className="flex-1 min-w-0">
                                    <span className="text-xs font-medium block truncate"
                                        style={{ color: 'var(--color-pl-text-primary)' }}>
                                        {p.analysisName}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        {p.year} · {p.totalEmployees} MA
                                        {p.wifFactors?.length ? ` · WIF: ${p.wifFactors.join(', ')}` : ''}
                                    </span>
                                </span>

                                {/* Conflict label */}
                                {hasConflict && (
                                    <span className="text-xs flex-shrink-0 flex items-center gap-1"
                                        style={{ color: '#f59e0b' }}>
                                        <AlertCircle size={11} />
                                        {isLatestForYear ? 'wird verwendet' : 'wird übersprungen'}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ─── Main Client Component ────────────────────────────────────────────────────

export default function TrendPageClient({ points }: { points: TrendPoint[] }) {
    const [activeTab,      setActiveTab]      = useState<'overview' | 'departments' | 'grades'>('overview')
    const [comparisonMode, setComparisonMode] = useState(false)
    const [selectedIds,    setSelectedIds]    = useState<Set<string>>(() => buildSmartDefault(points))

    // ── Derived state ──────────────────────────────────────────────────────────

    const selectedPoints = useMemo(
        () => points.filter(p => selectedIds.has(p.analysisId)),
        [points, selectedIds]
    )

    // Sorted by year, then by most recent createdAt
    const sortedSelected = useMemo(
        () => [...selectedPoints].sort((a, b) =>
            a.year !== b.year ? a.year - b.year : a.createdAt.localeCompare(b.createdAt)
        ),
        [selectedPoints]
    )

    // Conflict map: year → [most-recent-first list of selected points for that year]
    const conflicts = useMemo(() => {
        const m = new Map<number, TrendPoint[]>()
        for (const p of sortedSelected) {
            const arr = m.get(p.year) ?? []
            arr.push(p)
            m.set(p.year, arr)
        }
        // Remove years with only one analysis
        for (const [yr, arr] of m) if (arr.length < 2) m.delete(yr)
        // Sort each group latest-first
        for (const arr of m.values()) arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        return m
    }, [sortedSelected])

    // Chart points: for default mode dedupe by year; for comparison keep all
    const chartPoints = useMemo(
        () => comparisonMode ? sortedSelected : dedupeByYear(sortedSelected),
        [sortedSelected, comparisonMode]
    )

    // ── Series building ────────────────────────────────────────────────────────

    const { xLabels, series } = useMemo(() => {
        if (comparisonMode) {
            // Each selected analysis → one series (unadjustedMedian only to keep chart readable)
            // X-axis = year labels with name disambiguation when same year
            const yearCount = new Map<number, number>()
            for (const p of chartPoints) yearCount.set(p.year, (yearCount.get(p.year) ?? 0) + 1)

            const labels = chartPoints.map(p =>
                (yearCount.get(p.year) ?? 0) > 1
                    ? `${p.year} · ${p.analysisName.slice(0, 10)}`
                    : String(p.year)
            )

            // Each analysis = its own coloured series (single point on the chart)
            // Group by analysisName to connect same-named datasets across years
            const groups = new Map<string, { idx: number; pts: TrendPoint[] }>()
            chartPoints.forEach((p, i) => {
                const key = p.analysisName
                if (!groups.has(key)) groups.set(key, { idx: i, pts: [] })
                groups.get(key)!.pts.push(p)
            })

            const seriesArr: Series[] = []
            let colIdx = 0
            for (const [name, { pts }] of groups) {
                // Build values array aligned to chartPoints order
                const values = chartPoints.map(cp =>
                    pts.find(p => p.analysisId === cp.analysisId)?.unadjustedMedian ?? null
                )
                seriesArr.push({ label: name, color: PALETTE[colIdx % PALETTE.length], values })
                colIdx++

                // Also plot adjusted median for this group (dashed — represented by lower opacity)
                const adjValues = chartPoints.map(cp =>
                    pts.find(p => p.analysisId === cp.analysisId)?.adjustedMedian ?? null
                )
                if (adjValues.some(v => v != null)) {
                    seriesArr.push({
                        label: `${name} (bereinigt)`,
                        color: PALETTE[colIdx % PALETTE.length],
                        values: adjValues,
                    })
                    colIdx++
                }
            }

            return { xLabels: labels, series: seriesArr }
        } else {
            // Default mode: 4 fixed series across deduped years
            return {
                xLabels: chartPoints.map(p => p.year),
                series: [
                    { label: 'Unbereinigt (Median)',    color: '#f87171',             values: chartPoints.map(p => p.unadjustedMedian) },
                    { label: 'Bereinigt (Median)',        color: '#60a5fa',             values: chartPoints.map(p => p.adjustedMedian)   },
                    { label: 'Unbereinigt (Mittelwert)', color: 'rgba(248,113,113,0.45)', values: chartPoints.map(p => p.unadjustedMean)   },
                    { label: 'Bereinigt (Mittelwert)',   color: 'rgba(96,165,250,0.45)',  values: chartPoints.map(p => p.adjustedMean)     },
                ] satisfies Series[],
            }
        }
    }, [chartPoints, comparisonMode])

    const TABS = [
        { id: 'overview',    label: 'Übersicht'       },
        { id: 'departments', label: 'Bereiche'        },
        { id: 'grades',      label: 'Entgeltgruppen'  },
    ] as const

    // ── Empty state ─────────────────────────────────────────────────────────────

    if (points.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>Trendanalyse</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Entwicklung der Entgeltlücken über mehrere Berichtsjahre
                    </p>
                </div>
                <div className="glass-card p-12 text-center" style={{ borderStyle: 'dashed' }}>
                    <BarChart3 size={36} className="mx-auto mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }} />
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Noch keine abgeschlossenen Analysen
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Führen Sie mindestens eine Analyse durch, um Trendauswertungen zu sehen.
                    </p>
                </div>
            </div>
        )
    }

    // ── Nothing selected state ──────────────────────────────────────────────────

    if (chartPoints.length === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>Trendanalyse</h1>
                <DatasetSelector all={points} selected={selectedIds} onChange={setSelectedIds} conflicts={conflicts} />
                <div className="glass-card p-10 text-center" style={{ borderStyle: 'dashed' }}>
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Wählen Sie mindestens einen Datensatz aus.
                    </p>
                </div>
            </div>
        )
    }

    // ── Latest + prev for delta cards ───────────────────────────────────────────

    const latest = chartPoints[chartPoints.length - 1]
    const prev   = chartPoints.length >= 2 ? chartPoints[chartPoints.length - 2] : null

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        Trendanalyse
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {chartPoints.length === 1
                            ? `${latest.year} · 1 Analyse · ${latest.totalEmployees} Mitarbeitende`
                            : `${chartPoints[0].year}–${latest.year} · ${chartPoints.length} Datenpunkte · ${latest.totalEmployees} Mitarbeitende (aktuell)`
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Comparison mode toggle */}
                    <button
                        onClick={() => setComparisonMode(v => !v)}
                        title="Vergleichsmodus: jeden Datensatz als eigene Linie darstellen"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                            background: comparisonMode ? 'rgba(129,140,248,0.15)' : 'var(--theme-pl-action-hover)',
                            border: `1px solid ${comparisonMode ? 'rgba(129,140,248,0.5)' : 'var(--color-pl-border)'}`,
                            color: comparisonMode ? '#818cf8' : 'var(--color-pl-text-tertiary)',
                        }}>
                        <GitCompare size={13} />
                        Vergleichsmodus
                    </button>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${latest.exceeds5pct ? 'status-red' : 'status-green'}`}>
                        {latest.exceeds5pct
                            ? <><AlertTriangle size={12} /> 5%-Schwelle überschritten</>
                            : <><CheckCircle2 size={12} /> Unter 5%-Schwelle</>
                        }
                    </div>
                </div>
            </div>

            {/* Dataset selector */}
            <DatasetSelector
                all={points}
                selected={selectedIds}
                onChange={setSelectedIds}
                conflicts={conflicts}
            />

            {/* Delta KPI cards — only when enough points */}
            {chartPoints.length >= 2 && !comparisonMode && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <DeltaCard label="Unbereinigt (Median)"    from={prev?.unadjustedMedian ?? null} to={latest.unadjustedMedian} />
                    <DeltaCard label="Bereinigt (Median)"      from={prev?.adjustedMedian   ?? null} to={latest.adjustedMedian}   />
                    <DeltaCard label="Unbereinigt (Mittelwert)" from={prev?.unadjustedMean  ?? null} to={latest.unadjustedMean}   />
                    <DeltaCard label="Bereinigt (Mittelwert)"   from={prev?.adjustedMean    ?? null} to={latest.adjustedMean}     />
                </div>
            )}

            {/* Tab bar */}
            <div className="flex gap-1 p-1 rounded-xl"
                style={{ background: 'var(--theme-pl-action-ghost)', border: '1px solid var(--color-pl-border)', width: 'fit-content' }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                            background: activeTab === tab.id ? 'var(--color-pl-brand)' : 'transparent',
                            color:      activeTab === tab.id ? '#fff' : 'var(--color-pl-text-tertiary)',
                        }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Overview ── */}
            {activeTab === 'overview' && (
                <div className="space-y-4">
                    <div className="glass-card p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Entgeltlücke im Zeitverlauf
                        </p>
                        <p className="text-xs mb-4" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {comparisonMode
                                ? 'Jeder Datensatz als eigene Linie · bereinigt und unbereinigt'
                                : 'Rote gestrichelte Linie = 5%-Schwelle (Art. 9 EU RL 2023/970)'
                            }
                        </p>
                        {xLabels.length >= 2
                            ? <LineChart xLabels={xLabels} series={series} h={220} />
                            : (
                                <div className="py-8 text-center text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    {comparisonMode
                                        ? 'Bitte wählen Sie mindestens 2 Datensätze für einen Trendvergleich.'
                                        : 'Mindestens 2 Berichtsjahre für einen Trendvergleich erforderlich.'
                                    }
                                </div>
                            )
                        }
                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 mt-4">
                            {series.map(s => (
                                <div key={s.label} className="flex items-center gap-1.5">
                                    <div className="w-6 h-1.5 rounded-full" style={{ background: s.color }} />
                                    <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Year-by-year data table */}
                    <div className="glass-card p-5 overflow-x-auto">
                        <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {comparisonMode ? 'Datensatz-Vergleich' : 'Jahresvergleich'}
                        </p>
                        <table className="text-xs w-full border-collapse">
                            <thead>
                                <tr className="border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                                    {['Jahr', 'Datensatz', 'Unbereign. (Med.)', 'Bereign. (Med.)', 'Unbereign. (MW)', 'Bereign. (MW)', 'MA', 'F', 'M', '> 5%'].map(h => (
                                        <th key={h} className="py-2 px-3 text-left font-medium"
                                            style={{ color: 'var(--color-pl-text-tertiary)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {chartPoints.map((p, i) => {
                                    const isLatest = i === chartPoints.length - 1
                                    return (
                                        <tr key={p.analysisId} className="border-b"
                                            style={{
                                                borderColor: 'var(--color-pl-border)',
                                                background:  isLatest ? 'rgba(99,102,241,0.06)' : 'transparent',
                                            }}>
                                            <td className="py-2 px-3 font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                                {p.year} {isLatest && <span className="text-xs ml-1 opacity-50">(aktuell)</span>}
                                            </td>
                                            <td className="py-2 px-3" style={{ color: 'var(--color-pl-text-secondary)', maxWidth: '140px' }}>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{ background: PALETTE[points.findIndex(x => x.analysisId === p.analysisId) % PALETTE.length] }} />
                                                    <span title={p.analysisName}>{p.analysisName.length > 18 ? p.analysisName.slice(0, 17) + '…' : p.analysisName}</span>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 font-semibold" style={{ color: gapColor(p.unadjustedMedian) }}>{pctFmt(p.unadjustedMedian)}</td>
                                            <td className="py-2 px-3 font-semibold" style={{ color: gapColor(p.adjustedMedian)   }}>{pctFmt(p.adjustedMedian)}</td>
                                            <td className="py-2 px-3"               style={{ color: gapColor(p.unadjustedMean)   }}>{pctFmt(p.unadjustedMean)}</td>
                                            <td className="py-2 px-3"               style={{ color: gapColor(p.adjustedMean)     }}>{pctFmt(p.adjustedMean)}</td>
                                            <td className="py-2 px-3" style={{ color: 'var(--color-pl-text-secondary)' }}>{p.totalEmployees}</td>
                                            <td className="py-2 px-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>{p.femaleCount}</td>
                                            <td className="py-2 px-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>{p.maleCount}</td>
                                            <td className="py-2 px-3">
                                                {p.exceeds5pct
                                                    ? <span style={{ color: 'var(--color-pl-red)' }}>Ja</span>
                                                    : <span style={{ color: 'var(--color-pl-green)' }}>Nein</span>
                                                }
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Departments ── */}
            {activeTab === 'departments' && (
                <div className="glass-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Bereinigte Entgeltlücke je Bereich im Zeitverlauf
                    </p>
                    <p className="text-xs mb-5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Farbe: grün &lt; 2% · orange 2–5% · rot &gt; 5% · Median (Bereiche mit weniger als 5 MA anonymisiert)
                    </p>
                    <DeptHeatmap points={chartPoints} />
                </div>
            )}

            {/* ── Grades ── */}
            {activeTab === 'grades' && (
                <div className="glass-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Bereinigte Entgeltlücke je Entgeltgruppe im Zeitverlauf
                    </p>
                    <p className="text-xs mb-5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Farbe: grün &lt; 2% · orange 2–5% · rot &gt; 5%
                    </p>
                    <div className="overflow-x-auto">
                        <table className="text-xs w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="text-left py-2 pr-4 font-medium"
                                        style={{ color: 'var(--color-pl-text-tertiary)', minWidth: '100px' }}>Gruppe</th>
                                    {chartPoints.map(p => (
                                        <th key={p.analysisId} className="px-2 py-2 font-medium text-center"
                                            style={{ color: 'var(--color-pl-text-tertiary)', minWidth: '70px' }}>
                                            {p.year}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from(new Set(chartPoints.flatMap(p => p.gradeGaps.map(g => g.grade)))).sort().map(grade => (
                                    <tr key={grade} className="border-t" style={{ borderColor: 'var(--color-pl-border)' }}>
                                        <td className="py-1.5 pr-4 font-medium" style={{ color: 'var(--color-pl-text-secondary)' }}>{grade}</td>
                                        {chartPoints.map(p => {
                                            const gg  = p.gradeGaps.find(g => g.grade === grade)
                                            const v   = gg?.adj ?? gg?.unadj ?? null
                                            const abs = v != null ? Math.abs(v) : null
                                            const bg  = abs == null ? 'var(--theme-pl-action-ghost)'
                                                : abs >= 10 ? 'rgba(239,68,68,0.25)'
                                                : abs >=  5 ? 'rgba(239,68,68,0.12)'
                                                : 'rgba(52,211,153,0.08)'
                                            return (
                                                <td key={p.analysisId} className="px-2 py-1.5 text-center rounded"
                                                    style={{ background: bg, color: gapColor(v) }}>
                                                    {pctFmt(v)}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
