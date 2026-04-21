'use client'

import { useTranslations } from 'next-intl'
import { Check, X } from 'lucide-react'
import type { AutoMapResult } from '@/app/(dashboard)/dashboard/job-architecture/autoMapAction'
import JobSearchSelect, { type JobOption } from './JobSearchSelect'

// ── Types ───────────────────────────────────────────────────

export type ReviewStatus = 'pending' | 'confirmed' | 'rejected'

export type ReviewRow = AutoMapResult & {
    status: ReviewStatus
    override_job_id?: string | null
}

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

// ── Tier label ──────────────────────────────────────────────

function TierLabel({ tier }: { tier: 1 | 2 | 3 | 4 }) {
    const t = useTranslations('jobArchitecture')
    const labels: Record<number, string> = {
        1: t('tier1Desc'),
        2: t('tier2Desc'),
        3: t('tier3Desc'),
        4: t('tier4Desc'),
    }
    return (
        <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
            {labels[tier]}
        </span>
    )
}

// JobSelect is now the shared JobSearchSelect component

// ── Table row ───────────────────────────────────────────────

function ReviewTableRow({
    row,
    jobs,
    onConfirm,
    onReject,
    onOverride,
    onRevert,
    onCreateJob,
    onEditJob,
    isSaving,
}: {
    row: ReviewRow
    jobs: Job[]
    onConfirm: (employeeId: string) => void
    onReject: (employeeId: string) => void
    onOverride: (employeeId: string, jobId: string) => void
    onRevert: (employeeId: string) => void
    onCreateJob?: (row: ReviewRow) => void
    onEditJob?: (jobId: string, employeeId?: string) => void
    isSaving: boolean
}) {
    const statusStyles: Record<ReviewStatus, { bg: string; label: string }> = {
        confirmed: { bg: 'rgba(34,197,94,0.1)', label: 'Confirmed' },
        rejected: { bg: 'rgba(239,68,68,0.1)', label: 'Rejected' },
        pending: { bg: 'transparent', label: 'Pending' },
    }
    const style = statusStyles[row.status]

    return (
        <tr style={{ borderBottom: '1px solid var(--color-pl-border)', background: style.bg }}>
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
                <div className="font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {(() => {
                        const suggestedJobLevel = row.suggested_job_id
                            ? jobs.find(j => j.id === row.suggested_job_id)?.level_code
                            : null
                        return suggestedJobLevel ? (
                            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded mr-1"
                                style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-brand-light)', border: '1px solid var(--color-pl-border)' }}>
                                {suggestedJobLevel}
                            </span>
                        ) : null
                    })()}
                    {row.suggested_job_title ?? '—'}
                </div>
                <TierLabel tier={row.tier} />
            </td>
            <td className="py-2 px-3">
                <ConfidenceBadge value={row.confidence} />
            </td>
            <td className="py-2 px-3 text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                {row.match_reason}
            </td>
            <td className="py-2 px-3 min-w-[220px]">
                <div className="space-y-1.5">
                    {row.status === 'pending' && (
                        <>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onConfirm(row.employee_id)}
                                    disabled={isSaving || !row.suggested_job_id}
                                    className="p-1 rounded hover:opacity-80 disabled:opacity-40"
                                    style={{ color: 'var(--color-pl-success, #22c55e)' }}
                                    title="Confirm"
                                >
                                    <Check size={14} />
                                </button>
                                <button
                                    onClick={() => onReject(row.employee_id)}
                                    disabled={isSaving}
                                    className="p-1 rounded hover:opacity-80 disabled:opacity-40"
                                    style={{ color: 'var(--color-pl-error, #ef4444)' }}
                                    title="Reject"
                                >
                                    <X size={14} />
                                </button>
                                <JobSearchSelect
                                    jobs={jobs}
                                    value={row.override_job_id ?? row.suggested_job_id}
                                    onChange={jobId => onOverride(row.employee_id, jobId)}
                                    disabled={isSaving}
                                />
                            </div>
                            {onCreateJob && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => onCreateJob(row)}
                                        className="text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap"
                                        style={{ color: 'var(--color-pl-brand-light)', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
                                    >
                                        + Neue Stelle
                                    </button>
                                    {row.suggested_job_id && onEditJob && (
                                        <button
                                            onClick={() => onEditJob(row.suggested_job_id!, row.employee_id)}
                                            className="text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap"
                                            style={{ color: 'var(--color-pl-text-secondary)', background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}
                                        >
                                            ✎ Stelle anpassen
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    {row.status === 'confirmed' && (
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium" style={{ color: 'var(--color-pl-success, #22c55e)' }}>
                                    ✓ {row.suggested_job_title}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <JobSearchSelect
                                    jobs={jobs}
                                    value={row.override_job_id ?? row.suggested_job_id}
                                    onChange={jobId => onOverride(row.employee_id, jobId)}
                                    disabled={isSaving}
                                />
                                <button
                                    onClick={() => onRevert(row.employee_id)}
                                    disabled={isSaving}
                                    className="text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap"
                                    style={{ color: 'var(--color-pl-text-tertiary)', background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}
                                >
                                    ↩ Revert
                                </button>
                            </div>
                        </div>
                    )}
                    {row.status === 'rejected' && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium" style={{ color: 'var(--color-pl-error, #ef4444)' }}>
                                Rejected
                            </span>
                            <button
                                onClick={() => onRevert(row.employee_id)}
                                disabled={isSaving}
                                className="text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap"
                                style={{ color: 'var(--color-pl-text-tertiary)', background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}
                            >
                                ↩ Revert
                            </button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    )
}

// ── Exported table ──────────────────────────────────────────

export default function AutoMapReviewTable({
    rows,
    jobs,
    onConfirm,
    onReject,
    onOverride,
    onRevert,
    onCreateJob,
    onEditJob,
    isSaving,
}: {
    rows: ReviewRow[]
    jobs: Job[]
    onConfirm: (employeeId: string) => void
    onReject: (employeeId: string) => void
    onOverride: (employeeId: string, jobId: string) => void
    onRevert: (employeeId: string) => void
    onCreateJob?: (row: ReviewRow) => void
    onEditJob?: (jobId: string, employeeId?: string) => void
    isSaving: boolean
}) {
    const t = useTranslations('jobArchitecture')

    if (rows.length === 0) return null

    return (
        <div className="glass-card overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                        {['Employee', 'Department', 'Grade', 'Job title', 'Suggested job', t('matchConfidence'), t('matchReason'), 'Action'].map(h => (
                            <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold"
                                style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => (
                        <ReviewTableRow
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
