'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Eye, EyeOff, Loader2, Check, AlertTriangle, Crown, Eye as EyeIcon, ShieldCheck, XCircle, Clock } from 'lucide-react'
import { acceptInvitation } from './actions'

type Status = 'valid' | 'invalid' | 'expired' | 'already_used'

type Props = {
    status: Status
    token?: string
    email?: string
    orgName?: string
    roleLabel?: string
    isLoggedIn?: boolean
    loggedInEmail?: string
}

// ─── Error states UI ──────────────────────────────────────────

function StatusBlock({ status }: { status: Exclude<Status, 'valid'> }) {
    const configs = {
        invalid: {
            icon: XCircle,
            color: '#ef4444',
            bg: 'rgba(239,68,68,0.08)',
            border: 'rgba(239,68,68,0.25)',
            title: 'Ungültige Einladung',
            desc: 'Dieser Einladungslink ist ungültig oder existiert nicht. Bitte wenden Sie sich an den Absender.',
        },
        expired: {
            icon: Clock,
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.08)',
            border: 'rgba(245,158,11,0.25)',
            title: 'Einladung abgelaufen',
            desc: 'Dieser Einladungslink ist abgelaufen (gültig für 7 Tage). Bitten Sie Ihren HR-Administrator, eine neue Einladung zu senden.',
        },
        already_used: {
            icon: ShieldCheck,
            color: '#10b981',
            bg: 'rgba(16,185,129,0.08)',
            border: 'rgba(16,185,129,0.25)',
            title: 'Bereits angenommen',
            desc: 'Diese Einladung wurde bereits verwendet. Sie können sich direkt anmelden.',
        },
    }
    const cfg = configs[status]
    const Icon = cfg.icon

    return (
        <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ background: 'var(--color-pl-bg)', zIndex: 9999 }}
        >
            <div className="w-full max-w-md text-center space-y-6">
                <Logo size={40} />
                <div className="glass-card p-8 space-y-4">
                    <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <Icon size={28} style={{ color: cfg.color }} />
                    </div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{cfg.title}</h1>
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>{cfg.desc}</p>
                    <Link href="/login" className="btn-primary inline-flex mt-2">Zur Anmeldung</Link>
                </div>
            </div>
        </div>
    )
}

// ─── Main join form ───────────────────────────────────────────

export default function JoinClient({
    status, token, email, orgName, roleLabel, isLoggedIn, loggedInEmail,
}: Props) {
    if (status !== 'valid') return <StatusBlock status={status} />

    const [showPw, setShowPw]        = useState(false)
    const [password, setPassword]    = useState('')
    const [error, setError]          = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    const isHrAdmin = roleLabel?.includes('HR')

    async function handleSubmit(formData: FormData) {
        setError(null)
        startTransition(async () => {
            const res = await acceptInvitation(token!, formData)
            if (res?.error) setError(res.error)
        })
    }

    const passwordOk = password.length >= 8 && /\d/.test(password)

    return (
        // Fixed overlay covering the (auth) layout behind it
        <div
            className="fixed inset-0 flex"
            style={{ background: 'var(--color-pl-bg)', zIndex: 9999 }}
        >
            {/* Left panel — invite-specific branding */}
            <div
                className="hidden lg:flex w-[420px] flex-shrink-0 flex-col justify-between p-12"
                style={{ background: 'var(--color-pl-surface)', borderRight: '1px solid var(--color-pl-border)' }}
            >
                <Logo size={36} />

                <div className="space-y-8">
                    {/* Invite context */}
                    <div
                        className="p-4 rounded-2xl"
                        style={{ background: 'rgba(91,97,255,0.08)', border: '1px solid rgba(91,97,255,0.2)' }}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(91,97,255,0.15)' }}
                            >
                                {isHrAdmin ? <Crown size={16} style={{ color: '#5b61ff' }} /> : <EyeIcon size={16} style={{ color: '#10b981' }} />}
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-pl-brand-light)' }}>
                                    Einladung zu
                                </p>
                                <p className="text-base font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                    {orgName}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Rolle: <span style={{ color: 'var(--color-pl-text-secondary)' }}>{roleLabel}</span>
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold leading-snug mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Ihr Zugang zu<br />
                            <span style={{ color: 'var(--color-pl-brand-light)' }}>EU-Entgelttransparenz</span><br />
                            mit CompLens
                        </h2>
                        <div className="space-y-3">
                            {(isHrAdmin ? [
                                'Datensätze hochladen & Analysen erstellen',
                                'EU-konforme Berichte generieren & exportieren',
                                'Team einladen & Zugriffe verwalten',
                            ] : [
                                'Aggregierte Lohnlückenergebnisse einsehen',
                                'Maßnahmenplan-Status & Umsetzung verfolgen',
                                'DSGVO-konform · Daten in der EU',
                            ]).map(item => (
                                <div key={item} className="flex items-start gap-2.5">
                                    <Check size={14} style={{ color: 'var(--color-pl-brand-light)', flexShrink: 0, marginTop: '3px' }} />
                                    <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    © 2026 DexterBee GmbH · hallo@complens.de
                </p>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                <div className="w-full max-w-md space-y-6">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2.5 lg:hidden">
                        <Logo size={28} />
                        <span className="font-bold text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>CompLens</span>
                    </div>

                    {/* Heading */}
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Zugang einrichten
                        </h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Erstellen Sie Ihr Passwort für {email}
                        </p>
                    </div>

                    {/* Mobile: invite card */}
                    <div
                        className="lg:hidden p-4 rounded-2xl"
                        style={{ background: 'rgba(91,97,255,0.08)', border: '1px solid rgba(91,97,255,0.25)' }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(91,97,255,0.15)' }}
                            >
                                {isHrAdmin ? <Crown size={16} style={{ color: '#5b61ff' }} /> : <EyeIcon size={16} style={{ color: '#10b981' }} />}
                            </div>
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                    Einladung zu <span style={{ color: 'var(--color-pl-brand-light)' }}>{orgName}</span>
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    Rolle: {roleLabel}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Warning: logged in as different user */}
                    {isLoggedIn && loggedInEmail !== email && (
                        <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                            <AlertTriangle size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                Sie sind aktuell als <b>{loggedInEmail}</b> angemeldet. Die Einladung gilt für <b>{email}</b>. Bitte verwenden Sie die korrekte E-Mail-Adresse.
                            </p>
                        </div>
                    )}

                    <form action={handleSubmit} className="space-y-4">
                        <input type="hidden" name="email" value={email} />

                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                E-Mail-Adresse
                            </label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="input-base"
                                style={{ opacity: 0.6 }}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                Passwort wählen
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPw ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    placeholder="••••••••"
                                    className="input-base pr-10"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    style={{ color: 'var(--color-pl-text-tertiary)' }}
                                    tabIndex={-1}
                                >
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {password.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                    {[
                                        { label: 'Mindestens 8 Zeichen', ok: password.length >= 8 },
                                        { label: 'Enthält eine Zahl',    ok: /\d/.test(password) },
                                    ].map(rule => (
                                        <li key={rule.label} className="flex items-center gap-1.5 text-xs">
                                            <Check size={11} strokeWidth={3} style={{ color: rule.ok ? 'var(--color-pl-green)' : 'var(--color-pl-text-tertiary)' }} />
                                            <span style={{ color: rule.ok ? 'var(--color-pl-green)' : 'var(--color-pl-text-tertiary)' }}>{rule.label}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
                                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={pending || !passwordOk}
                            className="btn-primary w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {pending
                                ? <><Loader2 size={15} className="animate-spin" /> Wird eingerichtet…</>
                                : 'Zugang aktivieren'
                            }
                        </button>
                    </form>

                    <p className="text-center text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Bereits ein Konto?{' '}
                        <Link href="/login" className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>
                            Direkt anmelden
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
