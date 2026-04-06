import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { rateLimit, RATE_LIMITS } from '@/lib/api/rateLimit'

/**
 * POST /api/support/ai-polish-reply
 * Polishes an admin-written draft reply — like the email polisher,
 * but support-context aware. Supports DE/EN output language.
 */
export async function POST(req: NextRequest) {
    const limited = rateLimit(req, RATE_LIMITS.ai)
    if (limited) return limited

    // Locale from cookie (fallback to request body `lang` for backward compat)
    const store = await cookies()
    const cookieLocale = store.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'de'

    const { draft, subject, userMessage, firstName, lang } = await req.json()
    const effectiveLang = lang ?? cookieLocale

    if (!draft?.trim()) {
        return NextResponse.json({ error: 'No draft provided.' }, { status: 422 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'AI not configured.' }, { status: 500 })

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const langInstruction = effectiveLang === 'en'
        ? 'Write the polished reply in English.'
        : 'Schreibe die verfeinerte Antwort auf Deutsch.'

    const prompt = effectiveLang === 'en'
        ? `
You are a professional support communications specialist for CompLens (DexterBee GmbH).
Polish the following draft reply for a support response.

CONTEXT:
- Recipient: ${firstName} (user)
- Ticket subject: ${subject}
- Original user message: "${userMessage?.slice(0, 300) ?? ''}"

INSTRUCTIONS:
- ${langInstruction}
- Keep the core content and all facts of the draft — do not change any factual statements
- Address "${firstName}" directly (personal, not generic)
- Use a friendly, professional, and solution-oriented tone
- Remove placeholders like [user name] and replace them with "${firstName}"
- Fix grammar, spelling, and sentence structure
- Format clearly and readably (paragraphs, no Markdown)
- Respond ONLY with the polished text — no explanations, no preamble

DRAFT TO POLISH:
${draft}
`.trim()
        : `
Du bist ein professioneller Support-Kommunikations-Spezialist für CompLens (DexterBee GmbH).
Verfeinere den folgenden Antwort-Entwurf für eine Support-Antwort.

KONTEXT:
- Empfänger: ${firstName} (Nutzer)
- Betreff des Tickets: ${subject}
- Originalnachricht des Nutzers: "${userMessage?.slice(0, 300) ?? ''}"

ANWEISUNGEN:
- ${langInstruction}
- Behalte den Kerninhalt und alle Fakten des Entwurfs bei — ändere keine inhaltlichen Aussagen
- Passe die Ansprache direkt an "${firstName}" an (persönlich, nicht generisch)
- Verwende einen freundlichen, professionellen und lösungsorientierten Ton
- Entferne Platzhalter wie [Name des Nutzers] und ersetze sie mit "${firstName}"
- Korrigiere Grammatik, Rechtschreibung und Satzbau
- Formatiere klar und lesbar (Absätze, kein Markdown)
- Antworte NUR mit dem verfeinerten Text — keine Erklärungen, kein Präambel

ENTWURF ZUM VERFEINERN:
${draft}
`.trim()

    try {
        const result   = await model.generateContent(prompt)
        const polished = result.response.text().trim()
        return NextResponse.json({ polished })
    } catch (err) {
        console.error('[ai-polish-reply]', err)
        return NextResponse.json({ error: 'AI polish failed.' }, { status: 500 })
    }
}
