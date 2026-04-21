'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
    X, Search, Loader2, UserPlus, UserMinus, AlertTriangle,
} from 'lucide-react'
import type { Job, EmployeeJobAssignment } from '@/lib/jobArchitecture/types'
import type { DatasetEmployee } from '@/app/(dashboard)/dashboard/job-architecture/mappingActions'
import {
    getAssignmentsForJob,
    getEmployeesForDataset,
    assignEmployeeToJob,
    unassignEmployee,
} from '@/app/(dashboard)/dashboard/job-architecture/mappingActions'

// ============================================================
// Reassign confirmation
// ============================================================

function ReassignWarning({
    employee, currentJob, onConfirm, onCancel, isPending, t,
}: {
    employee: DatasetEmployee; currentJob: string
    onConfirm: () => void; onCancel: () => void
    isPending: boolean; t: (k: string, v?: Record<string, string>) => string
}) {
    return (
        <div className="p-3 rounded-lg mb-2" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#f59e0b' }} />
                <div className="flex-1">
                    <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('reassignWarning', { job: currentJob })}
                    </p>
                    <div className="flex gap-2 mt-2">
                        <button onClick={onConfirm} disabled={isPending}
                            className="text-xs px-3 py-1 rounded-lg font-medium"
                            style={{ background: '#f59e0b', color: '#fff' }}>
                            {isPending ? <Loader2 size={12} className="animate-spin" /> : t('confirmReassign')}
                        </button>
                        <button onClick={onCancel} className="text-xs px-3 py-1 rounded-lg"
                            style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================
// Main drawer
// ============================================================

export default function AssignmentDrawer({
    job, datasetId, onClose, onUpdate,
}: {
    job: Job; datasetId?: string; onClose: () => void; onUpdate: () => void
}) {
    const t = useTranslations('jobArchitecture')
    const [assignments, setAssignments] = useState<EmployeeJobAssignment[]>([])
    const [allEmployees, setAllEmployees] = useState<DatasetEmployee[]>([])
    const [search, setSearch] = useState('')
    const [loading, startLoading] = useTransition()
    const [acting, startActing] = useTransition()
    const [reassignTarget, setReassignTarget] = useState<DatasetEmployee | null>(null)

    // Load data — assignments across all datasets if no datasetId specified
    useEffect(() => {
        startLoading(async () => {
            const aRes = await getAssignmentsForJob(job.id, datasetId)
            if (aRes.success) setAssignments(aRes.data)
            if (datasetId) {
                const eRes = await getEmployeesForDataset(datasetId)
                if (eRes.success) setAllEmployees(eRes.data)
            }
        })
    }, [job.id, datasetId])

    // Filter unassigned employees by search
    const unassigned = useMemo(() => {
        const assignedIds = new Set(assignments.map(a => a.employee_id))
        const q = search.toLowerCase().trim()
        return allEmployees.filter(e => {
            // Exclude those already assigned to THIS job
            if (assignedIds.has(e.id) && !e.assignment) return false
            if (assignedIds.has(e.id)) return false
            // Filter by search
            if (!q) return true
            const name = `${e.first_name ?? ''} ${e.last_name ?? ''}`.toLowerCase()
            const ref = (e.employee_ref ?? '').toLowerCase()
            const dept = (e.department ?? '').toLowerCase()
            return name.includes(q) || ref.includes(q) || dept.includes(q)
        })
    }, [allEmployees, assignments, search])

    const handleAssign = (emp: DatasetEmployee) => {
        // Check if employee is assigned to another job
        if (emp.assignment && emp.assignment.job_id !== job.id) {
            setReassignTarget(emp)
            return
        }
        doAssign(emp.id)
    }

    const doAssign = (employeeId: string) => {
        if (!datasetId) return
        setReassignTarget(null)
        startActing(async () => {
            const res = await assignEmployeeToJob({
                employee_id: employeeId,
                job_id: job.id,
                dataset_id: datasetId,
                source: 'manual',
            })
            if (res.success) {
                refreshData()
                onUpdate()
            }
        })
    }

    const handleUnassign = (employeeId: string) => {
        if (!datasetId) return
        startActing(async () => {
            const res = await unassignEmployee(employeeId, datasetId)
            if (res.success) {
                refreshData()
                onUpdate()
            }
        })
    }

    const refreshData = () => {
        startLoading(async () => {
            const aRes = await getAssignmentsForJob(job.id, datasetId)
            if (aRes.success) setAssignments(aRes.data)
            if (datasetId) {
                const eRes = await getEmployeesForDataset(datasetId)
                if (eRes.success) setAllEmployees(eRes.data)
            }
        })
    }

    const empName = (e: { first_name?: string | null; last_name?: string | null; employee_ref?: string | null }) =>
        [e.first_name, e.last_name].filter(Boolean).join(' ') || e.employee_ref || '—'

    return (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-full max-w-lg h-full overflow-y-auto"
                style={{ background: 'var(--color-pl-surface)', borderLeft: '1px solid var(--color-pl-border)' }}>

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-4"
                    style={{ background: 'var(--color-pl-surface)', borderBottom: '1px solid var(--color-pl-border)' }}>
                    <div>
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{job.title}</h3>
                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {assignments.length} {t('assignedEmployees').toLowerCase()}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        <X size={18} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-pl-brand)' }} />
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {/* Assigned employees */}
                        <div>
                            <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                {t('assignedEmployees')} ({assignments.length})
                            </h4>
                            {assignments.length === 0 ? (
                                <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('noAssignments')}</p>
                            ) : (
                                <div className="space-y-1">
                                    {assignments.map(a => (
                                        <div key={a.id} className="flex items-center justify-between p-2 rounded-lg"
                                            style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                                            <div className="min-w-0">
                                                <span className="text-sm block truncate" style={{ color: 'var(--color-pl-text-primary)' }}>
                                                    {empName(a.employee ?? {})}
                                                </span>
                                                {a.employee?.department && (
                                                    <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                        {a.employee.department}
                                                    </span>
                                                )}
                                            </div>
                                            <button onClick={() => handleUnassign(a.employee_id)} disabled={acting}
                                                className="p-1 rounded hover:opacity-80 flex-shrink-0"
                                                style={{ color: 'var(--color-pl-red)' }}
                                                title={t('unassignEmployee')}>
                                                <UserMinus size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Search & assign */}
                        <div>
                            <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                {t('assignEmployee')}
                            </h4>
                            <div className="relative mb-2">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                                    style={{ color: 'var(--color-pl-text-tertiary)' }} />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder={t('searchEmployees')}
                                    className="w-full text-sm pl-9 pr-3 py-2 rounded-lg"
                                    style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-text-primary)', border: '1px solid var(--color-pl-border)' }}
                                />
                            </div>

                            {/* Reassign warning */}
                            {reassignTarget && (
                                <ReassignWarning
                                    employee={reassignTarget}
                                    currentJob={reassignTarget.assignment?.job_title ?? ''}
                                    onConfirm={() => doAssign(reassignTarget.id)}
                                    onCancel={() => setReassignTarget(null)}
                                    isPending={acting}
                                    t={t}
                                />
                            )}

                            {/* Unassigned employee list */}
                            <div className="space-y-1 max-h-80 overflow-y-auto">
                                {unassigned.slice(0, 50).map(e => (
                                    <div key={e.id} className="flex items-center justify-between p-2 rounded-lg hover:opacity-90 cursor-pointer"
                                        style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}
                                        onClick={() => handleAssign(e)}>
                                        <div className="min-w-0">
                                            <span className="text-sm block truncate" style={{ color: 'var(--color-pl-text-primary)' }}>
                                                {empName(e)}
                                            </span>
                                            <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                {[e.department, e.job_grade].filter(Boolean).join(' / ')}
                                            </span>
                                            {e.assignment && (
                                                <span className="text-xs block" style={{ color: '#f59e0b' }}>
                                                    {t('currentJob')}: {e.assignment.job_title}
                                                </span>
                                            )}
                                        </div>
                                        <UserPlus size={14} className="flex-shrink-0" style={{ color: 'var(--color-pl-brand-light)' }} />
                                    </div>
                                ))}
                                {unassigned.length === 0 && search && (
                                    <p className="text-xs py-2 text-center" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        {t('noAssignments')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
