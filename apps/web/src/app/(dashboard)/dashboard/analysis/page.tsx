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
    let hasJobAssignments = false
    if (user) {
        const admin = createAdminClient()
        const { data: m } = await admin
            .from('organisation_members')
            .select('role, org_id')
            .eq('user_id', user.id)
            .single()
        isAdmin = m?.role === 'admin'

        // Check if org has any confirmed job assignments (enables job_family WIF factor)
        if (m?.org_id) {
            const { count } = await admin
                .from('employee_job_assignments')
                .select('id', { count: 'exact', head: true })
                .eq('org_id', m.org_id)
                .eq('status', 'confirmed')
                .limit(1)
            hasJobAssignments = (count ?? 0) > 0
        }
    }

    const [datasets, bandContext] = await Promise.all([
        getReadyDatasets(),
        getBandContext(),
    ])

    return (
        <AnalysisPageClient datasets={datasets} isAdmin={isAdmin} bandContext={bandContext} hasJobAssignments={hasJobAssignments} />
    )
}
