'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTranslations } from 'next-intl/server'

export async function login(formData: FormData) {
    const supabase = await createClient()
    const t = await getTranslations('auth')

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: t('errorInvalidCredentials') }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const admin    = createAdminClient()
    const t = await getTranslations('auth')

    const email           = formData.get('email') as string
    const password        = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const companyName     = (formData.get('companyName') as string).trim()
    const firstName       = (formData.get('firstName') as string | null) || ''
    const lastName        = (formData.get('lastName') as string | null) || ''

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

    // Read preferred language from cookie (set by LanguageSwitcher)
    const cookieStore = await cookies()
    const preferredLang = cookieStore.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'de'

    if (password !== confirmPassword) {
        return { error: t('errorPasswordMismatch') }
    }

    if (password.length < 8) {
        return { error: t('errorPasswordTooShort') }
    }

    if (!companyName) {
        return { error: t('errorCompanyNameRequired') }
    }

    // ── 1. Create auth user ──────────────────────────────────────
    const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                company_name: companyName,
                full_name: fullName || undefined,
                preferred_language: preferredLang,
            },
            emailRedirectTo: `${getURL()}auth/confirm`,
        },
    })

    if (authErr) {
        if (authErr.message.includes('already registered')) {
            return { error: t('errorAlreadyRegistered') }
        }
        return { error: t('errorSignupFailed') }
    }

    // Supabase returns a fake user with empty identities[] for duplicate emails
    // (email enumeration protection). Detect this and show a helpful message.
    const userId = authData.user?.id
    if (!userId || (authData.user?.identities?.length ?? 0) === 0) {
        return { error: t('errorAlreadyRegistered') }
    }

    // ── 2. Create organisation (service role — bypasses RLS) ─────
    const slug        = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

    const { data: org, error: orgErr } = await admin
        .from('organisations')
        .insert({
            name:           companyName,
            slug:           `${slug}-${userId.slice(0, 8)}`, // ensure uniqueness
            plan:           'trial',
            trial_ends_at:  trialEndsAt,
            ai_enabled:     true,  // full AI access during trial
            country:        'DE',
            max_users:      2,     // limit to 2 users even during trial
        })
        .select('id')
        .single()

    if (orgErr || !org) {
        console.error('[signup] org creation failed:', orgErr)
        return { error: t('errorOrgCreationFailed') }
    }

    // ── 3. Add user as admin member ──────────────────────────────
    const { error: memberErr } = await admin
        .from('organisation_members')
        .insert({
            org_id:             org.id,
            user_id:            userId,
            role:               'admin',
            full_name:          fullName || null,
            preferred_language: preferredLang,
        })

    if (memberErr) {
        console.error('[signup] member insert failed:', memberErr)
        return { error: t('errorMemberCreationFailed') }
    }

    // ── 4. Initialise onboarding progress ────────────────────────
    await admin
        .from('onboarding_progress')
        .insert({
            user_id:      userId,
            org_id:       org.id,
            current_step: 1,
        })
        .then(({ error: e }) => {
            if (e) console.error('[signup] onboarding insert failed (non-fatal):', e)
        })

    redirect(`/signup/check-email?email=${encodeURIComponent(email)}`)
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

const getURL = () => {
    // Force the correct live domain in production so Supabase doesn't reject the emailRedirectTo
    // due to Vercel's internal .vercel.app URLs not matching the allowlist.
    if (process.env.NODE_ENV === 'production') {
        return 'https://complens.de/'
    }

    let url =
        process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
        process?.env?.NEXT_PUBLIC_APP_URL ?? // Fallback to APP_URL
        process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
        'http://localhost:3001'

    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`
    // Make sure to include a trailing `/`.
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
    return url
}

export async function sendPasswordResetEmail(email: string) {
    const t = await getTranslations('auth')

    if (!email || !email.includes('@')) {
        return { error: t('errorInvalidEmail') }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getURL()}auth/confirm?next=/reset-password`,
    })

    if (error) {
        return { error: t('errorEmailSendFailed') }
    }

    return { success: true }
}

export async function resendVerification(email: string) {
    const t = await getTranslations('auth')

    if (!email || !email.includes('@')) {
        return { error: t('errorInvalidEmail') }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
            emailRedirectTo: `${getURL()}auth/confirm`,
        },
    })

    if (error) {
        return { error: t('errorEmailSendFailed') }
    }

    return { success: true }
}
