'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
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
        : abs >= 2
            ? 'var(--color-pl-amber)'
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

// ── Confirm overlay ──────────────────────────────────────────

function ConfirmBubble({
    message,
    confirmLabel,
    confirmClass,
    onConfirm,
    onCancel,
    loading,
}: {
    message:       string
    confirmLabel:  string
    confirmClass:  string
    onConfirm:     () => void
    onCancel:      () => void
    loading:       boolean
}) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-pl-border)' }}>
            <span className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>{message}</span>
            <button onClick={onConfirm} disabled={loading}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 ${confirmClass}`}>
                {loading && <Loader2 size={11} className="animate-spin" />}
                {confirmLabel}
            </button>
            <button onClick={onCancel} className="p-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                <X size={13} />
            </button>
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
    const [action, setAction]     = useState<'archive' | 'delete' | null>(null)
    const [pending, startT]       = useTransition()

    const date = new Date(a.created_at).toLocaleDateString('de-DE', {
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
                                ? <><ShieldAlert size={11} /> 5%-Schwelle überschritten</>
                                : <><CheckCircle2 size={11} /> Unter 5%-Schwelle</>}
                        </div>
                        {a.published_at && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                                Veröffentlicht
                            </span>
                        )}
                        {isArchived && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: 'var(--theme-pl-action-hover)', color: 'var(--color-pl-text-tertiary)' }}>
                                Archiviert
                            </span>
                        )}
                    </div>

                    <h2 className="text-base font-semibold mb-1 truncate"
                        style={{ color: 'var(--color-pl-text-primary)' }}>
                        {a.datasets?.name ?? a.name ?? `Entgeltbericht ${a.datasets?.reporting_year}`}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs"
                        style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {date}</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {a.datasets?.employee_count ?? '—'} MA</span>
                        <span style={{ color: 'var(--color-pl-text-tertiary)' }}>Berichtsjahr {a.datasets?.reporting_year}</span>
                    </div>
                </div>

                {/* Center: gap numbers */}
                <div className="flex gap-8 shrink-0">
                    <GapBadge value={a.gap_unadjusted_median} label="Unbereinigt" />
                    <GapBadge value={a.gap_adjusted_median}   label="Bereinigt" />
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {!isArchived && (
                        <>
                            <Link href={`/dashboard/reports/${a.id}`}
                                className="btn-ghost text-xs flex items-center gap-1.5">
                                <ExternalLink size={13} /> Bericht
                            </Link>
                            <button onClick={() => onPdfClick(a)}
                                className="btn-ghost text-xs flex items-center gap-1.5">
                                <Download size={13} /> PDF
                            </button>
                            <a href={`/api/report/${a.id}/export-ppt`} download
                                className="btn-ghost text-xs flex items-center gap-1.5"
                                style={{ textDecoration: 'none' }}>
                                <Presentation size={13} /> PPT
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
                            title={isArchived ? 'Archivierung aufheben' : 'Archivieren'}>
                            {isArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
                        </button>
                        {action === 'archive' && (
                            <div className="absolute right-0 top-full mt-1.5 z-40 flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap"
                                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                                <span className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    {isArchived ? 'Archivierung aufheben?' : 'Bericht archivieren?'}
                                </span>
                                <button onClick={doArchive} disabled={pending}
                                    className="btn-ghost text-xs px-2.5 py-1 flex items-center gap-1">
                                    {pending && <Loader2 size={11} className="animate-spin" />}
                                    {isArchived ? 'Aufheben' : 'Archivieren'}
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
                            title="Bericht löschen"
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
                                <span className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>Bericht unwiderruflich löschen?</span>
                                <button onClick={doDelete} disabled={pending}
                                    className="text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"
                                    style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}>
                                    {pending && <Loader2 size={11} className="animate-spin" />}
                                    Löschen
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
                <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>Berichte</h1>
                <div className="glass-card p-12 flex flex-col items-center text-center" style={{ borderStyle: 'dashed' }}>
                    <FileText size={36} className="mb-4" style={{ color: 'var(--color-pl-border)' }} />
                    <p className="text-sm mb-5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        Noch keine abgeschlossenen Analysen vorhanden.
                    </p>
                    <Link href="/dashboard/analysis" className="btn-primary">Erste Analyse starten</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>Berichte</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {visible.length} Bericht{visible.length !== 1 ? 'e' : ''} · EU-Richtlinie 2023/970 Art. 9
                    </p>
                </div>
                {isAdmin && archivedCount > 0 && (
                    <button
                        onClick={() => setShowArchived(v => !v)}
                        className="btn-ghost text-xs flex items-center gap-1.5">
                        <Archive size={13} />
                        {showArchived ? 'Archivierte ausblenden' : `Archivierte anzeigen (${archivedCount})`}
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
