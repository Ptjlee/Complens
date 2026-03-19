import { getRemediationAnalyses, getRemediationPlans } from './actions'
import RemediationClient from './RemediationClient'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'   // never serve a stale cached version

export const metadata = {
    title: 'Maßnahmen — CompLens',
    description: 'Maßnahmenpläne für Entgeltlücken nach EU-Richtlinie 2023/970.',
}

export default async function RemediationPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const admin = createAdminClient()
    const { data: member } = await admin
        .from('organisation_members')
        .select('role')
        .eq('user_id', user.id)
        .single()
    if (member?.role !== 'admin') {
        redirect('/dashboard')
    }

    const analyses = await getRemediationAnalyses()
    // Pre-load plans for the default (first) analysis so they're in
    // the initial React state — avoids the "born empty, loaded async" race.
    const initialPlans = analyses[0]
        ? await getRemediationPlans(analyses[0].id)
        : []
    return <RemediationClient analyses={analyses} initialPlans={initialPlans} />
}
