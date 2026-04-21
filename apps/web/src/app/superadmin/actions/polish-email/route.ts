import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { checkSuperadminAccess } from '@/lib/api/superadminAuth'

export async function POST(req: NextRequest) {
    const authErr = await checkSuperadminAccess(req)
    if (authErr) return authErr

    const { subject, body, lang = 'de' } = await req.json() as {
        subject?: string; body: string; lang?: 'de' | 'en'
    }
    if (!body?.trim()) return NextResponse.json({ error: 'Missing body' }, { status: 400 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 })

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    })

    const langInstruction = lang === 'en'
        ? 'Write entirely in English. If the original is in German, translate to English.'
        : 'Schreibe vollständig auf Deutsch. Falls das Original auf Englisch ist, übersetze ins Deutsche.'

    const prompt = `You are a professional B2B SaaS copywriter for CompLens (EU pay transparency software).
Improve the email below: make it clearer, warmer and more professional.
Keep the core message. ${langInstruction}

Return your answer as a JSON object with exactly two fields:
- "subject": the improved email subject line (short, clear, no "Betreff:" prefix)
- "body": the improved email body text ONLY (no subject line, no salutation like "Dear…", no sign-off)

Current subject: ${subject?.trim() || '(none)'}

Current body:
${body}

Respond with valid JSON only, no markdown fences.`

    try {
        const result  = await model.generateContent(prompt)
        let raw = result.response.text().trim()

        // Strip markdown code fences if model wraps in ```json ... ```
        raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

        const parsed = JSON.parse(raw) as { subject?: string; body?: string }
        return NextResponse.json({
            polishedSubject: parsed.subject?.trim() ?? subject ?? '',
            polished:        parsed.body?.trim() ?? '',
        })
    } catch {
        // Fallback: return raw text as body only
        const result  = await model.generateContent(
            `Improve this email body text. ${langInstruction} Return ONLY the improved body text, no subject line:\n\n${body}`
        )
        return NextResponse.json({ polishedSubject: subject ?? '', polished: result.response.text().trim() })
    }
}
