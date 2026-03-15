import { createClient } from '@/lib/supabase/server'
import PortalClient from './PortalClient'

export const metadata = { title: 'Auskunftsrecht (Art. 7) — CompLens' }

export default async function PortalPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

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
        return <PortalClient analysis={null} />
    }

    return <PortalClient analysis={latestAnalysis as any} />
}
