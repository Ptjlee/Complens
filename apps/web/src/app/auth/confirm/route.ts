import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { getTranslations } from 'next-intl/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type')
    const next = searchParams.get('next') ?? '/dashboard'

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
    }

    // Password recovery flow — redirect to the reset-password page with the code
    if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password?code=${code}`)
    }

    // Exchange the email-link code for a session
    const supabase = await createClient()
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError || !sessionData.user) {
        return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
    }

    const t = await getTranslations('auth')
    const user = sessionData.user
    const companyName   = (user.user_metadata?.company_name as string | undefined) ?? t('defaultOrgName')
    const fullName      = (user.user_metadata?.full_name as string | undefined) ?? null
    const preferredLang = (user.user_metadata?.preferred_language as string | undefined) === 'en' ? 'en' : 'de'

    // Use the admin client (service role) to provision the tenant —
    // RLS cannot apply here because the org row doesn't exist yet.
    const admin = createAdminClient()

    // Idempotent: only create if no org exists for this user yet
    const { data: existingMember } = await admin
        .from('organisation_members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (!existingMember) {
        // 1. Generate a URL-safe slug from the company name
        const slug = companyName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 50)
        const uniqueSlug = `${slug}-${Date.now()}`

        // 2. Create the organisation (trial plan, 14 days)
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + 14)

        const { data: org, error: orgError } = await admin
            .from('organisations')
            .insert({
                name: companyName,
                slug: uniqueSlug,
                plan: 'trial',
                trial_ends_at: trialEndsAt.toISOString(),
                ai_enabled: true,
                country: 'DE',
                max_users: 2,
            })
            .select('id')
            .single()

        if (orgError || !org) {
            console.error('[auth/confirm] Failed to create organisation:', orgError)
            // Allow the user through anyway — they can still log in
        } else {
            // 3. Add the user as admin of their new org
            await admin.from('organisation_members').insert({
                org_id: org.id,
                user_id: user.id,
                role: 'admin',
                full_name: fullName,
                preferred_language: preferredLang,
            })

            // 4. Seed onboarding progress at step 1
            await admin.from('onboarding_progress').insert({
                user_id: user.id,
                org_id: org.id,
                current_step: 1,
            })
        }
    }

    return NextResponse.redirect(`${origin}${next}`)
}
