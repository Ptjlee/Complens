import { getReadyDatasets } from './actions'
import AnalysisPageClient from './AnalysisPage'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
    title: 'Analyse — CompLens',
    description: 'EU-konforme Entgeltlückenanalyse nach EU-Richtlinie 2023/970.',
}

export default async function AnalysisPage() {
    const datasets = await getReadyDatasets()

    // Fetch role using admin client (bypasses RLS so viewer rows are always visible)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    let isAdmin = false
    if (user) {
        const admin = createAdminClient()
        const { data: m } = await admin
            .from('organisation_members')
            .select('role')
            .eq('user_id', user.id)
            .single()
        isAdmin = m?.role === 'admin'
    }

    return (
        <AnalysisPageClient datasets={datasets} isAdmin={isAdmin} />
    )
}
