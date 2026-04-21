'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
    Users, ChevronDown, ChevronRight, Loader2, Database, AlertTriangle,
} from 'lucide-react'
import type { JobArchitectureContext, Job } from '@/lib/jobArchitecture/types'
import type { DatasetEmployee } from '@/app/(dashboard)/dashboard/job-architecture/mappingActions'
import { getEmployeesForDataset, assignEmployeeToJob } from '@/app/(dashboard)/dashboard/job-architecture/mappingActions'
import AssignmentDrawer from './AssignmentDrawer'
import AutoMapReview, { type PersistedReviewState } from './AutoMapReview'
import CarryoverReview, { type PersistedCarryoverState } from './CarryoverReview'
import JobModal from './JobModal'

// ============================================================
// Summary card
// ============================================================

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="glass-card p-4">
            <span className="text-xs block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{label}</span>
            <span className="text-2xl font-bold" style={{ color }}>{value}</span>
        </div>
    )
}

// ============================================================
// Job row with assignment count
// ============================================================

function JobAssignmentRow({
    job, count, onOpenDrawer, t,
}: {
    job: Job; count: number; onOpenDrawer: () => void; t: (k: string) => string
}) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="rounded-lg" style={{ border: '1px solid var(--color-pl-border)' }}>
            <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
                <div className="flex items-center gap-3 min-w-0">
                    {expanded
                        ? <ChevronDown size={14} style={{ color: 'var(--color-pl-text-tertiary)' }} />
                        : <ChevronRight size={14} style={{ color: 'var(--color-pl-text-tertiary)' }} />}
                    {job.level_definition && (
                        <span className="px-2 py-0.5 text-xs font-mono rounded"
                            style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-brand-light)', border: '1px solid var(--color-pl-border)' }}>
                            {job.level_definition.level_code}
                        </span>
                    )}
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {job.title}
                    </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={onOpenDrawer}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg hover:opacity-80 transition-opacity"
                        style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-text-secondary)', border: '1px solid var(--color-pl-border)' }}
                    >
                        <Users size={12} />
                        {count} {t('assignedEmployees').toLowerCase()}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="px-4 pb-3 pt-2" style={{ borderTop: '1px solid var(--color-pl-border)' }}>
                    {count === 0
                        ? <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('noAssignments')}</p>
                        : (
                            <button onClick={onOpenDrawer} className="text-xs underline" style={{ color: 'var(--color-pl-brand-light)' }}>
                                {t('assignEmployee')}
                            </button>
                        )}
                </div>
            )}
        </div>
    )
}

// ============================================================
// Headcount tab
// ============================================================

export default function HeadcountTab({
    ctx, onUpdate,
}: {
    ctx: JobArchitectureContext; onUpdate: () => void
}) {
    const t = useTranslations('jobArchitecture')
    const [selectedDataset, setSelectedDataset] = useState(ctx.datasets[0]?.id ?? '')
    const [employees, setEmployees] = useState<DatasetEmployee[]>([])
    const [loading, startTransition] = useTransition()
    const [drawerJob, setDrawerJob] = useState<Job | null>(null)
    const [jobModal, setJobModal] = useState<{ mode: 'create' | 'duplicate'; title: string; basisJobId?: string; employeeId?: string } | null>(null)
    const reviewStateRef = useRef<PersistedReviewState | null>(null)
    const carryoverStateRef = useRef<PersistedCarryoverState | null>(null)

    // Load employees when dataset changes
    useEffect(() => {
        if (!selectedDataset) return
        startTransition(async () => {
            const res = await getEmployeesForDataset(selectedDataset)
            if (res.success) setEmployees(res.data)
        })
    }, [selectedDataset])

    if (ctx.datasets.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <Database size={32} className="mx-auto mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }} />
                <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('noDatasets')}</p>
            </div>
        )
    }

    const assigned = employees.filter(e => e.assignment).length
    const unassigned = employees.length - assigned

    // Build assignment counts per job for the selected dataset
    const datasetCounts: Record<string, number> = {}
    for (const e of employees) {
        if (e.assignment) {
            datasetCounts[e.assignment.job_id] = (datasetCounts[e.assignment.job_id] ?? 0) + 1
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-base font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('headcountTitle')}</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('headcountDesc')}</p>
            </div>

            {/* Dataset selector */}
            <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {t('selectDataset')}
                </label>
                <select
                    value={selectedDataset}
                    onChange={e => setSelectedDataset(e.target.value)}
                    className="w-full max-w-xs text-sm px-3 py-2 rounded-lg"
                    style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-text-primary)', border: '1px solid var(--color-pl-border)' }}
                >
                    {ctx.datasets.map(ds => (
                        <option key={ds.id} value={ds.id}>{ds.name} ({ds.reporting_year})</option>
                    ))}
                </select>
            </div>

            {/* Summary cards */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-pl-brand)' }} />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-4">
                        <SummaryCard label={t('totalEmployees')} value={employees.length} color="var(--color-pl-text-primary)" />
                        <SummaryCard label={t('assignedEmployees')} value={assigned} color="var(--color-pl-green)" />
                        <SummaryCard label={t('unassignedEmployees')} value={unassigned} color="var(--color-pl-red)" />
                    </div>

                    {/* Grade mapping prerequisite warning */}
                    {ctx.gradeMappings.length === 0 && (
                        <div
                            className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs"
                            style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-secondary)' }}
                        >
                            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-pl-red, #ef4444)' }} />
                            <div>
                                <span>{t('gradeMappingMissing')}</span>
                                <span
                                    className="ml-1.5 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded"
                                    style={{ background: 'var(--color-pl-brand-subtle, rgba(59,130,246,0.12))', color: 'var(--color-pl-brand)' }}
                                >
                                    {t('gradeMappingSetup')}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Carryover from previous dataset */}
                    {unassigned > 0 && (
                        <CarryoverReview
                            datasetId={selectedDataset}
                            jobs={ctx.jobs}
                            stateRef={carryoverStateRef}
                            onSaved={() => {
                                onUpdate()
                                startTransition(async () => {
                                    const res = await getEmployeesForDataset(selectedDataset)
                                    if (res.success) setEmployees(res.data)
                                })
                            }}
                            onCreateJob={(title, employeeId) => setJobModal({ mode: 'create', title, employeeId })}
                            onEditJob={(jobId, employeeId) => setJobModal({ mode: 'duplicate', title: '', basisJobId: jobId, employeeId })}
                        />
                    )}

                    {/* Auto-map button + review */}
                    {unassigned > 0 && (
                        <AutoMapReview
                            datasetId={selectedDataset}
                            jobs={ctx.jobs}
                            stateRef={reviewStateRef}
                            onSaved={() => {
                                onUpdate()
                                startTransition(async () => {
                                    const res = await getEmployeesForDataset(selectedDataset)
                                    if (res.success) setEmployees(res.data)
                                })
                            }}
                            onCreateJob={(title, employeeId) => setJobModal({ mode: 'create', title, employeeId })}
                            onEditJob={(jobId, employeeId) => setJobModal({ mode: 'duplicate', title: '', basisJobId: jobId, employeeId })}
                        />
                    )}

                    {/* Jobs table */}
                    <div className="space-y-2">
                        {ctx.jobs.map(job => (
                            <JobAssignmentRow
                                key={job.id}
                                job={job}
                                count={datasetCounts[job.id] ?? 0}
                                onOpenDrawer={() => setDrawerJob(job)}
                                t={t}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Assignment drawer */}
            {drawerJob && selectedDataset && (
                <AssignmentDrawer
                    job={drawerJob}
                    datasetId={selectedDataset}
                    onClose={() => setDrawerJob(null)}
                    onUpdate={() => {
                        onUpdate()
                        // Refresh employee list
                        startTransition(async () => {
                            const res = await getEmployeesForDataset(selectedDataset)
                            if (res.success) setEmployees(res.data)
                        })
                    }}
                />
            )}

            {/* Create job modal from auto-map */}
            {/* Job modal — create new or duplicate from existing, auto-assigns employee after save */}
            {jobModal !== null && (() => {
                const basis = jobModal.basisJobId ? ctx.jobs.find(j => j.id === jobModal.basisJobId) : null
                const familyId = basis?.family_id ?? ctx.jobFamilies[0]?.id ?? ''
                const prefill = basis
                    ? {
                        title: basis.title,
                        summary: basis.jd_summary ?? '',
                        responsibilities: basis.jd_responsibilities ?? [],
                        qualifications: basis.jd_qualifications ?? [],
                        levelId: basis.level_id ?? undefined,
                    }
                    : { title: jobModal.title }

                return (
                    <JobModal
                        job={null}
                        familyId={familyId}
                        ctx={ctx}
                        prefill={prefill}
                        onClose={() => setJobModal(null)}
                        onSaved={async (newJobId) => {
                            // Auto-assign the employee to the newly created job
                            if (jobModal.employeeId && newJobId && selectedDataset) {
                                await assignEmployeeToJob({
                                    employee_id: jobModal.employeeId,
                                    job_id: newJobId,
                                    dataset_id: selectedDataset,
                                    source: 'manual',
                                })
                            }
                            // Update the row in auto-map review state if applicable
                            if (jobModal.employeeId && newJobId && reviewStateRef.current) {
                                reviewStateRef.current = {
                                    ...reviewStateRef.current,
                                    rows: reviewStateRef.current.rows.map(r =>
                                        r.employee_id === jobModal.employeeId
                                            ? { ...r, suggested_job_id: newJobId, status: 'confirmed' as const, override_job_id: newJobId }
                                            : r,
                                    ),
                                }
                            }
                            // Update the row in carryover review state if applicable
                            if (jobModal.employeeId && newJobId && carryoverStateRef.current?.rows) {
                                carryoverStateRef.current = {
                                    ...carryoverStateRef.current,
                                    rows: carryoverStateRef.current.rows.map(r =>
                                        r.employee_id === jobModal.employeeId
                                            ? { ...r, carried_job_id: newJobId, carried_job_title: '', override_job_id: newJobId, status: 'confirmed' as const }
                                            : r,
                                    ),
                                }
                            }
                            setJobModal(null)
                            // Refresh context (for new job in dropdowns) + employees — stateRef preserves review
                            onUpdate()
                            startTransition(async () => {
                                const res = await getEmployeesForDataset(selectedDataset)
                                if (res.success) setEmployees(res.data)
                            })
                        }}
                    />
                )
            })()}
        </div>
    )
}
