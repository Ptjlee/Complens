import { NextRequest, NextResponse } from 'next/server'
import { checkSuperadminAccess } from '@/lib/api/superadminAuth'

function buildHtml(body: string, lang: 'de' | 'en') {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://complens.de'
    const bodyHtml = body
        .split('\n')
        .map(line => `<p style="margin:0 0 14px;line-height:1.65;font-size:15px;color:#1e293b;">${line || '&nbsp;'}</p>`)
        .join('')
    const footerNote  = lang === 'en'
        ? 'This email was sent via the <strong>CompLens Admin Panel</strong>.'
        : 'Diese E-Mail wurde über das <strong>CompLens Admin-Panel</strong> versendet.'
    const ctaLabel    = lang === 'en' ? 'Open CompLens →' : 'CompLens öffnen →'
    const privLabel   = lang === 'en' ? 'Privacy' : 'Datenschutz'
    const termsLabel  = lang === 'en' ? 'Terms' : 'AGB'

    return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%);padding:32px 40px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.1);border-radius:12px;padding:10px 16px;margin-bottom:12px;">
              <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">C</span><span style="font-size:22px;font-weight:900;color:#a5b4fc;letter-spacing:-0.5px;">L</span>
            </div>
            <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;margin-bottom:4px;">CompLens</div>
            <div style="color:rgba(165,180,252,0.8);font-size:12px;letter-spacing:2px;text-transform:uppercase;">EU Pay Transparency</div>
          </td>
        </tr>
        <tr><td style="height:4px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#6366f1);"></td></tr>
        <tr><td style="padding:36px 40px 28px;">${bodyHtml}</td></tr>
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <a href="${siteUrl}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:10px;">${ctaLabel}</a>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;color:#64748b;font-size:12px;">${footerNote}</p>
            <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;">CompLens by DexterBee · EU Pay Transparency Compliance Platform</p>
            <p style="margin:0;color:#cbd5e1;font-size:11px;">
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

    const { toEmails, subject, body, lang = 'de' } = await req.json() as {
        toEmails: string[]
        subject:  string
        body:     string
        lang?:    'de' | 'en'
    }

    if (!toEmails?.length || !subject || !body) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const resendKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'hallo@complens.de'
    if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })

    const html = buildHtml(body, lang)

    let sent = 0
    let failed = 0
    const errors: string[] = []

    // Send in batches of 10 to avoid Resend rate limits
    const BATCH = 10
    for (let i = 0; i < toEmails.length; i += BATCH) {
        const batch = toEmails.slice(i, i + BATCH)
        await Promise.all(batch.map(async email => {
            try {
                const res = await fetch('https://api.resend.com/emails', {
                    method:  'POST',
                    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ from: `CompLens <${fromEmail}>`, to: email, subject, html }),
                })
                if (res.ok) { sent++ }
                else { failed++; errors.push(email) }
            } catch {
                failed++; errors.push(email)
            }
        }))
        // Small pause between batches
        if (i + BATCH < toEmails.length) await new Promise(r => setTimeout(r, 200))
    }

    return NextResponse.json({ ok: true, sent, failed, errors })
}
