import ImportWizard from './ImportWizard'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
    const t = await getTranslations('importWizard')
    return {
        title: `${t('title')} — CompLens`,
        description: t('subtitle'),
    }
}

export default async function ImportPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const admin = createAdminClient()
    const { data: member } = await admin
        .from('organisation_members')
        .select('role, org_id')
        .eq('user_id', user.id)
        .single()
    if (member?.role !== 'admin') {
        redirect('/dashboard')
    }

    // C5: Check if the organisation has accepted the AVV (Art. 28 DSGVO)
    const { data: org } = await admin
        .from('organisations')
        .select('avv_accepted_at')
        .eq('id', member.org_id)
        .single()

    return <ImportWizard avvAcceptedAt={org?.avv_accepted_at ?? null} orgId={member.org_id} />
}
