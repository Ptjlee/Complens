import { getReadyDatasets, getAnalysisTrend } from './analysis/actions'
import DashboardOverview from './DashboardOverview'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = {
    title: 'Übersicht — CompLens',
    description: 'EU-konforme Entgeltlückenübersicht nach EU-Richtlinie 2023/970.',
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let role = 'admin'
    if (user) {
        const adminClient = createAdminClient()
        const { data: member } = await adminClient
            .from('organisation_members')
            .select('role')
            .eq('user_id', user.id)
            .single()
        role = member?.role ?? 'viewer'
    }

    const [datasets, trend] = await Promise.all([
        getReadyDatasets(),
        getAnalysisTrend(),
    ])
    return <DashboardOverview datasets={datasets} trend={trend} role={role} />
}
