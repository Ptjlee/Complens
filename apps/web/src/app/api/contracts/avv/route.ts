import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { AVVDocument } from '@/lib/pdf/AVVDocument'
import React from 'react'

/**
 * GET /api/contracts/avv
 * Returns a personalised, pre-signed AVV (Auftragsverarbeitungsvertrag)
 * gem. Art. 28 DSGVO as a PDF.
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
            .select('id, name, plan, country, legal_representative, legal_address, legal_city, legal_zip, vat_id')
            .single()

        if (!org) return new NextResponse('Organisation not found', { status: 404 })

        // Guard: require legal fields to be set
        if (!org.legal_representative || !org.legal_address || !org.legal_city) {
            return new NextResponse(
                JSON.stringify({
                    error: 'Bitte füllen Sie zuerst die rechtlichen Angaben in den Einstellungen aus (Organisation → Rechtliche Angaben).',
                }),
                { status: 422, headers: { 'Content-Type': 'application/json' } },
            )
        }

        // Fetch caller's name + job title
        const { data: member } = await supabase
            .from('organisation_members')
            .select('full_name, job_title')
            .eq('user_id', user.id)
            .single()

        // Deterministic AVV ID (stable per org so re-downloads get the same number)
        const seed  = `${org.id}`.replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()
        const avvId = `AVV-${new Date().getFullYear()}-${seed}`

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

        const doc = React.createElement(AVVDocument, {
            orgName:             org.name ?? 'Kunde',
            orgAddress:          customerAddress,
            legalRepresentative: org.legal_representative,
            vatId:               org.vat_id ?? '',
            contactEmail:        user.email ?? '',
            contactName:         member?.full_name ?? '',
            contactTitle:        member?.job_title ?? '',
            issuedDate,
            avvId,
        })

        const pdfBuffer = await renderToBuffer(
            doc as React.ReactElement<import('@react-pdf/renderer').DocumentProps>
        )

        const safeOrg  = (org.name ?? 'CompLens').replace(/[^a-zA-Z0-9_\-]/g, '_')
        const filename = `CompLens_AVV_${safeOrg}_${new Date().getFullYear()}.pdf`

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type':        'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })
    } catch (err) {
        console.error('[contracts/avv]', err)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
