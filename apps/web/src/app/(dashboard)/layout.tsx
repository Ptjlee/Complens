import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'
import OnboardingModal from '@/components/dashboard/OnboardingModal'
import TrialBanner from '@/components/dashboard/TrialBanner'
import { getOrCreateOnboardingProgress } from './dashboard/onboarding/actions'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Load onboarding state + org plan in parallel
    const [onboarding, { data: org }] = await Promise.all([
        getOrCreateOnboardingProgress(),
        supabase.from('organisations')
            .select('id, name, plan, trial_ends_at, ai_enabled')
            .single(),
    ])

    const showOnboarding = !!onboarding && !onboarding.completed_at

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-pl-bg)' }}>
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header user={user} />
                {org && <TrialBanner org={org as any} />}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
            {showOnboarding && (
                <OnboardingModal initialStep={onboarding.current_step} />
            )}
        </div>
    )
}
