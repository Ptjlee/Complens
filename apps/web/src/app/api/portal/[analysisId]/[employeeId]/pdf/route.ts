import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { PortalDocument } from '@/lib/pdf/PortalDocument'
import type { AnalysisResult } from '@/lib/calculations/types'
import React from 'react'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ analysisId: string; employeeId: string }> },
) {
    const { analysisId, employeeId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

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
    })

    const pdfBuffer = await renderToBuffer(doc as React.ReactElement<import('@react-pdf/renderer').DocumentProps>)
    const filename  = `Auskunftsrecht_${employee.employee_id}_${orgName.replace(/\s+/g, '_')}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
            'Content-Type':        'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    })
}
