'use client'

import { useState } from 'react'
import {
    X, Send, CheckCircle2, MessageSquare,
    AlertTriangle, CreditCard, Sparkles, Lightbulb, Paperclip,
    ChevronRight, ArrowLeft, Clock, CheckCircle, XCircle,
} from 'lucide-react'

// Only categories that truly require human support.
// How-to, legal/compliance and general questions → chatbot.
type Category = 'technical' | 'billing' | 'feature' | 'other'

const CATEGORIES: { id: Category; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'technical', label: 'Technisches Problem',  desc: 'Fehler, Abstürze, falsche Ergebnisse',    icon: <AlertTriangle size={13} /> },
    { id: 'billing',   label: 'Abrechnung & Lizenz',  desc: 'Zahlung, Upgrade, Kündigung, Rechnungen', icon: <CreditCard size={13} /> },
    { id: 'feature',   label: 'Feature-Wunsch',       desc: 'Verbesserungsvorschlag, neue Funktion',   icon: <Sparkles size={13} /> },
    { id: 'other',     label: 'Sonstiges',            desc: 'Alles, was oben nicht zutrifft',          icon: <Send size={13} /> },
]

const CAT_COLOR: Record<Category, string> = {
    technical: '#ef4444',
    billing:   '#f59e0b',
    feature:   '#10b981',
    other:     '#64748b',
}

type ThreadMessage = {
    role: 'user' | 'support'
    text: string
    at: string
    attachment_name?: string | null
    attachment_path?: string | null
}

type Ticket = {
    id:              string
    subject:         string
    body:            string
    status:          string
    priority:        string
    created_at:      string
    admin_reply:     string | null
    messages:        ThreadMessage[] | null
    attachment_name: string | null
    attachment_path: string | null
}

export default function SupportTicketModal({ onClose }: { onClose: () => void }) {
    const [view, setView]               = useState<'new' | 'list' | 'success' | 'detail'>('new')
    const [category, setCategory]       = useState<Category>('technical')
    const [subject, setSubject]         = useState('')
    const [body, setBody]               = useState('')
    const [submitting, setSubmitting]   = useState(false)
    const [error, setError]             = useState('')
    const [createdId, setCreatedId]     = useState('')
    const [tickets, setTickets]         = useState<Ticket[]>([])
    const [loadingList, setLoadingList] = useState(false)
    const [attachedFile, setAttachedFile] = useState<File | null>(null)
    const [uploading, setUploading]       = useState(false)
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
    const [userReply,    setUserReply]    = useState('')
    const [replyFile,    setReplyFile]    = useState<File | null>(null)
    const [sendingReply, setSendingReply] = useState(false)
    const [replyError,   setReplyError]   = useState('')

    const ALLOWED_TYPES = ['image/png','image/jpeg','image/webp','application/pdf','text/plain']
    const MAX_SIZE      = 8 * 1024 * 1024 // 8 MB

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null
        if (!f) return
        if (!ALLOWED_TYPES.includes(f.type)) {
            setError('Dateityp nicht erlaubt (PNG, JPG, WebP, PDF, TXT).')
            return
        }
        if (f.size > MAX_SIZE) {
            setError('Datei zu groß (max. 8 MB).')
            return
        }
        setError('')
        setAttachedFile(f)
    }

    async function submit() {
        if (!subject.trim() || !body.trim()) {
            setError('Bitte Betreff und Beschreibung ausfüllen.')
            return
        }
        setSubmitting(true); setUploading(false); setError('')

        let attachmentPath: string | null = null
        let attachmentName: string | null = null

        // 1. Upload attachment if present
        if (attachedFile) {
            setUploading(true)
            const fd = new FormData()
            fd.append('file', attachedFile)
            const upRes = await fetch('/api/support/upload', { method: 'POST', body: fd })
            const upData = await upRes.json()
            setUploading(false)
            if (!upRes.ok) {
                setError(upData.error ?? 'Upload fehlgeschlagen.')
                setSubmitting(false)
                return
            }
            attachmentPath = upData.path
            attachmentName = upData.name
        }

        // 2. Create ticket
        try {
            const res = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: subject.trim(),
                    body: body.trim(),
                    user_category_hint: category,
                    attachment_path: attachmentPath,
                    attachment_name: attachmentName,
                }),
            })
            const data = await res.json()
            if (!res.ok) { setError(data.error ?? 'Fehler beim Senden.'); return }
            setCreatedId(data.id ?? '')
            setView('success')
        } catch {
            setError('Netzwerkfehler. Bitte erneut versuchen.')
        } finally {
            setSubmitting(false)
        }
    }

    async function loadList() {
        setLoadingList(true)
        try {
            const res = await fetch('/api/support/tickets')
            const data = await res.json()
            setTickets(Array.isArray(data) ? data : [])
            setView('list')
        } catch { /* ignore */ }
        finally { setLoadingList(false) }
    }

    function statusBadge(status: string) {
        const map: Record<string, { label: string; color: string }> = {
            open:        { label: 'Offen',            color: '#ef4444' },
            in_progress: { label: 'In Bearbeitung',   color: '#f59e0b' },
            resolved:    { label: 'Gelöst',            color: '#10b981' },
            wont_fix:    { label: 'Kein Fix',          color: '#64748b' },
            waiting:     { label: 'Warte auf Antwort', color: '#8b5cf6' },
        }
        const s = map[status] ?? { label: status, color: '#64748b' }
        return (
            <span
                className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: `${s.color}20`, color: s.color }}
            >
                {s.label}
            </span>
        )
    }

    async function sendUserReply(ticketId: string) {
        if (!userReply.trim() && !replyFile) return
        setSendingReply(true); setReplyError('')

        let attachmentPath: string | null = null
        let attachmentName: string | null = null

        // Upload attachment if present
        if (replyFile) {
            const fd = new FormData()
            fd.append('file', replyFile)
            fd.append('ticketId', ticketId)
            try {
                const up = await fetch('/api/support/upload', { method: 'POST', body: fd })
                const upData = await up.json()
                if (!up.ok) { setReplyError(upData.error ?? 'Upload fehlgeschlagen.'); setSendingReply(false); return }
                attachmentPath = upData.path
                attachmentName = replyFile.name
            } catch { setReplyError('Upload fehlgeschlagen.'); setSendingReply(false); return }
        }

        try {
            const res = await fetch(`/api/support/tickets/${ticketId}/user-reply`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    text:            userReply.trim() || '(Anhang)',
                    attachment_name: attachmentName,
                    attachment_path: attachmentPath,
                }),
            })
            const data = await res.json()
            if (res.ok) {
                setUserReply('')
                setReplyFile(null)
                setSelectedTicket(data)
                setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...data } : t))
            } else {
                setReplyError(data.error ?? 'Fehler beim Senden.')
            }
        } catch { setReplyError('Netzwerkfehler') }
        finally { setSendingReply(false) }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                className="w-full max-w-lg rounded-2xl overflow-hidden"
                style={{ background: 'var(--color-pl-bg)', border: '1px solid var(--color-pl-border)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid var(--color-pl-border)' }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,var(--color-pl-brand),#6366f1)' }}
                        >
                            <MessageSquare size={15} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>Support</p>
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>CompLens Helpdesk · Mo–Fr 09–17 Uhr</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {view !== 'list' && (
                            <button
                                onClick={loadList}
                                disabled={loadingList}
                                className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                                style={{ background: 'var(--color-pl-brand)', color: '#fff' }}
                            >
                                {loadingList ? '…' : 'Meine Tickets'}
                            </button>
                        )}
                        {view === 'list' && (
                            <button
                                onClick={() => setView('new')}
                                className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                                style={{ background: 'var(--color-pl-brand)', color: '#fff' }}
                            >
                                + Neue Anfrage
                            </button>
                        )}
                        <button onClick={onClose} style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-5">

                    {/* ── New Ticket Form ── */}
                    {view === 'new' && (
                        <div className="space-y-4">
                            {/* Chatbot nudge */}
                            <div
                                className="flex items-start gap-3 p-3 rounded-xl"
                                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}
                            >
                                <Lightbulb size={15} style={{ color: 'var(--color-pl-brand)', flexShrink: 0, marginTop: 1 }} />
                                <div>
                                    <p className="text-xs font-semibold" style={{ color: 'var(--color-pl-brand)' }}>Wussten Sie?</p>
                                    <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                        How-to-Fragen, EU-Richtlinie 2023/970 und DSGVO-Compliance können Sie direkt beim{' '}
                                        <strong style={{ color: 'var(--color-pl-brand)' }}>CompLens Assistant</strong>{' '}
                                        fragen — jederzeit unten rechts verfügbar.
                                    </p>
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-pl-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Kategorie
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {CATEGORIES.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setCategory(c.id)}
                                            className="text-left p-3 rounded-xl transition-all"
                                            style={{
                                                background: category === c.id ? `${CAT_COLOR[c.id]}12` : 'var(--color-pl-surface)',
                                                border: `1px solid ${category === c.id ? CAT_COLOR[c.id] : 'var(--color-pl-border)'}`,
                                            }}
                                        >
                                            <div className="flex items-center gap-1.5 mb-0.5" style={{ color: category === c.id ? CAT_COLOR[c.id] : 'var(--color-pl-text-tertiary)' }}>
                                                {c.icon}
                                                <span className="text-xs font-semibold">{c.label}</span>
                                            </div>
                                            <p className="text-[10px]" style={{ color: 'var(--color-pl-text-tertiary)' }}>{c.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    Betreff *
                                </label>
                                <input
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="z. B. PDF-Export funktioniert nicht"
                                    className="w-full text-sm rounded-lg px-3 py-2.5 outline-none transition-colors"
                                    style={{
                                        background: 'var(--color-pl-surface)',
                                        border: '1px solid var(--color-pl-border)',
                                        color: 'var(--color-pl-text-primary)',
                                    }}
                                />
                            </div>

                            {/* Body */}
                            <div>
                                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    Beschreibung *
                                </label>
                                <textarea
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    placeholder="Beschreiben Sie das Problem so detailliert wie möglich. Bei technischen Fehlern: Welche Schritte haben Sie zuvor ausgeführt? Welche Fehlermeldung erschien?"
                                    rows={5}
                                    className="w-full text-sm rounded-lg px-3 py-2.5 outline-none resize-none transition-colors"
                                    style={{
                                        background: 'var(--color-pl-surface)',
                                        border: '1px solid var(--color-pl-border)',
                                        color: 'var(--color-pl-text-primary)',
                                    }}
                                />
                            </div>

                            {/* File attachment */}
                            <div>
                                <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    Anhang <span style={{ color: 'var(--color-pl-text-tertiary)', fontWeight: 400 }}>(optional · PNG, JPG, PDF, TXT · max. 8 MB)</span>
                                </label>
                                {!attachedFile ? (
                                    <label
                                        className="flex items-center gap-2 w-full cursor-pointer px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-black/5"
                                        style={{ border: '1.5px dashed var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}
                                    >
                                        <Paperclip size={14} />
                                        Datei anhängen…
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                ) : (
                                    <div
                                        className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                                        style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.25)' }}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Paperclip size={13} style={{ color: 'var(--color-pl-brand)', flexShrink: 0 }} />
                                            <span className="text-xs font-medium truncate" style={{ color: 'var(--color-pl-text-primary)' }}>
                                                {attachedFile.name}
                                            </span>
                                            <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                ({(attachedFile.size / 1024).toFixed(0)} KB)
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setAttachedFile(null)}
                                            className="ml-2 flex-shrink-0"
                                            style={{ color: 'var(--color-pl-text-tertiary)' }}
                                            title="Entfernen"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
                            )}

                            <button
                                onClick={submit}
                                disabled={submitting || uploading || !subject.trim() || !body.trim()}
                                className="w-full flex items-center justify-center gap-2 font-bold text-white text-sm py-2.5 rounded-xl transition-all hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0"
                                style={{ background: '#3b82f6', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}
                            >
                                <Send size={14} />
                                {uploading ? 'Wird hochgeladen…' : submitting ? 'Wird gesendet…' : 'Anfrage senden'}
                            </button>
                        </div>
                    )}

                    {/* ── Success State ── */}
                    {view === 'success' && (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)' }}
                            >
                                <CheckCircle2 size={32} style={{ color: '#10b981' }} />
                            </div>
                            <div>
                                <p className="text-base font-bold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>
                                    Anfrage eingegangen!
                                </p>
                                <p className="text-sm mb-2" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    Ihre Anfrage ist eingegangen. Wir melden uns in der Regel innerhalb von 1–2 Werktagen.
                                </p>
                                {createdId && (
                                    <p className="text-xs font-mono px-2 py-1 rounded" style={{ background: 'var(--color-pl-surface)', color: 'var(--color-pl-text-tertiary)' }}>
                                        Ticket-ID: {createdId.slice(0, 8).toUpperCase()}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={loadList}
                                    className="text-xs px-3 py-2 rounded-lg font-semibold"
                                    style={{ background: 'var(--color-pl-brand)', color: '#fff' }}
                                >
                                    Meine Tickets anzeigen
                                </button>
                                <button
                                    onClick={onClose}
                                    className="text-xs px-3 py-2 rounded-lg font-medium"
                                    style={{ border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                                >
                                    Schließen
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Ticket List ── */}
                    {view === 'list' && (
                        <div>
                            {loadingList ? (
                                <div className="py-10 text-center text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>Lädt…</div>
                            ) : tickets.length === 0 ? (
                                <div className="py-10 text-center">
                                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>Noch keine Support-Anfragen.</p>
                                </div>
                            ) : (
                                <div className="divide-y" style={{ borderColor: 'var(--color-pl-border)' }}>
                                    {tickets.map(t => {
                                        const replySent = ['waiting','resolved','wont_fix'].includes(t.status)
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => { setSelectedTicket(t); setView('detail') }}
                                                className="w-full flex items-center justify-between gap-3 px-1 py-3 text-left hover:bg-black/5 transition-colors rounded-lg"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-pl-text-primary)' }}>
                                                            {t.subject}
                                                        </p>
                                                        {replySent && (
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                                                                style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                                                                NEUE ANTWORT
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {statusBadge(t.status)}
                                                        <span className="text-[10px]" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                            {new Date(t.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight size={14} style={{ color: 'var(--color-pl-text-tertiary)', flexShrink: 0 }} />
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Ticket Detail ── */}
                    {view === 'detail' && selectedTicket && (() => {
                        const t = selectedTicket
                        const replySent = ['waiting','resolved','wont_fix'].includes(t.status)
                        return (
                            <div className="space-y-4">
                                {/* Back */}
                                <button
                                    onClick={() => setView('list')}
                                    className="flex items-center gap-1.5 text-xs font-semibold"
                                    style={{ color: 'var(--color-pl-brand)' }}
                                >
                                    <ArrowLeft size={12} /> Zur Übersicht
                                </button>

                                {/* Ticket header */}
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-base font-bold leading-snug" style={{ color: 'var(--color-pl-text-primary)' }}>{t.subject}</p>
                                    {statusBadge(t.status)}
                                </div>
                                <p className="text-[10px]" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    Eingereicht: {new Date(t.created_at).toLocaleString('de-DE')}
                                </p>

                                {/* Conversation thread */}
                                <div className="space-y-3">
                                    {/* Initial user message (body) always first */}
                                    <div className="flex justify-end">
                                        <div className="max-w-[86%]">
                                            <p className="text-[9px] font-bold mb-1 text-right" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                SIE · {new Date(t.created_at).toLocaleString('de-DE', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                                            </p>
                                            <div className="p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap rounded-tr-sm"
                                                style={{ background: 'var(--color-pl-brand)', color: '#fff' }}>
                                                {t.body}
                                            </div>
                                        </div>
                                    </div>

                                    {/* messages[] — the conversation thread */}
                                    {(t.messages ?? []).map((m, i) => (
                                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className="max-w-[86%]">
                                                <p className={`text-[9px] font-bold mb-1 ${m.role === 'user' ? 'text-right' : ''}`}
                                                    style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                    {m.role === 'user' ? 'SIE' : 'SUPPORT'} · {new Date(m.at).toLocaleString('de-DE', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                                                </p>
                                                <div
                                                    className={`p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                                                    style={m.role === 'user'
                                                        ? { background: 'var(--color-pl-brand)', color: '#fff' }
                                                        : { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: 'var(--color-pl-text-primary)' }
                                                    }
                                                >
                                                    {m.text}
                                                    {m.attachment_name && (
                                                        <div className="flex items-center gap-1.5 mt-2 pt-2 text-[10px] font-semibold"
                                                            style={{ borderTop: m.role === 'user' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(16,185,129,0.2)', opacity: 0.85 }}>
                                                            <Paperclip size={10} /> {m.attachment_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* No reply yet */}
                                    {(t.messages ?? []).length === 0 && (
                                        <div className="py-3 text-center text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            Ihr Ticket wird bearbeitet. Wir melden uns in Kürze.
                                        </div>
                                    )}
                                </div>

                                {/* Attachment */}
                                {t.attachment_name && (
                                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                        <Paperclip size={11} /> {t.attachment_name}
                                    </div>
                                )}

                                {/* User follow-up reply (only for non-closed tickets) */}
                                {!['resolved','wont_fix'].includes(t.status) && (
                                    <div className="pt-3" style={{ borderTop: '1px solid var(--color-pl-border)' }}>
                                        <textarea
                                            value={userReply}
                                            onChange={e => setUserReply(e.target.value)}
                                            rows={3}
                                            placeholder="Weitere Informationen oder Rückfrage…"
                                            className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none"
                                            style={{
                                                background: 'var(--color-pl-surface)',
                                                border: '1px solid var(--color-pl-border)',
                                                color: 'var(--color-pl-text-primary)',
                                            }}
                                        />

                                        {/* File attachment */}
                                        {!replyFile ? (
                                            <label
                                                className="mt-2 flex items-center gap-2 cursor-pointer text-xs px-3 py-2 rounded-lg w-fit transition-colors hover:bg-black/5"
                                                style={{ border: '1.5px dashed var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}
                                            >
                                                <Paperclip size={12} /> Anhang hinzufügen
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
                                                    onChange={e => {
                                                        const f = e.target.files?.[0] ?? null
                                                        if (f && f.size <= 8 * 1024 * 1024) setReplyFile(f)
                                                        else if (f) setReplyError('Datei zu groß (max. 8 MB).')
                                                    }}
                                                />
                                            </label>
                                        ) : (
                                            <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-lg"
                                                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Paperclip size={11} style={{ color: 'var(--color-pl-brand)', flexShrink: 0 }} />
                                                    <span className="text-xs font-medium truncate" style={{ color: 'var(--color-pl-text-primary)' }}>{replyFile.name}</span>
                                                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--color-pl-text-tertiary)' }}>({(replyFile.size/1024).toFixed(0)} KB)</span>
                                                </div>
                                                <button onClick={() => setReplyFile(null)} className="ml-2 flex-shrink-0" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}

                                        {replyError && (
                                            <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{replyError}</p>
                                        )}
                                        <button
                                            onClick={() => sendUserReply(t.id)}
                                            disabled={sendingReply || (!userReply.trim() && !replyFile)}
                                            className="mt-2 flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl text-white disabled:opacity-40 transition-all hover:opacity-90"
                                            style={{ background: 'var(--color-pl-brand)' }}
                                        >
                                            <Send size={12} />
                                            {sendingReply ? 'Wird gesendet…' : 'Antworten'}
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={() => setView('list')}
                                    className="text-xs px-3 py-2 rounded-lg font-semibold"
                                    style={{ border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                                >
                                    ← Zurück zur Liste
                                </button>
                            </div>
                        )
                    })()}
                </div>
            </div>
        </div>
    )
}

