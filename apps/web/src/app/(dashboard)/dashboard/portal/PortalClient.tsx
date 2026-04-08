'use client'

import { useState, useMemo } from 'react'
import { Search, Info, CheckCircle2, AlertTriangle, FileText, Download, BarChart3, Settings } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { AnalysisResult } from '@/lib/calculations/types'

export default function PortalClient({ analysis, payCriteriaText }: { analysis: any | null; payCriteriaText: string | null }) {
    const [search, setSearch] = useState('')
    const t = useTranslations('portal')

    if (!analysis) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('title')}</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('subtitleShort')}</p>
                </div>
                <div className="glass-card p-12 text-center" style={{ borderStyle: 'dashed' }}>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('noAnalyses')}</p>
                </div>
            </div>
        )
    }

    const r = analysis.results as AnalysisResult
    const flags = r.individual_flags

    // Find the searched employee
    const term = search.trim().toLowerCase()
    const employee = term.length > 2 ? flags.find(f => {
        const idMatch = f.employee_id.toLowerCase().includes(term)
        const nameMatch = `${f.first_name || ''} ${f.last_name || ''}`.toLowerCase().includes(term)
        const nameMatchRev = `${f.last_name || ''} ${f.first_name || ''}`.toLowerCase().includes(term)
        return idMatch || nameMatch || nameMatchRev
    }) : null
    
    // Find grade info
    const gradeInfo = employee ? r.by_grade.find(g => g.grade === employee.job_grade) : null

    // Helper functions
    const fmtHr = (v: number | null | undefined) => v != null ? `${v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/h` : '—'

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('title')}</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('subtitle')}
                </p>
            </div>

            <div className="glass-card p-5 max-w-2xl">
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('searchLabel')}
                </label>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-pl-text-tertiary)' }} />
                    <input 
                        type="text" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        className="w-full bg-black/20 border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                    />
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('dataBasis', { name: analysis.name, year: analysis.datasets?.reporting_year })}
                </p>
            </div>

            {search.length > 2 && !employee && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2 max-w-2xl">
                    <AlertTriangle size={16} /> {t('notFound')}
                </div>
            )}

            {employee && gradeInfo && (
                <div className="glass-card p-6 max-w-2xl border-l-4" style={{ borderLeftColor: 'var(--color-pl-brand)' }}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('infoTitle')}</h2>
                            <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                {employee.first_name || employee.last_name ? `${employee.first_name || ''} ${employee.last_name || ''}`.trim() + ' — ' : ''}ID: {employee.employee_id}
                            </p>
                        </div>
                        <div className="px-3 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-semibold">
                            {t('exportBadge')}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Section 1: Kriterien */}
                        <div>
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                                <Info size={14} style={{ color: 'var(--color-pl-brand)' }} />
                                {t('criteriaTitle')}
                            </h3>
                            <div className="bg-black/20 p-3 rounded-md text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                <p><strong style={{ color: 'var(--color-pl-text-primary)' }}>{t('cohortLabel')}</strong> {employee.job_grade ?? '—'}</p>
                                {payCriteriaText ? (
                                    <p className="mt-1 text-xs whitespace-pre-wrap" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        {payCriteriaText}
                                    </p>
                                ) : (
                                    <>
                                        <p className="mt-1 text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            {t('criteriaDesc')}
                                        </p>
                                        <div className="mt-2 p-2 rounded text-xs flex items-start gap-2"
                                            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--color-pl-amber)' }}>
                                            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                                            <span>
                                                {t('criteriaGenericWarning')}{' '}
                                                <Link href="/dashboard/settings#org" style={{ color: 'var(--color-pl-brand-light)', textDecoration: 'underline' }}>
                                                    {t('criteriaConfigLink')}
                                                </Link>
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Section 2: Own Pay vs Average */}
                        <div>
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                                <BarChart3 size={14} style={{ color: 'var(--color-pl-brand)' }} />
                                {t('salaryTitle')}
                            </h3>
                            <div className="overflow-hidden rounded-md border text-sm" style={{ borderColor: 'var(--color-pl-border)' }}>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-black/40">
                                            <th className="px-3 py-2 font-medium" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('cohortColumnLabel', { grade: employee.job_grade ?? '' })}</th>
                                            <th className="px-3 py-2 font-medium text-right" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('mean')}</th>
                                            <th className="px-3 py-2 font-medium text-right" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('median')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <tr>
                                            <td className="px-3 py-2" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('female')}</td>
                                            <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--color-pl-text-primary)' }}>{fmtHr(gradeInfo.gap.female_mean_salary)}</td>
                                            <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--color-pl-text-primary)' }}>{fmtHr(gradeInfo.gap.female_median_salary)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('male')}</td>
                                            <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--color-pl-text-primary)' }}>{fmtHr(gradeInfo.gap.male_mean_salary)}</td>
                                            <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--color-pl-text-primary)' }}>{fmtHr(gradeInfo.gap.male_median_salary)}</td>
                                        </tr>
                                        {/* Optional: their own pay */}
                                        <tr className="bg-slate-50 dark:bg-white/5">
                                            <td className="px-3 py-2 font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('yourPay')}</td>
                                            <td className="px-3 py-2 text-right font-mono font-semibold" colSpan={2} style={{ color: 'var(--color-pl-brand-light)' }}>
                                                {fmtHr(employee.hourly_rate)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="pt-4 border-t" style={{ borderColor: 'var(--color-pl-border)' }}>
                            <button 
                                className="w-full flex justify-center items-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                                style={{ backgroundColor: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                                onClick={() => window.open(`/api/portal/${analysis.id}/${employee.employee_id}/pdf`, '_blank')}
                            >
                                <Download size={14} /> {t('generatePdf')}
                            </button>
                            <p className="text-center text-xs mt-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {t('legalNote')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
