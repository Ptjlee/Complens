import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const BUCKET = 'support-attachments'

const svcClient = () =>
    createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

/**
 * PATCH /api/support/tickets/[id]
 * Admin: update ticket status, priority, admin_reply, etc.
 * - If append_message is provided, pushes { role, text, at } into the messages[] array.
 * - Auto-clears storage attachment when resolving / wont_fix.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params
    if (!id) return new NextResponse('Missing id', { status: 400 })

    const body    = await req.json()
    const allowed = [
        'status', 'priority', 'admin_reply', 'category',
        'ai_draft_reply', 'ai_summary',
        'attachment_path', 'attachment_name',
    ] as const
    const update: Record<string, unknown> = {}

    for (const key of allowed) {
        if (key in body) update[key] = body[key]
    }

    // Auto-set resolved_at when marking resolved / wont_fix
    if (body.status === 'resolved' || body.status === 'wont_fix') {
        update.resolved_at = new Date().toISOString()
    }

    // Append a message to the conversation thread
    if (body.append_message) {
        const svc = svcClient()
        const { data: cur } = await svc
            .from('support_tickets')
            .select('messages')
            .eq('id', id)
            .single()

        const existing = Array.isArray(cur?.messages) ? cur.messages : []
        update.messages = [
            ...existing,
            { role: body.append_message.role, text: body.append_message.text, at: new Date().toISOString() },
        ]
    }

    if (Object.keys(update).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update.' }, { status: 422 })
    }

    const svc = svcClient()

    // If closing ticket, delete attachment from storage to save space
    if (body.status === 'resolved' || body.status === 'wont_fix') {
        const { data: existing } = await svc
            .from('support_tickets')
            .select('attachment_path')
            .eq('id', id)
            .single()

        if (existing?.attachment_path) {
            await svc.storage.from(BUCKET).remove([existing.attachment_path])
            update.attachment_path = null
            update.attachment_name = null
        }
    }

    const { data, error } = await svc
        .from('support_tickets')
        .update(update)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
