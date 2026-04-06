import React from 'react'
import {
    Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer'
import type { AnalysisResult } from '@/lib/calculations/types'
import type { BandGradeSummary } from '@/lib/band/getBandContext'
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

function hrFmt(val: number | null, locale = 'de'): string {
    if (val === null || val === 0) return '—'
    return val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €/h'
}

// ── Label type for i18n ─────────────────────────────────────
export type ReportLabels = Record<string, string>

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
function InnerPage({ orgName, reportYear, isSample, labels, children }: {
    orgName: string
    reportYear: number
    isSample?: boolean
    labels: ReportLabels
    children: React.ReactNode
}) {
    return (
        <Page size="A4" style={s.page}>
            <View style={s.pageHeader}>
                {/* Client org name — prominent left */}
                <Text style={{ ...s.pageHeaderLogo, fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{orgName}</Text>
                {/* CompLens — subtle right */}
                <Text style={{ ...s.pageHeaderRight, fontSize: 7, color: '#94a3b8' }}>{(labels.headerSubtitle || 'Pay Equity Report {year} · generated with CompLens').replace('{year}', String(reportYear))}</Text>
            </View>
            <View style={s.content}>
                {children}
            </View>
            <View style={s.footer} fixed>
                <Text style={s.footerTxt}>{(labels.footerLine || '{orgName} · Pay Equity Report {year} · EU 2023/970').replace('{orgName}', orgName).replace('{year}', String(reportYear))}</Text>
                <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => (labels.pageXofY || 'Page {page} of {total}').replace('{page}', String(pageNumber)).replace('{total}', String(totalPages))} />
            </View>
            {/* Watermark overlaid LAST so it renders on top of all content */}
            {isSample && (
                <>
                    <View style={{ position: 'absolute', top: 80,  left: 50, zIndex: 9999, opacity: 1 }}>
                        <Text style={{ fontSize: 110, color: 'rgba(220, 38, 38, 0.55)', fontFamily: 'Helvetica-Bold', transform: 'rotate(-40deg)' }}>{labels.sampleWatermark || 'SAMPLE'}</Text>
                    </View>
                    <View style={{ position: 'absolute', top: 320, left: 50, zIndex: 9999, opacity: 1 }}>
                        <Text style={{ fontSize: 110, color: 'rgba(220, 38, 38, 0.55)', fontFamily: 'Helvetica-Bold', transform: 'rotate(-40deg)' }}>{labels.sampleWatermark || 'SAMPLE'}</Text>
                    </View>
                    <View style={{ position: 'absolute', top: 560, left: 50, zIndex: 9999, opacity: 1 }}>
                        <Text style={{ fontSize: 110, color: 'rgba(220, 38, 38, 0.55)', fontFamily: 'Helvetica-Bold', transform: 'rotate(-40deg)' }}>{labels.sampleWatermark || 'SAMPLE'}</Text>
                    </View>
                </>
            )}
        </Page>
    )
}

// ── Locked upgrade page (trial/expired, page 5+) ──────────────
function LockedPage({ orgName, reportYear, sampleMode, labels }: { orgName: string; reportYear: number; sampleMode: 'trial' | 'expired'; labels: ReportLabels }) {
    const watermark = labels.sampleWatermark || 'SAMPLE'
    const headline = sampleMode === 'expired'
        ? (labels.lockedExpiredTitle || 'Trial period expired')
        : (labels.lockedTrialTitle || 'Report restricted in trial mode')
    const body = sampleMode === 'expired'
        ? (labels.lockedExpiredBody || 'Your trial period has ended. This and all subsequent pages are locked.\nLicence CompLens to download the full EU pay equity report.')
        : (labels.lockedTrialBody || 'This and all subsequent pages are locked in trial mode.\nLicence CompLens to download the full EU pay equity report.')
    return (
        <Page size="A4" style={s.page}>
            {/* Header */}
            <View style={s.pageHeader}>
                <Text style={s.pageHeaderLogo}>CompLens</Text>
                <Text style={s.pageHeaderRight}>{orgName} · {(labels.payReportYear || 'Pay Equity Report {year}').replace('{year}', String(reportYear))}</Text>
            </View>

            {/* Locked content area */}
            <View style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 60,
                paddingVertical: 40,
            }}>
                {/* Lock symbol */}
                <Text style={{ fontSize: 48, marginBottom: 20, color: 'rgba(220, 38, 38, 0.8)' }}>&#128274;</Text>

                {/* Headline */}
                <Text style={{
                    fontSize: 22, fontFamily: 'Helvetica-Bold', color: NAVY,
                    textAlign: 'center', marginBottom: 12,
                }}>
                    {headline}
                </Text>

                {/* Body */}
                <Text style={{
                    fontSize: 11, color: MUTED, textAlign: 'center',
                    lineHeight: 1.6, marginBottom: 24, maxWidth: 380,
                }}>
                    {body}
                </Text>

                {/* CTA box */}
                <View style={{
                    backgroundColor: '#1A3E66',
                    borderRadius: 6,
                    paddingVertical: 10,
                    paddingHorizontal: 28,
                }}>
                    <Text style={{
                        fontSize: 11, fontFamily: 'Helvetica-Bold',
                        color: WHITE, textAlign: 'center',
                    }}>
                        {labels.lockedCta || 'Upgrade now — Unlock the full report at complens.de'}
                    </Text>
                </View>
            </View>

            {/* Watermark on top */}
            <View style={{ position: 'absolute', top: 80,  left: 50, zIndex: 9999 }}>
                <Text style={{ fontSize: 110, color: 'rgba(220, 38, 38, 0.55)', fontFamily: 'Helvetica-Bold', transform: 'rotate(-40deg)' }}>{watermark}</Text>
            </View>
            <View style={{ position: 'absolute', top: 320, left: 50, zIndex: 9999 }}>
                <Text style={{ fontSize: 110, color: 'rgba(220, 38, 38, 0.55)', fontFamily: 'Helvetica-Bold', transform: 'rotate(-40deg)' }}>{watermark}</Text>
            </View>
            <View style={{ position: 'absolute', top: 560, left: 50, zIndex: 9999 }}>
                <Text style={{ fontSize: 110, color: 'rgba(220, 38, 38, 0.55)', fontFamily: 'Helvetica-Bold', transform: 'rotate(-40deg)' }}>{watermark}</Text>
            </View>

            {/* Footer */}
            <View style={s.footer} fixed>
                <Text style={s.footerTxt}>{labels.lockedFooter || 'CompLens — EU Pay Transparency 2023/970'}</Text>
                <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => (labels.pageXofY || 'Page {page} of {total}').replace('{page}', String(pageNumber)).replace('{total}', String(totalPages))} />
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

function getActionLabels(labels: ReportLabels): Record<string, string> {
    return {
        salary_increase:      labels.actionSalaryIncrease || 'Salary Increase',
        job_reclassification: labels.actionJobReclassification || 'Job Reclassification',
        promotion:            labels.actionPromotion || 'Promotion',
        bonus_adjustment:     labels.actionBonusAdjustment || 'Bonus Adjustment',
        review:               labels.actionReview || 'Review',
    }
}

function getHorizonLabels(labels: ReportLabels): Record<string, string> {
    return {
        '6m':   labels.horizon6mFull || '0 – 6 months',
        '1y':   labels.horizon1yFull || '6 – 12 months',
        '1.5y': labels.horizon15yFull || '12 – 18 months',
        '2-3y': labels.horizon2to3yFull || '2 – 3 years',
    }
}

export type ReportDocumentProps = {
    result:                  AnalysisResult
    orgName:                 string
    reportName:              string
    createdAt:               string
    locale?:                 string
    labels?:                 ReportLabels
    reportNotes?:            string | null
    sections?:               Set<string> | null
    signatories?:            [string, string, string]
    explanationAdjustedGap?: number | null
    remediationPlans?:       RemPlan[]
    isSample?:               boolean
    sampleMode?:             'trial' | 'expired' | null
    bandGrades?:             BandGradeSummary[]   // EU Art. 9 salary band data
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
    sections, signatories, explanationAdjustedGap, remediationPlans = [],
    isSample, sampleMode, bandGrades = [], locale: pdfLocale, labels: rawLabels,
}: ReportDocumentProps) {
    // Helper: is a section enabled? (null/undefined = all enabled)
    const show = (key: string) => !sections || sections.has(key)
    const loc  = pdfLocale ?? 'de'
    const L    = rawLabels ?? {} as ReportLabels
    const sigs = signatories ?? [L.sigHrLead || 'HR Lead', L.sigManagement || 'Management', L.sigWorksCouncil || 'Employee Representatives']
    const year   = result.reporting_year
    const date   = new Date(createdAt).toLocaleDateString(loc, { day: '2-digit', month: 'long', year: 'numeric' })
    const ACTION_LABELS  = getActionLabels(L)
    const HORIZON_LABELS = getHorizonLabels(L)
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
            title={(L.pdfDocTitle || 'Pay Equity Report {year} — {orgName}').replace('{year}', String(year)).replace('{orgName}', orgName)}
            author="CompLens"
            subject="EU Pay Transparency Report — Art. 9"
            language={L.pdfDocLanguage || loc}
        >
            {/* ── COVER PAGE ─────────────────────────────────── */}
            <Page size="A4" style={s.page}>
                <View style={s.cover}>
                    {/* EU badge + tiny CompLens attribution */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={s.coverBadge}>
                            <Text style={s.coverBadgeTxt}>{L.euBadge || 'EU PAY TRANSPARENCY — ART. 9'}</Text>
                        </View>
                        <Text style={{ fontSize: 7, color: '#94a3b8' }}>{L.createdWithCompLens || 'Generated with CompLens'}</Text>
                    </View>

                    {/* Title block — org name as the hero */}
                    <View>
                        <Text style={{ ...s.coverSubtitle, fontSize: 26, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
                            {orgName}
                        </Text>
                        <Text style={s.coverTitle}>
                            {L.coverReportTitle || 'Pay\nEquity\nReport'}
                        </Text>
                        <Text style={s.coverMeta}>{(L.coverReportPeriod || 'Reporting period: {year} · Generated: {date}').replace('{year}', String(year)).replace('{date}', date)}</Text>
                        <Text style={{ ...s.coverMeta, marginTop: 8 }}>{reportName}</Text>
                    </View>

                    {/* Footer — legal ref only */}
                    <View>
                        <Text style={s.coverFooter}>
                            {L.coverCompliance || 'Compliant with EU Directive 2023/970 and national transposition'}
                        </Text>
                    </View>
                </View>
                {/* Watermark after cover content — renders ON TOP of everything */}
                {isSample && (
                    <>
                        <View style={{ position: 'absolute', top: 100, left: 50, zIndex: 9999 }}>
                            <Text style={{ fontSize: 110, color: 'rgba(220, 38, 38, 0.55)', fontFamily: 'Helvetica-Bold', transform: 'rotate(-40deg)' }}>{L.sampleWatermark || 'SAMPLE'}</Text>
                        </View>
                        <View style={{ position: 'absolute', top: 370, left: 50, zIndex: 9999 }}>
                            <Text style={{ fontSize: 110, color: 'rgba(220, 38, 38, 0.55)', fontFamily: 'Helvetica-Bold', transform: 'rotate(-40deg)' }}>{L.sampleWatermark || 'SAMPLE'}</Text>
                        </View>
                        <View style={{ position: 'absolute', top: 630, left: 50, zIndex: 9999 }}>
                            <Text style={{ fontSize: 110, color: 'rgba(220, 38, 38, 0.55)', fontFamily: 'Helvetica-Bold', transform: 'rotate(-40deg)' }}>{L.sampleWatermark || 'SAMPLE'}</Text>
                        </View>
                    </>
                )}
            </Page>

            {/* ── EXECUTIVE SUMMARY ──────────────────────────── */}
            {show('executiveSummary') && (
            <InnerPage orgName={orgName} reportYear={year} isSample={isSample} labels={L}>
                <Text style={s.sectionTitle}>{L.executiveSummary || 'Executive Summary'}</Text>
                <Text style={s.sectionSubtitle}>
                    {L.summarySubtitle || 'Overall result of the pay analysis per EU Directive 2023/970 Art. 9'}
                </Text>
                <View style={s.divider} />

                {/* Status alert */}
                {over.exceeds_5pct ? (
                    <View style={s.alertRed}>
                        <Text style={{ ...s.alertTitle, color: RED }}>
                            {'⚠ ' + (L.alertExceeded || '5% threshold exceeded — Joint pay assessment required')}
                        </Text>
                        <Text style={s.alertText}>
                            {L.alertExceededBody || 'Under Art. 9(1)(c), a joint assessment of pay structures must be carried out. Employee representatives must be involved.'}
                        </Text>
                    </View>
                ) : (
                    <View style={s.alertGreen}>
                        <Text style={{ ...s.alertTitle, color: GREEN }}>
                            {'✓ ' + (L.alertBelowTitle || 'Pay gap below the 5% threshold')}
                        </Text>
                        <Text style={s.alertText}>
                            {L.alertBelowBody || 'No immediate action required under Art. 9(1). Annual review recommended.'}
                        </Text>
                    </View>
                )}

                {/* ── Row 1: Organisation data ── */}
                <View style={s.kpiRow}>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>{L.kpiEmployees || 'EMPLOYEES'}</Text>
                        <Text style={{ ...s.kpiValue, color: NAVY }}>{result.total_employees}</Text>
                        <Text style={s.kpiDesc}>F {over.female_count} · M {over.male_count}</Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>{L.kpiAnalysisDate || 'ANALYSIS DATE'}</Text>
                        <Text style={{ ...s.kpiValue, color: NAVY, fontSize: 15 }}>{date}</Text>
                        <Text style={s.kpiDesc}>{(L.kpiReportingYear || 'Reporting year {year}').replace('{year}', String(year))}</Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>{L.kpiFullTimeRef || 'FULL-TIME REFERENCE'}</Text>
                        <Text style={{ ...s.kpiValue, color: NAVY, fontSize: 15 }}>{(L.kpiHoursPerWeek || '{hours}h/wk').replace('{hours}', String(result.standard_weekly_hours))}</Text>
                        <Text style={s.kpiDesc}>{(L.kpiHoursCoverage || 'Hours coverage: {pct}%').replace('{pct}', String(result.hours_coverage_pct))}</Text>
                    </View>
                </View>

                {/* ── Row 2: Mandatory GPG (Median) — Art. 9 ── */}
                <View style={{ marginTop: 6, marginBottom: 2 }}>
                    <Text style={{ fontSize: 6.5, color: MUTED, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, marginBottom: 4 }}>
                        {L.kpiMandatoryArt9 || 'MANDATORY DISCLOSURES PER ART. 9 EU DIR. 2023/970'}
                    </Text>
                </View>
                <View style={s.kpiRow}>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>{L.kpiUnadjustedMedianArt9 || 'UNADJUSTED PAY GAP (MEDIAN) · ART. 9'}</Text>
                        <Text style={{ ...s.kpiValue, color: gapColor(over.unadjusted_median) }}>
                            {pct(over.unadjusted_median)}
                        </Text>
                        <Text style={s.kpiDesc}>{(L.kpiRawGap || 'Raw pay gap · Mean: {mean}').replace('{mean}', pct(over.unadjusted_mean))}</Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>{L.kpiAdjustedMedianArt9 || 'STRUCTURALLY ADJUSTED (MEDIAN) · ART. 9'}</Text>
                        <Text style={{ ...s.kpiValue, color: gapColor(over.adjusted_median) }}>
                            {pct(over.adjusted_median)}
                        </Text>
                        <Text style={s.kpiDesc}>WIF: {result.wif_factors_used.join(', ')}</Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>{L.kpiAfterExplArt10 || 'AFTER JUSTIFICATIONS (MEDIAN) · ART. 10'}</Text>
                        <Text style={{ ...s.kpiValue, color: explanationAdjustedGap != null ? gapColor(explanationAdjustedGap) : MUTED }}>
                            {explanationAdjustedGap != null ? pct(explanationAdjustedGap) : '—'}
                        </Text>
                        <Text style={s.kpiDesc}>
                            {explanations.filter(e => e.status === 'explained').length > 0
                                ? (L.afterNExplanations || 'After {count} justifications (Art. 18)').replace('{count}', String(explanations.filter(e => e.status === 'explained').length))
                                : (L.noCompletedExplanations || 'No completed justifications')}
                        </Text>
                    </View>
                </View>

                {/* ── Row 3: Means + Variable Pay ── */}
                <View style={s.kpiRow}>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>{L.kpiUnadjustedMean || 'UNADJUSTED (MEAN)'}</Text>
                        <Text style={{ ...s.kpiValue, color: gapColor(over.unadjusted_mean), fontSize: 15 }}>
                            {pct(over.unadjusted_mean)}
                        </Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>{L.kpiAdjustedMean || 'ADJUSTED (MEAN)'}</Text>
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
                                <Text style={s.kpiLabel}>{L.kpiVariablePayArt9 || 'VARIABLE PAY · ART. 9(1)(C)'}</Text>
                                <Text style={{ ...s.kpiValue, fontSize: 15, color: NAVY }}>F {fPct}%</Text>
                                <Text style={{ ...s.kpiValue, fontSize: 15, color: NAVY, marginTop: 1 }}>M {mPct}%</Text>
                                <Text style={s.kpiDesc}>{L.kpiVariablePayDesc || 'Share receiving variable pay by gender'}</Text>
                            </View>
                        )
                    })()}
                </View>

                {/* ── Row 4: Hourly pay medians ── */}
                <View style={s.kpiRow}>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>{L.kpiMedianHourlyFemale || 'MEDIAN HOURLY PAY WOMEN'}</Text>
                        <Text style={{ ...s.kpiValue, color: NAVY, fontSize: 15 }}>
                            {hrFmt(over.female_median_salary, loc)}
                        </Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>{L.kpiMedianHourlyMale || 'MEDIAN HOURLY PAY MEN'}</Text>
                        <Text style={{ ...s.kpiValue, color: NAVY, fontSize: 15 }}>
                            {hrFmt(over.male_median_salary, loc)}
                        </Text>
                    </View>
                    <View style={s.kpiCard}>
                        <Text style={s.kpiLabel}>{L.kpiDifferenceMedian || 'DIFFERENCE (MEDIAN)'}</Text>
                        <Text style={{ ...s.kpiValue, color: gapColor(over.unadjusted_median), fontSize: 15 }}>
                            {hrFmt(over.male_median_salary - over.female_median_salary, loc)}
                        </Text>
                        <Text style={s.kpiDesc}>{L.absoluteDiffHourly || 'Absolute difference EUR/hr'}</Text>
                    </View>
                </View>

                {/* Methodology note */}
                <Text style={s.sectionTitle}>{L.methodologyTitle || 'Methodology'}</Text>
                <View style={s.divider} />
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    {[
                        { label: L.methodBasis || 'Calculation basis', value: L.methodBasisValue || 'Gross hourly earnings (Art. 3 EU 2023/970)' },
                        { label: L.methodWif || 'WIF factors', value: result.wif_factors_used.join(', ') },
                        { label: L.methodFullTime || 'Full-time reference', value: (L.methodFullTimeValue || '{hours}h/week').replace('{hours}', String(result.standard_weekly_hours)) },
                        { label: L.methodHoursCoverage || 'Hours coverage', value: `${result.hours_coverage_pct}%` },
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
            <InnerPage orgName={orgName} reportYear={year} isSample={isSample} labels={L}>
                <Text style={s.sectionTitle}>{L.hrNotesTitle || 'HR Notes'}</Text>
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
            <InnerPage orgName={orgName} reportYear={year} isSample={isSample} labels={L}>
                <Text style={s.sectionTitle}>{L.deptTitle || 'Pay Gaps by Department'}</Text>
                <Text style={s.sectionSubtitle}>
                    {L.deptSubtitlePdf || 'Adjusted pay gap (median) per department · Departments with < 5 employees anonymised'}
                </Text>
                <View style={s.divider} />

                <View style={s.tableHeader}>
                    <Text style={{ ...s.tableHeaderTxt, flex: 2.5 }}>{L.colDepartment || 'Department'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colEmployees || 'Emp.'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colFemale || 'F'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colMale || 'M'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colUnadjusted || 'Unadjusted'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colAdjusted || 'Adjusted'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colAfterExplShort || 'After Justif.'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>&gt; 5%</Text>
                </View>
                {result.by_department.map((d, i) => (
                    <View key={d.department} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? WHITE : '#f8fafc' }}>
                        <Text style={{ ...s.tableCellBold, flex: 2.5 }}>{d.department}</Text>
                        <Text style={{ ...s.tableCellR }}>{d.employee_count}</Text>
                        <Text style={{ ...s.tableCellR }}>{d.suppressed ? '—' : d.gap.female_count}</Text>
                        <Text style={{ ...s.tableCellR }}>{d.suppressed ? '—' : d.gap.male_count}</Text>
                        <Text style={{ ...s.tableCellR, color: d.suppressed ? MUTED : gapColor(d.gap.unadjusted_median) }}>
                            {d.suppressed ? (L.colAnonymised || 'anonymised') : pct(d.gap.unadjusted_median)}
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
                            {d.suppressed ? '—' : d.gap.exceeds_5pct ? (L.yes || 'Yes') : (L.no || 'No')}
                        </Text>
                    </View>
                ))}
            </InnerPage>
            )}

            {/* ── SALARY BANDS & COMPA-RATIO — EU Art. 9 ──── */}
            {show('salaryBands') && bandGrades.length > 0 && (
            <InnerPage orgName={orgName} reportYear={year} isSample={isSample} labels={L}>
                <Text style={s.sectionTitle}>{L.salaryBandsTitle || 'Salary Bands & Compa-Ratio'}</Text>
                <Text style={s.sectionSubtitle}>
                    {L.salaryBandsSubtitle || 'EU Directive 2023/970 Art. 9 — Pay reporting by pay category and gender'}
                </Text>
                <View style={s.divider} />

                {/* KPI summary row */}
                {(() => {
                    const nonCompliant = bandGrades.filter(g => g.exceeds_5pct).length
                    const totalWithData = bandGrades.filter(g => g.internal_n != null && g.internal_n > 0).length
                    const compliant = totalWithData - nonCompliant
                    return (
                        <View style={s.kpiRow}>
                            <View style={s.kpiCard}>
                                <Text style={s.kpiLabel}>{L.kpiGradesTotal || 'PAY GRADES TOTAL'}</Text>
                                <Text style={{ ...s.kpiValue, color: NAVY }}>{bandGrades.length}</Text>
                                <Text style={s.kpiDesc}>{bandGrades[0]?.band_name ?? ''}</Text>
                            </View>
                            <View style={s.kpiCard}>
                                <Text style={s.kpiLabel}>{L.kpiEuCompliant || 'EU-COMPLIANT (< 5%)'}</Text>
                                <Text style={{ ...s.kpiValue, color: compliant === totalWithData ? GREEN : AMBER }}>{compliant}</Text>
                                <Text style={s.kpiDesc}>{L.kpiEuCompliantDesc || 'Intra-grade gap below threshold'}</Text>
                            </View>
                            <View style={s.kpiCard}>
                                <Text style={s.kpiLabel}>{L.kpiActionRequired || 'ACTION REQUIRED (≥ 5%)'}</Text>
                                <Text style={{ ...s.kpiValue, color: nonCompliant > 0 ? RED : GREEN }}>{nonCompliant}</Text>
                                <Text style={s.kpiDesc}>{L.kpiActionRequiredDesc || 'Art. 10 justification obligation'}</Text>
                            </View>
                        </View>
                    )
                })()}

                {/* Art. 9 compliance table */}
                <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 8, marginTop: 4 }}>
                    {L.salaryByCategoryTitle || 'Pay by Category and Gender (Art. 9 EU Dir. 2023/970)'}
                </Text>
                <View style={s.tableHeader}>
                    <Text style={{ ...s.tableHeaderTxt, flex: 1 }}>{L.colGroup || 'Grade'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colN || 'n'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colMedianF || 'Median F.'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colMedianM || 'Median M.'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colIntraGap || 'Intra-gap'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colCompaF || 'Compa F'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colCompaM || 'Compa M'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right', flex: 0.8 }}>{L.colEu || 'EU'}</Text>
                </View>
                {bandGrades.map((g, i) => {
                    const gap    = g.intra_grade_gap_pct
                    const gapStr = gap == null ? '—' : `${gap > 0 ? '+' : ''}${gap.toFixed(1)}%`
                    const gapCol = gap == null ? MUTED : Math.abs(gap) >= 5 ? RED : GREEN
                    const compaF = g.internal_female_median && g.mid_salary && g.mid_salary > 0
                        ? Math.round(g.internal_female_median / g.mid_salary * 100) : null
                    const compaM = g.internal_male_median && g.mid_salary && g.mid_salary > 0
                        ? Math.round(g.internal_male_median  / g.mid_salary * 100) : null
                    const toEur = (v: number | null) => v == null ? '—'
                        : v.toLocaleString(loc, { maximumFractionDigits: 0 }) + ' €'
                    return (
                        <View key={g.id} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? WHITE : SURFACE }}>
                            <Text style={{ ...s.tableCellBold, flex: 1 }}>{g.job_grade}</Text>
                            <Text style={s.tableCellR}>{g.internal_n ?? '—'}</Text>
                            <Text style={{ ...s.tableCellR, color: '#7c3aed' }}>{toEur(g.internal_female_median)}</Text>
                            <Text style={{ ...s.tableCellR, color: BRAND }}>{toEur(g.internal_male_median)}</Text>
                            <Text style={{ ...s.tableCellR, fontFamily: 'Helvetica-Bold', color: gapCol }}>{gapStr}</Text>
                            <Text style={{ ...s.tableCellR, color: compaF != null && compaF < 87 ? RED : TEXT }}>
                                {compaF != null ? `${compaF}%` : '—'}
                            </Text>
                            <Text style={{ ...s.tableCellR, color: compaM != null && compaM < 87 ? RED : TEXT }}>
                                {compaM != null ? `${compaM}%` : '—'}
                            </Text>
                            <Text style={{ ...s.tableCellR, flex: 0.8, fontFamily: 'Helvetica-Bold',
                                color: g.internal_n == null ? MUTED : g.exceeds_5pct ? RED : GREEN }}>
                                {g.internal_n == null ? '—' : g.exceeds_5pct ? (L.euNotCompliant || 'n.c.') : (L.euCompliant || 'ok')}
                            </Text>
                        </View>
                    )
                })}

                <Text style={{ fontSize: 7.5, color: MUTED, marginTop: 14, lineHeight: 1.5 }}>
                    {L.salaryBandsFootnote || 'Per Art. 9 EU Dir. 2023/970, employers with 100+ employees must publish pay information by pay category and gender. An intra-grade gap of 5% or more triggers justification obligations under Art. 10. Compa-Ratio = Median / Band midpoint x 100. All values: gross annual salary in EUR. Source: imported employee data.'}
                </Text>
            </InnerPage>
            )}


            {/* ── PAGE 5+ LOCKED FOR TRIAL ──────────────────── */}
            {isSample ? (
                <LockedPage orgName={orgName} reportYear={year} sampleMode={sampleMode ?? 'trial'} labels={L} />
            ) : (
            <>

            {/* ── GRADE & QUARTILE ───────────────────────────── */}
            {(show('grades') || show('quartiles')) && (
            <InnerPage orgName={orgName} reportYear={year} isSample={isSample} labels={L}>
                {/* Grade breakdown — only show old gap table if no band data exists */}
                {show('grades') && result.by_grade.length > 0 && bandGrades.length === 0 && (
                    <>
                        <Text style={s.sectionTitle}>{L.gradeGapTitle || 'Pay Gaps by Pay Grade'}</Text>
                        <View style={s.divider} />
                        <View style={s.tableHeader}>
                            <Text style={{ ...s.tableHeaderTxt, flex: 2 }}>{L.colGrade || 'Pay Grade'}</Text>
                            <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colEmployees || 'Emp.'}</Text>
                            <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colUnadjusted || 'Unadjusted'}</Text>
                            <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colAdjusted || 'Adjusted'}</Text>
                            <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colAfterExplShort || 'After Justif.'}</Text>
                        </View>
                        {result.by_grade.map((g, i) => (
                            <View key={g.grade} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? WHITE : '#f8fafc' }}>
                                <Text style={{ ...s.tableCellBold, flex: 2 }}>{g.grade}</Text>
                                <Text style={s.tableCellR}>{g.employee_count}</Text>
                                <Text style={{ ...s.tableCellR, color: g.suppressed ? MUTED : gapColor(g.gap.unadjusted_median) }}>
                                    {g.suppressed ? (L.colAnonymised || 'anonymised') : pct(g.gap.unadjusted_median)}
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
                <Text style={{ ...s.sectionTitle, marginTop: 28 }}>{L.quartileTitle || 'Quartile Analysis'}</Text>
                <Text style={s.sectionSubtitle}>{L.quartileSubtitle || 'Gender distribution across the four salary quartiles'}</Text>
                <View style={s.divider} />
                <View style={s.tableHeader}>
                    <Text style={{ ...s.tableHeaderTxt, flex: 2 }}>{L.colQuartile || 'Quartile'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colFemalePct || 'Women %'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colMalePct || 'Men %'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colCount || 'Count'}</Text>
                </View>
                {(['q1', 'q2', 'q3', 'q4'] as const).map((q, i) => {
                    const qData = result.quartiles[q]
                    const qLabels = [L.q1LabelFull || 'Q1 (lowest quartile)', L.q2Label || 'Q2', L.q3Label || 'Q3', L.q4LabelFull || 'Q4 (highest quartile)']
                    return (
                        <View key={q} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? WHITE : '#f8fafc' }}>
                            <Text style={{ ...s.tableCellBold, flex: 2 }}>{qLabels[i]}</Text>
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
                <InnerPage orgName={orgName} reportYear={year} isSample={isSample} labels={L}>
                    <Text style={s.sectionTitle}>{L.explTitle || 'Justifications per EU Art. 10'}</Text>
                    <Text style={s.sectionSubtitle}>
                        {L.explSubtitle || 'Documented individual pay deviations with objective justification grounds'}
                    </Text>
                    <View style={s.divider} />

                    {/* Summary */}
                    <View style={s.kpiRow}>
                        <View style={s.kpiCard}>
                            <Text style={s.kpiLabel}>{L.kpiFlagged || 'TOTAL FLAGGED'}</Text>
                            <Text style={{ ...s.kpiValue, color: NAVY }}>{flaggedEmployees.length}</Text>
                            <Text style={s.kpiDesc}>{L.kpiFlaggedDesc || 'Persons with |gap| >= 5%'}</Text>
                        </View>
                        <View style={s.kpiCard}>
                            <Text style={s.kpiLabel}>{L.kpiExplained || 'EXPLAINED'}</Text>
                            <Text style={{ ...s.kpiValue, color: GREEN }}>{explainedCount}</Text>
                            <Text style={s.kpiDesc}>{L.kpiExplainedDesc || 'Art. 10 documented'}</Text>
                        </View>
                        <View style={s.kpiCard}>
                            <Text style={s.kpiLabel}>{L.kpiOpen || 'OPEN'}</Text>
                            <Text style={{ ...s.kpiValue, color: openCount > 0 ? RED : GREEN }}>{openCount}</Text>
                            <Text style={s.kpiDesc}>{L.kpiOpenDesc || 'No justification yet'}</Text>
                        </View>
                        <View style={s.kpiCard}>
                            <Text style={s.kpiLabel}>{L.kpiDismissed || 'DISMISSED'}</Text>
                            <Text style={{ ...s.kpiValue, color: MUTED }}>{dismissedEmployeeIds.size}</Text>
                            <Text style={s.kpiDesc}>{L.kpiDismissedDesc || 'Justification dismissed'}</Text>
                        </View>
                    </View>

                    {/* Category usage */}
                    <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 8 }}>
                        {L.appliedCategoriesTitle || 'Applied Categories'}
                    </Text>
                    {EXPLANATION_CATEGORIES.map(cat => {
                        const count = explanations.filter(e =>
                            e.categories_json?.some(c => c.key === cat.key)
                        ).length
                        if (count === 0) return null
                        return (
                            <View key={cat.key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                                <Text style={{ fontSize: 9, color: TEXT }}>{cat.label}</Text>
                                <Text style={{ fontSize: 9, color: MUTED }}>{(L.timesAppliedPdf || '{count}x applied · up to {pct}% justifiable').replace('{count}', String(count)).replace('{pct}', String(cat.max_justifiable_pct))}</Text>
                            </View>
                        )
                    })}

                    {/* Per-case detail table — EU Art. 10 */}
                    {explanations.filter(e => e.status === 'explained').length > 0 && (
                        <>
                            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 16, marginBottom: 8 }}>
                                {L.caseOverviewTitle || 'Individual Case Overview (anonymised) — Art. 10'}
                            </Text>
                            <View style={s.tableHeader} fixed>
                                <Text style={{ ...s.tableHeaderTxt, flex: 1.2 }}>{L.colId || 'ID'}</Text>
                                <Text style={{ ...s.tableHeaderTxt, flex: 2.5 }}>{L.colCategoriesPdf || 'Category(ies)'}</Text>
                                <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colClaimed || 'Claimed'}</Text>
                                <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colResidualGap || 'Residual Gap'}</Text>
                                <Text style={{ ...s.tableHeaderTxt, textAlign: 'right' }}>{L.colStatusExpl || 'Status'}</Text>
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
                                            <Text style={{ ...s.tableCellR, fontSize: 8, color: GREEN }}>{L.statusExplainedPdf || 'Explained'}</Text>
                                        </View>
                                    )
                                })}
                        </>
                    )}
                </InnerPage>
            )}

            {/* ── REMEDIATION PLAN SUMMARY — Art. 11 ────────── */}
            {show('remediation') && remediationPlans.length > 0 && (
            <InnerPage orgName={orgName} reportYear={year} isSample={isSample} labels={L}>
                <Text style={s.sectionTitle}>{L.remediationTitle || 'Remediation Plan — Art. 11'}</Text>
                <Text style={s.sectionSubtitle}>
                    {L.remediationSubtitle || 'Documented measures to close pay gaps per EU Dir. 2023/970 Art. 11'}
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
                                <Text style={s.kpiLabel}>{L.kpiActivePlans || 'TOTAL ACTIVE PLANS'}</Text>
                                <Text style={{ ...s.kpiValue, color: NAVY }}>{active}</Text>
                            </View>
                            <View style={s.kpiCard}>
                                <Text style={s.kpiLabel}>{L.kpiCompleted || 'COMPLETED'}</Text>
                                <Text style={{ ...s.kpiValue, color: GREEN }}>{done}</Text>
                            </View>
                            <View style={s.kpiCard}>
                                <Text style={s.kpiLabel}>{L.kpiOpenInProgress || 'OPEN / IN PROGRESS'}</Text>
                                <Text style={{ ...s.kpiValue, color: open > 0 ? AMBER : GREEN }}>{open}</Text>
                            </View>
                        </>)
                    })()}
                </View>

                {/* Action type breakdown */}
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 8 }}>
                    {L.actionTypesTitle || 'Action Types'}
                </Text>
                {Object.entries(ACTION_LABELS).map(([key, label]) => {
                    const count = remediationPlans.filter(p => p.action_type === key).length
                    if (count === 0) return null
                    return (
                        <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                            <Text style={{ fontSize: 9, color: TEXT }}>{label}</Text>
                            <Text style={{ fontSize: 9, color: MUTED }}>{count} {count === 1 ? (L.planSingular || 'plan') : (L.planPlural || 'plans')}</Text>
                        </View>
                    )
                })}

                {/* Horizon breakdown */}
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 16, marginBottom: 8 }}>
                    {L.horizonTitle || 'Time Horizons of Measures'}
                </Text>
                {Object.entries(HORIZON_LABELS).map(([key, label]) => {
                    const count = remediationPlans.flatMap(p => p.plan_steps ?? []).filter(s => s.horizon === key).length
                    if (count === 0) return null
                    return (
                        <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                            <Text style={{ fontSize: 9, color: TEXT }}>{label}</Text>
                            <Text style={{ fontSize: 9, color: MUTED }}>{count} {count === 1 ? (L.stepSingular || 'step') : (L.stepPlural || 'steps')}</Text>
                        </View>
                    )
                })}

                {/* Per-plan detail table — 6 columns: MA-Ref | Horizont | Beschreibung | Gehaltserhöh. | Bonus Ziel | Status */}
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 16, marginBottom: 6 }}>
                    {L.detailOverviewTitle || 'Detailed Measures Overview'}
                </Text>
                <View style={s.tableHeader} fixed>
                    <Text style={{ ...s.tableHeaderTxt, flex: 0.9 }}>{L.colEmployeeRef || 'Emp. Ref.'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, flex: 0.8 }}>{L.colHorizon || 'Horizon'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, flex: 2.8 }}>{L.colDescription || 'Description'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right', flex: 1.2 }}>{L.colSalaryIncrease || 'Salary Incr.'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right', flex: 1.1 }}>{L.colBonusTarget || 'Bonus Target'}</Text>
                    <Text style={{ ...s.tableHeaderTxt, textAlign: 'right', flex: 0.8 }}>{L.colStatus || 'Status'}</Text>
                </View>
                {remediationPlans.flatMap((p, pi) =>
                    (p.plan_steps ?? []).map((step, si) => {
                        const anonId = 'MA-' + p.employee_id.slice(-5).toUpperCase()
                        const horizonLabel = HORIZON_LABELS[step.horizon] ?? step.horizon
                        const stepType = step.action_type ?? p.action_type
                        const isBonus  = stepType === 'bonus_adjustment'
                        const isSalary = stepType === 'salary_increase'
                        const salaryVal = (isSalary && step.target_salary != null)
                            ? `${step.target_salary.toLocaleString(loc)} ${L.perYear || 'EUR/yr'}` : '—'
                        const bonusVal  = (isBonus && step.target_salary != null)
                            ? `${step.target_salary.toLocaleString(loc)} €` : '—'
                        const STATUS_MAP: Record<string, string> = { open: L.statusOpen || 'Open', in_progress: L.statusInProgress || 'In progress', completed: L.statusCompleted || 'Done', dismissed: L.statusDismissed || 'Dism.' }
                        const statusLabel = STATUS_MAP[step.status ?? p.status ?? ''] ?? (step.status ?? p.status ?? '—')
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
                    {L.remediationFootnote || 'Per Art. 11 EU Dir. 2023/970: Employers whose adjusted pay gap exceeds 5% must document joint pay assessments and remediation measures.'}
                </Text>
            </InnerPage>
            )}

            {show('declaration') && (
            <InnerPage orgName={orgName} reportYear={year} labels={L}>
                <Text style={s.sectionTitle}>{L.declarationTitle || 'Legal Declaration'}</Text>
                <Text style={s.sectionSubtitle}>{L.declarationSubtitle || 'Art. 9 EU Directive 2023/970 — Reporting Obligation'}</Text>
                <View style={s.divider} />

                <View style={{ fontSize: 9, color: TEXT, lineHeight: 1.6, gap: 10 }}>
                    <Text style={{ fontSize: 9, color: TEXT, lineHeight: 1.6 }}>
                        {(L.declarationConfirm || '{orgName} confirms that this report has been prepared in accordance with EU Directive 2023/970. The reported data covers {count} employees (data as at {year}).').replace('{orgName}', orgName).replace('{count}', String(result.total_employees)).replace('{year}', String(year))}
                    </Text>
                    <Text style={{ fontSize: 9, color: TEXT, lineHeight: 1.6, marginTop: 8 }}>
                        {L.declarationThreeStage || 'Pay gap (three-stage breakdown per Art. 9 and 10, EU 2023/970):'}{`\n`}
                        · {(L.declarationUnadjusted || 'Unadjusted: {median} (median) / {mean} (mean)').replace('{median}', pct(over.unadjusted_median)).replace('{mean}', pct(over.unadjusted_mean))}{`\n`}
                        · {(L.declarationAdjusted || 'Structurally adjusted (Art. 9, WIF method): {median} (median)').replace('{median}', pct(over.adjusted_median))}{`\n`}
                        · {(L.declarationExplained || 'Explanation-adjusted after individual justification (Art. 10): {value}').replace('{value}', explanationAdjustedGap != null ? pct(explanationAdjustedGap) : (L.declarationNoExplanations || 'No justifications documented'))}
                    </Text>
                    <Text style={{ fontSize: 9, color: TEXT, lineHeight: 1.6, marginTop: 8 }}>
                        {over.exceeds_5pct
                            ? (L.declarationExceeded || 'The adjusted pay gap exceeds the 5% threshold. A joint pay assessment under Art. 9(1)(c) will be initiated. Employee representatives must be involved.')
                            : (L.declarationNotExceeded || 'The adjusted pay gap is within the 5% threshold. No immediate legal action required.')}
                    </Text>
                    <Text style={{ fontSize: 8, color: MUTED, lineHeight: 1.6, marginTop: 8 }}>
                        {L.declarationSanctions || 'Note: Breaches of pay transparency requirements may lead to sanctions under Art. 23, EU Dir. 2023/970, including full compensation for back-pay and non-material damages. The burden of proof lies with the employer.'}
                    </Text>
                </View>


                {/* Signature area */}
                <View style={{ marginTop: 48, flexDirection: 'row', gap: 48 }}>
                    {sigs.map(sig => (
                        <View key={sig} style={{ flex: 1 }}>
                            <View style={{ height: 1, backgroundColor: SLATE2, marginBottom: 6 }} />
                            <Text style={{ fontSize: 8, color: MUTED }}>{sig}</Text>
                            <Text style={{ fontSize: 7, color: '#94a3b8', marginTop: 2 }}>{L.declarationDateSignature || 'Date, Signature'}</Text>
                        </View>
                    ))}
                </View>
            </InnerPage>
            )}

            </>
            )}
        </Document>
    )
}
