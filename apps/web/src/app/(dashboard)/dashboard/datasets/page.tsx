import { getAllDatasets } from '../analysis/actions'
import DatasetsClient from './DatasetsClient'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Datensätze verwalten — CompLens',
    description: 'Importierte Datensätze anzeigen und verwalten.',
}

export default async function DatasetsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const admin = createAdminClient()
    const { data: m } = await admin
        .from('organisation_members')
        .select('role')
        .eq('user_id', user.id)
        .single()
        
    if (m?.role !== 'admin') {
        redirect('/dashboard')
    }

    const datasets = await getAllDatasets()
    const isAdmin = true

    return <DatasetsClient datasets={datasets} isAdmin={isAdmin} />
}
