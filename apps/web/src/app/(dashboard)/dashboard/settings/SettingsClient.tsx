'use client'

import { useState, useTransition } from 'react'
import { User } from '@supabase/supabase-js'
import {
    Building2, User as UserIcon, CreditCard, Shield,
    Check, AlertTriangle, ChevronRight, Crown, Zap,
} from 'lucide-react'
import { signOut } from '@/app/(auth)/actions'

// ─── Plan display helpers ─────────────────────────────────────

const PLAN_LABELS: Record<string, { label: string; badge: string; color: string }> = {
    trial:       { label: '7-Tage Testversion',               badge: 'TEST',   color: '#f59e0b' },
    free:        { label: 'Kostenlos (eingeschränkt)',         badge: 'FREE',   color: '#94a3b8' },
    paylens:     { label: 'CompLens Professional',             badge: 'PRO',    color: 'var(--color-pl-brand)' },
    paylens_ai:  { label: 'CompLens Professional + AI',        badge: 'AI',     color: '#6366f1' },
}

function planInfo(plan: string | null) {
    return PLAN_LABELS[plan ?? ''] ?? PLAN_LABELS.free
}

// ─── Types ────────────────────────────────────────────────────

type Org = {
    id: string
    name: string
    slug: string
    plan: string | null
    trial_ends_at: string | null
    subscription_ends_at: string | null
    max_users: number | null
    ai_enabled: boolean | null
    country: string | null
    created_at: string
} | null

type Props = {
    user: User
    org: Org
    role: string
    memberCount: number
}

// ─── Main component ───────────────────────────────────────────

export default function SettingsClient({ user, org, role, memberCount }: Props) {
    const [activeTab, setActiveTab] = useState<'org' | 'profile' | 'billing' | 'security'>('org')
    const plan = planInfo(org?.plan ?? null)

    const trialEnd = org?.trial_ends_at ? new Date(org.trial_ends_at) : null
    const subEnd   = org?.subscription_ends_at ? new Date(org.subscription_ends_at) : null
    const now      = new Date()
    const trialActive = trialEnd && trialEnd > now
    const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86_400_000)) : null

    const tabs = [
        { key: 'org',      label: 'Organisation', icon: Building2 },
        { key: 'profile',  label: 'Profil',        icon: UserIcon  },
        { key: 'billing',  label: 'Abonnement',    icon: CreditCard},
        { key: 'security', label: 'Sicherheit',    icon: Shield    },
    ] as const

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Einstellungen
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    Organisation verwalten, Profil und Abonnement
                </p>
            </div>

            {/* Trial banner */}
            {trialActive && trialDaysLeft !== null && (
                <div className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <div className="flex items-center gap-3">
                        <Zap size={16} style={{ color: '#f59e0b' }} />
                        <div>
                            <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
                                Testphase — noch {trialDaysLeft} {trialDaysLeft === 1 ? 'Tag' : 'Tage'}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                Jetzt upgraden, um PDF-Export und alle Features freizuschalten
                            </p>
                        </div>
                    </div>
                    <button className="btn-primary text-xs px-3 py-1.5">
                        Jetzt upgraden <ChevronRight size={12} />
                    </button>
                </div>
            )}

            <div className="flex gap-6">
                {/* Sidebar tabs */}
                <div className="w-44 flex-shrink-0">
                    <nav className="space-y-0.5">
                        {tabs.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${activeTab === key ? 'active' : ''}`}
                                style={{
                                    background: activeTab === key ? 'rgba(59,130,246,0.12)' : 'transparent',
                                    color: activeTab === key ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-secondary)',
                                }}
                            >
                                <Icon size={15} strokeWidth={1.8} />
                                {label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab content */}
                <div className="flex-1 min-w-0">
                    {activeTab === 'org'      && <OrgTab      org={org} role={role} memberCount={memberCount} />}
                    {activeTab === 'profile'  && <ProfileTab  user={user} />}
                    {activeTab === 'billing'  && <BillingTab  org={org} plan={plan} subEnd={subEnd} />}
                    {activeTab === 'security' && <SecurityTab />}
                </div>
            </div>
        </div>
    )
}

// ─── Tab: Organisation ────────────────────────────────────────

function OrgTab({ org, role, memberCount }: { org: Org; role: string; memberCount: number }) {
    const [name, setName]       = useState(org?.name ?? '')
    const [saved, setSaved]     = useState(false)
    const [error, setError]     = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    async function handleSave() {
        if (!name.trim()) return
        setError(null)
        startTransition(async () => {
            // Import dynamically to avoid bundling server code in client
            const { updateOrgName } = await import('./actions')
            const result = await updateOrgName(name.trim())
            if (result?.error) setError(result.error)
            else { setSaved(true); setTimeout(() => setSaved(false), 2500) }
        })
    }

    const isAdmin = role === 'admin'

    return (
        <div className="space-y-4">
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Organisationsdetails
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Unternehmensname
                        </label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={!isAdmin}
                            className="input-base"
                            placeholder="Mustermann GmbH"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Land
                        </label>
                        <input value={org?.country ?? 'DE'} disabled className="input-base" style={{ opacity: 0.6 }} />
                        <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Länderwechsel bitte an support@paylens.de
                        </p>
                    </div>
                    {error && (
                        <p className="text-xs" style={{ color: 'var(--color-pl-red)' }}>{error}</p>
                    )}
                    {isAdmin && (
                        <button onClick={handleSave} disabled={pending} className="btn-primary">
                            {saved ? <><Check size={13} /> Gespeichert</> : pending ? 'Wird gespeichert…' : 'Änderungen speichern'}
                        </button>
                    )}
                </div>
            </div>

            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Team
                </h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {memberCount} von {org?.max_users ?? 1} Mitglied{memberCount !== 1 ? 'ern' : ''}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Ihr Abonnement umfasst {org?.max_users ?? 1} Nutzerplatz{(org?.max_users ?? 1) !== 1 ? 'e' : ''}
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{
                                background: 'rgba(59,130,246,0.12)',
                                border: '1px solid rgba(59,130,246,0.25)',
                                color: 'var(--color-pl-brand-light)',
                            }}
                            onClick={() => alert('Team-Einladung — wird in der nächsten Version verfügbar.')}
                        >
                            Mitglied einladen
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Tab: Profile ─────────────────────────────────────────────

function ProfileTab({ user }: { user: User }) {
    const [isPending, startTransition] = useTransition()

    return (
        <div className="space-y-4">
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Benutzerprofil
                </h2>
                <div className="flex items-center gap-4 mb-4">
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #6366f1)' }}
                    >
                        {user.email?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {user.email}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Mitglied seit {new Date(user.created_at).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        E-Mail-Adresse
                    </label>
                    <input value={user.email ?? ''} disabled className="input-base" style={{ opacity: 0.6 }} />
                    <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        E-Mail-Änderung ist derzeit nicht über die UI möglich. Bitte kontaktieren Sie den Support.
                    </p>
                </div>
            </div>

            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Passwort ändern
                </h2>
                <p className="text-xs mb-4" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    Sie erhalten eine E-Mail mit einem Passwort-Reset-Link.
                </p>
                <button
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{
                        background: 'rgba(59,130,246,0.12)',
                        border: '1px solid rgba(59,130,246,0.25)',
                        color: 'var(--color-pl-brand-light)',
                    }}
                    onClick={() => alert('Passwort-Reset-E-Mail wird gesendet — in Kürze verfügbar.')}
                >
                    Passwort-Reset-E-Mail senden
                </button>
            </div>

            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-1" style={{ color: '#ef4444' }}>
                    Abmelden
                </h2>
                <p className="text-xs mb-4" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    Sie werden von allen Geräten abgemeldet.
                </p>
                <form action={signOut}>
                    <button type="submit" disabled={isPending}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            color: '#ef4444',
                        }}
                    >
                        Abmelden
                    </button>
                </form>
            </div>
        </div>
    )
}

// ─── Tab: Billing ─────────────────────────────────────────────

function BillingTab({ org, plan, subEnd }: { org: Org; plan: ReturnType<typeof planInfo>; subEnd: Date | null }) {
    return (
        <div className="space-y-4">
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Aktuelles Abonnement
                </h2>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{ background: plan.color + '20', color: plan.color }}
                        >
                            {plan.badge}
                        </div>
                        <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>
                                {plan.label}
                            </p>
                            {subEnd && (
                                <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    Verlängerung am {subEnd.toLocaleDateString('de-DE')}
                                </p>
                            )}
                        </div>
                    </div>
                    <button className="btn-primary text-xs px-3 py-1.5">
                        <Crown size={12} />
                        Upgraden
                    </button>
                </div>
            </div>

            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Tarife im Vergleich
                </h2>
                <div className="space-y-3">
                    {/* Free / Trial tier */}
                    <div className="flex items-center justify-between p-4 rounded-xl"
                        style={{ border: '1px solid var(--color-pl-border)', background: 'transparent' }}
                    >
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                Testversion (7 Tage)
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                1 Datensatz importieren &middot; Analysen anzeigen &middot; Kein PDF-Export &middot; 1 Nutzer
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: 'var(--color-pl-text-secondary)' }}>Kostenlos</p>
                        </div>
                    </div>

                    {/* Professional */}
                    <div className="flex items-center justify-between p-4 rounded-xl"
                        style={{ border: '1px solid var(--color-pl-border)', background: 'transparent' }}
                    >
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                CompLens Professional
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                Unbegrenzte Analysen &middot; PDF-Export &middot; Manueller Import &middot; 3 Nutzer inkl.
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>€ 4.190 / Jahr</p>
                        </div>
                    </div>

                    {/* Professional + AI */}
                    <div className="flex items-center justify-between p-4 rounded-xl"
                        style={{
                            border: '1px solid rgba(99,102,241,0.4)',
                            background: 'rgba(99,102,241,0.06)',
                        }}
                    >
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                CompLens Professional + AI
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                Alles aus Professional &middot; KI-Spaltenzuordnung &middot; KI-Narrativen &middot; 3 Nutzer inkl.
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: 'var(--color-pl-accent)' }}>€ 4.990 / Jahr</p>
                        </div>
                    </div>

                    {/* Add-on: additional users */}
                    <div className="flex items-center justify-between p-3 rounded-xl"
                        style={{ border: '1px dashed var(--color-pl-border)', background: 'transparent' }}
                    >
                        <div>
                            <p className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                Zusätzliche Nutzer (Add-on)
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                Je weiterer Nutzer &uuml;ber das inkl. Kontingent hinaus
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold" style={{ color: 'var(--color-pl-text-secondary)' }}>€ 490 / Nutzer / Jahr</p>
                        </div>
                    </div>
                </div>
                <p className="text-xs mt-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    Alle Preise zzgl. MwSt. &middot; Jährliche Abrechnung &middot; Laufzeit 1 Jahr, automatische Verlängerung &middot; Kündigung mit 3 Monaten Frist zum Laufzeitende
                </p>
            </div>
        </div>
    )
}

// ─── Tab: Security ────────────────────────────────────────────

function SecurityTab() {
    return (
        <div className="space-y-4">
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Datenschutz & Compliance
                </h2>
                <div className="space-y-3">
                    {[
                        { icon: '🇩🇪', title: 'EU-Server', desc: 'Alle Daten in Frankfurt am Main (EU-West)' },
                        { icon: '🔒', title: 'DSGVO-konform', desc: 'Art. 28 AVV auf Anfrage verfügbar' },
                        { icon: '🔑', title: 'Verschlüsselung', desc: 'TLS 1.3 in transit, AES-256 at rest' },
                        { icon: '📋', title: 'Zugriffsprotokoll', desc: 'Alle Aktionen werden auditiert' },
                    ].map(item => (
                        <div key={item.title} className="flex items-start gap-3 py-2 border-b last:border-0"
                            style={{ borderColor: 'var(--color-pl-border)' }}>
                            <span className="text-lg flex-shrink-0">{item.icon}</span>
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>{item.title}</p>
                                <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{item.desc}</p>
                            </div>
                            <Check size={14} className="ml-auto flex-shrink-0 mt-0.5" style={{ color: 'var(--color-pl-green)' }} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-1" style={{ color: '#ef4444' }}>
                    Datenlöschung
                </h2>
                <p className="text-xs mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    Bei Kündigung werden alle Daten innerhalb von 30 Tagen unwiderruflich gelöscht.
                    Datenexport vor Kündigung empfohlen.
                </p>
                <div className="flex items-center gap-2 text-xs p-3 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-pl-text-secondary)' }}>
                        Kontolöschung: Bitte wenden Sie sich an support@paylens.de
                    </span>
                </div>
            </div>
        </div>
    )
}
