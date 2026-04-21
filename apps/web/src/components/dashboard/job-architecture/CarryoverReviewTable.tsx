'use client'

import { useTranslations } from 'next-intl'
import { Check, X, ArrowRight } from 'lucide-react'
import type { CarryoverReviewRow, CarryoverRowStatus } from './CarryoverReview'
import JobSearchSelect, { type JobOption } from './JobSearchSelect'

// ── Types ───────────────────────────────────────────────────

type Job = JobOption

// ── Confidence badge ────────────────────────────────────────

function ConfidenceBadge({ value }: { value: number }) {
    const pct = Math.round(value * 100)
    let bg = 'rgba(239,68,68,0.15)'
    let fg = 'var(--color-pl-error, #ef4444)'

    if (value >= 0.8) {
        bg = 'rgba(34,197,94,0.15)'
        fg = 'var(--color-pl-success, #22c55e)'
    } else if (value >= 0.5) {
        bg = 'rgba(234,179,8,0.15)'
        fg = 'var(--color-pl-warning, #eab308)'
    }

    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: bg, color: fg }}
        >
            {pct}%
        </span>
    )
}

// ── Change flag chips ───────────────────────────────────────

function ChangeChips({ row }: { row: CarryoverReviewRow }) {
    const t = useTranslations('jobArchitecture')
    const flags: string[] = []
    if (row.change_flags.title_changed) flags.push(t('carryoverTitleChanged'))
    if (row.change_flags.department_changed) flags.push(t('carryoverDeptChanged'))
    if (row.change_flags.grade_changed) flags.push(t('carryoverGradeChanged'))

    if (flags.length === 0) return null
    return (
        <div className="flex flex-wrap gap-1">
            {flags.map(f => (
                <span
                    key={f}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ background: 'rgba(234,179,8,0.15)', color: 'var(--color-pl-warning, #eab308)' }}
                >
                    {f}
                </span>
            ))}
        </div>
    )
}

// ── Job override dropdown ───────────────────────────────────

// ── Table row ───────────────────────────────────────────────

function CarryoverTableRow({
    row, jobs, onConfirm, onReject, onOverride, onRevert, onCreateJob, onEditJob, isSaving,
}: {
    row: CarryoverReviewRow
    jobs: Job[]
    onConfirm: (employeeId: string) => void
    onReject: (employeeId: string) => void
    onOverride: (employeeId: string, jobId: string) => void
    onRevert: (employeeId: string) => void
    onCreateJob?: (row: CarryoverReviewRow) => void
    onEditJob?: (jobId: string, employeeId: string) => void
    isSaving: boolean
}) {
    const t = useTranslations('jobArchitecture')
    const bgMap: Record<string, string> = {
        confirmed: 'rgba(34,197,94,0.1)',
        rejected: 'rgba(239,68,68,0.1)',
        pending: row.category === 'new_hire' ? 'rgba(59,130,246,0.05)' : 'transparent',
    }

    return (
        <tr style={{ borderBottom: '1px solid var(--color-pl-border)', background: bgMap[row.status] }}>
            <td className="py-2 px-3 text-xs">
                <div className="font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {row.employee_name ?? row.employee_ref}
                </div>
                <div style={{ color: 'var(--color-pl-text-tertiary)' }}>{row.employee_ref}</div>
            </td>
            <td className="py-2 px-3 text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                {row.department ?? '—'}
            </td>
            <td className="py-2 px-3 text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                {row.job_grade ?? '—'}
            </td>
            <td className="py-2 px-3 text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                {row.job_title ?? '—'}
            </td>
            <td className="py-2 px-3 text-xs">
                <div className="flex items-center gap-1.5">
                    <span style={{ color: 'var(--color-pl-text-primary)' }}>{row.carried_job_title ?? '—'}</span>
                    {row.category === 'changed' && (
                        <ArrowRight size={10} style={{ color: 'var(--color-pl-text-tertiary)' }} />
                    )}
                </div>
            </td>
            <td className="py-2 px-3">
                <ChangeChips row={row} />
            </td>
            <td className="py-2 px-3">
                <ConfidenceBadge value={row.match_confidence} />
            </td>
            <td className="py-2 px-3 min-w-[220px]">
                <div className="space-y-1.5">
                    {/* Pending + changed */}
                    {row.status === 'pending' && row.category === 'changed' && (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => onConfirm(row.employee_id)} disabled={isSaving || !(row.override_job_id ?? row.carried_job_id)}
                                    className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded hover:opacity-80 disabled:opacity-40"
                                    style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-pl-success, #22c55e)', border: '1px solid rgba(34,197,94,0.2)' }}>
                                    <Check size={10} /> {t('carryoverAccept')}
                                </button>
                                <button onClick={() => onReject(row.employee_id)} disabled={isSaving}
                                    className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded hover:opacity-80 disabled:opacity-40"
                                    style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-pl-error, #ef4444)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <X size={10} /> {t('carryoverReject')}
                                </button>
                            </div>
                            <JobSearchSelect jobs={jobs} value={row.override_job_id ?? row.carried_job_id}
                                onChange={jobId => onOverride(row.employee_id, jobId)} disabled={isSaving} />
                            {onCreateJob && (
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => onCreateJob(row)}
                                        className="text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap"
                                        style={{ color: 'var(--color-pl-brand-light)', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                        + {t('createJob')}
                                    </button>
                                    {(row.override_job_id ?? row.carried_job_id) && onEditJob && (
                                        <button onClick={() => onEditJob(row.override_job_id ?? row.carried_job_id, row.employee_id)}
                                            className="text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap"
                                            style={{ color: 'var(--color-pl-text-secondary)', background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                                            ✎ {t('editJob')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pending + new_hire */}
                    {row.status === 'pending' && row.category === 'new_hire' && (
                        <div className="space-y-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                                style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--color-pl-brand)' }}>
                                {t('carryoverNewHireAssign')}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <JobSearchSelect jobs={jobs} value={row.override_job_id ?? (row.carried_job_id || null)}
                                    onChange={jobId => onOverride(row.employee_id, jobId)} disabled={isSaving} />
                                {(row.override_job_id ?? row.carried_job_id) && (
                                    <button onClick={() => onConfirm(row.employee_id)} disabled={isSaving}
                                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded hover:opacity-80 disabled:opacity-40"
                                        style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-pl-success, #22c55e)', border: '1px solid rgba(34,197,94,0.2)' }}>
                                        <Check size={10} /> {t('confirmAssignment')}
                                    </button>
                                )}
                            </div>
                            {onCreateJob && (
                                <div className="flex items-center gap-1.5">
                                    <button onClick={() => onCreateJob(row)}
                                        className="text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap"
                                        style={{ color: 'var(--color-pl-brand-light)', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                        + {t('createJob')}
                                    </button>
                                    {(row.override_job_id ?? row.carried_job_id) && onEditJob && (
                                        <button onClick={() => onEditJob(row.override_job_id ?? row.carried_job_id, row.employee_id)}
                                            className="text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap"
                                            style={{ color: 'var(--color-pl-text-secondary)', background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                                            ✎ {t('editJob')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Confirmed + unchanged */}
                    {row.status === 'confirmed' && row.category === 'unchanged' && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium" style={{ color: 'var(--color-pl-success, #22c55e)' }}>
                                ✓ {t('carryoverCarriedOver')}
                            </span>
                            <button onClick={() => onRevert(row.employee_id)} disabled={isSaving}
                                className="text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap"
                                style={{ color: 'var(--color-pl-text-tertiary)', background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                                ↩ {t('revert')}
                            </button>
                        </div>
                    )}

                    {/* Confirmed + changed */}
                    {row.status === 'confirmed' && row.category === 'changed' && (
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium" style={{ color: 'var(--color-pl-success, #22c55e)' }}>
                                    ✓ {t('carryoverConfirmedLabel')}
                                </span>
                                <span className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    {row.carried_job_title}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <JobSearchSelect jobs={jobs} value={row.override_job_id ?? row.carried_job_id}
                                    onChange={jobId => onOverride(row.employee_id, jobId)} disabled={isSaving} />
                                <button onClick={() => onRevert(row.employee_id)} disabled={isSaving}
                                    className="text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap"
                                    style={{ color: 'var(--color-pl-text-tertiary)', background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                                    ↩ {t('revert')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Rejected */}
                    {row.status === 'rejected' && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium" style={{ color: 'var(--color-pl-error, #ef4444)' }}>
                                {t('carryoverRejectedLabel')}
                            </span>
                            <button onClick={() => onRevert(row.employee_id)} disabled={isSaving}
                                className="text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap"
                                style={{ color: 'var(--color-pl-text-tertiary)', background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                                ↩ {t('revert')}
                            </button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    )
}

// ── Exported table ──────────────────────────────────────────

export default function CarryoverReviewTable({
    rows, jobs, onConfirm, onReject, onOverride, onRevert, onCreateJob, onEditJob, isSaving,
}: {
    rows: CarryoverReviewRow[]
    jobs: Job[]
    onConfirm: (employeeId: string) => void
    onReject: (employeeId: string) => void
    onOverride: (employeeId: string, jobId: string) => void
    onRevert: (employeeId: string) => void
    onCreateJob?: (row: CarryoverReviewRow) => void
    onEditJob?: (jobId: string, employeeId: string) => void
    isSaving: boolean
}) {
    const t = useTranslations('jobArchitecture')

    if (rows.length === 0) return null

    return (
        <div className="glass-card overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                        {['Employee', 'Department', 'Grade', 'Job title', t('carryoverPreviousJob'), t('carryoverChanges'), t('matchConfidence'), 'Action'].map(h => (
                            <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold"
                                style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => (
                        <CarryoverTableRow
                            key={row.employee_id}
                            row={row}
                            jobs={jobs}
                            onConfirm={onConfirm}
                            onReject={onReject}
                            onOverride={onOverride}
                            onRevert={onRevert}
                            onCreateJob={onCreateJob}
                            onEditJob={onEditJob}
                            isSaving={isSaving}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    )
}
