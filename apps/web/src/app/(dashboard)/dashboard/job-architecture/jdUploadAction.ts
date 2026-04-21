'use server'

import { cookies } from 'next/headers'
import type { JdUploadResult, LevelDefinition, JobFamily, Competency } from '@/lib/jobArchitecture/types'
import { getOrgContext, getModel, parseJSON } from './aiHelpers'

// Fuzzy match: find the family whose name is closest to the AI suggestion
function matchFamilyByName(suggested: string, families: JobFamily[]): JobFamily | null {
    if (!suggested || !families.length) return null
    const norm = (s: string) => s.toLowerCase().trim()
    const target = norm(suggested)
    // Exact match first
    const exact = families.find(f => norm(f.name) === target)
    if (exact) return exact
    // Substring match
    const sub = families.find(f => target.includes(norm(f.name)) || norm(f.name).includes(target))
    if (sub) return sub
    return null
}

// Match competencies by keyword overlap with JD text
function matchCompetencies(text: string, competencies: Competency[]): string[] {
    if (!text || !competencies.length) return []
    const lower = text.toLowerCase()
    return competencies
        .filter(c => {
            const nameWords = c.name.toLowerCase().split(/\s+/)
            const descWords = (c.description ?? '').toLowerCase().split(/\s+/)
            const keywords = [...nameWords, ...descWords].filter(w => w.length > 3)
            return keywords.some(kw => lower.includes(kw))
        })
        .map(c => c.id)
}

export async function analyzeUploadedJD(
    formData: FormData
): Promise<{ success: true; data: JdUploadResult } | { success: false; error: string }> {
    const ctx = await getOrgContext()
    if ('error' in ctx) return { success: false, error: ctx.error }

    // Read locale from NEXT_LOCALE cookie
    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'de'
    const langInstruction = locale === 'de'
        ? 'Write all text output in German.'
        : 'Write all text output in English.'

    const file = formData.get('file') as File | null
    if (!file) return { success: false, error: 'No file provided' }
    if (file.size > 5 * 1024 * 1024) return { success: false, error: 'File exceeds 5 MB limit' }

    let extractedText: string
    const buffer = Buffer.from(await file.arrayBuffer())

    if (file.name.endsWith('.pdf')) {
        const model = await getModel()
        const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')
        const extractResult = await model.generateContent([
            { inlineData: { mimeType: 'application/pdf', data: base64 } },
            'Extract all text content from this PDF document. Return ONLY the raw text, no commentary.',
        ])
        extractedText = extractResult.response.text() ?? ''
    } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value
    } else {
        return { success: false, error: 'Unsupported file format. Use PDF or DOCX.' }
    }

    if (!extractedText || extractedText.trim().length < 50) {
        return { success: false, error: 'Could not extract sufficient text from the file.' }
    }

    const supabase = ctx.supabase
    const { data: defaultStructure } = await supabase
        .from('leveling_structures')
        .select('id')
        .eq('is_default', true)
        .single()

    let levels: LevelDefinition[] = []
    if (defaultStructure) {
        const { data } = await supabase
            .from('level_definitions')
            .select('*')
            .eq('structure_id', defaultStructure.id)
            .order('sort_order')
        levels = (data as LevelDefinition[]) || []
    }

    if (!levels.length) {
        return { success: false, error: 'No leveling structure found. Set up levels first.' }
    }

    // Fetch job families and competencies for matching
    const { data: familiesData } = await supabase
        .from('job_families')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
    const families = (familiesData as JobFamily[]) || []

    const { data: compsData } = await supabase
        .from('competencies')
        .select('*')
        .eq('is_active', true)
    const competencies = (compsData as Competency[]) || []

    const levelsContext = levels.map(l =>
        `${l.level_code} (${l.title_examples || ''}): ${l.description || ''}
  - Problem Solving: ${l.problem_solving || ''}
  - Accountability: ${l.accountability || ''}
  - People Management: ${l.people_management || ''}
  - Knowledge & Expertise: ${l.knowledge_expertise || ''}
  - Communication & Influence: ${l.communication_influence || ''}
  - Autonomy & Decision Rights: ${l.autonomy_decision_rights || ''}`
    ).join('\n\n')

    const familyNames = families.map(f => f.name).join(', ')
    const competencyList = competencies.map(c => `${c.id}: ${c.name}`).join('\n')

    const prompt = `You are an expert HR job evaluation and competency assessment analyst. Analyse this job description.
${langInstruction}

JOB LEVEL DEFINITIONS:
${levelsContext}

AVAILABLE JOB FAMILIES:
${familyNames}

AVAILABLE COMPETENCIES:
${competencyList || 'None defined'}

JOB DESCRIPTION TEXT:
"""
${extractedText.substring(0, 12000)}
"""

Tasks:
1. Determine the best matching job level
2. Determine the best matching job family
3. Extract job details (title, summary, responsibilities, qualifications)
4. For each relevant competency, assess the required_level (1-5 scale based on the job's complexity and the suggested level) and importance ("critical", "important", or "nice_to_have")

Level scale for competencies:
- 1-2: Entry/junior roles (L1-L2)
- 3: Professional roles (L3-L4)
- 4: Senior/lead roles (L5-L6)
- 5: Director+ roles (L7-L10)

Only include competencies that are genuinely relevant to this role. Do NOT include all competencies.

Return ONLY valid JSON (no markdown):
{
  "suggested_level_code": "Best matching level code",
  "suggested_family_name": "Best matching job family name",
  "confidence": 0.0-1.0,
  "reasoning": "2-3 sentence explanation",
  "extracted_title": "Job title or null",
  "extracted_summary": "1-2 sentence role summary",
  "extracted_responsibilities": ["..."],
  "extracted_qualifications": ["..."],
  "suggested_competencies": [{"competency_id": "uuid", "required_level": 1-5, "importance": "critical|important|nice_to_have"}]
}`

    try {
        const model = await getModel()
        const response = await model.generateContent(prompt)
        const raw = await parseJSON<{
            suggested_level_code: string
            suggested_family_name: string | null
            confidence: number
            reasoning: string
            extracted_title: string | null
            extracted_summary: string | null
            extracted_responsibilities: string[]
            extracted_qualifications: string[]
            suggested_competencies?: Array<{ competency_id: string; required_level: number; importance: string }>
        }>(response.response.text() ?? '')

        const matchedLevel = levels.find(l => l.level_code === raw.suggested_level_code)
        const matchedFamily = matchFamilyByName(raw.suggested_family_name ?? '', families)

        // Build competency IDs from AI suggestion (validated against actual competency list)
        const validCompIds = new Set(competencies.map(c => c.id))
        const suggestedCompIds = (raw.suggested_competencies ?? [])
            .filter(sc => validCompIds.has(sc.competency_id))
            .map(sc => sc.competency_id)

        return {
            success: true,
            data: {
                suggested_level_id: matchedLevel?.id ?? null,
                suggested_level_code: raw.suggested_level_code,
                suggested_family_id: matchedFamily?.id ?? null,
                suggested_family_name: raw.suggested_family_name ?? null,
                confidence: raw.confidence,
                reasoning: raw.reasoning,
                extracted_title: raw.extracted_title,
                extracted_summary: raw.extracted_summary ?? null,
                extracted_responsibilities: raw.extracted_responsibilities || [],
                extracted_qualifications: raw.extracted_qualifications || [],
                suggested_competency_ids: suggestedCompIds,
                suggested_competencies: (raw.suggested_competencies ?? [])
                    .filter(sc => validCompIds.has(sc.competency_id)),
            },
        }
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Analysis failed' }
    }
}
