'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type OnboardingProgress = {
    id: string
    user_id: string
    org_id: string
    current_step: number     // 1=welcome, 2=upload, 3=first_analysis, 4=report
    completed_at: string | null
    last_seen_at: string
}

// ── Get or create the onboarding row for the current user ────────────────────

export async function getOrCreateOnboardingProgress(): Promise<OnboardingProgress | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Resolve org_id
    const { data: member } = await supabase
        .from('organisation_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single()

    if (!member?.org_id) return null

    // Try to fetch existing row
    const { data: existing } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('org_id', member.org_id)
        .single()

    if (existing) return existing as OnboardingProgress

    // Insert fresh row for this user
    const { data: created } = await supabase
        .from('onboarding_progress')
        .insert({ user_id: user.id, org_id: member.org_id, current_step: 1 })
        .select()
        .single()

    return (created ?? null) as OnboardingProgress | null
}

// ── Advance to the next step ─────────────────────────────────────────────────

export async function advanceOnboardingStep(newStep: number): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
        .from('onboarding_progress')
        .update({ current_step: newStep, last_seen_at: new Date().toISOString() })
        .eq('user_id', user.id)

    revalidatePath('/', 'layout')
}

// ── Mark onboarding as fully complete ───────────────────────────────────────

export async function completeOnboarding(): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
        .from('onboarding_progress')
        .update({
            completed_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

    revalidatePath('/', 'layout')
}

// ── Reset onboarding (restart tour) ────────────────────────────────────────

export async function resetOnboarding(): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: member } = await supabase
        .from('organisation_members').select('org_id').eq('user_id', user.id).single()
    if (!member?.org_id) return

    const admin = createAdminClient()
    await admin
        .from('onboarding_progress')
        .update({ current_step: 1, completed_at: null })
        .eq('user_id', user.id)
        .eq('org_id', member.org_id)

    revalidatePath('/', 'layout')
}
