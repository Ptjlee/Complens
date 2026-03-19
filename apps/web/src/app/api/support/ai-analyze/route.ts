import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const serviceClient = () =>
    createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

const SYSTEM_PROMPT = `Du bist ein freundlicher, kompetenter Support-Assistent von CompLens (DexterBee GmbH) — einer SaaS-Plattform für EU-konforme Entgelttransparenzanalysen.

Du analysierst eine Support-Anfrage und lieferst:
1. category: eine von: technical | billing | feature | account | other
2. priority: eine von: critical | high | normal | low
3. ai_summary: eine präzise, einzeilige Zusammenfassung auf Deutsch (max. 120 Zeichen)
4. ai_draft_reply: eine vollständige, professionelle Antwort auf Deutsch

PRIORITY-REGELN:
- critical: Datenverlust, Login-Fehler, System ausgefallen, Sicherheitsprobleme, Datenpanne
- high: PDF/PPT-Export fehlerhaft, Analysen schlagen fehl, Lizenzprobleme, falsches Ergebnis  
- normal: Fragen zur Bedienung, kleinere UX-Probleme, Konfigurationsfragen
- low: Feature-Wünsche, allgemeine Fragen, Verbesserungsvorschläge

ANTWORT-RICHTLINIEN:
- Freundlich und professionell auf Deutsch
- Beginne mit einer persönlichen Anrede: „Hallo [VORNAME DES NUTZERS],"
- Verwende KEINEN Platzhalter — nutze den echten Vornamen aus dem Prompt
- Direkt auf das Problem eingehen
- Konkrete nächste Schritte nennen
- Wenn unklar: gezielt nachfragen
- Signatur: „Ihr CompLens-Team · hallo@complens.de"
- Nicht erfinden, was du nicht weißt — lieber sagen, dass du nachschaust

Antworte AUSSCHLIESSLICH als JSON in diesem exakten Format:
{
  "category": "...",
  "priority": "...",
  "ai_summary": "...",
  "ai_draft_reply": "..."
}
`

function firstNameFrom(email: string): string {
    const local = (email ?? '').split('@')[0]
    const part  = local.split(/[._-]/)[0] ?? local
    return part.charAt(0).toUpperCase() + part.slice(1)
}

/**
 * POST /api/support/ai-analyze
 * Analyzes a support ticket with AI, classifies it, and generates a draft reply.
 * Called internally (fire-and-forget from ticket creation).
 */
export async function POST(req: NextRequest) {
    const { ticketId } = await req.json()
    if (!ticketId) return new NextResponse('Missing ticketId', { status: 400 })

    // Fetch the ticket
    const svc = serviceClient()
    const { data: ticket, error: fetchErr } = await svc
        .from('support_tickets')
        .select('id, subject, body, user_email, org_name')
        .eq('id', ticketId)
        .single()

    if (fetchErr || !ticket) {
        return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        return NextResponse.json({ error: 'AI not configured.' }, { status: 500 })
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model:            'gemini-2.0-flash',
            generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
            systemInstruction: SYSTEM_PROMPT,
        })

        const firstName  = firstNameFrom(ticket.user_email ?? '')
        const userPrompt = `VORNAME DES NUTZERS: ${firstName}
BETREFF: ${ticket.subject}

BESCHREIBUNG:
${ticket.body}

Nutzer: ${ticket.user_email ?? 'Unbekannt'} · Organisation: ${ticket.org_name ?? 'Unbekannt'}`

        const result = await model.generateContent(userPrompt)
        const raw    = result.response.text().trim()

        // Strip markdown fences if present
        const jsonStr = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
        const parsed  = JSON.parse(jsonStr)

        const { category, priority, ai_summary, ai_draft_reply } = parsed

        // Update ticket with AI analysis
        await svc
            .from('support_tickets')
            .update({ category, priority, ai_summary, ai_draft_reply })
            .eq('id', ticketId)

        return NextResponse.json({ ok: true, category, priority })
    } catch (err) {
        console.error('[support/ai-analyze]', err)
        // Best-effort: update with fallback values
        await svc
            .from('support_tickets')
            .update({
                category:  'other',
                priority:  'normal',
                ai_summary: 'Ticket erhalten — manuelle Klassifizierung erforderlich.',
            })
            .eq('id', ticketId)
        return NextResponse.json({ error: 'AI analysis failed.' }, { status: 500 })
    }
}
