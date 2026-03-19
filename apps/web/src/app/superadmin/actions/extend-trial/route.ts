import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkSuperadminAccess } from '@/lib/api/superadminAuth'

// ─── Extend trial by 7 days ───────────────────────────────────

export async function GET(req: NextRequest) {
    const authErr = await checkSuperadminAccess(req)
    if (authErr) return authErr

    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const admin = createAdminClient()

    // Get org for this user
    const { data: member } = await admin
        .from('organisation_members')
        .select('org_id')
        .eq('user_id', userId)
        .single()

    if (!member) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Get current trial end
    const { data: org } = await admin
        .from('organisations')
        .select('trial_ends_at')
        .eq('id', member.org_id)
        .single()

    const currentEnd = org?.trial_ends_at ? new Date(org.trial_ends_at) : new Date()
    const newEnd = new Date(Math.max(currentEnd.getTime(), Date.now()) + 7 * 24 * 60 * 60 * 1000)

    await admin
        .from('organisations')
        .update({ trial_ends_at: newEnd.toISOString() })
        .eq('id', member.org_id)

    // Log event
    await admin.from('user_events').insert({
        user_id:    userId,
        event_type: 'trial_extended',
        metadata:   { extended_to: newEnd.toISOString(), by: 'admin' },
    })

    return NextResponse.redirect(new URL('/superadmin?msg=trial_extended', req.url))
}
