import { getAllAnalyses } from './actions'
import ReportsListClient from './ReportsList'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
    const t = await getTranslations('metadata')
    return {
        title: t('reportsTitle'),
        description: t('reportsDescription'),
    }
}

export default async function ReportsPage() {
    const analyses = await getAllAnalyses()

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

    return <ReportsListClient analyses={analyses} isAdmin={isAdmin} />
}
