'use client'

import { useState, useCallback, useTransition, useRef } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import {
    Upload, FileSpreadsheet, Sparkles, CheckCircle2, Clock,
    ChevronRight, ChevronUp, ChevronDown, AlertCircle, ShieldCheck, ArrowLeft,
    Loader2, Info, UserCheck, User, FileText, ExternalLink
} from 'lucide-react'
import {
    parseUploadedFile,
    runAiColumnMapping,
    confirmMappingAndProcess,
    acceptAvv,
} from './actions'
import { runDatasetAnalysis } from '../analysis/actions'
import { trackDatasetUpload } from '@/lib/analytics'
import {
    PAYLENS_FIELDS,
    type ColumnMapping,
    type MappingConfidence,
} from './constants'

// ============================================================
// Types & constants
// ============================================================

type Step = 1 | 2 | 3 | 4
type WizardState = {
    datasetId: string
    headers: string[]
    sampleRows: Record<string, string>[]
    rowCount: number
    mapping: ColumnMapping
    confidence: MappingConfidence
    usedAi: boolean
    includeNames: boolean
    aiError?: string
    standardWeeklyHours: number     // org full-time reference
    defaultSalaryPeriod: string     // 'annual' | 'monthly' | 'hourly'
    defaultVariablePayType: 'eur' | 'pct' | 'auto'  // how salary_variable values are expressed
}

const STEP_KEYS = [
    { n: 1, labelKey: 'step1Label' },
    { n: 2, labelKey: 'step2Label' },
    { n: 3, labelKey: 'step3Label' },
    { n: 4, labelKey: 'step4Label' },
] as const

const CURRENT_YEAR = new Date().getFullYear()
const MIN_YEAR = 1900
const MAX_YEAR = 2100

// ============================================================
// Step progress bar
// ============================================================

function StepBar({ current }: { current: Step }) {
    const t = useTranslations('importWizard')
    return (
        <div className="flex items-center gap-0 mb-8">
            {STEP_KEYS.map((s, i) => (
                <div key={s.n} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                            style={{
                                background: current >= s.n
                                    ? current === s.n ? 'var(--color-pl-brand)' : 'rgba(34,197,94,0.2)'
                                    : 'var(--theme-pl-action-hover)',
                                border: `2px solid ${current >= s.n
                                    ? current === s.n ? 'var(--color-pl-brand)' : 'var(--color-pl-green)'
                                    : 'var(--color-pl-border)'}`,
                                color: current > s.n ? 'var(--color-pl-green)' : current === s.n ? '#fff' : 'var(--color-pl-text-tertiary)',
                            }}
                        >
                            {current > s.n ? <CheckCircle2 size={16} /> : s.n}
                        </div>
                        <span className="text-xs whitespace-nowrap" style={{
                            color: current >= s.n ? 'var(--color-pl-text-primary)' : 'var(--color-pl-text-tertiary)',
                            fontWeight: current === s.n ? 600 : 400,
                        }}>
                            {t(s.labelKey)}
                        </span>
                    </div>
                    {i < STEP_KEYS.length - 1 && (
                        <div className="flex-1 h-px mx-2 mb-5 transition-all duration-500"
                            style={{ background: current > s.n ? 'var(--color-pl-green)' : 'var(--color-pl-border)' }} />
                    )}
                </div>
            ))}
        </div>
    )
}

// ============================================================
// Step 1 — File upload + name toggle
// ============================================================

function StepUpload({ onNext }: { onNext: (state: WizardState) => void }) {
    const t = useTranslations('importWizard')
    const format = useFormatter()
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [datasetName, setDatasetName] = useState('')
    const [year, setYear] = useState(CURRENT_YEAR)
    const [includeNames, setIncludeNames] = useState(false)
    const [standardWeeklyHours, setStandardWeeklyHours] = useState(40)
    const [defaultSalaryPeriod, setDefaultSalaryPeriod] = useState('annual')
    const [defaultVariablePayType, setDefaultVariablePayType] = useState<'eur' | 'pct' | 'auto'>('auto')
    const [error, setError] = useState('')
    const [isPending, startTransition] = useTransition()
    const inputRef = useRef<HTMLInputElement>(null)

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const dropped = e.dataTransfer.files[0]
        if (dropped) setFile(dropped)
    }, [])

    async function handleSubmit() {
        if (!file) return setError(t('noFileError'))
        if (!datasetName.trim()) return setError(t('noNameError'))
        setError('')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('datasetName', datasetName)
        formData.append('reportingYear', String(year))

        startTransition(async () => {
            const result = await parseUploadedFile(formData)
            if (result.error) {
                setError(result.error)
            } else {
                onNext({
                    datasetId: result.datasetId!,
                    headers: result.headers!,
                    sampleRows: result.sampleRows!,
                    rowCount: result.rowCount!,
                    mapping: {},
                    confidence: {},
                    usedAi: false,
                    includeNames,
                    standardWeeklyHours,
                    defaultSalaryPeriod,
                    defaultVariablePayType,
                })
            }
        })
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('uploadTitle')}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {t('uploadFormats')}
                </p>
            </div>

            {/* Drop zone */}
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className="rounded-xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200"
                style={{
                    borderColor: isDragging ? 'var(--color-pl-brand)' : file ? 'var(--color-pl-green)' : 'var(--color-pl-border)',
                    background: isDragging ? 'rgba(59,130,246,0.05)' : file ? 'rgba(34,197,94,0.04)' : 'var(--theme-pl-action-ghost)',
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.ods"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && setFile(e.target.files[0])}
                />
                {file ? (
                    <>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <FileSpreadsheet size={22} style={{ color: 'var(--color-pl-green)' }} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{file.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                {(file.size / 1024).toFixed(0)} KB — {t('clickToChange')}
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                            <Upload size={22} style={{ color: 'var(--color-pl-brand-light)' }} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                {t('dropOrClick')}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {t('fileFormats')}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Dataset name + year */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('datasetName')}
                    </label>
                    <input
                        type="text"
                        value={datasetName}
                        onChange={e => setDatasetName(e.target.value)}
                        placeholder={t('datasetNamePlaceholder')}
                        className="input-base"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('reportingYear')}
                    </label>
                    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-pl-border)' }}>
                        <input
                            type="number"
                            value={year}
                            min={MIN_YEAR}
                            max={MAX_YEAR}
                            onChange={e => {
                                const v = parseInt(e.target.value)
                                if (!isNaN(v)) setYear(Math.min(MAX_YEAR, Math.max(MIN_YEAR, v)))
                            }}
                            className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
                            style={{ color: 'var(--color-pl-text-primary)' }}
                        />
                        <div className="flex flex-col border-l" style={{ borderColor: 'var(--color-pl-border)' }}>
                            <button type="button" onClick={() => setYear(y => Math.min(MAX_YEAR, y + 1))}
                                className="flex-1 px-2 flex items-center justify-center transition-colors"
                                style={{ color: 'var(--color-pl-text-secondary)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <ChevronUp size={13} />
                            </button>
                            <button type="button" onClick={() => setYear(y => Math.max(MIN_YEAR, y - 1))}
                                className="flex-1 px-2 flex items-center justify-center border-t transition-colors"
                                style={{ color: 'var(--color-pl-text-secondary)', borderColor: 'var(--color-pl-border)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <ChevronDown size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Working hours settings */}
            <div className="rounded-xl p-4 space-y-3"
                style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid var(--color-pl-border)' }}>
                <div className="flex items-center gap-2 mb-1">
                    <Clock size={14} style={{ color: 'var(--color-pl-brand-light)' }} />
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('workingHoursTitle')}
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('ftReference')}
                        </label>
                        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-pl-border)' }}>
                            <input
                                type="number"
                                value={standardWeeklyHours}
                                min={1} max={60} step={0.5}
                                onChange={e => {
                                    const v = parseFloat(e.target.value)
                                    if (!isNaN(v)) setStandardWeeklyHours(Math.min(60, Math.max(1, v)))
                                }}
                                className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                                style={{ color: 'var(--color-pl-text-primary)' }}
                            />
                            <div className="flex flex-col border-l" style={{ borderColor: 'var(--color-pl-border)' }}>
                                <button type="button" onClick={() => setStandardWeeklyHours(h => Math.min(60, h + 0.5))}
                                    className="flex-1 px-2 flex items-center justify-center transition-colors"
                                    style={{ color: 'var(--color-pl-text-secondary)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <ChevronUp size={12} />
                                </button>
                                <button type="button" onClick={() => setStandardWeeklyHours(h => Math.max(1, h - 0.5))}
                                    className="flex-1 px-2 flex items-center justify-center border-t transition-colors"
                                    style={{ color: 'var(--color-pl-text-secondary)', borderColor: 'var(--color-pl-border)' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <ChevronDown size={12} />
                                </button>
                            </div>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('ftDefault')}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('salaryPeriod')}
                        </label>
                        <select value={defaultSalaryPeriod} onChange={e => setDefaultSalaryPeriod(e.target.value)} className="input-base text-sm py-2">
                            <option value="annual">{t('salaryAnnual')}</option>
                            <option value="monthly">{t('salaryMonthly')}</option>
                            <option value="hourly">{t('salaryHourly')}</option>
                        </select>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('salaryPeriodHint')}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('variablePayFormat')}
                        </label>
                        <select value={defaultVariablePayType} onChange={e => setDefaultVariablePayType(e.target.value as 'eur' | 'pct' | 'auto')} className="input-base text-sm py-2">
                            <option value="auto">{t('variablePayAuto')}</option>
                            <option value="eur">{t('variablePayEur')}</option>
                            <option value="pct">{t('variablePayPct')}</option>
                        </select>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('variablePayHint')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Name toggle */}
            <div
                className="rounded-xl p-4"
                style={{
                    background: includeNames ? 'rgba(245,158,11,0.06)' : 'var(--theme-pl-action-ghost)',
                    border: `1px solid ${includeNames ? 'rgba(245,158,11,0.25)' : 'var(--color-pl-border)'}`,
                    transition: 'all 0.2s ease',
                }}
            >
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                                background: includeNames ? 'rgba(245,158,11,0.15)' : 'var(--theme-pl-action-hover)',
                                border: `1px solid ${includeNames ? 'rgba(245,158,11,0.3)' : 'var(--color-pl-border)'}`,
                            }}>
                            <User size={15} style={{ color: includeNames ? 'var(--color-pl-amber)' : 'var(--color-pl-text-tertiary)' }} />
                        </div>
                        <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>
                                {t('includeNames')}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {t('includeNamesHint')}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIncludeNames(v => !v)}
                        className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200"
                        style={{
                            background: includeNames ? 'var(--color-pl-amber)' : 'var(--color-pl-border)',
                            border: `1px solid ${includeNames ? 'rgba(245,158,11,0.5)' : 'var(--color-pl-border)'}`,
                        }}
                        aria-label={t('includeNamesAriaLabel')}
                    >
                        <span
                            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                            style={{ transform: includeNames ? 'translateX(20px)' : 'translateX(0)' }}
                        />
                    </button>
                </div>

                {includeNames && (
                    <div className="mt-3 pt-3 text-xs flex items-start gap-2"
                        style={{ borderTop: '1px solid rgba(245,158,11,0.15)', color: 'var(--color-pl-text-secondary)' }}>
                        <AlertCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-pl-amber)' }} />
                        <span>
                            {t.rich('gdprNamesNote', { strong: (chunks) => <strong style={{ color: 'var(--color-pl-text-primary)' }}>{chunks}</strong> })}
                        </span>
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-sm p-3 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={isPending || !file}
                className="btn-primary w-full"
                style={isPending || !file ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
                {isPending ? <><Loader2 size={16} className="animate-spin" /> {t('uploading')}</> : <>{t('next')} <ChevronRight size={16} /></>}
            </button>
        </div>
    )
}

// ============================================================
// Step 2 — GDPR consent (with back button)
// ============================================================

function StepGdpr({ state, onAiConsent, onManual, onBack, aiError, onRetry, isRetrying }: {
    state: WizardState
    onAiConsent: () => void
    onManual: () => void
    onBack: () => void
    aiError?: string
    onRetry?: () => void
    isRetrying?: boolean
}) {
    const t = useTranslations('importWizard')
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('gdprTitle')}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {t.rich('gdprRowCount', { count: state.rowCount.toLocaleString(), cols: state.headers.length, strong: (chunks) => <strong style={{ color: 'var(--color-pl-text-primary)' }}>{chunks}</strong> })}
                    {state.includeNames && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--color-pl-amber)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <UserCheck size={11} /> {t('withNames')}
                        </span>
                    )}
                </p>
            </div>

            {/* AI option */}
            <div className="rounded-xl p-5 space-y-4"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div className="flex items-center gap-2">
                    <span className="ai-badge"><Sparkles size={10} /> Auto</span>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('aiAutoTitle')}
                    </h3>
                </div>

                <div className="space-y-2 text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    <p className="font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>{t('aiSentTitle')}</p>
                    <ul className="space-y-1.5 ml-1">
                        {[t('aiItem1'), t('aiItem2'), t('aiItem3'), t('aiItem4'), t('aiItem5')].map((item, i) => <li key={i}>{item}</li>)}
                        {state.includeNames && (
                            <li style={{ color: 'var(--color-pl-amber)' }}>
                                {t.rich('aiNamesNote', { strong: (chunks) => <strong>{chunks}</strong> })}
                            </li>
                        )}
                    </ul>
                </div>

                <div className="p-3 rounded-lg text-xs"
                    style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--color-pl-text-secondary)' }}>
                    {t.rich('aiLegalBasis', { strong: (chunks) => <strong style={{ color: 'var(--color-pl-text-primary)' }}>{chunks}</strong> })}
                </div>

                <button onClick={onAiConsent} disabled={isRetrying} className="btn-primary w-full"
                    style={isRetrying ? { opacity: 0.7, cursor: 'not-allowed' } : {}}>
                    {isRetrying
                        ? <><Loader2 size={15} className="animate-spin" /> {t('aiAnalysing')}</>
                        : <><Sparkles size={15} /> {t('aiUseAutoBtn')}</>
                    }
                </button>
            </div>

            {/* AI error banner with retry */}
            {aiError && (
                <div className="rounded-xl p-4 space-y-3"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-pl-red)' }} />
                        <p className="text-sm" style={{ color: 'var(--color-pl-red)' }}>{aiError}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onRetry} disabled={isRetrying} className="btn-primary flex-1 text-sm"
                            style={isRetrying ? { opacity: 0.7, cursor: 'not-allowed' } : {}}>
                            {isRetrying ? <><Loader2 size={14} className="animate-spin" /> {t('aiRetrying')}</> : t('aiRetryBtn')}
                        </button>
                        <button onClick={onManual} className="btn-outline flex-1 text-sm">
                            {t('aiManualBtn')}
                        </button>
                    </div>
                </div>
            )}

            {/* Manual option */}
            <div className="text-center">
                <button onClick={onManual} className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {t.rich('aiManualLink', { accent: (chunks) => <span style={{ color: 'var(--color-pl-brand-light)' }}>{chunks}</span> })}
                </button>
            </div>

            {/* Back button */}
            <button onClick={onBack} className="btn-outline w-full">
                <ArrowLeft size={15} /> {t('back')}
            </button>
        </div>
    )
}

// ============================================================
// Step 3 — Column mapping review
// ============================================================

const BASE_FIELD_OPTIONS = [
    { value: '', labelKey: null as string | null },
    ...PAYLENS_FIELDS.filter(f => !f.nameField).map(f => ({ value: f.key, labelKey: null as string | null, label: f.label })),
]

const NAME_FIELD_OPTIONS = PAYLENS_FIELDS.filter(f => f.nameField).map(f => ({ value: f.key, label: f.label }))

function ConfidenceBadge({ score }: { score: number }) {
    const pct = Math.round(score * 100)
    const color = pct >= 80 ? 'var(--color-pl-green)' : pct >= 50 ? 'var(--color-pl-amber)' : 'var(--color-pl-red)'
    return (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
            background: `${color}20`, color, border: `1px solid ${color}40`
        }}>
            {pct}%
        </span>
    )
}

function StepMapping({ state, onNext, onBack }: {
    state: WizardState
    onNext: (mapping: ColumnMapping) => void
    onBack: () => void
}) {
    const t = useTranslations('importWizard')
    const [mapping, setMapping] = useState<ColumnMapping>(state.mapping)

    const requiredFields = PAYLENS_FIELDS.filter(f => f.required).map(f => f.key)
    const mappedFields = Object.values(mapping).filter(Boolean)
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f))

    const ignoreLabel = t('mappingIgnore')
    const fieldOptions = [
        { value: '', label: ignoreLabel },
        ...PAYLENS_FIELDS.filter(f => !f.nameField).map(f => ({ value: f.key, label: f.label })),
        ...(state.includeNames ? NAME_FIELD_OPTIONS : []),
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('mappingTitle')} {state.usedAi && <span className="ai-badge ml-2"><Sparkles size={10} /> Auto</span>}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {state.usedAi ? t('mappingAiSuggested') : t('mappingManualInstr')}
                    {state.includeNames && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--color-pl-amber)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <UserCheck size={11} /> {t('mappingNamesAvail')}
                        </span>
                    )}
                </p>
            </div>

            {state.aiError && (
                <div className="flex items-start gap-2 p-3 rounded-lg text-sm"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--color-pl-amber)' }}>
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{state.aiError}{t('mappingAiErrorSuffix')}</span>
                </div>
            )}

            {missingRequired.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg text-sm"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--color-pl-amber)' }}>
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{t.rich('mappingMissing', { fields: missingRequired.map(f => PAYLENS_FIELDS.find(p => p.key === f)?.label).join(', '), strong: (chunks) => <strong>{chunks}</strong> })}</span>
                </div>
            )}

            {/* Mapping table */}
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-pl-border)' }}>
                <div className="grid grid-cols-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                    style={{ background: 'var(--theme-pl-action-ghost)', color: 'var(--color-pl-text-tertiary)', borderBottom: '1px solid var(--color-pl-border)' }}>
                    <span>{t('mappingColYourCol')}</span>
                    <span>{t('mappingColSample')}</span>
                    <span className="flex items-center justify-between">
                        {t('mappingColField')}
                        <span className="normal-case font-normal" style={{ color: mappedFields.length > 0 ? 'var(--color-pl-green)' : 'var(--color-pl-text-tertiary)' }}>
                            {t('mappingCountMapped', { mapped: mappedFields.length, total: state.headers.length })}
                        </span>
                    </span>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--color-pl-border)' }}>
                    {state.headers.map(header => {
                        const isMatched = !!(mapping[header])
                        const isRequired = (() => {
                            const mappedKey = mapping[header]
                            return mappedKey ? PAYLENS_FIELDS.find(f => f.key === mappedKey)?.required : false
                        })()
                        return (
                            <div key={header}
                                className="grid grid-cols-3 items-center px-4 py-3 gap-3 transition-all"
                                style={{
                                    background:   isMatched ? 'rgba(52,211,153,0.04)' : 'var(--theme-pl-action-ghost)',
                                    borderLeft:   `3px solid ${isMatched ? (isRequired ? '#34d399' : 'rgba(52,211,153,0.5)') : 'transparent'}`,
                                    paddingLeft:  isMatched ? '13px' : '16px',
                                }}>
                                <div className="flex items-center gap-2">
                                    {isMatched ? (
                                        <CheckCircle2 size={14} className="flex-shrink-0"
                                            style={{ color: isRequired ? '#34d399' : 'rgba(52,211,153,0.65)' }} />
                                    ) : (
                                        <div className="w-3.5 h-3.5 rounded-full border flex-shrink-0"
                                            style={{ borderColor: 'var(--color-pl-text-tertiary)' }} />
                                    )}
                                    <span className="text-sm font-medium"
                                        style={{ color: isMatched ? 'var(--color-pl-text-primary)' : 'var(--color-pl-text-secondary)' }}>
                                        {header}
                                    </span>
                                    {state.confidence[header] !== undefined && state.confidence[header] > 0 && (
                                        <ConfidenceBadge score={state.confidence[header]} />
                                    )}
                                </div>
                                <div className="text-xs truncate"
                                    style={{ color: isMatched ? 'var(--color-pl-text-secondary)' : 'var(--color-pl-text-tertiary)' }}>
                                    {state.sampleRows.slice(0, 3).map(r => r[header]).filter(Boolean).join(' · ')}
                                </div>
                                <select
                                    value={mapping[header] ?? ''}
                                    onChange={e => setMapping(prev => ({ ...prev, [header]: e.target.value || null }))}
                                    className="input-base text-sm py-1.5"
                                    style={isMatched ? {
                                        borderColor: isRequired ? 'rgba(52,211,153,0.5)' : 'rgba(52,211,153,0.25)',
                                        color: 'var(--color-pl-text-primary)',
                                    } : {
                                        color: 'var(--color-pl-text-tertiary)',
                                    }}>
                                    {fieldOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex gap-3">
                <button onClick={onBack} className="btn-outline flex-1">
                    <ArrowLeft size={15} /> {t('back')}
                </button>
                <button
                    onClick={() => onNext(mapping)}
                    disabled={missingRequired.length > 0}
                    className="btn-primary flex-1"
                    style={missingRequired.length > 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                    {t('next')} <ChevronRight size={16} />
                </button>
            </div>
        </div>
    )
}

// ============================================================
// DoneScreen — post-import success + one-click analysis
// ============================================================

function DoneScreen({ state, mappedCount, hoursCoverage, onReset }: {
    state: WizardState & { finalMapping: ColumnMapping }
    mappedCount: number
    hoursCoverage: number | null
    onReset: () => void
}) {
    const t = useTranslations('importWizard')
    const [analysing, setAnalysing] = useState(false)
    const [analysisError, setAnalysisError] = useState('')

    async function handleStartAnalysis() {
        setAnalysing(true)
        setAnalysisError('')
        const name = `Analyse ${new Date().getFullYear()}`
        const result = await runDatasetAnalysis(state.datasetId, name)
        if (result.error) {
            setAnalysisError(result.error)
            setAnalysing(false)
            return
        }
        window.location.href = '/dashboard/analysis'
    }

    return (
        <div className="text-center space-y-6 py-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: analysing ? 'rgba(99,102,241,0.15)' : 'rgba(34,197,94,0.15)', border: `2px solid ${analysing ? '#6366f1' : 'var(--color-pl-green)'}`, transition: 'all 0.3s' }}>
                {analysing
                    ? <Loader2 size={28} className="animate-spin" style={{ color: '#6366f1' }} />
                    : <CheckCircle2 size={32} style={{ color: 'var(--color-pl-green)' }} />
                }
            </div>
            <div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {analysing ? t('doneAnalysing') : t('doneTitle')}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {analysing
                        ? t('doneWait')
                        : t('doneSummary', { rows: state.rowCount.toLocaleString(), fields: mappedCount })}
                </p>
                {!analysing && hoursCoverage !== null && hoursCoverage < 100 && (
                    <div className="flex items-center gap-2 mt-3 p-3 rounded-lg text-sm"
                        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--color-pl-amber)' }}>
                        <Clock size={14} className="flex-shrink-0" />
                        <span>
                            {hoursCoverage === 0
                                ? t('doneNoHours', { hours: state.standardWeeklyHours })
                                : t('donePartialHours', { pct: hoursCoverage, hours: state.standardWeeklyHours })
                            }
                        </span>
                    </div>
                )}
                {analysisError && (
                    <div className="flex items-center gap-2 mt-3 p-3 rounded-lg text-sm"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                        <AlertCircle size={14} className="flex-shrink-0" />
                        <span>{analysisError}</span>
                    </div>
                )}
            </div>
            {!analysing && (
                <div className="flex gap-3 justify-center">
                    <button onClick={onReset} className="btn-outline">
                        {t('doneImportAnother')}
                    </button>
                    <button onClick={handleStartAnalysis} className="btn-primary flex items-center gap-2">
                        <Loader2 size={14} style={{ opacity: 0 }} />
                        {t('doneStartAnalysis')} <ChevronRight size={15} />
                    </button>
                </div>
            )}
        </div>
    )
}

// ============================================================
// Step 4 — Confirm (with back button)
// ============================================================

function StepConfirm({ state, onBack, onReset }: {
    state: WizardState & { finalMapping: ColumnMapping }
    onBack: () => void
    onReset: () => void
}) {
    const t = useTranslations('importWizard')
    const [isPending, startTransition] = useTransition()
    const [done, setDone] = useState(false)
    const [error, setError] = useState('')
    const [hoursCoverage, setHoursCoverage] = useState<number | null>(null)

    const mappedCount  = Object.values(state.finalMapping).filter(Boolean).length
    const hasNames     = Object.values(state.finalMapping).some(v => v === 'first_name' || v === 'last_name')
    const hasHoursCols = Object.values(state.finalMapping).some(v => v === 'weekly_hours' || v === 'monthly_hours')
    const hasFte       = Object.values(state.finalMapping).some(v => v === 'fte_ratio')

    function parseSampleNum(s: string): number | null {
        if (!s) return null
        const n = parseFloat(s.replace(/[€$£\s]/g, '').replace(',', '.'))
        return isNaN(n) ? null : n
    }
    const unmappedPayColumns = Object.entries(state.finalMapping)
        .filter(([col, plField]) => {
            if (plField !== null) return false
            return state.sampleRows.some(row => {
                const v = parseSampleNum(row[col] ?? '')
                return v !== null && v > 0
            })
        })
        .map(([col]) => col)


    function handleConfirm() {
        startTransition(async () => {
            const result = await confirmMappingAndProcess(
                state.datasetId,
                state.finalMapping,
                state.usedAi,
                state.standardWeeklyHours,
                state.defaultSalaryPeriod,
                state.defaultVariablePayType,
            )
            if (result.error) {
                setError(result.error)
            } else {
                setHoursCoverage(result.hoursCoverage ?? 0)
                setDone(true)
                trackDatasetUpload()
            }
        })
    }

    if (done) {
        return (
            <DoneScreen
                state={state}
                mappedCount={mappedCount}
                hoursCoverage={hoursCoverage}
                onReset={onReset}
            />
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('confirmTitle')}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {t('confirmSubtitle')}
                </p>
            </div>

            <div className="glass-card p-5 space-y-3">
                {[
                    [t('confirmDataset'), state.datasetId.slice(0, 8) + '…'],
                    [t('confirmEmployees'), state.rowCount.toLocaleString()],
                    [t('confirmMappedFields'), t('confirmMappedOf', { mapped: mappedCount, total: state.headers.length })],
                    [t('confirmMappingMethod'), state.usedAi ? t('confirmMappingAuto') : t('confirmMappingManual')],
                    [t('confirmNamesIncluded'), hasNames ? t('confirmNamesYes') : t('confirmNamesNo')],
                    [t('confirmFtRef'), t('confirmFtRefValue', { hours: state.standardWeeklyHours })],
                    [t('confirmSalaryPeriod'), state.defaultSalaryPeriod === 'monthly' ? t('confirmSalaryMonthlyLabel') : state.defaultSalaryPeriod === 'hourly' ? t('confirmSalaryHourlyLabel') : t('confirmSalaryAnnualLabel')],
                    [t('confirmVariableFormat'), state.defaultVariablePayType === 'pct' ? t('confirmVariablePct') : state.defaultVariablePayType === 'eur' ? t('confirmVariableEur') : t('confirmVariableAuto')],
                    [t('confirmHours'), hasHoursCols ? t('confirmHoursFromImport') : hasFte ? t('confirmHoursFte', { hours: state.standardWeeklyHours }) : t('confirmHoursAssumption', { hours: state.standardWeeklyHours })],
                ].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between text-sm">
                        <span style={{ color: 'var(--color-pl-text-secondary)' }}>{label}</span>
                        <span className="font-semibold" style={{
                            color: label === t('confirmNamesIncluded') && hasNames
                                ? 'var(--color-pl-amber)'
                                : label === t('confirmHours') && !hasHoursCols
                                ? 'var(--color-pl-amber)'
                                : 'var(--color-pl-text-primary)'
                        }}>{value}</span>
                    </div>
                ))}
            </div>

            {!hasHoursCols && (
                <div className="flex items-start gap-2 p-3 rounded-lg text-sm"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--color-pl-amber)' }}>
                    <Clock size={15} className="flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-0.5">{t('noHoursTitle')}</p>
                        <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {hasFte
                                ? t('noHoursFteHint', { hours: state.standardWeeklyHours })
                                : t('noHoursNoFteHint', { hours: state.standardWeeklyHours })
                            }
                        </p>
                    </div>
                </div>
            )}

            <div className="flex items-start gap-2 p-3 rounded-lg text-xs"
                style={{
                    background: hasNames ? 'rgba(245,158,11,0.06)' : 'rgba(59,130,246,0.06)',
                    border: `1px solid ${hasNames ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.15)'}`,
                    color: 'var(--color-pl-text-secondary)',
                }}>
                <ShieldCheck size={15} className="mt-0.5 flex-shrink-0"
                    style={{ color: hasNames ? 'var(--color-pl-amber)' : 'var(--color-pl-brand-light)' }} />
                {hasNames ? t('gdprReminderNames') : t('gdprReminderNoNames')}
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {unmappedPayColumns.length > 0 && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-lg text-sm"
                    style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--color-pl-amber)' }}>
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-1">{t('unmappedTitle')}</p>
                        <p className="text-xs mb-2" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t.rich('unmappedDesc', { strong: (chunks) => <strong style={{ color: 'var(--color-pl-amber)' }}>{chunks}</strong> })}
                        </p>
                        <ul className="text-xs space-y-0.5 mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {unmappedPayColumns.map(col => (
                                <li key={col}>· <strong>{col}</strong></li>
                            ))}
                        </ul>
                        <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t.rich('unmappedHint', { strong: (chunks) => <strong style={{ color: 'var(--color-pl-text-primary)' }}>{chunks}</strong> })}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                {!isPending && (
                    <button onClick={onBack} className="btn-outline flex-1">
                        <ArrowLeft size={15} /> {t('back')}
                    </button>
                )}
                <button onClick={handleConfirm} disabled={isPending} className="btn-primary flex-1"
                    style={isPending ? { opacity: 0.7, cursor: 'not-allowed' } : {}}>
                    {isPending
                        ? <><Loader2 size={16} className="animate-spin" /> {t('processing')}</>
                        : <>{t('startImport')} <ChevronRight size={16} /></>}
                </button>
            </div>
        </div>
    )
}

// ============================================================
// AI loading screen
// ============================================================

function AiLoadingScreen() {
    const t = useTranslations('importWizard')
    return (
        <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
            <div className="relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '2px solid rgba(99,102,241,0.4)' }}>
                    <Sparkles size={28} style={{ color: 'var(--color-pl-accent)' }} />
                </div>
                <div className="absolute inset-0 rounded-full animate-ping"
                    style={{ border: '2px solid rgba(99,102,241,0.3)' }} />
            </div>
            <div>
                <p className="font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('aiLoadingTitle')}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {t('aiLoadingSubtitle')}
                </p>
            </div>
        </div>
    )
}

// ============================================================
// Main wizard orchestrator
// ============================================================

export default function ImportWizard({ avvAcceptedAt, orgId }: { avvAcceptedAt: string | null; orgId: string }) {
    const t = useTranslations('importWizard')
    const [step, setStep] = useState<Step>(1)
    const [wizardState, setWizardState] = useState<WizardState | null>(null)
    const [finalMapping, setFinalMapping] = useState<ColumnMapping>({})
    const [aiLoading, setAiLoading] = useState(false)
    const [aiRetryError, setAiRetryError] = useState<string | undefined>(undefined)

    // C5: AVV acceptance gate (Art. 28 DSGVO)
    const [avvAccepted, setAvvAccepted] = useState(!!avvAcceptedAt)
    const [avvChecked, setAvvChecked] = useState(false)
    const [avvPending, setAvvPending] = useState(false)
    const [avvError, setAvvError] = useState<string | null>(null)

    async function handleAvvAccept() {
        if (!avvChecked) return
        setAvvPending(true)
        setAvvError(null)
        const result = await acceptAvv(orgId)
        setAvvPending(false)
        if (result.error) {
            setAvvError(result.error)
        } else {
            setAvvAccepted(true)
        }
    }

    function reset() {
        setStep(1)
        setWizardState(null)
        setFinalMapping({})
    }

    function handleUploadDone(state: WizardState) {
        setWizardState(state)
        setStep(2)
    }

    async function handleAiConsent() {
        if (!wizardState) return
        setAiLoading(true)
        setAiRetryError(undefined)
        const result = await runAiColumnMapping(
            wizardState.datasetId,
            wizardState.headers,
            wizardState.sampleRows,
        )
        setAiLoading(false)

        if (result.error) {
            setAiRetryError(result.error)
            return
        }

        setWizardState(prev => prev ? {
            ...prev,
            mapping: result.mapping,
            confidence: result.confidence,
            usedAi: true,
            aiError: undefined,
        } : prev)
        setAiRetryError(undefined)
        setStep(3)
    }

    function handleManual() {
        setStep(3)
    }

    function handleMappingDone(mapping: ColumnMapping) {
        setFinalMapping(mapping)
        setStep(4)
    }

    // C5: AVV gate — must accept before accessing the import wizard
    if (!avvAccepted) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('wizardTitle')}
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('wizardSubtitle')}
                    </p>
                </div>

                <div className="glass-card p-6 space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                            <ShieldCheck size={20} style={{ color: 'var(--color-pl-brand-light)' }} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                {t('avvTitle')}
                            </h2>
                            <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                {t('avvSubtitle')}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg text-sm" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-secondary)' }}>
                        <p>{t('avvExplanation')}</p>
                    </div>

                    <a
                        href="/api/contracts/avv"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors w-fit"
                        style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-brand-light)' }}
                    >
                        <FileText size={15} /> {t('avvDownload')} <ExternalLink size={13} />
                    </a>

                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={avvChecked}
                            onChange={e => setAvvChecked(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        />
                        <span className="text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('avvCheckboxLabel')}
                        </span>
                    </label>

                    {avvError && (
                        <div className="flex items-center gap-2 text-sm p-3 rounded-lg"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                            <AlertCircle size={16} /> {avvError}
                        </div>
                    )}

                    <button
                        onClick={handleAvvAccept}
                        disabled={!avvChecked || avvPending}
                        className="btn-primary w-full"
                        style={!avvChecked || avvPending ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                        {avvPending
                            ? <><Loader2 size={16} className="animate-spin" /> {t('avvSaving')}</>
                            : <><ShieldCheck size={16} /> {t('avvAcceptBtn')}</>
                        }
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('wizardTitle')}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {t('wizardSubtitle')}
                </p>
            </div>

            <StepBar current={step} />

            <div className="glass-card p-6">
                {step === 1 && (
                    <StepUpload onNext={handleUploadDone} />
                )}
                {step === 2 && wizardState && (
                    <StepGdpr
                        state={wizardState}
                        onAiConsent={handleAiConsent}
                        onManual={handleManual}
                        onBack={() => { setAiRetryError(undefined); setStep(1) }}
                        aiError={aiRetryError}
                        onRetry={handleAiConsent}
                        isRetrying={aiLoading}
                    />
                )}
                {step === 3 && wizardState && (
                    <StepMapping
                        state={wizardState}
                        onNext={handleMappingDone}
                        onBack={() => setStep(2)}
                    />
                )}
                {step === 4 && wizardState && (
                    <StepConfirm
                        state={{ ...wizardState, finalMapping }}
                        onBack={() => setStep(3)}
                        onReset={reset}
                    />
                )}
            </div>

            <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                <Info size={12} />
                {t('wizardFooter')}
            </div>
        </div>
    )
}
