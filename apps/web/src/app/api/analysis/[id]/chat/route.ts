import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import type { AnalysisResult } from '@/lib/calculations/types'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ChatMessage {
    role: 'user' | 'model'
    content: string
}

function buildQuartileLines(result: AnalysisResult): string {
    const qs = result.quartiles
    if (!qs) return '  Keine Daten'
    const f = (v: number | null | undefined) => String(v ?? 0)
    return [
        `  - Q1 (unterstes Viertel): F ${f(qs.q1?.female_pct)}% / M ${f(qs.q1?.male_pct)}%`,
        `  - Q2: F ${f(qs.q2?.female_pct)}% / M ${f(qs.q2?.male_pct)}%`,
        `  - Q3: F ${f(qs.q3?.female_pct)}% / M ${f(qs.q3?.male_pct)}%`,
        `  - Q4 (oberstes Viertel): F ${f(qs.q4?.female_pct)}% / M ${f(qs.q4?.male_pct)}%`,
    ].join('\n')
}

function buildSystemPrompt(result: AnalysisResult, orgName: string, year: number): string {
    const o   = result.overall
    const pct = (v: number | null) => v != null ? `${(v * 100).toFixed(1)}%` : '—'

    const deptHighlights = (result.by_department || [])
        .filter(d => !d.suppressed)
        .sort((a, b) => Math.abs(b.gap.adjusted_median ?? 0) - Math.abs(a.gap.adjusted_median ?? 0))
        .slice(0, 6)
        .map(d => `  - ${d.department}: ${pct(d.gap.adjusted_median)} bereinigt (${d.employee_count} MA)`)
        .join('\n')

    const gradeHighlights = (result.by_grade || [])
        .filter(g => !g.suppressed)
        .slice(0, 6)
        .map(g => `  - ${g.grade}: ${pct(g.gap.adjusted_median)} bereinigt (${g.employee_count} MA)`)
        .join('\n')

    const flags = result.individual_flags || []
    const highFlags  = flags.filter(f => f.severity === 'high').length
    const medFlags   = flags.filter(f => f.severity === 'medium').length
    const lowFlags   = flags.filter(f => f.severity === 'low').length
    const overFlags  = flags.filter(f => f.severity === 'overpaid').length
    const quartileLines = buildQuartileLines(result)

    const lines = [
        `Du bist ein spezialisierter HR-Assistent für EU-Entgelttransparenz (Richtlinie 2023/970) bei ${orgName}.`,
        'Du hilfst HR-Fachkräften, die Analyseergebnisse zu verstehen, rechtliche Pflichten zu erläutern und konkrete Handlungsempfehlungen zu geben.',
        '',
        `ANALYSE-KONTEXT (Berichtsjahr ${year}):`,
        '',
        `Organisation: ${orgName}`,
        `Mitarbeitende gesamt: ${result.total_employees} (F: ${o.female_count}, M: ${o.male_count})`,
        `WIF-Faktoren (bereinigt): ${(result.wif_factors_used || []).join(', ')}`,
        'Berichtsbasis: Bruttostundenverdienst gem. Art. 3 EU 2023/970',
        '',
        'ENTGELTLÜCKEN:',
        `- Unbereinigt (Median):     ${pct(o.unadjusted_median)}`,
        `- Unbereinigt (Mittelwert): ${pct(o.unadjusted_mean)}`,
        `- Bereinigt (Median):       ${pct(o.adjusted_median)}   <- EU Art. 9-Pflichtangabe`,
        `- Bereinigt (Mittelwert):   ${pct(o.adjusted_mean)}`,
        `- 5%-Schwelle überschritten: ${o.exceeds_5pct ? 'JA — gemeinsame Entgeltbewertung erforderlich (Art. 9 Abs. 1c)' : 'NEIN — jährliche Überprüfung empfohlen'}`,
        '',
        'BEREICHE MIT GRÖSSTEN LÜCKEN:',
        deptHighlights || '  Keine Daten verfügbar',
        '',
        'ENTGELTGRUPPEN:',
        gradeHighlights || '  Keine Daten verfügbar',
        '',
        'QUARTILSVERTEILUNG:',
        quartileLines,
        '',
        'AUFFÄLLIGE EINZELFÄLLE (anonymisiert):',
        `- Schwerwiegend (> 20%): ${highFlags}`,
        `- Mittel (10-20%):       ${medFlags}`,
        `- Gering (5-10%):        ${lowFlags}`,
        `- Überbezahlt:           ${overFlags}`,
        '',
        'KOMMUNIKATIONSREGELN:',
        '- Antworte immer auf Deutsch, präzise und professionell',
        '- Zitiere konkrete Zahlen aus dem Analyse-Kontext',
        '- Verweise auf genaue EU-Richtlinienartikel (Art. 9, 10, 11, etc.)',
        '- Gib bei Handlungsbedarf priorisierte, konkrete Schritte',
        '- Verwende keine Marketingsprache',
        '- Wenn eine Frage über den Analyse-Kontext hinausgeht, sage das klar',
        '',
        'Du hast keine persönlichen Daten der Mitarbeitenden — nur die anonymisierten Aggregate.',
    ]
    return lines.join('\n')
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return new NextResponse('GEMINI_API_KEY not configured', { status: 500 })

    const body = await req.json() as { messages: ChatMessage[] }
    const { messages } = body
    if (!messages?.length) return new NextResponse('No messages', { status: 400 })

    const { data: analysis } = await supabase
        .from('analyses')
        .select('results, datasets(name, reporting_year)')
        .eq('id', id)
        .eq('status', 'complete')
        .single()

    if (!analysis) return new NextResponse('Analysis not found', { status: 404 })

    const { data: org } = await supabase.from('organisations').select('name').single()
    const orgName = org?.name ?? 'Organisation'
    const result  = analysis.results as AnalysisResult
    const year    = result.reporting_year

    // Gemini requires history to start with a 'user' turn — strip any leading model messages
    // (e.g. our UI welcome message which has role 'model')
    const rawHistory = messages.slice(0, -1).map(m => ({
        role:  m.role,
        parts: [{ text: m.content }],
    }))
    const firstUserIdx = rawHistory.findIndex(m => m.role === 'user')
    const history = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : []
    const lastMsg = messages[messages.length - 1]

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            model:             'gemini-2.5-flash',
            systemInstruction: buildSystemPrompt(result, orgName, year),
        })
        const chat   = model.startChat({ history })
        const stream = await chat.sendMessageStream(lastMsg.content)

        const encoder  = new TextEncoder()
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream.stream) {
                        const text = chunk.text()
                        if (text) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                } finally {
                    controller.close()
                }
            },
        })

        return new NextResponse(readable, {
            headers: {
                'Content-Type':  'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection':    'keep-alive',
            },
        })
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[chat/route] Error:', msg, err)
        return new NextResponse(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
