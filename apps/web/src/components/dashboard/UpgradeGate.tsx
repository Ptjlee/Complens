'use client'

import { Lock, Zap } from 'lucide-react'
import { PLAN_META, FEATURE_LABELS } from '@/lib/plans'
import type { Feature } from '@/lib/plans'
import { useRouter } from 'next/navigation'

interface UpgradeGateProps {
    /** The feature this gate is protecting. */
    feature: Feature
    /** Which plan to upgrade to (resolved by requiredPlanFor() in the server component). */
    requiredPlan: 'paylens' | 'paylens_ai'
    /** Render children inside a blurred/locked overlay, or replace entirely. */
    mode?: 'overlay' | 'replace'
    children?: React.ReactNode
}

export default function UpgradeGate({
    feature,
    requiredPlan,
    mode = 'replace',
    children,
}: UpgradeGateProps) {
    const router  = useRouter()
    const meta    = PLAN_META[requiredPlan]
    const label   = FEATURE_LABELS[feature]

    const card = (
        <div style={{
            background: 'var(--color-pl-surface)',
            border: `1px solid ${meta.color}33`,
            borderRadius: 12,
            padding: '28px 24px',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        }}>
            {/* Lock icon */}
            <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: meta.colorBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Lock size={22} color={meta.color} />
            </div>

            {/* Message */}
            <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-pl-text)', marginBottom: 6 }}>
                    {label} ist nicht verfügbar
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-pl-text-sub)', lineHeight: 1.5 }}>
                    Diese Funktion ist im Plan{' '}
                    <strong style={{ color: meta.color }}>{meta.label}</strong>{' '}
                    enthalten ({meta.priceYearly.toLocaleString('de-DE')} €/Jahr).
                </div>
            </div>

            {/* Upgrade button */}
            <button
                onClick={() => router.push('/dashboard/settings?tab=plan')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: meta.color,
                    color: '#fff', border: 'none', borderRadius: 8,
                    padding: '10px 22px',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
                <Zap size={15} />
                Auf {meta.label} upgraden
            </button>
        </div>
    )

    if (mode === 'replace' || !children) return card

    // Overlay mode: render children with blur + lock card on top
    return (
        <div style={{ position: 'relative' }}>
            <div style={{ filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.4 }}>
                {children}
            </div>
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {card}
            </div>
        </div>
    )
}
