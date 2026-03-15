'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight, BarChart3 } from 'lucide-react'
import type { TrendPoint } from './page'

// ─── Helpers ────────────────────────────────────────────────────────────────

function pctFmt(v: number | null, decimals = 1) {
    if (v == null) return '—'
    return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`
}

function gapColor(v: number | null): string {
    if (v == null) return 'var(--color-pl-text-tertiary)'
    const abs = Math.abs(v)
    if (abs >= 5)  return 'var(--color-pl-red)'
    if (abs >= 2)  return 'var(--color-pl-amber)'
    return 'var(--color-pl-green)'
}

function delta(a: number | null, b: number | null): number | null {
    if (a == null || b == null) return null
    return b - a
}

// ─── SVG Line Chart ──────────────────────────────────────────────────────────

type Series = { label: string; color: string; values: (number | null)[] }

function LineChart({ years, series, h = 200 }: { years: number[]; series: Series[]; h?: number }) {
    const W = 1000, H = h, PL = 38, PR = 16, PT = 12, PB = 24
    const cw = W - PL - PR
    const ch = H - PT - PB
    if (years.length < 2) return null

    const allVals = series.flatMap(s => s.values).filter((v): v is number => v != null)
    const minV = Math.min(...allVals, 0)
    const maxV = Math.max(...allVals, 5)
    const pad  = (maxV - minV) * 0.15
    const lo   = minV - pad, hi = maxV + pad

    const xPos  = (i: number) => PL + (i / (years.length - 1)) * cw
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
                        <text x={PL - 5} y={y + 3} fontSize={10} fill="var(--color-pl-text-secondary)" textAnchor="end">
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

            {/* 5% threshold line */}
            {yPos(5) >= PT && yPos(5) <= PT + ch && (
                <line x1={PL} y1={yPos(5)} x2={PL + cw} y2={yPos(5)}
                    stroke="rgba(239,68,68,0.4)" strokeWidth={1} strokeDasharray="4 2" />
            )}

            {/* Series */}
            {series.map(s => {
                const pts = years.map((_, i) => s.values[i])
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
                                fill="none" stroke={s.color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round"
                                opacity={0.9}
                            />
                        ))}
                        {pts.map((v, i) => v != null ? (
                            <circle key={i} cx={xPos(i)} cy={yPos(v)} r={3}
                                fill={s.color} stroke="var(--color-pl-bg, #0f1629)" strokeWidth={1.5} />
                        ) : null)}
                    </g>
                )
            })}

            {/* X axis labels */}
            {years.map((y, i) => (
                <text key={y} x={xPos(i)} y={H - 6} fontSize={11} fill="var(--color-pl-text-secondary)" textAnchor="middle">
                    {y}
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
        if (abs >= 2)  return 'rgba(245,158,11,0.12)'
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

function DeltaCard({ label, from, to, unit = '%' }: { label: string; from: number | null; to: number | null; unit?: string }) {
    const d = delta(from, to)
    const improved = d != null && d < 0   // gap decreased = good
    const worsened = d != null && d > 0
    const Icon = improved ? TrendingDown : worsened ? TrendingUp : ArrowRight

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

// ─── Main Client Component ───────────────────────────────────────────────────

export default function TrendPageClient({ points }: { points: TrendPoint[] }) {
    const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'grades'>('overview')

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

    if (points.length === 1) {
        const p = points[0]
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>Trendanalyse</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Nur eine Analyse vorhanden — Trendvergleich ab zwei Berichtsjahren möglich
                    </p>
                </div>
                <div className="glass-card p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Aktuelle Analyse — {p.year}
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Unbereinigt (Median)', val: p.unadjustedMedian },
                            { label: 'Bereinigt (Median)', val: p.adjustedMedian },
                            { label: 'Mitarbeitende', val: null, extra: String(p.totalEmployees) },
                        ].map(({ label, val, extra }) => (
                            <div key={label} className="text-center">
                                <p className="text-xs mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{label}</p>
                                <p className="text-2xl font-bold" style={{ color: gapColor(val) }}>
                                    {extra ?? pctFmt(val)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // Sort by year
    const sorted = [...points].sort((a, b) => a.year - b.year)
    const years  = sorted.map(p => p.year)
    const latest = sorted[sorted.length - 1]
    const prev   = sorted[sorted.length - 2]

    const series: Series[] = [
        {
            label:  'Unbereinigt (Median)',
            color:  '#f87171',
            values: sorted.map(p => p.unadjustedMedian),
        },
        {
            label:  'Bereinigt (Median)',
            color:  '#60a5fa',
            values: sorted.map(p => p.adjustedMedian),
        },
        {
            label:  'Unbereinigt (Mittelwert)',
            color:  'rgba(248,113,113,0.45)',
            values: sorted.map(p => p.unadjustedMean),
        },
        {
            label:  'Bereinigt (Mittelwert)',
            color:  'rgba(96,165,250,0.45)',
            values: sorted.map(p => p.adjustedMean),
        },
    ]

    const TABS = [
        { id: 'overview',     label: 'Übersicht' },
        { id: 'departments',  label: 'Bereiche' },
        { id: 'grades',       label: 'Entgeltgruppen' },
    ] as const

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        Trendanalyse
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {sorted[0].year}–{latest.year} · {points.length} Analysen · {latest.totalEmployees} Mitarbeitende (aktuell)
                    </p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${latest.exceeds5pct ? 'status-red' : 'status-green'}`}>
                    {latest.exceeds5pct
                        ? <><AlertTriangle size={12} /> 5%-Schwelle überschritten</>
                        : <><CheckCircle2 size={12} /> Unter 5%-Schwelle</>
                    }
                </div>
            </div>

            {/* Delta KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <DeltaCard label="Unbereinigt (Median)"    from={prev.unadjustedMedian} to={latest.unadjustedMedian} />
                <DeltaCard label="Bereinigt (Median)"      from={prev.adjustedMedian}   to={latest.adjustedMedian} />
                <DeltaCard label="Unbereinigt (Mittelwert)" from={prev.unadjustedMean}  to={latest.unadjustedMean} />
                <DeltaCard label="Bereinigt (Mittelwert)"   from={prev.adjustedMean}    to={latest.adjustedMean} />
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--theme-pl-action-ghost)', border: '1px solid var(--color-pl-border)', width: 'fit-content' }}>
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

            {/* Overview tab — full chart */}
            {activeTab === 'overview' && (
                <div className="space-y-4">
                    <div className="glass-card p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Entgeltlücke im Zeitverlauf
                        </p>
                        <p className="text-xs mb-4" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Rote gestrichelte Linie = 5%-Schwelle (Art. 9 EU RL 2023/970)
                        </p>
                        <LineChart years={years} series={series} h={200} />
                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 mt-3">
                            {series.map(s => (
                                <div key={s.label} className="flex items-center gap-1.5">
                                    <div className="w-6 h-1.5 rounded-full" style={{ background: s.color }} />
                                    <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Year-by-year table */}
                    <div className="glass-card p-5 overflow-x-auto">
                        <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Jahresvergleich
                        </p>
                        <table className="text-xs w-full border-collapse">
                            <thead>
                                <tr className="border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                                    {['Jahr', 'Analyse', 'Unbereign. (Med.)', 'Bereign. (Med.)', 'Unbereign. (MW)', 'Bereign. (MW)', 'Mitarb.', 'F', 'M', '> 5%'].map(h => (
                                        <th key={h} className="py-2 px-3 text-left font-medium" style={{ color: 'var(--color-pl-text-tertiary)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((p, i) => {
                                    const isLatest = i === sorted.length - 1
                                    return (
                                        <tr key={p.analysisId}
                                            className="border-b"
                                            style={{
                                                borderColor: 'var(--color-pl-border)',
                                                background:  isLatest ? 'rgba(99,102,241,0.06)' : 'transparent',
                                            }}>
                                            <td className="py-2 px-3 font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                                {p.year} {isLatest && <span className="text-xs ml-1 opacity-50">(aktuell)</span>}
                                            </td>
                                            <td className="py-2 px-3" style={{ color: 'var(--color-pl-text-secondary)', maxWidth: '120px' }}>
                                                <span title={p.analysisName}>{p.analysisName.length > 16 ? p.analysisName.slice(0, 15) + '…' : p.analysisName}</span>
                                            </td>
                                            <td className="py-2 px-3 font-semibold" style={{ color: gapColor(p.unadjustedMedian) }}>{pctFmt(p.unadjustedMedian)}</td>
                                            <td className="py-2 px-3 font-semibold" style={{ color: gapColor(p.adjustedMedian)   }}>{pctFmt(p.adjustedMedian)}</td>
                                            <td className="py-2 px-3" style={{ color: gapColor(p.unadjustedMean) }}>{pctFmt(p.unadjustedMean)}</td>
                                            <td className="py-2 px-3" style={{ color: gapColor(p.adjustedMean)   }}>{pctFmt(p.adjustedMean)}</td>
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

            {/* Departments tab */}
            {activeTab === 'departments' && (
                <div className="glass-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Bereinigte Entgeltlücke je Bereich im Zeitverlauf
                    </p>
                    <p className="text-xs mb-5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Farbe: grün &lt; 2% · orange 2–5% · rot &gt; 5% · Median (Bereiche mit weniger als 5 MA anonymisiert)
                    </p>
                    <DeptHeatmap points={sorted} />
                </div>
            )}

            {/* Grades tab */}
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
                                    <th className="text-left py-2 pr-4 font-medium" style={{ color: 'var(--color-pl-text-tertiary)', minWidth: '100px' }}>Gruppe</th>
                                    {sorted.map(p => (
                                        <th key={p.analysisId} className="px-2 py-2 font-medium text-center" style={{ color: 'var(--color-pl-text-tertiary)', minWidth: '70px' }}>
                                            {p.year}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from(new Set(sorted.flatMap(p => p.gradeGaps.map(g => g.grade)))).sort().map(grade => (
                                    <tr key={grade} className="border-t" style={{ borderColor: 'var(--color-pl-border)' }}>
                                        <td className="py-1.5 pr-4 font-medium" style={{ color: 'var(--color-pl-text-secondary)' }}>{grade}</td>
                                        {sorted.map(p => {
                                            const gg = p.gradeGaps.find(g => g.grade === grade)
                                            const v  = gg?.adj ?? gg?.unadj ?? null
                                            const abs = v != null ? Math.abs(v) : null
                                            const bg = abs == null ? 'var(--theme-pl-action-ghost)'
                                                : abs >= 10 ? 'rgba(239,68,68,0.25)'
                                                : abs >= 5  ? 'rgba(239,68,68,0.12)'
                                                : abs >= 2  ? 'rgba(245,158,11,0.12)'
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
