import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkSuperadminAccess } from '@/lib/api/superadminAuth'

// Toggle job_architecture_enabled for an organisation

export async function POST(req: NextRequest) {
    const authErr = await checkSuperadminAccess(req)
    if (authErr) return authErr

    let body: { orgId?: string; enable?: boolean }
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { orgId, enable } = body
    if (!orgId || typeof enable !== 'boolean') {
        return NextResponse.json({ error: 'Missing orgId or enable' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { error } = await admin
        .from('organisations')
        .update({ job_architecture_enabled: enable })
        .eq('id', orgId)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log event
    await admin.from('user_events').insert({
        user_id:    orgId,
        event_type: enable ? 'job_architecture_enabled' : 'job_architecture_disabled',
        metadata:   { toggled_by: 'admin' },
    })

    return NextResponse.json({ success: true, job_architecture_enabled: enable })
}
