import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkSuperadminAccess } from '@/lib/api/superadminAuth'

// ─── Activate license for a user's org ───────────────────────

export async function GET(req: NextRequest) {
    const authErr = await checkSuperadminAccess(req)
    if (authErr) return authErr

    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const admin = createAdminClient()

    const { data: member } = await admin
        .from('organisation_members')
        .select('org_id')
        .eq('user_id', userId)
        .single()

    if (!member) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Activate: set plan = licensed, ai_enabled = true, max_users = 2, subscription for 1 year
    // IMPORTANT: also clear trial_ends_at so trial banners and countdown disappear immediately
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    await admin
        .from('organisations')
        .update({
            plan:                 'licensed',
            ai_enabled:           true,
            max_users:            2,
            subscription_ends_at: oneYearFromNow,
            trial_ends_at:        null,   // ← clear so trial UI disappears for the user
        })
        .eq('id', member.org_id)

    // Log event
    await admin.from('user_events').insert({
        user_id:    userId,
        event_type: 'license_activated',
        metadata:   { activated_by: 'admin', ends_at: oneYearFromNow },
    })

    return NextResponse.redirect(new URL('/superadmin?msg=license_activated', req.url))
}
