import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, company, email, message } = body

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Send Email Notification directly using the Resend REST API (avoids needing raw 'resend' package)
        const RESEND_API_KEY = process.env.RESEND_API_KEY
        if (RESEND_API_KEY) {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: process.env.RESEND_FROM_EMAIL || 'hallo@complens.de',
                    to: process.env.CONTACT_EMAIL || 'hallo@complens.de',
                    subject: `CompLens Lead: ${name} (${company || 'Keine Firma'})`,
                    html: `
                        <h2>Neue Kontaktanfrage</h2>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Firma:</strong> ${company || '-'}</p>
                        <p><strong>E-Mail:</strong> ${email}</p>
                        <br/>
                        <p><strong>Nachricht:</strong></p>
                        <p>${message.replace(/\n/g, '<br/>')}</p>
                    `
                })
            }).catch(e => console.error("Could not send email API:", e))
        } else {
            console.warn("No RESEND_API_KEY set. Skipping email notification.")
        }

        // 2. Log to Google Sheets
        // To use this, create a Google Apps Script (Extends -> Apps Script), deploy as a Web App, 
        // and put the URL in the environment GOOGLE_SHEETS_WEBHOOK_URL.
        const GOOGLE_WEBHOOK = process.env.GOOGLE_SHEETS_WEBHOOK_URL
        if (GOOGLE_WEBHOOK) {
            await fetch(GOOGLE_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: new Date().toISOString(),
                    name,
                    company,
                    email,
                    message
                })
            }).catch(e => console.error("Could not send to Google webhook:", e))
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Contact API Error:", error)
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
    }
}
