'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminRoleAction } from '@/lib/api/planGuard'
import type { ActionResult, EmployeeJobAssignment } from '@/lib/jobArchitecture/types'

const JA_PATH = '/dashboard/job-architecture'

// ============================================================
// Employee type for dataset listing
// ============================================================

export type DatasetEmployee = {
    id: string
    employee_ref: string | null
    first_name: string | null
    last_name: string | null
    department: string | null
    job_grade: string | null
    job_title: string | null
    assignment?: {
        job_id: string
        job_title: string
        status: string
    } | null
}

// ============================================================
// Assign a single employee to a job
// ============================================================

export async function assignEmployeeToJob(input: {
    employee_id: string
    job_id: string
    dataset_id: string
    source: 'auto' | 'manual' | 'ai_suggested'
}): Promise<ActionResult<EmployeeJobAssignment>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const admin = createAdminClient()
    const supabase = await createClient()

    // Verify employee belongs to this org
    const { data: emp } = await supabase
        .from('employees')
        .select('id, org_id')
        .eq('id', input.employee_id)
        .eq('org_id', auth.orgId)
        .single()

    if (!emp) return { success: false, error: 'Employee not found.' }

    // Upsert: if employee already assigned in this dataset, update
    const { data, error } = await admin
        .from('employee_job_assignments')
        .upsert(
            {
                org_id: auth.orgId,
                employee_id: input.employee_id,
                job_id: input.job_id,
                dataset_id: input.dataset_id,
                source: input.source,
                status: 'confirmed',
                assigned_by: auth.userId,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'employee_id,dataset_id' },
        )
        .select()
        .single()

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: data as EmployeeJobAssignment }
}

// ============================================================
// Unassign an employee from a dataset
// ============================================================

export async function unassignEmployee(
    employeeId: string,
    datasetId: string,
): Promise<ActionResult> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const admin = createAdminClient()
    const { error } = await admin
        .from('employee_job_assignments')
        .delete()
        .eq('employee_id', employeeId)
        .eq('dataset_id', datasetId)
        .eq('org_id', auth.orgId)

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: undefined }
}

// ============================================================
// Bulk assign employees to jobs
// ============================================================

export async function bulkAssign(
    assignments: Array<{ employee_id: string; job_id: string }>,
    datasetId: string,
    source: 'auto' | 'manual' | 'ai_suggested',
): Promise<ActionResult<{ assigned: number }>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    if (assignments.length === 0) {
        return { success: true, data: { assigned: 0 } }
    }

    const admin = createAdminClient()
    const rows = assignments.map(a => ({
        org_id: auth.orgId,
        employee_id: a.employee_id,
        job_id: a.job_id,
        dataset_id: datasetId,
        source,
        status: 'confirmed' as const,
        assigned_by: auth.userId,
        updated_at: new Date().toISOString(),
    }))

    const { error } = await admin
        .from('employee_job_assignments')
        .upsert(rows, { onConflict: 'employee_id,dataset_id' })

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: { assigned: rows.length } }
}

// ============================================================
// Get employees for a dataset with assignment status
// ============================================================

export async function getEmployeesForDataset(
    datasetId: string,
): Promise<ActionResult<DatasetEmployee[]>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated.' }

    // Verify dataset belongs to caller's org (defense-in-depth alongside RLS)
    const { data: ds } = await supabase.from('datasets').select('id').eq('id', datasetId).single()
    if (!ds) return { success: false, error: 'Dataset not found.' }

    // Fetch employees (RLS enforces org isolation)
    const { data: employees, error: empErr } = await supabase
        .from('employees')
        .select('id, employee_ref, first_name, last_name, department, job_grade, job_title')
        .eq('dataset_id', datasetId)
        .order('last_name')
        .order('first_name')

    if (empErr) return { success: false, error: empErr.message }

    // Fetch assignments for this dataset
    const { data: assignments } = await supabase
        .from('employee_job_assignments')
        .select('employee_id, job_id, status, job:jobs(title)')
        .eq('dataset_id', datasetId)

    // Build a lookup map
    const assignMap = new Map<string, { job_id: string; job_title: string; status: string }>()
    for (const a of assignments ?? []) {
        const row = a as unknown as { employee_id: string; job_id: string; status: string; job: { title: string } | null }
        assignMap.set(row.employee_id, {
            job_id: row.job_id,
            job_title: row.job?.title ?? '',
            status: row.status,
        })
    }

    const result: DatasetEmployee[] = (employees ?? []).map(e => ({
        ...e,
        assignment: assignMap.get(e.id) ?? null,
    }))

    return { success: true, data: result }
}

// ============================================================
// Get assignments for a specific job + dataset
// ============================================================

export async function getAssignmentsForJob(
    jobId: string,
    datasetId?: string,
): Promise<ActionResult<EmployeeJobAssignment[]>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const admin = createAdminClient()
    let query = admin
        .from('employee_job_assignments')
        .select(`
            *,
            employee:employees(employee_ref, first_name, last_name, department, job_grade, job_title)
        `)
        .eq('job_id', jobId)
        .eq('org_id', auth.orgId)
        .eq('status', 'confirmed')
        .order('created_at')

    if (datasetId) {
        query = query.eq('dataset_id', datasetId)
    }

    const { data, error } = await query

    if (error) return { success: false, error: error.message }
    return { success: true, data: (data ?? []) as EmployeeJobAssignment[] }
}
