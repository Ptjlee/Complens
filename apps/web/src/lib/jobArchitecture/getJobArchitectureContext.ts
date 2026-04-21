'use server'

import { createClient } from '@/lib/supabase/server'
import type {
    JobArchitectureContext,
    LevelingStructure,
    LevelDefinition,
    DefaultLevelDefinition,
    JobFamily,
    Job,
    Competency,
    JobGradeMapping,
    SalaryBandRef,
    DatasetRef,
} from '@/lib/jobArchitecture/types'

// ============================================================
// canUseJobArchitecture — check if org has access
// ============================================================

export async function canUseJobArchitecture(): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: org } = await supabase
        .from('organisations')
        .select('plan, trial_ends_at, job_architecture_enabled')
        .single()

    if (!org) return false

    // Access: explicit feature flag OR active trial (licensed users must purchase add-on)
    if (org.job_architecture_enabled) return true

    const onTrial =
        org.plan === 'trial' &&
        org.trial_ends_at != null &&
        new Date(org.trial_ends_at) > new Date()

    return onTrial
}

// ============================================================
// getJobArchitectureContext — single source of truth
// ============================================================

export async function getJobArchitectureContext(): Promise<JobArchitectureContext> {
    const empty: JobArchitectureContext = {
        structures: [],
        levels: [],
        defaultLevels: [],
        jobFamilies: [],
        jobs: [],
        competencies: [],
        gradeMappings: [],
        salaryBands: [],
        datasets: [],
        assignmentCounts: {},
        hasData: false,
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return empty

    // Resolve org_id
    const { data: member } = await supabase
        .from('organisation_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single()

    if (!member?.org_id) return empty

    const orgId = member.org_id

    // Parallel fetches
    const [
        { data: structures },
        { data: levels },
        { data: defaultLevels },
        { data: jobFamilies },
        { data: jobs },
        { data: competencies },
        { data: gradeMappings },
        { data: salaryBands },
        { data: datasets },
        { data: assignmentRows },
    ] = await Promise.all([
        supabase
            .from('leveling_structures')
            .select('*')
            .eq('org_id', orgId)
            .order('is_default', { ascending: false })
            .order('name'),

        supabase
            .from('level_definitions')
            .select('*')
            .eq('org_id', orgId)
            .order('sort_order'),

        supabase
            .from('default_level_definitions')
            .select('*')
            .order('level'),

        supabase
            .from('job_families')
            .select('*')
            .eq('org_id', orgId)
            .eq('is_active', true)
            .order('sort_order'),

        supabase
            .from('jobs')
            .select(`
                *,
                job_family:job_families(*),
                level_definition:level_definitions(*),
                salary_band_grade:salary_band_grades(id, job_grade, min_salary, max_salary, mid_salary)
            `)
            .eq('org_id', orgId)
            .order('title'),

        supabase
            .from('competencies')
            .select('*')
            .eq('org_id', orgId)
            .eq('is_active', true)
            .order('category')
            .order('name'),

        supabase
            .from('job_grade_mappings')
            .select('*')
            .eq('org_id', orgId),

        supabase
            .from('salary_bands')
            .select('id, name, salary_band_grades(id, job_grade)')
            .eq('org_id', orgId)
            .eq('is_active', true),

        supabase
            .from('datasets')
            .select('id, name, reporting_year')
            .eq('org_id', orgId)
            .order('reporting_year', { ascending: false }),

        supabase
            .from('employee_job_assignments')
            .select('job_id')
            .eq('org_id', orgId)
            .eq('status', 'confirmed'),
    ])

    const hasData =
        (structures?.length ?? 0) > 0 ||
        (jobFamilies?.length ?? 0) > 0 ||
        (jobs?.length ?? 0) > 0

    // Aggregate assignment counts per job
    const assignmentCounts: Record<string, number> = {}
    for (const row of assignmentRows ?? []) {
        const r = row as { job_id: string }
        assignmentCounts[r.job_id] = (assignmentCounts[r.job_id] ?? 0) + 1
    }

    return {
        structures:    (structures ?? []) as LevelingStructure[],
        levels:        (levels ?? []) as LevelDefinition[],
        defaultLevels: (defaultLevels ?? []) as DefaultLevelDefinition[],
        jobFamilies:   (jobFamilies ?? []) as JobFamily[],
        jobs:          (jobs ?? []) as Job[],
        competencies:  (competencies ?? []) as Competency[],
        gradeMappings: (gradeMappings ?? []) as JobGradeMapping[],
        salaryBands:   (salaryBands ?? []).map((sb: { id: string; name: string; salary_band_grades: { id: string; job_grade: string }[] }) => ({ id: sb.id, name: sb.name, grades: sb.salary_band_grades })) as SalaryBandRef[],
        datasets:      (datasets ?? []) as DatasetRef[],
        assignmentCounts,
        hasData,
    }
}
