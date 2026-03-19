'use client'

import { useState, useEffect, useTransition } from 'react'
import {
    UserPlus, Trash2, MailCheck, RefreshCw, Shield,
    Eye, Clock, CheckCircle2, AlertTriangle, Users,
    Crown, ChevronDown, ChevronUp, X,
} from 'lucide-react'
import {
    inviteMember, removeMember, revokeInvitation, resendInvitation,
    type MemberRole,
} from './actions'

// ─── Types ────────────────────────────────────────────────────

type Member = {
    id: string
    user_id: string
    email: string
    role: string
    joined_at: string
    isMe: boolean
    fullName: string
    jobTitle: string
}

type PendingInvite = {
    id: string
    email: string
    role: string
    expires_at: string
    created_at: string
}

type TeamData = {
    members:        Member[]
    pendingInvites: PendingInvite[]
    maxUsers:       number
    plan:           string
    callerRole:     string
    usedSeats:      number
}

type Props = {
    teamData: TeamData
    openInviteOnMount?: boolean
    onInviteMounted?:   () => void
}

// ─── Role helpers ─────────────────────────────────────────────

const ROLE_LABELS: Record<string, { label: string; shortLabel: string; icon: typeof Shield; color: string }> = {
    admin:   { label: 'HR-Administrator',              shortLabel: 'HR-Admin', icon: Crown, color: '#5b61ff' },
    analyst: { label: 'HR-Administrator',              shortLabel: 'HR-Admin', icon: Crown, color: '#5b61ff' },
    viewer:  { label: 'Lesezugriff (Mitarbeitervertr.)', shortLabel: 'Lesen',   icon: Eye,   color: '#10b981' },
}

function roleInfo(role: string) {
    return ROLE_LABELS[role] ?? ROLE_LABELS.viewer
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Invite dialog ────────────────────────────────────────────

function InviteDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [email, setEmail]     = useState('')
    const [name,  setName]      = useState('')
    const [title, setTitle]     = useState('')
    const [role, setRole]       = useState<MemberRole>('viewer')
    const [error, setError]     = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [pending, start]      = useTransition()

    async function handleInvite() {
        setError(null)
        start(async () => {
            const res = await inviteMember(email, role, name.trim() || undefined, title.trim() || undefined)
            if (res.error) {
                setError(res.error)
            } else {
                setSuccess(true)
                setTimeout(() => { onSuccess(); onClose() }, 1500)
            }
        })
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div
                className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
                style={{
                    background: 'var(--color-pl-surface)',
                    border: '1px solid var(--color-pl-border)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-base font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Teammitglied einladen
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Einladungslink ist 7 Tage gültig
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                        <X size={16} style={{ color: 'var(--color-pl-text-tertiary)' }} />
                    </button>
                </div>

                {success ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                        <div>
                            <p className="text-sm font-semibold" style={{ color: '#10b981' }}>Einladung gesendet!</p>
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                {email} erhält in Kürze eine E-Mail.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                E-Mail-Adresse *
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="name@unternehmen.de"
                                className="input-base"
                                onKeyDown={e => e.key === 'Enter' && handleInvite()}
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    Name <span style={{ color: 'var(--color-pl-text-tertiary)', fontWeight: 400 }}>(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Max Mustermann"
                                    className="input-base"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    Titel / Funktion <span style={{ color: 'var(--color-pl-text-tertiary)', fontWeight: 400 }}>(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="HR Manager"
                                    className="input-base"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                Zugriffsrolle
                            </label>
                            <div className="space-y-2">
                                {[
                                    {
                                        value: 'admin' as MemberRole,
                                        label: 'HR-Administrator',
                                        desc: 'Vollzugriff: Daten hochladen, Analysen erstellen, Berichte exportieren, Team verwalten',
                                        icon: Crown,
                                        color: '#5b61ff',
                                    },
                                    {
                                        value: 'viewer' as MemberRole,
                                        label: 'Lesezugriff — Mitarbeitervertretung / Leitung',
                                        desc: 'Nur Ergebnisse einsehen (aggregiert). Keine Upload- oder Export-Rechte.',
                                        icon: Eye,
                                        color: '#10b981',
                                    },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setRole(opt.value)}
                                        className="w-full text-left p-3 rounded-xl transition-all"
                                        style={{
                                            border: role === opt.value
                                                ? `1.5px solid ${opt.color}`
                                                : '1px solid var(--color-pl-border)',
                                            background: role === opt.value
                                                ? `${opt.color}12`
                                                : 'transparent',
                                        }}
                                    >
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <opt.icon size={14} style={{ color: opt.color }} />
                                            <span className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                                {opt.label}
                                            </span>
                                        </div>
                                        <p className="text-xs pl-5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            {opt.desc}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                                <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                                <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
                            </div>
                        )}

                        <div className="flex gap-2 pt-1">
                            <button onClick={onClose} className="flex-1 text-sm font-medium py-2.5 rounded-lg transition-colors" style={{ border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-secondary)' }}>
                                Abbrechen
                            </button>
                            <button
                                onClick={handleInvite}
                                disabled={pending || !email.trim()}
                                className="flex-1 btn-primary text-sm"
                            >
                                {pending ? 'Wird gesendet…' : <><MailCheck size={14} />Einladen</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Main TeamPanel component ─────────────────────────────────

export default function TeamPanel({ teamData, openInviteOnMount, onInviteMounted }: Props) {
    const {
        members, pendingInvites, maxUsers, plan,
        callerRole, usedSeats,
    } = teamData

    const [showInvite,     setShowInvite]     = useState(false)
    const [removingId,     setRemovingId]      = useState<string | null>(null)
    const [revokingId,     setRevokingId]      = useState<string | null>(null)
    const [resendingId,    setResendingId]     = useState<string | null>(null)
    const [feedback,       setFeedback]        = useState<{ id: string; msg: string; ok: boolean } | null>(null)
    const [, startTransition] = useTransition()

    // Auto-open invite dialog when triggered from OrgTab
    useEffect(() => {
        if (openInviteOnMount) {
            setShowInvite(true)
            onInviteMounted?.() // reset parent flag
        }
    }, [openInviteOnMount, onInviteMounted])

    const isAdmin     = callerRole === 'admin'
    const isTrial     = plan === 'trial' || plan === 'free'
    const slotsLeft   = maxUsers - usedSeats
    const atCapacity  = slotsLeft <= 0

    function flash(id: string, msg: string, ok: boolean) {
        setFeedback({ id, msg, ok })
        setTimeout(() => setFeedback(null), 3000)
    }

    async function handleRemove(memberId: string) {
        setRemovingId(memberId)
        startTransition(async () => {
            const res = await removeMember(memberId)
            setRemovingId(null)
            if (res.error) flash(memberId, res.error, false)
        })
    }

    async function handleRevoke(invId: string) {
        setRevokingId(invId)
        startTransition(async () => {
            const res = await revokeInvitation(invId)
            setRevokingId(null)
            if (res.error) flash(invId, res.error, false)
        })
    }

    async function handleResend(invId: string) {
        setResendingId(invId)
        startTransition(async () => {
            const res = await resendInvitation(invId)
            setResendingId(null)
            flash(invId, res.error ?? 'Einladung erneut gesendet.', !res.error)
        })
    }

    return (
        <>
            {showInvite && (
                <InviteDialog
                    onClose={() => setShowInvite(false)}
                    onSuccess={() => setShowInvite(false)}
                />
            )}

            <div className="glass-card p-5 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Team & Zugriffsrechte
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {usedSeats} von {maxUsers} Plätzen belegt
                        </p>
                    </div>
                    {isAdmin && !isTrial && (
                        <button
                            onClick={() => setShowInvite(true)}
                            disabled={atCapacity}
                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={atCapacity ? 'Alle Nutzerplätze sind belegt' : 'Mitglied einladen'}
                        >
                            <UserPlus size={13} />
                            Einladen
                        </button>
                    )}
                </div>

                {/* Capacity bar */}
                <div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-pl-border)' }}>
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width: `${Math.min(100, (usedSeats / maxUsers) * 100)}%`,
                                background: atCapacity ? '#ef4444' : 'var(--color-pl-brand)',
                            }}
                        />
                    </div>
                    {atCapacity && isAdmin && !isTrial && (
                        <p className="text-xs mt-1.5" style={{ color: '#f59e0b' }}>
                            Alle Plätze belegt. Zusätzlicher Platz: <a href="mailto:hallo@complens.de" className="underline">hallo@complens.de</a> (€ 990/Jahr)
                        </p>
                    )}
                    {isTrial && (
                        <p className="text-xs mt-1.5" style={{ color: '#f59e0b' }}>
                            Team-Einladungen erfordern eine aktive CompLens-Lizenz.
                        </p>
                    )}
                </div>

                {/* Active members list */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Aktive Mitglieder ({members.length})
                    </p>
                    {members.map(m => {
                        const ri = roleInfo(m.role)
                        const Icon = ri.icon
                        // Initials: prefer name, fall back to email
                        const initials = m.fullName.trim()
                            ? m.fullName.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                            : m.email.slice(0, 2).toUpperCase()
                        return (
                            <div
                                key={m.id}
                                className="flex items-center justify-between p-3 rounded-xl"
                                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Avatar */}
                                    <div
                                        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                                        style={{ background: ri.color + '30', color: ri.color }}
                                    >
                                        {initials}
                                    </div>
                                    <div className="min-w-0">
                                        {/* Name (if set) or email */}
                                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-pl-text-primary)' }}>
                                            {m.fullName.trim() || m.email}
                                            {m.isMe && <span className="ml-1.5 text-xs opacity-50">(Sie)</span>}
                                        </p>
                                        {/* Email (only shown when name is set) */}
                                        {m.fullName.trim() && (
                                            <p className="text-xs truncate" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                {m.email}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            <Icon size={11} style={{ color: ri.color }} />
                                            <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                {ri.label}
                                            </span>
                                            {m.jobTitle.trim() && (
                                                <>
                                                    <span className="text-xs opacity-30">·</span>
                                                    <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                        {m.jobTitle}
                                                    </span>
                                                </>
                                            )}
                                            <span className="text-xs opacity-30">·</span>
                                            <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                seit {formatDate(m.joined_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {feedback?.id === m.id && (
                                        <span className="text-xs" style={{ color: feedback.ok ? '#10b981' : '#ef4444' }}>
                                            {feedback.msg}
                                        </span>
                                    )}
                                    {isAdmin && !m.isMe && (
                                        <button
                                            onClick={() => handleRemove(m.id)}
                                            disabled={removingId === m.id}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/15 disabled:opacity-40"
                                            title="Mitglied entfernen"
                                        >
                                            <Trash2 size={13} style={{ color: '#ef4444' }} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Pending invitations (admin only) */}
                {isAdmin && pendingInvites.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Ausstehende Einladungen ({pendingInvites.length})
                        </p>
                        {pendingInvites.map(inv => {
                            const ri = roleInfo(inv.role)
                            const Icon = ri.icon
                            const expiresIn = Math.ceil((new Date(inv.expires_at).getTime() - Date.now()) / 86_400_000)
                            return (
                                <div
                                    key={inv.id}
                                    className="flex items-center justify-between p-3 rounded-xl"
                                    style={{
                                        background: 'rgba(245,158,11,0.05)',
                                        border: '1px dashed rgba(245,158,11,0.35)',
                                    }}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
                                            <Clock size={14} style={{ color: '#f59e0b' }} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-pl-text-primary)' }}>
                                                {inv.email}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Icon size={11} style={{ color: ri.color }} />
                                                <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                    {ri.shortLabel}
                                                </span>
                                                <span className="text-xs opacity-30">·</span>
                                                <span className="text-xs" style={{ color: '#f59e0b' }}>
                                                    Läuft ab in {expiresIn} {expiresIn === 1 ? 'Tag' : 'Tagen'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {feedback?.id === inv.id && (
                                            <span className="text-xs" style={{ color: feedback.ok ? '#10b981' : '#ef4444' }}>
                                                {feedback.msg}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleResend(inv.id)}
                                            disabled={resendingId === inv.id}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10 disabled:opacity-40"
                                            title="Erneut senden"
                                        >
                                            <RefreshCw size={12} style={{ color: 'var(--color-pl-text-tertiary)' }} className={resendingId === inv.id ? 'animate-spin' : ''} />
                                        </button>
                                        <button
                                            onClick={() => handleRevoke(inv.id)}
                                            disabled={revokingId === inv.id}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/15 disabled:opacity-40"
                                            title="Einladung widerrufen"
                                        >
                                            <X size={13} style={{ color: '#ef4444' }} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Role explanation */}
                <details className="group">
                    <summary className="flex items-center gap-1.5 text-xs cursor-pointer select-none" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        <Users size={12} />
                        Rollenübersicht
                        <ChevronDown size={11} className="group-open:rotate-180 transition-transform ml-auto" />
                    </summary>
                    <div className="mt-3 space-y-2">
                        {[
                            { role: 'admin', perms: ['Daten hochladen & verwalten', 'Analysen erstellen & ausführen', 'Berichte (PDF / PowerPoint) exportieren', 'Team einladen & entfernen', 'Abonnement & Einstellungen'] },
                            { role: 'viewer', perms: ['Aggregierte Ergebnisse einsehen', 'Maßnahmenplan-Status einsehen', 'Fertige Berichte einsehen', 'Keine Upload-, Export- oder Admin-Rechte'] },
                        ].map(({ role, perms }) => {
                            const ri = roleInfo(role)
                            const Icon = ri.icon
                            return (
                                <div key={role} className="p-3 rounded-lg" style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Icon size={13} style={{ color: ri.color }} />
                                        <span className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{ri.label}</span>
                                    </div>
                                    <ul className="space-y-1">
                                        {perms.map(p => (
                                            <li key={p} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: ri.color }} />
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )
                        })}
                    </div>
                </details>
            </div>
        </>
    )
}
