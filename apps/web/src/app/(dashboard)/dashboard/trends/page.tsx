import { createClient } from '@/lib/supabase/server'
import type { AnalysisResult } from '@/lib/calculations/types'
import TrendPageClient from './TrendPageClient'

export const metadata = { title: 'Trendanalyse — CompLens' }

export interface TrendPoint {
    year:              number
    analysisId:        string
    analysisName:      string
    datasetId:         string | null   // for grouping comparison series
    createdAt:         string
    unadjustedMedian:  number
    unadjustedMean:    number
    adjustedMedian:    number | null
    adjustedMean:      number | null
    totalEmployees:    number
    femaleCount:       number
    maleCount:         number
    exceeds5pct:       boolean
    wifFactors:        string[]
    deptGaps:          Array<{ dept: string; unadj: number | null; adj: number | null }>
    gradeGaps:         Array<{ grade: string; unadj: number | null; adj: number | null }>
}

export default async function TrendsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch all completed analyses with their dataset info
    const { data: analyses } = await supabase
        .from('analyses')
        .select('id, name, created_at, results, datasets(id, name, reporting_year)')
        .eq('status', 'complete')
        .is('archived_at', null)
        .order('created_at', { ascending: true })

    const points: TrendPoint[] = (analyses ?? []).map(a => {
        const r  = a.results as AnalysisResult
        const o  = r.overall
        const ds = a.datasets as unknown as { id: string; name: string; reporting_year: number } | null
        return {
            year:              r.reporting_year ?? ds?.reporting_year ?? new Date(a.created_at).getFullYear(),
            analysisId:        a.id,
            analysisName:      ds?.name ?? a.name ?? 'Analyse',
            datasetId:         ds?.id ?? null,
            createdAt:         a.created_at,
            unadjustedMedian:  (o.unadjusted_median ?? 0) * 100,
            unadjustedMean:    (o.unadjusted_mean   ?? 0) * 100,
            adjustedMedian:    o.adjusted_median != null ? o.adjusted_median * 100 : null,
            adjustedMean:      o.adjusted_mean   != null ? o.adjusted_mean   * 100 : null,
            totalEmployees:    r.total_employees,
            femaleCount:       o.female_count,
            maleCount:         o.male_count,
            exceeds5pct:       o.exceeds_5pct,
            wifFactors:        r.wif_factors_used,
            deptGaps:          r.by_department.filter(d => !d.suppressed).map(d => ({
                dept:  d.department,
                unadj: d.gap.unadjusted_median != null ? d.gap.unadjusted_median * 100 : null,
                adj:   d.gap.adjusted_median   != null ? d.gap.adjusted_median   * 100 : null,
            })),
            gradeGaps: r.by_grade.filter(g => !g.suppressed).map(g => ({
                grade: g.grade,
                unadj: g.gap.unadjusted_median != null ? g.gap.unadjusted_median * 100 : null,
                adj:   g.gap.adjusted_median   != null ? g.gap.adjusted_median   * 100 : null,
            })),
        }
    })

    return <TrendPageClient points={points} />
}
