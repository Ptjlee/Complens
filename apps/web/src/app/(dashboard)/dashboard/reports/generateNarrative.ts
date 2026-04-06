'use server'

import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { saveReportNotes } from './actions'
import type { AnalysisResult } from '@/lib/calculations/types'

/**
 * Generates a locale-aware executive narrative for the pay gap report using Gemini.
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
    const t = await getTranslations('report')
    if (!user) return { error: t('notAuthenticated') }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { error: t('apiKeyMissing') }

    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'de'

    const over = results.overall
    const deptList = results.by_department
        .filter(d => !d.suppressed && d.gap.exceeds_5pct)
        .slice(0, 5)
        .map(d => {
            const g = (d.gap.adjusted_median ?? d.gap.unadjusted_median) * 100
            return `${d.department} (${g >= 0 ? '+' : ''}${g.toFixed(1)}%)`
        })

    const adjustedStr = over.adjusted_median !== null
        ? (over.adjusted_median * 100).toFixed(1) + '%'
        : null

    const prompt = locale === 'en'
        ? `You are an expert in EU pay transparency (Directive 2023/970). Write a concise, factual summary (4–6 sentences, English) for the pay equity report of "${orgName}" (reporting year ${year}).

The following analysis results are available:
- Unadjusted Gender Pay Gap (Median): ${(over.unadjusted_median * 100).toFixed(1)}%
- Adjusted Gender Pay Gap (Median, WIF-adjusted): ${adjustedStr ?? 'not calculable'}
- Unadjusted (Mean): ${(over.unadjusted_mean * 100).toFixed(1)}%
- 5% threshold exceeded: ${over.exceeds_5pct ? 'YES — action required' : 'NO — compliant'}
- Employees: ${results.total_employees} (♀ ${over.female_count} · ♂ ${over.male_count})
- WIF factors: ${results.wif_factors_used.join(', ')}
${deptList.length > 0 ? `- Departments with > 5% gap: ${deptList.join(', ')}` : '- No departments > 5% gap'}

Guidelines:
- Write directly, professionally, EU Directive-compliant
- Use specific figures
- No marketing language
- Maximum 200 words
- Sentences in paragraph form (no bullet points)`
        : `Du bist Experte für EU-Entgelttransparenz (Richtlinie 2023/970).
Schreibe eine prägnante, sachliche Zusammenfassung (4–6 Sätze, Deutsch) für den Entgeltbericht von "${orgName}" (Berichtsjahr ${year}).

Folgende Analyse-Ergebnisse liegen vor:
- Unbereinigter Gender Pay Gap (Median): ${(over.unadjusted_median * 100).toFixed(1)}%
- Bereinigter Gender Pay Gap (Median, WIF-adjustiert): ${adjustedStr ?? 'nicht berechenbar'}
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
        return { error: t('errorPrefix', { message: msg }) }
    }
}
