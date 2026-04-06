import { getReadyDatasets } from './actions'
import AnalysisPageClient from './AnalysisPage'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBandContext } from '@/lib/band/getBandContext'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
    const t = await getTranslations('metadata')
    return {
        title: t('analysisTitle'),
        description: t('analysisDescription'),
    }
}

export default async function AnalysisPage() {
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

    const [datasets, bandContext] = await Promise.all([
        getReadyDatasets(),
        getBandContext(),
    ])

    return (
        <AnalysisPageClient datasets={datasets} isAdmin={isAdmin} bandContext={bandContext} />
    )
}
