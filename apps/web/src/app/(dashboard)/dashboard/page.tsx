import { getReadyDatasets, getAnalysisTrend } from './analysis/actions'
import DashboardOverview from './DashboardOverview'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBandContext } from '@/lib/band/getBandContext'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
    const t = await getTranslations('metadata')
    return {
        title: t('dashboardTitle'),
        description: t('dashboardDescription'),
    }
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

    const [datasets, trend, bandContext] = await Promise.all([
        getReadyDatasets(),
        getAnalysisTrend(),
        getBandContext(),
    ])
    return <DashboardOverview datasets={datasets} trend={trend} role={role} bandContext={bandContext} />
}
