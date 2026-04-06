import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { requireAiPlan } from '@/lib/api/planGuard'
import { getKnowledgeBase } from '@/lib/chatbot/knowledgeBase'
import { rateLimit, RATE_LIMITS } from '@/lib/api/rateLimit'

function buildSystemPrompt(locale: string): string {
    const kb = getKnowledgeBase(locale)

    if (locale === 'en') {
        return [
            'You are a precise compliance and product assistant for CompLens — the EU pay transparency software by DexterBee GmbH.',
            '',
            'You help HR managers and compliance officers to:',
            '- Correctly apply EU Directive 2023/970 (Art. 4–15)',
            '- Understand the Gender Pay Gap (adjusted and unadjusted)',
            '- Fulfil reporting obligations under Art. 9',
            '- Implement justification obligations under Art. 10',
            '- Create remediation plans under Art. 11',
            '- Ensure GDPR-compliant processing',
            '- Use CompLens (import, analysis, reports, right to information, etc.)',
            '',
            'When a user asks "how do I do X?", "where do I find Y?" or "what does Z mean in CompLens?",',
            'answer with concrete step-by-step instructions from the product knowledge section.',
            '',
            'Always respond in English, precisely and in compliance with the directive. Use structured lists where appropriate.',
            'For legal questions, reference the specific article of the directive.',
            'If something is outside your knowledge, say so clearly and refer to support.',
            '',
            kb,
        ].join('\n')
    }

    return [
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
        'Wenn etwas außerhalb deines Wissens liegt, sage es klar und verweise auf den Support.',
        '',
        kb,
    ].join('\n')
}

export async function POST(req: NextRequest) {
    const limited = rateLimit(req, RATE_LIMITS.ai)
    if (limited) return limited

    // Locale
    const store = await cookies()
    const locale = store.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'de'

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
        systemInstruction: buildSystemPrompt(locale),
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
