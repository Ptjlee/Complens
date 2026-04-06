import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { PortalDocument } from '@/lib/pdf/PortalDocument'
import type { PortalLabels } from '@/lib/pdf/PortalDocument'
import type { AnalysisResult } from '@/lib/calculations/types'
import React from 'react'

const LABELS_DE: PortalLabels = {
    headerBadge: 'Auskunftsrecht · Art. 7 EU 2023/970',
    title: 'Auskunftsrecht (Art. 7)',
    subtitle: 'Bereitstellung von Entgeltinformationen an Mitarbeitende gem. EU-Richtlinie 2023/970',
    employeeInfo: 'Mitarbeiterinformation',
    objectiveCriteria: 'Objektive Kriterien der Einstufung',
    cohortLabel: 'Vergleichsgruppe (Kohorte)',
    criteriaText: 'Die Kriterien für die Festlegung der regelmäßigen Grundvergütung basieren auf objektiven, geschlechtsneutralen Faktoren wie Aufgabenkomplexität, Verantwortung und Marktwert der Position.',
    salaryStructure: 'Durchschnittliche Gehaltsstruktur (Bruttostundenverdienst)',
    cohortColumn: 'Vergleichsgruppe',
    mean: 'Mittelwert',
    median: 'Median',
    women: 'Davon Frauen',
    men: 'Davon Männer',
    yourPay: 'Ihr Entgelt (Analyse-Stichtag)',
    legalNote: 'Nach Art. 7 der Richtlinie 2023/970 ist diese Auskunft binnen zwei Monaten nach Anfrage zu erteilen.',
    dataBasis: 'Datenbasis',
    footerLeft: 'EU-Entgelttransparenz 2023/970',
    footerRight: 'Erstellt mit CompLens',
    filenamePrefix: 'Auskunftsrecht',
}

const LABELS_EN: PortalLabels = {
    headerBadge: 'Pay information · Art. 7 EU 2023/970',
    title: 'Pay Information (Art. 7)',
    subtitle: 'Individual pay information for employees per EU Directive 2023/970',
    employeeInfo: 'Employee information',
    objectiveCriteria: 'Objective classification criteria',
    cohortLabel: 'Peer group (cohort)',
    criteriaText: 'The criteria for determining regular base pay are based on objective, gender-neutral factors such as task complexity, responsibility, and market value of the position.',
    salaryStructure: 'Average pay structure (gross hourly earnings)',
    cohortColumn: 'Peer group',
    mean: 'Mean',
    median: 'Median',
    women: 'Women',
    men: 'Men',
    yourPay: 'Your pay (analysis date)',
    legalNote: 'Per Art. 7, Directive 2023/970, this information must be provided within two months of the request.',
    dataBasis: 'Data basis',
    footerLeft: 'EU Pay Transparency 2023/970',
    footerRight: 'Generated with CompLens',
    filenamePrefix: 'PayInfo',
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ analysisId: string; employeeId: string }> },
) {
    const { analysisId, employeeId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'de'
    const labels = locale === 'en' ? LABELS_EN : LABELS_DE

    // Fetch analysis
    const { data: analysis } = await supabase
        .from('analyses')
        .select(`
            id, name, created_at, results,
            datasets(name, reporting_year)
        `)
        .eq('id', analysisId)
        .eq('status', 'complete')
        .single()

    if (!analysis) return new NextResponse('Not found', { status: 404 })

    const r = analysis.results as AnalysisResult
    const employee = r.individual_flags.find(f => f.employee_id === employeeId)

    if (!employee) return new NextResponse('Employee not found', { status: 404 })

    const gradeInfo = r.by_grade.find(g => g.grade === employee.job_grade)

    if (!gradeInfo) return new NextResponse('Grade info not found', { status: 404 })

    const { data: org } = await supabase.from('organisations').select('name').single()
    const orgName = org?.name ?? 'Organisation'

    const doc = React.createElement(PortalDocument, {
        orgName,
        analysis: analysis as any,
        employee,
        gradeInfo,
        labels,
        locale,
    })

    const pdfBuffer = await renderToBuffer(doc as React.ReactElement<import('@react-pdf/renderer').DocumentProps>)
    const filename  = `${labels.filenamePrefix}_${employee.employee_id}_${orgName.replace(/\s+/g, '_')}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
            'Content-Type':        'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    })
}
