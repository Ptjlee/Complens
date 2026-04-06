'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import type { BandGradeSummary } from '@/lib/band/getBandContext'

// ============================================================
// Tooltip helper
// ============================================================
function Tip({ text }: { text: string }) {
    const [show, setShow] = useState(false)
    return (
        <span className="relative inline-flex items-center" style={{ cursor: 'help' }}>
            <Info size={11}
                style={{ color: 'var(--color-pl-text-tertiary)' }}
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
            />
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
// Single grade band row — horizontal box plot
// ============================================================
function GradeBandRow({
    grade,
    mode,
    globalMax,
    eur,
    t,
}: {
    grade: BandGradeSummary
    mode: 'base' | 'total'
    globalMax: number
    eur: (v: number | null) => string
    t: ReturnType<typeof useTranslations>
}) {
    const min    = mode === 'base' ? grade.internal_min_base    : grade.internal_min_total
    const max    = mode === 'base' ? grade.internal_max_base    : grade.internal_max_total
    const median = mode === 'base' ? grade.internal_median_base : grade.internal_median_total

    // P25/P75 for total: scale from base IQR ratio if dedicated columns are absent
    const baseRange = (grade.internal_max_base ?? 0) - (grade.internal_min_base ?? 0)
    const totalRange = (max ?? 0) - (min ?? 0)
    const p25Base = grade.internal_p25_base
    const p75Base = grade.internal_p75_base
    const p25 = mode === 'base'
        ? p25Base
        : (p25Base != null && baseRange > 0 && min != null)
            ? min + (p25Base - (grade.internal_min_base ?? 0)) / baseRange * totalRange
            : null
    const p75 = mode === 'base'
        ? p75Base
        : (p75Base != null && baseRange > 0 && min != null)
            ? min + (p75Base - (grade.internal_min_base ?? 0)) / baseRange * totalRange
            : null

    const fMed   = grade.internal_female_median
    const mMed   = grade.internal_male_median

    const targetMin = grade.min_salary
    const targetMax = grade.max_salary
    const mktP25    = grade.market_p25
    const mktP75    = grade.market_p75

    // Nothing to draw
    if (!min && !max && !median) {
        return (
            <div className="flex items-center gap-3 py-3 border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                <span className="text-xs font-bold w-10 flex-shrink-0" style={{ color: 'var(--color-pl-text-primary)' }}>{grade.job_grade}</span>
                <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('noEmployeeDataForGrade')}</span>
            </div>
        )
    }

    const scale = (v: number | null) => v == null ? null : Math.max(0, Math.min(100, (v / globalMax) * 100))
    const sMin    = scale(min)
    const sP25    = scale(p25)
    const sMedian = scale(median)
    const sP75    = scale(p75)
    const sMax    = scale(max)
    const sFMed   = scale(fMed)
    const sMeMed  = scale(mMed)
    const sTMin   = scale(targetMin)
    const sTMax   = scale(targetMax)
    const sMktP25 = scale(mktP25)
    const sMktP75 = scale(mktP75)

    const gapPct = grade.intra_grade_gap_pct
    const gapColor = gapPct != null && Math.abs(gapPct) >= 5
        ? 'var(--color-pl-red)'
        : 'var(--color-pl-green)'

    return (
        <div className="py-3 border-b last:border-b-0" style={{ borderColor: 'var(--color-pl-border)' }}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold w-10 flex-shrink-0" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {grade.job_grade}
                </span>
                {grade.internal_n != null && (
                    <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{grade.internal_n} {t('employeesShort')}</span>
                )}
                {gapPct != null && (
                    <span className="text-xs font-semibold ml-auto" style={{ color: gapColor }}>
                        ♀/♂ {gapPct > 0 ? '+' : ''}{gapPct.toFixed(1)}%
                    </span>
                )}
            </div>

            {/* The chart track */}
            <div className="relative h-6 mx-10" style={{ background: 'var(--theme-pl-action-hover)', borderRadius: 4 }}>

                {/* Market P25–P75 background band */}
                {sMktP25 != null && sMktP75 != null && (
                    <div
                        className="absolute h-full rounded"
                        title={t('marketDataTitle', { p25: eur(mktP25), p75: eur(mktP75), source: grade.market_source ?? '' })}
                        style={{
                            left:       `${sMktP25}%`,
                            width:      `${sMktP75 - sMktP25}%`,
                            background: 'rgba(148,163,184,0.18)',
                            border:     '1px dashed rgba(148,163,184,0.5)',
                            zIndex:     1,
                        }}
                    />
                )}

                {/* Target band outline (dashed) */}
                {sTMin != null && sTMax != null && sTMin < sTMax && (
                    <div
                        className="absolute h-full"
                        title={t('targetBandTitle', { min: eur(targetMin), max: eur(targetMax) })}
                        style={{
                            left:   `${sTMin}%`,
                            width:  `${sTMax - sTMin}%`,
                            border: '2px dashed rgba(99,102,241,0.55)',
                            borderRadius: 3,
                            zIndex: 2,
                        }}
                    />
                )}

                {/* Min–Max thin line */}
                {sMin != null && sMax != null && (
                    <div
                        className="absolute"
                        style={{
                            top:        '46%',
                            left:       `${sMin}%`,
                            width:      `${sMax - sMin}%`,
                            height:     2,
                            background: 'var(--color-pl-brand)',
                            zIndex:     3,
                        }}
                    />
                )}

                {/* IQR box (P25–P75) */}
                {sP25 != null && sP75 != null && (
                    <div
                        className="absolute"
                        title={`P25: ${eur(p25)} — P75: ${eur(p75)}`}
                        style={{
                            top:        '20%',
                            height:     '60%',
                            left:       `${sP25}%`,
                            width:      `${sP75 - sP25}%`,
                            background: 'var(--color-pl-brand)',
                            opacity:    0.55,
                            borderRadius: 2,
                            zIndex:     4,
                        }}
                    />
                )}

                {/* Median tick */}
                {sMedian != null && (
                    <div
                        className="absolute"
                        title={`Median: ${eur(median)}`}
                        style={{
                            top:       '10%',
                            height:    '80%',
                            left:      `${sMedian}%`,
                            width:     2,
                            background: 'var(--color-pl-brand)',
                            zIndex:     5,
                            transform: 'translateX(-50%)',
                        }}
                    />
                )}

                {/* Female median ◆ */}
                {sFMed != null && (
                    <div
                        className="absolute"
                        title={t('femaleMedTitle', { value: eur(fMed), count: grade.internal_female_count ?? 0 })}
                        style={{
                            top:       '50%',
                            left:      `${sFMed}%`,
                            transform: 'translate(-50%, -50%) rotate(45deg)',
                            width:     8, height: 8,
                            background: 'var(--color-pl-accent)',
                            zIndex:     6,
                        }}
                    />
                )}

                {/* Male median ● */}
                {sMeMed != null && (
                    <div
                        className="absolute rounded-full"
                        title={t('maleMedTitle', { value: eur(mMed), count: grade.internal_male_count ?? 0 })}
                        style={{
                            top:       '50%',
                            left:      `${sMeMed}%`,
                            transform: 'translate(-50%,-50%)',
                            width:     8, height: 8,
                            background: 'var(--color-pl-brand-light)',
                            zIndex:     6,
                        }}
                    />
                )}
            </div>

            {/* Min / Max labels */}
            <div className="flex justify-between mx-10 mt-1">
                <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)', fontSize: 10 }}>
                    {eur(min)}
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--color-pl-text-secondary)', fontSize: 10 }}>
                    {t('medianLabel', { value: eur(median) })}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)', fontSize: 10 }}>
                    {eur(max)}
                </span>
            </div>
        </div>
    )
}

// ============================================================
// Main component
// ============================================================
export type BandVisualizationMode = 'base' | 'total'

export default function BandVisualizationChart({
    grades,
    compact = false,
}: {
    grades:  BandGradeSummary[]
    compact?: boolean
}) {
    const [mode, setMode] = useState<BandVisualizationMode>('base')
    const t = useTranslations('salaryBands')
    const locale = useLocale()

    const eur = (v: number | null) =>
        v == null ? '—' : v.toLocaleString(locale, { maximumFractionDigits: 0 }) + ' €'

    const visGrades = grades.filter(g => g.internal_n != null && g.internal_n > 0 || g.internal_min_base != null)

    // Global max for scale
    const globalMax = Math.max(
        ...visGrades.map(g => {
            if (mode === 'base') return g.internal_max_base ?? 0
            return g.internal_max_total ?? (g.internal_median_total ?? g.internal_max_base ?? 0) * 1.3
        }), 1
    ) * 1.05 // 5% headroom

    const hasMarket  = visGrades.some(g => g.market_p50 != null)
    const hasTarget  = visGrades.some(g => g.min_salary != null && g.max_salary != null && g.max_salary > 0)
    const hasFemale  = visGrades.some(g => g.internal_female_median != null)

    if (visGrades.length === 0) {
        return (
            <p className="text-sm text-center py-6" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                {t('noEmployeeDataForVis')}
            </p>
        )
    }

    return (
        <div>
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Mode toggle */}
                <div className="flex rounded-lg overflow-hidden text-xs" style={{ border: '1px solid var(--color-pl-border)' }}>
                    {(['base', 'total'] as const).map(m => (
                        <button key={m} onClick={() => setMode(m)} className="px-3 py-1 transition-colors" style={{
                            background: mode === m ? 'var(--theme-pl-action-border)' : 'transparent',
                            color:      mode === m ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)',
                            fontWeight: mode === m ? 600 : 400,
                        }}>
                            {m === 'base' ? t('baseSalary') : t('totalCompensation')}
                        </button>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    <span className="flex items-center gap-1">
                        <span style={{ display: 'inline-block', width: 24, height: 6, background: 'var(--color-pl-brand)', opacity: 0.55, borderRadius: 2 }} />
                        IQR (P25–P75)
                        <Tip text={t('iqrTip')} />
                    </span>
                    <span className="flex items-center gap-1">
                        <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--color-pl-brand)' }} />
                        Median
                        <Tip text={t('medianTip')} />
                    </span>
                    {hasFemale && <>
                        <span className="flex items-center gap-1">
                            <span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--color-pl-accent)', transform: 'rotate(45deg)' }} />
                            ♀ Median
                            <Tip text={t('femaleMedTip')} />
                        </span>
                        <span className="flex items-center gap-1">
                            <span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--color-pl-brand-light)', borderRadius: '50%' }} />
                            ♂ Median
                            <Tip text={t('maleMedTip')} />
                        </span>
                    </>}
                    {hasTarget && (
                        <span className="flex items-center gap-1">
                            <span style={{ display: 'inline-block', width: 20, height: 10, border: '2px dashed rgba(99,102,241,0.55)', borderRadius: 2 }} />
                            {t('targetBandLabel')}
                            <Tip text={t('targetBandTip')} />
                        </span>
                    )}
                    {hasMarket && (
                        <span className="flex items-center gap-1">
                            <span style={{ display: 'inline-block', width: 20, height: 10, background: 'rgba(148,163,184,0.25)', border: '1px dashed rgba(148,163,184,0.5)', borderRadius: 2 }} />
                            {t('marketP25P75Label')}
                            <Tip text={t('marketP25P75Tip')} />
                        </span>
                    )}
                </div>
            </div>

            {/* Band rows */}
            <div>
                {visGrades.map(g => (
                    <GradeBandRow
                        key={g.id}
                        grade={g}
                        mode={mode}
                        globalMax={globalMax}
                        eur={eur}
                        t={t}
                    />
                ))}
            </div>

            {!compact && (
                <p className="text-xs mt-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('footerDisclaimer')}
                </p>
            )}
        </div>
    )
}
