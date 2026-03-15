'use client'

import { useState, useCallback, useTransition, useRef } from 'react'
import {
    Upload, FileSpreadsheet, Sparkles, CheckCircle2, Clock,
    ChevronRight, ChevronUp, ChevronDown, AlertCircle, ShieldCheck, ArrowLeft,
    Loader2, Info, UserCheck, User
} from 'lucide-react'
import {
    parseUploadedFile,
    runAiColumnMapping,
    confirmMappingAndProcess,
} from './actions'
import { runDatasetAnalysis } from '../analysis/actions'
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

const STEPS = [
    { n: 1, label: 'Datei hochladen' },
    { n: 2, label: 'Datenschutz' },
    { n: 3, label: 'Spaltenzuordnung' },
    { n: 4, label: 'Bestätigen' },
]

const CURRENT_YEAR = new Date().getFullYear()
const MIN_YEAR = 1900
const MAX_YEAR = 2100

// ============================================================
// Step progress bar
// ============================================================

function StepBar({ current }: { current: Step }) {
    return (
        <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s, i) => (
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
                            {s.label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
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
        if (!file) return setError('Bitte wählen Sie eine Datei aus.')
        if (!datasetName.trim()) return setError('Bitte geben Sie einen Namen für den Datensatz ein.')
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
                    Gehaltsdaten hochladen
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    Unterstützte Formate: CSV, XLSX, ODS · Maximale Dateigröße: 10 MB
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
                                {(file.size / 1024).toFixed(0)} KB — Klicken zum Ändern
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
                                Datei hierher ziehen oder klicken
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                CSV · XLSX · ODS
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Dataset name + year */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        Name des Datensatzes
                    </label>
                    <input
                        type="text"
                        value={datasetName}
                        onChange={e => setDatasetName(e.target.value)}
                        placeholder="z.B. Gehaltsrunde 2025"
                        className="input-base"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        Berichtsjahr
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
                        Arbeitszeiteinstellungen (EU-Pflichtangabe)
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Vollzeit-Referenz (Std/Woche)
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
                        <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>Standard: 40h (TVöD: 38,5h)</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Gehaltsangabe im Import
                        </label>
                        <select value={defaultSalaryPeriod} onChange={e => setDefaultSalaryPeriod(e.target.value)} className="input-base text-sm py-2">
                            <option value="annual">Jährlich (z.B. 60.000 €/Jahr)</option>
                            <option value="monthly">Monatlich (z.B. 5.000 €/Monat)</option>
                            <option value="hourly">Stündlich (z.B. 28,50 €/Std)</option>
                        </select>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>Gilt als Standard, wenn kein Periodenfeld gemappt</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Variable Vergütung — Format
                        </label>
                        <select value={defaultVariablePayType} onChange={e => setDefaultVariablePayType(e.target.value as 'eur' | 'pct' | 'auto')} className="input-base text-sm py-2">
                            <option value="auto">Automatisch erkennen</option>
                            <option value="eur">Euro-Betrag (z.B. 5.000 €)</option>
                            <option value="pct">Prozentsatz (z.B. 0,10 = 10%)</option>
                        </select>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Wählen Sie wie die Spalte „Variable Vergütung" im Export vorliegt
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
                                Vor- und Nachnamen einbeziehen
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                Optional · Standard: anonym (nur ID)
                            </p>
                        </div>
                    </div>
                    {/* Toggle switch */}
                    <button
                        type="button"
                        onClick={() => setIncludeNames(v => !v)}
                        className="relative flex-shrink-0 w-11 h-6 rounded-full transition-all duration-200"
                        style={{
                            background: includeNames ? 'var(--color-pl-amber)' : 'var(--color-pl-border)',
                            border: `1px solid ${includeNames ? 'rgba(245,158,11,0.5)' : 'var(--color-pl-border)'}`,
                        }}
                        aria-label="Namen einbeziehen"
                    >
                        <span
                            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                            style={{ transform: includeNames ? 'translateX(20px)' : 'translateX(0)' }}
                        />
                    </button>
                </div>

                {/* GDPR note — only shown when toggle is ON */}
                {includeNames && (
                    <div className="mt-3 pt-3 text-xs flex items-start gap-2"
                        style={{ borderTop: '1px solid rgba(245,158,11,0.15)', color: 'var(--color-pl-text-secondary)' }}>
                        <AlertCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-pl-amber)' }} />
                        <span>
                            Vor- und Nachnamen sind <strong style={{ color: 'var(--color-pl-text-primary)' }}>personenbezogene Daten</strong> gemäß Art. 4 DSGVO
                            und werden ausschließlich für die Entgeltlückenanalyse auf EU-Servern gespeichert.
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
                {isPending ? <><Loader2 size={16} className="animate-spin" /> Wird geladen…</> : <>Weiter <ChevronRight size={16} /></>}
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
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Spaltenzuordnung — Datenschutzhinweis
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {state.rowCount.toLocaleString('de-DE')} Datensätze erkannt in <strong style={{ color: 'var(--color-pl-text-primary)' }}>{state.headers.length} Spalten</strong>
                    {state.includeNames && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--color-pl-amber)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <UserCheck size={11} /> Mit Namen
                        </span>
                    )}
                </p>
            </div>

            {/* AI option */}
            <div className="rounded-xl p-5 space-y-4"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div className="flex items-center gap-2">
                    <span className="ai-badge"><Sparkles size={10} /> KI</span>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>
                        Automatische KI-Zuordnung verwenden (empfohlen)
                    </h3>
                </div>

                <div className="space-y-2 text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    <p className="font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>Was wird an Google Gemini gesendet?</p>
                    <ul className="space-y-1.5 ml-1">
                        {[
                            '✅ Nur Spaltenüberschriften (z.B. "Abteilung", "Gehalt")',
                            '✅ Maximal 5 anonymisierte Beispielwerte pro Spalte',
                            '❌ Keine vollständigen Gehaltsdaten',
                            '❌ Keine Namen oder Mitarbeiter-IDs',
                            '❌ Google speichert API-Anfragen nicht für Modelltraining',
                        ].map((item, i) => <li key={i}>{item}</li>)}
                        {state.includeNames && (
                            <li style={{ color: 'var(--color-pl-amber)' }}>
                                ⚠️ Namen-Spalten werden zur Zuordnung erkannt, aber <strong>keine</strong> echten Namenswerte gesendet
                            </li>
                        )}
                    </ul>
                </div>

                <div className="p-3 rounded-lg text-xs"
                    style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--color-pl-text-secondary)' }}>
                    <strong style={{ color: 'var(--color-pl-text-primary)' }}>Rechtsgrundlage:</strong> Die übermittelten Spaltenköpfe und Stichproben stellen keine personenbezogenen Daten i.S.d. Art. 4 DSGVO dar.
                </div>

                <button onClick={onAiConsent} disabled={isRetrying} className="btn-primary w-full"
                    style={isRetrying ? { opacity: 0.7, cursor: 'not-allowed' } : {}}>
                    {isRetrying
                        ? <><Loader2 size={15} className="animate-spin" /> KI analysiert…</>
                        : <><Sparkles size={15} /> KI-Zuordnung verwenden & fortfahren</>
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
                            {isRetrying ? <><Loader2 size={14} className="animate-spin" /> Wird erneut versucht…</> : 'Erneut versuchen'}
                        </button>
                        <button onClick={onManual} className="btn-outline flex-1 text-sm">
                            Manuell zuordnen
                        </button>
                    </div>
                </div>
            )}

            {/* Manual option */}
            <div className="text-center">
                <button onClick={onManual} className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    Nein danke — <span style={{ color: 'var(--color-pl-brand-light)' }}>Manuell zuordnen</span>
                </button>
            </div>

            {/* Back button */}
            <button onClick={onBack} className="btn-outline w-full">
                <ArrowLeft size={15} /> Zurück
            </button>
        </div>
    )
}

// ============================================================
// Step 3 — Column mapping review (existing back button kept)
// ============================================================

// Standard fields (non-name)
const BASE_FIELD_OPTIONS = [
    { value: '', label: '— Ignorieren —' },
    ...PAYLENS_FIELDS.filter(f => !f.nameField).map(f => ({ value: f.key, label: f.label })),
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
    const [mapping, setMapping] = useState<ColumnMapping>(state.mapping)

    const requiredFields = PAYLENS_FIELDS.filter(f => f.required).map(f => f.key)
    const mappedFields = Object.values(mapping).filter(Boolean)
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f))

    // Build dropdown options: base + name fields only when includeNames is on
    const fieldOptions = [
        ...BASE_FIELD_OPTIONS,
        ...(state.includeNames ? NAME_FIELD_OPTIONS : []),
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Spaltenzuordnung {state.usedAi && <span className="ai-badge ml-2"><Sparkles size={10} /> KI</span>}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {state.usedAi
                        ? 'Die KI hat folgende Zuordnung vorgeschlagen. Bitte prüfen und ggf. korrigieren.'
                        : 'Ordnen Sie jede Spalte Ihrer Datei einem PayLens-Feld zu.'}
                    {state.includeNames && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--color-pl-amber)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <UserCheck size={11} /> Vorname/Nachname verfügbar
                        </span>
                    )}
                </p>
            </div>

            {/* AI error banner */}
            {state.aiError && (
                <div className="flex items-start gap-2 p-3 rounded-lg text-sm"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--color-pl-amber)' }}>
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{state.aiError} — Bitte ordnen Sie die Felder manuell zu.</span>
                </div>
            )}

            {missingRequired.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg text-sm"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--color-pl-amber)' }}>
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>Pflichtfelder noch nicht zugeordnet: <strong>{missingRequired.map(f => PAYLENS_FIELDS.find(p => p.key === f)?.label).join(', ')}</strong></span>
                </div>
            )}

            {/* Mapping table */}
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-pl-border)' }}>
                {/* Column headers */}
                <div className="grid grid-cols-3 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
                    style={{ background: 'var(--theme-pl-action-ghost)', color: 'var(--color-pl-text-tertiary)', borderBottom: '1px solid var(--color-pl-border)' }}>
                    <span>Ihre Spalte</span>
                    <span>Beispielwerte</span>
                    <span className="flex items-center justify-between">
                        PayLens-Feld
                        <span className="normal-case font-normal" style={{ color: mappedFields.length > 0 ? 'var(--color-pl-green)' : 'var(--color-pl-text-tertiary)' }}>
                            {mappedFields.length} / {state.headers.length} zugeordnet
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
                                    paddingLeft:  isMatched ? '13px' : '16px', // compensate for border
                                }}>
                                {/* Column name + confidence + match indicator */}
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
                                {/* Sample values */}
                                <div className="text-xs truncate"
                                    style={{ color: isMatched ? 'var(--color-pl-text-secondary)' : 'var(--color-pl-text-tertiary)' }}>
                                    {state.sampleRows.slice(0, 3).map(r => r[header]).filter(Boolean).join(' · ')}
                                </div>
                                {/* Field selector */}
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
                    <ArrowLeft size={15} /> Zurück
                </button>
                <button
                    onClick={() => onNext(mapping)}
                    disabled={missingRequired.length > 0}
                    className="btn-primary flex-1"
                    style={missingRequired.length > 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                    Weiter <ChevronRight size={16} />
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
        // Redirect to analysis page — autoload picks up the result
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
                    {analysing ? 'Analyse wird berechnet…' : 'Datensatz erfolgreich importiert'}
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {analysing
                        ? 'Bitte warten. Sie werden automatisch weitergeleitet.'
                        : `${state.rowCount.toLocaleString('de-DE')} Mitarbeitende · ${mappedCount} Felder zugeordnet`}
                </p>
                {!analysing && hoursCoverage !== null && hoursCoverage < 100 && (
                    <div className="flex items-center gap-2 mt-3 p-3 rounded-lg text-sm"
                        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--color-pl-amber)' }}>
                        <Clock size={14} className="flex-shrink-0" />
                        <span>
                            {hoursCoverage === 0
                                ? `Keine Stundendaten — Berechnung mit ${state.standardWeeklyHours}h Vollzeit-Referenz (FTE-Annahme)`
                                : `${hoursCoverage}% Stundendaten vorhanden — Rest: ${state.standardWeeklyHours}h FTE-Annahme`
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
                        Weiteren Datensatz importieren
                    </button>
                    <button onClick={handleStartAnalysis} className="btn-primary flex items-center gap-2">
                        <Loader2 size={14} style={{ opacity: 0 }} />
                        Analyse starten <ChevronRight size={15} />
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
    const [isPending, startTransition] = useTransition()
    const [done, setDone] = useState(false)
    const [error, setError] = useState('')
    const [hoursCoverage, setHoursCoverage] = useState<number | null>(null)

    const mappedCount  = Object.values(state.finalMapping).filter(Boolean).length
    const hasNames     = Object.values(state.finalMapping).some(v => v === 'first_name' || v === 'last_name')
    const hasHoursCols = Object.values(state.finalMapping).some(v => v === 'weekly_hours' || v === 'monthly_hours')
    const hasFte       = Object.values(state.finalMapping).some(v => v === 'fte_ratio')

    // Detect null-mapped columns that have positive numeric sample values → likely pay components
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
                    Import bestätigen
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    Bitte prüfen Sie die Zusammenfassung vor dem Import.
                </p>
            </div>

            {/* Summary */}
            <div className="glass-card p-5 space-y-3">
                {[
                    ['Datensatz', state.datasetId.slice(0, 8) + '…'],
                    ['Mitarbeitende', state.rowCount.toLocaleString('de-DE')],
                    ['Zugeordnete Felder', `${mappedCount} von ${state.headers.length}`],
                    ['Spaltenzuordnung', state.usedAi ? 'KI-automatisch' : 'Manuell'],
                    ['Namen einbezogen', hasNames ? 'Ja (Vor- und Nachname)' : 'Nein (anonym)'],
                    ['Vollzeit-Referenz', `${state.standardWeeklyHours}h/Woche`],
                    ['Gehaltsangabe', state.defaultSalaryPeriod === 'monthly' ? 'Monatlich' : state.defaultSalaryPeriod === 'hourly' ? 'Stündlich' : 'Jährlich'],
                    ['Variable Verg.: Format', state.defaultVariablePayType === 'pct' ? 'Prozentsatz (%)' : state.defaultVariablePayType === 'eur' ? 'Euro-Betrag' : 'Automatisch'],
                    ['Arbeitsstunden', hasHoursCols ? 'Aus Importdaten (Std/Woche oder Monat)' : hasFte ? `FTE-Anteil × ${state.standardWeeklyHours}h` : `Annahme: ${state.standardWeeklyHours}h Vollzeit`],
                ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                        <span style={{ color: 'var(--color-pl-text-secondary)' }}>{label}</span>
                        <span className="font-semibold" style={{
                            color: label === 'Namen einbezogen' && hasNames
                                ? 'var(--color-pl-amber)'
                                : label === 'Arbeitsstunden' && !hasHoursCols
                                ? 'var(--color-pl-amber)'
                                : 'var(--color-pl-text-primary)'
                        }}>{value}</span>
                    </div>
                ))}
            </div>

            {/* Working hours warning */}
            {!hasHoursCols && (
                <div className="flex items-start gap-2 p-3 rounded-lg text-sm"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--color-pl-amber)' }}>
                    <Clock size={15} className="flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-0.5">Keine Arbeitsstunden in den Importdaten</p>
                        <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {hasFte
                                ? `Der Stundenlohn wird aus dem FTE-Anteil × ${state.standardWeeklyHours}h Vollzeit berechnet. Für präzisere EU-konforme Ergebnisse empfehlen wir die Spalte "Wöchentliche Stunden" in künftigen Exporten einzuschließen.`
                                : `Kein FTE-Anteil oder Stunden gemappt. Es wird ${state.standardWeeklyHours}h Vollzeit für alle Mitarbeitenden angenommen. Bitte prüfen Sie Ihre Spaltenzuordnung oder korrigieren Sie die Vollzeit-Referenz in Schritt 1.`
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* GDPR reminder */}
            <div className="flex items-start gap-2 p-3 rounded-lg text-xs"
                style={{
                    background: hasNames ? 'rgba(245,158,11,0.06)' : 'rgba(59,130,246,0.06)',
                    border: `1px solid ${hasNames ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.15)'}`,
                    color: 'var(--color-pl-text-secondary)',
                }}>
                <ShieldCheck size={15} className="mt-0.5 flex-shrink-0"
                    style={{ color: hasNames ? 'var(--color-pl-amber)' : 'var(--color-pl-brand-light)' }} />
                {hasNames
                    ? 'Namen werden als personenbezogene Daten (Art. 4 DSGVO) auf EU-Servern gespeichert und ausschließlich für die Entgeltlückenanalyse verwendet.'
                    : 'Ihre Daten werden ausschließlich auf EU-Servern (Frankfurt) gespeichert und nur für die Entgeltlückenanalyse verwendet.'}
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* Unmapped numeric columns warning — shown before submit so user can go back */}
            {unmappedPayColumns.length > 0 && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-lg text-sm"
                    style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--color-pl-amber)' }}>
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold mb-1">Nicht zugeordnete Vergütungsspalten erkannt</p>
                        <p className="text-xs mb-2" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Die folgenden Spalten wurden auf <strong style={{ color: 'var(--color-pl-amber)' }}>„— Ignorieren —"</strong> gesetzt,
                            enthalten jedoch numerische Werte und könnten Vergütungskomponenten sein (z.B. Zulagen, Prämien):
                        </p>
                        <ul className="text-xs space-y-0.5 mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {unmappedPayColumns.map(col => (
                                <li key={col}>· <strong>{col}</strong></li>
                            ))}
                        </ul>
                        <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Gehen Sie zurück und ordnen Sie diese Spalten ggf.
                            <strong style={{ color: 'var(--color-pl-text-primary)' }}> „Sachbezüge / Sonstige Vergütung"</strong> zu,
                            damit alle Gehaltsbestandteile erfasst werden.
                        </p>
                    </div>
                </div>
            )}


            <div className="flex gap-3">
                {/* Back button — only before submission */}
                {!isPending && (
                    <button onClick={onBack} className="btn-outline flex-1">
                        <ArrowLeft size={15} /> Zurück
                    </button>
                )}
                <button onClick={handleConfirm} disabled={isPending} className="btn-primary flex-1"
                    style={isPending ? { opacity: 0.7, cursor: 'not-allowed' } : {}}>
                    {isPending
                        ? <><Loader2 size={16} className="animate-spin" /> Wird verarbeitet…</>
                        : <>Import starten <ChevronRight size={16} /></>}
                </button>
            </div>
        </div>
    )
}

// ============================================================
// AI loading screen
// ============================================================

function AiLoadingScreen() {
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
                    KI analysiert Ihre Spalten…
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    Nur Spaltenköpfe werden verarbeitet — keine Gehaltsdaten
                </p>
            </div>
        </div>
    )
}

// ============================================================
// Main wizard orchestrator
// ============================================================

export default function ImportWizard() {
    const [step, setStep] = useState<Step>(1)
    const [wizardState, setWizardState] = useState<WizardState | null>(null)
    const [finalMapping, setFinalMapping] = useState<ColumnMapping>({})
    const [aiLoading, setAiLoading] = useState(false)
    const [aiRetryError, setAiRetryError] = useState<string | undefined>(undefined)

    function reset() {
        setStep(1)
        setWizardState(null)
        setFinalMapping({})
    }

    // Step 1 → 2
    function handleUploadDone(state: WizardState) {
        setWizardState(state)
        setStep(2)
    }

    // Step 2 → 3 with AI
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
            // Stay on Step 2 — show error + retry button
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

    // Step 2 → 3 manual
    function handleManual() {
        setStep(3)
    }

    // Step 3 → 4
    function handleMappingDone(mapping: ColumnMapping) {
        setFinalMapping(mapping)
        setStep(4)
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Daten importieren
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    Importieren Sie Ihre Gehaltsdaten für die EU-konforme Entgeltlückenanalyse.
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
                Nur für die Entgeltlückenanalyse gem. EU-Richtlinie 2023/970 · DSGVO-konform · Daten bleiben auf EU-Servern
            </div>
        </div>
    )
}
