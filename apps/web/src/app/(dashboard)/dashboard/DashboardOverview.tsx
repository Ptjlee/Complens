'use client'

import { type OrgPlanFields, trialDaysLeft } from '@/lib/plans'

import { useState, useCallback, useEffect } from 'react'
import { TrendingDown, TrendingUp, AlertTriangle, BarChart2, ChevronRight, ChevronDown, Database } from 'lucide-react'
import { getAnalysisForDataset } from './analysis/actions'
import type { AnalysisResult } from '@/lib/calculations/types'
import type { TrendPoint } from './analysis/actions'
import { PayGapChartGrid } from '@/components/dashboard/PayGapChartGrid'
import { useTranslations } from 'next-intl'

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
    id: string; name: string; created_at: string
    results: AnalysisResult
    datasets: { name: string; reporting_year: number; employee_count: number | null } | null
}

// ============================================================
// KPI Card
// ============================================================
function KpiCard({ label, value, unit = '%', threshold, description, trend }: {
    label: string; value: number | string; unit?: string
    threshold?: number; description?: string; trend?: 'up' | 'down' | 'neutral'
}) {
    const numVal = typeof value === 'number' ? value : 0
    const color = threshold !== undefined
        ? numVal > threshold       ? 'var(--color-pl-red)'
        : numVal > threshold * 0.6 ? 'var(--color-pl-amber)'
        :                            'var(--color-pl-green)'
        : 'var(--color-pl-brand-light)'
    return (
        <div className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium" style={{ color: 'var(--color-pl-text-secondary)' }}>{label}</p>
                {trend === 'down' && <TrendingDown size={16} style={{ color: 'var(--color-pl-green)' }} />}
                {trend === 'up'   && <TrendingUp   size={16} style={{ color: 'var(--color-pl-red)'   }} />}
            </div>
            <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold" style={{ color }}>
                    {typeof value === 'number' ? value.toFixed(1) : value}
                </span>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>{unit}</span>
            </div>
            {description && <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{description}</p>}
        </div>
    )
}

// ============================================================
// Main component
// ============================================================
// ============================================================
// Multi-year Trend Chart
// ============================================================
function TrendChart({ data }: { data: TrendPoint[] }) {
    const t = useTranslations('dashboard.trend')
    if (data.length < 2) {
        return (
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('title')}</h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('subtitle')}</p>
                    </div>
                </div>
                <p className="text-xs text-center py-6" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('notEnoughData')}
                </p>
            </div>
        )
    }

    const VB_W = 540, VB_H = 110
    const L_PAD = 36, R_PAD = 16, T_PAD = 10, B_PAD = 24
    const PLOT_W = VB_W - L_PAD - R_PAD
    const PLOT_H = VB_H - T_PAD - B_PAD
    const CLIP_ID = 'trend-clip'

    // Include BOTH adjusted and unadjusted in the axis range calculation
    const allVals = data.flatMap(d => [
        (d.gap_adjusted   ?? 0) * 100,
        (d.gap_unadjusted ?? 0) * 100,
    ])
    const rawMin = Math.min(...allVals)
    const rawMax = Math.max(...allVals)
    // 40% headroom above rawMax so neither line clips the top;
    // at least 2 units of breathing room regardless of spread
    const yMax = Math.max(rawMax * 1.4, rawMax + 3, 7)
    const yMin = Math.min(rawMin - 2, -1)
    const yRange = yMax - yMin || 1

    const toX = (i: number) => L_PAD + (i / Math.max(1, data.length - 1)) * PLOT_W
    const toY = (v: number) => T_PAD + PLOT_H - ((v - yMin) / yRange) * PLOT_H
    const threshold5Y = toY(5)

    const adjPts = data.map((d, i) => `${toX(i)},${toY((d.gap_adjusted ?? 0) * 100)}`).join(' ')

    return (
        <div className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('title')}</h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('subtitle')}</p>
                </div>
                <div className="flex gap-4 text-xs flex-shrink-0">
                    <span className="flex items-center gap-1.5">
                        <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" stroke="var(--color-pl-brand)" strokeWidth="2"/></svg>
                        <span style={{ color: '#60a5fa' }}>{t('adjusted')}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" stroke="rgba(239,68,68,0.6)" strokeWidth="1" strokeDasharray="3 2"/></svg>
                        <span style={{ color: 'rgba(239,68,68,0.7)' }}>{t('threshold5')}</span>
                    </span>
                </div>
            </div>
            <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full">
                {/* ClipPath — prevents lines from rendering outside the plot box */}
                <defs>
                    <clipPath id={CLIP_ID}>
                        <rect x={L_PAD} y={T_PAD} width={PLOT_W} height={PLOT_H} />
                    </clipPath>
                </defs>
                {/* Background */}
                <rect x={L_PAD} y={T_PAD} width={PLOT_W} height={PLOT_H} fill="var(--color-pl-surface)" rx={3} />
                {/* 5% threshold line */}
                {threshold5Y >= T_PAD && threshold5Y <= T_PAD + PLOT_H && (
                    <>
                        <line x1={L_PAD} y1={threshold5Y} x2={L_PAD + PLOT_W} y2={threshold5Y}
                            stroke="rgba(239,68,68,0.5)" strokeWidth={1} strokeDasharray="4 3" />
                        <text x={L_PAD + PLOT_W + 2} y={threshold5Y + 3} fontSize={5} fill="rgba(239,68,68,0.6)">5%</text>
                    </>
                )}
                {/* Zero line */}
                <line x1={L_PAD} y1={toY(0)} x2={L_PAD + PLOT_W} y2={toY(0)}
                    stroke="var(--color-pl-border)" strokeWidth={1} />
                {/* Unadjusted line removed — adjusted only */}
                {/* Adjusted line — clipped to plot box */}
                <polyline points={adjPts} fill="none" stroke="var(--color-pl-brand)" strokeWidth={2} strokeOpacity={0.9} clipPath={`url(#${CLIP_ID})`} />
                {/* Data points */}
                {data.map((d, i) => {
                    const cx = toX(i)
                    const adjV = (d.gap_adjusted ?? d.gap_unadjusted ?? 0) * 100
                    const cy = toY(adjV)
                    const dotColor = d.exceeds_5pct ? '#ef4444' : 'var(--color-pl-brand)'
                    return (
                        <g key={d.year}>
                            <circle cx={cx} cy={cy} r={3.5} fill={dotColor} stroke="var(--color-pl-surface)" strokeWidth={1.5} />
                            <text x={cx} y={T_PAD + PLOT_H + 10} textAnchor="middle" fontSize={5} fill="var(--color-pl-text-tertiary)">{d.year}</text>
                            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={4.5}
                                fill={dotColor} fontFamily="Helvetica-Bold">
                                {adjV >= 0 ? '+' : ''}{adjV.toFixed(1)}%
                            </text>
                        </g>
                    )
                })}
                {/* Y-axis labels — generated dynamically to match actual scale */}
                {Array.from({ length: Math.ceil(yMax / 5) + 1 }, (_, i) => i * 5)
                    .filter(v => v >= yMin && v <= yMax)
                    .map(v => (
                        <text key={v} x={L_PAD - 3} y={toY(v) + 2.5} textAnchor="end" fontSize={4.5} fill="var(--color-pl-text-tertiary)">{v}%</text>
                    ))}
            </svg>
        </div>
    )
}

export default function DashboardOverview({ datasets, trend, org }: { datasets: Dataset[]; trend: TrendPoint[]; org?: OrgPlanFields }) {
    const t = useTranslations('dashboard')
    const [selectedId, setSelectedId] = useState(datasets[0]?.id ?? '')
    const [analysis, setAnalysis]     = useState<AnalysisData | null>(null)
    const [loading, setLoading]       = useState(false)

    const loadDataset = useCallback(async (id: string) => {
        if (!id) return
        setLoading(true)
        const data = await getAnalysisForDataset(id) as AnalysisData | null
        setAnalysis(data)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (datasets.length > 0) loadDataset(datasets[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function handleChange(id: string) { setSelectedId(id); loadDataset(id) }

    const results  = analysis?.results ?? null
    const unadjGap = results ? Math.abs(results.overall.unadjusted_median * 100) : 0
    const adjGap   = results ? Math.abs((results.overall.adjusted_median ?? results.overall.unadjusted_median) * 100) : 0
    const empCount = results?.total_employees ?? 0
    const atRisk   = results?.departments_exceeding_5pct.length ?? 0
    const lastDate = analysis?.created_at
        ? new Date(analysis.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
        : null
    const selectedDs = datasets.find(d => d.id === selectedId)
    const isTrial = org?.plan === 'trial'
    const daysLeft = org ? trialDaysLeft(org) : 0

    return (
        <div className="space-y-6">
            {/* ── Trial Banner ── */}
            {isTrial && (
                <div className="glass-card p-5 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.02) 100%)', borderLeft: '4px solid var(--color-pl-amber)' }}>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
                            <span className="text-xl">🚀</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                {daysLeft > 0 ? t('trial.activeTitle') : t('trial.expiredTitle')}
                            </h3>
                            <p className="text-xs mt-1 max-w-lg" style={{ color: 'var(--color-pl-text-secondary)', lineHeight: 1.5 }}>
                               {daysLeft > 0 ? t('trial.activeDesc', { days: daysLeft }) : t('trial.expiredDesc')}
                            </p>
                            <div className="mt-3 flex gap-3">
                                <a href="/dashboard/settings" className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:brightness-110 shadow-sm" style={{ background: 'var(--color-pl-amber)', color: '#fff' }}>{t('trial.choosePlan')}</a>
                            </div>
                        </div>
                    </div>
                    {daysLeft > 0 && (
                        <div className="hidden lg:flex flex-col items-end pr-2">
                            <span className="text-3xl font-bold" style={{ color: 'var(--color-pl-amber)' }}>{daysLeft}</span>
                            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('trial.daysLeft')}</span>
                        </div>
                    )}
                </div>
            )}


            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('overview.title')}</h1>
                    {lastDate && (
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('overview.analysisOf', { date: lastDate })}
                        </p>
                    )}
                </div>
            </div>

            {/* ── Dataset picker bar ── */}
            {datasets.length > 0 && (
                <div className="glass-card p-3 flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-shrink-0" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        <Database size={14} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('overview.dataset')}</span>
                    </div>

                    {/* Vertical divider */}
                    <div className="w-px self-stretch flex-shrink-0" style={{ background: 'var(--color-pl-border)' }} />

                    <div className="relative flex-shrink-0" style={{ maxWidth: 280 }}>
                        <select
                            value={selectedId}
                            onChange={e => handleChange(e.target.value)}
                            className="w-full appearance-none text-sm py-1.5 pl-3 pr-8 rounded-lg cursor-pointer"
                            style={{
                                background: 'var(--theme-pl-action-hover)',
                                border:     '1px solid var(--color-pl-border)',
                                color:      'var(--color-pl-text-primary)',
                                outline:    'none',
                                overflow:   'hidden',
                                textOverflow: 'ellipsis',
                            }}>
                            {datasets.map(d => (
                                <option key={d.id} value={d.id} style={{ background: 'var(--color-pl-surface)' }}>
                                    {d.name} · {d.reporting_year} ({d.employee_count ?? '?'} MA)
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: 'var(--color-pl-text-tertiary)' }} />
                    </div>

                    {selectedDs && (
                        <span className="text-xs flex-shrink-0 whitespace-nowrap" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('overview.lastAnalysis', { date: lastDate ?? '—' })}
                        </span>
                    )}
                </div>
            )}


            {/* ── Skeleton ── */}
            {loading && (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="glass-card p-5 animate-pulse">
                            <div className="h-3 w-24 rounded mb-4" style={{ background: 'var(--theme-pl-action-hover)' }} />
                            <div className="h-8 w-16 rounded" style={{ background: 'var(--theme-pl-action-hover)' }} />
                        </div>
                    ))}
                </div>
            )}

            {!loading && results ? (
                <>
                    {/* ── KPI strip: 6 cards ── */}
                    <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
                        <KpiCard label={t('kpi.unadjustedMedian')} value={unadjGap} unit="%" threshold={5}
                            description={t('kpi.medianGapWomenVsMen')} trend={unadjGap > 5 ? 'up' : 'down'} />
                        <KpiCard label={t('kpi.adjustedMedian')} value={adjGap} unit="%" threshold={5}
                            description={t('kpi.wifAdjusted')} trend={adjGap > 5 ? 'up' : 'down'} />
                        <KpiCard label={t('kpi.unadjustedMean')}
                            value={Math.abs((results.overall.unadjusted_mean ?? 0) * 100)} unit="%" threshold={5}
                            description={t('kpi.meanGap')} trend={(results.overall.unadjusted_mean ?? 0) > 0.05 ? 'up' : 'down'} />
                        <KpiCard label={t('kpi.adjustedMean')}
                            value={Math.abs((results.overall.adjusted_mean ?? 0) * 100)} unit="%" threshold={5}
                            description={t('kpi.wifMean')} trend={(results.overall.adjusted_mean ?? 0) > 0.05 ? 'up' : 'down'} />
                        <KpiCard label={t('kpi.employees')} value={empCount} unit="" description={t('kpi.currentDataBasis')} />
                        <KpiCard label={t('kpi.departmentsExceeding')} value={atRisk} unit="" threshold={1}
                            description={t('kpi.jointAssessmentNeeded')} />
                    </div>

                    {/* ── WIF / hours footnote ── */}
                    <p className="text-xs -mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('overview.wifFactors')}: <span style={{ color: 'var(--color-pl-text-secondary)' }}>{results.wif_factors_used.join(', ')}</span>
                        {' · '}{t('overview.hoursCoverage')}: <span style={{ color: results.hours_coverage_pct < 50 ? 'var(--color-pl-amber)' : 'var(--color-pl-text-secondary)' }}>
                            {results.hours_coverage_pct} %
                        </span>
                    </p>

                    {/* ── Alert ── */}
                    {results.overall.exceeds_5pct && (
                        <div className="flex items-start gap-3 p-4 rounded-xl"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <AlertTriangle size={18} style={{ color: 'var(--color-pl-red)', flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-red)' }}>
                                    {t('alert.title')}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    {t('alert.description', { gap: adjGap.toFixed(1) })}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── 2×2 + 1 full-width chart grid (shared component) ── */}
                    <PayGapChartGrid results={results} />

                    {/* ── Multi-year trend ── */}
                    {trend.length >= 1 && <TrendChart data={trend} />}
                </>
            ) : !loading && (
                <div className="glass-card p-6 md:p-10 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                        style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                        <span className="text-2xl">👋</span>
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-center" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('onboarding.title')}
                    </h3>
                    <p className="text-sm mb-8 text-center max-w-md" style={{ color: 'var(--color-pl-text-secondary)', lineHeight: 1.6 }}>
                        {t('onboarding.desc')}
                    </p>

                    <div className="w-full max-w-2xl space-y-3 mb-8">
                        {/* Step 1: Import */}
                        <div className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5" style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: datasets.length > 0 ? 'rgba(52,211,153,0.15)' : 'rgba(59,130,246,0.15)', color: datasets.length > 0 ? '#34d399' : '#60a5fa' }}>
                                {datasets.length > 0 ? '✓' : '1'}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                    {t('onboarding.step1Title')}
                                </h4>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    {t('onboarding.step1Desc')}
                                </p>
                            </div>
                            {datasets.length === 0 ? (
                                <a href="/dashboard/import" className="btn-primary flex-shrink-0 text-xs py-1.5 px-3">{t('onboarding.step1Btn')}</a>
                            ) : (
                                <span className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>{t('onboarding.step1Done')}</span>
                            )}
                        </div>
                        
                        {/* Step 2: Analyse */}
                        <div className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5" style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', opacity: datasets.length === 0 ? 0.6 : 1 }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: datasets.length > 0 ? 'rgba(59,130,246,0.15)' : 'var(--theme-pl-action-hover)', color: datasets.length > 0 ? '#60a5fa' : 'var(--color-pl-text-tertiary)' }}>
                                2
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                    {t('onboarding.step2Title')}
                                </h4>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    {t('onboarding.step2Desc')}
                                </p>
                            </div>
                            <a href="/dashboard/analysis" className={`${datasets.length > 0 ? 'btn-primary' : 'btn-secondary'} flex-shrink-0 text-xs py-1.5 px-3`} style={{ pointerEvents: datasets.length === 0 ? 'none' : 'auto' }}>
                                {datasets.length > 0 ? t('onboarding.step2Btn') : t('onboarding.step2Pending')}
                            </a>
                        </div>

                        {/* Step 3: Berichte */}
                        <div className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-white/5" style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', opacity: 0.6 }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--theme-pl-action-hover)', color: 'var(--color-pl-text-tertiary)' }}>
                                3
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                    {t('onboarding.step3Title')}
                                </h4>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    {t('onboarding.step3Desc')}
                                </p>
                            </div>
                            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-text-tertiary)' }}>{t('onboarding.step3Locked')}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
