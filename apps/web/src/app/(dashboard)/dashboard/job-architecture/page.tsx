import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getJobArchitectureContext, canUseJobArchitecture } from '@/lib/jobArchitecture/getJobArchitectureContext'
import JobArchitectureClient from './JobArchitectureClient'
import { Layers, FolderTree, Star, GitBranch, Users, Upload, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export async function generateMetadata() {
    const t = await getTranslations('jobArchitecture')
    return {
        title:       t('pageMetaTitle'),
        description: t('pageMetaDescription'),
    }
}

// -- Upsell feature list icons (server-side mapping) --------
const featureIcons = [Layers, FolderTree, Star, GitBranch, Users, Upload] as const

export default async function JobArchitecturePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: member } = await supabase
        .from('organisation_members')
        .select('role')
        .eq('user_id', user.id)
        .single()

    if (!member || (member.role !== 'admin' && member.role !== 'analyst')) {
        redirect('/dashboard')
    }

    const hasAccess = await canUseJobArchitecture()
    const t = await getTranslations('jobArchitecture')

    // Check org plan for context-aware messaging
    const { data: org } = await supabase.from('organisations').select('plan, trial_ends_at, job_architecture_enabled').single()
    const isActiveTrial = org?.plan === 'trial' && org?.trial_ends_at && new Date(org.trial_ends_at) > new Date()
    const isLicensed = ['licensed', 'paylens', 'paylens_ai'].includes(org?.plan ?? '')

    if (!hasAccess) {

        const features = ([1, 2, 3, 4, 5, 6] as const).map(n => ({
            icon: featureIcons[n - 1],
            text: t(`moduleLockedFeature${n}` as any),
        }))

        return (
            <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center">
                <div
                    className="w-full rounded-2xl p-8 text-center"
                    style={{
                        background: 'var(--color-pl-card)',
                        border: '1px solid var(--color-pl-border)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    }}
                >
                    {/* Icon */}
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                        style={{ background: 'rgba(56,189,248,0.12)' }}
                    >
                        <Layers size={26} style={{ color: 'var(--color-pl-accent)' }} />
                    </div>

                    <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('moduleLockedTitle')}
                    </h1>
                    <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('moduleLockedDesc')}
                    </p>

                    {/* Feature list */}
                    <div className="grid gap-3 text-left mb-8">
                        {features.map(({ icon: Icon, text }, i) => (
                            <div key={i} className="flex items-start gap-3 px-4 py-2.5 rounded-xl"
                                style={{ background: 'var(--color-pl-surface)' }}
                            >
                                <Icon size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-pl-accent)' }} />
                                <span className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>{text}</span>
                            </div>
                        ))}
                    </div>

                    <p className="text-xs mb-6" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('moduleLockedTrialHint')}
                    </p>

                    {/* CTA */}
                    <Link
                        href="/dashboard/settings#billing"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                        style={{ background: 'var(--color-pl-brand)', color: '#fff' }}
                    >
                        {t('moduleLockedCta')}
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        )
    }

    const ctx = await getJobArchitectureContext()

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Trial banner — show when user has access via trial, not purchased */}
            {isActiveTrial && !org?.job_architecture_enabled && (
                <div className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                    <Layers size={16} style={{ color: 'var(--color-pl-brand)' }} />
                    <p className="text-xs flex-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('trialAddonHint')}
                    </p>
                    <Link href="/dashboard/settings#billing" className="text-xs font-semibold whitespace-nowrap"
                        style={{ color: 'var(--color-pl-brand-light)' }}>
                        {t('moduleLockedCta')} →
                    </Link>
                </div>
            )}

            {/* -- Page header ---------------------------------------- */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('pageTitle')}
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('pageSubtitle')}
                </p>
            </div>

            <JobArchitectureClient initialContext={ctx} />
        </div>
    )
}
