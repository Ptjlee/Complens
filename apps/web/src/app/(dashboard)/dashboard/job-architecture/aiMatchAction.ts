'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminRoleAction } from '@/lib/api/planGuard'
import { getModel, parseJSON } from './aiHelpers'
import type { AutoMapResult } from './autoMapAction'

// ── Types ───────────────────────────────────────────────────

type AiMatchRow = {
    employee_id: string
    job_id: string
    confidence: number
    reasoning: string
}

type Employee = {
    id: string
    employee_ref: string
    first_name: string | null
    last_name: string | null
    department: string | null
    job_grade: string | null
    job_title: string | null
}

type JobForAi = {
    id: string
    title: string
    family_name: string | null
    level_code: string | null
    description: string | null
}

// ── Batch size constant ─────────────────────────────────────

const AI_BATCH_SIZE = 12

// ── Build prompt ────────────────────────────────────────────

function buildPrompt(
    jobs: JobForAi[],
    batch: Employee[],
    lang: 'German' | 'English',
): string {
    const jobBlock = jobs
        .map(j => `- ID: ${j.id} | Title: ${j.title} | Family: ${j.family_name ?? 'N/A'} | Level: ${j.level_code ?? 'N/A'} | Desc: ${j.description ?? 'N/A'}`)
        .join('\n')

    const empBlock = batch
        .map(e => `- ID: ${e.id} | Title: ${e.job_title ?? 'N/A'} | Dept: ${e.department ?? 'N/A'} | Grade: ${e.job_grade ?? 'N/A'}`)
        .join('\n')

    return `You are an expert HR job classification analyst. Match each employee to the most appropriate job from the organisation's job architecture.

JOBS AVAILABLE:
${jobBlock}

EMPLOYEES TO MATCH:
${empBlock}

For each employee, return the best matching job. Consider:
1. Job title similarity (most important)
2. Department vs. job family alignment (note: department and family are not always the same)
3. Job grade vs. level alignment (if grade mappings exist)

If no job is a reasonable match, set job_id to null and confidence to 0.

Return ONLY valid JSON array:
[{"employee_id":"...","job_id":"...","confidence":0.0,"reasoning":"..."}]

Write reasoning in ${lang}. Keep each reasoning under 30 words.`
}

// ── Server action: AI matching ──────────────────────────────

export async function runAiMatching(
    datasetId: string,
    employeeIds: string[],
): Promise<
    { success: true; data: AutoMapResult[] } | { success: false; error: string }
> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    if (employeeIds.length === 0) {
        return { success: true, data: [] }
    }

    // Read locale
    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'de'
    const lang = locale === 'en' ? 'English' as const : 'German' as const

    const admin = createAdminClient()

    // Fetch the specified employees
    const { data: employees, error: empErr } = await admin
        .from('employees')
        .select('id, employee_ref, first_name, last_name, department, job_grade, job_title')
        .eq('dataset_id', datasetId)
        .in('id', employeeIds)

    if (empErr) return { success: false, error: empErr.message }
    if (!employees?.length) return { success: false, error: 'No employees found' }

    // Fetch all jobs with families and levels
    const supabase = await createClient()
    const { data: rawJobs, error: jobErr } = await supabase
        .from('jobs')
        .select('id, title, family_id, level_id, jd_summary, job_family:job_families(name), level_definition:level_definitions(level_code)')
        .eq('org_id', auth.orgId)
        .eq('is_active', true)

    if (jobErr) return { success: false, error: jobErr.message }
    if (!rawJobs?.length) return { success: false, error: 'No jobs defined' }

    const jobs: JobForAi[] = rawJobs.map(j => {
        const family = Array.isArray(j.job_family) ? j.job_family[0] : j.job_family
        const level = Array.isArray(j.level_definition) ? j.level_definition[0] : j.level_definition
        return {
            id: j.id,
            title: j.title,
            family_name: (family as { name: string } | null)?.name ?? null,
            level_code: (level as { level_code: string } | null)?.level_code ?? null,
            description: j.jd_summary,
        }
    })

    // Build a lookup map for job titles
    const jobMap = new Map(rawJobs.map(j => [j.id, j.title]))

    // Process in batches
    const allResults: AutoMapResult[] = []
    const typedEmployees = employees as Employee[]

    for (let i = 0; i < typedEmployees.length; i += AI_BATCH_SIZE) {
        const batch = typedEmployees.slice(i, i + AI_BATCH_SIZE)
        const prompt = buildPrompt(jobs, batch, lang)

        try {
            const model = await getModel()
            const response = await model.generateContent(prompt)
            const text = response.response.text() ?? ''
            const parsed = await parseJSON<AiMatchRow[]>(text)

            for (const match of parsed) {
                const emp = batch.find(e => e.id === match.employee_id)
                if (!emp) continue

                const nameParts = [emp.first_name, emp.last_name].filter(Boolean)

                allResults.push({
                    employee_id: emp.id,
                    employee_ref: emp.employee_ref,
                    employee_name: nameParts.length > 0 ? nameParts.join(' ') : null,
                    department: emp.department,
                    job_grade: emp.job_grade,
                    job_title: emp.job_title,
                    suggested_job_id: match.job_id,
                    suggested_job_title: match.job_id ? (jobMap.get(match.job_id) ?? null) : null,
                    confidence: Math.round(Math.min(1, Math.max(0, match.confidence)) * 100) / 100,
                    match_reason: match.reasoning || 'AI suggestion',
                    tier: 4,
                })
            }
        } catch (err) {
            // On batch failure, add unmatched entries for remaining employees
            for (const emp of batch) {
                if (allResults.some(r => r.employee_id === emp.id)) continue
                const nameParts = [emp.first_name, emp.last_name].filter(Boolean)
                allResults.push({
                    employee_id: emp.id,
                    employee_ref: emp.employee_ref,
                    employee_name: nameParts.length > 0 ? nameParts.join(' ') : null,
                    department: emp.department,
                    job_grade: emp.job_grade,
                    job_title: emp.job_title,
                    suggested_job_id: null,
                    suggested_job_title: null,
                    confidence: 0,
                    match_reason: `AI error: ${err instanceof Error ? err.message : 'Unknown'}`,
                    tier: 4,
                })
            }
        }
    }

    return { success: true, data: allResults }
}
