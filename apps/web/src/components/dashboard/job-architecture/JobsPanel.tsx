'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import {
    Plus, Edit3, Trash2, ChevronDown, ChevronRight, Users, Loader2,
} from 'lucide-react'
import type { JobArchitectureContext, JobFamily, Job } from '@/lib/jobArchitecture/types'
import { deleteJob } from './actions'
import JobModal from './JobModal'
import AssignmentDrawer from './AssignmentDrawer'

// ============================================================
// Job row
// ============================================================

function JobRow({
    job, onEdit, onDelete, isPending, t, isConfirming, onCancelDelete, assignmentCount, onHeadcountClick,
}: {
    job: Job; onEdit: () => void; onDelete: () => void; isPending: boolean
    t: (k: string) => string; isConfirming: boolean; onCancelDelete: () => void
    assignmentCount: number; onHeadcountClick: () => void
}) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="rounded-lg" style={{ border: `1px solid ${isConfirming ? 'var(--color-pl-red)' : 'var(--color-pl-border)'}` }}>
            <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
                <div className="flex items-center gap-3 min-w-0">
                    {expanded ? <ChevronDown size={14} style={{ color: 'var(--color-pl-text-tertiary)' }} />
                        : <ChevronRight size={14} style={{ color: 'var(--color-pl-text-tertiary)' }} />}
                    {job.level_definition && (
                        <span className="px-2 py-0.5 text-xs font-mono rounded"
                            style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-brand-light)', border: '1px solid var(--color-pl-border)' }}>
                            {job.level_definition.level_code}
                        </span>
                    )}
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--color-pl-text-primary)' }}>{job.title}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {isConfirming ? (
                        <>
                            <span className="text-xs" style={{ color: 'var(--color-pl-red)' }}>{t('confirmDeleteJob')}</span>
                            <button onClick={onDelete} disabled={isPending}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                                style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-pl-red)' }}>
                                {isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                {t('confirmDelete')}
                            </button>
                            <button onClick={onCancelDelete} className="text-xs px-2 py-1 rounded-lg"
                                style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {t('cancel')}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={onHeadcountClick}
                                className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                                style={{ color: assignmentCount > 0 ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)' }}>
                                <Users size={12} /> {assignmentCount > 0 ? assignmentCount : job.headcount}
                            </button>
                            <button onClick={onEdit} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                <Edit3 size={13} />
                            </button>
                            <button onClick={onDelete} disabled={isPending} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-pl-red)' }}>
                                <Trash2 size={13} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {expanded && (
                <div className="px-4 pb-3 space-y-2" style={{ borderTop: '1px solid var(--color-pl-border)' }}>
                    {job.jd_summary && (
                        <div className="pt-2">
                            <span className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('summary')}</span>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-secondary)' }}>{job.jd_summary}</p>
                        </div>
                    )}
                    {job.jd_responsibilities && job.jd_responsibilities.length > 0 && (
                        <div>
                            <span className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('responsibilities')}</span>
                            <ul className="list-disc list-inside mt-1">
                                {job.jd_responsibilities.map((r, i) => (
                                    <li key={i} className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>{r}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {job.jd_qualifications && job.jd_qualifications.length > 0 && (
                        <div>
                            <span className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('qualifications')}</span>
                            <ul className="list-disc list-inside mt-1">
                                {job.jd_qualifications.map((q, i) => (
                                    <li key={i} className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>{q}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {job.salary_band_grade && (
                        <div>
                            <span className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('salaryGrade')}</span>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                {job.salary_band_grade.job_grade} ({job.salary_band_grade.min_salary.toLocaleString()} - {job.salary_band_grade.max_salary.toLocaleString()})
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ============================================================
// Main panel
// ============================================================

export default function JobsPanel({
    family, jobs, ctx, onUpdate,
}: {
    family: JobFamily; jobs: Job[]; ctx: JobArchitectureContext; onUpdate: () => void
}) {
    const t = useTranslations('jobArchitecture')
    const [isPending, startTransition] = useTransition()
    const [modalOpen, setModalOpen] = useState(false)
    const [editJob, setEditJob] = useState<Job | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [drawerJob, setDrawerJob] = useState<Job | null>(null)

    const handleDelete = (id: string) => {
        if (confirmDeleteId !== id) {
            setConfirmDeleteId(id)
            return
        }
        setConfirmDeleteId(null)
        startTransition(async () => {
            const res = await deleteJob(id)
            if (res.success) onUpdate()
        })
    }

    const openCreate = () => { setEditJob(null); setModalOpen(true) }
    const openEdit = (j: Job) => { setEditJob(j); setModalOpen(true) }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {family.name}
                    </h3>
                    {family.description && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{family.description}</p>
                    )}
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--color-pl-brand)', color: '#fff' }}>
                    <Plus size={13} /> {t('addJob')}
                </button>
            </div>

            {jobs.length === 0 ? (
                <div className="glass-card p-6 text-center">
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('noJobsInFamily')}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {jobs.map(j => (
                        <JobRow key={j.id} job={j} onEdit={() => openEdit(j)} onDelete={() => handleDelete(j.id)}
                            isPending={isPending} t={t} isConfirming={confirmDeleteId === j.id} onCancelDelete={() => setConfirmDeleteId(null)}
                            assignmentCount={ctx.assignmentCounts[j.id] ?? 0}
                            onHeadcountClick={() => ctx.datasets.length > 0 && setDrawerJob(j)} />
                    ))}
                </div>
            )}

            {modalOpen && (
                <JobModal job={editJob} familyId={family.id} ctx={ctx}
                    onClose={() => setModalOpen(false)} onSaved={() => { onUpdate(); setModalOpen(false) }} />
            )}

            {drawerJob && (
                <AssignmentDrawer
                    job={drawerJob}
                    onClose={() => setDrawerJob(null)}
                    onUpdate={onUpdate}
                />
            )}
        </div>
    )
}
