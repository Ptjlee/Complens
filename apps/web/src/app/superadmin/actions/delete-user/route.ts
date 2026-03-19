import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkSuperadminAccess } from '@/lib/api/superadminAuth'

export async function POST(req: NextRequest) {
    const authErr = await checkSuperadminAccess(req)
    if (authErr) return authErr

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const admin = createAdminClient()

    // 1. Remove from organisation_members
    await admin.from('organisation_members').delete().eq('user_id', userId)

    // 2. Remove any pending invitations sent by or to this user
    await admin.from('pending_invitations').delete().eq('invited_by', userId)

    // 3. Delete from Supabase Auth — this is the definitive removal
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) {
        console.error('[admin/delete-user] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}
