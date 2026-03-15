import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
})

const PRICE_IDS: Record<string, string | undefined> = {
    paylens:            process.env.STRIPE_PRICE_PAYLENS,
    paylens_ai:         process.env.STRIPE_PRICE_PAYLENS_AI,
    additional_user:    process.env.STRIPE_PRICE_ADDITIONAL_USER,
}

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

        const { plan, additionalUsers = 0 }: {
            plan: 'paylens' | 'paylens_ai'
            additionalUsers?: number
        } = await req.json()

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

        // Build line items — base plan + optional additional users
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
            { price: priceId, quantity: 1 },
        ]
        if (additionalUsers > 0 && PRICE_IDS.additional_user) {
            lineItems.push({
                price: PRICE_IDS.additional_user,
                quantity: additionalUsers,
            })
        }

        const origin = req.headers.get('origin') ?? 'http://localhost:3001'

        const session = await stripe.checkout.sessions.create({
            customer:   customerId,
            mode:       'subscription',
            line_items: lineItems,
            metadata:   { org_id: org.id, plan },
            success_url: `${origin}/dashboard/settings?tab=plan&success=1`,
            cancel_url:  `${origin}/dashboard/settings?tab=plan&cancelled=1`,
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
