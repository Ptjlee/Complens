'use server'

import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { saveReportNotes } from './actions'
import type { AnalysisResult } from '@/lib/calculations/types'

/**
 * Generates a German executive narrative for the pay gap report using Gemini.
 * The narrative is then saved to report_notes for the given analysis.
 */
export async function generateAndSaveNarrative(
    analysisId: string,
    orgName: string,
    results: AnalysisResult,
    year: number,
): Promise<{ text?: string; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { error: 'Gemini API-Key fehlt.' }

    const over = results.overall
    const deptList = results.by_department
        .filter(d => !d.suppressed && d.gap.exceeds_5pct)
        .slice(0, 5)
        .map(d => {
            const g = (d.gap.adjusted_median ?? d.gap.unadjusted_median) * 100
            return `${d.department} (${g >= 0 ? '+' : ''}${g.toFixed(1)}%)`
        })

    const prompt = `Du bist Experte für EU-Entgelttransparenz (Richtlinie 2023/970). 
Schreibe eine prägnante, sachliche Zusammenfassung (4–6 Sätze, Deutsch) für den Entgeltbericht von "${orgName}" (Berichtsjahr ${year}).

Folgende Analyse-Ergebnisse liegen vor:
- Unbereinigter Gender Pay Gap (Median): ${(over.unadjusted_median * 100).toFixed(1)}%
- Bereinigter Gender Pay Gap (Median, WIF-adjustiert): ${over.adjusted_median !== null ? (over.adjusted_median * 100).toFixed(1) + '%' : 'nicht berechenbar'}
- Unbereinigt (Mittelwert): ${(over.unadjusted_mean * 100).toFixed(1)}%
- 5%-Schwelle überschritten: ${over.exceeds_5pct ? 'JA — Handlung erforderlich' : 'NEIN — konform'}
- Mitarbeitende: ${results.total_employees} (♀ ${over.female_count} · ♂ ${over.male_count})
- WIF-Faktoren: ${results.wif_factors_used.join(', ')}
${deptList.length > 0 ? `- Bereiche mit > 5% Gap: ${deptList.join(', ')}` : '- Keine Bereiche > 5% Gap'}

Richtlinien:
- Formuliere direkt, professionell, EU-Direktiven-konform
- Erwähne konkrete Zahlen
- Keine Marketingsprache
- Maximal 200 Wörter
- Sätze in Absatzform (kein Aufzählungsformat)`

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        const response = await model.generateContent(prompt)
        const text = response.response.text().trim()

        // Auto-save to report_notes
        await saveReportNotes(analysisId, text)

        return { text }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[generateNarrative]', msg)
        return { error: `KI-Fehler: ${msg}` }
    }
}
