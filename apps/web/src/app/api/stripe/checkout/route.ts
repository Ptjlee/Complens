import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { parseBody } from '@/lib/api/parseBody'
import { rateLimit, RATE_LIMITS } from '@/lib/api/rateLimit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2026-02-25.clover',
})

const PRICE_IDS: Record<string, string | undefined> = {
    license:            process.env.STRIPE_PRICE_LICENSE,
    additional_access:  process.env.STRIPE_PRICE_ADDITIONAL_ACCESS,
}

const CheckoutSchema = z.object({
    plan:            z.enum(['license', 'additional_access']),
    additionalUsers: z.number().int().min(0).max(100).optional().default(0),
})

/**
 * POST /api/stripe/checkout
 * Body: { plan: 'paylens' | 'paylens_ai', additionalUsers?: number }
 * Returns: { url: string } — redirect to Stripe Checkout
 */
export async function POST(req: NextRequest) {
    const limited = rateLimit(req, RATE_LIMITS.stripe)
    if (limited) return limited

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const parsed = await parseBody(req, CheckoutSchema)
        if ('error' in parsed) return parsed.error
        const { plan, additionalUsers } = parsed.data

        const priceId = PRICE_IDS[plan]
        if (!priceId || priceId === 'price_xxx') {
            return NextResponse.json(
                { error: 'Plan not yet available. Stripe products are being configured.' },
                { status: 503 }
            )
        }

        // Fetch org to get/create Stripe customer
        const { data: org } = await supabase
            .from('organisations')
            .select('id, name, stripe_customer_id, country, legal_address, legal_zip, legal_city, vat_id')
            .single()

        if (!org) {
            return NextResponse.json({ error: 'Organisation not found' }, { status: 404 })
        }

        // Get or create Stripe customer
        let customerId = org.stripe_customer_id
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name:  org.name,
                preferred_locales: ['de'],
                metadata: { org_id: org.id, user_id: user.id },
            })
            customerId = customer.id

            // Save customer ID immediately
            await supabase
                .from('organisations')
                .update({ stripe_customer_id: customerId })
                .eq('id', org.id)
        }

        // Force Stripe Customer to have the latest address + German locale for invoices
        const cc = org.country === 'Deutschland' ? 'DE' : (org.country || 'DE')
        await stripe.customers.update(customerId, {
            name: org.name,
            preferred_locales: ['de'],
            address: {
                line1: org.legal_address || undefined,
                city: org.legal_city || undefined,
                postal_code: org.legal_zip || undefined,
                country: cc.toUpperCase().slice(0, 2),
            }
        })

        // Pre-fill VAT ID on the Stripe Customer so checkout recognizes them as B2B
        if (org.vat_id) {
            try {
                const existingTaxIds = await stripe.customers.listTaxIds(customerId)
                const alreadyHasIt = existingTaxIds.data.some(t => t.value === org.vat_id)
                if (!alreadyHasIt) {
                    await stripe.customers.createTaxId(customerId, {
                        type: 'eu_vat',
                        value: org.vat_id,
                    })
                }
            } catch (err) {
                console.error('[stripe/checkout] Could not sync VAT ID:', err)
            }
        }


        // Build line items
        const isAddon = plan === 'additional_access'
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
            { price: priceId, quantity: 1 },
        ]
        if (!isAddon && additionalUsers > 0 && PRICE_IDS.additional_access) {
            lineItems.push({
                price:    PRICE_IDS.additional_access,
                quantity: additionalUsers,
            })
        }

        const origin = req.headers.get('origin') ?? 'http://localhost:3001'

        const session = await stripe.checkout.sessions.create({
            customer:   customerId,
            mode:       'subscription',
            line_items: lineItems,
            metadata:   { org_id: org.id, plan },
            automatic_tax: { enabled: true },
            tax_id_collection: { enabled: true },
            customer_update: { name: 'auto', address: 'auto' },
            // ── Payment methods: Kreditkarte + SEPA-Lastschrift ──
            payment_method_types: ['card', 'sepa_debit'],
            success_url: `${origin}/dashboard/settings#billing`,
            cancel_url:  `${origin}/dashboard/settings#billing`,
            allow_promotion_codes: true,
            billing_address_collection: 'required',
            locale: 'de',
            // ── Apply German invoice template to all subscription invoices ──
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            subscription_data: {
                invoice_settings: {
                    issuer:    { type: 'self' },
                    rendering: { template: 'inrtem_1TESkCEB4pWUyJsm80m4qk18' },
                } as any,
            },
        } as any)

        return NextResponse.json({ url: session.url })
    } catch (err) {
        console.error('[stripe/checkout]', err)
        const msg = err instanceof Error ? err.message : 'Stripe error'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
