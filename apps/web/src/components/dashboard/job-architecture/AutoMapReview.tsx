'use client'

import { useState, useCallback, useTransition, useEffect, type MutableRefObject } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Wand2, CheckCircle2, Save } from 'lucide-react'
import type { AutoMapSummary, AutoMapResult } from '@/app/(dashboard)/dashboard/job-architecture/autoMapAction'
import { runAutoMapping, saveAutoMapResults } from '@/app/(dashboard)/dashboard/job-architecture/autoMapAction'
import { runAiMatching } from '@/app/(dashboard)/dashboard/job-architecture/aiMatchAction'
import AutoMapReviewTable, { type ReviewRow, type ReviewStatus } from './AutoMapReviewTable'
import type { Job } from '@/lib/jobArchitecture/types'

export type ReviewPhase = 'idle' | 'mapping' | 'review' | 'aiMatching' | 'saving' | 'saved'

export type PersistedReviewState = {
    phase: ReviewPhase
    rows: ReviewRow[]
    summary: AutoMapSummary | null
    savedCount: number
}

function SummaryBar({ summary }: { summary: AutoMapSummary }) {
    const t = useTranslations('jobArchitecture')
    const items: Array<{ label: string; value: number; color?: string }> = [
        { label: 'Total', value: summary.total },
        { label: `${t('tier1Desc')} / ${t('tier2Desc')}`, value: summary.highConfidence, color: 'var(--color-pl-success, #22c55e)' },
        { label: t('tier3Desc'), value: summary.needsReview, color: 'var(--color-pl-warning, #eab308)' },
        { label: t('noMatchDesc'), value: summary.noMatch, color: 'var(--color-pl-error, #ef4444)' },
    ]
    if (summary.aiSuggested > 0) items.push({ label: t('tier4Desc'), value: summary.aiSuggested, color: 'var(--color-pl-brand)' })
    return (
        <div className="flex flex-wrap gap-3 text-xs">
            {items.map(s => (
                <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-pl-surface-raised)' }}>
                    <span style={{ color: s.color ?? 'var(--color-pl-text-tertiary)' }} className="font-semibold">{s.value}</span>
                    <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{s.label}</span>
                </div>
            ))}
        </div>
    )
}

export default function AutoMapReview({
    datasetId,
    jobs,
    onSaved,
    onCreateJob,
    onEditJob,
    stateRef,
}: {
    datasetId: string
    jobs: Job[]
    onSaved?: () => void
    onCreateJob?: (employeeTitle: string, employeeId?: string) => void
    onEditJob?: (jobId: string, employeeId?: string) => void
    stateRef?: MutableRefObject<PersistedReviewState | null>
}) {
    const t = useTranslations('jobArchitecture')
    const [isPending, startTransition] = useTransition()

    const persisted = stateRef?.current
    const [summary, setSummary] = useState<AutoMapSummary | null>(persisted?.summary ?? null)
    const [rows, setRows] = useState<ReviewRow[]>(persisted?.rows ?? [])
    const [phase, setPhase] = useState<ReviewPhase>(persisted?.phase ?? 'idle')
    const [savedCount, setSavedCount] = useState(persisted?.savedCount ?? 0)
    const [error, setError] = useState<string | null>(null)

    // Sync state to ref so HeadcountTab can restore it after remount
    useEffect(() => {
        if (stateRef) stateRef.current = { phase, rows, summary, savedCount }
    }, [phase, rows, summary, savedCount, stateRef])

    // Convert results to review rows, sorted by confidence (high first)
    const toReviewRows = useCallback((results: AutoMapResult[]): ReviewRow[] =>
        results
            .map(r => ({ ...r, status: 'pending' as ReviewStatus, override_job_id: null }))
            .sort((a, b) => b.confidence - a.confidence),
    [])

    // Run auto-mapping
    const handleAutoMap = useCallback(() => {
        setError(null)
        setPhase('mapping')
        startTransition(async () => {
            const res = await runAutoMapping(datasetId)
            if (!res.success) {
                setError(res.error)
                setPhase('idle')
                return
            }
            setSummary(res.data)
            setRows(toReviewRows(res.data.results))
            setPhase('review')
        })
    }, [datasetId, toReviewRows, startTransition])

    // Run AI matching for unmatched
    const handleAiMatch = useCallback(() => {
        const unmatchedIds = rows
            .filter(r => r.confidence === 0 && r.status === 'pending')
            .map(r => r.employee_id)

        if (unmatchedIds.length === 0) return

        setError(null)
        setPhase('aiMatching')
        startTransition(async () => {
            const res = await runAiMatching(datasetId, unmatchedIds)
            if (!res.success) {
                setError(res.error)
                setPhase('review')
                return
            }

            // Merge AI results into existing rows
            const aiMap = new Map(res.data.map(r => [r.employee_id, r]))
            setRows(prev => prev.map(row => {
                const aiResult = aiMap.get(row.employee_id)
                if (aiResult && aiResult.suggested_job_id) {
                    return { ...row, ...aiResult, status: 'pending' as ReviewStatus, override_job_id: null }
                }
                return row
            }))

            // Update summary
            setSummary(prev => prev ? {
                ...prev,
                aiSuggested: res.data.filter(r => r.suggested_job_id).length,
                noMatch: prev.noMatch - res.data.filter(r => r.suggested_job_id).length,
            } : null)

            setPhase('review')
        })
    }, [datasetId, rows, startTransition])

    // Save a single assignment immediately (no full refresh — stays in review)
    const saveOne = useCallback((employeeId: string, jobId: string) => {
        startTransition(async () => {
            const res = await saveAutoMapResults(datasetId, [{
                employee_id: employeeId,
                job_id: jobId,
                confidence: rows.find(r => r.employee_id === employeeId)?.confidence ?? 0,
                match_reason: rows.find(r => r.employee_id === employeeId)?.match_reason ?? '',
                status: 'confirmed',
            }])
            if (res.success) {
                setSavedCount(prev => prev + 1)
            } else {
                console.error('[AutoMap] Save failed:', res.error)
                setError(res.error)
            }
        })
    }, [datasetId, rows, startTransition])

    // Confirm — save immediately
    const handleConfirm = useCallback((employeeId: string) => {
        const row = rows.find(r => r.employee_id === employeeId)
        const jobId = row?.override_job_id ?? row?.suggested_job_id
        if (!jobId) return
        setRows(prev => prev.map(r =>
            r.employee_id === employeeId ? { ...r, status: 'confirmed' as ReviewStatus } : r,
        ))
        saveOne(employeeId, jobId)
    }, [rows, saveOne])

    const handleReject = useCallback((employeeId: string) => {
        setRows(prev => prev.map(r =>
            r.employee_id === employeeId ? { ...r, status: 'rejected' as ReviewStatus } : r,
        ))
    }, [])

    // Override — change job selection without auto-confirming
    const handleOverride = useCallback((employeeId: string, jobId: string) => {
        const job = jobs.find(j => j.id === jobId)
        setRows(prev => prev.map(r =>
            r.employee_id === employeeId
                ? { ...r, override_job_id: jobId, suggested_job_id: jobId, suggested_job_title: job?.title ?? null, status: 'pending' as ReviewStatus }
                : r,
        ))
    }, [jobs])

    // Revert a confirmed row back to pending
    const handleRevert = useCallback((employeeId: string) => {
        setRows(prev => prev.map(r =>
            r.employee_id === employeeId ? { ...r, status: 'pending' as ReviewStatus } : r,
        ))
    }, [])

    // Bulk actions
    const handleConfirmAll = useCallback(() => {
        setRows(prev => prev.map(r =>
            r.status === 'pending' && r.suggested_job_id ? { ...r, status: 'confirmed' as ReviewStatus } : r,
        ))
    }, [])

    const handleConfirmHighConfidence = useCallback(() => {
        setRows(prev => prev.map(r =>
            r.status === 'pending' && r.suggested_job_id && r.confidence >= 0.8
                ? { ...r, status: 'confirmed' as ReviewStatus }
                : r,
        ))
    }, [])

    // Save
    const handleSave = useCallback(() => {
        const confirmed = rows.filter(r => r.status === 'confirmed' && r.suggested_job_id)
        if (confirmed.length === 0) return

        setPhase('saving')
        startTransition(async () => {
            const res = await saveAutoMapResults(
                datasetId,
                confirmed.map(r => ({
                    employee_id: r.employee_id,
                    job_id: r.suggested_job_id!,
                    confidence: r.confidence,
                    match_reason: r.match_reason,
                    status: 'confirmed' as const,
                })),
            )
            if (!res.success) {
                setError(res.error)
                setPhase('review')
                return
            }
            setSavedCount(res.saved)
            setPhase('saved')
            onSaved?.()
        })
    }, [datasetId, rows, startTransition, onSaved])

    const confirmedCount = rows.filter(r => r.status === 'confirmed').length
    const unmatchedCount = rows.filter(r => r.confidence === 0 && r.status === 'pending').length
    const jobList = jobs.map(j => ({ id: j.id, title: j.title, level_code: j.level_definition?.level_code ?? null }))

    return (
        <div className="space-y-4">
            {/* Header / trigger */}
            {phase === 'idle' && (
                <div className="glass-card p-6 text-center space-y-3">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('autoMap')}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('autoMapDesc')}
                    </p>
                    <button
                        onClick={handleAutoMap}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                        style={{ background: 'var(--color-pl-brand)' }}
                    >
                        <Wand2 size={14} />
                        {t('autoMap')}
                    </button>
                </div>
            )}

            {/* Loading states */}
            {phase === 'mapping' && (
                <div className="glass-card p-8 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: 'var(--color-pl-brand)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('autoMapping')}</p>
                </div>
            )}

            {phase === 'aiMatching' && (
                <div className="glass-card p-8 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: 'var(--color-pl-brand)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('aiMatching')}</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="glass-card p-4 text-sm" style={{ color: 'var(--color-pl-error, #ef4444)' }}>
                    {error}
                </div>
            )}

            {/* Review */}
            {(phase === 'review' || phase === 'saving') && summary && (
                <>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('autoMapResults')}
                        </h3>
                        <div className="flex items-center gap-2">
                            {unmatchedCount > 0 && (
                                <button
                                    onClick={handleAiMatch}
                                    disabled={isPending}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                                >
                                    <Wand2 size={12} />
                                    {t('aiMatch')} ({unmatchedCount})
                                </button>
                            )}
                            <button
                                onClick={handleConfirmHighConfidence}
                                disabled={isPending}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                            >
                                <CheckCircle2 size={12} />
                                {t('confirmHighConfidence')}
                            </button>
                            <button
                                onClick={handleConfirmAll}
                                disabled={isPending}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                            >
                                {t('confirmAll')}
                            </button>
                        </div>
                    </div>

                    <SummaryBar summary={summary} />

                    <AutoMapReviewTable
                        rows={rows}
                        jobs={jobList}
                        onConfirm={handleConfirm}
                        onReject={handleReject}
                        onOverride={handleOverride}
                        onRevert={handleRevert}
                        onCreateJob={onCreateJob ? (row) => onCreateJob(row.job_title ?? '', row.employee_id) : undefined}
                        onEditJob={onEditJob ? (jobId, employeeId) => onEditJob(jobId, employeeId) : undefined}
                        isSaving={phase === 'saving'}
                    />

                    <div className="flex items-center justify-between">
                        {savedCount > 0 && (
                            <p className="text-xs font-medium" style={{ color: 'var(--color-pl-success, #22c55e)' }}>
                                ✓ {t('savedCount', { count: savedCount })}
                            </p>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                            {/* Bulk save remaining confirmed rows */}
                            {confirmedCount > 0 && (
                                <button
                                    onClick={handleSave}
                                    disabled={isPending || phase === 'saving'}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                                    style={{ background: 'var(--color-pl-brand)' }}
                                >
                                    {phase === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    {t('saveResults')} ({confirmedCount})
                                </button>
                            )}
                            {/* Done — exit review and refresh */}
                            <button
                                onClick={() => { setPhase('idle'); setRows([]); setSummary(null); setSavedCount(0); onSaved?.() }}
                                className="px-4 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                            >
                                {t('dismiss')}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Saved confirmation */}
            {phase === 'saved' && (
                <div className="glass-card p-6 text-center space-y-2">
                    <CheckCircle2 size={32} className="mx-auto" style={{ color: 'var(--color-pl-success, #22c55e)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('savedCount', { count: savedCount })}
                    </p>
                </div>
            )}
        </div>
    )
}
