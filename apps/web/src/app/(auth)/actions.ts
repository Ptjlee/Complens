'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: 'E-Mail oder Passwort ungültig. Bitte prüfen Sie Ihre Eingaben.' }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const admin    = createAdminClient()

    const email           = formData.get('email') as string
    const password        = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const companyName     = (formData.get('companyName') as string).trim()

    if (password !== confirmPassword) {
        return { error: 'Die Passwörter stimmen nicht überein.' }
    }

    if (password.length < 8) {
        return { error: 'Das Passwort muss mindestens 8 Zeichen lang sein.' }
    }

    if (!companyName) {
        return { error: 'Bitte geben Sie den Unternehmensnamen an.' }
    }

    // ── 1. Create auth user ──────────────────────────────────────
    const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { company_name: companyName },
            emailRedirectTo: `${getURL()}auth/confirm`,
        },
    })

    if (authErr) {
        if (authErr.message.includes('already registered')) {
            return { error: 'Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an.' }
        }
        return { error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.' }
    }

    const userId = authData.user?.id
    if (!userId) {
        return { error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.' }
    }

    // ── 2. Create organisation (service role — bypasses RLS) ─────
    const slug        = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: org, error: orgErr } = await admin
        .from('organisations')
        .insert({
            name:           companyName,
            slug:           `${slug}-${userId.slice(0, 8)}`, // ensure uniqueness
            plan:           'trial',
            trial_ends_at:  trialEndsAt,
            ai_enabled:     true,  // full AI access during trial
            country:        'DE',
            max_users:      3,     // allow small team during trial
        })
        .select('id')
        .single()

    if (orgErr || !org) {
        console.error('[signup] org creation failed:', orgErr)
        // Auth user was created — clean up is hard. Log and return error.
        return { error: 'Konto wurde angelegt, aber die Organisation konnte nicht erstellt werden. Bitte kontaktieren Sie den Support.' }
    }

    // ── 3. Add user as admin member ──────────────────────────────
    const { error: memberErr } = await admin
        .from('organisation_members')
        .insert({
            org_id:  org.id,
            user_id: userId,
            role:    'admin',
        })

    if (memberErr) {
        console.error('[signup] member insert failed:', memberErr)
        return { error: 'Mitgliedschaft konnte nicht angelegt werden. Bitte kontaktieren Sie den Support.' }
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

export async function resendVerification(email: string) {
    if (!email || !email.includes('@')) {
        return { error: 'Ungültige E-Mail-Adresse.' }
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
        return { error: 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.' }
    }

    return { success: true }
}

