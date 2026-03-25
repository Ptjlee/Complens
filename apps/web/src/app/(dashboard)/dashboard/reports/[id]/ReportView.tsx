'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import {
    ArrowLeft, Download, CheckCircle2, ShieldAlert,
    TrendingDown, FileText, Users, BarChart3,
    PenLine, Save, X, ChevronRight, Presentation, Sparkles, Loader2, Info,
} from 'lucide-react'
import type { AnalysisResult } from '@/lib/calculations/types'
import type { BandGradeSummary } from '@/lib/band/getBandContext'
import { EXPLANATION_CATEGORIES, MAX_JUSTIFIABLE_CAP } from '@/app/(dashboard)/dashboard/import/constants'
import { saveReportNotes } from '../actions'
import { generateAndSaveNarrative } from '../generateNarrative'
import PdfOptionsModal from '../PdfOptionsModal'
import ComplianceHeatmap from '@/components/dashboard/ComplianceHeatmap'

// ── helpers ─────────────────────────────────────────────────

function pct(val: number | null, sign = true): string {
    if (val === null) return '—'
    const v = (val * 100).toFixed(1)
    return sign && Number(v) >= 0 ? `+${v}%` : `${v}%`
}
function gapColor(val: number | null): string {
    if (val === null) return 'var(--color-pl-text-tertiary)'
    const abs = Math.abs(val * 100)
    return abs >= 5 ? 'var(--color-pl-red)' : 'var(--color-pl-green)'
}
function hrFmt(val: number | null): string {
    if (!val) return '—'
    return val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €/h'
}

// ── Section nav ──────────────────────────────────────────────

const SECTIONS = [
    { id: 'summary',     label: 'Zusammenfassung' },
    { id: 'departments', label: 'Bereiche' },
    { id: 'grades',      label: 'Entgeltgruppen' },
    { id: 'quartiles',   label: 'Quartile' },
    { id: 'explanations', label: 'Begründungen' },
    { id: 'remediation', label: 'Maßnahmen' },
    { id: 'declaration',  label: 'Erklärung' },
]

// ── Main component ───────────────────────────────────────────

export default function ReportView({
    analysis,
    explanations,
    remediationPlans = [],
    orgName,
    bandGrades = [],
}: {
    analysis: {
        id: string
        name: string
        created_at: string
        report_notes: string | null
        published_at: string | null
        results: AnalysisResult
        datasets: { name: string; reporting_year: number; employee_count: number | null } | null
    }
    explanations: Array<{
        id: string
        employee_id: string
        category: string
        categories_json: Array<{ key: string; comment: string; claimed_pct?: number }>
        action_plan: string
        max_justifiable_pct: number
        status: string
        created_at: string
    }>
    remediationPlans?: Array<{
        employee_id: string
        action_type: string
        status: string
        deadline_months: number
        plan_steps: Array<{ horizon: string; description: string }>
    }>
    orgName: string
    bandGrades?: BandGradeSummary[]
}) {
    const r       = analysis.results
    const over    = r.overall
    const date    = new Date(analysis.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    const [activeSection, setActiveSection] = useState('summary')
    const [editingNotes, setEditingNotes]   = useState(false)
    const [notes, setNotes]                 = useState(analysis.report_notes ?? '')
    const [isPending, startTransition]      = useTransition()
    const [showPdfModal, setShowPdfModal]   = useState(false)
    const [pptLoading, setPptLoading]       = useState(false)
    const [aiLoading, setAiLoading]         = useState(false)
    const [aiError, setAiError]             = useState('')

    // Derive counts from analysis flags (source of truth), not just written explanations
    const flaggedEmployees = r.individual_flags.filter(f => f.severity !== 'ok')
    const explainedIds     = new Set(explanations.filter(e => e.status === 'explained').map(e => e.employee_id))
    const explainedCount   = flaggedEmployees.filter(f => explainedIds.has(f.employee_id)).length
    const openCount        = flaggedEmployees.length - explainedCount

    // ── Tier 3: Nach Begründungen — proportional reduction of WIF-adjusted median ──
    // Mirrors EXACTLY the formula used in AnalysisPage.tsx "Nach Begründungen" card:
    //   medianResidual = adjusted_median × (sumResiduals / sumRaw)
    // where sumRaw/sumResiduals are computed over all flagged employees (|gap| ≥ 5%)
    const explanationAdjustedGap = useMemo(() => {
        const flags  = r.individual_flags ?? []
        const over   = r.overall

        // Build map: employee_id -> categories_json (for summing claimed_pct)
        const explMap = new Map<string, Array<{ claimed_pct?: number }>>()
        for (const exp of explanations) {
            explMap.set(exp.employee_id, (exp.categories_json ?? []) as Array<{ claimed_pct?: number }>)
        }

        // Flagged employees: |gap| ≥ 5% (same threshold as Analyse module)
        const flaggedNonOk = flags.filter(f => {
            const gap = f.gap_vs_cohort_pct   // cohort gap is the WIF-adjusted measure
            return Math.abs(gap) >= 0.05
        })
        if (flaggedNonOk.length === 0) return null

        let sumRaw = 0, sumResiduals = 0
        for (const f of flaggedNonOk) {
            const rawGapPct = Math.abs(f.gap_vs_cohort_pct * 100)
            const cats = explMap.get(f.employee_id) ?? []
            const explained = Math.min(cats.reduce((s, c) => s + (c.claimed_pct ?? 0), 0), 25)
            sumRaw += rawGapPct
            sumResiduals += Math.max(0, rawGapPct - explained)
        }

        const adjustedMedianPct = (over.adjusted_median ?? 0) * 100
        const residual = sumRaw > 0
            ? adjustedMedianPct * (sumResiduals / sumRaw)
            : adjustedMedianPct

        return residual / 100  // return as fraction (same unit as adjusted_median)
    }, [r.individual_flags, r.overall, explanations])

    // Per-group residual (same proportional formula, filtered by dept/grade)
    const groupNachBegrn = useMemo(() => {
        type CatEntry = { claimed_pct?: number }
        const explMap = new Map<string, CatEntry[]>()
        for (const exp of explanations) {
            explMap.set(exp.employee_id, (exp.categories_json ?? []) as CatEntry[])
        }
        function residualFor(flags: typeof r.individual_flags, adjMedian: number): number | null {
            const flagged = flags.filter(f => Math.abs(f.gap_vs_cohort_pct) >= 0.05)
            if (!flagged.length) return null
            let sumRaw = 0, sumResiduals = 0
            for (const f of flagged) {
                const raw = Math.abs(f.gap_vs_cohort_pct * 100)
                const cats = explMap.get(f.employee_id) ?? []
                const expl = Math.min(cats.reduce((s, c) => s + (c.claimed_pct ?? 0), 0), 25)
                sumRaw += raw
                sumResiduals += Math.max(0, raw - expl)
            }
            const adj100 = (adjMedian ?? 0) * 100
            return sumRaw > 0 ? (adj100 * (sumResiduals / sumRaw)) / 100 : adj100 / 100
        }
        const byDept: Record<string, number | null> = {}
        for (const d of r.by_department) {
            if (d.suppressed) { byDept[d.department] = null; continue }
            const dFlags = r.individual_flags.filter(f => f.department === d.department)
            byDept[d.department] = residualFor(dFlags, d.gap.adjusted_median ?? 0)
        }
        const byGrade: Record<string, number | null> = {}
        for (const g of r.by_grade) {
            if (g.suppressed) { byGrade[g.grade] = null; continue }
            const gFlags = r.individual_flags.filter(f => f.job_grade === g.grade)
            byGrade[g.grade] = residualFor(gFlags, g.gap.adjusted_median ?? 0)
        }
        return { byDept, byGrade }
    }, [r.individual_flags, r.by_department, r.by_grade, explanations])

    const explainedWithStatus = explanations.filter(e => e.status === 'explained')

    function saveNotes() {
        startTransition(async () => {
            await saveReportNotes(analysis.id, notes)
            setEditingNotes(false)
        })
    }

    async function handleGenerateNarrative() {
        setAiLoading(true)
        setAiError('')
        const { text, error } = await generateAndSaveNarrative(
            analysis.id,
            orgName,
            r,
            r.reporting_year,
        )
        setAiLoading(false)
        if (error) { setAiError(error); return }
        if (text) {
            setNotes(text)
            setEditingNotes(true)  // open edit mode so user can review / adjust
        }
    }

    return (
        <div className="space-y-0">
            {/* ── Toolbar ── */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/reports"
                        className="p-2 rounded-lg flex items-center gap-1 text-xs"
                        style={{ color: 'var(--color-pl-text-tertiary)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-pl-action-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <ArrowLeft size={14} /> Zurück
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {analysis.datasets?.name ?? analysis.name}
                        </h1>
                        <p className="text-xs mt-1 flex items-center gap-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            <span className="flex items-center gap-1"><FileText size={11} /> {date}</span>
                            <span style={{ color: 'var(--color-pl-text-tertiary)' }}>·</span>
                            <span className="flex items-center gap-1"><BarChart3 size={11} /> {analysis.name}</span>
                            {analysis.datasets && <>
                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>·</span>
                                <span className="flex items-center gap-1"><Users size={11} /> {analysis.datasets.employee_count ?? '?'} MA</span>
                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>·</span>
                                <span>Berichtsjahr {analysis.datasets.reporting_year}</span>
                            </>}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${over.exceeds_5pct ? 'status-red' : 'status-green'}`}>
                        {over.exceeds_5pct ? <><ShieldAlert size={12} /> 5%-Schwelle überschritten</> : <><CheckCircle2 size={12} /> Unter 5%-Schwelle</>}
                    </div>
                    <button onClick={() => setShowPdfModal(true)} className="btn-ghost text-sm flex items-center gap-2">
                        <Download size={14} /> PDF exportieren
                    </button>
                    <a
                        href={`/api/report/${analysis.id}/export-ppt`}
                        download
                        onClick={() => {
                            setPptLoading(true)
                            setTimeout(() => setPptLoading(false), 4000)
                        }}
                        className="btn-ghost text-sm flex items-center gap-2"
                        style={{ textDecoration: 'none' }}
                    >
                        {pptLoading
                            ? <><span>⟳</span> Wird erstellt…</>
                            : <><Presentation size={14} /> PPT exportieren</>}
                    </a>
                </div>
            </div>

            {showPdfModal && (
                <PdfOptionsModal
                    analysisId={analysis.id}
                    orgName={orgName}
                    reportYear={r.reporting_year}
                    reportName={analysis.datasets?.name ?? analysis.name}
                    onClose={() => setShowPdfModal(false)}
                />
            )}

            {/* ── Layout: sticky side nav + content ── */}
            <div className="flex gap-6 items-start">

                {/* Side nav */}
                <div className="w-44 flex-shrink-0 sticky top-6">
                    <nav className="glass-card p-2 space-y-0.5">
                        {SECTIONS.map(s => (
                            <button key={s.id}
                                onClick={() => setActiveSection(s.id)}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                                style={{
                                    background: activeSection === s.id ? 'var(--color-pl-brand)' : 'transparent',
                                    color: activeSection === s.id ? '#fff' : 'var(--color-pl-text-secondary)',
                                }}>
                                <ChevronRight size={11} style={{ opacity: activeSection === s.id ? 1 : 0 }} />
                                {s.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-6">

                    {/* ── Executive summary ── */}
                    {activeSection === 'summary' && (
                        <>
                            {/* Status banner */}
                            <div className={`p-4 rounded-xl border flex items-start gap-3 ${over.exceeds_5pct ? 'status-red' : 'status-green'}`}
                                style={{
                                    background: over.exceeds_5pct ? 'rgba(239,68,68,0.06)' : 'rgba(52,211,153,0.06)',
                                    borderColor: over.exceeds_5pct ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.2)',
                                }}>
                                {over.exceeds_5pct ? <ShieldAlert size={18} style={{ color: 'var(--color-pl-red)', flexShrink: 0 }} /> : <CheckCircle2 size={18} style={{ color: 'var(--color-pl-green)', flexShrink: 0 }} />}
                                <div>
                                    <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                                        {over.exceeds_5pct
                                            ? 'Gemeinsame Entgeltbewertung erforderlich (Art. 9 Abs. 1c)'
                                            : 'Entgeltlücke unterhalb der 5%-Schwelle'}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                        {over.exceeds_5pct
                                            ? 'Der Grenzwert wurde überschritten. Eine gemeinsame Bewertung der Entgeltstrukturen unter Einbindung der Arbeitnehmervertretung wird empfohlen.'
                                            : 'Kein unmittelbarer Handlungsbedarf. Jährliche Überprüfung gemäß Art. 9 Abs. 2 wird empfohlen.'}
                                    </p>
                                </div>
                            </div>

                            {/* Three-gap comparison strip */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {[
                                    {
                                        label: 'Unbereinigter Gender Pay Gap (Median)',
                                        sub: `EU Art. 9 · Mittelwert: ${pct(over.unadjusted_mean)}`,
                                        value: pct(over.unadjusted_median),
                                        color: gapColor(over.unadjusted_median),
                                        tooltip: 'Roher Entgeltunterschied — keine Kontrolle für Struktur.',
                                    },
                                    {
                                        label: 'Bereinigter Gender Pay Gap · EU Art. 9',
                                        sub: `WIF-Faktoren: ${r.wif_factors_used.join(', ')}`,
                                        value: pct(over.adjusted_median),
                                        color: gapColor(over.adjusted_median),
                                        tooltip: 'Strukturell bereinigt: gleiche Stelle, Bereich und Standort.',
                                    },
                                    {
                                        label: 'Nach Begründungen · Art. 10',
                                        sub: explainedWithStatus.length > 0
                                            ? `Nach ${explainedWithStatus.length} dokumentierten Begründungen`
                                            : 'Keine abgeschlossenen Begründungen',
                                        value: explanationAdjustedGap !== null ? pct(explanationAdjustedGap) : '—',
                                        color: explanationAdjustedGap !== null ? gapColor(explanationAdjustedGap) : 'var(--color-pl-text-tertiary)',
                                        tooltip: 'Verbleibender Unterschied nach Abzug dokumentierter Art. 10-Begründungen (Teilgutschrift, max. 25%).',
                                    },
                                ].map(({ label, value, color, sub, tooltip }) => (
                                    <div key={label} className="glass-card p-4" title={tooltip}>
                                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>{label}</p>
                                        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{sub}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Secondary KPI grid */}
                            <div className="grid grid-cols-4 gap-4">
                                {[
                                    { label: 'Unbereinigt (Mittelwert)', value: pct(over.unadjusted_mean), color: gapColor(over.unadjusted_mean), sub: 'EU Art. 9' },
                                    { label: 'Bereinigt (Mittelwert)', value: pct(over.adjusted_mean), color: gapColor(over.adjusted_mean), sub: 'WIF-Mittelwert' },
                                    { label: 'Mitarbeitende', value: String(r.total_employees), color: 'var(--color-pl-text-primary)', sub: `F ${over.female_count} · M ${over.male_count}` },
                                    { label: 'Analyse-Datum', value: date, color: 'var(--color-pl-text-primary)', sub: `Berichtsjahr ${r.reporting_year}` },
                                ].map(({ label, value, color, sub }) => (
                                    <div key={label} className="glass-card p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>{label}</p>
                                        <p className="text-lg font-bold" style={{ color }}>{value}</p>
                                        {sub && <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{sub}</p>}
                                    </div>
                                ))}
                            </div>

                            {/* Methodology */}
                            <div className="glass-card p-5">
                                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>Methodik</p>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                                    {[
                                        ['Berechnungsbasis', 'Bruttostundenverdienst (Art. 3 EU 2023/970)'],
                                        ['WIF-Faktoren', r.wif_factors_used.join(', ')],
                                        ['Vollzeit-Referenz', `${r.standard_weekly_hours} Std./Woche`],
                                        ['Stundenabdeckung', `${r.hours_coverage_pct}%`],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                                            <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{k}</span>
                                            <span className="font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* HR Notes */}
                            <div className="glass-card p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                        HR-Anmerkungen
                                    </p>
                                    {!editingNotes ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleGenerateNarrative}
                                                disabled={aiLoading}
                                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all"
                                                style={{
                                                    background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))',
                                                    border: '1px solid rgba(99,102,241,0.3)',
                                                    color: 'var(--color-pl-accent)',
                                                }}
                                                title="Zusammenfassung generieren"
                                            >
                                                {aiLoading
                                                    ? <><Loader2 size={11} className="animate-spin" /> Generiert…</>
                                                    : <><Sparkles size={11} /> Zusammenfassung generieren</>}
                                            </button>
                                            <button onClick={() => setEditingNotes(true)} className="flex items-center gap-1 text-xs"
                                                style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                <PenLine size={12} /> Bearbeiten
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingNotes(false)} className="btn-ghost text-xs flex items-center gap-1">
                                                <X size={11} /> Abbrechen
                                            </button>
                                            <button onClick={saveNotes} disabled={isPending} className="btn-primary text-xs flex items-center gap-1">
                                                <Save size={11} /> Speichern
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {aiError && (
                                    <p className="text-xs mt-2" style={{ color: 'var(--color-pl-red)' }}>{aiError}</p>
                                )}
                                {editingNotes ? (
                                    <textarea
                                        rows={4}
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Ergänzen Sie Kommentare oder Kontextinformationen für den Bericht…"
                                        className="input-base text-sm resize-none w-full"
                                    />
                                ) : (
                                    <p className="text-sm" style={{ color: notes ? 'var(--color-pl-text-secondary)' : 'var(--color-pl-text-tertiary)' }}>
                                        {notes || 'Keine Anmerkungen vorhanden. Klicken Sie „Bearbeiten" um Kommentare hinzuzufügen.'}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {/* ── Department breakdown ── */}
                    {activeSection === 'departments' && (
                        <div className="glass-card">
                            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>Entgeltlücken nach Bereich</p>
                                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{ background: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.3)' }}>
                                        Nicht EU-Pflicht (Art. 9)
                                    </span>
                                </div>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    Ergänzende Managementansicht · Bereiche mit &lt; 5 MA anonymisiert · Nicht durch EU-RL 2023/970 Art. 9 vorgeschrieben
                                </p>
                            </div>
                            <table className="w-full text-xs">
                                <thead>
                                    <tr style={{ background: 'var(--theme-pl-action-ghost)' }}>
                                        {['Bereich', 'MA', 'F', 'M', 'Unbereinigt', 'Bereinigt', 'Nach Begründungen', '> 5%'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {r.by_department.map((d, i) => (
                                        <tr key={d.department} className="border-t" style={{ borderColor: 'var(--color-pl-border)', background: i % 2 === 0 ? 'transparent' : 'var(--theme-pl-action-ghost)' }}>
                                            <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>{d.department}</td>
                                            <td className="px-4 py-3" style={{ color: 'var(--color-pl-text-secondary)' }}>{d.employee_count}</td>
                                            <td className="px-4 py-3" style={{ color: 'var(--color-pl-text-secondary)' }}>{d.suppressed ? '—' : d.gap.female_count}</td>
                                            <td className="px-4 py-3" style={{ color: 'var(--color-pl-text-secondary)' }}>{d.suppressed ? '—' : d.gap.male_count}</td>
                                            <td className="px-4 py-3" style={{ color: d.suppressed ? 'var(--color-pl-text-tertiary)' : gapColor(d.gap.unadjusted_median) }}>
                                                {d.suppressed ? 'anon.' : pct(d.gap.unadjusted_median)}
                                            </td>
                                            <td className="px-4 py-3 font-semibold" style={{ color: d.suppressed ? 'var(--color-pl-text-tertiary)' : gapColor(d.gap.adjusted_median) }}>
                                                {d.suppressed ? '—' : pct(d.gap.adjusted_median)}
                                            </td>
                                            <td className="px-4 py-3" style={{ color: d.suppressed || groupNachBegrn.byDept[d.department] == null ? 'var(--color-pl-text-tertiary)' : gapColor(groupNachBegrn.byDept[d.department]!) }}>
                                                {d.suppressed ? '—' : groupNachBegrn.byDept[d.department] == null ? '—' : pct(groupNachBegrn.byDept[d.department]!)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {d.suppressed ? '—' : d.gap.exceeds_5pct
                                                    ? <span style={{ color: 'var(--color-pl-red)' }}>Ja</span>
                                                    : <span style={{ color: 'var(--color-pl-green)' }}>Nein</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── Grade breakdown ── */}
                    {activeSection === 'grades' && (
                        <div className="space-y-4">

                            {/* EU Art.9 Header */}
                            <div className="glass-card px-5 py-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                            EU Art. 9 Compliance — Entgelt nach Kategorie &amp; Geschlecht
                                        </p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            Diese Tabelle entspricht der gesetzlich vorgeschriebenen Berichtspflicht für Arbeitgeber mit ≥ 100 Beschäftigten.
                                        </p>
                                    </div>
                                    {bandGrades.length > 0 && !bandGrades.some(g => g.mid_salary != null) && (
                                        <div className="flex items-start gap-1.5 text-xs px-3 py-2 rounded-lg flex-shrink-0"
                                            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', maxWidth: 300 }}>
                                            <Info size={13} className="flex-shrink-0 mt-0.5" />
                                            <span>
                                                <strong>Compa-Ratio</strong> zeigt &quot;—&quot; weil keine Bandmitte (Midpoint) gesetzt ist.
                                                Öffnen Sie das <strong>Entgeltband-Modul</strong> und klicken Sie <em>„Interne Bänder berechnen“</em>.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ComplianceHeatmap when band data exists */}
                            {bandGrades.length > 0 ? (
                                <div className="glass-card p-5">
                                    <ComplianceHeatmap grades={bandGrades} />
                                </div>
                            ) : (
                                /* Fallback: plain pay-gap table */
                                <div className="glass-card">
                                    <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            Noch keine Entgeltbänder berechnet.
                                            Navigieren Sie zum <strong>Entgeltband-Modul</strong> und klicken Sie <em>„Interne Bänder berechnen“</em> um Compa-Ratios anzuzeigen.
                                        </p>
                                    </div>
                                    {r.by_grade.length === 0 ? (
                                        <p className="px-5 py-8 text-sm text-center" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            Keine Entgeltgruppen im Datensatz.
                                        </p>
                                    ) : (
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr style={{ background: 'var(--theme-pl-action-ghost)' }}>
                                                    {['Entgeltgruppe', 'MA', 'Unbereinigt', 'Bereinigt', 'Nach Begründungen', '> 5%'].map(h => (
                                                        <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {r.by_grade.map((g, i) => (
                                                    <tr key={g.grade} className="border-t" style={{ borderColor: 'var(--color-pl-border)', background: i % 2 === 0 ? 'transparent' : 'var(--theme-pl-action-ghost)' }}>
                                                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>{g.grade}</td>
                                                        <td className="px-4 py-3" style={{ color: 'var(--color-pl-text-secondary)' }}>{g.employee_count}</td>
                                                        <td className="px-4 py-3" style={{ color: g.suppressed ? 'var(--color-pl-text-tertiary)' : gapColor(g.gap.unadjusted_median) }}>
                                                            {g.suppressed ? 'anon.' : pct(g.gap.unadjusted_median)}
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold" style={{ color: g.suppressed ? 'var(--color-pl-text-tertiary)' : gapColor(g.gap.adjusted_median) }}>
                                                            {g.suppressed ? '—' : pct(g.gap.adjusted_median)}
                                                        </td>
                                                        <td className="px-4 py-3" style={{ color: g.suppressed || groupNachBegrn.byGrade[g.grade] == null ? 'var(--color-pl-text-tertiary)' : gapColor(groupNachBegrn.byGrade[g.grade]!) }}>
                                                            {g.suppressed ? '—' : groupNachBegrn.byGrade[g.grade] == null ? '—' : pct(groupNachBegrn.byGrade[g.grade]!)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {g.suppressed ? '—' : g.gap.exceeds_5pct
                                                                ? <span style={{ color: 'var(--color-pl-red)' }}>Ja</span>
                                                                : <span style={{ color: 'var(--color-pl-green)' }}>Nein</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Quartile analysis ── */}
                    {activeSection === 'quartiles' && (
                        <div className="glass-card">
                            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>Quartilsanalyse</p>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>Geschlechterverteilung in den vier Vergütungsquartilen</p>
                            </div>
                            <div className="p-5 space-y-4">
                                {(['q1', 'q2', 'q3', 'q4'] as const).map((q, i) => {
                                    const qData  = r.quartiles[q]
                                    const labels = ['Q1 — tiefstes Quartil', 'Q2', 'Q3', 'Q4 — höchstes Quartil']
                                    return (
                                        <div key={q}>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span style={{ color: 'var(--color-pl-text-secondary)' }}>{labels[i]}</span>
                                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{qData.count} Personen</span>
                                            </div>
                                            <div className="flex rounded-lg overflow-hidden h-7 text-xs font-semibold">
                                                <div className="flex items-center justify-center"
                                                    style={{ width: `${qData.female_pct}%`, background: 'var(--color-pl-accent)', color: '#fff', minWidth: qData.female_pct > 5 ? undefined : 0 }}>
                                                    {qData.female_pct > 8 && `♀ ${qData.female_pct}%`}
                                                </div>
                                                <div className="flex items-center justify-center"
                                                    style={{ width: `${qData.male_pct}%`, background: 'var(--color-pl-brand)', color: '#fff', minWidth: qData.male_pct > 5 ? undefined : 0 }}>
                                                    {qData.male_pct > 8 && `♂ ${qData.male_pct}%`}
                                                </div>
                                            </div>
                                            <div className="flex gap-4 mt-1 text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                <span style={{ color: qData.female_pct < 30 ? 'var(--color-pl-red)' : 'var(--color-pl-accent)' }}>♀ {qData.female_pct}%</span>
                                                <span style={{ color: 'var(--color-pl-brand)' }}>♂ {qData.male_pct}%</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Explanations ── */}
                    {activeSection === 'explanations' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Gesamt',  value: flaggedEmployees.length, color: 'var(--color-pl-text-primary)' },
                                    { label: 'Erklärt', value: explainedCount,          color: 'var(--color-pl-green)' },
                                    { label: 'Offen',   value: openCount,              color: openCount > 0 ? 'var(--color-pl-red)' : 'var(--color-pl-green)' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="glass-card p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{label}</p>
                                        <p className="text-3xl font-bold" style={{ color }}>{value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="glass-card p-5">
                                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>
                                    Angewendete Kategorien
                                </p>
                                <div className="space-y-2">
                                    {EXPLANATION_CATEGORIES.map(cat => {
                                        const count = explanations.filter(e => e.categories_json?.some(c => c.key === cat.key)).length
                                        if (count === 0) return null
                                        // Sum up claimed_pcts for this category across all explanations
                                        const claimedVals = explanations
                                            .flatMap(e => e.categories_json?.filter(c => c.key === cat.key) ?? [])
                                            .map(c => c.claimed_pct ?? 0)
                                            .filter(v => v > 0)
                                        const avgClaimed = claimedVals.length > 0
                                            ? (claimedVals.reduce((s, v) => s + v, 0) / claimedVals.length).toFixed(1)
                                            : null
                                        return (
                                            <div key={cat.key} className="flex items-center justify-between py-2 border-b"
                                                style={{ borderColor: 'var(--color-pl-border)' }}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                                                    <span className="text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>{cat.label}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                    <span>{count}× angewandt</span>
                                                    {avgClaimed !== null && (
                                                        <span style={{ color: cat.color }}>⌀ {avgClaimed}% beansprucht</span>
                                                    )}
                                                    <span>bis {cat.max_justifiable_pct}%</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Per-case detail — EU Art. 10 (claimed_pct per case) */}
                            {explanations.filter(e => e.status === 'explained').length > 0 && (
                                <div className="glass-card p-5">
                                    <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>
                                        Einzelfall-Übersicht (anonymisiert) — Art. 10
                                    </p>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr style={{ background: 'var(--theme-pl-action-ghost)' }}>
                                                {['ID', 'Kategorie(n)', 'Beansprucht', 'Restlücke', 'Status'].map(h => (
                                                    <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {explanations
                                                .filter(e => e.status === 'explained')
                                                .map((e, i) => {
                                                    const anonId = 'EMP-' + e.employee_id.slice(-6).toUpperCase()
                                                    const cats = e.categories_json
                                                        ?.map(c => EXPLANATION_CATEGORIES.find(x => x.key === c.key)?.label ?? c.key)
                                                        .join(', ') ?? e.category
                                                    const totalClaimed = e.categories_json
                                                        ?.reduce((s, c) => s + (c.claimed_pct ?? 0), 0) ?? e.max_justifiable_pct
                                                    const cappedClaimed = Math.min(totalClaimed, MAX_JUSTIFIABLE_CAP)
                                                    const flag = r.individual_flags.find(f => f.employee_id === e.employee_id)
                                                    const rawGapPct = flag ? Math.abs(flag.gap_vs_cohort_pct * 100) : null
                                                    const residual = rawGapPct != null ? Math.max(0, rawGapPct - cappedClaimed) : null
                                                    return (
                                                        <tr key={e.id} className="border-t" style={{ borderColor: 'var(--color-pl-border)', background: i % 2 === 0 ? 'transparent' : 'var(--theme-pl-action-ghost)' }}>
                                                            <td className="px-3 py-2.5 font-mono font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>{anonId}</td>
                                                            <td className="px-3 py-2.5" style={{ color: 'var(--color-pl-text-primary)' }}>{cats}</td>
                                                            <td className="px-3 py-2.5 font-semibold" style={{ color: 'var(--color-pl-brand)' }}>{cappedClaimed.toFixed(1)}%</td>
                                                            <td className="px-3 py-2.5 font-semibold" style={{ color: residual === null ? 'var(--color-pl-text-tertiary)' : residual > 5 ? 'var(--color-pl-red)' : residual > 2 ? 'var(--color-pl-amber)' : 'var(--color-pl-green)' }}>
                                                                {residual !== null ? `${residual.toFixed(1)}%` : '—'}
                                                            </td>
                                                            <td className="px-3 py-2.5" style={{ color: 'var(--color-pl-green)' }}>Erklärt</td>
                                                        </tr>
                                                    )
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Remediation plan summary ── */}
                    {activeSection === 'remediation' && (
                        <div className="space-y-4">
                            {remediationPlans.length === 0 ? (
                                <div className="glass-card p-8 text-center">
                                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        Keine Maßnahmen dokumentiert für diese Analyse.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* KPI row — meaningful counts, not plan-status */}
                                    {(() => {
                                        const criticalCount = flaggedEmployees.length
                                        const plansCreated  = remediationPlans.filter(p => p.status !== 'dismissed').length
                                        const coveredIds    = new Set(remediationPlans.filter(p => p.status !== 'dismissed').map(p => p.employee_id))
                                        const withoutPlan   = flaggedEmployees.filter(f => !coveredIds.has(f.employee_id)).length
                                        return (
                                            <div className="grid grid-cols-3 gap-4">
                                                {[{
                                                    label: 'Kritische Fälle',
                                                    sub:   '≥ 5% Lücke (Art. 9)',
                                                    value: criticalCount,
                                                    color: criticalCount > 0 ? 'var(--color-pl-red)' : 'var(--color-pl-green)',
                                                }, {
                                                    label: 'Maßnahmenpläne',
                                                    sub:   'Pläne erstellt',
                                                    value: plansCreated,
                                                    color: plansCreated > 0 ? 'var(--color-pl-brand)' : 'var(--color-pl-text-tertiary)',
                                                }, {
                                                    label: 'Noch ohne Plan',
                                                    sub:   'Kein Plan vorhanden',
                                                    value: withoutPlan,
                                                    color: withoutPlan > 0 ? 'var(--color-pl-amber)' : 'var(--color-pl-green)',
                                                }].map(({ label, sub, value, color }) => (
                                                    <div key={label} className="glass-card p-4">
                                                        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{label}</p>
                                                        <p className="text-3xl font-bold mb-1" style={{ color }}>{value}</p>
                                                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{sub}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    })()}

                                    {/* Action types */}
                                    <div className="glass-card p-5">
                                        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>Maßnahmentypen</p>
                                        <div className="space-y-2">
                                            {([
                                                ['salary_increase',      'Gehaltserhöhung'],
                                                ['job_reclassification', 'Neueinstufung'],
                                                ['promotion',            'Beförderung'],
                                                ['bonus_adjustment',     'Bonusanpassung'],
                                                ['review',               'Überprüfung'],
                                            ] as [string, string][]).map(([key, label]) => {
                                                const count = remediationPlans.filter(p => p.action_type === key).length
                                                if (count === 0) return null
                                                return (
                                                    <div key={key} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                                                        <span className="text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>{label}</span>
                                                        <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{count}×</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Horizon breakdown */}
                                    <div className="glass-card p-5">
                                        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>Zeithorizonte</p>
                                        <div className="space-y-2">
                                            {([
                                                ['6m',   '0 – 6 Monate'],
                                                ['1y',   '6 – 12 Monate'],
                                                ['1.5y', '12 – 18 Monate'],
                                                ['2-3y', '2 – 3 Jahre'],
                                            ] as [string, string][]).map(([key, label]) => {
                                                const count = remediationPlans.flatMap(p => p.plan_steps ?? []).filter(s => s.horizon === key).length
                                                if (count === 0) return null
                                                return (
                                                    <div key={key} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                                                        <span className="text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>{label}</span>
                                                        <span className="text-xs" style={{ color: 'var(--color-pl-brand)' }}>{count} Schritte</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        Gem. Art. 11 EU-RL 2023/970: Arbeitgeber, deren bereinigter Gender Pay Gap den 5%-Schwellenwert
                                        überschreitet, sind zur Dokumentation von Maßnahmen verpflichtet.
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── Legal declaration ── */}
                    {activeSection === 'declaration' && (
                        <div className="space-y-4">
                            <div className="glass-card p-6">
                                <p className="text-sm font-semibold mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                                    Rechtliche Erklärung nach EU-Richtlinie 2023/970 Art. 9
                                </p>
                                <div className="space-y-3 text-sm" style={{ color: 'var(--color-pl-text-secondary)', lineHeight: 1.7 }}>
                                    <p>
                                        <strong style={{ color: 'var(--color-pl-text-primary)' }}>{orgName}</strong> bestätigt,
                                        dass vorliegender Bericht gemäß EU-Richtlinie 2023/970 und EntgTranspG erstellt wurde.
                                        Die ausgewiesenen Daten basieren auf <strong style={{ color: 'var(--color-pl-text-primary)' }}>{r.total_employees} Beschäftigten</strong> (Datenstand: {r.reporting_year}).
                                    </p>
                                    <p>
                                        Entgeltlücke (Drei-Stufen-Darstellung gemäß Art. 9 und 10 EU 2023/970):
                                    </p>
                                    <ul className="space-y-1 pl-4" style={{ listStyleType: 'disc' }}>
                                        <li>
                                            <strong>Unbereinigt:</strong>{' '}
                                            <span style={{ color: gapColor(over.unadjusted_median) }}>{pct(over.unadjusted_median)}</span>{' '}(Median) /{' '}
                                            <span style={{ color: gapColor(over.unadjusted_mean) }}>{pct(over.unadjusted_mean)}</span> (Mittelwert)
                                        </li>
                                        <li>
                                            <strong>Strukturell bereinigt (Art. 9, WIF-Methode):</strong>{' '}
                                            <span style={{ color: gapColor(over.adjusted_median) }}>{pct(over.adjusted_median)}</span> (Median)
                                        </li>
                                        <li>
                                            <strong>Erklärt bereinigt nach individueller Begründung (Art. 10):</strong>{' '}
                                            <span style={{ color: explanationAdjustedGap != null ? gapColor(explanationAdjustedGap) : 'var(--color-pl-text-tertiary)' }}>
                                                {explanationAdjustedGap != null ? pct(explanationAdjustedGap) : 'Keine Begründungen dokumentiert'}
                                            </span>
                                        </li>
                                    </ul>
                                    <p>
                                        {over.exceeds_5pct
                                            ? 'Der bereinigte Schwellenwert von 5% wird überschritten. Eine gemeinsame Entgeltbewertung gemäß Art. 9 Abs. 1 Buchstabe c wird eingeleitet. Die Arbeitnehmervertretung ist einzubeziehen.'
                                            : 'Der bereinigte Schwellenwert von 5% wird nicht überschritten. Kein unmittelbarer gesetzlicher Handlungsbedarf.'}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        Hinweis: Verstöße gegen das Entgelttransparenzgebot können gemäß §§ 17–21 EntgTranspG sowie
                                        Art. 23 EU 2023/970 zu Sanktionen und voller Entschädigungspflicht einschließlich
                                        Nachzahlungen und immateriellen Schadensersatz führen. Beweislast liegt beim Arbeitgeber.
                                    </p>
                                </div>
                            </div>

                            {/* Signature fields */}
                            <div className="grid grid-cols-3 gap-4">
                                {['HR-Leitung', 'Geschäftsführung', 'Arbeitnehmervertretung'].map(sig => (
                                    <div key={sig} className="glass-card p-5">
                                        <div className="h-16 border-b mb-3" style={{ borderColor: 'var(--color-pl-border)' }} />
                                        <p className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{sig}</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>Datum, Unterschrift</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
