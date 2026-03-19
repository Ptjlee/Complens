'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    MessageSquare, RefreshCw, Search, ChevronDown, ChevronUp,
    X, Send, Sparkles, CheckCircle2, XCircle, Clock,
    AlertTriangle, CreditCard, FileText, HelpCircle, Filter,
    Tag, Pencil, CheckSquare, Hourglass, AlertCircle,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

type Priority = 'critical' | 'high' | 'normal' | 'low'
type Status   = 'open' | 'in_progress' | 'resolved' | 'wont_fix' | 'waiting'
type Category = 'technical' | 'billing' | 'legal' | 'feature' | 'general' | 'other'

type ThreadMessage = { role: 'user' | 'support'; text: string; at: string }

type Ticket = {
    id:                 string
    subject:            string
    body:               string
    user_email:         string
    org_name:           string
    category:           Category | null
    user_category_hint: string | null
    priority:           Priority
    status:             Status
    ai_summary:         string | null
    ai_draft_reply:     string | null
    admin_reply:        string | null
    messages:           ThreadMessage[] | null
    created_at:         string
    updated_at:         string
    resolved_at:        string | null
}

// ─── Badge helpers ──────────────────────────────────────────────────────────

const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
    critical: { label: 'KRITISCH',  color: '#ef4444' },
    high:     { label: 'Hoch',      color: '#f97316' },
    normal:   { label: 'Normal',    color: '#3b82f6' },
    low:      { label: 'Niedrig',   color: '#64748b' },
}

const STATUS_META: Record<Status, { label: string; color: string; icon: React.ReactNode }> = {
    open:        { label: 'Offen',             color: '#ef4444', icon: <AlertCircle  size={11} /> },
    in_progress: { label: 'In Bearbeitung',    color: '#f59e0b', icon: <Hourglass    size={11} /> },
    waiting:     { label: 'Warte auf Antwort', color: '#8b5cf6', icon: <Clock        size={11} /> },
    resolved:    { label: 'Gelöst',            color: '#10b981', icon: <CheckCircle2 size={11} /> },
    wont_fix:    { label: 'Kein Fix',          color: '#64748b', icon: <XCircle      size={11} /> },
}

const CATEGORY_META: Record<Category, { label: string; color: string; icon: React.ReactNode }> = {
    technical: { label: 'Technisch',  color: '#ef4444', icon: <AlertTriangle size={11} /> },
    billing:   { label: 'Abrechnung', color: '#f59e0b', icon: <CreditCard    size={11} /> },
    legal:     { label: 'Rechtlich',  color: '#6366f1', icon: <FileText      size={11} /> },
    feature:   { label: 'Feature',    color: '#10b981', icon: <Sparkles      size={11} /> },
    general:   { label: 'Allgemein',  color: '#3b82f6', icon: <HelpCircle   size={11} /> },
    other:     { label: 'Sonstiges',  color: '#64748b', icon: <Tag          size={11} /> },
}

function PriorityBadge({ priority }: { priority: Priority }) {
    const m = PRIORITY_META[priority]
    return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide"
            style={{ background: `${m.color}20`, color: m.color }}>
            {m.label}
        </span>
    )
}

function StatusBadge({ status }: { status: Status }) {
    const m = STATUS_META[status]
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${m.color}20`, color: m.color }}>
            {m.icon} {m.label}
        </span>
    )
}

function CategoryBadge({ category }: { category: Category | null }) {
    if (!category) return null
    const m = CATEGORY_META[category]
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: `${m.color}15`, color: m.color }}>
            {m.icon} {m.label}
        </span>
    )
}

// ─── Ticket Detail Panel ────────────────────────────────────────────────────

function firstNameFrom(email: string): string {
    // e.g. peter.mueller@acme.com → Peter, john@acme.com → John
    const local = email.split('@')[0] ?? ''
    const part  = local.split(/[._-]/)[0] ?? local
    return part.charAt(0).toUpperCase() + part.slice(1)
}

function TicketDetail({
    ticket, onClose, onUpdated,
}: {
    ticket: Ticket
    onClose: () => void
    onUpdated: (t: Ticket) => void
}) {
    const firstName = firstNameFrom(ticket.user_email)

    // Apply name substitution to AI draft on initial load
    function personalize(text: string) {
        return text
            .replace(/\[Name des Nutzers\]/g, firstName)
            .replace(/\[Vorname\]/g, firstName)
            .replace(/Sehr geehrte\/r Herr\/Frau/g, `Hallo`)
    }

    const [reply,    setReply]    = useState(
        // Start with personalized AI draft so admin can edit it;
        // if already replied, clear so they can type a fresh follow-up
        ticket.ai_draft_reply && !ticket.admin_reply
            ? personalize(ticket.ai_draft_reply)
            : ''
    )
    const [status,   setStatus]   = useState<Status>(ticket.status)
    const [priority, setPriority] = useState<Priority>(ticket.priority)
    const [lang,     setLang]     = useState<'de' | 'en'>('de')
    const [saving,   setSaving]   = useState(false)
    const [polishing,setPolishing]= useState(false)
    const [msg,      setMsg]      = useState('')

    const isResolved = status === 'resolved' || status === 'wont_fix'

    // ── Persist changes ────────────────────────────────────────────────────────
    async function save(overrideStatus?: Status, isActualSend = false) {
        setSaving(true); setMsg('')
        const finalStatus = overrideStatus ?? status
        const payload: Record<string, unknown> = { status: finalStatus, priority }
        if (isActualSend && reply.trim()) {
            payload.admin_reply    = reply.trim()
            payload.append_message = { role: 'support', text: reply.trim() }
        }
        try {
            const res = await fetch(`/api/support/tickets/${ticket.id}`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload),
            })
            const data = await res.json()
            if (res.ok) {
                onUpdated(data)
                setStatus(data.status)
                if (isActualSend) {
                    setReply('')   // clear after sending so next reply starts fresh
                    setMsg('✓ Antwort gesendet')
                } else {
                    setMsg('✓ Gespeichert')
                }
            } else {
                setMsg(`Fehler: ${data.error}`)
            }
        } catch { setMsg('Netzwerkfehler') }
        finally   { setSaving(false) }
    }

    // ── Send reply WITHOUT closing (→ waiting for user) ───────────────────────
    async function sendReply() {
        if (!reply.trim()) return
        await save('waiting', true)
    }

    // ── Send reply + mark resolved ────────────────────────────────────────────
    async function resolveAndSend() {
        if (!reply.trim()) return
        await save('resolved', true)
    }

    // ── Polish current draft via AI ───────────────────────────────────────────
    async function polish() {
        if (!reply.trim()) return
        setPolishing(true); setMsg('')
        try {
            const res = await fetch('/api/support/ai-polish-reply', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    draft:       reply,
                    subject:     ticket.subject,
                    userMessage: ticket.body,
                    firstName,
                    lang,
                }),
            })
            const data = await res.json()
            if (res.ok && data.polished) {
                setReply(data.polished)
                setMsg('✓ KI hat den Entwurf verfeinert')
            } else {
                setMsg(data.error ?? 'Polish fehlgeschlagen')
            }
        } catch { setMsg('Netzwerkfehler') }
        finally   { setPolishing(false) }
    }

    // ── Load AI draft (inserts personalized salutation) ───────────────────────
    function loadDraft() {
        if (!ticket.ai_draft_reply) return
        setReply(personalize(ticket.ai_draft_reply))
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                className="w-full max-w-3xl rounded-2xl overflow-hidden"
                style={{ background: '#0f0f14', border: '1px solid #222', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-5 py-4 gap-3" style={{ borderBottom: '1px solid #222' }}>
                    <div className="min-w-0">
                        <p className="text-base font-bold text-white truncate">{ticket.subject}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <StatusBadge   status={ticket.status} />
                            <PriorityBadge priority={ticket.priority} />
                            <CategoryBadge category={ticket.category} />
                            {ticket.user_category_hint && ticket.user_category_hint !== ticket.category && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(148,163,184,0.12)', color: '#94a3b8' }}>
                                    Nutzer: {ticket.user_category_hint}
                                </span>
                            )}
                            <span className="text-[10px]" style={{ color: '#7a90b8' }}>
                                {ticket.user_email} · {ticket.org_name}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ color: '#666', flexShrink: 0 }}><X size={16} /></button>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-5">
                    {/* Original message */}
                    <div>
                        <p className="text-[10px] font-bold mb-2 tracking-widest" style={{ color: '#94a3b8' }}>NUTZERANFRAGE</p>
                        <div className="p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
                            style={{ background: '#131318', border: '1px solid #252540', color: '#e2e8f0' }}>
                            {ticket.body}
                        </div>
                        <p className="text-[10px] mt-1.5" style={{ color: '#7a90b8' }}>
                            Eingereicht: {new Date(ticket.created_at).toLocaleString('de-DE')} · Von: <strong style={{ color: '#c0d0e8' }}>{firstName}</strong> ({ticket.user_email})
                        </p>
                    </div>


                    {/* AI Summary */}
                    {ticket.ai_summary && (
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
                            <p className="text-[10px] font-bold mb-1 flex items-center gap-1.5" style={{ color: '#a78bfa' }}>
                                <Sparkles size={10} /> KI-ANALYSE
                            </p>
                            <p className="text-xs" style={{ color: '#c4b5fd' }}>{ticket.ai_summary}</p>
                        </div>
                    )}

                    {/* Conversation thread (messages array) */}
                    {(() => {
                        const msgs = Array.isArray(ticket.messages) ? ticket.messages : []
                        if (msgs.length === 0) return null
                        return (
                            <div>
                                <p className="text-[10px] font-bold mb-2 tracking-widest" style={{ color: '#94a3b8' }}>GESPRÄCHSVERLAUF</p>
                                <div className="space-y-2">
                                    {msgs.map((m, i) => (
                                        <div key={i} className={`flex ${m.role === 'support' ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className="max-w-[85%] p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
                                                style={m.role === 'support'
                                                    ? { background: 'rgba(91,97,255,0.15)', border: '1px solid rgba(91,97,255,0.3)', color: '#c7d2fe' }
                                                    : { background: '#131318', border: '1px solid #252540', color: '#e2e8f0' }
                                                }
                                            >
                                                <p className="text-[9px] font-bold mb-1" style={{ color: m.role === 'support' ? '#818cf8' : '#7a90b8' }}>
                                                    {m.role === 'support' ? 'SUPPORT' : firstName.toUpperCase()} · {new Date(m.at).toLocaleString('de-DE', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                                                </p>
                                                {m.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })()}

                    {/* Controls row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[10px] font-bold mb-1.5" style={{ color: '#94a3b8' }}>STATUS</p>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value as Status)}
                                className="w-full text-xs rounded-lg px-3 py-2 outline-none"
                                style={{ background: '#131318', border: '1px solid #252540', color: '#e2e8f0' }}
                            >
                                {(Object.entries(STATUS_META) as [Status, typeof STATUS_META[Status]][]).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold mb-1.5" style={{ color: '#94a3b8' }}>PRIORITÄT</p>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value as Priority)}
                                className="w-full text-xs rounded-lg px-3 py-2 outline-none"
                                style={{ background: '#131318', border: '1px solid #252540', color: '#e2e8f0' }}
                            >
                                {(Object.entries(PRIORITY_META) as [Priority, typeof PRIORITY_META[Priority]][]).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Reply area */}
                    <div>
                        {/* Toolbar row: label + lang toggle + draft + polish */}
                        <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                            <p className="text-[10px] font-bold tracking-widest" style={{ color: '#94a3b8' }}>
                                ANTWORT AN {firstName.toUpperCase()}
                                {ticket.ai_draft_reply && <span style={{ color: '#a78bfa' }}> · KI-Entwurf verfügbar</span>}
                            </p>
                            <div className="flex items-center gap-1.5">
                                {/* Language toggle */}
                                <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #333' }}>
                                    {(['de', 'en'] as const).map(l => (
                                        <button
                                            key={l}
                                            onClick={() => setLang(l)}
                                            className="text-[10px] font-bold px-2 py-1 transition-colors"
                                            style={{
                                                background: lang === l ? '#5b61ff' : '#131318',
                                                color:      lang === l ? '#fff'     : '#94a3b8',
                                            }}
                                        >
                                            {l.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                                {/* Load AI draft */}
                                {ticket.ai_draft_reply && (
                                    <button
                                        onClick={loadDraft}
                                        className="text-[10px] flex items-center gap-1 px-2 py-1 rounded"
                                        style={{ background: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)' }}
                                    >
                                        <Sparkles size={9} /> KI-Entwurf laden
                                    </button>
                                )}
                                {/* Polish button */}
                                <button
                                    onClick={polish}
                                    disabled={polishing || !reply.trim()}
                                    className="text-[10px] flex items-center gap-1 px-2 py-1 rounded disabled:opacity-40 transition-all"
                                    style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.3)' }}
                                    title="Text verfeinern mit KI"
                                >
                                    <Sparkles size={9} /> {polishing ? 'Verfeinere…' : `✨ Polish (${lang.toUpperCase()})`}
                                </button>
                            </div>
                        </div>

                        <textarea
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                            rows={9}
                            placeholder={`Antwort an ${firstName} eingeben…`}
                            className="w-full text-sm outline-none rounded-xl px-4 py-3 resize-none"
                            style={{ background: '#131318', border: '1px solid #252540', color: '#e2e8f0', lineHeight: 1.7 }}
                        />
                        <p className="text-[10px] mt-1 font-medium" style={{ color: '#7a90b8' }}>
                            Human-in-the-loop: Überprüfen Sie die Antwort sorgfältig, bevor Sie senden.
                        </p>
                    </div>

                    {msg && (
                        <p className="text-xs" style={{ color: msg.startsWith('✓') ? '#10b981' : '#ef4444' }}>{msg}</p>
                    )}
                </div>

                {/* Footer actions */}
                <div className="px-5 py-4 flex gap-2 justify-between flex-wrap" style={{ borderTop: '1px solid #222' }}>
                    <div className="flex gap-2">
                        {/* Save metadata/draft only — does NOT send to user */}
                        <button
                            onClick={() => save()}
                            disabled={saving}
                            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-semibold disabled:opacity-50"
                            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}
                            title="Entwurf speichern — wird dem Nutzer NICHT gezeigt"
                        >
                            <Pencil size={12} />
                            {saving ? 'Speichere…' : 'Entwurf speichern'}
                        </button>
                    </div>

                    <div className="flex gap-2">
                        {/* Reply but keep open (multi-turn) */}
                        <button
                            onClick={sendReply}
                            disabled={saving || !reply.trim() || isResolved}
                            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-bold text-white disabled:opacity-40 transition-all hover:-translate-y-0.5"
                            style={{ background: '#5b61ff', boxShadow: '0 4px 12px rgba(91,97,255,0.3)' }}
                            title="Antwort senden – Ticket bleibt offen (wartet auf Rückmeldung)"
                        >
                            <Send size={12} /> Antworten
                        </button>
                        {/* Reply + resolve */}
                        <button
                            onClick={resolveAndSend}
                            disabled={saving || !reply.trim() || isResolved}
                            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-bold text-white disabled:opacity-40 transition-all hover:-translate-y-0.5"
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
                        >
                            <CheckSquare size={12} />
                            Antworten &amp; Lösen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Main SupportTab ────────────────────────────────────────────────────────

type FilterStatus = 'all' | Status

export default function SupportTab() {
    const [tickets,     setTickets]     = useState<Ticket[]>([])
    const [loading,     setLoading]     = useState(true)
    const [search,      setSearch]      = useState('')
    const [statusFilt,  setStatusFilt]  = useState<FilterStatus>('all')
    const [priorityFilt,setPriorityFilt]= useState<'all' | Priority>('all')
    const [selected,    setSelected]    = useState<Ticket | null>(null)

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res  = await fetch('/api/support/tickets?admin=1')
            const data = await res.json()
            setTickets(Array.isArray(data) ? data : [])
        } catch { /* ignore */ }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { load() }, [load])

    function handleUpdated(updated: Ticket) {
        setTickets(prev => prev.map(t => t.id === updated.id ? updated : t))
        setSelected(updated)
    }

    const filtered = tickets.filter(t => {
        if (statusFilt   !== 'all' && t.status   !== statusFilt)   return false
        if (priorityFilt !== 'all' && t.priority !== priorityFilt) return false
        if (search.trim()) {
            const q = search.toLowerCase()
            if (!t.subject.toLowerCase().includes(q) &&
                !t.user_email.toLowerCase().includes(q) &&
                !(t.org_name ?? '').toLowerCase().includes(q)) return false
        }
        return true
    })

    const openCount     = tickets.filter(t => t.status === 'open').length
    const criticalCount = tickets.filter(t => t.priority === 'critical').length
    const resolvedCount = tickets.filter(t => t.status === 'resolved').length
    const highCount     = tickets.filter(t => t.priority === 'high').length

    return (
        <>
            {selected && (
                <TicketDetail
                    ticket={selected}
                    onClose={() => setSelected(null)}
                    onUpdated={handleUpdated}
                />
            )}

            <div className="space-y-5">
                {/* KPI row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Offen',         value: openCount,     color: '#ef4444', filter: 'open'     as FilterStatus },
                        { label: 'Kritisch',       value: criticalCount, color: '#f97316', filter: 'all'      as FilterStatus },
                        { label: 'Hoch',           value: highCount,     color: '#f59e0b', filter: 'all'      as FilterStatus },
                        { label: 'Gelöst (ges.)',  value: resolvedCount, color: '#10b981', filter: 'resolved' as FilterStatus },
                    ].map(kpi => (
                        <button
                            key={kpi.label}
                            onClick={() => setStatusFilt(kpi.filter)}
                            className="p-4 rounded-xl text-left transition-all hover:scale-[1.01]"
                            style={{ background: '#0f0f14', border: `1px solid ${statusFilt === kpi.filter ? kpi.color : '#252540'}` }}
                        >
                            <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                            <p className="text-xs mt-0.5 font-medium" style={{ color: '#94a3b8' }}>{kpi.label}</p>
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex gap-3 flex-wrap items-center">
                    {/* Search */}
                    <div className="flex items-center gap-2 flex-1 min-w-[180px] px-3 py-2 rounded-xl"
                        style={{ background: '#131318', border: '1px solid #252540' }}>
                        <Search size={13} style={{ color: '#7a90b8' }} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Betreff, E-Mail, Unternehmen…"
                            className="bg-transparent flex-1 text-sm outline-none placeholder:text-[#4a5a78]"
                            style={{ color: '#e2e8f0' }}
                        />
                    </div>

                    {/* Status filter chips */}
                    <div className="flex items-center gap-1 flex-wrap">
                        <Filter size={12} style={{ color: '#7a90b8' }} />
                        {(['all', 'open', 'in_progress', 'resolved', 'wont_fix'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilt(s)}
                                className="text-[11px] font-semibold px-2 py-1 rounded-lg transition-all"
                                style={{
                                    background: statusFilt === s ? (s === 'all' ? '#5b61ff' : STATUS_META[s as Status]?.color ?? '#5b61ff') + '25' : '#131318',
                                    border: `1px solid ${statusFilt === s ? (s === 'all' ? '#5b61ff' : STATUS_META[s as Status]?.color ?? '#5b61ff') : '#252540'}`,
                                    color: statusFilt === s ? (s === 'all' ? '#a5b4fc' : STATUS_META[s as Status]?.color ?? '#a5b4fc') : '#94a3b8',
                                }}
                            >
                                {s === 'all' ? 'Alle' : STATUS_META[s as Status]?.label}
                            </button>
                        ))}
                    </div>

                    {/* Priority filter chips */}
                    <div className="flex items-center gap-1 flex-wrap">
                        {(['all', 'critical', 'high', 'normal', 'low'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPriorityFilt(p)}
                                className="text-[11px] font-semibold px-2 py-1 rounded-lg transition-all"
                                style={{
                                    background: priorityFilt === p ? (p === 'all' ? '#5b61ff' : PRIORITY_META[p as Priority]?.color ?? '#5b61ff') + '20' : 'transparent',
                                    border: `1px solid ${priorityFilt === p ? (p === 'all' ? '#5b61ff' : PRIORITY_META[p as Priority]?.color ?? '#5b61ff') : 'transparent'}`,
                                    color: priorityFilt === p ? (p === 'all' ? '#a5b4fc' : PRIORITY_META[p as Priority]?.color ?? '#a5b4fc') : '#7a90b8',
                                }}
                            >
                                {p === 'all' ? 'Alle Prio' : PRIORITY_META[p as Priority]?.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={load}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        title="Aktualisieren"
                    >
                        <RefreshCw size={13} style={{ color: '#7a90b8' }} />
                    </button>
                    <span className="text-xs font-medium" style={{ color: '#7a90b8' }}>{filtered.length} Ticket{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Ticket list */}
                <div className="rounded-2xl overflow-hidden" style={{ background: '#0f0f14', border: '1px solid #252540' }}>
                    {/* Table header */}
                    <div
                        className="grid gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{ gridTemplateColumns: '2fr 1fr 0.7fr 0.7fr 0.8fr 0.6fr', color: '#7a90b8', borderBottom: '1px solid #252540', background: '#111120' }}
                    >
                        <span>Betreff / Nutzer</span>
                        <span>Kategorie</span>
                        <span>Priorität</span>
                        <span>Status</span>
                        <span>Eingegangen</span>
                        <span />
                    </div>

                    {loading ? (
                        <div className="py-16 text-center text-sm" style={{ color: '#7a90b8' }}>Lädt…</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center text-sm" style={{ color: '#7a90b8' }}>Keine Tickets gefunden.</div>
                    ) : filtered.map(ticket => (
                        <div
                            key={ticket.id}
                            className="grid gap-3 px-4 py-3 items-center transition-colors hover:bg-white/[0.03] cursor-pointer"
                            style={{
                                gridTemplateColumns: '2fr 1fr 0.7fr 0.7fr 0.8fr 0.6fr',
                                borderBottom: '1px solid #1c1c2c',
                                borderLeft: `3px solid ${PRIORITY_META[ticket.priority]?.color ?? '#333'}`,
                            }}
                            onClick={() => setSelected(ticket)}
                        >
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{ticket.subject}</p>
                                <p className="text-xs truncate mt-0.5" style={{ color: '#7a90b8' }}>
                                    {ticket.user_email} · {ticket.org_name}
                                </p>
                                {ticket.ai_summary && (
                                    <p className="text-[10px] truncate mt-0.5" style={{ color: '#8b5cf6' }}>
                                        ❆ {ticket.ai_summary}
                                    </p>
                                )}
                            </div>
                            <div><CategoryBadge category={ticket.category} /></div>
                            <div><PriorityBadge priority={ticket.priority} /></div>
                            <div><StatusBadge   status={ticket.status} /></div>
                            <div className="text-[10px] font-medium" style={{ color: '#7a90b8' }}>
                                {new Date(ticket.created_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="flex justify-end">
                                <ChevronDown size={13} style={{ color: '#7a90b8' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
