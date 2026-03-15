import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2026-02-25.clover',
})

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events to keep org plan in sync.
 *
 * Events handled:
 *   checkout.session.completed        → activate subscribed plan
 *   customer.subscription.updated     → update plan (upgrades / renewals)
 *   customer.subscription.deleted     → downgrade to 'free'
 */
export async function POST(req: NextRequest) {
    const body      = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!,
        )
    } catch (err) {
        console.error('[stripe/webhook] Signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // ── Map Stripe product/price → CompLens plan ──────────────────────────────

    async function planFromSubscription(sub: Stripe.Subscription): Promise<'paylens' | 'paylens_ai' | null> {
        for (const item of sub.items.data) {
            const priceId = item.price.id
            if (priceId === process.env.STRIPE_PRICE_PAYLENS)    return 'paylens'
            if (priceId === process.env.STRIPE_PRICE_PAYLENS_AI) return 'paylens_ai'
        }
        return null
    }

    // ── Handle events ──────────────────────────────────────────────────────────

    try {
        switch (event.type) {

            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                if (session.mode !== 'subscription') break

                const orgId = session.metadata?.org_id
                const plan  = session.metadata?.plan as 'paylens' | 'paylens_ai' | undefined
                if (!orgId || !plan) break

                const sub = await stripe.subscriptions.retrieve(session.subscription as string)

                await supabase.from('organisations').update({
                    plan,
                    stripe_customer_id:     session.customer as string,
                    stripe_subscription_id: sub.id,
                    subscription_ends_at:   new Date((sub as any).current_period_end * 1000).toISOString(),
                    ai_enabled:             plan === 'paylens_ai',
                    trial_ends_at:          null,   // Clear trial once paid
                }).eq('id', orgId)

                console.log(`[stripe/webhook] org ${orgId} → plan: ${plan}`)
                break
            }

            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription
                const plan = await planFromSubscription(sub)
                if (!plan) break

                // Find org by stripe_customer_id
                const { data: org } = await supabase
                    .from('organisations')
                    .select('id')
                    .eq('stripe_customer_id', sub.customer as string)
                    .single()
                if (!org) break

                await supabase.from('organisations').update({
                    plan,
                    stripe_subscription_id: sub.id,
                    subscription_ends_at:   new Date((sub as any).current_period_end * 1000).toISOString(),
                    ai_enabled:             plan === 'paylens_ai',
                }).eq('id', org.id)

                console.log(`[stripe/webhook] sub updated → org ${org.id} plan: ${plan}`)
                break
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription

                const { data: org } = await supabase
                    .from('organisations')
                    .select('id')
                    .eq('stripe_customer_id', sub.customer as string)
                    .single()
                if (!org) break

                await supabase.from('organisations').update({
                    plan:                   'free',
                    stripe_subscription_id: null,
                    subscription_ends_at:   null,
                    ai_enabled:             false,
                }).eq('id', org.id)

                console.log(`[stripe/webhook] sub cancelled → org ${org.id} downgraded to free`)
                break
            }

            default:
                // Ignore other events
                break
        }
    } catch (err) {
        console.error('[stripe/webhook] Handler error:', err)
        return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}
