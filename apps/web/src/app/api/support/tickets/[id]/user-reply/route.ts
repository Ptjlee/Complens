import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const svcClient = () =>
    createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

/**
 * POST /api/support/tickets/[id]/user-reply
 * Authenticated user sends a follow-up message on their own ticket.
 * Appends { role: 'user', text, at } to the messages[] array.
 * Reopens the ticket to 'open' so admin sees new activity.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { text, attachment_name, attachment_path } = await req.json()
    if (!text?.trim() && !attachment_name) {
        return NextResponse.json({ error: 'Nachricht darf nicht leer sein.' }, { status: 422 })
    }

    const svc = svcClient()

    // Verify the ticket belongs to this user
    const { data: ticket, error: fetchErr } = await svc
        .from('support_tickets')
        .select('id, user_id, messages, status')
        .eq('id', id)
        .single()

    if (fetchErr || !ticket) {
        return NextResponse.json({ error: 'Ticket nicht gefunden.' }, { status: 404 })
    }
    if (ticket.user_id !== user.id) {
        return new NextResponse('Forbidden', { status: 403 })
    }

    const existing = Array.isArray(ticket.messages) ? ticket.messages : []
    const newMessage: Record<string, unknown> = {
        role: 'user',
        text: text?.trim() || '(Anhang)',
        at:   new Date().toISOString(),
    }
    if (attachment_name) newMessage.attachment_name = attachment_name
    if (attachment_path) newMessage.attachment_path = attachment_path

    const newMessages = [...existing, newMessage]

    const { data, error } = await svc
        .from('support_tickets')
        .update({
            messages: newMessages,
            // Reopen so admin is notified of new user message
            status: ticket.status === 'resolved' || ticket.status === 'wont_fix'
                ? ticket.status  // don't reopen closed tickets
                : 'open',
        })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
