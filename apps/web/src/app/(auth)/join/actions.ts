'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function acceptInvitation(
    token: string,
    formData: FormData,
): Promise<{ error?: string }> {
    const email    = (formData.get('email')    as string).trim().toLowerCase()
    const password = (formData.get('password') as string)

    if (!email || !password) return { error: 'E-Mail und Passwort erforderlich.' }
    if (password.length < 8)  return { error: 'Passwort muss mindestens 8 Zeichen lang sein.' }

    const admin = createAdminClient()

    // Re-validate invitation (race condition safety)
    const { data: invitation } = await admin
        .from('pending_invitations')
        .select('id, org_id, email, role, expires_at, accepted_at, full_name, job_title')
        .eq('token', token)
        .single()

    if (!invitation)                            return { error: 'Ungültige Einladung.' }
    if (invitation.accepted_at)                 return { error: 'Diese Einladung wurde bereits verwendet.' }
    if (new Date(invitation.expires_at) < new Date()) return { error: 'Die Einladung ist abgelaufen.' }
    if (invitation.email !== email)             return { error: 'Die E-Mail-Adresse stimmt nicht mit der Einladung überein.' }

    // Check if user already exists in Supabase Auth
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email)

    let userId: string

    if (existingUser) {
        // User already exists — just add them to the org
        userId = existingUser.id
    } else {
        // Create new Supabase Auth user
        const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm since they clicked a valid invite link
        })
        if (createErr || !newUser.user) {
            return { error: 'Konto konnte nicht erstellt werden: ' + createErr?.message }
        }
        userId = newUser.user.id
    }

    // Check seat limit before inserting
    const { data: org } = await admin
        .from('organisations')
        .select('max_users')
        .eq('id', invitation.org_id)
        .single()

    const { count: memberCount } = await admin
        .from('organisation_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', invitation.org_id)

    if ((memberCount ?? 0) >= (org?.max_users ?? 2)) {
        return { error: 'Alle Nutzerplätze dieser Organisation sind belegt. Bitte kontaktieren Sie den Administrator.' }
    }

    // Add to organisation_members (upsert with profile fields from invitation)
    const { error: memberErr } = await admin
        .from('organisation_members')
        .upsert(
            {
                org_id:     invitation.org_id,
                user_id:    userId,
                role:       invitation.role,
                invited_by: null,
                full_name:  invitation.full_name ?? null,
                job_title:  invitation.job_title ?? null,
            },
            { onConflict: 'org_id,user_id' },
        )

    if (memberErr) {
        return { error: 'Mitgliedschaft konnte nicht erstellt werden: ' + memberErr.message }
    }

    // Mark invitation as accepted
    await admin
        .from('pending_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

    // Log join event
    await admin
        .from('user_events')
        .insert({
            user_id:    userId,
            event_type: 'invitation_accepted',
            metadata: {
                org_id:     invitation.org_id,
                role:       invitation.role,
            },
        })

    // If user already existed, sign them in and redirect
    // If new user, sign them in with their new credentials
    const supabase = await createClient()
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    if (signInErr) {
        // They can always log in manually
        redirect('/login?joined=1')
    }

    redirect('/dashboard')
}
