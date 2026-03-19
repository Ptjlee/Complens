'use client'

import { trialDaysLeft, effectivePlan } from '@/lib/plans'
import type { OrgPlanFields } from '@/lib/plans'
import { useRouter } from 'next/navigation'
import { Clock, Zap } from 'lucide-react'

interface TrialBannerProps {
    org: OrgPlanFields & { name: string }
}

export default function TrialBanner({ org }: TrialBannerProps) {
    const router = useRouter()
    const effective = effectivePlan(org)

    // Only show for trial plan users
    if (org.plan !== 'trial') return null

    const daysLeft = trialDaysLeft(org)
    const expired  = daysLeft === 0
    const urgent   = daysLeft <= 3

    const bg     = expired ? 'rgba(239,68,68,0.08)'   : urgent ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.06)'
    const border = expired ? 'rgba(239,68,68,0.3)'    : urgent ? 'rgba(245,158,11,0.3)'  : 'rgba(59,130,246,0.2)'
    const color  = expired ? '#ef4444'                : urgent ? '#f59e0b'               : '#60a5fa'
    const icon   = expired ? <Zap size={14} />        : <Clock size={14} />

    const message = expired
        ? 'Ihr Testzeitraum ist abgelaufen. Upgraden Sie jetzt, um den Zugriff zu behalten.'
        : daysLeft <= 7
        ? `Noch ${daysLeft} Tag${daysLeft === 1 ? '' : 'e'} im Testzeitraum.`
        : null

    // Don't show banner if plenty of time left (> 7 days)
    if (!message) return null

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 24px',
            background: bg,
            borderBottom: `1px solid ${border}`,
            flexShrink: 0,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color }}>{icon}</span>
                <span style={{ fontSize: 13, color, fontWeight: 600 }}>{message}</span>
            </div>
            <button
                onClick={() => router.push('/dashboard/settings#billing')}
                style={{
                    background: color,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                }}
            >
                Jetzt upgraden →
            </button>
        </div>
    )
}
