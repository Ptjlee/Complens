import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2026-02-25.clover',
})

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session for the authenticated user's org.
 * Returns: { url: string } — redirect to Stripe-hosted billing portal.
 *
 * Requirements:
 *  - Organisation must have a stripe_customer_id (i.e. they have paid at least once)
 *  - The Stripe Customer Portal must be configured in the Stripe dashboard:
 *    https://dashboard.stripe.com/settings/billing/portal
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Resolve the org (and its Stripe customer ID) for this user
        const { data: member } = await supabase
            .from('organisation_members')
            .select('org_id')
            .eq('user_id', user.id)
            .single()

        if (!member?.org_id) {
            return NextResponse.json({ error: 'Organisation nicht gefunden.' }, { status: 404 })
        }

        const { data: org } = await supabase
            .from('organisations')
            .select('stripe_customer_id, plan')
            .eq('id', member.org_id)
            .single()

        if (!org?.stripe_customer_id) {
            return NextResponse.json(
                { error: 'Kein aktives Abonnement gefunden. Bitte zuerst ein Abo abschließen.' },
                { status: 400 }
            )
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://complens.de'

        // Create a Stripe Billing Portal session
        const session = await stripe.billingPortal.sessions.create({
            customer:   org.stripe_customer_id,
            return_url: `${siteUrl}/dashboard/settings?tab=billing`,
        })

        return NextResponse.json({ url: session.url })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[stripe/portal]', msg)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
