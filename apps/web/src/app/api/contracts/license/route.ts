import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { ContractDocument } from '@/lib/pdf/ContractDocument'
import React from 'react'

/**
 * GET /api/contracts/license
 * Returns a personalised, pre-signed PDF licence contract.
 * Requires legal fields (legal_representative, legal_address, legal_city) to be filled.
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return new NextResponse('Unauthorized', { status: 401 })

        // Fetch org — including all legal fields
        const { data: org } = await supabase
            .from('organisations')
            .select('id, name, plan, country, created_at, legal_representative, legal_address, legal_city, legal_zip, vat_id, job_architecture_enabled')
            .single()

        if (!org) return new NextResponse('Organisation not found', { status: 404 })

        // Guard: require legal fields to be set
        if (!org.legal_representative || !org.legal_address || !org.legal_city) {
            return new NextResponse(
                JSON.stringify({ error: 'Bitte füllen Sie zuerst die rechtlichen Angaben in den Einstellungen aus (Organisation → Rechtliche Angaben).' }),
                { status: 422, headers: { 'Content-Type': 'application/json' } },
            )
        }

        // Fetch caller's name + job title
        const { data: member } = await supabase
            .from('organisation_members')
            .select('full_name, job_title')
            .eq('user_id', user.id)
            .single()

        // Determine plan
        const qPlan      = req.nextUrl.searchParams.get('plan')
        const plan       = (qPlan ?? org.plan ?? 'paylens') as string

        // Deterministic contract ID
        const seed       = `${org.id}-${plan}`.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()
        const contractId = `CL-${new Date().getFullYear()}-${seed}`

        const issuedDate = new Date().toLocaleDateString('de-DE', {
            day:   '2-digit',
            month: 'long',
            year:  'numeric',
        })

        // Build full customer address
        const customerAddress = [
            org.legal_address,
            `${org.legal_zip ?? ''} ${org.legal_city}`.trim(),
            org.country ?? 'Deutschland',
        ].filter(Boolean).join(', ')

        const doc = React.createElement(ContractDocument, {
            orgName:             org.name ?? 'Kunde',
            orgAddress:          customerAddress,
            legalRepresentative: org.legal_representative,
            vatId:               org.vat_id ?? '',
            contactEmail:        user.email ?? '',
            contactName:         member?.full_name ?? '',
            contactTitle:        member?.job_title ?? '',
            plan,
            issuedDate,
            contractId,
            jobArchitectureEnabled: org.job_architecture_enabled === true,
        })

        const pdfBuffer = await renderToBuffer(
            doc as React.ReactElement<import('@react-pdf/renderer').DocumentProps>
        )

        const safeOrg  = (org.name ?? 'CompLens').replace(/[^a-zA-Z0-9_\-]/g, '_')
        const filename = `CompLens_Lizenzvertrag_${safeOrg}_${new Date().getFullYear()}.pdf`

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type':        'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })
    } catch (err) {
        console.error('[contracts/license]', err)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
