import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AnalysisResult } from '@/lib/calculations/types'

/**
 * GET /api/analysis/[id]/results
 * Returns the full analysis results JSON + org_name for client-side use.
 * Used by the Remediation Planner client component.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })

    const [analysisRes, orgRes] = await Promise.all([
        supabase
            .from('analyses')
            .select('results, datasets(reporting_year, standard_weekly_hours)')
            .eq('id', id)
            .eq('status', 'complete')
            .single(),
        supabase
            .from('organisations')
            .select('name')
            .single(),
    ])

    if (analysisRes.error || !analysisRes.data) {
        return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404 })
    }

    return NextResponse.json({
        results:  analysisRes.data.results as AnalysisResult,
        org_name: (orgRes.data?.name as string | null) ?? 'Organisation',
    })
}
