import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'
import OnboardingModal from '@/components/dashboard/OnboardingModal'
import TrialBanner from '@/components/dashboard/TrialBanner'
import TrialExpiredOverlay from '@/components/dashboard/TrialExpiredOverlay'
import DeviceFingerprintRegistrar from '@/components/dashboard/DeviceFingerprintRegistrar'
import AnalysisChatbot from './dashboard/analysis/AnalysisChatbot'
import { getOrCreateOnboardingProgress } from './dashboard/onboarding/actions'
import LocaleSync from '@/components/dashboard/LocaleSync'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase    = await createClient()
    const adminClient = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Step 1: Resolve member row → guaranteed correct org_id + language preference
    const { data: member } = await adminClient
        .from('organisation_members')
        .select('org_id, preferred_language, role, full_name')
        .eq('user_id', user.id)
        .single()

    // Step 2: Load org by explicit ID (avoids RLS caching returning stale plan data)
    // and onboarding progress — in parallel
    const [onboarding, { data: org }] = await Promise.all([
        getOrCreateOnboardingProgress(),
        member?.org_id
            ? adminClient
                .from('organisations')
                .select('id, name, plan, trial_ends_at, ai_enabled')
                .eq('id', member.org_id)
                .single()
            : Promise.resolve({ data: null }),
    ])

    const initialLang = (member?.preferred_language as string | undefined) ?? 'de'

    // Check if NEXT_LOCALE cookie matches DB preference
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
    const localeMismatch = cookieLocale !== initialLang

    const showOnboarding = !!onboarding && !onboarding.completed_at

    // Detect expired trial
    const isLicensed   = ['licensed', 'paylens', 'paylens_ai'].includes(org?.plan ?? '')
    const trialEnd     = org?.trial_ends_at ? new Date(org.trial_ends_at) : null
    const trialExpired = !isLicensed && trialEnd !== null && trialEnd < new Date()

    // If DB language doesn't match cookie, sync it client-side and reload
    if (localeMismatch) {
        return <LocaleSync locale={initialLang} />
    }

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-pl-bg)' }}>
            <Sidebar role={member?.role as 'admin' | 'viewer'} />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header user={user} fullName={member?.full_name} />
                {org && <TrialBanner org={org as any} />}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
            {showOnboarding && (
                <OnboardingModal initialStep={onboarding.current_step} />
            )}
            <DeviceFingerprintRegistrar />
            <AnalysisChatbot />
            {trialExpired && org?.trial_ends_at && (
                <TrialExpiredOverlay trialEndedAt={org.trial_ends_at} isReadOnlyMode />
            )}
        </div>
    )
}
