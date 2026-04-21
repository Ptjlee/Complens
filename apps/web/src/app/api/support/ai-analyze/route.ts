import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getTranslations } from 'next-intl/server'
import { rateLimit, RATE_LIMITS } from '@/lib/api/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { sanitizeUserPrompt } from '@/lib/ai/sanitize'

const serviceClient = () =>
    createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

const SYSTEM_PROMPT_DE = `Du bist ein freundlicher, kompetenter Support-Assistent von CompLens (DexterBee GmbH) — einer SaaS-Plattform für EU-konforme Entgelttransparenzanalysen.

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
- Beginne mit einer persönlichen Anrede: "Hallo [VORNAME DES NUTZERS],"
- Verwende KEINEN Platzhalter — nutze den echten Vornamen aus dem Prompt
- Direkt auf das Problem eingehen
- Konkrete nächste Schritte nennen
- Wenn unklar: gezielt nachfragen
- Signatur: "Ihr CompLens-Team · hallo@complens.de"
- Nicht erfinden, was du nicht weißt — lieber sagen, dass du nachschaust

Antworte AUSSCHLIESSLICH als JSON in diesem exakten Format:
{
  "category": "...",
  "priority": "...",
  "ai_summary": "...",
  "ai_draft_reply": "..."
}
`

const SYSTEM_PROMPT_EN = `You are a friendly, competent support assistant for CompLens (DexterBee GmbH) — a SaaS platform for EU-compliant pay transparency analyses.

You analyse a support request and provide:
1. category: one of: technical | billing | feature | account | other
2. priority: one of: critical | high | normal | low
3. ai_summary: a concise, single-line summary in English (max. 120 characters)
4. ai_draft_reply: a complete, professional reply in English

PRIORITY RULES:
- critical: Data loss, login failures, system down, security issues, data breach
- high: PDF/PPT export broken, analyses failing, licence issues, incorrect results
- normal: Usage questions, minor UX issues, configuration questions
- low: Feature requests, general questions, improvement suggestions

REPLY GUIDELINES:
- Friendly and professional in English
- Start with a personal greeting: "Hi [USER FIRST NAME],"
- Do NOT use placeholders — use the real first name from the prompt
- Address the issue directly
- Provide concrete next steps
- If unclear: ask targeted follow-up questions
- Signature: "Your CompLens Team · hallo@complens.de"
- Do not invent what you do not know — say you will look into it

Respond EXCLUSIVELY as JSON in this exact format:
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
    const limited = rateLimit(req, RATE_LIMITS.ai)
    if (limited) return limited

    // Auth check — prevent unauthenticated access to AI endpoints
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Locale
    const store = await cookies()
    const locale = store.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'de'
    const en = locale === 'en'

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
            model:            'gemini-2.5-flash',
            generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
            systemInstruction: en ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_DE,
        })

        const firstName  = firstNameFrom(ticket.user_email ?? '')
        const unknownLabel = en ? 'Unknown' : 'Unbekannt'
        const sanitizedSubject = sanitizeUserPrompt(ticket.subject)
        const sanitizedBody    = sanitizeUserPrompt(ticket.body)
        const userPrompt = en
            ? `USER FIRST NAME: ${firstName}
SUBJECT: ${sanitizedSubject}

DESCRIPTION:
${sanitizedBody}

User: ${ticket.user_email ?? unknownLabel} · Organisation: ${ticket.org_name ?? unknownLabel}`
            : `VORNAME DES NUTZERS: ${firstName}
BETREFF: ${sanitizedSubject}

BESCHREIBUNG:
${sanitizedBody}

Nutzer: ${ticket.user_email ?? unknownLabel} · Organisation: ${ticket.org_name ?? unknownLabel}`

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
        const t = await getTranslations('errors')
        // Best-effort: update with fallback values
        await svc
            .from('support_tickets')
            .update({
                category:  'other',
                priority:  'normal',
                ai_summary: t('aiFallbackSummary'),
            })
            .eq('id', ticketId)
        return NextResponse.json({ error: 'AI analysis failed.' }, { status: 500 })
    }
}
