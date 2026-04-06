import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import JoinClient from './JoinClient'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('metadata')
    return {
        title: t('joinTitle'),
        description: t('joinDescription'),
    }
}

export default async function JoinPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>
}) {
    const { token } = await searchParams

    if (!token) redirect('/login')

    const admin = createAdminClient()

    // Look up the invitation by token
    const { data: invitation } = await admin
        .from('pending_invitations')
        .select('id, org_id, email, role, expires_at, accepted_at')
        .eq('token', token)
        .single()

    // Invalid or not found
    if (!invitation) {
        return <JoinClient status="invalid" />
    }

    // Already accepted
    if (invitation.accepted_at) {
        return <JoinClient status="already_used" />
    }

    // Expired
    if (new Date(invitation.expires_at) < new Date()) {
        return <JoinClient status="expired" />
    }

    // Fetch invite org name
    const { data: org } = await admin
        .from('organisations')
        .select('name')
        .eq('id', invitation.org_id)
        .single()

    // Check if user is already logged in — if so, auto-join
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        // Check if already a member
        const { data: existing } = await admin
            .from('organisation_members')
            .select('id')
            .eq('org_id', invitation.org_id)
            .eq('user_id', user.id)
            .single()

        if (existing) {
            // Already a member — mark invite accepted and send to dashboard
            await admin
                .from('pending_invitations')
                .update({ accepted_at: new Date().toISOString() })
                .eq('id', invitation.id)
            redirect('/dashboard')
        }
    }

    const roleLabel = invitation.role === 'admin'
        ? 'HR-Administrator'
        : 'Lesezugriff (Mitarbeitervertretung)'

    return (
        <JoinClient
            status="valid"
            token={token}
            email={invitation.email}
            orgName={org?.name ?? 'Ihrem Unternehmen'}
            roleLabel={roleLabel}
            isLoggedIn={!!user}
            loggedInEmail={user?.email}
        />
    )
}
