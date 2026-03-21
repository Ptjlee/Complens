import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { ProformaInvoice } from '@/lib/pdf/ProformaInvoice'
import type { ProformaLine } from '@/lib/pdf/ProformaInvoice'
import React from 'react'

// ─── Plan pricing (net, EUR) ────────────────────────────────────────────────
// Keep in sync with Stripe price IDs and the README

const PLAN_LINES: Record<string, ProformaLine> = {
    paylens: {
        description: 'CompLens Lizenz – Jahresabonnement (inkl. 1 HR-Admin + 1 Betriebsrat-Lesezugang)',
        quantity:    1,
        unitPrice:   5033.61,   // 5990 gross / 1.19 = 5033.61 net
    },
    paylens_ai: {
        description: 'CompLens Lizenz (inkl. KI-Funktionen) – Jahresabonnement (1 HR-Admin + 1 Betriebsrat-Lesezugang)',
        quantity:    1,
        unitPrice:   5033.61,   // same price, same plan in current model
    },
    additional_user: {
        description: 'Zusätzlicher Nutzerplatz – Jahresabonnement',
        quantity:    1,
        unitPrice:   831.93,    // 990 gross / 1.19 = 831.93 net
    },
}

// ─── Reference generator ────────────────────────────────────────────────────

function generateRef(orgId: string): string {
    const seed = orgId.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()
    const yr   = new Date().getFullYear()
    return `PF-${yr}-${seed}`
}

// ─── Date helpers ────────────────────────────────────────────────────────────

function formatDE(d: Date): string {
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
}

function addDays(d: Date, n: number): Date {
    const r = new Date(d)
    r.setDate(r.getDate() + n)
    return r
}

// ─── Route ──────────────────────────────────────────────────────────────────

/**
 * GET /api/stripe/proforma?plan=paylens&additionalUsers=0&paymentMethod=vorkasse
 *
 * Returns a pro-forma invoice PDF for the selected plan.
 * Requires the user to be logged in and their org to have legal fields set.
 *
 * Query params:
 *   plan            – 'paylens' | 'paylens_ai'        (required)
 *   additionalUsers – integer 0-100                    (optional, default 0)
 *   paymentMethod   – 'card' | 'sepa' | 'vorkasse'    (optional, default 'card')
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return new NextResponse('Unauthorized', { status: 401 })

        // ── Parse query params ──────────────────────────────────────────────
        const { searchParams } = new URL(req.url)
        const rawPlan         = searchParams.get('plan') ?? 'paylens'
        const additionalUsers = Math.max(0, Math.min(100, parseInt(searchParams.get('additionalUsers') ?? '0', 10) || 0))
        const paymentMethod   = (searchParams.get('paymentMethod') ?? 'sepa') as 'card' | 'sepa' | 'vorkasse'

        // Normalize org.plan values → valid PLAN_LINES key
        const PLAN_ALIAS: Record<string, string> = {
            paylens:         'paylens',
            paylens_ai:      'paylens_ai',
            additional_user: 'additional_user',
            licensed:        'paylens',
            trial:           'paylens',
            free:            'paylens',
        }
        const plan = PLAN_ALIAS[rawPlan] ?? 'paylens'

        if (!PLAN_LINES[plan]) {
            return NextResponse.json({ error: 'Unknown plan' }, { status: 400 })
        }

        // ── Fetch org ───────────────────────────────────────────────────────
        const { data: org } = await supabase
            .from('organisations')
            .select('id, name, country, legal_representative, legal_address, legal_city, legal_zip, vat_id')
            .single()

        if (!org) return new NextResponse('Organisation not found', { status: 404 })

        // ── Guard: require legal address fields ─────────────────────────────
        if (!org.legal_address || !org.legal_city) {
            return NextResponse.json(
                {
                    error: 'Für die Proforma-Rechnung bitte zuerst in den Einstellungen die rechtlichen Angaben ausfüllen (Adresse, Ort, PLZ).',
                },
                { status: 422 }
            )
        }

        // ── Build line items ────────────────────────────────────────────────
        const lines: ProformaLine[] = [{ ...PLAN_LINES[plan] }]

        if (additionalUsers > 0 && PLAN_LINES.additional_user) {
            lines.push({
                ...PLAN_LINES.additional_user,
                quantity: additionalUsers,
            })
        }

        // ── Customer address ────────────────────────────────────────────────
        const customerAddress = [
            org.legal_address,
            `${org.legal_zip ?? ''} ${org.legal_city}`.trim(),
            org.country ?? 'Deutschland',
        ].filter(Boolean).join('\n')

        // ── Dates ───────────────────────────────────────────────────────────
        const now        = new Date()
        const issuedDate = formatDE(now)
        const validUntil = formatDE(addDays(now, 14))
        const invoiceRef = generateRef(org.id)

        // ── Render ──────────────────────────────────────────────────────────
        const doc = React.createElement(ProformaInvoice, {
            invoiceRef,
            issuedDate,
            validUntil,
            customerName:    org.name ?? 'Kunde',
            customerAddress,
            customerVatId:   org.vat_id ?? '',
            customerCountry: org.country ?? 'Deutschland',
            lines,
            paymentMethod,
        })

        const pdfBuffer = await renderToBuffer(
            doc as React.ReactElement<import('@react-pdf/renderer').DocumentProps>
        )

        const safeOrg  = (org.name ?? 'CompLens').replace(/[^a-zA-Z0-9_\-]/g, '_')
        const filename = `CompLens_Proforma_${safeOrg}_${new Date().getFullYear()}.pdf`

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status:  200,
            headers: {
                'Content-Type':        'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })
    } catch (err) {
        console.error('[stripe/proforma]', err)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
