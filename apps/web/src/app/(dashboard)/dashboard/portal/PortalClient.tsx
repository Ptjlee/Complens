'use client'

import { useState, useMemo } from 'react'
import { Search, Info, CheckCircle2, AlertTriangle, FileText, Download, BarChart3 } from 'lucide-react'
import type { AnalysisResult } from '@/lib/calculations/types'

export default function PortalClient({ analysis }: { analysis: any | null }) {
    const [search, setSearch] = useState('')
    
    if (!analysis) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>Auskunftsrecht (Art. 7)</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>Mitarbeiterinformation nach EU-RL 2023/970</p>
                </div>
                <div className="glass-card p-12 text-center" style={{ borderStyle: 'dashed' }}>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>Noch keine Analysen vorhanden</p>
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
                <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>Auskunftsrecht (Art. 7)</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    Bereitstellung von Entgeltinformationen an Mitarbeitende gem. EU-RL 2023/970
                </p>
            </div>

            <div className="glass-card p-5 max-w-2xl">
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Mitarbeiter suchen (Name oder Personal-ID)
                </label>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-pl-text-tertiary)' }} />
                    <input 
                        type="text" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Z.B. EMP-12345 oder Max Mustermann"
                        className="w-full bg-black/20 border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                    />
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    Datenbasis: {analysis.name} ({analysis.datasets?.reporting_year})
                </p>
            </div>

            {search.length > 2 && !employee && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2 max-w-2xl">
                    <AlertTriangle size={16} /> Keine Mitarbeitenden unter diesem Suchbegriff gefunden.
                </div>
            )}

            {employee && gradeInfo && (
                <div className="glass-card p-6 max-w-2xl border-l-4" style={{ borderLeftColor: 'var(--color-pl-brand)' }}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>Mitarbeiterinformation</h2>
                            <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                {employee.first_name || employee.last_name ? `${employee.first_name || ''} ${employee.last_name || ''}`.trim() + ' — ' : ''}ID: {employee.employee_id}
                            </p>
                        </div>
                        <div className="px-3 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-semibold">
                            Art. 7 Export (Entwurf)
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Section 1: Kriterien */}
                        <div>
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                                <Info size={14} style={{ color: 'var(--color-pl-brand)' }} />
                                Objektive Kriterien der Einstufung
                            </h3>
                            <div className="bg-black/20 p-3 rounded-md text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                <p><strong style={{ color: 'var(--color-pl-text-primary)' }}>Vergleichsgruppe (Kohorte):</strong> {employee.job_grade ?? '—'}</p>
                                <p className="mt-1 text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    Die Kriterien für die Festlegung der regelmäßigen Grundvergütung basieren auf objektiven, 
                                    geschlechtsneutralen Faktoren wie Aufgabenkomplexität, Verantwortung und Marktwert der Position.
                                </p>
                            </div>
                        </div>

                        {/* Section 2: Own Pay vs Average */}
                        <div>
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                                <BarChart3 size={14} style={{ color: 'var(--color-pl-brand)' }} />
                                Durchschnittliche Gehaltsstruktur (Bruttostundenverdienst)
                            </h3>
                            <div className="overflow-hidden rounded-md border text-sm" style={{ borderColor: 'var(--color-pl-border)' }}>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-black/40">
                                            <th className="px-3 py-2 font-medium" style={{ color: 'var(--color-pl-text-tertiary)' }}>Vergleichsgruppe: {employee.job_grade}</th>
                                            <th className="px-3 py-2 font-medium text-right" style={{ color: 'var(--color-pl-text-tertiary)' }}>Mittelwert</th>
                                            <th className="px-3 py-2 font-medium text-right" style={{ color: 'var(--color-pl-text-tertiary)' }}>Median</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <tr>
                                            <td className="px-3 py-2" style={{ color: 'var(--color-pl-text-secondary)' }}>Davon Frauen</td>
                                            <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--color-pl-text-primary)' }}>{fmtHr(gradeInfo.gap.female_mean_salary)}</td>
                                            <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--color-pl-text-primary)' }}>{fmtHr(gradeInfo.gap.female_median_salary)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2" style={{ color: 'var(--color-pl-text-secondary)' }}>Davon Männer</td>
                                            <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--color-pl-text-primary)' }}>{fmtHr(gradeInfo.gap.male_mean_salary)}</td>
                                            <td className="px-3 py-2 text-right font-mono" style={{ color: 'var(--color-pl-text-primary)' }}>{fmtHr(gradeInfo.gap.male_median_salary)}</td>
                                        </tr>
                                        {/* Optional: their own pay */}
                                        <tr className="bg-slate-50 dark:bg-white/5">
                                            <td className="px-3 py-2 font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>Ihr Entgelt (Analyse-Stichtag)</td>
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
                                <Download size={14} /> PDF generieren / Drucken
                            </button>
                            <p className="text-center text-xs mt-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                Nach Art. 7 der Richtlinie 2023/970 ist diese Auskunft binnen zwei Monaten zu erteilen.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
