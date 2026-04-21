'use client'

import React, { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import {
    Users, AlertTriangle, CheckCircle2, Clock,
    Search, Filter, Crown, Eye, Shield, RefreshCw,
    Calendar, Database, BarChart2, Zap, XCircle,
    ChevronDown, ChevronUp, Mail, ArrowUpRight, Send, X,
    Sparkles, Trash2, ChevronRight, UserMinus, MailCheck,
    CheckSquare, Square, MessageSquare, LineChart, Globe, Layers,
    RotateCcw,
} from 'lucide-react'
import type { AdminUser, AdminStats, AdminLead, GAStats } from './page'
import dynamic from 'next/dynamic'

const SupportTab = dynamic(() => import('./SupportTab'), { ssr: false })

// ─── Helpers ───────────────────────────────────────────────────

function fmt(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtRelative(iso: string | null) {
    if (!iso) return '—'
    const diff = Date.now() - new Date(iso).getTime()
    const d = Math.floor(diff / 86_400_000)
    if (d === 0) return 'Heute'
    if (d === 1) return 'Gestern'
    if (d < 7)   return `vor ${d} Tagen`
    return fmt(iso)
}

function planBadge(plan: string | null) {
    if (!plan || plan === 'trial' || plan === 'free')
        return { label: 'Test', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
    return { label: 'Lizenz', color: '#10b981', bg: 'rgba(16,185,129,0.12)' }
}

function urgencyBadge(urgency: string) {
    if (urgency === 'critical') return { label: 'Kritisch', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' }
    if (urgency === 'soon')     return { label: 'Bald', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
    return { label: 'Recherche', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' }
}

function trialStatus(user: AdminUser) {
    // Never show trial countdown for licensed users
    if (['licensed', 'paylens', 'paylens_ai'].includes(user.plan ?? '')) return null
    if (!user.trial_ends_at) return null
    const diff = new Date(user.trial_ends_at).getTime() - Date.now()
    if (diff < 0) return { label: 'Abgelaufen', color: '#ef4444' }
    const days = Math.ceil(diff / 86_400_000)
    if (days <= 1) return { label: `${days}d verbleibend`, color: '#ef4444' }
    if (days <= 3) return { label: `${days}d verbleibend`, color: '#f59e0b' }
    return { label: `${days}d verbleibend`, color: '#10b981' }
}

// ─── CompLens Logo (matches main UI) ─────────────────────────────

function AdminLogo() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Same SVG as /components/ui/Logo.tsx, hardcoded for dark admin bg */}
            <svg
                width="31"
                height="31"
                viewBox="0 0 31 31"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
            >
                <path d="M 23.5 13.5 A 10 10 0 1 1 17.5 6.5" stroke="#38bdf8" strokeWidth="3.5" />
                <path d="M 25 1.5 Q 25 6 29.5 6 Q 25 6 25 10.5 Q 25 6 20.5 6 Q 25 6 25 1.5 Z" fill="#38bdf8" />
            </svg>
            <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1.1 }}>CompLens</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffffff', marginTop: 2 }}>Admin Panel</div>
            </div>
        </div>
    )
}

// ─── Lang Toggle ───────────────────────────────────────────────

type Lang = 'de' | 'en'

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
    return (
        <div
            className="flex items-center rounded-lg overflow-hidden text-xs font-bold"
            style={{ border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(15,15,20,0.8)' }}
        >
            {(['de', 'en'] as Lang[]).map(l => (
                <button
                    key={l}
                    onClick={() => onChange(l)}
                    className="px-2.5 py-1 transition-all"
                    style={{
                        background: lang === l ? 'rgba(99,102,241,0.5)' : 'transparent',
                        color: lang === l ? '#fff' : '#888',
                    }}
                >
                    {l.toUpperCase()}
                </button>
            ))}
        </div>
    )
}

// ─── Single Email Compose Modal ────────────────────────────────

function EmailComposeModal({
    toEmail, onClose, adminKey,
}: { toEmail: string; onClose: () => void; adminKey?: string }) {
    const [subject,    setSubject]    = useState('')
    const [body,       setBody]       = useState('')
    const [senderName, setSenderName] = useState('CompLens')
    const [lang,       setLang]       = useState<Lang>('de')
    const [sending,    setSending]    = useState(false)
    const [polishing,  setPolishing]  = useState(false)
    const [result,     setResult]     = useState<{ ok: boolean; msg: string } | null>(null)

    async function send() {
        if (!subject.trim() || !body.trim()) return
        setSending(true)
        try {
            const res = await fetch(`/superadmin/actions/send-email?key=${adminKey ?? ''}`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ toEmail, subject: subject.trim(), body: body.trim(), lang, senderName: senderName.trim() || 'CompLens' }),
            })
            const data = await res.json()
            if (res.ok) {
                setResult({ ok: true, msg: 'E-Mail erfolgreich gesendet!' })
                setTimeout(onClose, 2000)
            } else {
                setResult({ ok: false, msg: data.error ?? 'Unbekannter Fehler.' })
            }
        } catch {
            setResult({ ok: false, msg: 'Netzwerkfehler.' })
        } finally {
            setSending(false)
        }
    }

    async function polish() {
        if (!body.trim()) return
        setPolishing(true); setResult(null)
        try {
            const res = await fetch(`/superadmin/actions/polish-email?key=${adminKey ?? ''}`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ subject: subject.trim(), body: body.trim(), lang }),
            })
            const data = await res.json()
            if (res.ok && data.polished) {
                // Update both subject AND body independently
                if (data.polishedSubject?.trim()) setSubject(data.polishedSubject.trim())
                setBody(data.polished)
                setResult({ ok: true, msg: `✨ Betreff & Text verbessert (${lang.toUpperCase()}).` })
            } else {
                setResult({ ok: false, msg: data.error ?? 'Fehler beim Verbessern.' })
            }
        } catch {
            setResult({ ok: false, msg: 'Netzwerkfehler.' })
        } finally {
            setPolishing(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                className="w-full max-w-lg rounded-2xl p-6 space-y-4"
                style={{ background: '#131318', border: '1px solid #222' }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-white text-sm">E-Mail senden</h3>
                        <p className="text-xs mt-0.5" style={{ color: '#888' }}>An: {toEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <LangToggle lang={lang} onChange={setLang} />
                        <button onClick={onClose} style={{ color: '#666' }}><X size={16} /></button>
                    </div>
                </div>

                <input
                    value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    placeholder="Von (Ihr Name, z.B. Peter)"
                    className="w-full text-sm outline-none rounded-lg px-3 py-2"
                    style={{ background: '#0f0f14', border: '1px solid #333', color: '#e2e8f0' }}
                />

                <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Betreff / Subject"
                    className="w-full text-sm outline-none rounded-lg px-3 py-2"
                    style={{ background: '#0f0f14', border: '1px solid #333', color: '#e2e8f0' }}
                    autoFocus
                />

                <div className="relative">
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder={lang === 'en' ? 'Message…' : 'Nachricht…'}
                        rows={7}
                        className="w-full text-sm outline-none rounded-lg px-3 py-2 resize-none"
                        style={{ background: '#0f0f14', border: '1px solid #333', color: '#e2e8f0', paddingBottom: '46px' }}
                    />
                    <button
                        onClick={polish}
                        disabled={polishing || !body.trim()}
                        className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg font-semibold disabled:opacity-40 transition-all hover:brightness-110"
                        style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }}
                        title="Polish with AI"
                    >
                        <Sparkles size={11} />
                        {polishing ? (lang === 'en' ? 'Polishing…' : 'Verbessert…') : `✦ Polish → ${lang.toUpperCase()}`}
                    </button>
                </div>

                {result && (
                    <p className="text-xs" style={{ color: result.ok ? '#10b981' : '#ef4444' }}>{result.msg}</p>
                )}

                <div className="flex gap-2 justify-end">
                    <button onClick={onClose} className="text-xs px-3 py-2 rounded-lg" style={{ border: '1px solid #333', color: '#888' }}>Abbrechen</button>
                    <button
                        onClick={send}
                        disabled={sending || !subject.trim() || !body.trim()}
                        className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                        style={{ background: '#5b61ff', color: '#fff' }}
                    >
                        <Send size={12} />
                        {sending ? 'Sendet…' : 'Senden'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Mass Email Modal ──────────────────────────────────────────

type MassGroup = 'all' | 'trial' | 'expired' | 'licensed' | 'never_activated'

const MASS_GROUPS: { id: MassGroup; label: string; desc: string; color: string }[] = [
    { id: 'all',             label: 'Alle Nutzer',          desc: 'Gesamte Nutzerbasis',              color: '#5b61ff' },
    { id: 'trial',           label: 'Im Test (aktiv)',       desc: 'Trial-Nutzer, noch nicht abgelaufen', color: '#f59e0b' },
    { id: 'expired',         label: 'Test abgelaufen',       desc: 'Trial ist abgelaufen, kein Upgrade', color: '#ef4444' },
    { id: 'licensed',        label: 'Lizenziert',            desc: 'Bezahlte Nutzer',                  color: '#10b981' },
    { id: 'never_activated', label: 'Nie aktiviert',         desc: 'Noch kein Datensatz importiert',   color: '#f97316' },
]

function MassEmailModal({
    users, onClose, adminKey,
}: { users: AdminUser[]; onClose: () => void; adminKey?: string }) {
    const [group,     setGroup]     = useState<MassGroup>('trial')
    const [subject,   setSubject]   = useState('')
    const [body,      setBody]      = useState('')
    const [lang,      setLang]      = useState<Lang>('de')
    const [sending,   setSending]   = useState(false)
    const [polishing, setPolishing] = useState(false)
    const [result,    setResult]    = useState<{ ok: boolean; sent: number; failed: number } | null>(null)
    const [msgResult, setMsgResult] = useState<{ ok: boolean; msg: string } | null>(null)

    const targetEmails = useMemo(() => {
        const now = new Date().toISOString()
        switch (group) {
            case 'all':             return users.map(u => u.email)
            case 'trial':           return users.filter(u => (u.plan === 'trial' || u.plan === 'free') && (!u.trial_ends_at || u.trial_ends_at >= now)).map(u => u.email)
            case 'expired':         return users.filter(u => u.trial_ends_at && u.trial_ends_at < now && u.plan !== 'licensed').map(u => u.email)
            case 'licensed':        return users.filter(u => u.plan === 'licensed' || u.plan === 'paylens' || u.plan === 'paylens_ai').map(u => u.email)
            case 'never_activated': return users.filter(u => u.dataset_count === 0).map(u => u.email)
        }
    }, [group, users])

    async function polish() {
        if (!body.trim()) return
        setPolishing(true); setMsgResult(null)
        try {
            const res = await fetch(`/superadmin/actions/polish-email?key=${adminKey ?? ''}`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ subject: subject.trim(), body: body.trim(), lang }),
            })
            const data = await res.json()
            if (res.ok && data.polished) {
                if (data.polishedSubject?.trim()) setSubject(data.polishedSubject.trim())
                setBody(data.polished)
                setMsgResult({ ok: true, msg: `✨ Betreff & Text verbessert (${lang.toUpperCase()}).` })
            } else {
                setMsgResult({ ok: false, msg: data.error ?? 'Fehler beim Verbessern.' })
            }
        } catch {
            setMsgResult({ ok: false, msg: 'Netzwerkfehler.' })
        } finally {
            setPolishing(false)
        }
    }

    async function send() {
        if (!subject.trim() || !body.trim() || targetEmails.length === 0) return
        setSending(true); setResult(null)
        try {
            const res = await fetch(`/superadmin/actions/mass-email?key=${adminKey ?? ''}`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ toEmails: targetEmails, subject: subject.trim(), body: body.trim(), lang }),
            })
            const data = await res.json()
            setResult({ ok: res.ok, sent: data.sent ?? 0, failed: data.failed ?? 0 })
        } catch {
            setResult({ ok: false, sent: 0, failed: targetEmails.length })
        } finally {
            setSending(false)
        }
    }

    const selectedGroup = MASS_GROUPS.find(g => g.id === group)!

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                className="w-full max-w-2xl rounded-2xl p-6 space-y-5"
                style={{ background: '#131318', border: '1px solid #222', maxHeight: '90vh', overflowY: 'auto' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MailCheck size={18} style={{ color: '#5b61ff' }} />
                        <div>
                            <h3 className="font-bold text-white text-sm">Massen-E-Mail</h3>
                            <p className="text-xs" style={{ color: '#666' }}>E-Mail an Nutzergruppe senden</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <LangToggle lang={lang} onChange={setLang} />
                        <button onClick={onClose} style={{ color: '#666' }}><X size={16} /></button>
                    </div>
                </div>

                {/* Group selector */}
                <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#666' }}>ZIELGRUPPE</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {MASS_GROUPS.map(g => (
                            <button
                                key={g.id}
                                onClick={() => setGroup(g.id)}
                                className="text-left p-3 rounded-xl transition-all border"
                                style={{
                                    background: group === g.id ? `${g.color}18` : '#0f0f14',
                                    borderColor: group === g.id ? g.color : '#222',
                                }}
                            >
                                <div className="flex items-center gap-1.5 mb-1">
                                    {group === g.id
                                        ? <CheckSquare size={12} style={{ color: g.color }} />
                                        : <Square size={12} style={{ color: '#555' }} />
                                    }
                                    <span className="text-xs font-semibold" style={{ color: group === g.id ? g.color : '#888' }}>{g.label}</span>
                                </div>
                                <p className="text-[10px]" style={{ color: '#555' }}>{g.desc}</p>
                            </button>
                        ))}
                    </div>
                    {/* Recipient count */}
                    <div
                        className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{ background: `${selectedGroup.color}12`, border: `1px solid ${selectedGroup.color}30` }}
                    >
                        <Users size={12} style={{ color: selectedGroup.color }} />
                        <span className="text-xs font-semibold" style={{ color: selectedGroup.color }}>
                            {targetEmails.length} Empfänger: {targetEmails.slice(0, 3).join(', ')}{targetEmails.length > 3 ? ` +${targetEmails.length - 3} weitere` : ''}
                        </span>
                    </div>
                </div>

                {/* Subject */}
                <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Betreff / Subject"
                    className="w-full text-sm outline-none rounded-lg px-3 py-2"
                    style={{ background: '#0f0f14', border: '1px solid #333', color: '#e2e8f0' }}
                />

                {/* Body */}
                <div className="relative">
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder={lang === 'en' ? 'Message…' : 'Nachricht…'}
                        rows={8}
                        className="w-full text-sm outline-none rounded-lg px-3 py-2 resize-none"
                        style={{ background: '#0f0f14', border: '1px solid #333', color: '#e2e8f0', paddingBottom: '46px' }}
                    />
                    <button
                        onClick={polish}
                        disabled={polishing || !body.trim()}
                        className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg font-semibold disabled:opacity-40 transition-all hover:brightness-110"
                        style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }}
                    >
                        <Sparkles size={11} />
                        {polishing ? 'Verbessert…' : `✦ Polish → ${lang.toUpperCase()}`}
                    </button>
                </div>

                {msgResult && (
                    <p className="text-xs" style={{ color: msgResult.ok ? '#10b981' : '#ef4444' }}>{msgResult.msg}</p>
                )}

                {/* Result banner */}
                {result && (
                    <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: result.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${result.ok ? '#10b981' : '#ef4444'}40` }}
                    >
                        <MailCheck size={16} style={{ color: result.ok ? '#10b981' : '#ef4444' }} />
                        <div>
                            <p className="text-sm font-semibold" style={{ color: result.ok ? '#10b981' : '#ef4444' }}>
                                {result.sent} gesendet · {result.failed} fehlgeschlagen
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-between items-center">
                    <p className="text-[11px]" style={{ color: '#555' }}>
                        ⚠ Diese Aktion sendet E-Mails an {targetEmails.length} echte Adressen.
                    </p>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="text-xs px-3 py-2 rounded-lg" style={{ border: '1px solid #333', color: '#888' }}>Schließen</button>
                        <button
                            onClick={send}
                            disabled={sending || !subject.trim() || !body.trim() || targetEmails.length === 0}
                            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                            style={{ background: '#5b61ff', color: '#fff' }}
                        >
                            <Send size={12} />
                            {sending ? `Sendet ${targetEmails.length}…` : `An ${targetEmails.length} senden`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Delete User Modal ─────────────────────────────────────────

function DeleteUserModal({
    user, onClose, onDeleted, adminKey,
}: { user: AdminUser; onClose: () => void; onDeleted: (id: string) => void; adminKey?: string }) {
    const [deleting, setDeleting] = useState(false)
    const [error,    setError]    = useState('')

    async function handleDelete() {
        setDeleting(true); setError('')
        try {
            const res = await fetch(`/superadmin/actions/delete-user?key=${adminKey ?? ''}`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ userId: user.id }),
            })
            if (res.ok) { onDeleted(user.id); onClose() }
            else { const d = await res.json(); setError(d.error ?? 'Unbekannter Fehler.') }
        } catch { setError('Netzwerkfehler.') }
        finally    { setDeleting(false) }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: '#131318', border: '1px solid #3f1f1f' }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                        <Trash2 size={18} style={{ color: '#ef4444' }} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Nutzer löschen</h3>
                        <p className="text-xs mt-0.5" style={{ color: '#888' }}>Diese Aktion kann nicht rückgängig gemacht werden.</p>
                    </div>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#0f0f14', border: '1px solid #2a2a2a' }}>
                    <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                    {user.org_name && <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{user.org_name}</p>}
                </div>
                <p className="text-xs" style={{ color: '#ef4444', lineHeight: 1.6 }}>
                    ⚠ Der Nutzer wird dauerhaft aus Supabase Auth gelöscht und aus der Organisation entfernt.
                </p>
                {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}
                <div className="flex gap-2 justify-end">
                    <button onClick={onClose} className="text-xs px-3 py-2 rounded-lg" style={{ border: '1px solid #333', color: '#888' }}>Abbrechen</button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                        style={{ background: '#ef4444', color: '#fff' }}
                    >
                        <Trash2 size={12} />
                        {deleting ? 'Löschen…' : 'Endgültig löschen'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── KPI Card ─────────────────────────────────────────────────

function KpiCard({
    icon: Icon, label, value, color, onClick, active,
}: {
    icon: typeof Users; label: string; value: number
    color: string; onClick?: () => void; active?: boolean
}) {
    return (
        <button
            onClick={onClick}
            className="glass-card p-4 text-left w-full transition-all hover:scale-[1.01]"
            style={{ border: active ? `1.5px solid ${color}` : undefined, outline: 'none' }}
        >
            <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: color + '18' }}>
                    <Icon size={17} style={{ color }} />
                </div>
                {active && <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: color }} />}
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{label}</p>
        </button>
    )
}

// ─── Action Button ─────────────────────────────────────────────

function ActionBtn({
    icon: Icon, label, color, href, onClick, danger,
}: {
    icon: typeof Mail; label: string; color: string
    href?: string; onClick?: () => void; danger?: boolean
}) {
    const content = <><Icon size={13} style={{ color, flexShrink: 0 }} />{label}</>
    const cls     = 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full cursor-pointer'
    const style: React.CSSProperties = { color: danger ? color : 'var(--color-pl-text-primary)' }
    if (href) return <a href={href} className={cls} style={style}>{content}</a>
    return <button onClick={onClick} className={cls} style={style}>{content}</button>
}

// ─── User Row Actions ──────────────────────────────────────────

function UserActions({
    user, adminKey, onEmail, onDelete,
}: { user: AdminUser; adminKey?: string; onEmail: (email: string) => void; onDelete: (u: AdminUser) => void }) {
    const [expanded, setExpanded] = useState(false)
    const btnRef = useRef<HTMLDivElement>(null)

    // Close when clicking outside
    useEffect(() => {
        if (!expanded) return
        const handler = (e: MouseEvent) => {
            if (!btnRef.current?.contains(e.target as Node)) setExpanded(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [expanded])

    return (
        <div ref={btnRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors hover:brightness-110"
                style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', whiteSpace: 'nowrap' }}
            >
                Aktionen {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {expanded && (
                <div
                    style={{
                        position: 'absolute', right: 0, top: '110%', zIndex: 9999,
                        width: 210, background: '#1a1a28',
                        border: '1px solid #2a2a3a',
                        borderRadius: 12, padding: '6px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    }}
                >
                    <ActionBtn icon={Zap}          label="Trial verlängern (+7d)" color="#f59e0b" href={`/superadmin/actions/extend-trial?userId=${user.id}&key=${adminKey}`} />
                    <ActionBtn icon={CheckCircle2} label="Lizenz aktivieren"       color="#10b981" href={`/superadmin/actions/activate-license?userId=${user.id}&key=${adminKey}`} />
                    <ActionBtn
                        icon={Layers}
                        label={`Stellenarchitektur ${user.job_architecture_enabled ? '✓' : '✗'}`}
                        color={user.job_architecture_enabled ? '#10b981' : 'var(--color-pl-text-tertiary, #94a3b8)'}
                        onClick={async () => {
                            setExpanded(false)
                            if (!user.org_id) return
                            const res = await fetch(`/superadmin/actions/toggle-job-architecture?key=${adminKey ?? ''}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orgId: user.org_id, enable: !user.job_architecture_enabled }),
                            })
                            if (res.ok) window.location.reload()
                        }}
                    />
                    <ActionBtn icon={Mail}         label="E-Mail senden"           color="#5b61ff" onClick={() => { setExpanded(false); onEmail(user.email) }} />
                    <div style={{ height: 1, background: '#2a2a3a', margin: '4px 0' }} />
                    <ActionBtn icon={XCircle}      label="Konto sperren"           color="#ef4444" href={`/superadmin/actions/suspend?userId=${user.id}&key=${adminKey}`} danger />
                    <ActionBtn icon={Trash2}       label="Nutzer löschen"          color="#ef4444" onClick={() => { setExpanded(false); onDelete(user) }} danger />
                    <ActionBtn
                        icon={RotateCcw}
                        label="Account zurücksetzen"
                        color="#ef4444"
                        danger
                        onClick={async () => {
                            setExpanded(false)
                            if (!user.org_id) return
                            if (!confirm('ACHTUNG: Alle Daten dieses Accounts werden unwiderruflich gelöscht. Nur Login-Daten bleiben erhalten.\n\nFortfahren?')) return
                            if (!confirm(`Letzte Warnung: "${user.email}" wird komplett zurückgesetzt. Dieser Vorgang kann NICHT rückgängig gemacht werden.\n\nEndgültig zurücksetzen?`)) return
                            try {
                                const res = await fetch(`/superadmin/actions/reset-account`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ orgId: user.org_id }),
                                })
                                const data = await res.json()
                                if (res.ok && data.success) {
                                    alert(`Account "${user.email}" wurde zurückgesetzt.`)
                                    window.location.reload()
                                } else {
                                    alert(`Fehler: ${data.error ?? 'Unbekannter Fehler'}`)
                                }
                            } catch {
                                alert('Netzwerkfehler beim Zurücksetzen.')
                            }
                        }}
                    />
                </div>
            )}
        </div>
    )
}

// ─── Main Client Component ───────────────────────────────────────

type FilterType = 'all' | 'never_activated' | 'trial_expiring' | 'licensed' | 'trial'

export default function AdminClient({
    users, stats, adminKey, leads = [], gaStats,
}: { users: AdminUser[]; stats: AdminStats; adminKey?: string; leads?: AdminLead[]; gaStats?: GAStats | null }) {
    const [search,        setSearch]        = useState('')
    const [filter,        setFilter]        = useState<FilterType>('all')
    const [sortBy,        setSortBy]        = useState<'created_at' | 'last_active' | 'dataset_count'>('created_at')
    const [sortDir,       setSortDir]       = useState<'desc' | 'asc'>('desc')
    const [emailTarget,   setEmailTarget]   = useState<string | null>(null)
    const [deleteTarget,  setDeleteTarget]  = useState<AdminUser | null>(null)
    const [massEmailOpen, setMassEmailOpen] = useState(false)
    const [localUsers,    setLocalUsers]    = useState<AdminUser[]>(users)
    const [adminTab,      setAdminTab]      = useState<'users' | 'support' | 'leads'>('users')
    const [, startTransition]               = useTransition()

    function handleDeleted(id: string) { setLocalUsers(prev => prev.filter(u => u.id !== id)) }

    function toggleSort(col: typeof sortBy) {
        if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
        else { setSortBy(col); setSortDir('desc') }
    }

    const filtered = useMemo(() => {
        let list = [...localUsers]
        if (filter === 'never_activated') list = list.filter(u => u.dataset_count === 0)
        if (filter === 'trial_expiring') {
            const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
            list = list.filter(u =>
                (u.plan === 'trial' || u.plan === 'free') &&
                u.trial_ends_at && u.trial_ends_at <= in48h && u.trial_ends_at >= new Date().toISOString()
            )
        }
        if (filter === 'licensed') list = list.filter(u => u.plan === 'licensed' || u.plan === 'paylens' || u.plan === 'paylens_ai')
        if (filter === 'trial')    list = list.filter(u => u.plan === 'trial' || u.plan === 'free' || !u.plan)
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(u => u.email.toLowerCase().includes(q) || (u.org_name ?? '').toLowerCase().includes(q))
        }
        list.sort((a, b) => {
            const va = a[sortBy] ?? '', vb = b[sortBy] ?? ''
            if (typeof va === 'number' && typeof vb === 'number')
                return sortDir === 'desc' ? vb - va : va - vb
            return sortDir === 'desc'
                ? String(vb).localeCompare(String(va))
                : String(va).localeCompare(String(vb))
        })
        return list
    }, [localUsers, filter, search, sortBy, sortDir])

    function SortIcon({ col }: { col: typeof sortBy }) {
        if (sortBy !== col) return <ChevronDown size={11} style={{ opacity: 0.3 }} />
        return sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />
    }

    const admins    = filtered.filter(u => u.member_role === 'admin' || !u.member_role)
    const subs      = filtered.filter(u => u.member_role && u.member_role !== 'admin')
    const subsByOrg = subs.reduce<Record<string, AdminUser[]>>((acc, m) => {
        if (!m.org_id) return acc
        acc[m.org_id] = [...(acc[m.org_id] ?? []), m]
        return acc
    }, {})

    return (
        <div className="min-h-screen p-6 space-y-6" style={{ background: '#0a0a0f', color: '#e2e8f0' }}>
            {/* Modals */}
            {emailTarget && (
                <EmailComposeModal toEmail={emailTarget} onClose={() => setEmailTarget(null)} adminKey={adminKey} />
            )}
            {deleteTarget && (
                <DeleteUserModal user={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} adminKey={adminKey} />
            )}
            {massEmailOpen && (
                <MassEmailModal users={localUsers} onClose={() => setMassEmailOpen(false)} adminKey={adminKey} />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <AdminLogo />
                <div className="flex items-center gap-3">
                    {/* Mass Email Button */}
                    <button
                        onClick={() => setMassEmailOpen(true)}
                        className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:brightness-110"
                        style={{ background: 'rgba(91,97,255,0.15)', border: '1px solid rgba(91,97,255,0.35)', color: '#a5b4fc' }}
                    >
                        <MailCheck size={13} />
                        Massen-E-Mail
                    </button>
                    <Shield size={14} style={{ color: '#f59e0b' }} />
                    <span className="text-xs" style={{ color: '#aaa' }}>{new Date().toLocaleTimeString('de-DE')}</span>
                    <button
                        onClick={() => startTransition(() => window.location.reload())}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <RefreshCw size={13} style={{ color: '#aaa' }} />
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#131318', border: '1px solid #1a1a24', alignSelf: 'flex-start' }}>
                {([['users', Users, 'Nutzer'], ['support', MessageSquare, 'Support'], ['leads', Zap, 'Leads']] as const).map(([id, Icon, label]) => (
                    <button
                        key={id}
                        onClick={() => setAdminTab(id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                            background: adminTab === id ? (id === 'support' ? 'rgba(99,102,241,0.3)' : id === 'leads' ? 'rgba(245,158,11,0.2)' : 'rgba(91,97,255,0.2)') : 'transparent',
                            color: adminTab === id ? (id === 'support' ? '#c4b5fd' : id === 'leads' ? '#fcd34d' : '#a5b4fc') : '#aaa',
                        }}
                    >
                        <Icon size={12} /> {label}
                    </button>
                ))}
            </div>

            {adminTab === 'support' ? (
                <SupportTab />
            ) : adminTab === 'leads' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={14} style={{ color: '#f59e0b' }} />
                        <h2 className="text-sm font-bold text-white">Leads ({leads.length})</h2>
                    </div>
                    {leads.length === 0 ? (
                        <div className="text-center py-12 text-sm text-[#888]">Keine Leads vorhanden.</div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #1a1a24', background: '#0b0b0f' }}>
                            <table className="w-full text-xs text-left" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#131318', borderBottom: '1px solid #1a1a24' }}>
                                        {['Datum', 'Name', 'Email', 'Firma', 'Größe', 'HRIS', 'Dringlichkeit'].map(h => (
                                            <th key={h} className="py-3 px-4 font-semibold text-[#888]">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map(lead => {
                                        const ubadge = urgencyBadge(lead.urgency)
                                        const hasAccount = users.some(u => u.email.toLowerCase() === lead.email.toLowerCase())
                                        
                                        return (
                                        <tr key={lead.id} className="group hover:bg-[#1a1a24] transition-colors" style={{ borderBottom: '1px solid #1a1a24' }}>
                                            <td className="py-3 px-4 text-[#aaa] whitespace-nowrap">{new Date(lead.created_at).toLocaleDateString('de-DE')}</td>
                                            <td className="py-3 px-4 font-medium text-white">{lead.first_name} {lead.last_name}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <a href={`mailto:${lead.email}`} className="text-[#38bdf8] hover:underline leading-none">{lead.email}</a>
                                                    {hasAccount ? (
                                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', lineHeight: 1 }}>
                                                            Account erstellt
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded inline-block" style={{ background: 'rgba(255,255,255,0.05)', color: '#888', lineHeight: 1 }}>
                                                            Nur Lead
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-white">{lead.company_name}</td>
                                            <td className="py-3 px-4 text-[#aaa]">{lead.company_size}</td>
                                            <td className="py-3 px-4 text-[#aaa]">{lead.hris}</td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: ubadge.bg, color: ubadge.color }}>
                                                    {ubadge.label}
                                                </span>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (<>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <KpiCard icon={Globe}         label="Aktive Nutzer (GA4)" value={gaStats?.activeUsers ?? 0} color="#8b5cf6" />
                <KpiCard icon={LineChart}     label="Sessions (GA4)"      value={gaStats?.sessions ?? 0}    color="#ec4899" />
                <KpiCard icon={Users}         label="Nutzer gesamt"       value={stats.total_users}         color="#38bdf8" onClick={() => setFilter('all')}             active={filter === 'all'} />
                <KpiCard icon={CheckCircle2}  label="Lizenziert"          value={stats.licensed_users}      color="#34d399" onClick={() => setFilter('licensed')}        active={filter === 'licensed'} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <KpiCard icon={Calendar}      label="Diesen Monat"    value={stats.monthly_signups} color="#a78bfa" />
                <KpiCard icon={Clock}         label="Im Test"         value={stats.trial_users}     color="#fbbf24" onClick={() => setFilter('trial')}           active={filter === 'trial'} />
                <KpiCard icon={AlertTriangle} label="Nie aktiviert"   value={stats.never_activated} color="#f87171" onClick={() => setFilter('never_activated')} active={filter === 'never_activated'} />
                <KpiCard icon={Zap}           label="Läuft in 48h ab" value={stats.trial_expiring}  color="#fb923c" onClick={() => setFilter('trial_expiring')}  active={filter === 'trial_expiring'} />
                <KpiCard icon={Database}      label="Datensätze"      value={stats.total_users - stats.never_activated} color="#6366f1" />
            </div>

            {/* Search + Filter */}
            <div className="flex gap-3 flex-wrap">
                <div
                    className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-xl"
                    style={{ background: '#131318', border: '1px solid #222' }}
                >
                    <Search size={14} style={{ color: '#888' }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="E-Mail oder Unternehmen suchen…"
                        className="bg-transparent flex-1 text-sm outline-none"
                        style={{ color: '#e2e8f0' }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ color: '#888' }}>
                            <XCircle size={13} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={13} style={{ color: '#888' }} />
                    <span className="text-xs" style={{ color: '#ccc' }}>{filtered.length} von {localUsers.length} Nutzern</span>
                </div>
            </div>

            {/* Table — overflow:visible so dropdowns aren't clipped */}
            <div className="rounded-2xl" style={{ background: '#0f0f14', border: '1px solid #1a1a24', overflow: 'visible', position: 'relative' }}>
                {/* Header */}
                <div
                    className="grid gap-4 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white"
                    style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.2fr) minmax(0,0.8fr) minmax(0,0.7fr) minmax(0,0.7fr) minmax(0,0.7fr) minmax(0,0.8fr) 90px', borderBottom: '1px solid #2e2e3f' }}
                >
                    <span className="truncate flex items-center">E-Mail / Unternehmen</span>
                    <span className="flex items-center">Plan</span>
                    <button className="flex items-center gap-1.5 text-left group hover:text-blue-300 transition-colors" onClick={() => toggleSort('dataset_count')}>
                        <Database size={12} className="opacity-60 group-hover:opacity-100" />
                        Datensätze <SortIcon col="dataset_count" />
                    </button>
                    <div className="flex items-center gap-1.5">
                        <BarChart2 size={12} className="opacity-60" />
                        <span>Analysen</span>
                    </div>
                    <button className="flex items-center gap-1 text-left group hover:text-blue-300 transition-colors" onClick={() => toggleSort('created_at')}>
                        Anmeldung <SortIcon col="created_at" />
                    </button>
                    <button className="flex items-center gap-1 text-left group hover:text-blue-300 transition-colors" onClick={() => toggleSort('last_active')}>
                        Zuletzt aktiv <SortIcon col="last_active" />
                    </button>
                    <span className="flex items-center">Rolle</span>
                    <span />
                </div>

                {/* Grouped rows */}
                {filtered.length === 0 ? (
                    <div className="py-16 text-center" style={{ color: '#94a3b8' }}>Keine Nutzer gefunden</div>
                ) : admins.map(user => {
                    const badge       = planBadge(user.plan)
                    const tstat       = trialStatus(user)
                    const neverActive = user.dataset_count === 0
                    const teamMembers = user.org_id ? (subsByOrg[user.org_id] ?? []) : []

                    return (
                        <div key={user.id}>
                            {/* Admin row */}
                            <div
                                className="relative grid gap-4 px-4 py-3 items-center transition-colors hover:bg-white/[0.04]"
                                style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.2fr) minmax(0,0.8fr) minmax(0,0.7fr) minmax(0,0.7fr) minmax(0,0.7fr) minmax(0,0.8fr) 90px', borderBottom: '1px solid #1a1a24' }}
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate text-white">{user.email}</p>
                                    {user.org_name && <p className="text-xs truncate mt-0.5" style={{ color: '#cbd5e1' }}>{user.org_name}</p>}
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {neverActive && (
                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                                                Nie aktiviert
                                            </span>
                                        )}
                                        {teamMembers.length > 0 && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                                                +{teamMembers.length} Teammate{teamMembers.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                                    {tstat && <p className="text-[10px]" style={{ color: tstat.color }}>{tstat.label}</p>}
                                    {user.job_architecture_enabled && (
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded block w-fit" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                                            + Stellen
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-white">
                                    <Database size={12} style={{ color: '#cbd5e1' }} />
                                    <span className="text-sm font-semibold text-white">{user.dataset_count}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-white">
                                    <BarChart2 size={12} style={{ color: '#cbd5e1' }} />
                                    <span className="text-sm font-semibold text-white">{user.analysis_count}</span>
                                </div>
                                <span className="text-xs text-white">{fmt(user.created_at)}</span>
                                <span className="text-xs text-white">{fmtRelative(user.last_active)}</span>
                                <div><Crown size={14} style={{ color: '#38bdf8' }} /></div>
                                <UserActions user={user} adminKey={adminKey} onEmail={e => setEmailTarget(e)} onDelete={u => setDeleteTarget(u)} />
                            </div>

                            {/* Sub-member rows */}
                            {teamMembers.map(member => (
                                <div
                                    key={member.id}
                                    className="relative grid gap-4 px-4 py-2.5 items-center transition-colors hover:bg-white/[0.015]"
                                    style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1.2fr) minmax(0,0.8fr) minmax(0,0.7fr) minmax(0,0.7fr) minmax(0,0.7fr) minmax(0,0.8fr) 90px', borderBottom: '1px solid #1a1a24', background: 'rgba(99,102,241,0.03)' }}
                                >
                                    <div className="min-w-0 flex items-center gap-2">
                                        <ChevronRight size={11} style={{ color: '#9ca3af', flexShrink: 0 }} />
                                        <div>
                                            <p className="text-xs font-semibold truncate text-white">{member.email}</p>
                                            <span className="text-[10px] font-bold" style={{ color: member.member_role === 'viewer' ? '#34d399' : '#a78bfa' }}>
                                                {member.member_role === 'viewer' ? 'Lesezugriff' : member.member_role}
                                            </span>
                                        </div>
                                    </div>
                                    <div /><div /><div />
                                    <span className="text-xs text-[#cbd5e1]">{fmt(member.created_at)}</span>
                                    <span className="text-xs text-[#cbd5e1]">{fmtRelative(member.last_active)}</span>
                                    <div>
                                        {member.member_role === 'viewer'
                                            ? <Eye size={12} style={{ color: '#34d399' }} />
                                            : <UserMinus size={12} style={{ color: '#a78bfa' }} />
                                        }
                                    </div>
                                    <UserActions user={member} adminKey={adminKey} onEmail={e => setEmailTarget(e)} onDelete={u => setDeleteTarget(u)} />
                                </div>
                            ))}
                        </div>
                    )
                })}
            </div>

            </>)}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs" style={{ color: '#cbd5e1' }}>
                <span>CompLens Admin Panel · Nicht öffentlich · Nur interner Gebrauch</span>
                <a href="mailto:hallo@complens.de" className="flex items-center gap-1 hover:text-white transition-colors">
                    hallo@complens.de <ArrowUpRight size={11} />
                </a>
            </div>
        </div>
    )
}
