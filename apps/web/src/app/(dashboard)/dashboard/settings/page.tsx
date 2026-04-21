import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('metadata')
    return {
        title: t('settingsTitle'),
        description: t('settingsDescription'),
    }
}

// Never cache this page — plan/subscription changes must be reflected immediately
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const supabase    = await createClient()
    const adminClient = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // ── Step 1: Resolve current user's org_id via their membership row ──
    // Use admin client to avoid RLS edge cases that can return the wrong row
    const { data: member } = await adminClient
        .from('organisation_members')
        .select('org_id, role, full_name, job_title')
        .eq('user_id', user.id)
        .single()

    if (!member) redirect('/login')
    if (member.role !== 'admin') redirect('/dashboard')

    const callerRole = member.role ?? 'viewer'

    // ── Step 2: Fetch the org by its known ID (bypasses RLS caching issues) ──
    const { data: org } = await adminClient
        .from('organisations')
        .select('id, name, slug, plan, trial_ends_at, subscription_ends_at, max_users, ai_enabled, job_architecture_enabled, country, created_at, legal_representative, legal_address, legal_city, legal_zip, vat_id, pay_criteria_text')
        .eq('id', member.org_id)
        .single()

    // ── Step 3: Fetch all members for this org ──
    const { data: rawMembers } = await adminClient
        .from('organisation_members')
        .select('id, user_id, role, joined_at, full_name, job_title')
        .eq('org_id', member.org_id)
        .order('joined_at', { ascending: true })

    // ── Step 4: Pending invitations (admin only) ──
    const { data: pendingInvites } = callerRole === 'admin'
        ? await adminClient
            .from('pending_invitations')
            .select('id, email, role, expires_at, created_at')
            .eq('org_id', member.org_id)
            .is('accepted_at', null)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
        : { data: [] }

    // ── Step 5: Enrich members with auth emails ──
    let enrichedMembers: Array<{
        id: string; user_id: string; email: string; role: string; joined_at: string; isMe: boolean; fullName: string; jobTitle: string
    }> = []

    if (rawMembers?.length) {
        const { data: usersData } = await adminClient.auth.admin.listUsers()
        const userMap = Object.fromEntries((usersData?.users ?? []).map(u => [u.id, u.email ?? '']))
        enrichedMembers = rawMembers.map(m => ({
            ...m,
            email:    userMap[m.user_id] ?? '—',
            isMe:     m.user_id === user.id,
            fullName: m.full_name ?? '',
            jobTitle: m.job_title ?? '',
        }))
    }

    const usedSeats = (rawMembers?.length ?? 0) + (pendingInvites?.length ?? 0)

    const teamData = {
        members:        enrichedMembers,
        pendingInvites: pendingInvites ?? [],
        maxUsers:       org?.max_users ?? 2,
        plan:           org?.plan ?? 'trial',
        callerRole,
        usedSeats,
    }

    return (
        <SettingsClient
            user={user}
            org={org}
            role={callerRole}
            memberCount={rawMembers?.length ?? 1}
            teamData={teamData}
            profileData={{
                fullName: member.full_name ?? '',
                jobTitle: member.job_title ?? '',
            }}
            legalData={{
                legal_representative: org?.legal_representative ?? '',
                legal_address:        org?.legal_address        ?? '',
                legal_city:           org?.legal_city           ?? '',
                legal_zip:            org?.legal_zip            ?? '',
                vat_id:               org?.vat_id               ?? '',
                country:              org?.country              ?? '',
            }}
            payCriteriaText={org?.pay_criteria_text ?? ''}
        />
    )
}
