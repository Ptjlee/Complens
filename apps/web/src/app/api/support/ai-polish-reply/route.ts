import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * POST /api/support/ai-polish-reply
 * Polishes an admin-written draft reply — like the email polisher,
 * but support-context aware. Supports DE/EN output language.
 */
export async function POST(req: NextRequest) {
    const { draft, subject, userMessage, firstName, lang = 'de' } = await req.json()

    if (!draft?.trim()) {
        return NextResponse.json({ error: 'No draft provided.' }, { status: 422 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'AI not configured.' }, { status: 500 })

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const langInstruction = lang === 'en'
        ? 'Write the polished reply in English.'
        : 'Schreibe die verfeinerte Antwort auf Deutsch.'

    const prompt = `
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
