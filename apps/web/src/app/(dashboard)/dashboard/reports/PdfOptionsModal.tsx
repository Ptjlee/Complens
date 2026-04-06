'use client'

import { useState } from 'react'
import { X, Download, FileText, Settings } from 'lucide-react'
import { useTranslations } from 'next-intl'

// ── Types ───────────────────────────────────────────────────

export type PdfOptions = {
    // Content
    companyName:    string
    reportTitle:    string
    includeSections: {
        executiveSummary: boolean
        departments:      boolean
        grades:           boolean
        quartiles:        boolean
        explanations:     boolean
        remediation:      boolean
        salaryBands:      boolean
        declaration:      boolean
    }
    // Signature lines (up to 3)
    signatories: [string, string, string]
}

function defaultOptions(orgName: string, year: number, t: (key: string, values?: Record<string, any>) => string, reportName?: string): PdfOptions {
    return {
        companyName:    orgName,
        reportTitle:    reportName ?? t('defaultReportTitle', { year }),
        includeSections: {
            executiveSummary: true,
            departments:      false,   // Not mandated by EU Art. 9 — off by default
            grades:           true,
            quartiles:        true,
            explanations:     true,
            remediation:      true,
            salaryBands:      true,
            declaration:      true,
        },
        signatories: [t('sigHrLead'), t('sigManagement'), t('sigWorksCouncil')],
    }
}

// ── Build the download URL ───────────────────────────────────

export function buildPdfUrl(analysisId: string, opts: PdfOptions): string {
    const p = new URLSearchParams({
        companyName:  opts.companyName,
        reportTitle:  opts.reportTitle,
        sig0:         opts.signatories[0],
        sig1:         opts.signatories[1],
        sig2:         opts.signatories[2],
        sections:     Object.entries(opts.includeSections)
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join(','),
    })
    return `/api/reports/${analysisId}/pdf?${p.toString()}`
}

// ── Modal ───────────────────────────────────────────────────

const SECTION_KEYS = [
    { key: 'executiveSummary', labelKey: 'sectionExecSummary' },
    { key: 'departments',      labelKey: 'sectionDepartments' },
    { key: 'salaryBands',      labelKey: 'sectionSalaryBands' },
    { key: 'grades',           labelKey: 'sectionGrades' },
    { key: 'quartiles',        labelKey: 'sectionQuartiles' },
    { key: 'explanations',     labelKey: 'sectionExplanations' },
    { key: 'remediation',      labelKey: 'sectionRemediation' },
    { key: 'declaration',      labelKey: 'sectionDeclaration' },
] as const

export default function PdfOptionsModal({
    analysisId,
    orgName,
    reportYear,
    reportName,
    onClose,
}: {
    analysisId: string
    orgName:    string
    reportYear: number
    reportName?: string
    onClose:    () => void
}) {
    const t = useTranslations('report')
    const [opts, setOpts] = useState<PdfOptions>(() => defaultOptions(orgName, reportYear, t, reportName))

    function toggleSection(key: keyof PdfOptions['includeSections']) {
        setOpts(prev => ({
            ...prev,
            includeSections: { ...prev.includeSections, [key]: !prev.includeSections[key] },
        }))
    }

    function setSig(i: 0 | 1 | 2, val: string) {
        setOpts(prev => {
            const next: [string, string, string] = [...prev.signatories] as [string, string, string]
            next[i] = val
            return { ...prev, signatories: next }
        })
    }

    const url = buildPdfUrl(analysisId, opts)
    const anySection = Object.values(opts.includeSections).some(Boolean)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: 'var(--color-pl-border)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
                            <Settings size={15} style={{ color: '#60a5fa' }} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{ t('pdfOptions') }</p>
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{ t('pdfOptionsSubtitle') }</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg"
                        style={{ color: 'var(--color-pl-text-tertiary)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-pl-action-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <X size={17} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-6">

                    {/* ── Branding ── */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-3"
                            style={{ color: 'var(--color-pl-text-tertiary)' }}>{ t('coverPage') }</p>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    {t('companyName')}
                                </label>
                                <input
                                    type="text"
                                    value={opts.companyName}
                                    onChange={e => setOpts(o => ({ ...o, companyName: e.target.value }))}
                                    className="input-base text-sm w-full"
                                    placeholder={t('companyNamePlaceholder')}
                                />
                            </div>
                            <div>
                                <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    {t('reportTitleLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={opts.reportTitle}
                                    onChange={e => setOpts(o => ({ ...o, reportTitle: e.target.value }))}
                                    className="input-base text-sm w-full"
                                    placeholder={t('reportTitlePlaceholder')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Sections ── */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-3"
                            style={{ color: 'var(--color-pl-text-tertiary)' }}>{ t('includedSections') }</p>
                        <div className="space-y-2">
                            {SECTION_KEYS.map(({ key, labelKey }) => {
                                const active = opts.includeSections[key]
                                return (
                                    <button key={key}
                                        onClick={() => toggleSection(key)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm text-left transition-all"
                                        style={{
                                            background: active ? 'rgba(59,130,246,0.08)' : 'var(--theme-pl-action-ghost)',
                                            border: `1px solid ${active ? 'rgba(59,130,246,0.3)' : 'var(--color-pl-border)'}`,
                                        }}>
                                        <span style={{ color: active ? 'var(--color-pl-text-primary)' : 'var(--color-pl-text-tertiary)' }}>
                                            {t(labelKey)}
                                        </span>
                                        <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                                            style={{
                                                background: active ? '#3b82f6' : 'transparent',
                                                border: `1.5px solid ${active ? '#3b82f6' : 'var(--color-pl-text-tertiary)'}`,
                                            }}>
                                            {active && (
                                                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                                    <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* ── Signatories ── */}
                    {opts.includeSections.declaration && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide mb-3"
                                style={{ color: 'var(--color-pl-text-tertiary)' }}>{ t('signatureLines') }</p>
                            <div className="space-y-2">
                                {([0, 1, 2] as const).map(i => (
                                    <div key={i}>
                                        <label className="text-xs mb-1 block"
                                            style={{ color: 'var(--color-pl-text-secondary)' }}>
                                            {t('signatureLine', { num: i + 1 })}
                                        </label>
                                        <input
                                            type="text"
                                            value={opts.signatories[i]}
                                            onChange={e => setSig(i, e.target.value)}
                                            className="input-base text-sm w-full"
                                            placeholder={t('signatoryPlaceholder', { num: i + 1 })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t flex gap-3"
                    style={{ borderColor: 'var(--color-pl-border)', background: 'var(--theme-pl-action-ghost)' }}>
                    <button onClick={onClose} className="btn-ghost flex-1 text-sm">{ t('cancelBtn') }</button>
                    <a
                        href={anySection ? url : '#'}
                        download
                        onClick={!anySection ? e => e.preventDefault() : onClose}
                        className={`btn-primary flex-1 text-sm flex items-center justify-center gap-2 ${!anySection ? 'opacity-40 pointer-events-none' : ''}`}>
                        <Download size={14} /> { t('downloadPdf') }
                    </a>
                </div>
            </div>
        </div>
    )
}
