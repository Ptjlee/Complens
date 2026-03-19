import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { requireAiPlan } from '@/lib/api/planGuard'
import COMPLENS_KB from '@/lib/chatbot/knowledgeBase'

const SYSTEM_PROMPT = [
    'Du bist ein präziser Compliance- und Produktassistent für CompLens — die EU-Entgelttransparenz-Software von DexterBee GmbH.',
    '',
    'Du hilfst HR-Verantwortlichen und Compliance-Beauftragten dabei:',
    '- Die EU-Richtlinie 2023/970 korrekt anzuwenden (Art. 4–15)',
    '- Den Gender Pay Gap (bereinigt und unbereinigt) zu verstehen',
    '- Berichtspflichten nach Art. 9 zu erfüllen',
    '- Begründungspflichten nach Art. 10 umzusetzen',
    '- Maßnahmenpläne nach Art. 11 zu erstellen',
    '- DSGVO-konforme Verarbeitung sicherzustellen',
    '- CompLens zu bedienen (Import, Analyse, Berichte, Auskunftsrecht etc.)',
    '',
    'Wenn ein Nutzer fragt "wie mache ich X?", "wo finde ich Y?" oder "was bedeutet Z in CompLens?",',
    'antworte mit konkreten Schritt-für-Schritt-Anweisungen aus dem Produktwissensbereich.',
    '',
    'Antworte immer auf Deutsch, präzise und richtlinienkonform. Verwende strukturierte Aufzählungen wo sinnvoll.',
    'Verweise bei rechtlichen Fragen auf den konkreten Artikel der Richtlinie.',
    'Wenn etwas außerhalb deines Wissens liegt, sage es klar und verweise auf hallo@complens.de.',
    '',
    COMPLENS_KB,
].join('\n')

export async function POST(req: NextRequest) {
    // Auth + AI plan check
    const guard = await requireAiPlan()
    if ('error' in guard) return guard.error

    const supabase = await createClient()

    const { messages } = await req.json()
    if (!Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: 'No messages' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 })

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
    })

    // Convert to Gemini format (last message = current turn)
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
        role:  m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }))
    const lastMsg = messages[messages.length - 1]

    const chat   = model.startChat({ history })
    const result = await chat.sendMessageStream(lastMsg.content)

    // Stream SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of result.stream) {
                    const text = chunk.text()
                    if (text) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                    }
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Unknown error'
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
            } finally {
                controller.close()
            }
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection':   'keep-alive',
        },
    })
}
