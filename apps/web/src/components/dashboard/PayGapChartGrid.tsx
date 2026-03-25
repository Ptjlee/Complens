'use client'

import { useState } from 'react'
import { Layers, Users } from 'lucide-react'
import type { AnalysisResult, DispersionPoint, GenderDistRow } from '@/lib/calculations/types'

// ============================================================
// Design tokens — single source of truth for gender colours
// ============================================================
const C_FEMALE = {
    solid:  'var(--color-pl-accent)',
    bar:    'var(--color-pl-accent)',
    light:  'color-mix(in srgb, var(--color-pl-accent) 40%, transparent)',
    dot:    'color-mix(in srgb, var(--color-pl-accent) 90%, transparent)',
}
const C_MALE = {
    solid:  'var(--color-pl-brand)',
    bar:    'var(--color-pl-brand)',
    light:  'color-mix(in srgb, var(--color-pl-brand) 40%, transparent)',
    dot:    'color-mix(in srgb, var(--color-pl-brand) 75%, transparent)',
}

// ============================================================
// Quartile bar
// ============================================================
function QuartileBar({ label, female_pct, male_pct, count }: {
    label: string; female_pct: number; male_pct: number; count: number
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--color-pl-text-secondary)' }}>{label}</span>
                <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{count} MA</span>
            </div>
            <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                <div className="transition-all duration-700 rounded-l-full"
                    style={{ width: `${female_pct}%`, background: C_FEMALE.bar }} />
                <div className="transition-all duration-700 rounded-r-full"
                    style={{ width: `${male_pct}%`, background: C_MALE.bar }} />
            </div>
            <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: C_FEMALE.solid }}>♀ {female_pct}%</span>
                <span className="text-xs" style={{ color: C_MALE.solid  }}>♂ {male_pct}%</span>
            </div>
        </div>
    )
}

// ============================================================
// Gender Distribution Stacked Bar row
// ============================================================
function GenderDistBar({ row }: { row: GenderDistRow }) {
    const other = Math.max(0, 100 - row.female_pct - row.male_pct)
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--color-pl-text-secondary)' }}>{row.label}</span>
                <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{row.total} MA</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden gap-px">
                {row.female_pct > 0 && <div style={{ width: `${row.female_pct}%`, background: C_FEMALE.bar }} />}
                {row.male_pct   > 0 && <div style={{ width: `${row.male_pct}%`,   background: C_MALE.bar   }} />}
                {other          > 0 && <div style={{ width: `${other}%`,          background: 'var(--color-pl-border-strong)' }} />}
            </div>
            <div className="flex gap-3 mt-1">
                <span className="text-xs" style={{ color: C_FEMALE.solid }}>♀ {row.female_pct}%</span>
                <span className="text-xs" style={{ color: C_MALE.solid   }}>♂ {row.male_pct}%</span>
            </div>
        </div>
    )
}

// ============================================================
// Gender Distribution Card — toggle Ebene / Bereich
// ============================================================
function GenderDistCard({ byGrade, byDept }: { byGrade: GenderDistRow[]; byDept: GenderDistRow[] }) {
    const [mode, setMode] = useState<'grade' | 'dept'>('grade')
    const rows = mode === 'grade' ? byGrade : byDept
    return (
        <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users size={15} style={{ color: 'var(--color-pl-brand-light)' }} />
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        Geschlechterverteilung
                    </h2>
                </div>
                <div className="flex rounded-lg overflow-hidden text-xs" style={{ border: '1px solid var(--color-pl-border)' }}>
                    {(['grade', 'dept'] as const).map(m => (
                        <button key={m} onClick={() => setMode(m)} className="px-3 py-1 transition-colors" style={{
                            background: mode === m ? 'var(--theme-pl-action-border)' : 'transparent',
                            color:      mode === m ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)',
                            fontWeight: mode === m ? 600 : 400,
                        }}>{m === 'grade' ? 'Ebene' : 'Bereich'}</button>
                    ))}
                </div>
            </div>
            <div className="space-y-3">
                {rows.length === 0
                    ? <p className="text-xs text-center py-6" style={{ color: 'var(--color-pl-text-tertiary)' }}>Keine Daten.</p>
                    : rows.map(row => <GenderDistBar key={row.label} row={row} />)
                }
            </div>
            <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-pl-border)' }}>
                <span className="text-xs flex items-center gap-1" style={{ color: C_FEMALE.solid }}><span>■</span> Frauen</span>
                <span className="text-xs flex items-center gap-1" style={{ color: C_MALE.solid   }}><span>■</span> Männer</span>
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-pl-text-tertiary)' }}><span>■</span> Sonstige</span>
            </div>
        </div>
    )
}

const TBtn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} className="px-2.5 py-1 text-xs transition-colors" style={{
        background: active ? 'var(--theme-pl-action-border)' : 'transparent',
        color:      active ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)',
        fontWeight: active ? 600 : 400,
    }}>{label}</button>
)

// ============================================================
// Salary Comparison Bar Chart — pay tier + annual/hourly toggles
// ============================================================
function SalaryComparisonCard({ results }: { results: AnalysisResult }) {
    const o     = results.overall
    const SCALE = (results.standard_weekly_hours ?? 40) * 52

    type Tier = 'base_only' | 'total'
    type Unit = 'annual'    | 'hourly'
    const [tier, setTier] = useState<Tier>('base_only')
    const [unit, setUnit] = useState<Unit>('annual')

    // Hourly values per tier — MEDIAN
    const maleMedH   = (tier === 'total' ? o.male_median_salary   : (o.male_base_only_median_salary   ?? o.male_median_salary))   ?? 0
    const femaleMedH = (tier === 'total' ? o.female_median_salary : (o.female_base_only_median_salary ?? o.female_median_salary)) ?? 0
    // Hourly values per tier — MEAN
    const maleMeanH   = (tier === 'total' ? o.male_mean_salary   : (o.male_base_only_mean_salary   ?? o.male_mean_salary))   ?? 0
    const femaleMeanH = (tier === 'total' ? o.female_mean_salary : (o.female_base_only_mean_salary ?? o.female_mean_salary)) ?? 0

    const gapMedPct  = maleMedH  > 0 ? (maleMedH  - femaleMedH)  / maleMedH  * 100 : 0
    const gapMeanPct = maleMeanH > 0 ? (maleMeanH - femaleMeanH) / maleMeanH * 100 : 0

    const toDisplay = (h: number) => unit === 'hourly' ? h : h * SCALE
    const maxVal    = Math.max(
        toDisplay(maleMedH), toDisplay(femaleMedH),
        toDisplay(maleMeanH), toDisplay(femaleMeanH), 1
    )

    const groups = [
        {
            key: 'median', title: 'Median', gapPct: gapMedPct,
            rows: [
                { label: 'Männer', value: toDisplay(maleMedH),   color: C_MALE.bar,   count: o.male_count   },
                { label: 'Frauen', value: toDisplay(femaleMedH), color: C_FEMALE.bar, count: o.female_count },
            ],
        },
        {
            key: 'mean', title: 'Mittelwert', gapPct: gapMeanPct,
            rows: [
                { label: 'Männer', value: toDisplay(maleMeanH),   color: C_MALE.bar,   count: o.male_count   },
                { label: 'Frauen', value: toDisplay(femaleMeanH), color: C_FEMALE.bar, count: o.female_count },
            ],
        },
    ]

    const fmt = (v: number) =>
        unit === 'hourly'
            ? v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €/h'
            : v.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €'

    const LABEL_W = 64
    const BAR_H   = 14


    return (
        <div className="glass-card p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        Gehalt — Männer vs. Frauen
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {"Median & Mittelwert · "}
                        <span style={{ color: 'var(--color-pl-accent)' }}>Lückenberechnung basiert auf Gesamtvergütung</span>
                        {' (EU Art. 3 RL 2023/970)'}
                    </p>
                </div>
                <div className="flex gap-3 text-xs flex-shrink-0 items-center">
                    <span className="flex items-center gap-1" style={{ color: C_MALE.solid   }}><span>■</span> Männer</span>
                    <span className="flex items-center gap-1" style={{ color: C_FEMALE.solid }}><span>■</span> Frauen</span>
                </div>
            </div>

            {/* Toggle row: tier left, unit right */}
            <div className="flex items-center gap-2 mb-4">
                <div className="flex rounded-lg overflow-hidden text-xs" style={{ border: '1px solid var(--color-pl-border)' }}>
                    <TBtn label="Basis"           active={tier==='base_only'} onClick={()=>setTier('base_only')} />
                    <TBtn label="Gesamtvergütung" active={tier==='total'}     onClick={()=>setTier('total')} />
                </div>
                <div className="flex-1" />
                <div className="flex rounded-lg overflow-hidden text-xs" style={{ border: '1px solid var(--color-pl-border)' }}>
                    <TBtn label="Jährlich"  active={unit==='annual'} onClick={()=>setUnit('annual')} />
                    <TBtn label="Stündlich" active={unit==='hourly'} onClick={()=>setUnit('hourly')} />
                </div>
            </div>

            {/* Median + Mittelwert groups — EU Directive Art. 9 requires both */}
            <div className="space-y-5">
                {groups.map(group => (
                    <div key={group.key}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                {group.title}
                            </p>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                                background: Math.abs(group.gapPct) >= 5 ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.12)',
                                color:      Math.abs(group.gapPct) >= 5 ? '#ef4444' : 'var(--color-pl-green)',
                                border:     `1px solid ${Math.abs(group.gapPct) >= 5 ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.25)'}`,
                            }}>
                                Lücke {group.gapPct >= 0 ? '+' : ''}{group.gapPct.toFixed(1)}%
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            {group.rows.map(row => {
                                const barW = (row.value / maxVal) * 100
                                return (
                                    <div key={row.label} className="flex items-center gap-3">
                                        <p className="text-xs flex-shrink-0 text-right"
                                            style={{ width: LABEL_W, color: 'var(--color-pl-text-secondary)' }}>
                                            {row.label} <span style={{ color: 'var(--color-pl-text-tertiary)', fontSize: 10 }}>({row.count})</span>
                                        </p>
                                        <div className="flex-1 rounded-full overflow-hidden"
                                            style={{ height: BAR_H, background: 'var(--theme-pl-action-hover)' }}>
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${barW}%`, background: row.color }} />
                                        </div>
                                        <p className="text-xs font-semibold flex-shrink-0"
                                            style={{ width: 96, color: 'var(--color-pl-text-primary)', fontSize: 11, textAlign: 'right' }}>
                                            {fmt(row.value)}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footnote */}
            <p className="text-xs pt-3" style={{ borderTop: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}>
                {tier === 'base_only'
                    ? 'Basis: Nur Grundgehalt (ohne Bonus, Überstunden & Sachleistungen) — die Lückenprozente beziehen sich auf die Gesamtvergütung.'
                    : 'Gesamtvergütung: Grundgehalt + variable Vergütung + Überstunden & Sachleistungen — EU Art. 3 konform.'}
            </p>
        </div>
    )
}

// ============================================================
// Pay Gap Breakdown — toggle Level / Bereich
// ============================================================
function PayGapBreakdownCard({ results }: { results: AnalysisResult }) {
    const [mode, setMode] = useState<'grade' | 'dept'>('grade')
    const rows = mode === 'grade'
        ? results.by_grade.map(g => ({
            key: g.grade, label: g.grade, count: g.employee_count,
            gapPct: (g.gap.adjusted_median ?? g.gap.unadjusted_median) * 100,
            suppressed: g.suppressed,
        }))
        : results.by_department.map(d => ({
            key: d.department, label: d.department, count: d.employee_count,
            gapPct: (d.gap.adjusted_median ?? d.gap.unadjusted_median) * 100,
            suppressed: d.suppressed,
        }))

    const gapColor = (pct: number, sup: boolean) =>
        sup ? 'var(--color-pl-text-tertiary)'
        : Math.abs(pct) >= 5 ? 'var(--color-pl-red)'
        : 'var(--color-pl-green)'

    return (
        <div className="glass-card">
            <div className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--color-pl-border)' }}>
                <div className="flex items-center gap-2">
                    <Layers size={15} style={{ color: 'var(--color-pl-brand-light)' }} />
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        Entgeltlücke nach {mode === 'grade' ? 'Vergütungsebene' : 'Bereich'}
                    </h2>
                </div>
                <div className="flex rounded-lg overflow-hidden text-xs" style={{ border: '1px solid var(--color-pl-border)' }}>
                    {(['grade', 'dept'] as const).map(m => (
                        <button key={m} onClick={() => setMode(m)} className="px-3 py-1 transition-colors" style={{
                            background: mode === m ? 'var(--theme-pl-action-border)' : 'transparent',
                            color:      mode === m ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)',
                            fontWeight: mode === m ? 600 : 400,
                        }}>{m === 'grade' ? 'Ebene' : 'Bereich'}</button>
                    ))}
                </div>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-pl-border)' }}>
                {rows.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-center" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Keine Daten vorhanden.
                    </div>
                ) : rows.map(row => {
                    const color = gapColor(row.gapPct, row.suppressed)
                    const barW  = row.suppressed ? 0 : Math.min(100, Math.abs(row.gapPct) / 25 * 100)
                    return (
                        <div key={row.key} className="px-5 py-3">
                            <div className="flex items-center justify-between mb-1.5">
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>{row.label}</p>
                                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        {row.count} MA{row.suppressed && ' · anonymisiert'}
                                    </p>
                                </div>
                                <span className="text-sm font-bold ml-4" style={{ color }}>
                                    {row.suppressed ? '—' : `${row.gapPct >= 0 ? '+' : ''}${row.gapPct.toFixed(1)}%`}
                                </span>
                            </div>
                            {!row.suppressed && (
                                <div className="h-1 rounded-full" style={{ background: 'var(--theme-pl-action-hover)' }}>
                                    <div className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${barW}%`, background: color }} />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            <div className="px-5 py-2 text-xs" style={{ color: 'var(--color-pl-text-tertiary)', borderTop: '1px solid var(--color-pl-border)' }}>
                Bereinigter Median Gender Pay Gap (WIF). Gruppen &lt;5 MA anonymisiert.
            </div>
        </div>
    )
}

// ============================================================
// Dispersion statistics helpers
// ============================================================
function arrMedian(arr: number[]): number | null {
    if (arr.length === 0) return null
    const s = [...arr].sort((a, b) => a - b)
    const m = Math.floor(s.length / 2)
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
function arrAvg(arr: number[]): number | null {
    if (arr.length === 0) return null
    return arr.reduce((acc, v) => acc + v, 0) / arr.length
}

type SeriesKey = 'dots_male' | 'dots_female' | 'line_med_male' | 'line_avg_male' | 'line_med_female' | 'line_avg_female'
const SERIES_META: { key: SeriesKey; label: string; color: string; dashArray?: string; dot: boolean }[] = [
    { key: 'dots_male',       label: 'Männer',        color: C_MALE.dot,    dot: true  },
    { key: 'dots_female',     label: 'Frauen',         color: C_FEMALE.dot,  dot: true  },
    { key: 'line_med_male',   label: 'Median Männer',  color: C_MALE.solid,  dot: false },
    { key: 'line_avg_male',   label: 'Mittelwert Männer', color: C_MALE.light,  dot: false, dashArray: '6 3' },
    { key: 'line_med_female', label: 'Median Frauen',  color: C_FEMALE.solid,dot: false },
    { key: 'line_avg_female', label: 'Mittelwert Frauen', color: C_FEMALE.light, dot: false, dashArray: '6 3' },
]

// ============================================================
// Dispersion Card — full-width scatter + filterable lines
// ============================================================
function DispersionCard({ points }: { points: DispersionPoint[] }) {
    const [mode,    setMode]    = useState<'grade' | 'dept'>('grade')
    const [visible, setVisible] = useState<Set<SeriesKey>>(
        new Set(SERIES_META.map(s => s.key) as SeriesKey[])
    )
    const toggleSeries = (key: SeriesKey) =>
        setVisible(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

    const getKey = (p: DispersionPoint) =>
        mode === 'grade' ? (p.grade ?? 'Unbekannt') : (p.department ?? 'Unbekannt')

    const groups = [...new Set(points.map(getKey))].sort()

    const VB_W  = 560
    const L_PAD = 44
    const R_PAD = 6
    const T_PAD = 8
    const B_PAD = 16
    const PLOT_H = 120
    const PLOT_W = VB_W - L_PAD - R_PAD
    const COL_W = groups.length > 0 ? PLOT_W / groups.length : 60
    const svgH  = T_PAD + PLOT_H + B_PAD

    const allSal = points.map(p => p.annual_salary)
    const yMax0  = allSal.length ? Math.max(...allSal) : 100000
    const stepK  = yMax0 > 300000 ? 70000 : yMax0 > 150000 ? 35000 : 15000
    const yMax   = Math.ceil(yMax0 / stepK) * stepK
    const yRange = yMax || 1
    const Y_TICKS = Array.from({ length: Math.round(yMax / stepK) + 1 }, (_, i) => i * stepK)

    const toY  = (v: number) => T_PAD + PLOT_H - (v / yRange) * PLOT_H
    const eurK = (v: number) => `€${(v / 1000).toFixed(0)}k`

    const maxJ   = Math.max(3, COL_W * 0.20)
    const jitter = (seed: number) => {
        const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
        return (x - Math.floor(x)) * maxJ * 2 - maxJ
    }

    const groupStats = groups.map((grp, gi) => {
        const cx    = L_PAD + gi * COL_W + COL_W / 2
        const colPts= points.filter(p => getKey(p) === grp)
        const mSal  = colPts.filter(p => p.gender === 'male').map(p => p.annual_salary)
        const fSal  = colPts.filter(p => p.gender === 'female').map(p => p.annual_salary)
        return { grp, gi, cx, colPts, medMale: arrMedian(mSal), avgMale: arrAvg(mSal), medFemale: arrMedian(fSal), avgFemale: arrAvg(fSal) }
    })

    const polyPts = (fn: (s: typeof groupStats[0]) => number | null) =>
        groupStats.filter(s => fn(s) !== null).map(s => `${s.cx},${toY(fn(s)!)}`).join(' ')

    const showDM = visible.has('dots_male');    const showDF = visible.has('dots_female')
    const showMM = visible.has('line_med_male'); const showAM = visible.has('line_avg_male')
    const showMF = visible.has('line_med_female'); const showAF = visible.has('line_avg_female')

    return (
        <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Gehaltsverteilung nach {mode === 'grade' ? 'Ebene' : 'Bereich'}
                </h2>
                <div className="flex rounded-lg overflow-hidden text-xs" style={{ border: '1px solid var(--color-pl-border)' }}>
                    {(['grade','dept'] as const).map(m => (
                        <button key={m} onClick={() => setMode(m)} className="px-3 py-1 transition-colors" style={{
                            background: mode===m ? 'var(--theme-pl-action-border)' : 'transparent',
                            color:      mode===m ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)',
                            fontWeight: mode===m ? 600 : 400,
                        }}>{m==='grade' ? 'Ebene' : 'Bereich'}</button>
                    ))}
                </div>
            </div>

            {groups.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    Keine Daten (Mindestgröße pro Gruppe: 5 MA)
                </p>
            ) : (
                <svg viewBox={`0 0 ${VB_W} ${svgH}`} className="w-full">
                    <rect x={L_PAD} y={T_PAD} width={PLOT_W} height={PLOT_H} fill="var(--theme-pl-surface-2)" rx={3} />
                    {Y_TICKS.map(tick => {
                        const y = toY(tick)
                        return (
                            <g key={tick}>
                                <line x1={L_PAD} y1={y} x2={L_PAD+PLOT_W} y2={y}
                                    stroke={tick===0 ? 'var(--color-pl-border-strong)' : 'var(--color-pl-border)'}
                                    strokeWidth={1} strokeDasharray={tick===0 ? undefined : '4 3'} />
                                <text x={L_PAD-4} y={y+2.5} textAnchor="end" fontSize={4.5} fill="var(--color-pl-text-tertiary)">{eurK(tick)}</text>
                            </g>
                        )
                    })}
                    {groupStats.map(({ grp, gi, cx, colPts }) => (
                        <g key={grp}>
                            {gi > 0 && <line x1={L_PAD+gi*COL_W} y1={T_PAD} x2={L_PAD+gi*COL_W} y2={T_PAD+PLOT_H}
                                stroke="var(--theme-pl-action-border)" strokeWidth={1} strokeDasharray="4 3" />}
                            {showDM && colPts.filter(p=>p.gender==='male').map((pt,i) => (
                                <circle key={`m${i}`} cx={cx+jitter(gi*400+i)} cy={toY(pt.annual_salary)}
                                    r={1.5} fill={C_MALE.dot} opacity={0.88} />
                            ))}
                            {showDF && colPts.filter(p=>p.gender==='female').map((pt,i) => (
                                <circle key={`f${i}`} cx={cx+jitter(gi*400+200+i)} cy={toY(pt.annual_salary)}
                                    r={1.5} fill={C_FEMALE.dot} opacity={0.88} />
                            ))}
                            <text x={cx} y={T_PAD+PLOT_H+10} textAnchor="middle"
                                fontSize={mode==='dept' ? 4 : 4.5} fill="var(--color-pl-text-tertiary)">
                                {mode==='dept' && grp.length>9 ? grp.slice(0,8)+'…' : grp}
                            </text>
                        </g>
                    ))}
                    {showMM && <polyline points={polyPts(s=>s.medMale)}   fill="none" stroke={C_MALE.solid}   strokeWidth={1.8} strokeOpacity={0.9} />}
                    {showAM && <polyline points={polyPts(s=>s.avgMale)}   fill="none" stroke={C_MALE.solid}   strokeWidth={1.5} strokeDasharray="6 3" strokeOpacity={0.60} />}
                    {showMF && <polyline points={polyPts(s=>s.medFemale)} fill="none" stroke={C_FEMALE.solid} strokeWidth={1.8} strokeOpacity={0.9} />}
                    {showAF && <polyline points={polyPts(s=>s.avgFemale)} fill="none" stroke={C_FEMALE.solid} strokeWidth={1.5} strokeDasharray="6 3" strokeOpacity={0.60} />}
                </svg>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
                {SERIES_META.map(s => {
                    const on = visible.has(s.key)
                    return (
                        <button key={s.key} onClick={()=>toggleSeries(s.key)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all"
                            style={{
                                border:     `1px solid ${on ? s.color : 'var(--theme-pl-action-border)'}`,
                                background: on ? `${s.color}22` : 'transparent',
                                color:      on ? s.color : 'var(--color-pl-text-tertiary)',
                            }}>
                            {s.dot
                                ? <span style={{fontSize:10}}>●</span>
                                : <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3"
                                    stroke={on ? s.color : 'var(--color-pl-border-strong)'} strokeWidth={1.8}
                                    strokeDasharray={s.dashArray} /></svg>
                            }
                            {s.label}
                        </button>
                    )
                })}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                Jährliches Gesamtentgelt. Gruppen &lt;5 MA anonymisiert.
            </p>
        </div>
    )
}

// ============================================================
// PayGapChartGrid — 2×2 + 1 full-width layout
// Reused by Dashboard Overview and Analysis page
// ============================================================
export function PayGapChartGrid({ results }: { results: AnalysisResult }) {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

            {/* Row 1 L — Quartile */}
            <div className="glass-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Gehaltsquartile
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-accent)' }}>
                            Gesamtentgelt (EU Art. 3)
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs flex-shrink-0">
                        <span className="flex items-center gap-1" style={{ color: C_FEMALE.solid }}><span>■</span> Frauen</span>
                        <span className="flex items-center gap-1" style={{ color: C_MALE.solid   }}><span>■</span> Männer</span>
                    </div>
                </div>
                <div className="space-y-3">
                    {[
                        { label: 'Q4 — Oberstes Quartil',  ...results.quartiles.q4 },
                        { label: 'Q3 — Oberes Quartil',    ...results.quartiles.q3 },
                        { label: 'Q2 — Unteres Quartil',   ...results.quartiles.q2 },
                        { label: 'Q1 — Unterstes Quartil', ...results.quartiles.q1 },
                    ].map(q => <QuartileBar key={q.label} {...q} />)}
                </div>
            </div>

            {/* Row 1 R — Salary bars */}
            <SalaryComparisonCard results={results} />

            {/* Row 2 L — Pay gap by level/dept */}
            <PayGapBreakdownCard results={results} />

            {/* Row 2 R — Gender distribution */}
            <GenderDistCard
                byGrade={results.gender_by_grade ?? []}
                byDept={results.gender_by_department ?? []}
            />

            {/* Row 3 — Full-width dispersion */}
            <div className="xl:col-span-2">
                <DispersionCard points={results.dispersion_points ?? []} />
            </div>

        </div>
    )
}
