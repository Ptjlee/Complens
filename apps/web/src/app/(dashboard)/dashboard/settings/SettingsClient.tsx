'use client'

import { useState, useTransition, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import {
    Building2, User as UserIcon, CreditCard, Shield, TrendingUp,
    Check, AlertTriangle, ChevronRight, Crown, Zap, Users, FileDown, Globe,
} from 'lucide-react'
import { signOut } from '@/app/(auth)/actions'
import { trackCheckoutStarted, trackPaymentComplete } from '@/lib/analytics'
import TeamPanel from './TeamPanel'
import SalaryBandsPanel from './SalaryBandsPanel'
import { useTranslations, useFormatter, useLocale } from 'next-intl'

// ─── Upgrade to license button ────────────────────────────────

function UpgradeButton() {
    const t = useTranslations('settings')
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
            if (!res.ok || !data.url) throw new Error(data.error ?? t('stripeError'))
            trackCheckoutStarted()
            window.location.href = data.url
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : t('errorGeneric'))
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
                {loading ? t('redirecting') : t('buyLicense')}
            </button>
            {err && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{err}</p>}
        </div>
    )
}

// ─── Manage subscription (Stripe Customer Portal) ─────────────

function ManageSubscriptionButton() {
    const t = useTranslations('settings')
    const [loading, setLoading] = useState(false)
    const [err, setErr]         = useState<string | null>(null)

    async function handleClick() {
        setLoading(true)
        setErr(null)
        try {
            const res  = await fetch('/api/stripe/portal', { method: 'POST' })
            const data = await res.json()
            if (!res.ok || !data.url) throw new Error(data.error ?? t('stripeError'))
            window.location.href = data.url
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : t('errorGeneric'))
            setLoading(false)
        }
    }

    return (
        <div>
            <button
                id="manage-subscription-btn"
                onClick={handleClick}
                disabled={loading}
                className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-60"
                style={{
                    background: 'var(--color-pl-surface-raised)',
                    border:     '1px solid var(--color-pl-border)',
                    color:      'var(--color-pl-text-primary)',
                    cursor:     loading ? 'not-allowed' : 'pointer',
                }}
            >
                <CreditCard size={14} />
                {loading ? t('redirecting') : t('manageSubscription')}
            </button>
            {err && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{err}</p>}
        </div>
    )
}


function AddOnButton() {
    const t = useTranslations('settings')
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
            if (!res.ok || !data.url) throw new Error(data.error ?? t('stripeError'))
            window.location.href = data.url
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : t('errorGeneric'))
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
                {loading ? t('loadingShort') : t('bookNow')}
            </button>
            {err && <p className="text-[10px] mt-1 text-red-400">{err}</p>}
        </div>
    )
}

// ─── Pro-forma download button (simple, no payment selector) ──

function ProformaDownloadButton({ legalComplete, plan, onGoToOrg }: { legalComplete: boolean; plan: string; onGoToOrg: () => void }) {
    const t = useTranslations('settings')
    const [loading, setLoading] = useState(false)

    async function handleDownload() {
        if (!legalComplete) return
        setLoading(true)
        try {
            const res = await fetch(`/api/stripe/proforma?plan=${plan}`)
            if (!res.ok) {
                const d = await res.json().catch(() => ({}))
                alert(d.error ?? t('proformaError'))
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
            alert(t('technicalError'))
        } finally {
            setLoading(false)
        }
    }

    if (!legalComplete) {
        return (
            <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                {t('fillLegalFirst')}{' '}
                <button onClick={onGoToOrg} className="underline hover:brightness-125 transition-all" style={{ color: 'var(--color-pl-brand-light)' }}>
                    {t('legalDetailsLink')}
                </button>{' '}
                {t('fillLegalSuffix')}
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
            {loading ? t('generating') : t('downloadDoc')}
        </button>
    )
}

// ─── Language selector ────────────────────────────────────────

function LanguageSelector() {
    const serverLang = useLocale()
    const [activeLang, setActiveLang] = useState(serverLang)
    const [switching, setSwitching] = useState(false)

    const LANGS: { code: string; label: string; flag: string }[] = [
        { code: 'de', label: 'Deutsch',  flag: '🇩🇪' },
        { code: 'en', label: 'English',  flag: '🇬🇧' },
    ]

    function handleClick(code: string) {
        if (code === activeLang || switching) return
        setActiveLang(code)
        setSwitching(true)
        document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
        fetch('/api/profile/language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: code }),
        }).finally(() => {
            window.location.hash = '#profile'
            window.location.reload()
        })
    }

    return (
        <div className="flex gap-2">
            {LANGS.map(l => (
                <button
                    type="button"
                    key={l.code}
                    onClick={() => handleClick(l.code)}
                    disabled={switching}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                        background: activeLang === l.code ? 'var(--color-pl-brand)' : 'rgba(255,255,255,0.05)',
                        border:     `1px solid ${activeLang === l.code ? 'var(--color-pl-brand)' : 'var(--color-pl-border)'}`,
                        color:      activeLang === l.code ? '#fff' : 'var(--color-pl-text-secondary)',
                        opacity:    switching ? 0.7 : 1,
                        cursor:     switching ? 'wait' : 'pointer',
                    }}
                >
                    <span className="text-base leading-none">{l.flag}</span>
                    {l.label}
                    {activeLang === l.code && <Check size={11} />}
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
    const t = useTranslations('settings')
    const [activeTab, setActiveTab] = useState<'org' | 'team' | 'profile' | 'billing' | 'security' | 'bands'>('org')
    const [openInvite, setOpenInvite] = useState(false)

    useEffect(() => {
        const hash = window.location.hash.replace('#', '') as 'org' | 'team' | 'profile' | 'billing' | 'security' | 'bands'
        const valid = ['org', 'team', 'profile', 'billing', 'security', 'bands']
        if (valid.includes(hash)) setActiveTab(hash)
        if (hash === 'billing' && ['licensed', 'paylens', 'paylens_ai'].includes(org?.plan ?? '')) trackPaymentComplete()
    }, [])

    const trialEnd  = org?.trial_ends_at       ? new Date(org.trial_ends_at)       : null
    const subEnd    = org?.subscription_ends_at ? new Date(org.subscription_ends_at) : null
    const isLicensed = ['licensed', 'paylens', 'paylens_ai'].includes(org?.plan ?? '')

    const now = new Date()
    const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)) : null
    const trialActive = !isLicensed && trialEnd && trialEnd > now

    const tabs = [
        { id: 'org',      label: t('tabOrg'),      icon: Building2,  adminOnly: false },
        { id: 'team',     label: t('tabTeam'),      icon: Users,       adminOnly: false },
        { id: 'profile',  label: t('tabProfile'),   icon: UserIcon,    adminOnly: false },
        { id: 'bands',    label: t('tabBands'),     icon: TrendingUp,  adminOnly: true  },
        { id: 'billing',  label: t('tabBilling'),   icon: CreditCard,  adminOnly: false },
        { id: 'security', label: t('tabSecurity'),  icon: Shield,      adminOnly: false },
    ] as const

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('title')}</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('subtitle')}
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
                            {t.rich('trialBanner', { days: daysLeft, strong: (chunks) => <strong>{chunks}</strong> })}
                        </span>
                    </div>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className="flex items-center gap-1 text-xs font-semibold"
                        style={{ color: '#f59e0b' }}
                    >
                        {t('upgradeNow')} <ChevronRight size={12} />
                    </button>
                </div>
            )}

            <div className="flex gap-6">
                {/* Sidebar nav */}
                <nav className="w-44 flex-shrink-0 space-y-1">
                 {tabs.filter(t => !t.adminOnly || role === 'admin').map(({ id, label, icon: Icon }) => (
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
                    {activeTab === 'bands'    && <SalaryBandsPanel />}
                    {activeTab === 'billing'  && <BillingTab  org={org} subEnd={subEnd} isLicensed={isLicensed} legalComplete={!!(legalData.legal_representative && legalData.legal_address && legalData.legal_city)} onGoToOrg={() => setActiveTab('org')} />}
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
    const t = useTranslations('settings')
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
    const [country,   setCountry]   = useState(legalData.country || t('legalCountryDefault'))
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
        setCountry(legalData.country || t('legalCountryDefault'))
        setLegalError(null)
        setLegalEditing(false)
    }

    const legalComplete = !!(legalRep.trim() && legalAddr.trim() && legalCity.trim() && country.trim())
    const isAdmin = role === 'admin'

    return (
        <div className="space-y-4">
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('orgDetails')}
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('companyName')}
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
                                {t('adminOnlyName')}
                            </p>
                        )}
                    </div>
                    {error && <p className="text-xs" style={{ color: 'var(--color-pl-red)' }}>{error}</p>}
                    {isAdmin && (
                        <button onClick={handleSave} disabled={pending} className="btn-primary">
                            {saved ? <><Check size={13} /> {t('saved')}</> : pending ? t('saving') : t('saveChanges')}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Legal information ── */}
            <div className="glass-card p-5">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('legalTitle')}
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('legalSubtitle')}
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
                            {legalComplete ? <><Check size={11} /> {t('legalComplete')}</> : t('legalMissing')}
                        </span>
                        {isAdmin && !legalEditing && (
                            <button
                                onClick={() => setLegalEditing(true)}
                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
                                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--color-pl-brand-light)' }}
                            >
                                {t('legalEdit')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Read-only summary */}
                {!legalEditing && legalComplete && (
                    <div className="space-y-2 text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        <div className="grid grid-cols-3 gap-1">
                            <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('legalRepSummary')}</span>
                            <span className="col-span-2 font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>{legalRep}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('legalAddressLabel')}</span>
                            <span className="col-span-2">{legalAddr}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('legalZipCity')}</span>
                            <span className="col-span-2">{legalZip} {legalCity}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                            <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('legalCountry')}</span>
                            <span className="col-span-2">{country}</span>
                        </div>
                        {vatId && (
                            <div className="grid grid-cols-3 gap-1">
                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('legalVatIdSummary')}</span>
                                <span className="col-span-2">{vatId}</span>
                            </div>
                        )}
                        {legalSaved && (
                            <p className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>
                                <Check size={12} /> {t('saved')}
                            </p>
                        )}
                    </div>
                )}

                {/* Edit form */}
                {legalEditing && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                {t('legalRepLabel')} <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input value={legalRep} onChange={e => setLegalRep(e.target.value)}
                                placeholder={t('legalRepPlaceholder')} className="input-base w-full" />
                            <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('legalRepHint')}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                {t('legalAddress')} <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input value={legalAddr} onChange={e => setLegalAddr(e.target.value)}
                                placeholder={t('legalAddressPlaceholder')} className="input-base w-full" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('legalZip')} <span style={{ color: '#ef4444' }}>*</span></label>
                                <input value={legalZip} onChange={e => setLegalZip(e.target.value)}
                                    placeholder={t('legalZipPlaceholder')} className="input-base w-full" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('legalCity')} <span style={{ color: '#ef4444' }}>*</span></label>
                                <input value={legalCity} onChange={e => setLegalCity(e.target.value)}
                                    placeholder={t('legalCityPlaceholder')} className="input-base w-full" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('legalCountry')} <span style={{ color: '#ef4444' }}>*</span></label>
                            <input value={country} onChange={e => setCountry(e.target.value)}
                                placeholder={t('legalCountryPlaceholder')} className="input-base w-full" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('legalVatId')}</label>
                            <input value={vatId} onChange={e => setVatId(e.target.value)}
                                placeholder={t('legalVatIdPlaceholder')} className="input-base w-full" />
                        </div>
                        {legalError && <p className="text-xs" style={{ color: '#ef4444' }}>{legalError}</p>}
                        <div className="flex items-center gap-2">
                            <button onClick={handleLegalSave} disabled={legalPending} className="btn-primary">
                                {legalPending ? t('saving') : t('saved').replace('!', '')}
                            </button>
                            <button
                                onClick={handleLegalCancel}
                                disabled={legalPending}
                                className="text-xs px-3 py-1.5 rounded-lg"
                                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-secondary)' }}
                            >
                                {t('legalCancel')}
                            </button>
                        </div>
                    </div>
                )}

                {!legalEditing && !legalComplete && (
                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('legalNoData')}{' '}
                        {isAdmin && <button onClick={() => setLegalEditing(true)} className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>{t('legalFillNow')}</button>}
                    </p>
                )}
            </div>

            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('teamTitle')}
                </h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('teamMembers', { count: memberCount, max: org?.max_users ?? 1 })}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('teamSeatsInfo', { max: org?.max_users ?? 1 })}
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--color-pl-brand-light)' }}
                            onClick={onInvite}
                        >
                            {t('teamInvite')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Tab: Profile ─────────────────────────────────────────────

function ProfileTab({ user, profileData }: { user: User; profileData: { fullName: string; jobTitle: string } }) {
    const t = useTranslations('settings')
    const format = useFormatter()
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

    const memberSinceDate = format.dateTime(new Date(user.created_at), { month: 'long', year: 'numeric' })

    return (
        <div className="space-y-4">
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('profileTitle')}
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
                            {t('memberSince', { date: memberSinceDate })}
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('fullName')}
                        </label>
                        <input
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder={t('fullNamePlaceholder')}
                            className="input-base w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('jobTitleLabel')}
                        </label>
                        <input
                            value={jobTitle}
                            onChange={e => setJobTitle(e.target.value)}
                            placeholder={t('jobTitlePlaceholder')}
                            className="input-base w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('language')}
                        </label>
                        <LanguageSelector />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('emailLabel')}
                        </label>
                        <input value={user.email ?? ''} disabled className="input-base w-full" style={{ opacity: 0.5 }} />
                        <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('emailChangeHint')}
                        </p>
                    </div>

                    {error && <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>}

                    <button
                        onClick={handleSaveProfile}
                        disabled={isPending}
                        className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-all"
                        style={{ background: 'var(--color-pl-brand)', color: '#fff' }}
                    >
                        {saved ? <><Check size={13} /> {t('profileSaved')}</> : isPending ? t('profileSaving') : t('profileSave')}
                    </button>
                </div>
            </div>

            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('changePassword')}
                </h2>
                <p className="text-xs mb-4" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('changePasswordHint')}
                </p>
                <button
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--color-pl-brand-light)' }}
                    onClick={() => alert(t('resetEmailAlert'))}
                >
                    {t('sendResetEmail')}
                </button>
            </div>

            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-1" style={{ color: '#ef4444' }}>
                    {t('logoutTitle')}
                </h2>
                <p className="text-xs mb-4" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('logoutHint')}
                </p>
                <form action={signOut}>
                    <button
                        type="submit"
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}
                    >
                        {t('logoutBtn')}
                    </button>
                </form>
            </div>
        </div>
    )
}

// ─── Tab: Billing ─────────────────────────────────────────────

function BillingTab({
    org, subEnd, isLicensed, legalComplete, onGoToOrg
}: {
    org: Org
    subEnd: Date | null
    isLicensed: boolean
    legalComplete: boolean
    onGoToOrg: () => void
}) {
    const t = useTranslations('settings')
    const format = useFormatter()
    const subStart = subEnd ? new Date(subEnd.getTime() - 365 * 24 * 60 * 60 * 1000) : null
    const fmtDate  = (d: Date | null) =>
        d ? format.dateTime(d, { day: '2-digit', month: '2-digit', year: 'numeric' }) : null

    const planKey = org?.plan ?? 'trial'
    const planLabel = t(`plan${planKey === 'trial' ? 'Trial' : planKey === 'free' ? 'Free' : 'Licensed'}Label` as any)
    const planBadge = t(`plan${planKey === 'trial' ? 'Trial' : planKey === 'free' ? 'Free' : 'Licensed'}Badge` as any)
    const planColor = planKey === 'trial' || planKey === 'free' ? '#f59e0b' : 'var(--color-pl-brand)'

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
                    {t('currentPlan')}
                </p>
                <div className="flex items-center gap-3">
                    <div
                        className="px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide"
                        style={{ background: planColor + '18', color: planColor, border: `1px solid ${planColor}40` }}
                    >
                        {planBadge}
                    </div>
                    <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {planLabel}
                        </p>
                        {isLicensed && subStart && subEnd ? (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {fmtDate(subStart)} → {fmtDate(subEnd)}
                            </p>
                        ) : subEnd ? (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {t('renewal', { date: fmtDate(subEnd) ?? '' })}
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
                        {t('licenseCta')}
                    </p>
                    <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('licensePrice')}{' '}
                        <span className="text-sm font-normal" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('licensePriceUnit')}
                        </span>
                    </p>
                    <p className="text-xs mb-5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('licensePriceDesc')}
                    </p>
                    <div className="space-y-1.5 mb-5">
                        {([
                            t('licenseFeature1'),
                            t('licenseFeature2'),
                            t('licenseFeature3'),
                            t('licenseFeature4'),
                            t('licenseFeature5'),
                        ]).map(f => (
                            <div key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                <Check size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                                {f}
                            </div>
                        ))}
                    </div>
                    <UpgradeButton />
                    <p className="text-xs mt-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('licensePaymentNote')}
                    </p>
                </div>
            )}

            {/* ── 2b. Licensed → Add-on seats ───────────────────── */}
            {isLicensed && (
                <div className="glass-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('expandSeats')}
                    </p>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('additionalSeat')}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {t('additionalSeatDesc')}
                            </p>
                        </div>
                        <AddOnButton />
                    </div>
                </div>
            )}

            {/* ── 2c. Licensed → Manage subscription ────────────── */}
            {isLicensed && (
                <div className="glass-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('subscriptionInvoices')}
                    </p>
                    <p className="text-xs mb-4" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('subscriptionManageDesc')}
                    </p>
                    <ManageSubscriptionButton />
                </div>
            )}

            {/* ── 3. Documents ──────────────────────────────────── */}
            <div className="glass-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('documents')}
                </p>
                <p className="text-xs mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('documentsInvoiceNote')}
                </p>

                <div>
                    {/* Lizenzvertrag */}
                    <DocRow
                        icon={<FileDown size={14} style={{ color: isLicensed && legalComplete ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)' }} />}
                        title={t('docLicenseTitle')}
                        subtitle={isLicensed
                            ? t('docLicenseSub', { orgName: org?.name ?? '' })
                            : t('docLicenseAvailAfter')}
                        muted={!isLicensed}
                        action={isLicensed && legalComplete ? (
                            <a
                                href={`/api/contracts/license?plan=${encodeURIComponent(org?.plan ?? 'paylens')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--color-pl-brand-light)', textDecoration: 'none' }}
                            >
                                <FileDown size={12} /> {t('downloadDoc')}
                            </a>
                        ) : isLicensed ? (
                            <button onClick={onGoToOrg} className="text-xs hover:underline" style={{ color: 'var(--color-pl-brand-light)' }}>{t('docLicenseFillLegal')}</button>
                        ) : (
                            <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--color-pl-text-tertiary)', border: '1px solid var(--color-pl-border)' }}>
                                {t('docAfterLicensing')}
                            </span>
                        )}
                    />

                    {/* AVV */}
                    <DocRow
                        icon={<FileDown size={14} style={{ color: isLicensed && legalComplete ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)' }} />}
                        title={t('docAvvTitle')}
                        subtitle={isLicensed
                            ? t('docAvvSub')
                            : t('docAvvAvailAfter')}
                        muted={!isLicensed}
                        action={isLicensed && legalComplete ? (
                            <a
                                href="/api/contracts/avv"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--color-pl-brand-light)', textDecoration: 'none' }}
                            >
                                <FileDown size={12} /> {t('downloadDoc')}
                            </a>
                        ) : isLicensed ? (
                            <button onClick={onGoToOrg} className="text-xs hover:underline" style={{ color: 'var(--color-pl-brand-light)' }}>{t('docLicenseFillLegal')}</button>
                        ) : (
                            <span className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--color-pl-text-tertiary)', border: '1px solid var(--color-pl-border)' }}>
                                {t('docAfterLicensing')}
                            </span>
                        )}
                    />

                    {/* Proforma */}
                    <DocRow
                        icon={<FileDown size={14} style={{ color: legalComplete ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)' }} />}
                        title={t('docProformaTitle')}
                        subtitle={t('docProformaSub')}
                        action={<ProformaDownloadButton legalComplete={legalComplete} plan={org?.plan ?? 'paylens'} onGoToOrg={onGoToOrg} />}
                    />
                </div>

                {!legalComplete && (
                    <div className="mt-3 flex items-start gap-2 text-xs p-3 rounded-lg"
                        style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <AlertTriangle size={12} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                        <span style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t.rich('docLegalWarning', {
                                link: (chunks) => (
                                    <button onClick={onGoToOrg} className="underline font-semibold" style={{ color: '#f59e0b' }}>
                                        {t('docLegalLink')}
                                    </button>
                                ),
                            })}
                        </span>
                    </div>
                )}

                <p className="text-xs mt-4" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('pricingNote', { email: 'hallo@complens.de' })}
                </p>
            </div>
        </div>
    )
}

// ─── Tab: Security ────────────────────────────────────────────

function SecurityTab() {
    const t = useTranslations('settings')
    return (
        <div className="space-y-4">
            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('securityTitle')}
                </h2>
                <div className="space-y-3">
                    {[
                        { icon: '🇩🇪', title: t('secEuServer'),     desc: t('secEuServerDesc') },
                        { icon: '🔒', title: t('secGdpr'),          desc: t('secGdprDesc') },
                        { icon: '🔑', title: t('secEncryption'),    desc: t('secEncryptionDesc') },
                        { icon: '📋', title: t('secAuditLog'),      desc: t('secAuditLogDesc') },
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
                <a href="/toms" className="inline-flex items-center gap-1.5 text-xs font-medium mt-4 hover:underline" style={{ color: 'var(--color-pl-brand-light)' }}>
                    <Shield size={12} /> {t('viewFullToms')}
                    <ChevronRight size={12} />
                </a>
            </div>

            <div className="glass-card p-5">
                <h2 className="text-sm font-semibold mb-1" style={{ color: '#ef4444' }}>
                    {t('secDeletionTitle')}
                </h2>
                <p className="text-xs mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {t('secDeletionDesc')}
                </p>
                <div className="flex items-center gap-2 text-xs p-3 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('secDeletionContact')}
                    </span>
                </div>
            </div>
        </div>
    )
}
