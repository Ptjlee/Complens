'use client'

import { Info } from 'lucide-react'
import { useState } from 'react'
import type { BandGradeSummary } from '@/lib/band/getBandContext'

// ── Tooltip ─────────────────────────────────────────────────
function Tip({ text }: { text: string }) {
    const [show, setShow] = useState(false)
    return (
        <span className="relative inline-flex items-center ml-1 cursor-help">
            <Info size={10} style={{ color: 'var(--color-pl-text-tertiary)' }}
                onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
            {show && (
                <span className="absolute z-50 bottom-5 left-0 px-2.5 py-1.5 text-xs rounded-lg shadow-lg w-56"
                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-secondary)', lineHeight: 1.5 }}>
                    {text}
                </span>
            )}
        </span>
    )
}

const eur = (v: number | null) =>
    v == null ? '—' : v.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €'

const pct = (v: number | null) =>
    v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`

function compaRatio(salary: number | null, midpoint: number | null): number | null {
    if (!salary || !midpoint || midpoint === 0) return null
    return Math.round((salary / midpoint) * 100)
}

function CompaChip({ value }: { value: number | null }) {
    if (value == null) return <span style={{ color: 'var(--color-pl-text-tertiary)' }}>—</span>
    const color = value < 80  ? 'var(--color-pl-red)' :
                  value < 90  ? '#f97316' :
                  value <= 110 ? 'var(--color-pl-green)' : '#8b5cf6'
    const bg    = value < 80  ? 'rgba(239,68,68,0.1)'  :
                  value < 90  ? 'rgba(249,115,22,0.1)'  :
                  value <= 110 ? 'rgba(52,211,153,0.1)'  : 'rgba(139,92,246,0.1)'
    return (
        <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: bg, color }}>
            {value}%
        </span>
    )
}

// ============================================================
// EU Art. 9 Compliance Heatmap
// ============================================================
export default function ComplianceHeatmap({
    grades,
    compact = false,
}: {
    grades:   BandGradeSummary[]
    compact?: boolean
}) {
    const nonCompliant = grades.filter(g => g.exceeds_5pct)
    const compliant    = grades.filter(g => !g.exceeds_5pct && g.internal_n != null)
    const noData       = grades.filter(g => g.internal_n == null || g.internal_n === 0)

    return (
        <div>
            {/* EU compliance banner */}
            {!compact && (
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            EU-Richtlinie 2023/970 · Art. 9 — Entgeltberichterstattung nach Entgeltkategorien
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-pl-red)' }}>
                            {nonCompliant.length} nicht konform
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--color-pl-green)' }}>
                            {compliant.length} konform
                        </span>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-pl-border)' }}>
                            <th className="text-left pb-2 pr-3 font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                Gruppe
                            </th>
                            <th className="text-right pb-2 px-2 font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                n
                            </th>
                            <th className="text-right pb-2 px-2 font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                ♀ Median
                                <Tip text="Medianeinkommen aller Frauen (Grundgehalt, brutto/jährlich). Quelle: importierte Mitarbeiterdaten." />
                            </th>
                            <th className="text-right pb-2 px-2 font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                ♂ Median
                                <Tip text="Medianeinkommen aller Männer (Grundgehalt, brutto/jährlich). Quelle: importierte Mitarbeiterdaten." />
                            </th>
                            <th className="text-right pb-2 px-2 font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                Intra-Lücke
                                <Tip text="Lohnlücke innerhalb derselben Entgeltgruppe: (♂ Median − ♀ Median) ÷ ♂ Median × 100. EU Art. 9 fordert Berichterstattung bei ≥ 5%." />
                            </th>
                            {!compact && <>
                                <th className="text-right pb-2 px-2 font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    Compa ♀
                                    <Tip text="Compa-Ratio Frauen = ♀ Median ÷ Bandmitte × 100. Werte unter 87,5% gelten als Untervergütungsrisiko (EU Art. 4)." />
                                </th>
                                <th className="text-right pb-2 px-2 font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    Compa ♂
                                    <Tip text="Compa-Ratio Männer = ♂ Median ÷ Bandmitte × 100." />
                                </th>
                                <th className="text-right pb-2 px-2 font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    Markt P50
                                    <Tip text="Externer Marktmedian (manuell eingetragen). Market Ratio = interner Median ÷ Markt P50 × 100." />
                                </th>
                            </>}
                            <th className="text-center pb-2 pl-3 font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                EU Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {grades.map(g => {
                            const gap       = g.intra_grade_gap_pct
                            const compliant = !g.exceeds_5pct
                            const hasData   = g.internal_n != null && g.internal_n > 0
                            const rowBg     = !hasData ? 'transparent'
                                : g.exceeds_5pct ? 'rgba(239,68,68,0.04)' : 'transparent'

                            return (
                                <tr key={g.id} style={{ borderBottom: '1px solid var(--color-pl-border)', background: rowBg }}>
                                    {/* Grade label */}
                                    <td className="py-2.5 pr-3 font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                        {g.job_grade}
                                        {g.level_label && (
                                            <span className="ml-1 font-normal" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                · {g.level_label}
                                            </span>
                                        )}
                                    </td>

                                    {/* Count */}
                                    <td className="py-2.5 px-2 text-right" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        {g.internal_n ?? '—'}
                                    </td>

                                    {/* Female median */}
                                    <td className="py-2.5 px-2 text-right" style={{ color: 'var(--color-pl-accent)' }}>
                                        {hasData ? eur(g.internal_female_median) : '—'}
                                    </td>

                                    {/* Male median */}
                                    <td className="py-2.5 px-2 text-right" style={{ color: 'var(--color-pl-brand-light)' }}>
                                        {hasData ? eur(g.internal_male_median) : '—'}
                                    </td>

                                    {/* Intra-grade gap */}
                                    <td className="py-2.5 px-2 text-right font-bold" style={{
                                        color: !hasData ? 'var(--color-pl-text-tertiary)'
                                            : gap == null ? 'var(--color-pl-text-tertiary)'
                                            : Math.abs(gap) >= 5 ? 'var(--color-pl-red)' : 'var(--color-pl-green)',
                                    }}>
                                        {hasData ? pct(gap) : '—'}
                                    </td>

                                    {/* Compa-Ratio columns (non-compact only) */}
                                    {!compact && <>
                                        <td className="py-2.5 px-2 text-right">
                                            <CompaChip value={compaRatio(g.internal_female_median, g.mid_salary)} />
                                        </td>
                                        <td className="py-2.5 px-2 text-right">
                                            <CompaChip value={compaRatio(g.internal_male_median, g.mid_salary)} />
                                        </td>
                                        <td className="py-2.5 px-2 text-right" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                            {g.market_p50 != null ? (
                                                <span title={`Quelle: ${g.market_source ?? '?'} ${g.market_year ?? ''}`}>
                                                    {eur(g.market_p50)}
                                                </span>
                                            ) : '—'}
                                        </td>
                                    </>}

                                    {/* EU status */}
                                    <td className="py-2.5 pl-3 text-center">
                                        {!hasData ? (
                                            <span title="Keine Mitarbeiterdaten" style={{ color: 'var(--color-pl-text-tertiary)' }}>—</span>
                                        ) : compliant ? (
                                            <span title="Lücke < 5% — konform" style={{ fontSize: 16 }}>🟢</span>
                                        ) : (
                                            <span title={`Lücke ${pct(gap)} ≥ 5% — EU Art. 10 Handlungspflicht`} style={{ fontSize: 16 }}>🔴</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}

                        {noData.length > 0 && grades.length === noData.length && (
                            <tr>
                                <td colSpan={compact ? 6 : 9} className="py-6 text-center text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    Noch keine Mitarbeiterdaten berechnet. Klicken Sie auf „Interne Bänder berechnen".
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {!compact && (
                <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid var(--color-pl-border)' }}>
                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Gemäß Art. 9 RL 2023/970 sind Arbeitgeber mit ≥ 100 Beschäftigten verpflichtet, Entgeltinformationen
                        nach Entgeltkategorie und Geschlecht zu veröffentlichen. Eine Lücke von ≥ 5% löst nach Art. 10
                        eine Begründungspflicht aus.
                    </p>
                    {grades.some(g => g.auto_computed && (g.min_salary == null || g.min_salary === 0)) && (
                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            * Compa-Ratio basiert auf dem internen Median als Referenzpunkt (kein manuelles Band definiert).
                            Für präzisere Werte definieren Sie Bandgrenzen (Min/Mid/Max) im Entgeltband-Modul.
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}