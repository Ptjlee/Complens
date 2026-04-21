'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminRoleAction } from '@/lib/api/planGuard'
import { normalize, buildName, NO_CHANGE_FLAGS, titleSimilarity } from './carryoverTypes'
import type { CarryoverResult, CarryoverSummary } from './carryoverTypes'

export type { CarryoverResult, CarryoverSummary } from './carryoverTypes'

const JA_PATH = '/dashboard/job-architecture'

// ── Link employee identities ────────────────────────────────

export async function linkEmployeeIdentities(
    datasetId: string,
): Promise<{ success: true; linked: number } | { success: false; error: string }> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const admin = createAdminClient()

    // Verify dataset belongs to caller's org
    const { data: ds } = await admin.from('datasets').select('id').eq('id', datasetId).eq('org_id', auth.orgId).single()
    if (!ds) return { success: false, error: 'Dataset not found in your org.' }

    const { data: employees, error: empErr } = await admin
        .from('employees')
        .select('id, org_id, employee_ref, first_name, last_name')
        .eq('dataset_id', datasetId)
        .eq('org_id', auth.orgId)

    if (empErr) return { success: false, error: empErr.message }
    if (!employees?.length) return { success: true, linked: 0 }

    let linked = 0
    for (const emp of employees) {
        if (!emp.employee_ref?.trim()) continue
        const canonicalName = [emp.last_name, emp.first_name].filter(Boolean).join(', ')
        const { data: identity, error: upsertErr } = await admin
            .from('employee_identities')
            .upsert(
                { org_id: emp.org_id, employee_ref: emp.employee_ref.trim(), canonical_name: canonicalName, last_seen_dataset_id: datasetId },
                { onConflict: 'org_id,employee_ref' },
            )
            .select('id')
            .single()
        if (upsertErr) continue
        await admin.from('employees').update({ identity_id: identity.id }).eq('id', emp.id)
        linked++
    }
    return { success: true, linked }
}

// ── Get carryover source datasets ───────────────────────────

export async function getCarryoverSourceDatasets(targetDatasetId: string): Promise<
    { success: true; data: Array<{ id: string; name: string; reporting_year: number; assignmentCount: number }> }
    | { success: false; error: string }
> {
    const supabase = await createClient()
    const { data: target, error: tErr } = await supabase
        .from('datasets').select('org_id, reporting_year').eq('id', targetDatasetId).single()
    if (tErr || !target) return { success: false, error: tErr?.message ?? 'Dataset not found' }

    const { data: datasets, error: dsErr } = await supabase
        .from('datasets').select('id, name, reporting_year')
        .eq('org_id', target.org_id).neq('id', targetDatasetId)
        .order('reporting_year', { ascending: false })
    if (dsErr) return { success: false, error: dsErr.message }

    const results: Array<{ id: string; name: string; reporting_year: number; assignmentCount: number }> = []
    for (const ds of datasets ?? []) {
        const { count } = await supabase
            .from('employee_job_assignments')
            .select('id', { count: 'exact', head: true })
            .eq('dataset_id', ds.id).eq('status', 'confirmed')
        if ((count ?? 0) > 0) {
            results.push({ id: ds.id, name: ds.name, reporting_year: ds.reporting_year, assignmentCount: count ?? 0 })
        }
    }
    return { success: true, data: results }
}

// ── Run carryover ───────────────────────────────────────────

type EmpRow = { id: string; identity_id: string | null; employee_ref: string | null; first_name: string | null; last_name: string | null; department: string | null; job_grade: string | null; job_title: string | null }
type SourceRecord = { emp: EmpRow; jobId: string; jobTitle: string }

function buildSourceMaps(sourceEmps: EmpRow[], sourceAssignments: Array<{ employee_id: string; job_id: string; job: { title: string } | null }>) {
    const byIdentity = new Map<string, SourceRecord>()
    const byNameDept = new Map<string, SourceRecord>()
    const byName = new Map<string, SourceRecord>()
    for (const sa of sourceAssignments) {
        const emp = sourceEmps.find(e => e.id === sa.employee_id)
        if (!emp) continue
        const rec: SourceRecord = { emp, jobId: sa.job_id, jobTitle: sa.job?.title ?? '' }
        if (emp.identity_id) byIdentity.set(emp.identity_id, rec)
        byNameDept.set(`${normalize(emp.last_name)}|${normalize(emp.first_name)}|${normalize(emp.department)}`, rec)
        byName.set(`${normalize(emp.last_name)}|${normalize(emp.first_name)}`, rec)
    }
    return { byIdentity, byNameDept, byName }
}

function matchTarget(te: EmpRow, maps: ReturnType<typeof buildSourceMaps>): { match: SourceRecord; method: CarryoverResult['match_method']; confidence: number } | null {
    if (te.identity_id) {
        const m = maps.byIdentity.get(te.identity_id)
        if (m) return { match: m, method: 'employee_ref', confidence: 0.98 }
    }
    const ndKey = `${normalize(te.last_name)}|${normalize(te.first_name)}|${normalize(te.department)}`
    const nd = maps.byNameDept.get(ndKey)
    if (nd) return { match: nd, method: 'name_department', confidence: 0.80 }
    const nKey = `${normalize(te.last_name)}|${normalize(te.first_name)}`
    const n = maps.byName.get(nKey)
    if (n) return { match: n, method: 'name_only', confidence: 0.60 }
    return null
}

export async function runCarryover(
    targetDatasetId: string, sourceDatasetId: string,
): Promise<{ success: true; data: CarryoverSummary } | { success: false; error: string }> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }
    const admin = createAdminClient()

    const { data: datasets, error: dsErr } = await admin
        .from('datasets').select('id, name, org_id')
        .in('id', [targetDatasetId, sourceDatasetId]).eq('org_id', auth.orgId)
    if (dsErr) return { success: false, error: dsErr.message }
    if ((datasets ?? []).length !== 2) return { success: false, error: 'One or both datasets not found in your org' }
    const sourceDatasetName = datasets!.find(d => d.id === sourceDatasetId)?.name ?? 'Source'

    await linkEmployeeIdentities(targetDatasetId)
    await linkEmployeeIdentities(sourceDatasetId)

    const { data: rawSA, error: saErr } = await admin
        .from('employee_job_assignments')
        .select('employee_id, job_id, job:jobs(title)')
        .eq('dataset_id', sourceDatasetId).eq('status', 'confirmed')
    if (saErr) return { success: false, error: saErr.message }
    const sourceAssignments = (rawSA ?? []) as unknown as Array<{ employee_id: string; job_id: string; job: { title: string } | null }>

    const { data: rawSE } = await admin.from('employees')
        .select('id, identity_id, employee_ref, first_name, last_name, department, job_grade, job_title')
        .eq('dataset_id', sourceDatasetId)
    const sourceEmps = (rawSE ?? []) as EmpRow[]

    const { data: rawTE } = await admin.from('employees')
        .select('id, identity_id, employee_ref, first_name, last_name, department, job_grade, job_title')
        .eq('dataset_id', targetDatasetId)
    const targetEmps = (rawTE ?? []) as EmpRow[]

    const { data: existingTarget } = await admin.from('employee_job_assignments')
        .select('employee_id').eq('dataset_id', targetDatasetId).eq('status', 'confirmed')
    const alreadyAssigned = new Set((existingTarget ?? []).map(a => a.employee_id))

    // Fetch all active jobs for title re-matching
    const supabase = await createClient()
    const { data: allJobs } = await supabase.from('jobs')
        .select('id, title').eq('org_id', auth.orgId).eq('is_active', true)
    const jobCatalog = (allJobs ?? []) as Array<{ id: string; title: string }>

    const maps = buildSourceMaps(sourceEmps, sourceAssignments)
    const results: CarryoverResult[] = []
    const matchedSourceIds = new Set<string>()

    for (const te of targetEmps) {
        if (alreadyAssigned.has(te.id)) continue
        const hit = matchTarget(te, maps)
        if (hit) {
            matchedSourceIds.add(hit.match.emp.id)
            const tf = normalize(te.job_title) !== normalize(hit.match.emp.job_title)
            const df = normalize(te.department) !== normalize(hit.match.emp.department)
            const gf = normalize(te.job_grade) !== normalize(hit.match.emp.job_grade)

            // When title changed, find best matching job from catalog by new title
            let suggestedJobId = hit.match.jobId
            let suggestedJobTitle = hit.match.jobTitle
            if (tf && te.job_title && jobCatalog.length > 0) {
                const scored = jobCatalog
                    .map(j => ({ job: j, sim: titleSimilarity(te.job_title!, j.title) }))
                    .sort((a, b) => b.sim - a.sim)
                if (scored[0] && scored[0].sim >= 0.4) {
                    suggestedJobId = scored[0].job.id
                    suggestedJobTitle = scored[0].job.title
                }
            }

            results.push({
                employee_id: te.id, source_employee_id: hit.match.emp.id,
                identity_id: te.identity_id ?? hit.match.emp.identity_id ?? '',
                employee_ref: te.employee_ref ?? '', employee_name: buildName(te.first_name, te.last_name),
                department: te.department, job_grade: te.job_grade, job_title: te.job_title,
                carried_job_id: suggestedJobId, carried_job_title: suggestedJobTitle,
                match_method: hit.method, match_confidence: hit.confidence,
                change_flags: { title_changed: tf, department_changed: df, grade_changed: gf },
                previous_title: hit.match.emp.job_title, previous_department: hit.match.emp.department,
                previous_grade: hit.match.emp.job_grade, category: (tf || df || gf) ? 'changed' : 'unchanged',
            })
        } else {
            // New hire — try title matching against job catalog
            let nhJobId = ''
            let nhJobTitle = ''
            if (te.job_title && jobCatalog.length > 0) {
                const scored = jobCatalog
                    .map(j => ({ job: j, sim: titleSimilarity(te.job_title!, j.title) }))
                    .sort((a, b) => b.sim - a.sim)
                if (scored[0] && scored[0].sim >= 0.4) {
                    nhJobId = scored[0].job.id
                    nhJobTitle = scored[0].job.title
                }
            }
            results.push({
                employee_id: te.id, source_employee_id: '', identity_id: te.identity_id ?? '',
                employee_ref: te.employee_ref ?? '', employee_name: buildName(te.first_name, te.last_name),
                department: te.department, job_grade: te.job_grade, job_title: te.job_title,
                carried_job_id: nhJobId, carried_job_title: nhJobTitle,
                match_method: 'employee_ref', match_confidence: 0,
                change_flags: NO_CHANGE_FLAGS, previous_title: null, previous_department: null,
                previous_grade: null, category: 'new_hire',
            })
        }
    }

    // Departed: source employees with assignments not matched to any target employee
    for (const sa of sourceAssignments) {
        if (matchedSourceIds.has(sa.employee_id)) continue
        const emp = sourceEmps.find(e => e.id === sa.employee_id)
        if (!emp) continue
        results.push({
            employee_id: '', source_employee_id: emp.id, identity_id: emp.identity_id ?? '',
            employee_ref: emp.employee_ref ?? '', employee_name: buildName(emp.first_name, emp.last_name),
            department: emp.department, job_grade: emp.job_grade, job_title: emp.job_title,
            carried_job_id: sa.job_id, carried_job_title: sa.job?.title ?? '',
            match_method: 'employee_ref', match_confidence: 0, change_flags: NO_CHANGE_FLAGS,
            previous_title: emp.job_title, previous_department: emp.department,
            previous_grade: emp.job_grade, category: 'departed',
        })
    }

    return {
        success: true,
        data: {
            results, total: results.length,
            unchanged: results.filter(r => r.category === 'unchanged').length,
            changed: results.filter(r => r.category === 'changed').length,
            newHires: results.filter(r => r.category === 'new_hire').length,
            departed: results.filter(r => r.category === 'departed').length,
            sourceDatasetName,
        },
    }
}

// ── Save carryover results ──────────────────────────────────

export async function saveCarryoverResults(
    targetDatasetId: string,
    results: Array<{
        employee_id: string; job_id: string; identity_id: string; source_employee_id: string
        match_method: string; match_confidence: number; change_flags: object
    }>,
    sourceDatasetId?: string,
): Promise<{ success: true; saved: number } | { success: false; error: string }> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }
    if (results.length === 0) return { success: true, saved: 0 }
    const admin = createAdminClient()
    const resolvedSourceId = sourceDatasetId ?? ''

    // Verify target dataset belongs to caller's org
    const { data: ds } = await admin.from('datasets').select('id').eq('id', targetDatasetId).eq('org_id', auth.orgId).single()
    if (!ds) return { success: false, error: 'Dataset not found in your org.' }

    // Verify all employee_ids belong to the target dataset (and thus the org)
    const employeeIds = results.map(r => r.employee_id)
    const { data: validEmps } = await admin.from('employees')
        .select('id').eq('dataset_id', targetDatasetId).in('id', employeeIds)
    const validIds = new Set((validEmps ?? []).map(e => e.id))
    const verified = results.filter(r => validIds.has(r.employee_id))
    if (verified.length === 0) return { success: false, error: 'No valid employees found.' }

    for (const r of verified) {
        const { error: assignErr } = await admin.from('employee_job_assignments').upsert({
            org_id: auth.orgId, employee_id: r.employee_id, job_id: r.job_id,
            dataset_id: targetDatasetId, source: 'carryover', status: 'confirmed',
            assigned_by: auth.userId, confidence: r.match_confidence,
            match_reason: `Carryover (${r.match_method})`, updated_at: new Date().toISOString(),
        }, { onConflict: 'employee_id,dataset_id' })
        if (assignErr) return { success: false, error: assignErr.message }

        const { error: coErr } = await admin.from('assignment_carryovers').insert({
            org_id: auth.orgId, target_employee_id: r.employee_id,
            target_dataset_id: targetDatasetId, source_dataset_id: resolvedSourceId,
            source_employee_id: r.source_employee_id, identity_id: r.identity_id,
            carried_job_id: r.job_id, match_method: r.match_method,
            match_confidence: r.match_confidence, change_flags: r.change_flags,
            status: 'accepted',
        })
        if (coErr) return { success: false, error: coErr.message }
    }

    revalidatePath(JA_PATH)
    return { success: true, saved: verified.length }
}
