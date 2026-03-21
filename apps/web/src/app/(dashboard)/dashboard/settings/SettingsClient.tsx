'use client'

import { useState, useTransition, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import {
    Building2, User as UserIcon, CreditCard, Shield,
    Check, AlertTriangle, ChevronRight, Crown, Zap, Users, FileDown, Globe,
} from 'lucide-react'
import { signOut } from '@/app/(auth)/actions'
import TeamPanel from './TeamPanel'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import type { Lang } from '@/lib/i18n/translations'

const PLAN_LABELS: Record<string, { label: string; badge: string; color: string }> = {
    trial:      { label: '7-Tage Testversion', badge: 'TEST',   color: '#f59e0b' },
    free:       { label: 'Testversion',        badge: 'TEST',   color: '#f59e0b' },
    licensed:   { label: 'CompLens Lizenz',    badge: 'LIZENZ', color: 'var(--color-pl-brand)' },
    license:    { label: 'CompLens Lizenz',    badge: 'LIZENZ', color: 'var(--color-pl-brand)' },
}

function planInfo(plan: string | null) {
    return PLAN_LABELS[plan ?? ''] ?? PLAN_LABELS.trial
}

// ─── Upgrade to license button ────────────────────────────────

function UpgradeButton() {
    const [loading, setLoading] = useState(false)
    const [err, setErr]         = useState<string | null>(null)

    async function handleClick() {
        setLoading(true)
        setErr(null)
        try {
            const res  = await fetch('/api/stripe/checkout', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ plan: 'license' }),
            })
            const data = await res.json()
            if (!res.ok || !data.url) throw new Error(data.error ?? 'Stripe-Fehler')
            window.location.href = data.url
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : 'Fehler')
            setLoading(false)
        }
    }

    return (
        <div>
            <button
                id="upgrade-license-btn"
                onClick={handleClick}
                disabled={loading}
                className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60"
                style={{
                    background: loading ? 'rgba(99,102,241,0.5)' : 'var(--color-pl-brand)',
                    color:      '#fff',
                    cursor:     loading ? 'not-allowed' : 'pointer',
                    boxShadow:  '0 0 20px rgba(99,102,241,0.35)',
                }}
            >
                <Crown size={14} />
                {loading ? 'Weiterleitung…' : 'Lizenz kaufen'}
            </button>
            {err && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{err}</p>}
        </div>
    )
}

// ─── Add-on seat checkout button ─────────────────────────────

function AddOnButton() {
    const [loading, setLoading] = useState(false)
    const [err, setErr]         = useState<string | null>(null)

    async function handleClick() {
        setLoading(true)
        setErr(null)
        try {
            const res  = await fetch('/api/stripe/checkout', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ plan: 'additional_access' }),
            })
            const data = await res.json()
            if (!res.ok || !data.url) throw new Error(data.error ?? 'Stripe-Fehler')
            window.location.href = data.url
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : 'Fehler')
            setLoading(false)
        }
    }

    return (
        <div>
            <button
                onClick={handleClick}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                style={{
                    background: 'rgba(99,102,241,0.1)',
                    border:     '1px solid rgba(99,102,241,0.3)',
                    color:      'var(--color-pl-brand-light)',
                    opacity:    loading ? 0.65 : 1,
                    cursor:     loading ? 'not-allowed' : 'pointer',
                }}
            >
                <Crown size={11} />
                {loading ? 'Lädt…' : 'Jetzt buchen'}
            </button>
            {err && <p className="text-[10px] mt-1 text-red-400">{err}</p>}
        </div>
    )
}

// ─── Pro-forma download button (simple, no payment selector) ──

function ProformaDownloadButton({ legalComplete, plan, onGoToOrg }: { legalComplete: boolean; plan: string; onGoToOrg: () => void }) {
    const [loading, setLoading] = useState(false)

    async function handleDownload() {
        if (!legalComplete) return
        setLoading(true)
        try {
            const res = await fetch(`/api/stripe/proforma?plan=${plan}`)
            if (!res.ok) {
                const d = await res.json().catch(() => ({}))
                alert(d.error ?? 'Fehler beim Generieren der Proforma-Rechnung.')
                return
            }
            const blob = await res.blob()
            const href = URL.createObjectURL(blob)
            const a    = document.createElement('a')
            a.href     = href
            a.download = `CompLens_Proforma_${new Date().getFullYear()}.pdf`
            a.click()
            URL.revokeObjectURL(href)
        } catch {
            alert('Technischer Fehler. Bitte erneut versuchen.')
        } finally {
            setLoading(false)
        }
    }

    if (!legalComplete) {
        return (
            <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                Bitte{' '}
                <button onClick={onGoToOrg} className="underline hover:brightness-125 transition-all" style={{ color: 'var(--color-pl-brand-light)' }}>
                    Rechtliche Angaben
                </button>{' '}
                ausfüllen
            </span>
        )
    }

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
            style={{
                background: 'rgba(99,102,241,0.1)',
                border:     '1px solid rgba(99,102,241,0.25)',
                color:      'var(--color-pl-brand-light)',
                cursor:     loading ? 'not-allowed' : 'pointer',
            }}
        >
            <FileDown size={12} />
            {loading ? 'Erstellt…' : 'Herunterladen'}
        </button>
    )
}

// ─── Language selector ────────────────────────────────────────

function LanguageSelector() {
    const { lang, setLang } = useTranslation()

    const LANGS: { code: Lang; label: string; flag: string }[] = [
        { code: 'de', label: 'Deutsch',  flag: '🇩🇪' },
        { code: 'en', label: 'English',  flag: '🇬🇧' },
    ]

    return (
        <div className="flex gap-2">
            {LANGS.map(l => (
                <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                        background: lang === l.code ? 'var(--color-pl-brand)' : 'rgba(255,255,255,0.05)',
                        border:     `1px solid ${lang === l.code ? 'var(--color-pl-brand)' : 'var(--color-pl-border)'}`,
                        color:      lang === l.code ? '#fff' : 'var(--color-pl-text-secondary)',
                    }}
                >
                    <span className="text-base leading-none">{l.flag}</span>
                    {l.label}
                    {lang === l.code && <Check size={11} />}
                </button>
            ))}
        </div>
    )
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
    legal_representative: string | null
    legal_address:        string | null
    legal_city:           string | null
    legal_zip:            string | null
    vat_id:               string | null
} | null

type TeamDataProp = {
    members:        Array<{ id: string; user_id: string; email: string; role: string; joined_at: string; isMe: boolean; fullName: string; jobTitle: string }>
    pendingInvites: Array<{ id: string; email: string; role: string; expires_at: string; created_at: string }>
    maxUsers:       number
    plan:           string
    callerRole:     string
    usedSeats:      number
}

type Props = {
    user:        User
    org:         Org
    role:        string
    memberCount: number
    teamData:    TeamDataProp
    profileData: { fullName: string; jobTitle: string }
    legalData:   {
        legal_representative: string
        legal_address:        string
        legal_city:           string
        legal_zip:            string
        vat_id:               string
        country:              string
    }
}

// ─── Main component ───────────────────────────────────────────

export default function SettingsClient({ user, org, role, memberCount, teamData, profileData, legalData }: Props) {
    const [activeTab, setActiveTab] = useState<'org' | 'team' | 'profile' | 'billing' | 'security'>('org')
    const [openInvite, setOpenInvite] = useState(false)
    const plan = planInfo(org?.plan ?? null)

    useEffect(() => {
        const hash = window.location.hash.replace('#', '') as 'org' | 'team' | 'profile' | 'billing' | 'security'
        const valid = ['org', 'team', 'profile', 'billing', 'security']
        if (valid.includes(hash)) setActiveTab(hash)
    }, [])

    const trialEnd  = org?.trial_ends_at       ? new Date(org.trial_ends_at)       : null
    const subEnd    = org?.subscription_ends_at ? new Date(org.subscription_ends_at) : null
    const isLicensed = ['licensed', 'paylens', 'paylens_ai'].includes(org?.plan ?? '')

    const now = new Date()
    const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)) : null
    const trialActive = !isLicensed && trialEnd && trialEnd > now

    const tabs = [
        { id: 'org',      label: 'Organisation', icon: Building2  },
        { id: 'team',     label: 'Team',          icon: Users      },
        { id: 'profile',  label: 'Profil',        icon: UserIcon   },
        { id: 'billing',  label: 'Abonnement',    icon: CreditCard },
        { id: 'security', label: 'Datenschutz',   icon: Shield     },
    ] as const

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>Einstellungen</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    Organisation, Nutzer und Abonnement verwalten
                </p>
            </div>

            {trialActive && daysLeft !== null && (
                <div
                    className="flex items-center justify-between p-3 rounded-xl text-sm"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}
                >
                    <div className="flex items-center gap-2">
                        <Zap size={14} style={{ color: '#f59e0b' }} />
                        <span style={{ color: '#f59e0b' }}>
                            Testversion: noch <strong>{daysLeft} Tag{daysLeft !== 1 ? 'e' : ''}</strong> verbleibend
                        </span>
                    </div>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className="flex items-center gap-1 text-xs font-semibold"
                        style={{ color: '#f59e0b' }}
                    >
                        Jetzt upgraden <ChevronRight size={12} />
                    </button>
                </div>
            )}

            <div className="flex gap-6">
                {/* Sidebar nav */}
                <nav className="w-44 flex-shrink-0 space-y-1">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all text-left"
                            style={{
                                background: activeTab === id ? 'var(--color-pl-brand-subtle)' : 'transparent',
                                color: activeTab === id ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-secondary)',
                            }}
                        >
                            <Icon size={15} />
                            {label}
                        </button>
                    ))}
                </nav>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {activeTab === 'org'      && <OrgTab      org={org} role={role} memberCount={memberCount} legalData={legalData} onInvite={() => { setOpenInvite(true); setActiveTab('team') }} />}
                    {activeTab === 'team'     && <TeamPanel   teamData={teamData} openInviteOnMount={openInvite} onInviteMounted={() => setOpenInvite(false)} />}
                    {activeTab === 'profile'  && <ProfileTab  user={user} profileData={profileData} />}
                    {activeTab === 'billing'  && <BillingTab  org={org} plan={plan} subEnd={subEnd} isLicensed={isLicensed} legalComplete={!!(legalData.legal_representative && legalData.legal_address && legalData.legal_city)} onGoToOrg={() => setActiveTab('org')} />}
                    {activeTab === 'security' && <SecurityTab />}
                </div>
            </div>
        </div>
    )
}

// ─── Tab: Organisation ────────────────────────────────────────

type LegalData = {
    legal_representative: string
    legal_address:        string
    legal_city:           string
    legal_zip:            string
    vat_id:               string
    country:              string
}

function OrgTab({ org, role, memberCount, legalData, onInvite }: { org: Org; role: string; memberCount: number; legalData: LegalData; onInvite: () => void }) {
    const [name, setName]   = useState(org?.name ?? '')
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    async function handleSave() {
        if (!name.trim()) return
        setError(null)
        startTransition(async () => {
            const { updateOrgName } = await import('./actions')
            const result = await updateOrgName(name.trim())
            if (result?.error) setError(result.error)
            else { setSaved(true); setTimeout(() => setSaved(false), 2500) }
        })
    }

    // Legal fields
    const [legalRep,  setLegalRep]  = useState(legalData.legal_representative)
    const [legalAddr, setLegalAddr] = useState(legalData.legal_address)
    const [legalCity, setLegalCity] = useState(legalData.legal_city)
    const [legalZip,  setLegalZip]  = useState(legalData.legal_zip)
    const [vatId,     setVatId]     = useState(legalData.vat_id)
    const [country,   setCountry]   = useState(legalData.country || 'Deutschland')
    const [legalSaved,   setLegalSaved]   = useState(false)
    const [legalError,   setLegalError]   = useState<string | null>(null)
    const [legalPending, startLegalTrans] = useTransition()
    const [legalEditing, setLegalEditing] = useState(
        !legalData.legal_representative || !legalData.legal_address || !legalData.legal_city || !legalData.country
    )

    async function handleLegalSave() {
        setLegalError(null)
        startLegalTrans(async () => {
            const { updateOrgLegal } = await import('./actions')
            const result = await updateOrgLegal({
                legal_representative: legalRep,
                legal_address:        legalAddr,
                legal_city:           legalCity,
                legal_zip:            legalZip,
                vat_id:               vatId,
                country:              country,
            })
            if (result?.error) setLegalError(result.error)
            else {
                setLegalSaved(true)
                setLegalEditing(false)
                setTimeout(() => setLegalSaved(false), 2500)
            }
        })
    }

    function handleLegalCancel() {
        setLegalRep(legalData.legal_representative)
        setLegalAddr(legalData.legal_address)
        setLegalCity(legalData.legal_city)
        setLegalZip(legalData.legal_zip)
        setVatId(legalData.vat_id)
        setCountry(legalData.country || 'Deutschland')
        setLegalError(null)
        setLegalEditing(false)
    }

    const legalComplete = !!(legalRep.trim() && legalAddr.trim() && legalCity.trim() && country.trim())
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
                            style={{ opacity: isAdmin ? 1 : 0.6 }}
                        />
                        {!isAdmin && (
                            <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                Nur Administratoren können den Namen ändern.
                            </p>
                        )}
                    </div>
                    {error && <p className="text-xs" style={{ color: 'var(--color-pl-red)' }}>{error}</p>}
                    {isAdmin && (
                        <button onClick={handleSave} disabled={pending} className="btn-primary">
                            {saved ? <><Check size={13} /> Gespeichert</> : pending ? 'Wird gespeichert…' : 'Änderungen speichern'}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Legal information ── */}
            <div className="glass-card p-5">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Rechtliche Angaben für Vertragsunterlagen
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Erforderlich zur Generierung von Lizenzvertrag, AVV & Proforma-Rechnung
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                            style={legalComplete
                                ? { background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }
                                : { background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }
                            }
                        >
                            {legalComplete ? <><Check size={11} /> Vollständig</> : 'Felder fehlen'}
                        </span>
                        {isAdmin && !legalEditing && (
                            <button
                                onClick={() => setLegalEditing(true)}
                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
                                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--color-pl-brand-light)' }}
                            >
                                Bearbeiten
                            </button>
                        )}
                    </div>
                </div>

                {/* Read-only summary */}
                {!legalEditing && legalComplete && (
                    <div className="space-y-2 text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        <div className="grid grid-cols-3 gap-1">
                            <span style={{ color: 'var(--color-pl-text-tertiary)' }}>Vertreter/in</span>
                            <span className="col-span-2 font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>{legalRep}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            <span style={{ color: 'var(--color-pl-text-tertiary)' }}>Adresse</span>
                            <span className="col-span-2">{legalAddr}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            <span style={{ color: 'var(--color-pl-text-tertiary)' }}>PLZ / Stadt</span>
                            <span className="col-span-2">{legalZip} {legalCity}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            <span style={{ color: 'var(--color-pl-text-tertiary)' }}>Land</span>
                            <span className="col-span-2">{country}</span>
                        </div>
                        {vatId && (
                            <div className="grid grid-cols-3 gap-1">
                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>USt-IdNr.</span>
                                <span className="col-span-2">{vatId}</span>
                            </div>
                        )}
                        {legalSaved && (
                            <p className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
                                <Check size={12} /> Gespeichert
                            </p>
                        )}
                    </div>
                )}

                {/* Edit form */}
                {legalEditing && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                Gesetzliche/r Vertreter/in <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input value={legalRep} onChange={e => setLegalRep(e.target.value)}
                                placeholder="z.B. Maria Müller, Geschäftsführerin" className="input-base w-full" />
                            <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>Name + Funktion der zeichnungsberechtigten Person</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                Straße und Hausnummer <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input value={legalAddr} onChange={e => setLegalAddr(e.target.value)}
                                placeholder="z.B. Industriestraße 13" className="input-base w-full" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>PLZ <span style={{ color: '#ef4444' }}>*</span></label>
                                <input value={legalZip} onChange={e => setLegalZip(e.target.value)}
                                    placeholder="63755" className="input-base w-full" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>Stadt <span style={{ color: '#ef4444' }}>*</span></label>
                                <input value={legalCity} onChange={e => setLegalCity(e.target.value)}
                                    placeholder="München" className="input-base w-full" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>Land <span style={{ color: '#ef4444' }}>*</span></label>
                            <input value={country} onChange={e => setCountry(e.target.value)}
                                placeholder="Deutschland" className="input-base w-full" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>Umsatzsteuer-IdNr. (optional)</label>
                            <input value={vatId} onChange={e => setVatId(e.target.value)}
                                placeholder="DE123456789" className="input-base w-full" />
                        </div>
                        {legalError && <p className="text-xs" style={{ color: '#ef4444' }}>{legalError}</p>}
                        <div className="flex items-center gap-2">
                            <button onClick={handleLegalSave} disabled={legalPending} className="btn-primary">
                                {legalPending ? 'Speichert…' : 'Speichern'}
                            </button>
                            <button
                                onClick={handleLegalCancel}
                                disabled={legalPending}
                                className="text-xs px-3 py-1.5 rounded-lg"
                                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-secondary)' }}
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                )}

                {!legalEditing && !legalComplete && (
                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Keine Angaben hinterlegt.{' '}
                        {isAdmin && <button onClick={() => setLegalEditing(true)} className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>Jetzt ausfüllen</button>}
                    </p>
                )}
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
                            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--color-pl-brand-light)' }}
                            onClick={onInvite}
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

function ProfileTab({ user, profileData }: { user: User; profileData: { fullName: string; jobTitle: string } }) {
    const [fullName,  setFullName]  = useState(profileData.fullName)
    const [jobTitle,  setJobTitle]  = useState(profileData.jobTitle)
    const [saved,     setSaved]     = useState(false)
    const [error,     setError]     = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    async function handleSaveProfile() {
        setError(null)
        startTransition(async () => {
            const { updateProfile } = await import('./actions')
            const result = await updateProfile(fullName, jobTitle)
            if (result?.error) setError(result.error)
            else { setSaved(true); setTimeout(() => setSaved(false), 2500) }
        })
    }

    const initials = fullName.trim()
        ? fullName.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : (user.email?.slice(0, 2).toUpperCase() ?? '??')

    return (
        <div className="space-y-4">
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Benutzerprofil
                </h2>

                <div className="flex items-center gap-4 mb-6">
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #6366f1)' }}
                    >
                        {initials}
                    </div>
                    <div>
                        <p className="font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {fullName.trim() || user.email}
                        </p>
                        {jobTitle.trim() && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-brand-light)' }}>
                                {jobTitle}
                            </p>
                        )}
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Mitglied seit {new Date(user.created_at).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Vollständiger Name
                        </label>
                        <input
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="z.B. Maria Müller"
                            className="input-base w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Funktion / Berufsbezeichnung
                        </label>
                        <input
                            value={jobTitle}
                            onChange={e => setJobTitle(e.target.value)}
                            placeholder="z.B. HR Managerin, Personalreferentin"
                            className="input-base w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Bevorzugte Sprache / Preferred Language
                        </label>
                        <LanguageSelector />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            E-Mail-Adresse
                        </label>
                        <input value={user.email ?? ''} disabled className="input-base w-full" style={{ opacity: 0.5 }} />
                        <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            E-Mail-Änderung ist nicht über die UI möglich. Kontaktieren Sie den Support.
                        </p>
                    </div>

                    {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

                    <button
                        onClick={handleSaveProfile}
                        disabled={isPending}
                        className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-all"
                        style={{ background: 'var(--color-pl-brand)', color: '#fff' }}
                    >
                        {saved ? <><Check size={13} /> Gespeichert!</> : isPending ? 'Speichert…' : 'Profil speichern'}
                    </button>
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
                    style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--color-pl-brand-light)' }}
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
                    <button
                        type="submit"
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}
                    >
                        Abmelden
                    </button>
                </form>
            </div>
        </div>
    )
}

// ─── Tab: Billing ─────────────────────────────────────────────

function BillingTab({
    org, plan, subEnd, isLicensed, legalComplete, onGoToOrg
}: {
    org: Org
    plan: ReturnType<typeof planInfo>
    subEnd: Date | null
    isLicensed: boolean
    legalComplete: boolean
    onGoToOrg: () => void
}) {
    const subStart = subEnd ? new Date(subEnd.getTime() - 365 * 24 * 60 * 60 * 1000) : null
    const fmtDate  = (d: Date | null) =>
        d ? d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null

    // ── Reusable document row ────────────────────────────────────
    function DocRow({
        icon, title, subtitle, action, muted = false,
    }: {
        icon: React.ReactNode
        title: string
        subtitle: string
        action: React.ReactNode
        muted?: boolean
    }) {
        return (
            <div
                className="flex items-center justify-between py-3.5 px-1"
                style={{ borderBottom: '1px solid var(--color-pl-border)' }}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: muted ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.12)' }}
                    >
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium" style={{ color: muted ? 'var(--color-pl-text-tertiary)' : 'var(--color-pl-text-primary)' }}>{title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{subtitle}</p>
                    </div>
                </div>
                <div className="flex-shrink-0 ml-4">{action}</div>
            </div>
        )
    }

    return (
        <div className="space-y-4">

            {/* ── 1. Plan status ────────────────────────────────── */}
            <div className="glass-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    Aktuelles Abonnement
                </p>
                <div className="flex items-center gap-3">
                    <div
                        className="px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide"
                        style={{ background: plan.color + '18', color: plan.color, border: `1px solid ${plan.color}40` }}
                    >
                        {plan.badge}
                    </div>
                    <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {plan.label}
                        </p>
                        {isLicensed && subStart && subEnd ? (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {fmtDate(subStart)} → {fmtDate(subEnd)}
                            </p>
                        ) : subEnd ? (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                Verlängerung: {fmtDate(subEnd)}
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* ── 2a. Trial → Upgrade CTA ───────────────────────── */}
            {!isLicensed && (
                <div
                    className="glass-card p-5 relative overflow-hidden"
                    style={{ border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.06)' }}
                >
                    {/* Corner glow */}
                    <div style={{
                        position: 'absolute', top: 0, right: 0,
                        width: 180, height: 180,
                        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--color-pl-brand-light)' }}>
                        CompLens Lizenz
                    </p>
                    <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                        € 5.990{' '}
                        <span className="text-sm font-normal" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            / Jahr zzgl. MwSt.
                        </span>
                    </p>
                    <p className="text-xs mb-5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Jahresabo · 1 HR-Admin + 1 Betriebsrat-Lesezugang inkl.
                    </p>
                    <div className="space-y-1.5 mb-5">
                        {[
                            'Unbegrenzte Uploads & Analysen',
                            'PDF & PowerPoint-Export (ohne Wasserzeichen)',
                            'KI-Import-Mapping & Chatbot',
                            'Compliance-Bericht gem. EU Art. 9',
                            'Lizenzvertrag & AVV sofort verfügbar',
                        ].map(f => (
                            <div key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                <Check size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                                {f}
                            </div>
                        ))}
                    </div>
                    <UpgradeButton />
                    <p className="text-xs mt-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Zahlung per SEPA-Lastschrift oder Überweisung (Vorkasse) — Sie wählen in Stripe.
                    </p>
                </div>
            )}

            {/* ── 2b. Licensed → Add-on seats ───────────────────── */}
            {isLicensed && (
                <div className="glass-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Nutzerplätze erweitern
                    </p>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>Zusätzlicher Nutzerplatz</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                HR-Admin oder Mitarbeitervertretung · € 990 / Platz / Jahr zzgl. MwSt.
                            </p>
                        </div>
                        <AddOnButton />
                    </div>
                </div>
            )}

            {/* ── 3. Documents ──────────────────────────────────── */}
            <div className="glass-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    Dokumente
                </p>
                <p className="text-xs mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    Offizielle Steuerrechnung erhalten Sie nach Zahlung automatisch per E-Mail von Stripe.
                </p>

                <div>
                    {/* Lizenzvertrag */}
                    <DocRow
                        icon={<FileDown size={14} style={{ color: isLicensed && legalComplete ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)' }} />}
                        title="Lizenzvertrag (PDF)"
                        subtitle={isLicensed
                            ? `Personalisiert auf ${org?.name} · von DexterBee GmbH unterzeichnet`
                            : 'Verfügbar nach Lizenzierung'}
                        muted={!isLicensed}
                        action={isLicensed && legalComplete ? (
                            <a
                                href={`/api/contracts/license?plan=${encodeURIComponent(org?.plan ?? 'paylens')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--color-pl-brand-light)', textDecoration: 'none' }}
                            >
                                <FileDown size={12} /> Herunterladen
                            </a>
                        ) : isLicensed ? (
                            <button onClick={onGoToOrg} className="text-xs hover:underline" style={{ color: 'var(--color-pl-brand-light)' }}>Bitte Rechtliche Angaben ausfüllen</button>
                        ) : (
                            <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--color-pl-text-tertiary)', border: '1px solid var(--color-pl-border)' }}>
                                Nach Lizenzierung
                            </span>
                        )}
                    />

                    {/* AVV */}
                    <DocRow
                        icon={<FileDown size={14} style={{ color: isLicensed && legalComplete ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)' }} />}
                        title="AVV / Auftragsverarbeitungsvertrag (PDF)"
                        subtitle={isLicensed
                            ? 'Gem. Art. 28 DSGVO · inkl. Subprocessors & TOMs'
                            : 'Verfügbar nach Lizenzierung'}
                        muted={!isLicensed}
                        action={isLicensed && legalComplete ? (
                            <a
                                href="/api/contracts/avv"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--color-pl-brand-light)', textDecoration: 'none' }}
                            >
                                <FileDown size={12} /> Herunterladen
                            </a>
                        ) : isLicensed ? (
                            <button onClick={onGoToOrg} className="text-xs hover:underline" style={{ color: 'var(--color-pl-brand-light)' }}>Bitte Rechtliche Angaben ausfüllen</button>
                        ) : (
                            <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--color-pl-text-tertiary)', border: '1px solid var(--color-pl-border)' }}>
                                Nach Lizenzierung
                            </span>
                        )}
                    />

                    {/* Proforma */}
                    <DocRow
                        icon={<FileDown size={14} style={{ color: legalComplete ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)' }} />}
                        title="Proforma-Rechnung (PDF)"
                        subtitle="Für interne Budgetfreigabe oder Vorauszahlung — kein Steuerdokument"
                        action={<ProformaDownloadButton legalComplete={legalComplete} plan={org?.plan ?? 'paylens'} onGoToOrg={onGoToOrg} />}
                    />
                </div>

                {!legalComplete && (
                    <div className="mt-3 flex items-start gap-2 text-xs p-3 rounded-lg"
                        style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <AlertTriangle size={12} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                        <span style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Für Vertragsunterlagen und Proforma-Rechnung bitte zunächst{' '}
                            <button onClick={onGoToOrg} className="underline font-semibold" style={{ color: '#f59e0b' }}>
                                Rechtliche Angaben
                            </button>{' '}
                            ausfüllen (Organisation-Tab).
                        </span>
                    </div>
                )}

                <p className="text-xs mt-4" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    Alle Preise zzgl. MwSt. · Jährliche Abrechnung · Kündigung 3 Monate zum Jahresende
                    · Fragen:{' '}
                    <a href="mailto:hallo@complens.de" className="underline hover:text-blue-400">hallo@complens.de</a>
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
                    Datenschutz &amp; Compliance
                </h2>
                <div className="space-y-3">
                    {[
                        { icon: '🇩🇪', title: 'EU-Server',         desc: 'Alle Daten in Frankfurt am Main (EU-West)' },
                        { icon: '🔒', title: 'DSGVO-konform',     desc: 'Art. 28 AVV auf Anfrage verfügbar' },
                        { icon: '🔑', title: 'Verschlüsselung',   desc: 'TLS 1.3 in transit, AES-256 at rest' },
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
                        Kontolöschung: Bitte wenden Sie sich an hallo@complens.de
                    </span>
                </div>
            </div>
        </div>
    )
}
