import { getReadyDatasets, getAnalysisTrend } from './analysis/actions'
import DashboardOverview from './DashboardOverview'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
    title: 'Übersicht — CompLens',
    description: 'EU-konforme Entgeltlückenübersicht nach EU-Richtlinie 2023/970.',
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const [datasets, trend, { data: org }] = await Promise.all([
        getReadyDatasets(),
        getAnalysisTrend(),
        supabase.from('organisations').select('plan, trial_ends_at, ai_enabled').single(),
    ])
    return <DashboardOverview datasets={datasets} trend={trend} org={org ?? undefined} />
}
