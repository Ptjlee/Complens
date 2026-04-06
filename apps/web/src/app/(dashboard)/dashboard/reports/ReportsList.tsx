'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useTranslations, useFormatter } from 'next-intl'
import {
    FileText, Download, CheckCircle2, ShieldAlert,
    Calendar, Users, ExternalLink,
    Archive, Trash2, Loader2, RotateCcw, X, Presentation,
} from 'lucide-react'
import PdfOptionsModal from './PdfOptionsModal'
import { archiveAnalysis, deleteAnalysis, unarchiveAnalysis } from './actions'
import type { AnalysisSummary } from './actions'

type Analysis = AnalysisSummary

function GapBadge({ value, label }: { value: number | null; label: string }) {
    const abs = Math.abs((value ?? 0) * 100)
    const color = abs >= 5
        ? 'var(--color-pl-red)'
        : 'var(--color-pl-green)'
    const sign      = (value ?? 0) >= 0 ? '+' : ''
    const formatted = value === null ? '—' : `${sign}${((value) * 100).toFixed(1)}%`
    return (
        <div>
            <p className="text-xs mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{label}</p>
            <p className="text-xl font-bold" style={{ color }}>{formatted}</p>
        </div>
    )
}

// ── Report card ──────────────────────────────────────────────

function ReportCard({
    a,
    onArchive,
    onUnarchive,
    onDelete,
    onPdfClick,
    isAdmin,
}: {
    a:           Analysis
    onArchive:   (id: string) => void
    onUnarchive: (id: string) => void
    onDelete:    (id: string) => void
    onPdfClick:  (a: Analysis) => void
    isAdmin?:    boolean
}) {
    const t = useTranslations('reports')
    const format = useFormatter()
    const [action, setAction]     = useState<'archive' | 'delete' | null>(null)
    const [pending, startT]       = useTransition()

    const date = format.dateTime(new Date(a.created_at), {
        day: '2-digit', month: 'short', year: 'numeric',
    })
    const isArchived = !!(a as Analysis & { archived_at?: string | null }).archived_at

    function doArchive() {
        startT(async () => {
            if (isArchived) { await unarchiveAnalysis(a.id); onUnarchive(a.id) }
            else            { await archiveAnalysis(a.id);   onArchive(a.id) }
            setAction(null)
        })
    }

    function doDelete() {
        startT(async () => {
            await deleteAnalysis(a.id)
            onDelete(a.id)
            setAction(null)
        })
    }

    return (
        <div className="glass-card p-6 space-y-4" style={{ opacity: isArchived ? 0.6 : 1 }}>
            <div className="flex items-start justify-between gap-6">
                {/* Left: meta */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${a.exceeds_5pct_threshold ? 'status-red' : 'status-green'}`}>
                            {a.exceeds_5pct_threshold
                                ? <><ShieldAlert size={11} /> {t('exceeds5pct')}</>
                                : <><CheckCircle2 size={11} /> {t('below5pct')}</>}
                        </div>
                        {a.published_at && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                                {t('published')}
                            </span>
                        )}
                        {isArchived && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: 'var(--theme-pl-action-hover)', color: 'var(--color-pl-text-tertiary)' }}>
                                {t('archived')}
                            </span>
                        )}
                    </div>

                    <h2 className="text-base font-semibold mb-1 truncate"
                        style={{ color: 'var(--color-pl-text-primary)' }}>
                        {a.datasets?.name ?? a.name ?? t('reportFallback', { year: a.datasets?.reporting_year ?? '' })}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs"
                        style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {date}</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {t('employees', { count: a.datasets?.employee_count ?? '—' })}</span>
                        <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('reportingYear', { year: a.datasets?.reporting_year ?? '' })}</span>
                    </div>
                </div>

                {/* Center: gap numbers */}
                <div className="flex gap-8 shrink-0">
                    <GapBadge value={a.gap_unadjusted_median} label={t('unadjusted')} />
                    <GapBadge value={a.gap_adjusted_median}   label={t('adjusted')} />
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {!isArchived && (
                        <>
                            <Link href={`/dashboard/reports/${a.id}`}
                                className="btn-ghost text-xs flex items-center gap-1.5">
                                <ExternalLink size={13} /> {t('report')}
                            </Link>
                            <button onClick={() => onPdfClick(a)}
                                className="btn-ghost text-xs flex items-center gap-1.5">
                                <Download size={13} /> {t('pdfBtn')}
                            </button>
                            <a href={`/api/report/${a.id}/export-ppt`} download
                                className="btn-ghost text-xs flex items-center gap-1.5"
                                style={{ textDecoration: 'none' }}>
                                <Presentation size={13} /> {t('pptBtn')}
                            </a>
                        </>
                    )}
                    {/* Admin only: Archive and Delete */}
                    {isAdmin && (
                        <>
                            {/* Archive / Unarchive */}
                            <div className="relative">
                        <button
                            onClick={() => setAction(action === 'archive' ? null : 'archive')}
                            className="btn-icon"
                            style={action === 'archive' ? { color: 'var(--color-pl-brand-light)', background: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.25)' } : {}}
                            title={isArchived ? t('unarchive') : t('archive')}>
                            {isArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
                        </button>
                        {action === 'archive' && (
                            <div className="absolute right-0 top-full mt-1.5 z-40 flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap"
                                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                                <span className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    {isArchived ? t('unarchiveConfirm') : t('archiveConfirm')}
                                </span>
                                <button onClick={doArchive} disabled={pending}
                                    className="btn-ghost text-xs px-2.5 py-1 flex items-center gap-1">
                                    {pending && <Loader2 size={11} className="animate-spin" />}
                                    {isArchived ? t('unarchiveBtn') : t('archiveBtn')}
                                </button>
                                <button onClick={() => setAction(null)} className="p-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    <X size={13} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Delete */}
                    <div className="relative">
                        <button
                            onClick={() => setAction(action === 'delete' ? null : 'delete')}
                            className="btn-icon"
                            style={action === 'delete' ? { color: '#ef4444', background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' } : {}}
                            title={t('deleteReport')}
                            onMouseEnter={e => {
                                if (action !== 'delete') {
                                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                                    e.currentTarget.style.color = '#ef4444'
                                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
                                }
                            }}
                            onMouseLeave={e => {
                                if (action !== 'delete') {
                                    e.currentTarget.style.background = 'var(--theme-pl-action-hover)'
                                    e.currentTarget.style.color = 'var(--color-pl-text-secondary)'
                                    e.currentTarget.style.borderColor = 'var(--color-pl-border)'
                                }
                            }}>
                            <Trash2 size={14} />
                        </button>
                        {action === 'delete' && (
                            <div className="absolute right-0 top-full mt-1.5 z-40 flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap"
                                style={{ background: 'var(--color-pl-surface)', border: '1px solid rgba(239,68,68,0.35)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                                <span className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('deleteConfirm')}</span>
                                <button onClick={doDelete} disabled={pending}
                                    className="text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"
                                    style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}>
                                    {pending && <Loader2 size={11} className="animate-spin" />}
                                    {t('deleteBtn')}
                                </button>
                                <button onClick={() => setAction(null)} className="p-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    <X size={13} />
                                </button>
                            </div>
                        )}
                    </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Main list ────────────────────────────────────────────────

export default function ReportsListClient({ analyses: initial, isAdmin }: { analyses: Analysis[], isAdmin?: boolean }) {
    const t = useTranslations('reports')
    const [analyses, setAnalyses] = useState(initial)
    const [pdfModal, setPdfModal] = useState<{ id: string; orgName: string; year: number } | null>(null)
    const [showArchived, setShowArchived] = useState(false)

    function handleArchived(id: string) {
        setAnalyses(prev => prev.map(a => a.id === id
            ? { ...a, archived_at: new Date().toISOString() } as Analysis & { archived_at: string }
            : a
        ))
    }
    function handleUnarchived(id: string) {
        setAnalyses(prev => prev.map(a => a.id === id
            ? { ...a, archived_at: null } as Analysis & { archived_at: null }
            : a
        ))
    }
    function handleDeleted(id: string) {
        setAnalyses(prev => prev.filter(a => a.id !== id))
    }

    const visible = analyses.filter((a: Analysis & { archived_at?: string | null }) =>
        showArchived ? true : !a.archived_at
    )
    const archivedCount = analyses.filter((a: Analysis & { archived_at?: string | null }) => a.archived_at).length

    if (visible.length === 0 && !archivedCount) {
        return (
            <div className="space-y-6">
                <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('title')}</h1>
                <div className="glass-card p-12 flex flex-col items-center text-center" style={{ borderStyle: 'dashed' }}>
                    <FileText size={36} className="mb-4" style={{ color: 'var(--color-pl-border)' }} />
                    <p className="text-sm mb-5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('noAnalyses')}
                    </p>
                    <Link href="/dashboard/analysis" className="btn-primary">{t('startFirst')}</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('title')}</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('count', { count: visible.length })}
                    </p>
                </div>
                {isAdmin && archivedCount > 0 && (
                    <button
                        onClick={() => setShowArchived(v => !v)}
                        className="btn-ghost text-xs flex items-center gap-1.5">
                        <Archive size={13} />
                        {showArchived ? t('hideArchived') : t('showArchived', { count: archivedCount })}
                    </button>
                )}
            </div>

            {/* Cards */}
            <div className="space-y-4">
                {visible.map(a => (
                    <ReportCard
                        key={a.id}
                        a={a}
                        onArchive={handleArchived}
                        onUnarchive={handleUnarchived}
                        onDelete={handleDeleted}
                        onPdfClick={a => setPdfModal({
                            id:      a.id,
                            orgName: a.datasets?.name ?? 'Organisation',
                            year:    a.datasets?.reporting_year ?? new Date().getFullYear(),
                        })}
                        isAdmin={isAdmin}
                    />
                ))}
            </div>

            {pdfModal && (
                <PdfOptionsModal
                    analysisId={pdfModal.id}
                    orgName={pdfModal.orgName}
                    reportYear={pdfModal.year}
                    onClose={() => setPdfModal(null)}
                />
            )}
        </div>
    )
}
