import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { requireAiPlan } from '@/lib/api/planGuard'
import type { AnalysisResult } from '@/lib/calculations/types'
import { getKnowledgeBase } from '@/lib/chatbot/knowledgeBase'
import { rateLimit, RATE_LIMITS } from '@/lib/api/rateLimit'

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
function eur(v: number | null | undefined, locale: string = 'de'): string {
    const fmt = locale === 'en' ? 'en-IE' : 'de-DE'
    return v != null ? `${v.toLocaleString(fmt, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/h` : '—'
}

// ─── System prompt builder ────────────────────────────────────

function buildSystemPrompt(
    result: AnalysisResult,
    orgName: string,
    year: number,
    explanations: ExplanationRow[],
    remediationPlans: RemediationRow[],
    locale: string,
): string {
    const o = result.overall
    const en = locale === 'en'

    // Top 8 departments by absolute gap
    const deptLines = (result.by_department || [])
        .filter(d => !d.suppressed)
        .sort((a, b) => Math.abs(b.gap.adjusted_median ?? 0) - Math.abs(a.gap.adjusted_median ?? 0))
        .slice(0, 8)
        .map(d => en
            ? `  - ${d.department}: adjusted ${pct(d.gap.adjusted_median)} | unadjusted ${pct(d.gap.unadjusted_median)} | ${d.employee_count} empl. | F: ${d.gap.female_count} / M: ${d.gap.male_count}`
            : `  - ${d.department}: bereinigt ${pct(d.gap.adjusted_median)} | unbereinigt ${pct(d.gap.unadjusted_median)} | ${d.employee_count} MA | F: ${d.gap.female_count} / M: ${d.gap.male_count}`)
        .join('\n')

    // Top 8 grades
    const gradeLines = (result.by_grade || [])
        .filter(g => !g.suppressed)
        .slice(0, 8)
        .map(g => en
            ? `  - ${g.grade}: adjusted ${pct(g.gap.adjusted_median)} | ${g.employee_count} empl.`
            : `  - ${g.grade}: bereinigt ${pct(g.gap.adjusted_median)} | ${g.employee_count} MA`)
        .join('\n')

    // Quartiles
    const qs = result.quartiles
    const quartileLines = qs ? [
        `  Q1 (${en ? 'bottom' : 'unterste'} 25%): F ${qs.q1?.female_pct ?? 0}% / M ${qs.q1?.male_pct ?? 0}%`,
        `  Q2:                F ${qs.q2?.female_pct ?? 0}% / M ${qs.q2?.male_pct ?? 0}%`,
        `  Q3:                F ${qs.q3?.female_pct ?? 0}% / M ${qs.q3?.male_pct ?? 0}%`,
        `  Q4 (${en ? 'top' : 'oberste'} 25%):  F ${qs.q4?.female_pct ?? 0}% / M ${qs.q4?.male_pct ?? 0}%`,
    ].join('\n') : (en ? '  No data' : '  Keine Daten')

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
        .map(f => en
            ? `  - Pay grade ${f.job_grade}: Gap ${pct(f.gap_vs_gender_pct)} (${f.gender === 'female' ? 'female' : 'male'}, ID: ${f.employee_id})`
            : `  - Entgeltgruppe ${f.job_grade}: Gap ${pct(f.gap_vs_gender_pct)} (${f.gender === 'female' ? 'weiblich' : 'männlich'}, ID: ${f.employee_id})`)
        .join('\n')

    // Explanations summary
    const explainedCount = explanations.filter(e => e.status === 'explained').length
    const pendingCount   = explanations.filter(e => e.status === 'pending').length
    const dismissedCount = explanations.filter(e => e.status === 'dismissed').length

    const explCategoryLines = (() => {
        const cats: Record<string, number> = {}
        for (const e of explanations.filter(x => x.status === 'explained')) {
            const key = e.category_key ?? (en ? 'unknown' : 'unbekannt')
            cats[key] = (cats[key] ?? 0) + 1
        }
        return Object.entries(cats)
            .sort((a, b) => b[1] - a[1])
            .map(([k, n]) => `  - ${k}: ${n} ${en ? 'cases' : 'Fälle'}`)
            .join('\n') || (en ? '  No explanations recorded' : '  Keine Begründungen erfasst')
    })()

    // Remediation summary
    const remOpen      = remediationPlans.filter(r => r.status === 'open').length
    const remProgress  = remediationPlans.filter(r => r.status === 'in_progress').length
    const remDone      = remediationPlans.filter(r => r.status === 'completed').length

    const kb = getKnowledgeBase(locale)

    if (en) {
        return [
            `You are a specialised HR compliance assistant at ${orgName} for the EU Pay Transparency Directive 2023/970/EU.`,
            'You have access to the full analysis results, all recorded explanations, and the remediation plan. Your tasks:',
            '1. Explain and contextualise the numbers',
            '2. Precisely identify legal obligations (with article references)',
            '3. Provide concrete, prioritised recommendations for action',
            '4. Suggest compliant formulations for pay gap explanations',
            '5. Clarify reporting processes and deadlines',
            '',
            `═══ ANALYSIS CONTEXT: ${orgName} — Reporting Year ${year} ═══`,
            '',
            `Total employees: ${result.total_employees} (Women: ${o.female_count}, Men: ${o.male_count})`,
            `WIF factors (for adjustment): ${(result.wif_factors_used || []).join(', ')}`,
            `Reporting basis: gross hourly pay per Art. 3(1b) EU 2023/970`,
            '',
            '── OVERALL RESULT ──',
            `Unadjusted pay gap (median):     ${pct(o.unadjusted_median)}`,
            `Unadjusted pay gap (mean):       ${pct(o.unadjusted_mean)}`,
            `Adjusted pay gap (median):       ${pct(o.adjusted_median)}   ← mandatory per Art. 9`,
            `Adjusted pay gap (mean):         ${pct(o.adjusted_mean)}`,
            `5% threshold exceeded: ${o.exceeds_5pct ? 'YES → Joint pay assessment per Art. 9(1c) required' : 'NO → Annual review per Art. 9(1a) recommended'}`,
            '',
            '── TOP DEPARTMENTS BY GAP ──',
            deptLines || '  No data',
            '',
            '── PAY GRADES ──',
            gradeLines || '  No data',
            '',
            '── QUARTILE DISTRIBUTION (female/male share per quartile) ──',
            quartileLines,
            '',
            '── FLAGGED INDIVIDUAL CASES (anonymised) ──',
            `Critical (> 20%): ${highFlags} persons`,
            `Medium (10–20%):  ${medFlags} persons`,
            `Minor (5–10%):    ${lowFlags} persons`,
            `Overpaid:         ${overFlags} persons`,
            highFlags > 0 ? `Top risk cases:\n${topFlags}` : '',
            '',
            '── EXPLANATIONS (Art. 10 / Art. 18) ──',
            `Recorded & explained: ${explainedCount}`,
            `Open / pending:       ${pendingCount}`,
            `Dismissed:            ${dismissedCount}`,
            `Most frequent categories:\n${explCategoryLines}`,
            '',
            '── REMEDIATION PLAN (Art. 11) ──',
            `Open:          ${remOpen}`,
            `In progress:   ${remProgress}`,
            `Completed:     ${remDone}`,
            '',
            '── COMMUNICATION RULES ──',
            '- ALWAYS respond in English, concisely and professionally',
            '- Quote figures directly from the analysis context above',
            '- Reference specific articles of Directive 2023/970/EU',
            '- When action is needed: prioritised steps with concrete timelines',
            '- For explanation formulations: suggest directive-compliant, objective HR texts',
            '- Avoid marketing language and vagueness',
            '- If something is outside the context, say so clearly and refer to support',
            '- You have no real-time data — only the aggregates above. State this when relevant.',
            '',
            '── COMPLENS PRODUCT KNOWLEDGE ──',
            'When the user asks how to use something in CompLens, use the following product knowledge:',
            kb,
        ].filter(Boolean).join('\n')
    }

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
        kb,
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
    if (text.includes('begründung') || text.includes('erklär') || text.includes('explanation') || text.includes('explain') || text.includes('art. 10') || text.includes('art. 18')) return 'gap_explanation'
    if (text.includes('maßnahm') || text.includes('remediat') || text.includes('action plan') || text.includes('art. 11')) return 'remediation'
    if (text.includes('bericht') || text.includes('meldung') || text.includes('report') || text.includes('submission') || text.includes('art. 9')) return 'report_submission'
    if (text.includes('pdf') || text.includes('export') || text.includes('herunterlad') || text.includes('download')) return 'export'
    if (text.includes('abonnement') || text.includes('preis') || text.includes('lizenz') || text.includes('subscription') || text.includes('pricing') || text.includes('license') || text.includes('upgrade')) return 'billing'
    if (text.includes('fehler') || text.includes('funktioniert nicht') || text.includes('problem') || text.includes('error') || text.includes('not working') || text.includes('bug')) return 'technical_issue'
    if (text.includes('quartil') || text.includes('quartile') || text.includes('bereinigt') || text.includes('adjusted') || text.includes('unadjusted') || text.includes('unbereinigt') || text.includes('wif')) return 'analysis_understanding'
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
    const limited = rateLimit(req, RATE_LIMITS.ai)
    if (limited) return limited

    const { id } = await params

    // Locale
    const store = await cookies()
    const locale = store.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'de'

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
        locale,
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
