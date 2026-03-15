import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export const metadata: Metadata = {
    title: 'Einstellungen — CompLens',
    description: 'Organisation, Benutzerprofil und Abonnement verwalten.',
}

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: org } = await supabase
        .from('organisations')
        .select('id, name, slug, plan, trial_ends_at, subscription_ends_at, max_users, ai_enabled, country, created_at')
        .single()

    const { data: member } = await supabase
        .from('organisation_members')
        .select('role')
        .eq('user_id', user.id)
        .single()

    const { data: members } = await supabase
        .from('organisation_members')
        .select('id, user_id, role, joined_at')

    return (
        <SettingsClient
            user={user}
            org={org}
            role={member?.role ?? 'viewer'}
            memberCount={members?.length ?? 1}
        />
    )
}
