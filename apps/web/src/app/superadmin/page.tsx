import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminClient from './AdminClient'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('metadata')
    return {
        title: t('superadminTitle'),
        robots: 'noindex, nofollow',
    }
}

// Access is gated by proxy.ts (SUPERADMIN_EMAILS env var).
// No additional check needed here.

// ─── Data types ───────────────────────────────────────────────

export type AdminUser = {
    id:              string
    email:           string
    created_at:      string
    last_sign_in_at: string | null
    org_id:          string | null
    org_name:        string | null
    plan:            string | null
    trial_ends_at:   string | null
    max_users:       number | null
    dataset_count:   number
    analysis_count:  number
    last_active:     string | null
    member_role:     string | null
}

export type AdminStats = {
    total_users:     number
    trial_users:     number
    licensed_users:  number
    never_activated: number  // 0 uploads
    trial_expiring:  number  // expires in <48h
    monthly_signups: number  // this month
}

export type AdminLead = {
    id:           string
    first_name:   string
    last_name:    string
    email:        string
    company_name: string
    company_size: string
    hris:         string
    urgency:      string
    created_at:   string
}

export type GAStats = {
    activeUsers: number
    sessions: number
}

// ─── Data fetching ────────────────────────────────────────────

async function loadAdminData(): Promise<{ users: AdminUser[]; stats: AdminStats; leads: AdminLead[]; gaStats: GAStats | null }> {
    const admin = createAdminClient()

    // Fetch all Supabase auth users
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const authUsers = authData?.users ?? []

    // Fetch all orgs
    const { data: orgs } = await admin
        .from('organisations')
        .select('id, name, plan, trial_ends_at, max_users, created_at')

    // Fetch all org members
    const { data: members } = await admin
        .from('organisation_members')
        .select('user_id, org_id, role, joined_at')

    // Fetch dataset counts per org (exclude soft-deleted)
    const { data: datasets } = await admin
        .from('datasets')
        .select('org_id, created_at')
        .is('deleted_at', null)

    // Fetch analysis counts per org
    const { data: analyses } = await admin
        .from('analyses')
        .select('org_id, created_at')

    // Build lookup maps
    const orgMap    = Object.fromEntries((orgs ?? []).map(o => [o.id, o]))
    const memberMap = Object.fromEntries((members ?? []).map(m => [m.user_id, m]))

    // Dataset count per org
    const datasetCountByOrg: Record<string, number> = {}
    for (const d of (datasets ?? [])) {
        datasetCountByOrg[d.org_id] = (datasetCountByOrg[d.org_id] ?? 0) + 1
    }
    // Latest dataset date per org
    const lastDatasetByOrg: Record<string, string> = {}
    for (const d of (datasets ?? [])) {
        if (!lastDatasetByOrg[d.org_id] || d.created_at > lastDatasetByOrg[d.org_id]) {
            lastDatasetByOrg[d.org_id] = d.created_at
        }
    }

    // Analysis count per org
    const analysisCountByOrg: Record<string, number> = {}
    for (const a of (analyses ?? [])) {
        analysisCountByOrg[a.org_id] = (analysisCountByOrg[a.org_id] ?? 0) + 1
    }

    const now = new Date()
    const users: AdminUser[] = authUsers.map(u => {
        const member  = memberMap[u.id]
        const org     = member ? orgMap[member.org_id] : null

        return {
            id:              u.id,
            email:           u.email ?? '—',
            created_at:      u.created_at,
            last_sign_in_at: u.last_sign_in_at ?? null,
            org_id:          org?.id ?? null,
            org_name:        org?.name ?? null,
            plan:            org?.plan ?? null,
            trial_ends_at:   org?.trial_ends_at ?? null,
            max_users:       org?.max_users ?? null,
            dataset_count:   org ? (datasetCountByOrg[org.id] ?? 0) : 0,
            analysis_count:  org ? (analysisCountByOrg[org.id] ?? 0) : 0,
            last_active:     org ? (lastDatasetByOrg[org.id] ?? u.last_sign_in_at ?? null) : (u.last_sign_in_at ?? null),
            member_role:     member?.role ?? null,
        }
    })

    // Sort: most recent signups first
    users.sort((a, b) => b.created_at.localeCompare(a.created_at))

    // Stats
    const in48h     = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const stats: AdminStats = {
        total_users:     users.length,
        trial_users:     users.filter(u => u.plan === 'trial' || u.plan === 'free').length,
        licensed_users:  users.filter(u => u.plan === 'licensed' || u.plan === 'paylens' || u.plan === 'paylens_ai').length,
        never_activated: users.filter(u => u.dataset_count === 0).length,
        trial_expiring:  users.filter(u =>
            (u.plan === 'trial' || u.plan === 'free') &&
            u.trial_ends_at &&
            u.trial_ends_at <= in48h &&
            u.trial_ends_at >= now.toISOString()
        ).length,
        monthly_signups: users.filter(u => u.created_at >= thisMonth).length,
    }

    let leads: AdminLead[] = []
    try {
        const { data, error } = await admin.from('leads').select('*').order('created_at', { ascending: false })
        if (data && !error) {
            leads = data as AdminLead[]
        }
    } catch (e) {
        // Migration might not be applied yet
    }

    let gaStats: GAStats | null = null
    try {
        const { GA_PROPERTY_ID, GA_CLIENT_EMAIL, GA_PRIVATE_KEY } = process.env
        if (GA_PROPERTY_ID && GA_CLIENT_EMAIL && GA_PRIVATE_KEY) {
            const client = new BetaAnalyticsDataClient({
                credentials: {
                    client_email: GA_CLIENT_EMAIL,
                    private_key: GA_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }
            })
            
            const [response] = await client.runReport({
                 property: `properties/${GA_PROPERTY_ID}`,
                 dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
                 metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
            })
            
            const row = response.rows?.[0]
            if (row && row.metricValues) {
                 gaStats = {
                     activeUsers: parseInt(row.metricValues[0].value || '0', 10),
                     sessions: parseInt(row.metricValues[1].value || '0', 10),
                 }
            } else {
                 gaStats = { activeUsers: 0, sessions: 0 }
            }
        }
    } catch (e) {
        console.error("GA4 Fetch Error:", e)
    }

    return { users, stats, leads, gaStats }
}

// ─── Page ─────────────────────────────────────────────────────

export default async function AdminPage() {
    const { users, stats, leads, gaStats } = await loadAdminData()
    return <AdminClient users={users} stats={stats} leads={leads} gaStats={gaStats} />
}
