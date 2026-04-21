'use client'

import { useState, useCallback, useTransition, useEffect, type MutableRefObject } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, ArrowRightLeft, CheckCircle2, Save } from 'lucide-react'
import type { CarryoverSummary, CarryoverResult } from '@/app/(dashboard)/dashboard/job-architecture/carryoverAction'
import { runCarryover, saveCarryoverResults, getCarryoverSourceDatasets } from '@/app/(dashboard)/dashboard/job-architecture/carryoverAction'
import CarryoverReviewTable from './CarryoverReviewTable'
import type { Job } from '@/lib/jobArchitecture/types'

// ── Types ───────────────────────────────────────────────────
export type CarryoverPhase = 'idle' | 'loading' | 'review' | 'saving' | 'saved'
export type PersistedCarryoverState = {
    phase: CarryoverPhase
    rows: CarryoverReviewRow[]
    summary: CarryoverSummary | null
    savedCount: number
}
export type CarryoverRowStatus = 'pending' | 'confirmed' | 'rejected'
export type CarryoverReviewRow = CarryoverResult & {
    status: CarryoverRowStatus
    override_job_id: string | null
}

// ── Summary bar ─────────────────────────────────────────────
function SummaryBar({ summary }: { summary: CarryoverSummary }) {
    const t = useTranslations('jobArchitecture')
    const items = [
        { label: t('carryoverUnchanged'), value: summary.unchanged, color: 'var(--color-pl-success, #22c55e)' },
        { label: t('carryoverChanged'), value: summary.changed, color: 'var(--color-pl-warning, #eab308)' },
        { label: t('carryoverNewHire'), value: summary.newHires, color: 'var(--color-pl-brand)' },
        { label: t('carryoverDeparted'), value: summary.departed, color: 'var(--color-pl-text-tertiary)' },
    ]
    return (
        <div className="flex flex-wrap gap-3 text-xs">
            {items.map(s => (
                <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-pl-surface-raised)' }}>
                    <span style={{ color: s.color }} className="font-semibold">{s.value}</span>
                    <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{s.label}</span>
                </div>
            ))}
        </div>
    )
}

// ── Main component ──────────────────────────────────────────
export default function CarryoverReview({
    datasetId, jobs, onSaved, stateRef, onCreateJob, onEditJob,
}: {
    datasetId: string
    jobs: Job[]
    onSaved?: () => void
    stateRef?: MutableRefObject<PersistedCarryoverState | null>
    onCreateJob?: (employeeTitle: string, employeeId?: string) => void
    onEditJob?: (jobId: string, employeeId?: string) => void
}) {
    const t = useTranslations('jobArchitecture')
    const [isPending, startTransition] = useTransition()
    const persisted = stateRef?.current
    const [phase, setPhase] = useState<CarryoverPhase>(persisted?.phase ?? 'idle')
    const [summary, setSummary] = useState<CarryoverSummary | null>(persisted?.summary ?? null)
    const [rows, setRows] = useState<CarryoverReviewRow[]>(persisted?.rows ?? [])
    const [savedCount, setSavedCount] = useState(persisted?.savedCount ?? 0)
    const [error, setError] = useState<string | null>(null)
    const [sourceDatasets, setSourceDatasets] = useState<Array<{ id: string; name: string; reporting_year: number }>>([])
    const [selectedSource, setSelectedSource] = useState('')

    // Load source datasets on mount
    useEffect(() => {
        startTransition(async () => {
            const res = await getCarryoverSourceDatasets(datasetId)
            if (res.success) {
                setSourceDatasets(res.data)
                if (res.data.length > 0) setSelectedSource(res.data[0].id)
            }
        })
    }, [datasetId])

    // Sync state to ref so parent can restore after remount
    useEffect(() => {
        if (stateRef) stateRef.current = { phase, rows, summary, savedCount }
    }, [phase, rows, summary, savedCount, stateRef])

    const toReviewRows = useCallback((results: CarryoverResult[]): CarryoverReviewRow[] =>
        results
            .filter(r => r.category !== 'departed')
            .map(r => ({
                ...r,
                status: (r.category === 'unchanged' ? 'confirmed' : 'pending') as CarryoverRowStatus,
                override_job_id: null,
            }))
            .sort((a, b) => {
                const order: Record<string, number> = { changed: 0, unchanged: 1, new_hire: 2 }
                return (order[a.category] ?? 3) - (order[b.category] ?? 3)
            }),
    [])

    const handleRunCarryover = useCallback(() => {
        if (!selectedSource) return
        setError(null)
        setPhase('loading')
        startTransition(async () => {
            const res = await runCarryover(datasetId, selectedSource)
            if (!res.success) { setError(res.error); setPhase('idle'); return }
            setSummary(res.data)
            setRows(toReviewRows(res.data.results))
            setPhase('review')
        })
    }, [datasetId, selectedSource, toReviewRows, startTransition])

    const saveOne = useCallback((employeeId: string, jobId: string) => {
        startTransition(async () => {
            const row = rows.find(r => r.employee_id === employeeId)
            if (!row) return
            const res = await saveCarryoverResults(datasetId, [{
                employee_id: employeeId, job_id: jobId,
                identity_id: row.identity_id, source_employee_id: row.source_employee_id,
                match_method: row.match_method, match_confidence: row.match_confidence,
                change_flags: row.change_flags,
            }], selectedSource)
            if (res.success) setSavedCount(prev => prev + 1)
            else setError(res.error)
        })
    }, [datasetId, rows, startTransition])

    const handleConfirm = useCallback((employeeId: string) => {
        const row = rows.find(r => r.employee_id === employeeId)
        const jobId = row?.override_job_id ?? row?.carried_job_id
        if (!jobId) return
        setRows(prev => prev.map(r =>
            r.employee_id === employeeId ? { ...r, status: 'confirmed' as CarryoverRowStatus } : r,
        ))
        saveOne(employeeId, jobId)
    }, [rows, saveOne])

    const handleReject = useCallback((employeeId: string) => {
        setRows(prev => prev.map(r =>
            r.employee_id === employeeId ? { ...r, status: 'rejected' as CarryoverRowStatus } : r,
        ))
    }, [])

    const handleOverride = useCallback((employeeId: string, jobId: string) => {
        const job = jobs.find(j => j.id === jobId)
        setRows(prev => prev.map(r =>
            r.employee_id === employeeId
                ? { ...r, override_job_id: jobId, carried_job_id: jobId, carried_job_title: job?.title ?? '', status: 'pending' as CarryoverRowStatus }
                : r,
        ))
    }, [jobs])

    const handleRevert = useCallback((employeeId: string) => {
        setRows(prev => prev.map(r =>
            r.employee_id === employeeId ? { ...r, status: 'pending' as CarryoverRowStatus } : r,
        ))
    }, [])

    const handleConfirmAllUnchanged = useCallback(() => {
        setRows(prev => prev.map(r =>
            r.status === 'pending' && r.category === 'unchanged' ? { ...r, status: 'confirmed' as CarryoverRowStatus } : r,
        ))
    }, [])

    const handleConfirmAllWithJob = useCallback(() => {
        setRows(prev => prev.map(r =>
            r.status === 'pending' && r.carried_job_id ? { ...r, status: 'confirmed' as CarryoverRowStatus } : r,
        ))
    }, [])

    const handleSave = useCallback(() => {
        const confirmed = rows.filter(r => r.status === 'confirmed' && (r.override_job_id ?? r.carried_job_id))
        if (confirmed.length === 0) return
        setPhase('saving')
        startTransition(async () => {
            const res = await saveCarryoverResults(datasetId, confirmed.map(r => ({
                employee_id: r.employee_id, job_id: (r.override_job_id ?? r.carried_job_id)!,
                identity_id: r.identity_id, source_employee_id: r.source_employee_id,
                match_method: r.match_method, match_confidence: r.match_confidence,
                change_flags: r.change_flags,
            })), selectedSource)
            if (!res.success) { setError(res.error); setPhase('review'); return }
            setSavedCount(res.saved)
            setPhase('saved')
            onSaved?.()
        })
    }, [datasetId, rows, startTransition, onSaved])

    const confirmedCount = rows.filter(r => r.status === 'confirmed').length
    const jobList = jobs.map(j => ({ id: j.id, title: j.title, level_code: j.level_definition?.level_code ?? null }))
    const btnStyle = { background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }

    return (
        <div className="space-y-4">
            {phase === 'idle' && (
                <div className="glass-card p-6 text-center space-y-3">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('carryoverTitle')}</h3>
                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('carryoverDesc')}</p>
                    {sourceDatasets.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('carryoverNoSource')}</p>
                    ) : (
                        <>
                            <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)}
                                className="text-sm px-3 py-2 rounded-lg" style={btnStyle}>
                                {sourceDatasets.map(ds => (
                                    <option key={ds.id} value={ds.id}>{ds.name} ({ds.reporting_year})</option>
                                ))}
                            </select>
                            <button onClick={handleRunCarryover} disabled={isPending || !selectedSource}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                                style={{ background: 'var(--color-pl-brand)' }}>
                                <ArrowRightLeft size={14} />
                                {t('carryoverRun')}
                            </button>
                        </>
                    )}
                </div>
            )}

            {phase === 'loading' && (
                <div className="glass-card p-8 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: 'var(--color-pl-brand)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('carryoverLoading')}</p>
                </div>
            )}

            {error && (
                <div className="glass-card p-4 text-sm" style={{ color: 'var(--color-pl-error, #ef4444)' }}>{error}</div>
            )}

            {(phase === 'review' || phase === 'saving') && summary && (
                <>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('carryoverResults')}</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={handleConfirmAllUnchanged} disabled={isPending}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={btnStyle}>
                                <CheckCircle2 size={12} />
                                {t('carryoverConfirmUnchanged')}
                            </button>
                            <button onClick={handleConfirmAllWithJob} disabled={isPending}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={btnStyle}>
                                {t('carryoverConfirmAll')}
                            </button>
                        </div>
                    </div>
                    <SummaryBar summary={summary} />
                    <CarryoverReviewTable rows={rows} jobs={jobList} onConfirm={handleConfirm}
                        onReject={handleReject} onOverride={handleOverride} onRevert={handleRevert}
                        onCreateJob={onCreateJob ? (row) => onCreateJob(row.job_title ?? '', row.employee_id) : undefined}
                        onEditJob={onEditJob ? (jobId, employeeId) => onEditJob(jobId, employeeId) : undefined}
                        isSaving={phase === 'saving'} />
                    <div className="flex items-center justify-between">
                        {savedCount > 0 && (
                            <p className="text-xs font-medium" style={{ color: 'var(--color-pl-success, #22c55e)' }}>
                                ✓ {t('savedCount', { count: savedCount })}
                            </p>
                        )}
                        <div className="flex items-center gap-2 ml-auto">
                            {confirmedCount > 0 && (
                                <button onClick={handleSave} disabled={isPending || phase === 'saving'}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                                    style={{ background: 'var(--color-pl-brand)' }}>
                                    {phase === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    {t('saveResults')} ({confirmedCount})
                                </button>
                            )}
                            <button onClick={() => { setPhase('idle'); setRows([]); setSummary(null); setSavedCount(0); onSaved?.() }}
                                className="px-4 py-2 rounded-lg text-sm font-medium" style={btnStyle}>
                                {t('dismiss')}
                            </button>
                        </div>
                    </div>
                </>
            )}

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
