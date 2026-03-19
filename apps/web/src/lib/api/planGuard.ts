import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Verify the authenticated user's org has a plan that includes AI features.
 * Returns { userId, orgId } on success or { error: NextResponse } on failure.
 */
export async function requireAiPlan(): Promise<
    { userId: string; orgId: string } | { error: NextResponse }
> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return {
            error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        }
    }

    const { data: org } = await supabase
        .from('organisations')
        .select('id, plan, ai_enabled, trial_ends_at')
        .single()

    if (!org) {
        return {
            error: NextResponse.json({ error: 'Organisation not found' }, { status: 404 }),
        }
    }

    // Allow: paylens_ai plan, OR active trial (trial_ends_at in the future)
    const onTrial =
        org.plan === 'trial' &&
        org.trial_ends_at != null &&
        new Date(org.trial_ends_at) > new Date()

    if (!org.ai_enabled && !onTrial) {
        return {
            error: NextResponse.json(
                { error: 'AI features require the PayLens AI plan. Upgrade to access this feature.' },
                { status: 403 }
            ),
        }
    }

    return { userId: user.id, orgId: org.id }
}

/**
 * Verify the authenticated user's org is on an active paid or trial plan
 * (i.e. not expired free plan with limits).
 */
export async function requireActivePlan(): Promise<
    { userId: string; orgId: string; plan: string } | { error: NextResponse }
> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return {
            error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        }
    }

    const { data: org } = await supabase
        .from('organisations')
        .select('id, plan, trial_ends_at, subscription_ends_at')
        .single()

    if (!org) {
        return {
            error: NextResponse.json({ error: 'Organisation not found' }, { status: 404 }),
        }
    }

    // Expired trial
    if (
        org.plan === 'trial' &&
        org.trial_ends_at != null &&
        new Date(org.trial_ends_at) <= new Date()
    ) {
        return {
            error: NextResponse.json(
                { error: 'Trial expired. Please upgrade your plan to continue.' },
                { status: 402 }
            ),
        }
    }

    return { userId: user.id, orgId: org.id, plan: org.plan }
}

/**
 * Verify the authenticated user is an admin of their organisation.
 * Viewers / works-council members must NOT be able to mutate data.
 * Returns { userId, orgId, role } on success or { error: NextResponse } on failure.
 *
 * Use this on every server action / API route that writes data:
 *   - runDatasetAnalysis, deleteDataset, renameDataset
 *   - saveExplanation, updateExplanationStatus
 *   - savePayOverride, deletePayOverride
 *   - runRemediation, savePlan steps, …
 */
export async function requireAdminRole(): Promise<
    { userId: string; orgId: string; role: string } | { error: NextResponse }
> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }

    // Fetch the caller's membership role
    const { data: member } = await supabase
        .from('organisation_members')
        .select('role, org_id')
        .eq('user_id', user.id)
        .single()

    if (!member) {
        return { error: NextResponse.json({ error: 'Organisation nicht gefunden.' }, { status: 404 }) }
    }

    if (member.role !== 'admin') {
        return {
            error: NextResponse.json(
                { error: 'Nur Administratoren können diese Aktion ausführen. Lesezugriff hat keine Schreibrechte.' },
                { status: 403 }
            ),
        }
    }

    return { userId: user.id, orgId: member.org_id, role: member.role }
}

/**
 * Server-action variant — same check but returns a plain error string
 * (for use inside 'use server' functions that return { error?: string }).
 *
 * Uses the admin client for the member lookup so RLS can never silently
 * return null and accidentally let a viewer through.
 */
export async function requireAdminRoleAction(): Promise<
    { userId: string; orgId: string } | { error: string }
> {
    // Auth: identity always comes from the authenticated session
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    // Role lookup: use admin client so RLS never hides the row
    const admin = createAdminClient()
    const { data: member } = await admin
        .from('organisation_members')
        .select('role, org_id')
        .eq('user_id', user.id)
        .single()

    if (!member) return { error: 'Mitgliedschaft nicht gefunden.' }

    if (member.role !== 'admin') {
        return { error: 'Nur Administratoren können diese Aktion ausführen. (Lesezugriff)' }
    }

    return { userId: user.id, orgId: member.org_id }
}

