import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { requireAiPlan } from '@/lib/api/planGuard'
import type { AnalysisResult } from '@/lib/calculations/types'
import COMPLENS_KB from '@/lib/chatbot/knowledgeBase'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ChatMessage {
    role: 'user' | 'model'
    content: string
}

// ─── Formatting helpers ───────────────────────────────────────

function pct(v: number | null | undefined): string {
    return v != null ? `${(v * 100).toFixed(1)}%` : '—'
}
function eur(v: number | null | undefined): string {
    return v != null ? `${v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/h` : '—'
}

// ─── System prompt builder ────────────────────────────────────

function buildSystemPrompt(
    result: AnalysisResult,
    orgName: string,
    year: number,
    explanations: ExplanationRow[],
    remediationPlans: RemediationRow[],
): string {
    const o = result.overall

    // Top 8 departments by absolute gap
    const deptLines = (result.by_department || [])
        .filter(d => !d.suppressed)
        .sort((a, b) => Math.abs(b.gap.adjusted_median ?? 0) - Math.abs(a.gap.adjusted_median ?? 0))
        .slice(0, 8)
        .map(d => `  - ${d.department}: bereinigt ${pct(d.gap.adjusted_median)} | unbereinigt ${pct(d.gap.unadjusted_median)} | ${d.employee_count} MA | F: ${d.gap.female_count} / M: ${d.gap.male_count}`)
        .join('\n')

    // Top 8 grades
    const gradeLines = (result.by_grade || [])
        .filter(g => !g.suppressed)
        .slice(0, 8)
        .map(g => `  - ${g.grade}: bereinigt ${pct(g.gap.adjusted_median)} | ${g.employee_count} MA`)
        .join('\n')

    // Quartiles
    const qs = result.quartiles
    const quartileLines = qs ? [
        `  Q1 (unterste 25%): F ${qs.q1?.female_pct ?? 0}% / M ${qs.q1?.male_pct ?? 0}%`,
        `  Q2:                F ${qs.q2?.female_pct ?? 0}% / M ${qs.q2?.male_pct ?? 0}%`,
        `  Q3:                F ${qs.q3?.female_pct ?? 0}% / M ${qs.q3?.male_pct ?? 0}%`,
        `  Q4 (oberste 25%):  F ${qs.q4?.female_pct ?? 0}% / M ${qs.q4?.male_pct ?? 0}%`,
    ].join('\n') : '  Keine Daten'

    // Individual flags summary
    const flags = result.individual_flags || []
    const highFlags  = flags.filter(f => f.severity === 'high').length
    const medFlags   = flags.filter(f => f.severity === 'medium').length
    const lowFlags   = flags.filter(f => f.severity === 'low').length
    const overFlags  = flags.filter(f => f.severity === 'overpaid').length

    // Top 5 highest-risk individuals (anonymised: grade + gap only)
    const topFlags = flags
        .filter(f => f.severity === 'high')
        .slice(0, 5)
        .map(f => `  - Entgeltgruppe ${f.job_grade}: Gap ${pct(f.gap_vs_gender_pct)} (${f.gender === 'female' ? 'weiblich' : 'männlich'}, ID: ${f.employee_id})`)
        .join('\n')

    // Explanations summary
    const explainedCount = explanations.filter(e => e.status === 'explained').length
    const pendingCount   = explanations.filter(e => e.status === 'pending').length
    const dismissedCount = explanations.filter(e => e.status === 'dismissed').length

    const explCategoryLines = (() => {
        const cats: Record<string, number> = {}
        for (const e of explanations.filter(x => x.status === 'explained')) {
            const key = e.category_key ?? 'unbekannt'
            cats[key] = (cats[key] ?? 0) + 1
        }
        return Object.entries(cats)
            .sort((a, b) => b[1] - a[1])
            .map(([k, n]) => `  - ${k}: ${n} Fälle`)
            .join('\n') || '  Keine Begründungen erfasst'
    })()

    // Remediation summary
    const remOpen      = remediationPlans.filter(r => r.status === 'open').length
    const remProgress  = remediationPlans.filter(r => r.status === 'in_progress').length
    const remDone      = remediationPlans.filter(r => r.status === 'completed').length

    return [
        `Du bist ein spezialisierter HR-Compliance-Assistent bei ${orgName} für die EU-Entgelttransparenzrichtlinie 2023/970/EU.`,
        'Du kennst die vollständigen Analyseergebnisse, alle erfassten Begründungen und den Maßnahmenplan. Deine Aufgabe:',
        '1. Zahlen erklären und einordnen',
        '2. Rechtliche Pflichten präzise benennen (mit Artikelverweisen)',
        '3. Konkrete, priorisierte Handlungsempfehlungen geben',
        '4. Compliant-Formulierungen für Begründungen vorschlagen',
        '5. Meldeprozesse und Fristen erläutern',
        '',
        `═══ ANALYSE-KONTEXT: ${orgName} — Berichtsjahr ${year} ═══`,
        '',
        `Mitarbeitende gesamt: ${result.total_employees} (Frauen: ${o.female_count}, Männer: ${o.male_count})`,
        `WIF-Faktoren (für Bereinigung): ${(result.wif_factors_used || []).join(', ')}`,
        `Berichtsbasis: Bruttostundenverdienst gem. Art. 3 Abs. 1 lit. b EU 2023/970`,
        '',
        '── GESAMTERGEBNIS ──',
        `Unbereinigter Entgeltunterschied (Median):     ${pct(o.unadjusted_median)}`,
        `Unbereinigter Entgeltunterschied (Mittelwert): ${pct(o.unadjusted_mean)}`,
        `Bereinigter Entgeltunterschied (Median):       ${pct(o.adjusted_median)}   ← Pflichtangabe Art. 9`,
        `Bereinigter Entgeltunterschied (Mittelwert):   ${pct(o.adjusted_mean)}`,
        `5%-Schwelle überschritten: ${o.exceeds_5pct ? 'JA → Gemeinsame Entgeltbewertung nach Art. 9 Abs. 1c erforderlich' : 'NEIN → Jährliche Überprüfung gem. Art. 9 Abs. 1a empfohlen'}`,
        '',
        '── TOP-ABTEILUNGEN NACH GAP ──',
        deptLines || '  Keine Daten',
        '',
        '── ENTGELTGRUPPEN ──',
        gradeLines || '  Keine Daten',
        '',
        '── QUARTILSVERTEILUNG (Frauen-/Männeranteil je Quartil) ──',
        quartileLines,
        '',
        '── AUFFÄLLIGE EINZELFÄLLE (anonymisiert) ──',
        `Schwerwiegend (> 20%): ${highFlags} Personen`,
        `Mittel (10–20%):       ${medFlags} Personen`,
        `Gering (5–10%):        ${lowFlags} Personen`,
        `Überbezahlt:           ${overFlags} Personen`,
        highFlags > 0 ? `Top-Risikofälle:\n${topFlags}` : '',
        '',
        '── BEGRÜNDUNGEN (Art. 10 / Art. 18) ──',
        `Erfasst & begründet: ${explainedCount}`,
        `Offen / ausstehend:  ${pendingCount}`,
        `Abgewiesen:          ${dismissedCount}`,
        `Häufigste Kategorien:\n${explCategoryLines}`,
        '',
        '── MASSNAHMENPLAN (Art. 11) ──',
        `Offen:       ${remOpen}`,
        `In Bearbeitung: ${remProgress}`,
        `Abgeschlossen:  ${remDone}`,
        '',
        '── KOMMUNIKATIONSREGELN ──',
        '- Antworte IMMER auf Deutsch, präzise und professionell',
        '- Zitiere Zahlen direkt aus dem Analyse-Kontext oben',
        '- Nenne genaue Artikel der Richtlinie 2023/970/EU',
        '- Bei Handlungsbedarf: priorisierte Schritte mit konkreten Zeitrahmen',
        '- Für Begründungsformulierungen: schlage richtlinienkonforme, nüchterne HR-Texte vor',
        '- Vermeide Marketingsprache und Vagheiten',
        '- Wenn etwas außerhalb des Kontexts liegt, sage es klar und verweise auf den Support',
        '- Du hast keine Echtzeit-Daten — nur die obigen Aggregate. Nenne das bei Bedarf.',
        '',
        '── COMPLENS PRODUKTWISSEN ──',
        'Wenn der Nutzer fragt wie er etwas in CompLens bedient, nutze das folgende Produktwissen:',
        COMPLENS_KB,
    ].filter(Boolean).join('\n')
}

// ─── Types ────────────────────────────────────────────────────

type ExplanationRow = {
    id: string
    status: string
    category_key: string | null
    employee_id: string
}

type RemediationRow = {
    id: string
    status: string
    action_type: string | null
}

// ─── Auto-classify topic of conversation ─────────────────────

function classifyTopic(messages: ChatMessage[]): string {
    const text = messages.map(m => m.content).join(' ').toLowerCase()
    if (text.includes('begründung') || text.includes('erklär') || text.includes('art. 10') || text.includes('art. 18')) return 'gap_explanation'
    if (text.includes('maßnahm') || text.includes('remediat') || text.includes('art. 11')) return 'remediation'
    if (text.includes('bericht') || text.includes('meldung') || text.includes('report') || text.includes('art. 9')) return 'report_submission'
    if (text.includes('pdf') || text.includes('export') || text.includes('herunterlad')) return 'export'
    if (text.includes('abonnement') || text.includes('preis') || text.includes('lizenz') || text.includes('upgrade')) return 'billing'
    if (text.includes('fehler') || text.includes('funktioniert nicht') || text.includes('problem')) return 'technical_issue'
    if (text.includes('quartil') || text.includes('bereinigt') || text.includes('unbereinigt') || text.includes('wif')) return 'analysis_understanding'
    return 'general_compliance'
}

// ─── Log conversation to user_events ─────────────────────────

async function logChatSession(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    analysisId: string,
    messages: ChatMessage[],
    topic: string,
) {
    try {
        await supabase.from('user_events').insert({
            user_id:    userId,
            event_type: 'chatbot_inquiry',
            metadata: {
                analysis_id:   analysisId,
                topic,
                message_count: messages.length,
                preview:       messages.find(m => m.role === 'user')?.content?.slice(0, 200) ?? '',
                timestamp:     new Date().toISOString(),
            },
        })
    } catch {
        // Non-critical — never block the chat for a logging failure
    }
}

// ─── Route handler ────────────────────────────────────────────

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params

    // Auth + AI plan gate
    const guard = await requireAiPlan()
    if ('error' in guard) return new NextResponse(JSON.stringify({ error: 'AI plan required' }), { status: 403 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return new NextResponse('GEMINI_API_KEY not configured', { status: 500 })

    const body = await req.json() as { messages: ChatMessage[] }
    const { messages } = body
    if (!messages?.length) return new NextResponse('No messages', { status: 400 })

    // ── Fetch analysis + rich context in parallel ──
    const [
        { data: analysis },
        { data: org },
        { data: explanations },
        { data: remediationPlans },
    ] = await Promise.all([
        supabase
            .from('analyses')
            .select('results, datasets(name, reporting_year)')
            .eq('id', id)
            .eq('status', 'complete')
            .single(),
        supabase.from('organisations').select('name, plan').single(),
        supabase
            .from('pay_gap_explanations')
            .select('id, status, category_key, employee_id')
            .eq('analysis_id', id),
        supabase
            .from('remediation_plans')
            .select('id, status, action_type')
            .eq('analysis_id', id),
    ])

    if (!analysis) return new NextResponse('Analysis not found', { status: 404 })

    const orgName = org?.name ?? 'Organisation'
    const result  = analysis.results as AnalysisResult
    const year    = result.reporting_year

    // ── Build enriched system prompt ──
    const systemPrompt = buildSystemPrompt(
        result,
        orgName,
        year,
        (explanations ?? []) as ExplanationRow[],
        (remediationPlans ?? []) as RemediationRow[],
    )

    // ── Log conversation topic (best-effort, async) ──
    const topic = classifyTopic(messages)
    void logChatSession(supabase, guard.userId, id, messages, topic)

    // ── Gemini chat with streaming ──
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
            systemInstruction: systemPrompt,
            generationConfig: {
                temperature:     0.3,   // Low for factual HR/legal accuracy
                maxOutputTokens: 2048,
            },
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
