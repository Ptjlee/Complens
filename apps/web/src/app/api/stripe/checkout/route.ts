import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { parseBody } from '@/lib/api/parseBody'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2026-02-25.clover',
})

const PRICE_IDS: Record<string, string | undefined> = {
    paylens:            process.env.STRIPE_PRICE_PAYLENS,
    paylens_ai:         process.env.STRIPE_PRICE_PAYLENS_AI,
    additional_user:    process.env.STRIPE_PRICE_ADDITIONAL_USER,
}

const CheckoutSchema = z.object({
    plan:            z.enum(['paylens', 'paylens_ai', 'additional_user']),
    additionalUsers: z.number().int().min(0).max(100).optional().default(0),
})

/**
 * POST /api/stripe/checkout
 * Body: { plan: 'paylens' | 'paylens_ai', additionalUsers?: number }
 * Returns: { url: string } — redirect to Stripe Checkout
 */
export async function POST(req: NextRequest) {
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
            .select('id, name, stripe_customer_id')
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
                metadata: { org_id: org.id, user_id: user.id },
            })
            customerId = customer.id

            // Save customer ID immediately
            await supabase
                .from('organisations')
                .update({ stripe_customer_id: customerId })
                .eq('id', org.id)
        }

        // Build line items
        // For additional_user plan: just the add-on price x1 (quantity can be extended later)
        const isAddon = plan === 'additional_user'
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
            { price: priceId, quantity: 1 },
        ]
        if (!isAddon && additionalUsers > 0 && PRICE_IDS.additional_user) {
            lineItems.push({
                price:    PRICE_IDS.additional_user,
                quantity: additionalUsers,
            })
        }

        const origin = req.headers.get('origin') ?? 'http://localhost:3001'

        const session = await stripe.checkout.sessions.create({
            customer:   customerId,
            mode:       'subscription',
            line_items: lineItems,
            metadata:   { org_id: org.id, plan },
            // ── Payment methods: SEPA-Lastschrift + Vorkasse (bank transfer) ──
            // customer_balance enables Stripe bank transfer (Vorkasse):
            // Stripe shows a virtual IBAN; when the transfer arrives Stripe
            // auto-matches it and fires checkout.session.completed — same as SEPA.
            payment_method_types: ['sepa_debit', 'customer_balance'],
            payment_method_options: {
                customer_balance: {
                    funding_type: 'bank_transfer',
                    bank_transfer: {
                        type: 'eu_bank_transfer',
                        eu_bank_transfer: { country: 'DE' },
                    },
                },
            },
            success_url: `${origin}/dashboard/settings#billing`,
            cancel_url:  `${origin}/dashboard/settings#billing`,
            allow_promotion_codes: true,
            billing_address_collection: 'required',
            locale: 'de',
        })

        return NextResponse.json({ url: session.url })
    } catch (err) {
        console.error('[stripe/checkout]', err)
        return NextResponse.json({ error: 'Stripe error' }, { status: 500 })
    }
}
