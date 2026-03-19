import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkSuperadminAccess } from '@/lib/api/superadminAuth'

// ─── Suspend / ban a user's account ──────────────────────────
// This disables the Supabase Auth user (they cannot log in)
// and logs the event. Does NOT delete data.

export async function GET(req: NextRequest) {
    const authErr = await checkSuperadminAccess(req)
    if (authErr) return authErr

    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const admin = createAdminClient()

    // Ban the user in Supabase Auth (they can no longer sign in)
    await admin.auth.admin.updateUserById(userId, { ban_duration: '876600h' }) // 100 years

    try {
        await admin.from('user_events').insert({
            user_id:    userId,
            event_type: 'account_suspended',
            metadata:   { suspended_by: 'admin' },
        })
    } catch { /* non-critical */ }

    return NextResponse.redirect(new URL('/superadmin?msg=suspended', req.url))
}
