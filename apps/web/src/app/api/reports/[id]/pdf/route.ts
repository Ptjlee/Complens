import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { ReportDocument } from '@/lib/pdf/ReportDocument'
import type { AnalysisResult } from '@/lib/calculations/types'
import { MAX_JUSTIFIABLE_CAP } from '@/app/(dashboard)/dashboard/import/constants'
import { getBandContext } from '@/lib/band/getBandContext'
import React from 'react'
import { cookies } from 'next/headers'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params
    const sp      = req.nextUrl.searchParams

    // ── Locale ──
    const localeParam = sp.get('locale')
    const cookieStore = await cookies()
    const locale = localeParam || cookieStore.get('NEXT_LOCALE')?.value || 'de'
    const messages = (await import(`../../../../../../messages/${locale}.json`)).default
    const rt = (key: string) => messages?.report?.[key] ?? key

    // ── PDF options from query params ──
    const companyName   = sp.get('companyName')  ?? undefined
    const reportTitle   = sp.get('reportTitle')  ?? undefined
    const signatories   = [
        sp.get('sig0') ?? rt('sigHrLead'),
        sp.get('sig1') ?? rt('sigManagement'),
        sp.get('sig2') ?? rt('sigWorksCouncil'),
    ] as [string, string, string]
    const sectionsParam = sp.get('sections')
    const sections      = sectionsParam ? new Set(sectionsParam.split(',')) : null

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    // Fetch analysis
    const { data: analysis } = await supabase
        .from('analyses')
        .select(`
            id, name, created_at, report_notes, results,
            datasets(name, reporting_year, employee_count)
        `)
        .eq('id', id)
        .eq('status', 'complete')
        .single()

    if (!analysis) return new NextResponse('Not found', { status: 404 })

    const { data: org } = await supabase.from('organisations').select('name, plan, trial_ends_at').single()
    const isLicensed   = ['licensed', 'paylens', 'paylens_ai'].includes(org?.plan ?? '')
    const trialEnd     = org?.trial_ends_at ? new Date(org.trial_ends_at) : null
    const now          = new Date()
    const trialExpired = !isLicensed && trialEnd !== null && trialEnd < now
    const trialActive  = !isLicensed && trialEnd !== null && trialEnd >= now && org?.plan === 'trial'
    const sampleMode: 'trial' | 'expired' | null =
        trialExpired ? 'expired' : trialActive ? 'trial' : null

    const [explRes, plansRes, bandCtx] = await Promise.all([
        supabase
            .from('pay_gap_explanations')
            .select('id, employee_id, category, categories_json, action_plan, max_justifiable_pct, status, created_at')
            .eq('analysis_id', id),
        supabase
            .from('remediation_plans')
            .select('id, employee_id, action_type, status, deadline_months, plan_steps')
            .eq('analysis_id', id),
        getBandContext(),
    ])

    const result      = analysis.results as AnalysisResult
    const reportYear  = result.reporting_year
    const orgName     = companyName ?? org?.name ?? 'Organisation'
    const exps        = (explRes.data ?? []) as Parameters<typeof ReportDocument>[0]['explanations']
    const plans       = (plansRes.data ?? []) as Array<{ employee_id: string; action_type: string; status: string; deadline_months: number; plan_steps: Array<{ step_number?: number; action_type?: string; horizon: string; description: string; target_salary: number | null; responsible?: string; notes?: string; status?: string }> }>

    // ── Tier 3: Explanation-adjusted gap (partial-credit method) ──
    // Mirror of the same logic in ReportView.tsx
    // ── Tier 3: proportional reduction of WIF-adjusted median (mirrors AnalysisPage.tsx) ──
    const explMap = new Map<string, Array<{ claimed_pct?: number }>>()
    for (const exp of exps) {
        explMap.set(exp.employee_id, (exp.categories_json ?? []) as Array<{ claimed_pct?: number }>)
    }
    const flaggedNonOk = result.individual_flags.filter(f => Math.abs(f.gap_vs_cohort_pct) >= 0.05)
    let explanationAdjustedGap: number | null = null
    if (flaggedNonOk.length > 0) {
        let sumRaw = 0, sumResiduals = 0
        for (const f of flaggedNonOk) {
            const rawGapPct = Math.abs(f.gap_vs_cohort_pct * 100)
            const cats = explMap.get(f.employee_id) ?? []
            const explained = Math.min(cats.reduce((s: number, c) => s + (c.claimed_pct ?? 0), 0), 25)
            sumRaw += rawGapPct
            sumResiduals += Math.max(0, rawGapPct - explained)
        }
        const adjustedMedianPct = (result.overall.adjusted_median ?? 0) * 100
        const residual = sumRaw > 0
            ? adjustedMedianPct * (sumResiduals / sumRaw)
            : adjustedMedianPct
        explanationAdjustedGap = residual / 100
    }

    // Build labels from messages for i18n
    const reportMessages = messages?.report ?? {}
    const labels: Record<string, string> = {}
    for (const [k, v] of Object.entries(reportMessages)) {
        if (typeof v === 'string') labels[k] = v
    }

    const doc = React.createElement(ReportDocument, {
        result,
        orgName,
        locale,
        labels,
        reportName:               reportTitle ?? analysis.name ?? `${rt('pdfFilenameReport')} ${reportYear}`,
        createdAt:                analysis.created_at,
        reportNotes:              (analysis as { report_notes?: string | null }).report_notes ?? null,
        explanations:             exps,
        remediationPlans:         plans,
        sections,
        signatories,
        explanationAdjustedGap,
        isSample:                 sampleMode !== null,
        sampleMode,
        bandGrades:               sections === null || sections.has('salaryBands') ? bandCtx.grades : [],
    })

    const pdfBuffer = await renderToBuffer(doc as React.ReactElement<import('@react-pdf/renderer').DocumentProps>)
    const prefix    = sampleMode ? rt('samplePrefix') : ''
    const filename  = `${prefix}CompLens_${rt('pdfFilenameReport')}_${reportYear}_${orgName.replace(/\s+/g, '_')}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
            'Content-Type':        'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    })
}
