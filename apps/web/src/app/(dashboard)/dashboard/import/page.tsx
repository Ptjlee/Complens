import ImportWizard from './ImportWizard'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Daten importieren — CompLens',
    description: 'Laden Sie Ihre Gehaltsdaten hoch. CompLens erkennt die Spaltenzuordnung automatisch.',
}

export default async function ImportPage() {
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

    return <ImportWizard />
}
