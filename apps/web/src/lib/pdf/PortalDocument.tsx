import React from 'react'
import {
    Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'
import type { GradeResult, IndividualFlag } from '@/lib/calculations/types'

// ── Palette ─────────────────────────────────────────────────
const BRAND   = '#1A3E66'
const NAVY    = '#0f172a'
const MUTED   = '#64748b'
const TEXT    = '#1e293b'
const WHITE   = '#ffffff'
const SURFACE = '#f8fafc'
const BORDER  = '#e2e8f0'

function hrFmt(val: number | null | undefined, locale: string): string {
    if (val == null || val === 0) return '—'
    return val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €/h'
}

const s = StyleSheet.create({
    page: {
        fontFamily:      'Helvetica',
        backgroundColor: WHITE,
        paddingBottom:   48,
    },
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
    content: { paddingHorizontal: 40, paddingTop: 28 },
    title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 4 },
    subtitle: { fontSize: 10, color: MUTED, marginBottom: 24 },

    cardBox: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 6,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: BRAND,
    },
    cardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: NAVY },
    cardTag: {
        backgroundColor: '#eff6ff',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        color: BRAND,
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
    },
    employeeId: { fontSize: 10, color: MUTED, marginTop: 4 },

    sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 6, marginTop: 12 },
    infoBox: {
        backgroundColor: SURFACE,
        padding: 10,
        borderRadius: 4,
        marginBottom: 12,
    },
    infoTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: TEXT, marginBottom: 4 },
    infoText: { fontSize: 8, color: MUTED, lineHeight: 1.4 },

    table: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 4,
        marginTop: 8,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: SURFACE,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    tableRowHighlight: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: '#eff6ff',
    },
    col1: { flex: 2, fontSize: 10, color: MUTED },
    col2: { flex: 1, fontSize: 10, color: NAVY, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
    col3: { flex: 1, fontSize: 10, color: NAVY, textAlign: 'right', fontFamily: 'Helvetica-Bold' },

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
    lawRef: { fontSize: 8, color: MUTED, textAlign: 'center', marginTop: 16 },
})

export type PortalLabels = {
    headerBadge: string
    title: string
    subtitle: string
    employeeInfo: string
    objectiveCriteria: string
    cohortLabel: string
    criteriaText: string
    salaryStructure: string
    cohortColumn: string
    mean: string
    median: string
    women: string
    men: string
    yourPay: string
    legalNote: string
    dataBasis: string
    footerLeft: string
    footerRight: string
    filenamePrefix: string
}

export type PortalDocumentProps = {
    orgName: string
    analysis: { name: string, datasets: { reporting_year: number } }
    employee: IndividualFlag
    gradeInfo: GradeResult
    labels: PortalLabels
    locale: string
}

export const PortalDocument = ({ orgName, analysis, employee, gradeInfo, labels: L, locale }: PortalDocumentProps) => {
    const effName = employee.first_name || employee.last_name
        ? `${employee.first_name || ''} ${employee.last_name || ''}`.trim() + ' — '
        : ''

    return (
        <Document>
            <Page size="A4" style={s.page}>
                <View style={s.pageHeader}>
                    <Text style={{ ...s.pageHeaderLogo, fontSize: 14 }}>{orgName}</Text>
                    <Text style={s.pageHeaderRight}>{L.headerBadge}</Text>
                </View>

                <View style={s.content}>
                    <Text style={s.title}>{L.title}</Text>
                    <Text style={s.subtitle}>{L.subtitle}</Text>

                    <View style={s.cardBox}>
                        <View style={s.cardTitleRow}>
                            <View>
                                <Text style={s.cardTitle}>{L.employeeInfo}</Text>
                                <Text style={s.employeeId}>{effName}ID: {employee.employee_id}</Text>
                            </View>
                            <View style={s.cardTag}>
                                <Text>ART. 7 EXPORT</Text>
                            </View>
                        </View>

                        <Text style={s.sectionTitle}>{L.objectiveCriteria}</Text>
                        <View style={s.infoBox}>
                            <Text style={s.infoTitle}>{L.cohortLabel}: {employee.job_grade ?? '—'}</Text>
                            <Text style={s.infoText}>{L.criteriaText}</Text>
                        </View>

                        <Text style={s.sectionTitle}>{L.salaryStructure}</Text>
                        <View style={s.table}>
                            <View style={s.tableHeaderRow}>
                                <Text style={s.col1}>{L.cohortColumn}: {employee.job_grade}</Text>
                                <Text style={{ ...s.col2, color: MUTED, fontFamily: 'Helvetica' }}>{L.mean}</Text>
                                <Text style={{ ...s.col3, color: MUTED, fontFamily: 'Helvetica' }}>{L.median}</Text>
                            </View>
                            <View style={s.tableRow}>
                                <Text style={s.col1}>{L.women}</Text>
                                <Text style={s.col2}>{hrFmt(gradeInfo.gap.female_mean_salary, locale)}</Text>
                                <Text style={s.col3}>{hrFmt(gradeInfo.gap.female_median_salary, locale)}</Text>
                            </View>
                            <View style={s.tableRow}>
                                <Text style={s.col1}>{L.men}</Text>
                                <Text style={s.col2}>{hrFmt(gradeInfo.gap.male_mean_salary, locale)}</Text>
                                <Text style={s.col3}>{hrFmt(gradeInfo.gap.male_median_salary, locale)}</Text>
                            </View>
                            <View style={s.tableRowHighlight}>
                                <Text style={{ ...s.col1, color: NAVY, fontFamily: 'Helvetica-Bold' }}>{L.yourPay}</Text>
                                <Text style={{ flex: 2, fontSize: 10, color: BRAND, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>
                                    {hrFmt(employee.hourly_rate, locale)}
                                </Text>
                            </View>
                        </View>

                        <Text style={s.lawRef}>
                            {L.legalNote}{'\n'}
                            {L.dataBasis}: {analysis.name} ({analysis.datasets?.reporting_year})
                        </Text>
                    </View>
                </View>

                <View style={s.footer} fixed>
                    <Text style={s.footerTxt}>{orgName} · {L.footerLeft}</Text>
                    <Text style={{ ...s.footerTxt, color: '#94a3b8' }}>{L.footerRight}</Text>
                </View>
            </Page>
        </Document>
    )
}
