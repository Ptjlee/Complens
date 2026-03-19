'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
    Database, Trash2, Loader2, Calendar, Users,
    CheckCircle2, X, Search, Upload, BarChart3, Pencil, Check,
} from 'lucide-react'
import { deleteDataset, renameDataset } from '../analysis/actions'

type Dataset = {
    id: string
    name: string
    reporting_year: number
    employee_count: number | null
    created_at: string
    status: string
    deleted_at: string | null
}

// ── Dataset row ───────────────────────────────────────────────

function DatasetRow({
    d,
    onDeleted,
    onRenamed,
    isAdmin,
}: {
    d:         Dataset
    onDeleted: (id: string) => void
    onRenamed: (id: string, newName: string) => void
    isAdmin:   boolean
}) {
    const [mode, setMode]             = useState<'idle' | 'renaming' | 'confirming'>('idle')
    const [pending, startT]           = useTransition()
    const [editName, setEditName]     = useState(d.name)
    const [renameError, setRenameError] = useState('')
    const inputRef                    = useRef<HTMLInputElement>(null)

    const date = new Date(d.created_at).toLocaleDateString('de-DE', {
        day: '2-digit', month: 'short', year: 'numeric',
    })

    // Focus the input when rename mode opens
    useEffect(() => {
        if (mode === 'renaming') {
            setTimeout(() => inputRef.current?.select(), 0)
        }
    }, [mode])

    function startRename() {
        setEditName(d.name)
        setRenameError('')
        setMode('renaming')
    }

    function cancelRename() {
        setEditName(d.name)
        setRenameError('')
        setMode('idle')
    }

    function confirmRename() {
        const trimmed = editName.trim()
        if (!trimmed) { setRenameError('Name darf nicht leer sein.'); return }
        if (trimmed === d.name) { setMode('idle'); return }
        setRenameError('')
        startT(async () => {
            const result = await renameDataset(d.id, trimmed)
            if (result.error) { setRenameError(result.error); return }
            onRenamed(d.id, trimmed)
            setMode('idle')
        })
    }

    const [deleteError, setDeleteError] = useState('')

    function doDelete() {
        setDeleteError('')
        startT(async () => {
            const result = await deleteDataset(d.id)
            if (result.error) {
                setDeleteError(result.error)
                setMode('idle')
                return
            }
            onDeleted(d.id)
        })
    }

    const statusColor = d.status === 'ready'
        ? 'var(--color-pl-green)'
        : d.status === 'error'
            ? 'var(--color-pl-red)'
            : 'var(--color-pl-amber)'

    const statusLabel: Record<string, string> = {
        ready: 'Bereit',
        uploading: 'Upload läuft',
        mapping: 'Mapping',
        error: 'Fehler',
    }

    return (
        <div className="glass-card p-5">
            <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <Database size={18} style={{ color: 'var(--color-pl-brand-light)' }} />
                </div>

                {/* Info / rename */}
                <div className="flex-1 min-w-0">
                    {mode === 'renaming' ? (
                        /* ── Inline rename input ── */
                        <div className="flex items-center gap-2 mb-1">
                            <input
                                ref={inputRef}
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter')  confirmRename()
                                    if (e.key === 'Escape') cancelRename()
                                }}
                                className="input-base text-sm font-semibold py-1 flex-1"
                                style={{ maxWidth: 320 }}
                                disabled={pending}
                            />
                            <button
                                onClick={confirmRename}
                                disabled={pending}
                                className="p-1.5 rounded-lg flex-shrink-0"
                                style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }}
                                title="Speichern (Enter)">
                                {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            </button>
                            <button
                                onClick={cancelRename}
                                disabled={pending}
                                className="p-1.5 rounded-lg flex-shrink-0"
                                style={{ color: 'var(--color-pl-text-tertiary)' }}
                                title="Abbrechen (Esc)">
                                <X size={13} />
                            </button>
                        </div>
                    ) : (
                        /* ── Normal name display ── */
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--color-pl-text-primary)' }}>
                                {d.name}
                            </h2>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                                style={{
                                    background: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
                                    color: statusColor,
                                    border: `1px solid color-mix(in srgb, ${statusColor} 25%, transparent)`,
                                }}>
                                {statusLabel[d.status] ?? d.status}
                            </span>
                        </div>
                    )}

                    {/* Rename error */}
                    {renameError && (
                        <p className="text-xs mb-1" style={{ color: 'var(--color-pl-red)' }}>{renameError}</p>
                    )}
                    {deleteError && (
                        <p className="text-xs mb-1" style={{ color: 'var(--color-pl-red)' }}>{deleteError}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs"
                        style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        <span className="flex items-center gap-1"><Calendar size={11} /> {date}</span>
                        <span className="flex items-center gap-1"><BarChart3 size={11} /> Berichtsjahr {d.reporting_year}</span>
                        <span className="flex items-center gap-1"><Users size={11} /> {d.employee_count ?? '—'} Mitarbeitende</span>
                    </div>
                </div>

                {/* Actions — hide during rename; omit entirely for viewers */}
                {mode !== 'renaming' && isAdmin && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {d.status === 'ready' && (
                            <Link href="/dashboard/analysis"
                                className="btn-ghost text-xs flex items-center gap-1.5">
                                <BarChart3 size={13} /> Analysieren
                            </Link>
                        )}

                        {/* Rename button */}
                        <button
                            onClick={startRename}
                            className="btn-icon"
                            title="Umbenennen">
                            <Pencil size={14} />
                        </button>

                        {/* Delete */}
                        <div className="relative">
                            <button onClick={() => setMode(mode === 'confirming' ? 'idle' : 'confirming')}
                                className="btn-icon"
                                style={mode === 'confirming' ? { color: '#ef4444', background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' } : {}}
                                title="Datensatz löschen"
                                onMouseEnter={e => {
                                    if (mode !== 'confirming') {
                                        e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                                        e.currentTarget.style.color = '#ef4444'
                                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (mode !== 'confirming') {
                                        e.currentTarget.style.background = 'var(--theme-pl-action-hover)'
                                        e.currentTarget.style.color = 'var(--color-pl-text-secondary)'
                                        e.currentTarget.style.borderColor = 'var(--color-pl-border)'
                                    }
                                }}>
                                <Trash2 size={14} />
                            </button>
                            {mode === 'confirming' && (
                                <div className="absolute right-0 top-full mt-1.5 z-40 flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap"
                                    style={{ background: 'var(--color-pl-surface)', border: '1px solid rgba(239,68,68,0.35)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                                    <span className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>Datensatz löschen?</span>
                                    <button onClick={doDelete} disabled={pending}
                                        className="text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"
                                        style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}>
                                        {pending ? <Loader2 size={11} className="animate-spin" /> : null}
                                        Ja, löschen
                                    </button>
                                    <button onClick={() => setMode('idle')} className="p-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        <X size={13} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Main ─────────────────────────────────────────────────────

export default function DatasetsClient({ datasets: initial, isAdmin }: { datasets: Dataset[]; isAdmin: boolean }) {
    const [datasets, setDatasets] = useState(initial)
    const [search, setSearch]     = useState('')

    function handleDeleted(id: string) {
        setDatasets(prev => prev.filter(d => d.id !== id))
    }

    function handleRenamed(id: string, newName: string) {
        setDatasets(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d))
    }

    const filtered = datasets.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        String(d.reporting_year).includes(search)
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        Datensätze verwalten
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {datasets.length} importierte Datensätze
                        {!isAdmin && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--color-pl-amber)', border: '1px solid rgba(245,158,11,0.25)' }}>
                                Lesezugriff
                            </span>
                        )}
                    </p>
                </div>
                {isAdmin && (
                    <Link href="/dashboard/import" className="btn-primary text-sm flex items-center gap-2">
                        <Upload size={14} /> Neuer Import
                    </Link>
                )}
            </div>

            {/* Search */}
            {datasets.length > 3 && (
                <div className="relative max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--color-pl-text-tertiary)' }} />
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Datensätze durchsuchen…"
                        className="input-base text-sm pl-9 w-full"
                    />
                </div>
            )}

            {/* List */}
            {filtered.length === 0 ? (
                <div className="glass-card p-12 flex flex-col items-center text-center" style={{ borderStyle: 'dashed' }}>
                    <Database size={36} className="mb-4" style={{ color: 'var(--color-pl-border)' }} />
                    <p className="text-sm mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {search ? 'Keine Datensätze gefunden.' : 'Noch keine Datensätze importiert.'}
                    </p>
                    {!search && (
                        <Link href="/dashboard/import" className="btn-primary">Daten importieren</Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(d => (
                        <DatasetRow
                            key={d.id}
                            d={d}
                            onDeleted={handleDeleted}
                            onRenamed={handleRenamed}
                            isAdmin={isAdmin}
                        />
                    ))}
                </div>
            )}

            {/* GDPR note */}
            {datasets.length > 0 && (
                <div className="flex items-start gap-2 p-4 rounded-xl text-xs"
                    style={{ background: 'var(--theme-pl-action-ghost)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}>
                    <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-pl-green)' }} />
                    <span>
                        Gelöschte Datensätze werden unwiderruflich entfernt, einschließlich aller zugehörigen Mitarbeiterdaten.
                        Analysen und Berichte, die auf diesem Datensatz basieren, bleiben erhalten.
                        Gemäß DSGVO Art. 17 werden alle personenbezogenen Daten dauerhaft gelöscht.
                    </span>
                </div>
            )}
        </div>
    )
}
