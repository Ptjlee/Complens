'use client'

/**
 * TrialExpiredOverlay
 * Shown when an org's trial period has ended.
 *
 * Two modes:
 * - isReadOnlyMode=true (default): renders as a top banner that allows
 *   read-only access to existing analyses and reports underneath.
 *   Users can dismiss the banner to navigate, but cannot create new data
 *   or export (gated by canUse/planGuard on the backend).
 * - isReadOnlyMode=false: legacy full-screen blocking overlay.
 */

import { useEffect, useRef, useState } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import { CalendarX2, BarChart3, FileText, ShieldCheck, Zap, Loader2, LogOut, X, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface TrialExpiredOverlayProps {
    trialEndedAt: string
    /** When true, shows a dismissible banner instead of a full-screen blocker */
    isReadOnlyMode?: boolean
}

export default function TrialExpiredOverlay({ trialEndedAt, isReadOnlyMode = false }: TrialExpiredOverlayProps) {
    const t = useTranslations('dashboard.expiredOverlay')
    const format = useFormatter()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState<string | null>(null)
    const [dismissed, setDismissed] = useState(false)
    const overlayRef = useRef<HTMLDivElement>(null)

    async function handleLogout() {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    const FEATURES = [
        { icon: BarChart3,   label: t('feature1') },
        { icon: FileText,    label: t('feature2') },
        { icon: Zap,         label: t('feature3') },
        { icon: ShieldCheck, label: t('feature4') },
    ]

    // Lock body scroll only in full-screen mode
    useEffect(() => {
        if (!isReadOnlyMode) {
            document.body.style.overflow = 'hidden'
            return () => { document.body.style.overflow = '' }
        }
    }, [isReadOnlyMode])

    const endDate = format.dateTime(new Date(trialEndedAt), {
        day: '2-digit', month: 'long', year: 'numeric',
    })

    async function handleUpgrade() {
        setLoading(true)
        setError(null)
        try {
            const res  = await fetch('/api/stripe/checkout', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ plan: 'license' }),
            })
            const data = await res.json()
            if (!res.ok || !data.url) throw new Error(data.error ?? 'Stripe error')
            window.location.href = data.url
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e))
            setLoading(false)
        }
    }

    // ── Read-only banner mode ──────────────────────────────────────────
    if (isReadOnlyMode) {
        if (dismissed) return null

        return (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    background: 'linear-gradient(135deg, #1a0a0a 0%, #0d1117 50%, #0a0d14 100%)',
                    borderBottom: '1px solid rgba(220,38,38,0.3)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                    padding: '14px 24px',
                }}
            >
                <div style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                }}>
                    {/* Icon + text */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
                        <CalendarX2 size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                        <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>
                                {t('badge')}
                            </span>
                            <span style={{ fontSize: 13, color: '#8b949e', marginLeft: 8 }}>
                                {t('expiredOn', { date: endDate })}
                            </span>
                            <span style={{ fontSize: 12, color: '#6e7681', marginLeft: 12 }}>
                                {t('readOnlyNotice')}
                            </span>
                        </div>
                    </div>

                    {/* Read-only indicator */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px', borderRadius: 8,
                        background: 'rgba(245,158,11,0.10)',
                        border: '1px solid rgba(245,158,11,0.25)',
                        fontSize: 11.5, fontWeight: 600, color: '#f59e0b',
                        flexShrink: 0,
                    }}>
                        <Eye size={13} />
                        {t('readOnlyBadge')}
                    </div>

                    {/* Upgrade button */}
                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        style={{
                            padding: '8px 20px',
                            borderRadius: 8,
                            border: '1px solid rgba(59,130,246,0.5)',
                            background: 'linear-gradient(130deg, rgba(59,130,246,0.25), rgba(29,78,216,0.15))',
                            fontSize: 13, fontWeight: 600, color: '#93c5fd',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'opacity .15s',
                            flexShrink: 0,
                        }}
                    >
                        {loading ? (
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            t('upgradeCta')
                        )}
                    </button>

                    {/* Dismiss */}
                    <button
                        onClick={() => setDismissed(true)}
                        style={{
                            padding: 6, borderRadius: 6,
                            background: 'transparent', border: 'none',
                            color: '#4d5562', cursor: 'pointer',
                            flexShrink: 0,
                        }}
                        aria-label="Dismiss"
                    >
                        <X size={16} />
                    </button>
                </div>

                {error && (
                    <div style={{
                        maxWidth: 1200, margin: '8px auto 0',
                        padding: '8px 12px', borderRadius: 6,
                        background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
                        fontSize: 12, color: '#fca5a5',
                    }}>
                        {error}
                    </div>
                )}

                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        )
    }

    // ── Full-screen blocking mode (legacy) ─────────────────────────────
    return (
        <div
            ref={overlayRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(8, 12, 20, 0.90)',
                backdropFilter: 'blur(20px) saturate(0.4)',
                WebkitBackdropFilter: 'blur(20px) saturate(0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
            }}
        >
            {/* Card */}
            <div style={{
                maxWidth: 500,
                width: '100%',
                borderRadius: 20,
                overflow: 'hidden',
                background: 'linear-gradient(145deg, #0d1117 0%, #161b22 100%)',
                border: '1px solid rgba(220,38,38,0.3)',
                boxShadow: '0 0 0 1px rgba(220,38,38,0.08), 0 40px 80px rgba(0,0,0,0.75), 0 0 100px rgba(220,38,38,0.06)',
            }}>
                {/* Top red accent */}
                <div style={{ height: 4, background: 'linear-gradient(90deg, #b91c1c, #ef4444, #b91c1c)' }} />

                <div style={{ padding: '36px 40px 40px' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'rgba(220,38,38,0.10)',
                            border: '1px solid rgba(220,38,38,0.25)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <CalendarX2 size={24} color="#ef4444" />
                        </div>
                        <div>
                            <div style={{
                                fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em',
                                color: '#ef4444', textTransform: 'uppercase', marginBottom: 4,
                            }}>
                                {t('badge')}
                            </div>
                            <div style={{ fontSize: 13, color: '#6e7681' }}>
                                {t('expiredOn', { date: endDate })}
                            </div>
                        </div>
                    </div>

                    {/* Headline */}
                    <h2 style={{
                        margin: '0 0 10px',
                        fontSize: 25, fontWeight: 700,
                        color: '#f0f6fc', lineHeight: 1.3, letterSpacing: '-0.02em',
                    }}>
                        {t('title')}
                    </h2>
                    <p style={{
                        margin: '0 0 24px',
                        fontSize: 13.5, color: '#8b949e', lineHeight: 1.65,
                    }}>
                        {t('body')}
                    </p>

                    {/* Feature pills */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        gap: '9px 14px',
                        marginBottom: 28,
                        padding: '16px 18px',
                        borderRadius: 11,
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        {FEATURES.map(({ icon: Icon, label }) => (
                            <div key={label} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                fontSize: 12, color: '#8b949e',
                            }}>
                                <Icon size={13} color="#3b82f6" style={{ flexShrink: 0 }} />
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Single plan CTA */}
                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        style={{
                            width: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px 20px',
                            borderRadius: 12,
                            border: '1px solid rgba(59,130,246,0.5)',
                            background: 'linear-gradient(130deg, rgba(59,130,246,0.18), rgba(29,78,216,0.10))',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.75 : 1,
                            transition: 'opacity .15s, transform .1s',
                            textAlign: 'left',
                        }}
                        onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#93c5fd', marginBottom: 3 }}>
                                {t('licenseName')}
                            </div>
                            <div style={{ fontSize: 12, color: '#6e7681' }}>
                                {t('licenseFeatures')}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 20 }}>
                            {loading ? (
                                <Loader2 size={20} color="#93c5fd"
                                    style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f6fc' }}>
                                        {t('pricePerYear')}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 3 }}>
                                        {t('priceVat')}
                                    </div>
                                </>
                            )}
                        </div>
                    </button>

                    {/* Error */}
                    {error && (
                        <div style={{
                            marginTop: 12, padding: '10px 14px', borderRadius: 8,
                            background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
                            fontSize: 12.5, color: '#fca5a5',
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Fine print */}
                    <p style={{
                        margin: '18px 0 0', textAlign: 'center',
                        fontSize: 11.5, color: '#4d5562',
                    }}>
                        {t('licenseQuestion')}{' '}
                        <a href="/dashboard/help" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                            {t('contactSupport')}
                        </a>
                    </p>

                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 mt-4 mx-auto text-xs font-medium px-4 py-2 rounded-lg transition-all"
                        style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#f87171',
                        }}
                    >
                        <LogOut size={13} />
                        {t('logout')}
                    </button>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}
