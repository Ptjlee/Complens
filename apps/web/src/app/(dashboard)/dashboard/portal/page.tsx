import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import PortalClient from './PortalClient'

export async function generateMetadata() {
    const t = await getTranslations('portal')
    return { title: t('pageTitle') }
}

export default async function PortalPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const admin = createAdminClient()
    const { data: member } = await admin
        .from('organisation_members')
        .select('role, org_id')
        .eq('user_id', user.id)
        .single()
    if (member?.role !== 'admin') {
        redirect('/dashboard')
    }

    // H11: Fetch org-specific pay criteria text
    const { data: org } = await admin
        .from('organisations')
        .select('pay_criteria_text')
        .eq('id', member.org_id)
        .single()

    // Fetch the most recent completed analysis and its dataset
    const { data: latestAnalysis } = await supabase
        .from('analyses')
        .select(`
            id, name, created_at, results, status,
            datasets!inner(id, name, reporting_year)
        `)
        .eq('status', 'complete')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (!latestAnalysis) {
        return <PortalClient analysis={null} payCriteriaText={org?.pay_criteria_text ?? null} />
    }

    return <PortalClient analysis={latestAnalysis as any} payCriteriaText={org?.pay_criteria_text ?? null} />
}
