import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const serviceClient = () =>
    createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

/**
 * GET /api/support/tickets
 * Returns all tickets (admin, via service_role) or own tickets (user).
 * Admin is detected by query param ?admin=1 — callers must verify separately.
 */
export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const isAdmin = req.nextUrl.searchParams.get('admin') === '1'

    if (isAdmin) {
        // Admin: fetch all tickets via service role, newest first
        const { data, error } = await serviceClient()
            .from('support_tickets')
            .select('*')
            .order('created_at', { ascending: false })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    } else {
        // User: fetch own tickets only
        const { data, error } = await supabase
            .from('support_tickets')
            .select('id, subject, body, status, priority, created_at, admin_reply, attachment_name, attachment_path, user_category_hint, messages')
            .order('created_at', { ascending: false })
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
    }
}

/**
 * POST /api/support/tickets
 * Creates a new support ticket for the authenticated user.
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const body = await req.json()
    const { subject, body: ticketBody, user_category_hint, attachment_path, attachment_name } = body

    if (!subject?.trim() || !ticketBody?.trim()) {
        return NextResponse.json({ error: 'Betreff und Beschreibung sind erforderlich.' }, { status: 422 })
    }

    // Fetch org for denormalisation
    const { data: org } = await supabase
        .from('organisations')
        .select('id, name')
        .single()

    const payload = {
        user_id:            user.id,
        org_id:             org?.id ?? '',
        subject:            subject.trim(),
        body:               ticketBody.trim(),
        user_category_hint: user_category_hint ?? null,
        user_email:         user.email ?? '',
        org_name:           org?.name ?? '',
        status:             'open',
        priority:           'normal',
        attachment_path:    attachment_path  ?? null,
        attachment_name:    attachment_name  ?? null,
    }

    const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert(payload)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Trigger AI analysis asynchronously (fire-and-forget via fetch)
    // We don't await — user gets the ticket ID immediately
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
    fetch(`${baseUrl}/api/support/ai-analyze`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ticketId: ticket.id }),
    }).catch(() => { /* non-fatal */ })

    return NextResponse.json(ticket, { status: 201 })
}
