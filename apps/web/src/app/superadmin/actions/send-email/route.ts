import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkSuperadminAccess } from '@/lib/api/superadminAuth'

// ─── World-class plain email template (no logo — best compatibility) ──────────────────────
//
//  Design principles:
//  • White card on very light grey — clean, universally rendered
//  • Indigo accent bar at top for brand colour without using images/SVG
//  • Body text dark on white — maximum readability
//  • Personal sign-off: shows sender name if provided, else "CompLens"
//  • No "sent via admin panel" — sounds automated; replaced with helpful footer

function buildHtml(body: string, lang: 'de' | 'en', senderName?: string) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://complens.de'

    const bodyHtml = body
        .split('\n')
        .map(line =>
            line.trim()
                ? `<p style="margin:0 0 16px;line-height:1.7;font-size:15px;color:#1e293b;">${line}</p>`
                : `<p style="margin:0 0 8px;">&nbsp;</p>`
        )
        .join('')

    const signOff   = senderName ?? 'CompLens'
    const ctaLabel  = lang === 'en' ? 'Open CompLens →' : 'CompLens öffnen →'
    const privLabel = lang === 'en' ? 'Privacy'          : 'Datenschutz'
    const termsLabel= lang === 'en' ? 'Terms'            : 'AGB'
    const footerLegal = lang === 'en'
        ? 'CompLens by DexterBee · EU Pay Transparency Compliance Platform'
        : 'CompLens by DexterBee · EU-Entgelttransparenz-Plattform'

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>CompLens</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">

        <!-- Brand accent bar -->
        <tr>
          <td style="background:linear-gradient(90deg,#4f46e5,#7c3aed);height:4px;border-radius:8px 8px 0 0;"></td>
        </tr>

        <!-- Main card -->
        <tr>
          <td style="background:#ffffff;padding:40px 44px 32px;border-radius:0 0 0 0;">

            <!-- Wordmark -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="background:#4f46e5;border-radius:8px;padding:6px 12px;">
                  <span style="font-size:14px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Comp</span><span style="font-size:14px;font-weight:800;color:#a5b4fc;letter-spacing:-0.3px;">Lens</span>
                </td>
                <td style="padding-left:10px;vertical-align:middle;">
                  <span style="font-size:11px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;">EU Pay Transparency</span>
                </td>
              </tr>
            </table>

            <!-- Body -->
            <div style="color:#1e293b;">${bodyHtml}</div>

            <!-- Divider -->
            <div style="height:1px;background:#e2e8f0;margin:24px 0;"></div>

            <!-- Personal sign-off -->
            <p style="margin:0;font-size:14px;color:#475569;">
              Mit freundlichen Grüßen,<br>
              <strong style="color:#1e293b;">${signOff}</strong>
            </p>
          </td>
        </tr>

        <!-- CTA row (light grey) -->
        <tr>
          <td style="background:#f8fafc;padding:20px 44px;border-top:1px solid #e2e8f0;">
            <a href="${siteUrl}/dashboard"
               style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:11px 24px;border-radius:8px;">
              ${ctaLabel}
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f1f5f9;padding:20px 44px;border-radius:0 0 8px 8px;border-top:1px solid #e2e8f0;">
            <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;">${footerLegal}</p>
            <p style="margin:0;font-size:11px;color:#cbd5e1;">
              <a href="${siteUrl}/datenschutz" style="color:#94a3b8;text-decoration:none;">${privLabel}</a>
              &nbsp;·&nbsp;
              <a href="${siteUrl}/agb" style="color:#94a3b8;text-decoration:none;">${termsLabel}</a>
              &nbsp;·&nbsp;
              <a href="mailto:hallo@complens.de" style="color:#94a3b8;text-decoration:none;">Support</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
    const authErr = await checkSuperadminAccess(req)
    if (authErr) return authErr

    const { toEmail, subject, body, lang = 'de', senderName } = await req.json() as {
        toEmail: string; subject: string; body: string; lang?: 'de' | 'en'; senderName?: string
    }
    if (!toEmail || !subject || !body) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'hallo@complens.de'
    if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })

    // "From" shows personal name if provided, else CompLens
    const fromName = senderName ? senderName : 'CompLens'

    const res = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
            from:    `${fromName} <${fromEmail}>`,
            to:      toEmail,
            subject,
            html:    buildHtml(body, lang as 'de' | 'en', senderName),
        }),
    })

    if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        return NextResponse.json({ error: `Resend error ${res.status}: ${errBody}` }, { status: 502 })
    }

    // Log the email
    const admin = createAdminClient()
    try {
        await admin.from('email_log').insert({
            to_email: toEmail, subject, sent_at: new Date().toISOString(),
            status: 'sent', template: 'admin_manual',
        })
    } catch { /* non-critical */ }

    return NextResponse.json({ ok: true })
}
