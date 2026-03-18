import React from 'react'
import {
    Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer'
import type { AnalysisResult } from '@/lib/calculations/types'
import { EXPLANATION_CATEGORIES } from '@/app/(dashboard)/dashboard/import/constants'

// ============================================================
// CompLens branded PDF report
// EU Pay Transparency Directive 2023/970 — Art. 9 Report
// ============================================================

// ── Palette ─────────────────────────────────────────────────
const BRAND   = '#1A3E66'   // CompLens navy
const NAVY    = '#0f172a'
const SLATE   = '#1e293b'
const SLATE2  = '#334155'
const MUTED   = '#64748b'
const TEXT    = '#1e293b'
const GREEN   = '#16a34a'
const RED     = '#dc2626'
const AMBER   = '#d97706'
const WHITE   = '#ffffff'
const SURFACE = '#f8fafc'
const BORDER  = '#e2e8f0'

// ── Helpers ──────────────────────────────────────────────────
function pct(val: number | null, decimals = 1): string {
    if (val === null) return '—'
    const v = (val * 100).toFixed(decimals)
    return Number(v) >= 0 ? `+${v}%` : `${v}%`
}

function gapColor(val: number | null): string {
    if (val === null) return MUTED
    const abs = Math.abs(val * 100)
    return abs >= 5 ? RED : abs >= 2 ? AMBER : GREEN
}

function hrFmt(val: number | null): string {
    if (val === null || val === 0) return '—'
    return val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €/h'
}

// ── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        fontFamily:      'Helvetica',
        backgroundColor: WHITE,
        paddingBottom:   48,
    },
    // Cover
    cover: {
        backgroundColor: NAVY,
        padding: 48,
        height:  '100%',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    coverLogoBox: {
        width:  48,
        height: 48,
        borderRadius: 12,
        backgroundColor: BRAND,
        alignItems: 'center',
        justifyContent: 'center',
    },
    coverLogoTxt: { color: WHITE, fontSize: 18, fontFamily: 'Helvetica-Bold' },
    coverTitle:   { color: WHITE, fontSize: 32, fontFamily: 'Helvetica-Bold', marginTop: 64, lineHeight: 1.2 },
    coverSubtitle:{ color: '#94a3b8', fontSize: 14, marginTop: 12 },
    coverMeta:    { color: '#64748b', fontSize: 10, marginTop: 4 },
    coverBadge: {
        backgroundColor: '#1e3a5f',
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignSelf: 'flex-start',
        marginTop: 32,
    },
    coverBadgeTxt: { color: BRAND, fontSize: 10, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
    coverFooter:  { color: '#475569', fontSize: 9 },

    // Header stripe on inner pages
    pageHeader: {
        backgroundColor: NAVY,
        paddingHorizontal: 40,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 0,
    },
    pageHeaderLogo:  { color: WHITE, fontSize: 13, fontFamily: 'Helvetica-Bold' },
    pageHeaderRight: { color: '#64748b', fontSize: 8 },

    // Content area
    content: { paddingHorizontal: 40, paddingTop: 28 },

    // Section
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        color: NAVY,
        marginBottom: 4,
        marginTop: 24,
    },
    sectionSubtitle: { fontSize: 9, color: MUTED, marginBottom: 16 },
    divider: { height: 1, backgroundColor: BORDER, marginBottom: 16 },

    // KPI row
    kpiRow:  { flexDirection: 'row', gap: 12, marginBottom: 16 },
    kpiCard: {
        flex: 1,
        backgroundColor: SURFACE,
        borderRadius: 6,
        padding: 10,
        borderWidth: 1,
        borderColor: BORDER,
    },
    kpiLabel: { fontSize: 6, color: MUTED, marginBottom: 3, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
    kpiValue: { fontSize: 17, fontFamily: 'Helvetica-Bold' },
    kpiDesc:  { fontSize: 7, color: MUTED, marginTop: 2, lineHeight: 1.35 },
    kpiUnit:  { fontSize: 9, color: MUTED, marginTop: 2 },

    // Table
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: SLATE,
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 4,
        marginBottom: 1,
    },
    tableHeaderTxt: { color: WHITE, fontSize: 8, fontFamily: 'Helvetica-Bold', flex: 1 },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        alignItems: 'center',
    },
    tableCell:     { fontSize: 9, color: TEXT, flex: 1 },
    tableCellBold: { fontSize: 9, color: TEXT, flex: 1, fontFamily: 'Helvetica-Bold' },
    tableCellR:    { fontSize: 9, color: TEXT, flex: 1, textAlign: 'right' },

    // Alerts
    alertGreen: {
        backgroundColor: '#f0fdf4',
        borderLeftWidth: 4,
        borderLeftColor: GREEN,
        padding: 12,
        borderRadius: 4,
        marginBottom: 16,
    },
    alertRed: {
        backgroundColor: '#fef2f2',
        borderLeftWidth: 4,
        borderLeftColor: RED,
        padding: 12,
        borderRadius: 4,
        marginBottom: 16,
    },
    alertTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
    alertText:  { fontSize: 9, color: MUTED },

    // Explanation pill
    pill: {
        borderRadius: 4,
        paddingVertical: 2,
        paddingHorizontal: 6,
        alignSelf: 'flex-start',
    },
    pillTxt: { fontSize: 8, fontFamily: 'Helvetica-Bold' },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: BORDER,
        paddingTop: 8,
    },
    footerTxt: { fontSize: 8, color: MUTED },
})

// ── Inner page wrapper ────────────────────────────────────────
function InnerPage({ orgName, reportYear, isSample, children }: {
    orgName: string
    reportYear: number
    isSample?: boolean
    children: React.ReactNode
}) {
    return (
        <Page size="A4" style={s.page}>
            {isSample && (
                <View style={{ position: 'absolute', top: 300, left: 70, zIndex: 9999 }}>
                    <Text style={{ fontSize: 130, color: 'rgba(239, 68, 68, 0.1)', fontFamily: 'Helvetica-Bold', transform: 'rotate(-45deg)' }}>MUSTER</Text>
                </View>
            )}
            <View style={s.pageHeader}>
                <Text style={s.pageHeaderLogo}>CompLens</Text>
                <Text style={s.pageHeaderRight}>{orgName} · Entgeltbericht {reportYear}</Text>
            </View>
            <View style={s.content}>
                {children}
            </View>
            <View style={s.footer} fixed>
                <Text style={s.footerTxt}>CompLens — EU Entgelttransparenz 2023/970</Text>
                <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`} />
            </View>
        </Page>
    )
}

// ── Main document ─────────────────────────────────────────────

export type RemPlan = {
    employee_id:     string
    action_type:     string
    status:          string
    deadline_months: number
    plan_steps:      Array<{
        step_number?:  number
        action_type?:  string
        horizon:       string
        description:   string
        target_salary: number | null
        responsible?:  string
        notes?:        string
        status?:       string
    }>
}

const ACTION_LABELS: Record<string, string> = {
    salary_increase:      'Gehaltserhöhung',
    job_reclassification: 'Neueinstufung',
    promotion:            'Beförderung',
    bonus_adjustment:     'Bonusanpassung',
    review:               'Überprüfung',
}

const HORIZON_LABELS: Record<string, string> = {
    '6m':   '0 – 6 Monate',
    '1y':   '6 – 12 Monate',
    '1.5y': '12 – 18 Monate',
    '2-3y': '2 – 3 Jahre',
}

export type ReportDocumentProps = {
    result:                  AnalysisResult
    orgName:                 string
    reportName:              string
    createdAt:               string
    reportNotes?:            string | null
    sections?:               Set<string> | null
    signatories?:            [string, string, string]
    explanationAdjustedGap?: number | null   // Tier 3, computed by caller
    remediationPlans?:       RemPlan[]
    isSample?:               boolean
    explanations: Array<{
        id:                  string
        employee_id:         string
        category:            string
        categories_json:     Array<{ key: string; comment: string; claimed_pct?: number }>
        action_plan:         string
        max_justifiable_pct: number
        status:              string
        created_at:          string
    }>
}

export function ReportDocument({
    result, orgName, reportName, createdAt, reportNotes, explanations,
    sections, signatories, explanationAdjustedGap, remediationPlans = [], isSample,
}: ReportDocumentProps) {
    // Helper: is a section enabled? (null/undefined = all enabled)
    const show = (key: string) => !sections || sections.has(key)
    const sigs = signatories ?? ['HR-Leitung', 'Geschäftsführung', 'Arbeitnehmervertretung']
    const year   = result.reporting_year
    const date   = new Date(createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
    const over   = result.overall
    // Base open/explained on flagged employees (individuals with |gap| ≥ 5%)
    // Employees with no explanation record at all count as "open"
    const flaggedEmployees    = result.individual_flags.filter(f => Math.abs(f.gap_vs_cohort_pct) >= 0.05)
    const explainedEmployeeIds = new Set(explanations.filter(e => e.status === 'explained').map(e => e.employee_id))
    const dismissedEmployeeIds = new Set(explanations.filter(e => e.status === 'dismissed').map(e => e.employee_id))
    const explainedCount = flaggedEmployees.filter(f => explainedEmployeeIds.has(f.employee_id)).length
    const openCount      = flaggedEmployees.filter(f => !explainedEmployeeIds.has(f.employee_id) && !dismissedEmployeeIds.has(f.employee_id)).length

    // Per-group "Nach Begründungen" residual (same formula as AnalysisPage)
    function groupResidual(groupFlags: AnalysisResult['individual_flags'], adjMedian: number): number | null {
        type Cat = { claimed_pct?: number }
        const explMap = new Map<string, Cat[]>()
        for (const exp of explanations) {
            explMap.set(exp.employee_id, (exp.categories_json ?? []) as Cat[])
        }
        const flagged = groupFlags.filter(f => Math.abs(f.gap_vs_cohort_pct) >= 0.05)
        if (!flagged.length) return null
        let sumRaw = 0, sumResiduals = 0
        for (const f of flagged) {
            const raw = Math.abs(f.gap_vs_cohort_pct * 100)
            const cats = explMap.get(f.employee_id) ?? []
            const expl = Math.min(cats.reduce((s: number, c: Cat) => s + (c.claimed_pct ?? 0), 0), 25)
            sumRaw += raw
            sumResiduals += Math.max(0, raw - expl)
        }
        const adj100 = (adjMedian ?? 0) * 100
        return sumRaw > 0 ? (adj100 * (sumResiduals / sumRaw)) / 100 : adj100 / 100
    }

    return (
        <Document
            title={`Entgeltbericht ${year} — ${orgName}`}
            author="CompLens"
            subject="EU Pay Transparency Report — Art. 9"
            language="de"
        >
            {/* ── COVER PAGE ─────────────────────────────────── */}
            <Page size="A4" style={s.page}>
                {isSample && (
                    <View style={{ position: 'absolute', top: 300, left: 70, zIndex: 9999 }}>
                        <Text style={{ fontSize: 130, color: 'rgba(239, 68, 68, 0.12)', fontFamily: 'Helvetica-Bold', transform: 'rotate(-45deg)' }}>MUSTER</Text>
                    </View>
                )}
                <View style={s.cover}>
                    {/* Logo */}
                    <View>
                        <View style={s.coverLogoBox}>
                            <Text style={s.coverLogoTxt}>C</Text>
                        </View>
                        <View style={s.coverBadge}>
                            <Text style={s.coverBadgeTxt}>EU ENTGELTTRANSPARENZ — ART. 9</Text>
                        </View>
                    </View>

                    {/* Title block */}
                    <View>
                        <Text style={s.coverTitle}>
                            Entgelt{'\n'}gleichheits{'\n'}bericht
                        </Text>
                        <Text style={s.coverSubtitle}>{orgName}</Text>
                        <Text style={s.coverMeta}>Berichtszeitraum: {year} · Erstellt: {date}</Text>
                        <Text style={{ ...s.coverMeta, marginTop: 8 }}>{reportName}</Text>
                    </View>

                    {/* Footer */}
                    <View>
                        <Text style={s.coverFooter}>
                            Erstellt mit CompLens · Konform mit EU-Richtlinie 2023/970 und EntgTranspG
                        </Text>
                    </View>
                </View>
            </Page>

            {/* ── EXECUTIVE SUMMARY ──────────────────────────── */}
            {show('executiveSummary') && (
            <InnerPage orgName={orgName} reportYear={year} isSample={isSample}>
                <Text style={s.sectionTitle}>Executive Summary</Text>
                <Text style={s.sectionSubtitle}>
                    Gesamtergebnis der Entgeltanalyse nach EU-Richtlinie 2023/970 Art. 9
                </Text>
                <View style={s.divider} />

                {/* Status alert */}
                {over.exceeds_5pct ? (
                    <View style={s.alertRed}>
                        <Text style={{ ...s.alertTitle, color: RED }}>
                            ⚠ 5%-Schwelle überschritten — Gemeinsame Entgeltbewertung erforderlich
                        </Text>
                        <Text style={s.alertText}>
                            Gemäß Art. 9 Abs. 1 Buchstabe c muss eine gemeinsame Bewertung der Entgeltstrukturen
                            durchgeführt werden. Die Arbeitnehmervertretung ist einzubeziehen.
                        </Text>
                    </View>
                ) : (
                    <View style={s.alertGreen}>
                        <Text style={{ ...s.alertTitle, color: GREEN }}>
                            ✓ Entgeltlücke unterhalb der 5%-Schwelle
                        </Text>
                        <Text style={s.alertText}>
                            Kein unmittelbarer Handlungsbedarf nach Art. 9 Abs. 1. Jährliche Überprüfung empfohlen.
                        </Text>
                    </View>
                )}

                {/* ── Row 1: Organisation data ── */}
                <View style={s.kpiRow}>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>MITARBEITENDE</Text>
                        <Text style={{ ...s.kpiValue, color: NAVY }}>{result.total_employees}</Text>
                        <Text style={s.kpiDesc}>F {over.female_count} · M {over.male_count}</Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>ANALYSE-DATUM</Text>
                        <Text style={{ ...s.kpiValue, color: NAVY, fontSize: 15 }}>{date}</Text>
                        <Text style={s.kpiDesc}>Berichtsjahr {year}</Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>VOLLZEIT-REFERENZ</Text>
                        <Text style={{ ...s.kpiValue, color: NAVY, fontSize: 15 }}>{result.standard_weekly_hours}h/Wo</Text>
                        <Text style={s.kpiDesc}>Stundenabdeckung: {result.hours_coverage_pct}%</Text>
                    </View>
                </View>

                {/* ── Row 2: Pflicht-GPG (Median) — Art. 9 mandatory ── */}
                <View style={{ marginTop: 6, marginBottom: 2 }}>
                    <Text style={{ fontSize: 6.5, color: MUTED, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, marginBottom: 4 }}>
                        PFLICHTANGABEN NACH ART. 9 EU-RL 2023/970
                    </Text>
                </View>
                <View style={s.kpiRow}>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>ENTGELTLÜCKE UNBEREINIGT (MEDIAN) · ART. 9</Text>
                        <Text style={{ ...s.kpiValue, color: gapColor(over.unadjusted_median) }}>
                            {pct(over.unadjusted_median)}
                        </Text>
                        <Text style={s.kpiDesc}>Rohes Lohngefälle · Mittelwert: {pct(over.unadjusted_mean)}</Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>STRUKTURELL BEREINIGT (MEDIAN) · ART. 9</Text>
                        <Text style={{ ...s.kpiValue, color: gapColor(over.adjusted_median) }}>
                            {pct(over.adjusted_median)}
                        </Text>
                        <Text style={s.kpiDesc}>WIF: {result.wif_factors_used.join(', ')}</Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>NACH BEGRÜNDUNGEN (MEDIAN) · ART. 10</Text>
                        <Text style={{ ...s.kpiValue, color: explanationAdjustedGap != null ? gapColor(explanationAdjustedGap) : MUTED }}>
                            {explanationAdjustedGap != null ? pct(explanationAdjustedGap) : '—'}
                        </Text>
                        <Text style={s.kpiDesc}>
                            {explanations.filter(e => e.status === 'explained').length > 0
                                ? `Nach ${explanations.filter(e => e.status === 'explained').length} Begründungen (Art. 18)`
                                : 'Keine abgeschlossenen Begründungen'}
                        </Text>
                    </View>
                </View>

                {/* ── Row 3: Mittelwerte + Variable Vergütung ── */}
                <View style={s.kpiRow}>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>UNBEREINIGT (MITTELWERT)</Text>
                        <Text style={{ ...s.kpiValue, color: gapColor(over.unadjusted_mean), fontSize: 15 }}>
                            {pct(over.unadjusted_mean)}
                        </Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>BEREINIGT (MITTELWERT)</Text>
                        <Text style={{ ...s.kpiValue, color: gapColor(over.adjusted_mean), fontSize: 15 }}>
                            {pct(over.adjusted_mean)}
                        </Text>
                    </View>
                    {(() => {
                        const flags = result.individual_flags
                        const fTotal = flags.filter(f => f.gender === 'female').length
                        const mTotal = flags.filter(f => f.gender === 'male').length
                        const fVar   = flags.filter(f => f.gender === 'female' && (f.imported_variable_pay_eur ?? 0) > 0).length
                        const mVar   = flags.filter(f => f.gender === 'male'   && (f.imported_variable_pay_eur ?? 0) > 0).length
                        const fPct = fTotal > 0 ? ((fVar / fTotal) * 100).toFixed(0) : '—'
                        const mPct = mTotal > 0 ? ((mVar / mTotal) * 100).toFixed(0) : '—'
                        return (
                            <View style={s.kpiCard}>
                                <Text style={s.kpiLabel}>VARIABLE VERGÜT. · ART. 9(1)C</Text>
                                <Text style={{ ...s.kpiValue, fontSize: 15, color: NAVY }}>F {fPct}%</Text>
                                <Text style={{ ...s.kpiValue, fontSize: 15, color: NAVY, marginTop: 1 }}>M {mPct}%</Text>
                                <Text style={s.kpiDesc}>Anteil mit var. Entgelt nach Geschlecht</Text>
                            </View>
                        )
                    })()}
                </View>

                {/* ── Row 4: Stundenlohn-Mediane ── */}
                <View style={s.kpiRow}>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>MEDIAN STUNDENLOHN FRAUEN</Text>
                        <Text style={{ ...s.kpiValue, color: NAVY, fontSize: 15 }}>
                            {hrFmt(over.female_median_salary)}
                        </Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>MEDIAN STUNDENLOHN MÄNNER</Text>
                        <Text style={{ ...s.kpiValue, color: NAVY, fontSize: 15 }}>
                            {hrFmt(over.male_median_salary)}
                        </Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>DIFFERENZ (MEDIAN)</Text>
                        <Text style={{ ...s.kpiValue, color: gapColor(over.unadjusted_median), fontSize: 15 }}>
                            {hrFmt(over.male_median_salary - over.female_median_salary)}
                        </Text>
                        <Text style={s.kpiDesc}>Absoluter Unterschied €/Std.</Text>
                    </View>
                </View>

                {/* Methodology note */}
                <Text style={s.sectionTitle}>Methodik</Text>
                <View style={s.divider} />
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    {[
                        { label: 'Berechnungsbasis', value: 'Bruttostundenverdienst (Art. 3 EU 2023/970)' },
                        { label: 'WIF-Faktoren', value: result.wif_factors_used.join(', ') },
                        { label: 'Vollzeit-Referenz', value: `${result.standard_weekly_hours}h/Woche` },
                        { label: 'Stundenabdeckung', value: `${result.hours_coverage_pct}%` },
                    ].map(({ label, value }) => (
                        <View key={label} style={{ flex: 1, backgroundColor: SURFACE, borderRadius: 6, padding: 10, borderWidth: 1, borderColor: BORDER }}>
                            <Text style={{ fontSize: 7, color: MUTED, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>{label}</Text>
                            <Text style={{ fontSize: 9, color: TEXT }}>{value}</Text>
                        </View>
                    ))}
                </View>

            </InnerPage>
            )}

            {/* ── HR NOTES — own page so it never strands ─────────────── */}
            {show('executiveSummary') && !!reportNotes && (
            <InnerPage orgName={orgName} reportYear={year} isSample={isSample}>
                <Text style={s.sectionTitle}>HR-Anmerkungen</Text>
                <View style={s.divider} />
                <View style={{
                    backgroundColor: SURFACE, borderRadius: 8,
                    padding: 14, borderWidth: 1, borderColor: BORDER,
                }}>
                    <Text style={{ fontSize: 10, color: TEXT, lineHeight: 1.6 }}>{reportNotes}</Text>
                </View>
            </InnerPage>
            )}

            {/* ── DEPARTMENT BREAKDOWN ───────────────────────── */}
            {show('departments') && (
            <InnerPage orgName={orgName} reportYear={year} isSample={isSample}>
                <Text style={s.sectionTitle}>Entgeltlücken nach Bereich</Text>
                <Text style={s.sectionSubtitle}>
                    Bereinigte Entgeltlücke (Median) je Bereich · Bereiche mit &lt; 5 MA anonymisiert
                </Text>
                <View style={s.divider} />

                <View style={s.tableHeader}>
                    <Text style={{ ...s.tableHeaderTxt, flex: 2.5 }}>Bereich</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>MA</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>F</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>M</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>Unbereinigt</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>Bereinigt</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>Nach Begr.</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>&gt; 5%</Text>
                </View>
                {result.by_department.map((d, i) => (
                    <View key={d.department} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? WHITE : '#f8fafc' }}>
                        <Text style={{ ...s.tableCellBold, flex: 2.5 }}>{d.department}</Text>
                        <Text style={{ ...s.tableCellR }}>{d.employee_count}</Text>
                        <Text style={{ ...s.tableCellR }}>{d.suppressed ? '—' : d.gap.female_count}</Text>
                        <Text style={{ ...s.tableCellR }}>{d.suppressed ? '—' : d.gap.male_count}</Text>
                        <Text style={{ ...s.tableCellR, color: d.suppressed ? MUTED : gapColor(d.gap.unadjusted_median) }}>
                            {d.suppressed ? 'anonymisiert' : pct(d.gap.unadjusted_median)}
                        </Text>
                        <Text style={{ ...s.tableCellR, color: d.suppressed ? MUTED : gapColor(d.gap.adjusted_median), fontFamily: 'Helvetica-Bold' }}>
                            {d.suppressed ? '—' : pct(d.gap.adjusted_median)}
                        </Text>
                        {(() => {
                            const dFlags = result.individual_flags.filter(f => f.department === d.department)
                            const nb = d.suppressed ? null : groupResidual(dFlags, d.gap.adjusted_median ?? 0)
                            return <Text style={{ ...s.tableCellR, color: nb != null ? gapColor(nb) : MUTED }}>{nb != null ? pct(nb) : '—'}</Text>
                        })()}
                        <Text style={{ ...s.tableCellR, color: d.gap.exceeds_5pct ? RED : GREEN }}>
                            {d.suppressed ? '—' : d.gap.exceeds_5pct ? 'Ja' : 'Nein'}
                        </Text>
                    </View>
                ))}
            </InnerPage>
            )}

            {/* ── GRADE & QUARTILE ───────────────────────────── */}
            {(show('grades') || show('quartiles')) && (
            <InnerPage orgName={orgName} reportYear={year} isSample={isSample}>
                {/* Grade breakdown */}
                {show('grades') && result.by_grade.length > 0 && (
                    <>
                        <Text style={s.sectionTitle}>Entgeltlücken nach Entgeltgruppe</Text>
                        <View style={s.divider} />
                        <View style={s.tableHeader}>
                            <Text style={{ ...s.tableHeaderTxt, flex: 2 }}>Entgeltgruppe</Text>
                            <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>MA</Text>
                            <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>Unbereinigt</Text>
                            <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>Bereinigt</Text>
                            <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>Nach Begr.</Text>
                        </View>
                        {result.by_grade.map((g, i) => (
                            <View key={g.grade} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? WHITE : '#f8fafc' }}>
                                <Text style={{ ...s.tableCellBold, flex: 2 }}>{g.grade}</Text>
                                <Text style={s.tableCellR}>{g.employee_count}</Text>
                                <Text style={{ ...s.tableCellR, color: g.suppressed ? MUTED : gapColor(g.gap.unadjusted_median) }}>
                                    {g.suppressed ? 'anonymisiert' : pct(g.gap.unadjusted_median)}
                                </Text>
                                <Text style={{ ...s.tableCellR, color: g.suppressed ? MUTED : gapColor(g.gap.adjusted_median), fontFamily: 'Helvetica-Bold' }}>
                                    {g.suppressed ? '—' : pct(g.gap.adjusted_median)}
                                </Text>
                                {(() => {
                                    const gFlags = result.individual_flags.filter(f => f.job_grade === g.grade)
                                    const nb = g.suppressed ? null : groupResidual(gFlags, g.gap.adjusted_median ?? 0)
                                    return <Text style={{ ...s.tableCellR, color: nb != null ? gapColor(nb) : MUTED }}>{nb != null ? pct(nb) : '—'}</Text>
                                })()}
                            </View>
                        ))}
                    </>
                )}

                {/* Quartile analysis */}
                {show('quartiles') && (
                <>
                <Text style={{ ...s.sectionTitle, marginTop: 28 }}>Quartilsanalyse</Text>
                <Text style={s.sectionSubtitle}>Geschlechterverteilung in den vier Gehaltsquartilen</Text>
                <View style={s.divider} />
                <View style={s.tableHeader}>
                    <Text style={{ ...s.tableHeaderTxt, flex: 2 }}>Quartil</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>Frauen %</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>Männer %</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>Anzahl</Text>
                </View>
                {(['q1', 'q2', 'q3', 'q4'] as const).map((q, i) => {
                    const qData = result.quartiles[q]
                    const labels = ['Q1 (niedrigstes Quartil)', 'Q2', 'Q3', 'Q4 (höchstes Quartil)']
                    return (
                        <View key={q} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? WHITE : '#f8fafc' }}>
                            <Text style={{ ...s.tableCellBold, flex: 2 }}>{labels[i]}</Text>
                            <Text style={{ ...s.tableCellR, color: qData.female_pct < 30 ? RED : TEXT }}>{qData.female_pct}%</Text>
                            <Text style={s.tableCellR}>{qData.male_pct}%</Text>
                            <Text style={s.tableCellR}>{qData.count}</Text>
                        </View>
                    )
                })}
                </>
                )}
            </InnerPage>
            )}

            {/* ── EXPLANATIONS ───────────────────────────────── */}
            {show('explanations') && explanations.length > 0 && (
                <InnerPage orgName={orgName} reportYear={year} isSample={isSample}>
                    <Text style={s.sectionTitle}>Begründungen nach EU Art. 10</Text>
                    <Text style={s.sectionSubtitle}>
                        Dokumentierte individuelle Entgeltabweichungen mit objektiven Rechtfertigungsgründen
                    </Text>
                    <View style={s.divider} />

                    {/* Summary */}
                    <View style={s.kpiRow}>
                        <View style={s.kpiCard}>
                            <Text style={s.kpiLabel}>GESAMT AUFFÄLLIG</Text>
                            <Text style={{ ...s.kpiValue, color: NAVY }}>{flaggedEmployees.length}</Text>
                            <Text style={s.kpiDesc}>Pers. mit |Lücke| ≥ 5%</Text>
                        </View>
                        <View style={s.kpiCard}>
                            <Text style={s.kpiLabel}>ERKLÄRT</Text>
                            <Text style={{ ...s.kpiValue, color: GREEN }}>{explainedCount}</Text>
                            <Text style={s.kpiDesc}>Art. 10 dokumentiert</Text>
                        </View>
                        <View style={s.kpiCard}>
                            <Text style={s.kpiLabel}>OFFEN</Text>
                            <Text style={{ ...s.kpiValue, color: openCount > 0 ? RED : GREEN }}>{openCount}</Text>
                            <Text style={s.kpiDesc}>Noch keine Begründung</Text>
                        </View>
                        <View style={s.kpiCard}>
                            <Text style={s.kpiLabel}>ABGELEHNT</Text>
                            <Text style={{ ...s.kpiValue, color: MUTED }}>{dismissedEmployeeIds.size}</Text>
                            <Text style={s.kpiDesc}>Begründung abgelehnt</Text>
                        </View>
                    </View>

                    {/* Category usage */}
                    <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 8 }}>
                        Angewendete Kategorien
                    </Text>
                    {EXPLANATION_CATEGORIES.map(cat => {
                        const count = explanations.filter(e =>
                            e.categories_json?.some(c => c.key === cat.key)
                        ).length
                        if (count === 0) return null
                        return (
                            <View key={cat.key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                                <Text style={{ fontSize: 9, color: TEXT }}>{cat.label}</Text>
                                <Text style={{ fontSize: 9, color: MUTED }}>{count}× angewandt · bis {cat.max_justifiable_pct}% erklärbar</Text>
                            </View>
                        )
                    })}

                    {/* Per-case detail table — EU Art. 10 */}
                    {explanations.filter(e => e.status === 'explained').length > 0 && (
                        <>
                            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 16, marginBottom: 8 }}>
                                Einzelfall-Übersicht (anonymisiert) — Art. 10
                            </Text>
                            <View style={s.tableHeader} fixed>
                                <Text style={{ ...s.tableHeaderTxt, flex: 1.2 }}>ID</Text>
                                <Text style={{ ...s.tableHeaderTxt, flex: 2.5 }}>Kategorie(n)</Text>
                                <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>Beansprucht</Text>
                                <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>Restlücke</Text>
                                <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>Status</Text>
                            </View>
                            {explanations
                                .filter(e => e.status === 'explained')
                                .map((e, i) => {
                                    // Anonymised reference: show last 6 chars of employee_id
                                    const anonId = 'EMP-' + e.employee_id.slice(-6).toUpperCase()
                                    const cats = e.categories_json
                                        ?.map(c => EXPLANATION_CATEGORIES.find(x => x.key === c.key)?.label ?? c.key)
                                        .join(', ') ?? e.category
                                    const totalClaimed = e.categories_json
                                        ?.reduce((s, c) => s + (c.claimed_pct ?? 0), 0) ?? e.max_justifiable_pct
                                    // Find individual flag for this employee
                                    const flag = result.individual_flags.find(f => f.employee_id === e.employee_id)
                                    const rawGap = flag ? Math.abs(flag.gap_vs_cohort_pct * 100) : null
                                    const residual = rawGap != null ? Math.max(0, rawGap - Math.min(totalClaimed, 25)).toFixed(1) + '%' : '—'
                                    return (
                                        <View key={e.id} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? WHITE : '#f8fafc' }}>
                                            <Text style={{ ...s.tableCellBold, flex: 1.2, fontSize: 8 }}>{anonId}</Text>
                                            <Text style={{ ...s.tableCell, flex: 2.5, fontSize: 8 }}>{cats}</Text>
                                            <Text style={{ ...s.tableCellR, fontSize: 8 }}>{Math.min(totalClaimed, 25).toFixed(1)}%</Text>
                                            <Text style={{ ...s.tableCellR, fontSize: 8, color: parseFloat(residual) > 5 ? RED : parseFloat(residual) > 2 ? AMBER : GREEN }}>
                                                {residual}
                                            </Text>
                                            <Text style={{ ...s.tableCellR, fontSize: 8, color: GREEN }}>Erklärt</Text>
                                        </View>
                                    )
                                })}
                        </>
                    )}
                </InnerPage>
            )}

            {/* ── REMEDIATION PLAN SUMMARY — Art. 11 ────────── */}
            {show('remediation') && remediationPlans.length > 0 && (
            <InnerPage orgName={orgName} reportYear={year} isSample={isSample}>
                <Text style={s.sectionTitle}>Maßnahmenplan — Art. 11</Text>
                <Text style={s.sectionSubtitle}>
                    Dokumentierte Maßnahmen zur Beseitigung von Entgeltlücken gem. EU-RL 2023/970 Art. 11
                </Text>
                <View style={s.divider} />

                {/* KPI row */}
                <View style={s.kpiRow}>
                    {(() => {
                        const active = remediationPlans.filter(p => p.status !== 'dismissed').length
                        const done   = remediationPlans.filter(p => p.status === 'completed').length
                        const open   = remediationPlans.filter(p => p.status === 'open' || p.status === 'in_progress').length
                        return (<>
                            <View style={s.kpiCard}>
                                <Text style={s.kpiLabel}>AKTIVE PLÄNE GESAMT</Text>
                                <Text style={{ ...s.kpiValue, color: NAVY }}>{active}</Text>
                            </View>
                            <View style={s.kpiCard}>
                                <Text style={s.kpiLabel}>ABGESCHLOSSEN</Text>
                                <Text style={{ ...s.kpiValue, color: GREEN }}>{done}</Text>
                            </View>
                            <View style={s.kpiCard}>
                                <Text style={s.kpiLabel}>OFFEN / IN ARBEIT</Text>
                                <Text style={{ ...s.kpiValue, color: open > 0 ? AMBER : GREEN }}>{open}</Text>
                            </View>
                        </>)
                    })()}
                </View>

                {/* Action type breakdown */}
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 8 }}>
                    Maßnahmentypen
                </Text>
                {Object.entries(ACTION_LABELS).map(([key, label]) => {
                    const count = remediationPlans.filter(p => p.action_type === key).length
                    if (count === 0) return null
                    return (
                        <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                            <Text style={{ fontSize: 9, color: TEXT }}>{label}</Text>
                            <Text style={{ fontSize: 9, color: MUTED }}>{count} {count === 1 ? 'Plan' : 'Pläne'}</Text>
                        </View>
                    )
                })}

                {/* Horizon breakdown */}
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 16, marginBottom: 8 }}>
                    Zeithorizont der Maßnahmen
                </Text>
                {Object.entries(HORIZON_LABELS).map(([key, label]) => {
                    const count = remediationPlans.flatMap(p => p.plan_steps ?? []).filter(s => s.horizon === key).length
                    if (count === 0) return null
                    return (
                        <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                            <Text style={{ fontSize: 9, color: TEXT }}>{label}</Text>
                            <Text style={{ fontSize: 9, color: MUTED }}>{count} {count === 1 ? 'Schritt' : 'Schritte'}</Text>
                        </View>
                    )
                })}

                {/* Per-plan detail table — 6 columns: MA-Ref | Horizont | Beschreibung | Gehaltserhöh. | Bonus Ziel | Status */}
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 16, marginBottom: 6 }}>
                    Detailübersicht Maßnahmen
                </Text>
                <View style={s.tableHeader} fixed>
                    <Text style={{ ...s.tableHeaderTxt, flex: 0.9 }}>MA-Ref.</Text>
                    <Text style={{ ...s.tableHeaderTxt, flex: 0.8 }}>Horizont</Text>
                    <Text style={{ ...s.tableHeaderTxt, flex: 2.8 }}>Beschreibung</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right', flex: 1.2 }}>Gehaltserhöh.</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right', flex: 1.1 }}>Bonus Ziel</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right', flex: 0.8 }}>Status</Text>
                </View>
                {remediationPlans.flatMap((p, pi) =>
                    (p.plan_steps ?? []).map((step, si) => {
                        const anonId = 'MA-' + p.employee_id.slice(-5).toUpperCase()
                        const horizonLabel = HORIZON_LABELS[step.horizon] ?? step.horizon
                        const stepType = step.action_type ?? p.action_type
                        const isBonus  = stepType === 'bonus_adjustment'
                        const isSalary = stepType === 'salary_increase'
                        const salaryVal = (isSalary && step.target_salary != null)
                            ? `${step.target_salary.toLocaleString('de-DE')} €/J.` : '—'
                        const bonusVal  = (isBonus && step.target_salary != null)
                            ? `${step.target_salary.toLocaleString('de-DE')} €` : '—'
                        const statusLabel = ({ open: 'Offen', in_progress: 'Laufend', completed: 'Fertig', dismissed: 'Abgel.' } as Record<string,string>)[step.status ?? p.status ?? ''] ?? (step.status ?? p.status ?? '—')
                        const statusColor = p.status === 'completed' ? GREEN : p.status === 'dismissed' ? MUTED : AMBER
                        const isEven = (pi + si) % 2 === 0
                        return (
                            <View key={`${p.employee_id}-${si}`} style={{ ...s.tableRow, backgroundColor: isEven ? WHITE : '#f8fafc' }}>
                                <Text style={{ ...s.tableCellBold, flex: 0.9, fontSize: 7.5 }}>{anonId}</Text>
                                <Text style={{ ...s.tableCell, flex: 0.8, fontSize: 7.5, color: MUTED }}>{horizonLabel}</Text>
                                <Text style={{ ...s.tableCell, flex: 2.8, fontSize: 7.5 }}>{step.description || '—'}</Text>
                                <Text style={{ ...s.tableCellR, flex: 1.2, fontSize: 7.5, color: isSalary && step.target_salary != null ? NAVY : MUTED }}>{salaryVal}</Text>
                                <Text style={{ ...s.tableCellR, flex: 1.1, fontSize: 7.5, color: isBonus  && step.target_salary != null ? GREEN  : MUTED }}>{bonusVal}</Text>
                                <Text style={{ ...s.tableCellR, flex: 0.8, fontSize: 7.5, color: statusColor }}>{statusLabel}</Text>
                            </View>
                        )
                    })
                )}

                <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
                    Gem. Art. 11 EU-RL 2023/970: Arbeitgeber mit bereinigter Entgeltlücke über 5% müssen
                    gemeinsame Entgeltbewertung und Maßnahmen dokumentieren.
                </Text>
            </InnerPage>
            )}

            {show('declaration') && (
            <InnerPage orgName={orgName} reportYear={year}>
                <Text style={s.sectionTitle}>Rechtliche Erklärung</Text>
                <Text style={s.sectionSubtitle}>Art. 9 EU-Richtlinie 2023/970 — Berichtspflicht</Text>
                <View style={s.divider} />

                <View style={{ fontSize: 9, color: TEXT, lineHeight: 1.6, gap: 10 }}>
                    <Text style={{ fontSize: 9, color: TEXT, lineHeight: 1.6 }}>
                        {orgName} bestätigt, dass vorliegender Bericht gemäß EU-Richtlinie 2023/970 und
                        EntgTranspG erstellt wurde. Die ausgewiesenen Daten basieren auf {result.total_employees} Beschäftigten
                        (Datenstand: {year}).
                    </Text>
                    <Text style={{ fontSize: 9, color: TEXT, lineHeight: 1.6, marginTop: 8 }}>
                        Entgeltlücke (Drei-Stufen-Darstellung gemäß Art. 9 und 10 EU 2023/970):{`\n`}
                        · Unbereinigt: {pct(over.unadjusted_median)} (Median) / {pct(over.unadjusted_mean)} (Mittelwert){`\n`}
                        · Strukturell bereinigt (Art. 9, WIF-Methode): {pct(over.adjusted_median)} (Median){`\n`}
                        · Erklärt bereinigt nach individueller Begründung (Art. 10): {explanationAdjustedGap != null ? pct(explanationAdjustedGap) : 'Keine Begründungen dokumentiert'}
                    </Text>
                    <Text style={{ fontSize: 9, color: TEXT, lineHeight: 1.6, marginTop: 8 }}>
                        {over.exceeds_5pct
                            ? 'Der bereinigte Schwellenwert von 5% wird überschritten. Eine gemeinsame Entgeltbewertung gemäß Art. 9 Abs. 1 lit. c wird eingeleitet. Die Arbeitnehmervertretung ist einzubeziehen.'
                            : 'Der bereinigte Schwellenwert von 5% wird nicht überschritten. Kein unmittelbarer gesetzlicher Handlungsbedarf.'}
                    </Text>
                    <Text style={{ fontSize: 8, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
                        Hinweis: Verstöße gegen das Entgelttransparenzgebot können gemäß §§ 17–21 EntgTranspG sowie
                        Art. 23 EU 2023/970 zu Sanktionen und voller Entschädigungspflicht einschließlich
                        Nachzahlungen und immateriellen Schadensersatz führen. Beweislast liegt beim Arbeitgeber.
                    </Text>
                </View>


                {/* Signature area */}
                <View style={{ marginTop: 48, flexDirection: 'row', gap: 48 }}>
                    {sigs.map(sig => (
                        <View key={sig} style={{ flex: 1 }}>
                            <View style={{ height: 1, backgroundColor: SLATE2, marginBottom: 6 }} />
                            <Text style={{ fontSize: 8, color: MUTED }}>{sig}</Text>
                            <Text style={{ fontSize: 7, color: '#94a3b8', marginTop: 2 }}>Datum, Unterschrift</Text>
                        </View>
                    ))}
                </View>
            </InnerPage>
            )}
        </Document>
    )
}
