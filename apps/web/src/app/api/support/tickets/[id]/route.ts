import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const BUCKET = 'support-attachments'

const svcClient = () =>
    createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

// ─── Minimal branded HTML email for support replies ──────────
function buildReplyHtml(body: string, ticketSubject: string): string {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://complens.de'
    const bodyHtml = body
        .split('\n')
        .map(line =>
            line.trim()
                ? `<p style="margin:0 0 16px;line-height:1.7;font-size:15px;color:#1e293b;">${line}</p>`
                : `<p style="margin:0 0 8px;">&nbsp;</p>`
        )
        .join('')

    return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><title>CompLens Support</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">
        <tr><td style="background:linear-gradient(90deg,#4f46e5,#7c3aed);height:4px;border-radius:8px 8px 0 0;"></td></tr>
        <tr>
          <td style="background:#ffffff;padding:40px 44px 32px;">
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#4f46e5;border-radius:8px;padding:6px 12px;">
                  <span style="font-size:14px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Comp</span><span style="font-size:14px;font-weight:800;color:#a5b4fc;letter-spacing:-0.3px;">Lens</span>
                </td>
                <td style="padding-left:10px;vertical-align:middle;">
                  <span style="font-size:11px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;">Support</span>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 16px;font-size:13px;color:#64748b;">Betreff: <strong>${ticketSubject}</strong></p>
            <div style="color:#1e293b;">${bodyHtml}</div>
            <div style="height:1px;background:#e2e8f0;margin:24px 0;"></div>
            <p style="margin:0;font-size:14px;color:#475569;">Mit freundlichen Grüßen,<br><strong style="color:#1e293b;">CompLens Support</strong></p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 44px;border-top:1px solid #e2e8f0;">
            <a href="${siteUrl}/dashboard/help" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:11px 24px;border-radius:8px;">Ticket ansehen →</a>
          </td>
        </tr>
        <tr>
          <td style="background:#f1f5f9;padding:16px 44px;border-radius:0 0 8px 8px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">CompLens by DexterBee · EU-Entgelttransparenz-Plattform · <a href="mailto:hallo@complens.de" style="color:#94a3b8;text-decoration:none;">hallo@complens.de</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * PATCH /api/support/tickets/[id]
 * Admin: update ticket status, priority, admin_reply, etc.
 * - If append_message is provided, pushes { role, text, at } into the messages[] array.
 * - Auto-clears storage attachment when resolving / wont_fix.
 * - If role === 'admin', sends a Resend email notification to the user.
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
    let ticketUserEmail: string | null = null
    let ticketSubject: string | null = null

    if (body.append_message) {
        const svc = svcClient()
        const { data: cur } = await svc
            .from('support_tickets')
            .select('messages, user_email, subject')
            .eq('id', id)
            .single()

        const existing = Array.isArray(cur?.messages) ? cur.messages : []
        update.messages = [
            ...existing,
            { role: body.append_message.role, text: body.append_message.text, at: new Date().toISOString() },
        ]

        // Capture for email send below
        ticketUserEmail = cur?.user_email ?? null
        ticketSubject   = cur?.subject ?? null
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

    // ── Send email if admin just posted a reply ─────────────────
    const isAdminReply = body.append_message?.role === 'admin' && body.append_message?.text
    if (isAdminReply && ticketUserEmail && ticketSubject) {
        const resendKey = process.env.RESEND_API_KEY
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'hallo@complens.de'

        if (resendKey) {
            fetch('https://api.resend.com/emails', {
                method:  'POST',
                headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from:    `CompLens Support <${fromEmail}>`,
                    to:      ticketUserEmail,
                    subject: `Re: ${ticketSubject}`,
                    html:    buildReplyHtml(body.append_message.text, ticketSubject),
                }),
            }).catch(err => console.error('[support-reply-email]', err))
        }
    }

    return NextResponse.json(data)
}

