'use client'

import { useState, useTransition, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
    Upload, FileText, Loader2, CheckCircle2, AlertTriangle, X,
} from 'lucide-react'
import type { JobArchitectureContext, JdUploadResult } from '@/lib/jobArchitecture/types'
import { analyzeUploadedJD } from '@/app/(dashboard)/dashboard/job-architecture/jdUploadAction'
import JobModal from './JobModal'

// ============================================================
// Confidence bar
// ============================================================

function ConfidenceBar({ value, t }: { value: number; t: (k: string) => string }) {
    const pct = Math.round(value * 100)
    const color = pct >= 80 ? 'var(--color-pl-green)' : pct >= 50 ? '#f97316' : 'var(--color-pl-red)'
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--color-pl-border)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs font-mono" style={{ color }}>{pct}%</span>
        </div>
    )
}

// ============================================================
// Drop zone
// ============================================================

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED = ['.pdf', '.docx']

function DropZone({ onFile, isPending, t }: { onFile: (f: File) => void; isPending: boolean; t: (k: string) => string }) {
    const [dragOver, setDragOver] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const validate = useCallback((file: File): boolean => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        if (!ACCEPTED.includes(ext)) { setError(t('unsupportedFileType')); return false }
        if (file.size > MAX_SIZE) { setError(t('fileTooLarge')); return false }
        setError(null)
        return true
    }, [t])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file && validate(file)) onFile(file)
    }, [onFile, validate])

    const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && validate(file)) onFile(file)
    }, [onFile, validate])

    return (
        <div className="space-y-2">
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center gap-3 p-10 rounded-xl cursor-pointer transition-all"
                style={{
                    border: `2px dashed ${dragOver ? 'var(--color-pl-brand)' : 'var(--color-pl-border)'}`,
                    background: dragOver ? 'rgba(var(--color-pl-brand-rgb, 59,130,246), 0.05)' : 'var(--color-pl-surface-raised)',
                    opacity: isPending ? 0.6 : 1,
                }}
                onClick={() => document.getElementById('jd-file-input')?.click()}>
                {isPending ? (
                    <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-pl-brand)' }} />
                ) : (
                    <Upload size={32} style={{ color: 'var(--color-pl-text-tertiary)' }} />
                )}
                <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {isPending ? t('analyzing') : t('dropzoneTitle')}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('dropzoneHint')}
                    </p>
                </div>
                <input id="jd-file-input" type="file" accept=".pdf,.docx" className="hidden" onChange={handleInput} disabled={isPending} />
            </div>
            {error && (
                <div className="flex items-center gap-2 text-xs p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-pl-red)' }}>
                    <AlertTriangle size={13} /> {error}
                </div>
            )}
        </div>
    )
}

// ============================================================
// Result preview
// ============================================================

function ResultPreview({ result, ctx, onAccept, onDismiss, t }: {
    result: JdUploadResult; ctx: JobArchitectureContext
    onAccept: () => void; onDismiss: () => void; t: (k: string) => string
}) {
    const level = ctx.levels.find(l => l.id === result.suggested_level_id)

    return (
        <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{t('analysisResults')}</h3>
                <button onClick={onDismiss} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    <X size={16} />
                </button>
            </div>

            {/* Suggested level */}
            <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('suggestedLevel')}</span>
                {level ? (
                    <span className="px-2 py-0.5 text-xs font-mono rounded"
                        style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-brand-light)', border: '1px solid var(--color-pl-border)' }}>
                        {level.level_code}
                    </span>
                ) : (
                    <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{result.suggested_level_code}</span>
                )}
            </div>

            {/* Suggested family */}
            {result.suggested_family_name && (
                <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('suggestedFamily')}</span>
                    <span className="px-2 py-0.5 text-xs rounded"
                        style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-text-primary)', border: '1px solid var(--color-pl-border)' }}>
                        {result.suggested_family_name}
                    </span>
                </div>
            )}

            {/* Confidence */}
            <div>
                <span className="text-xs block mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('confidence')}</span>
                <ConfidenceBar value={result.confidence} t={t} />
            </div>

            {/* Reasoning */}
            <div>
                <span className="text-xs block mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('reasoning')}</span>
                <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>{result.reasoning}</p>
            </div>

            {/* Extracted title */}
            {result.extracted_title && (
                <div>
                    <span className="text-xs block mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('extractedTitle')}</span>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>{result.extracted_title}</p>
                </div>
            )}

            {/* Extracted summary */}
            {result.extracted_summary && (
                <div>
                    <span className="text-xs block mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('extractedSummary')}</span>
                    <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>{result.extracted_summary}</p>
                </div>
            )}

            {/* Extracted responsibilities */}
            {result.extracted_responsibilities.length > 0 && (
                <div>
                    <span className="text-xs block mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('responsibilities')}</span>
                    <ul className="list-disc list-inside">
                        {result.extracted_responsibilities.slice(0, 5).map((r, i) => (
                            <li key={i} className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>{r}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
                <button onClick={onAccept}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg"
                    style={{ background: 'var(--color-pl-brand)', color: '#fff' }}>
                    <CheckCircle2 size={14} /> {t('acceptCreateJob')}
                </button>
                <button onClick={onDismiss} className="px-4 py-2 text-sm rounded-lg"
                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>
                    {t('dismiss')}
                </button>
            </div>
        </div>
    )
}

// ============================================================
// Main component
// ============================================================

export default function JdUploadTab({ ctx, onUpdate }: { ctx: JobArchitectureContext; onUpdate: () => void }) {
    const t = useTranslations('jobArchitecture')
    const [isPending, startTransition] = useTransition()
    const [result, setResult] = useState<JdUploadResult | null>(null)
    const [jobModalOpen, setJobModalOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFile = (file: File) => {
        setError(null)
        startTransition(async () => {
            try {
                const formData = new FormData()
                formData.append('file', file)
                const res = await analyzeUploadedJD(formData)
                if (res.success) {
                    setResult(res.data)
                } else {
                    setError(res.error)
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Analysis failed')
            }
        })
    }

    const handleAccept = () => setJobModalOpen(true)
    const handleDismiss = () => setResult(null)

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-pl-text-primary)' }}>{t('jdUploadTitle')}</h2>
                <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('jdUploadDesc')}</p>
            </div>

            {!result && <DropZone onFile={handleFile} isPending={isPending} t={t} />}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                    <AlertTriangle size={16} className="flex-shrink-0" />
                    {error}
                </div>
            )}
            {result && !jobModalOpen && <ResultPreview result={result} ctx={ctx} onAccept={handleAccept} onDismiss={handleDismiss} t={t} />}

            {jobModalOpen && result && (
                <JobModal job={null}
                    familyId={result.suggested_family_id ?? ctx.jobFamilies[0]?.id ?? ''}
                    ctx={ctx}
                    prefill={{
                        title: result.extracted_title ?? '',
                        summary: result.extracted_summary ?? '',
                        responsibilities: result.extracted_responsibilities,
                        qualifications: result.extracted_qualifications,
                        levelId: result.suggested_level_id ?? undefined,
                        competencyIds: result.suggested_competency_ids,
                        competencies: result.suggested_competencies,
                    }}
                    onClose={() => setJobModalOpen(false)}
                    onSaved={() => { onUpdate(); setJobModalOpen(false); setResult(null) }} />
            )}
        </div>
    )
}
