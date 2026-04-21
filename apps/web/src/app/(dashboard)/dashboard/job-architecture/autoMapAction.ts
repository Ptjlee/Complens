'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminRoleAction } from '@/lib/api/planGuard'

const JA_PATH = '/dashboard/job-architecture'

// ── Types ───────────────────────────────────────────────────

export type AutoMapResult = {
    employee_id: string
    employee_ref: string
    employee_name: string | null
    department: string | null
    job_grade: string | null
    job_title: string | null
    suggested_job_id: string | null
    suggested_job_title: string | null
    confidence: number
    match_reason: string
    tier: 1 | 2 | 3 | 4
}

export type AutoMapSummary = {
    results: AutoMapResult[]
    total: number
    highConfidence: number
    needsReview: number
    noMatch: number
    aiSuggested: number
}

// ── Title matching utilities ────────────────────────────────

function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-zäöüß0-9\s]/g, '')
        .replace(
            /\b(senior|junior|lead|staff|principal|chief|head|leiter|leiterin|stellvertretend)\b/g,
            '',
        )
        .replace(/\s+/g, ' ')
        .trim()
}

function titleSimilarity(a: string, b: string): number {
    const na = normalizeTitle(a)
    const nb = normalizeTitle(b)
    if (!na || !nb) return 0

    // Exact match after normalization
    if (na === nb) return 0.95

    // Containment match
    if (na.includes(nb) || nb.includes(na)) return 0.85

    // Word overlap (Jaccard similarity)
    const wordsA = new Set(na.split(/\s+/).filter(Boolean))
    const wordsB = new Set(nb.split(/\s+/).filter(Boolean))
    const intersection = [...wordsA].filter(w => wordsB.has(w))
    const union = new Set([...wordsA, ...wordsB])
    if (union.size === 0) return 0
    return intersection.length / union.size
}

// ── Core auto-mapping logic ─────────────────────────────────

type Employee = {
    id: string
    employee_ref: string
    first_name: string | null
    last_name: string | null
    department: string | null
    job_grade: string | null
    job_title: string | null
}

type JobRow = {
    id: string
    title: string
    level_id: string | null
    family_id: string
    job_family?: { name: string } | null
    level_definition?: { level_code: string } | null
}

type GradeMapping = {
    level_id: string
    mapped_grade: string
}

function buildEmployeeName(e: Employee): string | null {
    const parts = [e.first_name, e.last_name].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : null
}

function titleFallback(
    base: Omit<AutoMapResult, 'suggested_job_id' | 'suggested_job_title' | 'confidence' | 'match_reason' | 'tier'>,
    emp: Employee,
    allJobs: JobRow[],
    reason: string,
): AutoMapResult {
    if (!emp.job_title || allJobs.length === 0) {
        return { ...base, suggested_job_id: null, suggested_job_title: null, confidence: 0, match_reason: reason, tier: 4 }
    }
    const scored = allJobs
        .map(j => ({ job: j, sim: titleSimilarity(emp.job_title!, j.title) }))
        .sort((a, b) => b.sim - a.sim)
    if (scored[0] && scored[0].sim >= 0.4) {
        const confidence = Math.min(0.55, 0.30 + scored[0].sim * 0.25)
        return {
            ...base,
            suggested_job_id: scored[0].job.id,
            suggested_job_title: scored[0].job.title,
            confidence: Math.round(confidence * 100) / 100,
            match_reason: `Title match (${Math.round(scored[0].sim * 100)}%) — ${reason}`,
            tier: 3,
        }
    }
    return { ...base, suggested_job_id: null, suggested_job_title: null, confidence: 0, match_reason: reason, tier: 4 }
}

function matchEmployee(
    emp: Employee,
    jobs: JobRow[],
    gradeMappings: GradeMapping[],
): AutoMapResult {
    const base: Omit<AutoMapResult, 'suggested_job_id' | 'suggested_job_title' | 'confidence' | 'match_reason' | 'tier'> = {
        employee_id: emp.id,
        employee_ref: emp.employee_ref,
        employee_name: buildEmployeeName(emp),
        department: emp.department,
        job_grade: emp.job_grade,
        job_title: emp.job_title,
    }

    // Find which level IDs correspond to the employee's grade
    const grade = emp.job_grade?.trim()
    if (!grade) {
        return titleFallback(base, emp, jobs, 'No grade')
    }

    const matchedLevelIds = gradeMappings
        .filter(gm => gm.mapped_grade.toLowerCase() === grade.toLowerCase())
        .map(gm => gm.level_id)

    if (matchedLevelIds.length === 0) {
        return titleFallback(base, emp, jobs, 'Grade not mapped')
    }

    // Find jobs at those levels
    const jobsAtLevel = jobs.filter(j => j.level_id && matchedLevelIds.includes(j.level_id))
    if (jobsAtLevel.length === 0) {
        return titleFallback(base, emp, jobs, 'No jobs at level')
    }

    // TIER 1: Grade + title match
    if (emp.job_title) {
        const scored = jobsAtLevel
            .map(j => ({ job: j, sim: titleSimilarity(emp.job_title!, j.title) }))
            .sort((a, b) => b.sim - a.sim)

        if (scored[0] && scored[0].sim >= 0.5) {
            const confidence = Math.min(0.95, 0.90 + scored[0].sim * 0.05)
            return {
                ...base,
                suggested_job_id: scored[0].job.id,
                suggested_job_title: scored[0].job.title,
                confidence: Math.round(confidence * 100) / 100,
                match_reason: `Grade + title (${Math.round(scored[0].sim * 100)}%)`,
                tier: 1,
            }
        }
    }

    // TIER 2: Grade match, single job at level
    if (jobsAtLevel.length === 1) {
        return {
            ...base,
            suggested_job_id: jobsAtLevel[0].id,
            suggested_job_title: jobsAtLevel[0].title,
            confidence: 0.80,
            match_reason: 'Grade match (single job)',
            tier: 2,
        }
    }

    // TIER 3: Grade match, multiple jobs — pick best title match
    if (emp.job_title) {
        const scored = jobsAtLevel
            .map(j => ({ job: j, sim: titleSimilarity(emp.job_title!, j.title) }))
            .sort((a, b) => b.sim - a.sim)

        const best = scored[0]
        const confidence = Math.min(0.70, 0.50 + best.sim * 0.20)
        return {
            ...base,
            suggested_job_id: best.job.id,
            suggested_job_title: best.job.title,
            confidence: Math.round(confidence * 100) / 100,
            match_reason: `Grade match, best title (${Math.round(best.sim * 100)}%)`,
            tier: 3,
        }
    }

    // TIER 3: Grade match, multiple jobs, no title to compare
    return {
        ...base,
        suggested_job_id: jobsAtLevel[0].id,
        suggested_job_title: jobsAtLevel[0].title,
        confidence: 0.50,
        match_reason: 'Grade match (multiple jobs, no title)',
        tier: 3,
    }
}

// ── Server action: run auto-mapping ─────────────────────────

export async function runAutoMapping(datasetId: string): Promise<
    { success: true; data: AutoMapSummary } | { success: false; error: string }
> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const admin = createAdminClient()

    // Fetch employees
    const { data: employees, error: empErr } = await admin
        .from('employees')
        .select('id, employee_ref, first_name, last_name, department, job_grade, job_title')
        .eq('dataset_id', datasetId)

    if (empErr) return { success: false, error: empErr.message }
    if (!employees?.length) return { success: false, error: 'No employees found' }

    // Exclude already-assigned employees
    const { data: existingAssignments } = await admin
        .from('employee_job_assignments')
        .select('employee_id')
        .eq('dataset_id', datasetId)
        .eq('status', 'confirmed')
    const assignedIds = new Set((existingAssignments ?? []).map((a: { employee_id: string }) => a.employee_id))
    const unassignedEmployees = employees.filter(e => !assignedIds.has(e.id))
    if (!unassignedEmployees.length) return { success: false, error: 'All employees are already assigned' }

    // Fetch jobs with their level and family
    const supabase = await createClient()
    const { data: jobs, error: jobErr } = await supabase
        .from('jobs')
        .select('id, title, level_id, family_id, job_family:job_families(name), level_definition:level_definitions(level_code)')
        .eq('org_id', auth.orgId)
        .eq('is_active', true)

    if (jobErr) return { success: false, error: jobErr.message }
    if (!jobs?.length) return { success: false, error: 'No jobs defined in job architecture' }

    // Fetch grade mappings
    const { data: gradeMappings, error: gmErr } = await supabase
        .from('job_grade_mappings')
        .select('level_id, mapped_grade')
        .eq('org_id', auth.orgId)

    if (gmErr) return { success: false, error: gmErr.message }

    // Run matching for each unassigned employee
    const results: AutoMapResult[] = unassignedEmployees.map(emp =>
        matchEmployee(emp as Employee, jobs as unknown as JobRow[], (gradeMappings ?? []) as GradeMapping[]),
    )

    const highConfidence = results.filter(r => r.tier === 1 || r.tier === 2).length
    const needsReview = results.filter(r => r.tier === 3).length
    const noMatch = results.filter(r => r.tier === 4 && r.confidence === 0).length

    return {
        success: true,
        data: {
            results,
            total: results.length,
            highConfidence,
            needsReview,
            noMatch,
            aiSuggested: 0,
        },
    }
}

// ── Server action: save confirmed results ───────────────────

export async function saveAutoMapResults(
    datasetId: string,
    results: Array<{
        employee_id: string
        job_id: string
        confidence: number
        match_reason: string
        status: 'confirmed' | 'pending'
    }>,
): Promise<{ success: true; saved: number } | { success: false; error: string }> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    if (results.length === 0) return { success: true, saved: 0 }

    const admin = createAdminClient()

    const rows = results.map(r => ({
        employee_id: r.employee_id,
        dataset_id: datasetId,
        job_id: r.job_id,
        org_id: auth.orgId,
        confidence: r.confidence,
        match_reason: r.match_reason,
        status: r.status,
        source: 'auto' as const,
    }))

    const { error } = await admin
        .from('employee_job_assignments')
        .upsert(rows, { onConflict: 'employee_id,dataset_id' })

    if (error) return { success: false, error: error.message }

    revalidatePath(JA_PATH)
    return { success: true, saved: rows.length }
}
