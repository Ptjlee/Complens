'use server'

import type {
    AssistantGeneratedJD,
    AssistantGeneratedStructure,
    LevelDefinition,
} from '@/lib/jobArchitecture/types'
import { cookies } from 'next/headers'
import { getOrgContext, getModel, parseJSON } from './aiHelpers'

// ============================================================
// Generate Job Description
// ============================================================

export async function generateJobDescriptionAction(input: {
    jobTitle: string
    jobFamily: string
    levelCode: string
    levelDetails?: LevelDefinition | null
    currentData?: { summary?: string; responsibilities?: string; qualifications?: string } | null
    competencyNames?: string[]
}): Promise<{ success: true; data: AssistantGeneratedJD } | { success: false; error: string }> {
    const ctx = await getOrgContext()
    if ('error' in ctx) return { success: false, error: ctx.error }

    const levelContext = input.levelDetails ? `
Level Context (${input.levelCode}):
- Scope: ${input.levelDetails.description || ''}
- Problem Solving: ${input.levelDetails.problem_solving || ''}
- Accountability: ${input.levelDetails.accountability || ''}
- People Management: ${input.levelDetails.people_management || ''}
- Knowledge & Expertise: ${input.levelDetails.knowledge_expertise || ''}
- Communication & Influence: ${input.levelDetails.communication_influence || ''}
- Autonomy & Decision Rights: ${input.levelDetails.autonomy_decision_rights || ''}` : ''

    const refinementContext = input.currentData?.summary || input.currentData?.responsibilities
        ? `\nIMPORTANT: The user has already provided a draft. POLISH and ENHANCE it, do not discard.
Current Draft:
Summary: ${input.currentData.summary || '(None)'}
Responsibilities: ${input.currentData.responsibilities || '(None)'}
Qualifications: ${input.currentData.qualifications || '(None)'}` : ''

    const libraryContext = input.competencyNames?.length
        ? `\nAVAILABLE COMPETENCY LIBRARY — select 3-5 relevant competencies (exact spelling):
${input.competencyNames.map(n => `- ${n}`).join('\n')}` : ''

    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'de'
    const langRule = locale === 'de'
        ? 'Write ALL output text in German (formal Sie-Form). This is mandatory regardless of input language.'
        : 'Write ALL output text in English (British).'

    const prompt = `Task: ${refinementContext ? 'Refine' : 'Generate'} a professional INTERNAL Job Definition for "${input.jobTitle}" (Level: ${input.levelCode}) in the "${input.jobFamily}" family.
${langRule}
${levelContext}${refinementContext}${libraryContext}

TONE & FORMAT RULES:
1. INTERNAL HR MANAGEMENT — NOT a public job advertisement.
2. AVOID recruiter-speak: NO "We are seeking", "Join our team", etc.
3. Use OBJECTIVE, THIRD-PERSON descriptions.
4. Keep it CONCISE. Max 4-6 responsibilities, 3-5 qualifications.

COMPETENCY LEVEL GUIDELINES (1-5 scale):
- Level 1-2: Entry/junior roles (${input.levelCode.startsWith('L1') || input.levelCode.startsWith('L2') ? 'THIS ROLE' : 'not this role'})
- Level 3: Professional roles (${input.levelCode === 'L3' || input.levelCode === 'L4' ? 'THIS ROLE' : 'not this role'})
- Level 4: Senior/lead roles (${input.levelCode === 'L5' || input.levelCode === 'L6' ? 'THIS ROLE' : 'not this role'})
- Level 5: Director+ roles (${['L7','L8','L9','L10'].includes(input.levelCode) ? 'THIS ROLE' : 'not this role'})

Set competency levels appropriate to the job level. Do NOT default everything to 3.

Return ONLY valid JSON:
{
  "summary": "2-3 sentence internal role overview",
  "responsibilities": ["..."],
  "qualifications": ["..."],
  "suggested_competencies": [{"name": "Exact name from library", "level": 1-5, "importance": "critical|important|nice_to_have", "reason": "..."}]
}`

    try {
        const model = await getModel()
        const response = await model.generateContent(prompt)
        const data = await parseJSON<AssistantGeneratedJD>(response.response.text() ?? '')
        return { success: true, data }
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Generation failed' }
    }
}

// ============================================================
// Generate Competency Description
// ============================================================

export async function generateCompetencyDescriptionAction(input: {
    name: string
    category: string
}): Promise<{ success: true; data: string } | { success: false; error: string }> {
    const ctx = await getOrgContext()
    if ('error' in ctx) return { success: false, error: ctx.error }

    const prompt = `You are an HR competency library writer.
Write a concise, professional 1-2 sentence definition for the "${input.name}" competency (category: ${input.category}).
Return ONLY the plain definition text, no JSON or formatting.`

    try {
        const model = await getModel()
        const response = await model.generateContent(prompt)
        const text = (response.response.text() ?? '').trim().replace(/^["""']+|["""']+$/g, '')
        if (!text || text.length < 15) throw new Error('Empty response')
        return { success: true, data: text }
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Generation failed' }
    }
}

// ============================================================
// Generate Competency Behaviours
// ============================================================

export async function generateCompetencyBehavioursAction(input: {
    name: string
    category: string
    level: number
}): Promise<{ success: true; data: string[] } | { success: false; error: string }> {
    const ctx = await getOrgContext()
    if ('error' in ctx) return { success: false, error: ctx.error }

    const levelNames = ['', 'Beginner', 'Developing', 'Proficient', 'Advanced', 'Master']
    const levelName = levelNames[input.level] || `Level ${input.level}`

    const prompt = `Generate 4 observable behavioural indicators for "${input.name}" at "${levelName}" (${input.level}/5).
Category: ${input.category}. Each: concise verb-led sentence, under 20 words, observable by a manager.
Return ONLY valid JSON: { "behaviours": ["...", "...", "...", "..."] }`

    try {
        const model = await getModel()
        const response = await model.generateContent(prompt)
        const data = await parseJSON<{ behaviours: string[] }>(response.response.text() ?? '')
        return { success: true, data: data.behaviours }
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Generation failed' }
    }
}

// ============================================================
// Generate Leveling Structure
// ============================================================

export async function generateLevelingStructureAction(input: {
    industry: string
    companySize: string
    existingScheme: string
    levelCount: string
    requirements: string
}): Promise<{ success: true; data: AssistantGeneratedStructure } | { success: false; error: string }> {
    const ctx = await getOrgContext()
    if ('error' in ctx) return { success: false, error: ctx.error }

    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'de'
    const lang = locale === 'en' ? 'English' : 'German (formal Sie-Form)'

    const prompt = `You are an expert HR organisational design consultant. Generate a job leveling structure.

Organisation: ${input.industry}, ${input.companySize} employees.
Existing grading: ${input.existingScheme || 'None'}. Desired levels: ${input.levelCount || '8-12'}.
Requirements: ${input.requirements || 'None'}.

Write all text content in ${lang}.

Per level provide these fields (keep each field to 1 sentence, max 20 words):
- level_code, sort_order (integer starting at 0), title_examples, description
- problem_solving, accountability, people_management
- knowledge_expertise, communication_influence, autonomy_decision_rights

Return ONLY valid JSON (no markdown, no backticks):
{"name":"...","description":"...","levels":[{"level_code":"...","sort_order":0,"title_examples":"...","description":"...","problem_solving":"...","accountability":"...","people_management":"...","knowledge_expertise":"...","communication_influence":"...","autonomy_decision_rights":"..."}]}`

    try {
        const model = await getModel()
        const response = await model.generateContent(prompt)
        const data = await parseJSON<AssistantGeneratedStructure>(response.response.text() ?? '')
        return { success: true, data }
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Generation failed' }
    }
}
