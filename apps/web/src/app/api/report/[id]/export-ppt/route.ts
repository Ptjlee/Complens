import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AnalysisResult } from '@/lib/calculations/types'
import { generateReportPptx } from '@/lib/ppt/ReportPresentation'

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
    }

    // ── Fetch analysis, org, plans, explanations in parallel ──────────────────
    const [analysisRes, orgRes, plansRes, explRes] = await Promise.all([
        supabase
            .from('analyses')
            .select('id, name, created_at, report_notes, results, datasets(name, reporting_year, employee_count)')
            .eq('id', id)
            .eq('status', 'complete')
            .single(),
        supabase
            .from('organisations')
            .select('name, plan, trial_ends_at')
            .single(),
        supabase
            .from('remediation_plans')
            .select('employee_id, action_type, status, deadline_months, plan_steps')
            .eq('analysis_id', id),
        supabase
            .from('pay_gap_explanations')
            .select('employee_id, categories_json, max_justifiable_pct, status')
            .eq('analysis_id', id),
    ])

    if (analysisRes.error || !analysisRes.data) {
        return NextResponse.json({ error: 'Analyse nicht gefunden.' }, { status: 404 })
    }

    const rawAnalysis = analysisRes.data as Record<string, unknown>
    const results     = rawAnalysis.results as AnalysisResult
    const orgName     = (orgRes.data?.name as string | null) ?? 'Organisation'
    const orgPlan      = orgRes.data?.plan as string | null
    const trialEndsAt  = orgRes.data?.trial_ends_at as string | null
    const isLicensed   = ['licensed', 'paylens', 'paylens_ai'].includes(orgPlan ?? '')
    const trialEnd     = trialEndsAt ? new Date(trialEndsAt) : null
    const now          = new Date()
    const trialExpired = !isLicensed && trialEnd !== null && trialEnd < now
    const trialActive  = !isLicensed && trialEnd !== null && trialEnd >= now && orgPlan === 'trial'
    const sampleMode: 'trial' | 'expired' | null =
        trialExpired ? 'expired' : trialActive ? 'trial' : null

    type PlanStep = { step_number?: number; action_type?: string; horizon: string; description: string; target_salary: number | null; responsible?: string; notes?: string; status?: string }
    const plans = (plansRes.data ?? []) as Array<{ employee_id: string; action_type: string; status: string; deadline_months: number; plan_steps: PlanStep[] }>

    // ── Compute Nach-Begründungen gap (same formula as PDF route) ─────────────
    type CatEntry = { claimed_pct?: number }
    const exps = (explRes.data ?? []) as Array<{ employee_id: string; categories_json?: CatEntry[]; max_justifiable_pct: number; status: string }>

    const explainedEmployeeIds = new Set(
        exps.filter(e => e.status === 'explained').map(e => e.employee_id)
    )
    // Build per-employee claimed reduction map for per-group Nach Bgr. computation
    const explClaimedMap = new Map<string, number>()
    for (const exp of exps) {
        const cats = exp.categories_json ?? []
        const total = cats.reduce((s: number, c) => s + (c.claimed_pct ?? 0), 0)
        explClaimedMap.set(exp.employee_id, total)
    }

    const explMap = new Map<string, CatEntry[]>()
    for (const exp of exps) { explMap.set(exp.employee_id, exp.categories_json ?? []) }

    let explanationAdjustedGap: number | null = null
    const flaggedNonOk = results.individual_flags.filter(f => Math.abs(f.gap_vs_cohort_pct) >= 0.05)
    if (flaggedNonOk.length > 0) {
        let sumRaw = 0, sumResiduals = 0
        for (const f of flaggedNonOk) {
            const rawGap = Math.abs(f.gap_vs_cohort_pct * 100)
            const cats   = explMap.get(f.employee_id) ?? []
            const expl   = Math.min(cats.reduce((s: number, c) => s + (c.claimed_pct ?? 0), 0), 25)
            sumRaw       += rawGap
            sumResiduals += Math.max(0, rawGap - expl)
        }
        const adj100 = (results.overall.adjusted_median ?? 0) * 100
        explanationAdjustedGap = sumRaw > 0
            ? (adj100 * (sumResiduals / sumRaw)) / 100
            : adj100 / 100
    }

    // ── Generate PPTX ─────────────────────────────────────────────────────────
    try {
        const buf = await generateReportPptx(results, {
            orgName,
            analysisName:          rawAnalysis.name as string,
            analysisDate:          rawAnalysis.created_at as string,
            reportNotes:           (rawAnalysis.report_notes as string | null) ?? null,
            plans,
            explanationAdjustedGap,
            explainedEmployeeIds,
            explClaimedMap,
            isSample:   sampleMode !== null,
            sampleMode,
        })

        const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
        const prefix      = sampleMode ? 'MUSTER_' : ''
        const safeName    = prefix + ((rawAnalysis.name as string) ?? 'report')
            .replace(/[^a-z0-9_\-]/gi, '_')
            .slice(0, 60)

        return new NextResponse(arrayBuffer, {
            status: 200,
            headers: {
                'Content-Type':        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'Content-Disposition': `attachment; filename="${safeName}.pptx"`,
                'Cache-Control':       'no-store',
            },
        })
    } catch (err) {
        console.error('[ppt-export] Error generating PPTX:', err)
        return NextResponse.json({ error: 'Fehler beim Erstellen der Präsentation.' }, { status: 500 })
    }
}
