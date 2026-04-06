/**
 * PayLens — PowerPoint Report Generator
 * Produces a 7-slide PPTX deck from an AnalysisResult.
 * Runs server-side only (Node.js / Next.js API route).
 */

import PptxGenJS from 'pptxgenjs'
import type { AnalysisResult } from '@/lib/calculations/types'
import type { BandGradeSummary } from '@/lib/band/getBandContext'

// ── Brand colours ───────────────────────────────────────────────────────────
const C = {
    bg:         '0d1117',   // deep navy
    surface:    '161b22',   // glass card
    border:     '30363d',
    text:       'f0f6fc',   // primary text
    textSub:    '8b949e',   // secondary
    brand:      '3b82f6',   // blue
    brandLight: '60a5fa',
    green:      '34d399',
    amber:      'f59e0b',
    red:        'ef4444',
    female:     'C5A065',   // gold (accent)
    male:       '1A3E66',   // navy (brand)
    footer:     '21262d',
}

// ── Layout constants (inches, 16:9 @ 10 × 5.63) ─────────────────────────────
const W  = 10
const H  = 5.63
const ML = 0.5    // margin left
const MR = 0.5
const MT = 0.7    // margin top (below header bar)
const CW = W - ML - MR   // content width
const FOOTER_Y = 5.25

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(val: number | null, sign = true): string {
    if (val === null) return '—'
    const v = (val * 100).toFixed(1)
    return sign && Number(v) >= 0 ? `+${v}%` : `${v}%`
}

function gapColor(val: number | null): string {
    if (val === null) return C.textSub
    const abs = Math.abs(val * 100)
    return abs >= 5 ? C.red : abs >= 2 ? C.amber : C.green
}

function hrFmt(val: number | null, locale = 'de'): string {
    if (!val) return '—'
    return val.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €/h'
}

// ── Label type for i18n ─────────────────────────────────────────────────────
type PptLabels = Record<string, string>

// ── Slide builder utilities ───────────────────────────────────────────────────

function addBackground(slide: PptxGenJS.Slide, isSample = false, watermark = 'SAMPLE') {
    slide.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.bg } })
    if (isSample) {
        slide.addText(watermark, {
            x: 0, y: 0, w: W, h: H,
            fontSize: 140, bold: true, color: 'ef4444', transparency: 90,
            align: 'center', valign: 'middle', rotate: 315, fontFace: 'Calibri'
        })
    }
}

function addHeader(slide: PptxGenJS.Slide, title: string, subtitle?: string, orgName = '') {
    // Top accent bar
    slide.addShape('rect', { x: 0, y: 0, w: W, h: 0.48, fill: { color: C.surface } })
    // Client org name (prominent)
    if (orgName) {
        slide.addText(orgName, {
            x: ML, y: 0.08, w: 5, h: 0.3,
            fontSize: 11, bold: true, color: C.text, fontFace: 'Calibri',
        })
    }
    // 'Erstellt mit CompLens' — subtle right side
    slide.addText('CompLens', {
        x: W - 1.5, y: 0.08, w: 1.3, h: 0.3,
        fontSize: 8, color: '4d5562', fontFace: 'Calibri', align: 'right',
    })
    // Slide title
    slide.addText(title, {
        x: ML, y: MT, w: CW, h: 0.45,
        fontSize: 20, bold: true, color: C.text, fontFace: 'Calibri',
    })
    if (subtitle) {
        slide.addText(subtitle, {
            x: ML, y: MT + 0.45, w: CW, h: 0.25,
            fontSize: 11, color: C.textSub, fontFace: 'Calibri',
        })
    }
}

function addFooter(slide: PptxGenJS.Slide, pageNum: number, total: number, orgName = '', L: PptLabels = {}) {
    const directiveLabel = L.pptFooterDirective || 'EU Pay Transparency Directive 2023/970'
    slide.addShape('rect', { x: 0, y: FOOTER_Y, w: W, h: 0.38, fill: { color: C.footer } })
    // Left: org name / directive
    slide.addText(orgName ? `${orgName} · ${directiveLabel}` : directiveLabel, {
        x: ML, y: FOOTER_Y + 0.05, w: 3.8, h: 0.25,
        fontSize: 8, color: C.textSub, fontFace: 'Calibri',
    })
    // Center: CompLens branding
    slide.addText(L.createdWithCompLens || 'Generated with CompLens', {
        x: 3.5, y: FOOTER_Y + 0.05, w: 3.0, h: 0.25,
        fontSize: 7, color: '4d5562', align: 'center', fontFace: 'Calibri',
    })
    // Right: page number
    slide.addText(`${pageNum} / ${total}`, {
        x: W - MR - 0.7, y: FOOTER_Y + 0.05, w: 0.65, h: 0.25,
        fontSize: 8, color: C.textSub, align: 'right', fontFace: 'Calibri',
    })
}

function kpiBox(
    slide: PptxGenJS.Slide,
    x: number, y: number, w: number, h: number,
    label: string, value: string, color: string, sub?: string,
) {
    slide.addShape('rect', { x, y, w, h, fill: { color: C.surface }, line: { color: C.border, width: 0.5 } })
    slide.addText(label.toUpperCase(), {
        x: x + 0.15, y: y + 0.1, w: w - 0.3, h: 0.2,
        fontSize: 7, color: C.textSub, fontFace: 'Calibri', bold: true,
    })
    slide.addText(value, {
        x: x + 0.15, y: y + 0.32, w: w - 0.3, h: 0.42,
        fontSize: 22, color, fontFace: 'Calibri', bold: true,
    })
    if (sub) {
        slide.addText(sub, {
            x: x + 0.15, y: y + 0.76, w: w - 0.3, h: 0.18,
            fontSize: 8, color: C.textSub, fontFace: 'Calibri',
        })
    }
}

// ── Slide 0 — Cover Page ────────────────────────────────────────────────────

function addCoverSlide(pptx: PptxGenJS, r: AnalysisResult, orgName: string, analysisName: string, date: string, total: number, isSample = false, L: PptLabels = {}, locale = 'de') {
    const slide = pptx.addSlide()
    const watermark = L.sampleWatermark || 'SAMPLE'

    // Full-bleed dark navy background
    slide.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.bg } })

    if (isSample) {
        slide.addText(watermark, {
            x: 0, y: 0, w: W, h: H,
            fontSize: 140, bold: true, color: 'ef4444', transparency: 90,
            align: 'center', valign: 'middle', rotate: 315, fontFace: 'Calibri'
        })
    }

    // Left accent bar
    slide.addShape('rect', { x: 0, y: 0, w: 0.06, h: H, fill: { color: C.brand } })

    // Top-left: CLIENT ORG NAME — prominent
    slide.addText(orgName, {
        x: 0.4, y: 0.38, w: 5, h: 0.52,
        fontSize: 22, bold: true, color: C.text, fontFace: 'Calibri', valign: 'middle',
    })
    // tiny CompLens tag top-right
    slide.addText(L.createdWithCompLens || 'Generated with CompLens', {
        x: W - 2.5, y: 0.44, w: 2.2, h: 0.28,
        fontSize: 7.5, color: '4d5562', fontFace: 'Calibri', align: 'right',
    })

    // EU badge top-right
    slide.addShape('rect', {
        x: W - 3.5, y: 0.32, w: 3.0, h: 0.4,
        fill: { color: '0e2146' }, line: { color: C.brand, width: 0.8 }, rectRadius: 0.06,
    })
    slide.addText(L.euBadgeFull || 'EU PAY TRANSPARENCY — ART. 9 DIR. 2023/970', {
        x: W - 3.45, y: 0.34, w: 2.9, h: 0.36,
        fontSize: 7.5, bold: true, color: C.brandLight, fontFace: 'Calibri', align: 'center', valign: 'middle',
    })

    // Horizontal divider under header
    slide.addShape('line', { x: 0.4, y: 1.0, w: CW + ML - 0.1, h: 0, line: { color: C.border, width: 0.5 } })

    // Giant report title
    slide.addText(L.coverReportTitle || 'Pay\nEquity\nReport', {
        x: 0.4, y: 1.15, w: 4.5, h: 2.5,
        fontSize: 36, bold: true, color: C.text, fontFace: 'Calibri', valign: 'top',
    })

    // Right side meta block
    const mx = 5.2
    const metaRows: [string, string, string][] = [
        [L.coverOrganisation || 'Organisation', orgName, C.text],
        [L.coverReportingPeriod || 'Reporting Period', String(r.reporting_year), C.brandLight],
        [L.coverCreated || 'Generated', date, C.textSub],
        [L.coverAnalysis || 'Analysis', analysisName, C.textSub],
    ]
    metaRows.forEach(([label, value, col], i) => {
        const ry = 1.3 + i * 0.72
        slide.addText(label.toUpperCase(), {
            x: mx, y: ry, w: CW - mx + ML, h: 0.2,
            fontSize: 7, bold: true, color: C.textSub, fontFace: 'Calibri',
        })
        slide.addText(value, {
            x: mx, y: ry + 0.2, w: CW - mx + ML, h: 0.42,
            fontSize: 14, bold: true, color: col, fontFace: 'Calibri',
        })
    })

    // Status chip
    const exceeds = r.overall.exceeds_5pct
    slide.addShape('rect', {
        x: mx, y: 4.18, w: 4.2, h: 0.4,
        fill: { color: exceeds ? '2d0b0b' : '0b2d1e' },
        line: { color: exceeds ? C.red : C.green, width: 1 },
        rectRadius: 0.06,
    })
    slide.addText(
        exceeds ? ('⚠  ' + (L.pptCoverExceeded || '5% threshold exceeded (Art. 9(1)(c))'))
                : ('✓  ' + (L.pptCoverBelow || 'Below 5% threshold — no action required')), {
        x: mx + 0.15, y: 4.2, w: 3.9, h: 0.36,
        fontSize: 9.5, bold: true, color: exceeds ? C.red : C.green,
        fontFace: 'Calibri', valign: 'middle',
    })

    // Bottom footer — org name left, 'Erstellt mit CompLens' tiny right
    slide.addShape('rect', { x: 0, y: FOOTER_Y, w: W, h: 0.38, fill: { color: C.footer } })
    slide.addText((L.pptCoverConfidential || '{orgName} · EU Directive 2023/970 · Confidential').replace('{orgName}', orgName), {
        x: ML, y: FOOTER_Y + 0.05, w: CW - 0.5, h: 0.26,
        fontSize: 8, color: C.textSub, fontFace: 'Calibri',
    })
    slide.addText(`1 / ${total}`, {
        x: W - 1, y: FOOTER_Y + 0.05, w: 0.7, h: 0.25,
        fontSize: 8, color: C.textSub, align: 'right', fontFace: 'Calibri',
    })
}

// ── Slide 1 — Executive Summary ──────────────────────────────────────────────

function addSlide1(pptx: PptxGenJS, r: AnalysisResult, orgName: string, date: string, total: number, reportNotes?: string | null, explanationAdjustedGap?: number | null, isSample = false, L: PptLabels = {}, locale = 'de') {
    const slide = pptx.addSlide()
    const watermark = L.sampleWatermark || 'SAMPLE'
    addBackground(slide, isSample, watermark)
    addHeader(slide, L.executiveSummary || 'Executive Summary', (L.pptSummarySubtitle || 'Reporting year {year} · Generated: {date}').replace('{year}', String(r.reporting_year)).replace('{date}', date), orgName)

    const o = r.overall
    const exceeds = o.exceeds_5pct

    // Status banner — compact height
    const bannerColor = exceeds ? C.red : C.green
    const BANNER_Y = 1.58
    const BANNER_H = 0.42
    slide.addShape('rect', {
        x: ML, y: BANNER_Y, w: CW, h: BANNER_H,
        fill: { color: exceeds ? '2d0b0b' : '0b2d1e' },
        line: { color: bannerColor, width: 1.5 },
    })
    slide.addText(exceeds
        ? ('⚠  ' + (L.pptAlertExceeded || 'Joint pay assessment required (Art. 9(1)(c))'))
        : ('✓  ' + (L.pptAlertBelow || 'Pay gap below the 5% threshold — no immediate action required')), {
        x: ML + 0.2, y: BANNER_Y + 0.03, w: CW - 0.4, h: BANNER_H - 0.04,
        fontSize: 11, bold: true, color: bannerColor, fontFace: 'Calibri', valign: 'middle',
    })

    // ── Row 1: 3 main gap KPIs (compact, more room for HR notes) ──
    const mainKw = (CW - 0.2) / 3
    const ky     = BANNER_Y + BANNER_H + 0.12
    const mainKh = 0.70
    const nachBegnVal   = explanationAdjustedGap != null ? pct(explanationAdjustedGap) : '—'
    const nachBegnColor = explanationAdjustedGap != null ? gapColor(explanationAdjustedGap) : C.textSub
    const mainKpis = [
        { label: L.unadjustedMedianKpi || 'Unadjusted (Median)',    value: pct(o.unadjusted_median), color: gapColor(o.unadjusted_median), sub: L.art9Mandatory || 'EU Art. 9 — mandatory disclosure' },
        { label: L.adjustedMedianKpi || 'Adjusted (Median)',       value: pct(o.adjusted_median),   color: gapColor(o.adjusted_median),   sub: `WIF: ${r.wif_factors_used.join(', ')}` },
        { label: L.afterExplMedianKpi || 'After Justifications (Median)', value: nachBegnVal, color: nachBegnColor, sub: L.afterArt10Expl || 'After Art. 10 justifications' },
    ]
    mainKpis.forEach((k, i) => {
        const bx = ML + i * (mainKw + 0.1)
        slide.addShape('rect', { x: bx, y: ky, w: mainKw, h: mainKh, fill: { color: C.surface }, line: { color: C.border, width: 0.5 } })
        slide.addText(k.label.toUpperCase(), { x: bx + 0.12, y: ky + 0.08, w: mainKw - 0.24, h: 0.16, fontSize: 6.5, color: C.textSub, fontFace: 'Calibri', bold: true })
        slide.addText(k.value, { x: bx + 0.12, y: ky + 0.25, w: mainKw - 0.24, h: 0.30, fontSize: 20, color: k.color, fontFace: 'Calibri', bold: true })
        slide.addText(k.sub,   { x: bx + 0.12, y: ky + 0.54, w: mainKw - 0.24, h: 0.14, fontSize: 7,   color: C.textSub, fontFace: 'Calibri', wrap: true })
    })

    // ── Row 2: 4 secondary KPIs (compact) ──
    const secKw  = (CW - 0.3) / 4
    const secKy  = ky + mainKh + 0.08
    const secKh  = 0.56
    // Art. 9(1)(c): proportion receiving variable pay by gender
    const flags   = r.individual_flags
    const fTotal  = flags.filter(f => f.gender === 'female').length
    const mTotal  = flags.filter(f => f.gender === 'male').length
    const fVar    = flags.filter(f => f.gender === 'female' && (f.imported_variable_pay_eur ?? 0) > 0).length
    const mVar    = flags.filter(f => f.gender === 'male'   && (f.imported_variable_pay_eur ?? 0) > 0).length
    const fVarPct = fTotal > 0 ? Math.round(fVar / fTotal * 100) : 0
    const mVarPct = mTotal > 0 ? Math.round(mVar / mTotal * 100) : 0
    const secKpis = [
        { label: L.unadjustedMeanKpi || 'Unadjusted (Mean)', value: pct(o.unadjusted_mean), color: gapColor(o.unadjusted_mean) },
        { label: L.adjustedMeanKpi || 'Adjusted (Mean)',    value: pct(o.adjusted_mean),   color: gapColor(o.adjusted_mean) },
        { label: L.employeesKpi || 'Employees',             value: String(r.total_employees), color: C.brandLight },
        { label: L.variablePayKpi || 'Variable pay share (Art. 9(1)(c))', value: `F ${fVarPct}% / M ${mVarPct}%`, color: C.brandLight },
    ]
    secKpis.forEach((k, i) => {
        const bx = ML + i * (secKw + 0.1)
        slide.addShape('rect', { x: bx, y: secKy, w: secKw, h: secKh, fill: { color: C.surface }, line: { color: C.border, width: 0.5 } })
        slide.addText(k.label.toUpperCase(), { x: bx + 0.10, y: secKy + 0.07, w: secKw - 0.2, h: 0.15, fontSize: 6, color: C.textSub, fontFace: 'Calibri', bold: true, wrap: true })
        slide.addText(k.value, { x: bx + 0.10, y: secKy + 0.24, w: secKw - 0.2, h: 0.26, fontSize: 16, color: k.color, fontFace: 'Calibri', bold: true })
    })
    const kh = secKy + secKh   // end of KPI area

    // Methodology strip — compact
    const stripY = kh + 0.08
    const STRIP_H = 0.40
    slide.addShape('rect', { x: ML, y: stripY, w: CW, h: STRIP_H, fill: { color: C.surface }, line: { color: C.border, width: 0.5 } })
    const metaItems = [
        [L.pptCalcBasis || 'Calculation basis', L.pptCalcBasisValue || 'Gross hourly earnings (Art. 3 EU 2023/970)'],
        [L.methodWif || 'WIF factors', r.wif_factors_used.join(', ')],
        [L.methodFullTime || 'Full-time reference', `${r.standard_weekly_hours} ${L.pptHoursPerWeek || 'hrs/week'}`],
        [L.methodHoursCoverage || 'Hours coverage', `${r.hours_coverage_pct}%`],
    ]
    const mw = CW / 4
    metaItems.forEach(([k, v], i) => {
        slide.addText(k,  { x: ML + i * mw + 0.1, y: stripY + 0.06, w: mw - 0.15, h: 0.16, fontSize: 6.5, color: C.textSub, fontFace: 'Calibri' })
        slide.addText(v!, { x: ML + i * mw + 0.1, y: stripY + 0.22, w: mw - 0.15, h: 0.20, fontSize: 7.5, color: C.text,    fontFace: 'Calibri', bold: true })
    })

    // HR Comments — given all remaining vertical space
    if (typeof reportNotes === 'string' && reportNotes.trim()) {
        const noteY = stripY + STRIP_H + 0.08
        const noteH = 5.18 - noteY           // generous remaining space before footer
        slide.addShape('rect', { x: ML, y: noteY, w: CW, h: noteH, fill: { color: C.surface }, line: { color: C.border, width: 0.5 } })
        slide.addText(L.pptHrComments || 'HR Comments', {
            x: ML + 0.14, y: noteY + 0.07, w: CW - 0.28, h: 0.18,
            fontSize: 7, bold: true, color: C.textSub, fontFace: 'Calibri',
        })
        slide.addText(reportNotes.trim(), {
            x: ML + 0.14, y: noteY + 0.26, w: CW - 0.28, h: noteH - 0.32,
            fontSize: 8, color: C.text, fontFace: 'Calibri', valign: 'top',
            wrap: true,
        })
    }

    addFooter(slide, 2, total, '', L)
}

// ── Slide 2 — Gap Overview ────────────────────────────────────────────────────

function addSlide2(pptx: PptxGenJS, r: AnalysisResult, total: number, explanationAdjustedGap: number | null, isSample = false, L: PptLabels = {}, locale = 'de') {
    const slide = pptx.addSlide()
    addBackground(slide, isSample, L.sampleWatermark || 'SAMPLE')
    addHeader(slide, L.pptGapOverview || 'Pay Gap — Overview', L.pptGapOverviewSub || 'Unadjusted and adjusted · Median & Mean · after justifications')

    const o = r.overall
    const rows = [
        { label: L.unadjustedMedianKpi || 'Unadjusted (Median)',  value: o.unadjusted_median,    valueStr: pct(o.unadjusted_median),    desc: L.pptRawGapNoControl || 'Raw pay difference — no structural controls (Art. 9)' },
        { label: L.unadjustedMeanKpi || 'Unadjusted (Mean)',      value: o.unadjusted_mean,      valueStr: pct(o.unadjusted_mean),      desc: L.pptUnadjustedMeanArt9 || 'Unadjusted mean value (Art. 9)' },
        { label: L.adjustedMedianKpi || 'Adjusted (Median)',       value: o.adjusted_median,      valueStr: pct(o.adjusted_median),      desc: (L.pptAdjustedWif || 'WIF-adjusted: {factors}').replace('{factors}', r.wif_factors_used.join(', ')) },
        { label: L.adjustedMeanKpi || 'Adjusted (Mean)',           value: o.adjusted_mean,        valueStr: pct(o.adjusted_mean),        desc: L.pptAdjustedMeanEu || 'WIF mean (EU Art. 9)' },
        { label: L.pptVariablePayGap || 'Variable pay gap',        value: r.variable_pay_gap_median, valueStr: pct(r.variable_pay_gap_median), desc: L.pptVariablePayGapDesc || 'Median gap of supplementary/variable pay (Art. 9(1)(b))' },
        { label: L.afterExplMedianKpi || 'After Justifications (Median)', value: explanationAdjustedGap, valueStr: explanationAdjustedGap != null ? pct(explanationAdjustedGap) : '—', desc: L.pptAfterExplDesc || 'Adjusted median after individual justifications (Art. 10)', dim: explanationAdjustedGap == null },
    ]

    const barMaxW = CW * 0.38
    const rowH    = 0.50
    const startY  = 1.55

    rows.forEach((row, i) => {
        const y     = startY + i * (rowH + 0.05)
        const color = (row as { dim?: boolean }).dim ? C.textSub : gapColor(row.value)
        const barW  = row.value !== null ? Math.min(Math.abs(row.value * 100) / 10 * barMaxW, barMaxW) : 0

        // Label
        slide.addText(row.label, { x: ML, y, w: 2.4, h: rowH, fontSize: 10, color: (row as { dim?: boolean }).dim ? C.textSub : C.text, fontFace: 'Calibri', bold: true, valign: 'middle' })
        // Bar background
        slide.addShape('rect', { x: ML + 2.55, y: y + 0.15, w: barMaxW, h: 0.32, fill: { color: C.surface }, line: { color: C.border, width: 0.3 } })
        // Bar fill (dashed outline if no explanations yet)
        if (barW > 0.02) {
            slide.addShape('rect', { x: ML + 2.55, y: y + 0.15, w: barW, h: 0.32, fill: { color: (row as { dim?: boolean }).dim ? C.surface : color },
                line: (row as { dim?: boolean }).dim ? { color: C.textSub, width: 0.5, dashType: 'dash' } : { color: 'transparent', width: 0 } })
        }
        // Value
        slide.addText(row.valueStr, { x: ML + 2.55 + barMaxW + 0.1, y, w: 0.9, h: rowH, fontSize: 14, color, fontFace: 'Calibri', bold: true, valign: 'middle' })
        // Description
        slide.addText(row.desc, { x: ML, y: y + 0.38, w: 2.4, h: 0.22, fontSize: 7.5, color: C.textSub, fontFace: 'Calibri' })
    })

    // 5% reference line label
    const refX = ML + 2.55 + barMaxW * 0.5
    slide.addShape('line', { x: refX, y: startY, w: 0, h: rows.length * (rowH + 0.05) - 0.05, line: { color: C.amber, width: 1, dashType: 'dash' } })
    slide.addText(L.pptThreshold5pct || '5% threshold', { x: refX - 0.5, y: startY - 0.22, w: 1.1, h: 0.2, fontSize: 7.5, color: C.amber, fontFace: 'Calibri', align: 'center' })

    addFooter(slide, 3, total, '', L)
}

// ── Slide 3 — Department Drilldown ────────────────────────────────────────────

function addSlide3(pptx: PptxGenJS, r: AnalysisResult, total: number, explClaimedMap: Map<string, number> = new Map(), isSample = false, L: PptLabels = {}, locale = 'de') {
    const slide = pptx.addSlide()
    addBackground(slide, isSample, L.sampleWatermark || 'SAMPLE')
    addHeader(slide, L.pptDeptTitle || 'Departments — Pay Gaps', L.pptDeptSubtitle || 'Adjusted pay gap per department · Departments < 5 emp. anonymised')

    const depts = r.by_department.slice(0, 8)
    const colW  = [2.1, 0.48, 0.50, 0.82, 0.82, 0.80, 0.52]
    const cols  = [L.colDepartment || 'Department', L.colEmployees || 'Emp.', 'F/M', L.unadjustedMedianKpi || 'Unadjusted (Median)', L.adjustedMedianKpi || 'Adjusted (Median)', L.pptAfterExpl || 'After Justification', '> 5%']
    const startY = 1.6
    const rowH   = 0.36

    // Header row
    slide.addShape('rect', { x: ML, y: startY, w: CW, h: rowH, fill: { color: C.surface } })
    let cx = ML + 0.1
    cols.forEach((h, i) => {
        slide.addText(h, { x: cx, y: startY + 0.05, w: colW[i], h: rowH - 0.04, fontSize: 7, color: C.textSub, fontFace: 'Calibri', bold: true, wrap: true })
        cx += colW[i]
    })

    depts.forEach((d, row) => {
        const y = startY + (row + 1) * rowH
        slide.addShape('rect', { x: ML, y, w: CW, h: rowH, fill: { color: row % 2 === 0 ? C.bg : C.surface } })

        // Per-dept Nach Bgr. gap
        let deptNbgStr = '—'
        let deptNbgColor = C.textSub
        if (!d.suppressed) {
            const dFlags = r.individual_flags.filter(f => (f as unknown as Record<string,unknown>)['department'] === d.department && Math.abs(f.gap_vs_cohort_pct) >= 0.05)
            if (dFlags.length > 0) {
                let sumRaw2 = 0, sumRes2 = 0
                for (const f of dFlags) {
                    const rg = Math.abs(f.gap_vs_cohort_pct * 100)
                    const cl = Math.min(explClaimedMap.get(f.employee_id) ?? 0, 25)
                    sumRaw2 += rg; sumRes2 += Math.max(0, rg - cl)
                }
                const adjPct2 = (d.gap.adjusted_median ?? 0) * 100
                const nbgPct2 = sumRaw2 > 0 ? adjPct2 * (sumRes2 / sumRaw2) : adjPct2
                deptNbgStr   = pct(nbgPct2 / 100)
                deptNbgColor = gapColor(nbgPct2 / 100)
            }
        }
        const cells: string[] = [
            d.department,
            String(d.employee_count),
            d.suppressed ? '—' : `${d.gap.female_count}/${d.gap.male_count}`,
            d.suppressed ? (L.pptDeptAnon || 'anon.') : pct(d.gap.unadjusted_median),
            d.suppressed ? '—'     : pct(d.gap.adjusted_median),
            d.suppressed ? '—'     : deptNbgStr,
            d.suppressed ? '—'     : d.gap.exceeds_5pct ? (L.yes || 'Yes') : (L.no || 'No'),
        ]
        const cellColors = [C.text, C.textSub, C.textSub,
            d.suppressed ? C.textSub : gapColor(d.gap.unadjusted_median),
            d.suppressed ? C.textSub : gapColor(d.gap.adjusted_median),
            d.suppressed ? C.textSub : deptNbgColor,
            d.suppressed ? C.textSub : d.gap.exceeds_5pct ? C.red : C.green,
        ]

        let cx2 = ML + 0.1
        cells.forEach((cell, i) => {
            slide.addText(cell, {
                x: cx2, y: y + 0.07, w: colW[i], h: rowH - 0.1,
                fontSize: 8.5, color: cellColors[i], fontFace: 'Calibri',
                bold: i === 0,
            })
            cx2 += colW[i]
        })
    })

    if (r.by_department.length > 8) {
        slide.addText((L.pptDeptMoreDepts || '… and {count} more departments').replace('{count}', String(r.by_department.length - 8)), {
            x: ML, y: startY + 9 * rowH + 0.05, w: CW, h: 0.25,
            fontSize: 8, color: C.textSub, fontFace: 'Calibri', italic: true,
        })
    }

    addFooter(slide, 5, total, '', L)
}

// ── Slide 4 — Quartile Distribution ──────────────────────────────────────────

function addSlide4(pptx: PptxGenJS, r: AnalysisResult, total: number, isSample = false, L: PptLabels = {}) {
    const slide = pptx.addSlide()
    addBackground(slide, isSample, L.sampleWatermark || 'SAMPLE')
    addHeader(slide, L.pptQuartileTitle || 'Quartile Distribution', L.pptQuartileSubtitle || 'Gender distribution across the four pay quartiles (EU Art. 9)')

    const qs = [
        { key: 'q1' as const, label: L.pptQ1 || 'Q1 — Lowest Quartile' },
        { key: 'q2' as const, label: L.q2Label || 'Q2' },
        { key: 'q3' as const, label: L.q3Label || 'Q3' },
        { key: 'q4' as const, label: L.pptQ4 || 'Q4 — Highest Quartile' },
    ]
    const barW   = CW * 0.6
    const startY = 1.6
    const rowGap = 0.82

    qs.forEach(({ key, label }, i) => {
        const q  = r.quartiles[key]
        const y  = startY + i * rowGap
        const fW = barW * (q.female_pct / 100)
        const mW = barW * (q.male_pct   / 100)

        slide.addText(label, { x: ML, y, w: 2.2, h: 0.28, fontSize: 10, bold: true, color: C.text, fontFace: 'Calibri' })
        slide.addText((L.pptPersons || '{count} persons').replace('{count}', String(q.count)), { x: ML, y: y + 0.27, w: 2.2, h: 0.2, fontSize: 8, color: C.textSub, fontFace: 'Calibri' })

        // Bar track
        slide.addShape('rect', { x: ML + 2.3, y: y + 0.05, w: barW, h: 0.38, fill: { color: C.footer } })
        // Female
        if (fW > 0.01) slide.addShape('rect', { x: ML + 2.3, y: y + 0.05, w: fW, h: 0.38, fill: { color: C.female } })
        // Male
        if (mW > 0.01) slide.addShape('rect', { x: ML + 2.3 + fW, y: y + 0.05, w: mW, h: 0.38, fill: { color: C.male } })

        // Labels — stacked vertically to prevent overlap
        const labelX = ML + 2.3 + barW + 0.12
        const barTopY = y + 0.05
        slide.addText(`F ${q.female_pct}%`, {
            x: labelX, y: barTopY, w: 0.85, h: 0.22,
            fontSize: 9.5, color: C.female, fontFace: 'Calibri', bold: true, valign: 'middle',
        })
        slide.addText(`M ${q.male_pct}%`, {
            x: labelX, y: barTopY + 0.22, w: 0.85, h: 0.2,
            fontSize: 9.5, color: C.male, fontFace: 'Calibri', valign: 'middle',
        })
    })

    // Legend
    const ly = startY + 4 * rowGap + 0.1
    slide.addShape('rect', { x: ML, y: ly, w: 0.12, h: 0.12, fill: { color: C.female } })
    slide.addText(L.pptWomen || 'Women', { x: ML + 0.17, y: ly - 0.01, w: 0.8, h: 0.15, fontSize: 8, color: C.textSub, fontFace: 'Calibri' })
    slide.addShape('rect', { x: ML + 1.1, y: ly, w: 0.12, h: 0.12, fill: { color: C.male } })
    slide.addText(L.pptMen || 'Men', { x: ML + 1.27, y: ly - 0.01, w: 0.8, h: 0.15, fontSize: 8, color: C.textSub, fontFace: 'Calibri' })

    addFooter(slide, 6, total, '', L)
}

// ── Slide 4b — Pay Gap per Grade/Level ───────────────────────────────────────

function addGradeSlide(pptx: PptxGenJS, r: AnalysisResult, total: number, explClaimedMap: Map<string, number> = new Map(), isSample = false, L: PptLabels = {}, locale = 'de') {
    const slide = pptx.addSlide()
    addBackground(slide, isSample, L.sampleWatermark || 'SAMPLE')
    addHeader(slide, L.pptGradeTitle || 'Pay Grades — Distribution & Pay Gap',
        L.pptGradeSubtitle || 'Gender distribution and adjusted pay gap per pay grade (EU Art. 9)')

    const grades = r.by_grade.slice(0, 8)

    if (grades.length === 0) {
        slide.addText(L.pptNoGradeData || 'No pay grade data available.', {
            x: ML, y: 2.8, w: CW, h: 0.4,
            fontSize: 13, color: C.textSub, fontFace: 'Calibri', align: 'center',
        })
        addFooter(slide, 4, total, '', L)
        return
    }

    const barW   = CW * 0.46
    const startY = 1.6
    const maxRows = grades.length
    const rowGap  = Math.min(0.82, (FOOTER_Y - startY - 0.4) / Math.max(maxRows, 1))
    const GPG_X   = ML + 2.1 + barW + 0.90   // Ber. (Median) badge x-position
    const NBG_X   = GPG_X + 1.06               // Nach Bgr. badge x-position

    grades.forEach(({ grade, employee_count, suppressed, gap }, i) => {
        const y          = startY + i * rowGap
        const femalePct  = !suppressed && employee_count > 0
            ? Math.round(gap.female_count / employee_count * 100) : 0
        const malePct    = !suppressed && employee_count > 0
            ? Math.round(gap.male_count   / employee_count * 100) : 0
        const fW = barW * (femalePct / 100)
        const mW = barW * (malePct   / 100)

        // Label + count
        slide.addText(grade, {
            x: ML, y, w: 2.0, h: 0.28,
            fontSize: 10, bold: true, color: C.text, fontFace: 'Calibri',
        })
        slide.addText((L.pptPersons || '{count} persons').replace('{count}', String(employee_count)), {
            x: ML, y: y + 0.27, w: 2.0, h: 0.2,
            fontSize: 8, color: C.textSub, fontFace: 'Calibri',
        })

        // Bar track
        slide.addShape('rect', { x: ML + 2.1, y: y + 0.05, w: barW, h: 0.38, fill: { color: C.footer } })

        if (suppressed) {
            slide.addText(L.pptLtFiveAnon || '< 5 emp. — anonymised', {
                x: ML + 2.1 + 0.1, y: y + 0.1, w: barW - 0.2, h: 0.28,
                fontSize: 8.5, color: C.textSub, fontFace: 'Calibri', italic: true, valign: 'middle',
            })
        } else {
            if (fW > 0.01) slide.addShape('rect', {
                x: ML + 2.1, y: y + 0.05, w: fW, h: 0.38, fill: { color: C.female },
            })
            if (mW > 0.01) slide.addShape('rect', {
                x: ML + 2.1 + fW, y: y + 0.05, w: mW, h: 0.38, fill: { color: C.male },
            })
            // Stacked ♀/♂ labels
            const lx       = ML + 2.1 + barW + 0.1
            const barTopY  = y + 0.05
            slide.addText(`F ${femalePct}%`, {
                x: lx, y: barTopY, w: 0.78, h: 0.22,
                fontSize: 9, color: C.female, fontFace: 'Calibri', bold: true, valign: 'middle',
            })
            slide.addText(`M ${malePct}%`, {
                x: lx, y: barTopY + 0.22, w: 0.78, h: 0.2,
                fontSize: 9, color: C.male, fontFace: 'Calibri', valign: 'middle',
            })
        }

        // Ber. (Median) badge
        const gpgVal   = suppressed ? null : gap.adjusted_median
        const gpgColor = gapColor(gpgVal)
        const gpgStr   = suppressed ? '—' : pct(gpgVal)
        const exceeds  = gpgVal !== null && Math.abs(gpgVal * 100) >= 5
        slide.addShape('rect', {
            x: GPG_X, y: y + 0.06, w: 0.98, h: 0.36,
            fill: { color: C.surface },
            line: { color: C.border, width: 0.5 },
        })
        slide.addText(gpgStr, {
            x: GPG_X, y: y + 0.06, w: 0.98, h: 0.36,
            fontSize: 11, bold: true, color: gpgColor, fontFace: 'Calibri', align: 'center', valign: 'middle',
        })

        // Nach Bgr. badge — proportional reduction for flagged in this grade
        const gradeFlags   = r.individual_flags.filter(f => (f as unknown as Record<string, unknown>)['job_grade'] === grade && Math.abs(f.gap_vs_cohort_pct) >= 0.05)
        let nbgStr = '—'
        let nbgColor = C.textSub
        if (!suppressed && gradeFlags.length > 0) {
            let sumRaw = 0, sumRes = 0
            for (const f of gradeFlags) {
                const raw2 = Math.abs(f.gap_vs_cohort_pct * 100)
                const cl   = Math.min(explClaimedMap.get(f.employee_id) ?? 0, 25)
                sumRaw += raw2
                sumRes += Math.max(0, raw2 - cl)
            }
            const adjPct = (gpgVal ?? 0) * 100
            const nbgPct = sumRaw > 0 ? adjPct * (sumRes / sumRaw) : adjPct
            nbgStr   = pct(nbgPct / 100)
            nbgColor = gapColor(nbgPct / 100)
        }
        slide.addShape('rect', { x: NBG_X, y: y + 0.06, w: 0.93, h: 0.36, fill: { color: C.surface }, line: { color: C.border, width: 0.5 } })
        slide.addText(nbgStr, { x: NBG_X, y: y + 0.06, w: 0.93, h: 0.36, fontSize: 10, bold: true, color: nbgColor, fontFace: 'Calibri', align: 'center', valign: 'middle' })
    })

    // Legend
    const ly = startY + maxRows * rowGap + 0.06
    slide.addShape('rect', { x: ML, y: ly, w: 0.12, h: 0.12, fill: { color: C.female } })
    slide.addText(L.pptWomen || 'Women', { x: ML + 0.17, y: ly - 0.01, w: 0.7, h: 0.15, fontSize: 8, color: C.textSub, fontFace: 'Calibri' })
    slide.addShape('rect', { x: ML + 1.0, y: ly, w: 0.12, h: 0.12, fill: { color: C.male } })
    slide.addText(L.pptMen || 'Men', { x: ML + 1.17, y: ly - 0.01, w: 0.7, h: 0.15, fontSize: 8, color: C.textSub, fontFace: 'Calibri' })
    slide.addText(L.pptAdjustedMedian || 'Adjusted (Median)', { x: GPG_X, y: ly - 0.02, w: 0.98, h: 0.22, fontSize: 7, color: C.textSub, fontFace: 'Calibri', align: 'center', wrap: true })
    slide.addText(L.pptAfterExpl || 'After Justification', { x: NBG_X, y: ly - 0.02, w: 0.93, h: 0.22, fontSize: 7, color: C.textSub, fontFace: 'Calibri', align: 'center', wrap: true })

    if (r.by_grade.length > 8) {
        slide.addText((L.pptMoreGrades || '… and {count} more grades').replace('{count}', String(r.by_grade.length - 8)), {
            x: ML, y: ly + 0.18, w: CW, h: 0.2,
            fontSize: 8, color: C.textSub, fontFace: 'Calibri', italic: true,
        })
    }

    addFooter(slide, 4, total, '', L)
}

// ── Slide 5 — Salary Comparison ───────────────────────────────────────────────

function addSlide5(pptx: PptxGenJS, r: AnalysisResult, total: number, isSample = false, L: PptLabels = {}, locale = 'de') {
    const slide = pptx.addSlide()
    addBackground(slide, isSample, L.sampleWatermark || 'SAMPLE')
    addHeader(slide, L.pptSalaryTitle || 'Salary Comparison — Men vs. Women', L.pptSalarySubtitle || 'Median & Mean · Total compensation (EU Art. 3)')

    const o   = r.overall
    const rows = [
        { label: L.pptMedianFemale || 'Median Women', value: hrFmt(o.female_median_salary, locale), color: C.female },
        { label: L.pptMedianMale || 'Median Men',     value: hrFmt(o.male_median_salary, locale),   color: C.male },
        { label: L.pptMeanFemale || 'Mean Women',     value: hrFmt(o.female_mean_salary, locale),   color: C.female },
        { label: L.pptMeanMale || 'Mean Men',         value: hrFmt(o.male_mean_salary, locale),     color: C.male },
    ]
    const maxVal = Math.max(o.female_median_salary ?? 0, o.male_median_salary ?? 0, o.female_mean_salary ?? 0, o.male_mean_salary ?? 0)
    const barMax = CW * 0.5
    const startY = 1.65
    const rowH   = 0.58

    rows.forEach(({ label, value, color }, i) => {
        const raw = [o.female_median_salary, o.male_median_salary, o.female_mean_salary, o.male_mean_salary][i] ?? 0
        const bw  = maxVal > 0 ? (raw / maxVal) * barMax : 0
        const y   = startY + i * (rowH + 0.08)

        slide.addText(label, { x: ML, y, w: 2, h: rowH, fontSize: 10, color: C.text, fontFace: 'Calibri', valign: 'middle' })
        // Track
        slide.addShape('rect', { x: ML + 2.1, y: y + 0.12, w: barMax, h: 0.32, fill: { color: C.surface }, line: { color: C.border, width: 0.3 } })
        // Fill
        if (bw > 0.02) slide.addShape('rect', { x: ML + 2.1, y: y + 0.12, w: bw, h: 0.32, fill: { color } })
        // Value
        slide.addText(value, {
            x: ML + 2.1 + barMax + 0.1, y, w: 1.6, h: rowH,
            fontSize: 12, color, fontFace: 'Calibri', bold: true, valign: 'middle',
        })
    })

    // Note
    slide.addText(L.pptTotalCompNote || 'Total compensation = base salary + variable pay + overtime + benefits in kind — EU Art. 3 Dir. 2023/970', {
        x: ML, y: 4.75, w: CW, h: 0.28,
        fontSize: 7.5, color: C.textSub, fontFace: 'Calibri', italic: true,
    })

    addFooter(slide, 7, total, '', L)
}

// ── Slide 6 — Remediation Priorities ─────────────────────────────────────────

function addSlide6(pptx: PptxGenJS, r: AnalysisResult, total: number, explainedIds: Set<string>, isSample = false, L: PptLabels = {}) {
    const slide = pptx.addSlide()
    addBackground(slide, isSample, L.sampleWatermark || 'SAMPLE')

    // Split by severity correctly
    const underpaid  = r.individual_flags.filter(f => f.severity === 'high' || f.severity === 'medium' || f.severity === 'low')
    const overpaidEmp = r.individual_flags.filter(f => f.severity === 'overpaid')
    const highCount  = underpaid.filter(f => f.severity === 'high').length
    const medLowCount = underpaid.filter(f => f.severity === 'medium' || f.severity === 'low').length

    addHeader(slide,
        L.pptRemediationTitle || 'Action Required — Individual Case Analysis',
        (L.pptRemediationSubtitle || '{underpaid} underpaid · {overpaid} overpaid · Anonymised per GDPR').replace('{underpaid}', String(underpaid.length)).replace('{overpaid}', String(overpaidEmp.length)),
    )

    if (underpaid.length === 0 && overpaidEmp.length === 0) {
        slide.addText(L.pptNoFlags || 'No flagged cases identified. All employees are within the accepted tolerance.', {
            x: ML, y: 2.5, w: CW, h: 0.5, fontSize: 14, color: C.green, fontFace: 'Calibri', bold: true, align: 'center',
        })
        addFooter(slide, 8, total, '', L)
        return
    }

    // 4 KPI boxes: Hoch | Mittel/Niedrig | Überbezahlt | Gesamt Unterbezahlt
    const kw = (CW - 0.3) / 4
    const summaryKpis = [
        { label: L.pptSeverityHigh || 'High',         value: String(highCount),          color: C.red },
        { label: L.pptSeverityMedLow || 'Medium / Low', value: String(medLowCount),      color: C.amber },
        { label: L.pptOverpaid || 'Overpaid',          value: String(overpaidEmp.length), color: C.brandLight },
        { label: L.pptTotalUnderpaid || 'Total Underpaid', value: String(underpaid.length), color: C.text },
    ]
    summaryKpis.forEach((k, i) => {
        kpiBox(slide, ML + i * (kw + 0.1), 1.6, kw, 0.76, k.label, k.value, k.color)
    })

    // Table: show high-severity underpaid first, then medium
    const tableRows = underpaid.slice(0, 6)
    const colW = [1.4, 0.82, 0.82, 1.1, 1.2, 0.6]
    const cols = [L.pptColAnonId || 'ID (anon.)', L.pptColSeverity || 'Severity', L.pptColGender || 'Gender', L.pptColCohortGap || 'Gap (Cohort)', L.pptColStatusExpl || 'Status', L.pptColExplained || 'Explained']
    const tableY = 2.55

    slide.addShape('rect', { x: ML, y: tableY, w: CW, h: 0.3, fill: { color: C.surface } })
    let cx = ML + 0.1
    cols.forEach((h, i) => {
        slide.addText(h, { x: cx, y: tableY + 0.06, w: colW[i], h: 0.2, fontSize: 7.5, color: C.textSub, fontFace: 'Calibri', bold: true })
        cx += colW[i]
    })

    tableRows.forEach((f, row) => {
        const y        = tableY + (row + 1) * 0.32
        const sev      = f.severity
        const sevColor = sev === 'high' ? C.red : sev === 'medium' ? C.amber : C.brand
        const isExplained = explainedIds.has(f.employee_id)
        const cells = [
            'EMP-' + f.employee_id.slice(-6).toUpperCase(),
            sev === 'high' ? (L.pptSevCritical || 'Critical') : sev === 'medium' ? (L.pptSevNonCompliant || 'Non-compliant') : (L.pptSevLow || 'Low'),
            f.gender === 'female' ? 'F' : 'M',
            `${(f.gap_vs_cohort_pct * 100).toFixed(1)}%`,
            isExplained ? (L.statusExplainedPdf || 'Explained') : (L.statusOpen || 'Open'),
            isExplained ? (L.yes || 'Yes') : '—',
        ]
        const cellColors = [C.text, sevColor, C.textSub,
            Math.abs(f.gap_vs_cohort_pct * 100) >= 5 ? C.red : C.amber,
            isExplained ? C.green : C.amber,
            isExplained ? C.green : C.textSub,
        ]

        slide.addShape('rect', { x: ML, y, w: CW, h: 0.3, fill: { color: row % 2 === 0 ? C.bg : C.surface } })
        let cx2 = ML + 0.1
        cells.forEach((cell, i) => {
            slide.addText(cell, { x: cx2, y: y + 0.06, w: colW[i], h: 0.2, fontSize: 8.5, color: cellColors[i], fontFace: 'Calibri' })
            cx2 += colW[i]
        })
    })

    if (underpaid.length > 6) {
        slide.addText((L.pptMoreCases || '… and {count} more cases').replace('{count}', String(underpaid.length - 6)), {
            x: ML, y: tableY + 7 * 0.32 + 0.05, w: CW, h: 0.2,
            fontSize: 8, color: C.textSub, fontFace: 'Calibri', italic: true,
        })
    }

    addFooter(slide, 8, total, '', L)
}

// ── Slide 7 — Methodology Appendix ───────────────────────────────────────────

function addSlide7(pptx: PptxGenJS, r: AnalysisResult, orgName: string, date: string, total: number, isSample = false, L: PptLabels = {}) {
    const slide = pptx.addSlide()
    addBackground(slide, isSample, L.sampleWatermark || 'SAMPLE')
    addHeader(slide, L.pptMethodTitle || 'Methodology & Legal Basis', (L.pptMethodCreated || 'Generated: {date}').replace('{date}', date), orgName)

    const lines = [
        [L.pptMethodCalc || 'Calculation method', L.pptMethodCalcValue || 'Gross hourly earnings per Art. 3 EU Dir. 2023/970. Annual remuneration (total compensation incl. variable pay, overtime, benefits in kind) divided by annualised working hours.'],
        [L.pptMethodWif || 'WIF model (Art. 9)', (L.pptMethodWifValue || 'Adjustment via comparison cells based on Wage Influencing Factors: {factors}. Cells with < 5 persons are anonymised.').replace('{factors}', r.wif_factors_used.join(', '))],
        [L.pptMethodUnadjusted || 'Unadjusted pay gap', L.pptMethodUnadjustedValue || 'Median and arithmetic mean of gross hourly earnings — women vs. men — without structural controls.'],
        [L.pptMethodThreshold || '5% threshold', L.pptMethodThresholdValue || 'Per Art. 9(1)(c): exceeding the adjusted pay gap threshold triggers the obligation for a joint pay assessment.'],
        [L.pptMethodBurden || 'Burden of proof', L.pptMethodBurdenValue || 'Art. 18 EU Dir. 2023/970: In pay discrimination claims, the burden of proof lies with the employer.'],
        [L.pptMethodPrivacy || 'Data protection', L.pptMethodPrivacyValue || 'All individual data pseudonymised. Analysis stored on EU servers (Frankfurt). No personal data in the report.'],
    ]

    const rowH  = 0.54
    const startY = 1.6

    lines.forEach(([k, v], i) => {
        const y = startY + i * (rowH + 0.04)
        slide.addShape('rect', { x: ML, y, w: CW, h: rowH, fill: { color: i % 2 === 0 ? C.surface : C.bg }, line: { color: C.border, width: 0.3 } })
        slide.addText(k, { x: ML + 0.12, y: y + 0.06, w: 1.9, h: rowH - 0.1, fontSize: 9, bold: true, color: C.brandLight, fontFace: 'Calibri', valign: 'top' })
        slide.addText(v, { x: ML + 2.1,  y: y + 0.06, w: CW - 2.2, h: rowH - 0.1, fontSize: 8.5, color: C.text, fontFace: 'Calibri', valign: 'top' })
    })

    addFooter(slide, 9, total, '', L)
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface PptRemPlan {
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

function getActionLabelsPpt(L: PptLabels): Record<string, string> {
    return {
        salary_increase:      L.actionSalaryIncrease || 'Salary Increase',
        job_reclassification: L.actionJobReclassification || 'Job Reclassification',
        promotion:            L.actionPromotion || 'Promotion',
        bonus_adjustment:     L.actionBonusAdjustment || 'Bonus Adjustment',
        review:               L.actionReview || 'Review',
    }
}

function getHorizonLabelsPpt(L: PptLabels): Record<string, string> {
    return {
        '6m':   L.horizon6mFull || '0 – 6 months',
        '1y':   L.horizon1yFull || '6 – 12 months',
        '1.5y': L.horizon15yFull || '12 – 18 months',
        '2-3y': L.horizon2to3yFull || '2 – 3 years',
    }
}

function addMaßnahmenSlide(pptx: PptxGenJS, plans: PptRemPlan[], total: number, isSample = false, L: PptLabels = {}, locale = 'de') {
    const slide = pptx.addSlide()
    addBackground(slide, isSample, L.sampleWatermark || 'SAMPLE')
    addHeader(slide,
        L.pptMassnahmenTitle || 'Remediation Plan — Art. 11',
        (L.pptMassnahmenSubtitle || '{count} plans with {steps} steps documented').replace('{count}', String(plans.length)).replace('{steps}', String(plans.flatMap(p => p.plan_steps ?? []).length)),
    )

    // ── KPI strip ──
    const active = plans.filter(p => p.status !== 'dismissed').length
    const done   = plans.filter(p => p.status === 'completed').length
    const open   = plans.filter(p => p.status === 'open' || p.status === 'in_progress').length
    const kw = (CW - 0.2) / 3
    const ky = 1.62
    const kh = 0.72
    ;[
        { label: L.pptActivePlans || 'Active Plans', value: String(active), color: C.brandLight },
        { label: L.pptDone || 'Completed', value: String(done), color: C.green },
        { label: L.pptOpenInProgress || 'Open / In Progress', value: String(open), color: open > 0 ? C.amber : C.green },
    ].forEach((k, i) => kpiBox(slide, ML + i * (kw + 0.1), ky, kw, kh, k.label, k.value, k.color))

    // ── Detail table header: 6 columns ──
    //  MA-Ref. | Horizont | Beschreibung | Gehaltserhöh. | Bonus Ziel | Status
    const tY = ky + kh + 0.18
    const COLS = [
        { label: L.colEmployeeRef || 'Emp. Ref.',     x: ML,            w: 0.7  },
        { label: L.colHorizon || 'Horizon',            x: ML + 0.72,     w: 0.82 },
        { label: L.colDescription || 'Description',    x: ML + 1.56,     w: 2.7  },
        { label: L.colSalaryIncrease || 'Salary Incr.',x: ML + 4.28,     w: 1.1  },
        { label: L.colBonusTarget || 'Bonus Target',   x: ML + 5.40,     w: 1.0  },
        { label: L.colStatus || 'Status',              x: ML + 6.42,     w: 0.7  },
    ]
    slide.addShape('rect', { x: ML, y: tY, w: CW, h: 0.26, fill: { color: C.surface } })
    COLS.forEach(col => {
        slide.addText(col.label, { x: col.x + 0.04, y: tY + 0.05, w: col.w - 0.08, h: 0.18,
            fontSize: 7, bold: true, color: C.brandLight, fontFace: 'Calibri' })
    })

    // ── Detail rows ──
    const HORIZ_MAP: Record<string, string> = {
        '6m': L.pptHorizon6m || '0–6 mo.', '1y': L.pptHorizon1y || '6–12 mo.', '1.5y': L.pptHorizon15y || '12–18 mo.', '2-3y': L.pptHorizon2to3y || '2–3 yr.',
    }
    const STATUS_LABELS: Record<string, string> = {
        open: L.statusOpen || 'Open', in_progress: L.statusInProgress || 'In progress', completed: L.statusCompleted || 'Done', dismissed: L.statusDismissed || 'Dism.',
    }
    let rowY = tY + 0.28
    const ROW_H = 0.26
    const MAX_ROWS = 11
    let rowCount = 0
    for (const p of plans) {
        const ref = 'MA-' + p.employee_id.slice(-5).toUpperCase()
        for (const step of (p.plan_steps ?? [])) {
            if (rowCount >= MAX_ROWS) break
            const stepType = step.action_type ?? p.action_type
            const isBonus  = stepType === 'bonus_adjustment'
            const isSalary = stepType === 'salary_increase'
            const salaryVal = (isSalary && step.target_salary != null)
                ? `${step.target_salary.toLocaleString(locale)} ${L.perYear || 'EUR/yr'}` : '—'
            const bonusVal  = (isBonus && step.target_salary != null)
                ? `${step.target_salary.toLocaleString(locale)} €`    : '—'
            const statusLabel = STATUS_LABELS[step.status ?? p.status] ?? (step.status ?? p.status ?? '')
            const statusColor = p.status === 'completed' ? C.green : p.status === 'dismissed' ? C.textSub : C.amber

            const bg = rowCount % 2 === 0 ? C.bg : C.surface
            slide.addShape('rect', { x: ML, y: rowY, w: CW, h: ROW_H, fill: { color: bg } })

            const cells: Array<{ x: number; w: number; val: string; bold?: boolean; color?: string }> = [
                { x: ML + 0.04,  w: 0.66, val: ref,                 bold: true },
                { x: ML + 0.72,  w: 0.80, val: HORIZ_MAP[step.horizon] ?? step.horizon },
                { x: ML + 1.56,  w: 2.66, val: step.description || '—' },
                { x: ML + 4.28,  w: 1.06, val: salaryVal, color: isSalary && step.target_salary != null ? C.brandLight : C.textSub },
                { x: ML + 5.40,  w: 0.96, val: bonusVal,  color: isBonus  && step.target_salary != null ? C.green      : C.textSub },
                { x: ML + 6.42,  w: 0.66, val: statusLabel, color: statusColor },
            ]
            cells.forEach(c => {
                slide.addText(c.val, { x: c.x, y: rowY + 0.05, w: c.w, h: 0.18,
                    fontSize: 7.5, bold: !!c.bold, color: c.color ?? C.text, fontFace: 'Calibri' })
            })
            rowY += ROW_H + 0.02
            rowCount++
        }
        if (rowCount >= MAX_ROWS) break
    }
    if (rowCount >= MAX_ROWS && plans.flatMap(p => p.plan_steps ?? []).length > MAX_ROWS) {
        slide.addText(L.pptMoreSteps || '… and more steps (see full PDF report)',
            { x: ML, y: rowY, w: CW, h: 0.2, fontSize: 7, color: C.textSub, fontFace: 'Calibri', italic: true })
    }

    slide.addText(
        L.pptMassnahmenNote || 'Art. 11 EU Dir. 2023/970: Documentation obligation for measures to close pay gaps.',
        { x: ML, y: 5.0, w: CW, h: 0.2, fontSize: 7, color: C.textSub, fontFace: 'Calibri', italic: true }
    )
    addFooter(slide, total - 1, total, '', L)
}

// ── Slide: Salary Bands & Compa-Ratio (EU Art. 9) ────────────────────────────

function addSalaryBandSlide(
    pptx:     PptxGenJS,
    grades:   BandGradeSummary[],
    total:    number,
    slideNum: number,
    isSample = false,
    L: PptLabels = {},
    locale = 'de',
) {
    const slide = pptx.addSlide()
    addBackground(slide, isSample, L.sampleWatermark || 'SAMPLE')
    addHeader(
        slide,
        L.pptBandTitle || 'Salary Bands & Compa-Ratio',
        L.pptBandSubtitle || 'EU Dir. 2023/970 Art. 9 — Pay by pay category and gender',
    )

    const gradesWithData = grades.filter(g => g.internal_n != null && g.internal_n > 0)
    const nonCompliant   = grades.filter(g => g.exceeds_5pct).length
    const compliant      = gradesWithData.length - nonCompliant

    // ── KPI strip ──
    const kw = (CW - 0.2) / 3
    const ky = 1.62
    const kh = 0.72
    ;[
        { label: L.pptBandGrades || 'Pay Grades',        value: String(grades.length),  color: C.brandLight },
        { label: L.pptBandCompliant || 'EU-compliant (< 5%)', value: String(compliant), color: compliant === gradesWithData.length ? C.green : C.amber },
        { label: L.pptBandAction || 'Action required',    value: String(nonCompliant),  color: nonCompliant > 0 ? C.red : C.green },
    ].forEach((k, i) => kpiBox(slide, ML + i * (kw + 0.1), ky, kw, kh, k.label, k.value, k.color))

    // ── Table ──
    const tY   = ky + kh + 0.18
    // Columns span full CW (9.0"): Gruppe 1.3 + n 0.6 + MedF 1.5 + MedM 1.5 + Intra 1.2 + CompaF 0.95 + CompaM 0.95 + EU 0.86 = 9.0
    const COLS = [
        { label: L.colGroup || 'Grade',        x: ML,        w: 1.30 },
        { label: L.colN || 'n',                x: ML + 1.32, w: 0.60 },
        { label: L.colMedianF || 'Median F.',  x: ML + 1.94, w: 1.50 },
        { label: L.colMedianM || 'Median M.',  x: ML + 3.46, w: 1.50 },
        { label: L.colIntraGap || 'Intra-gap', x: ML + 4.98, w: 1.20 },
        { label: L.colCompaF || 'Compa F',     x: ML + 6.20, w: 0.95 },
        { label: L.colCompaM || 'Compa M',     x: ML + 7.17, w: 0.95 },
        { label: L.pptEuArticle9 || 'EU Art. 9', x: ML + 8.14, w: 0.86 },
    ]

    slide.addShape('rect', { x: ML, y: tY, w: CW, h: 0.26, fill: { color: C.surface } })
    COLS.forEach(col => {
        slide.addText(col.label, {
            x: col.x + 0.04, y: tY + 0.05, w: col.w - 0.06, h: 0.18,
            fontSize: 7, bold: true, color: C.brandLight, fontFace: 'Calibri',
        })
    })

    const eur = (v: number | null) =>
        v == null ? '—' : v.toLocaleString(locale, { maximumFractionDigits: 0 }) + ' €'

    const maxRows = 9
    const ROW_H   = 0.28
    grades.slice(0, maxRows).forEach((g, i) => {
        const y      = tY + 0.26 + i * ROW_H
        const gap    = g.intra_grade_gap_pct
        const gapStr = gap == null ? '—' : `${gap > 0 ? '+' : ''}${gap.toFixed(1)}%`
        const gapCol = gap == null ? C.textSub : Math.abs(gap) >= 5 ? C.red : C.green
        const compaF = g.internal_female_median && g.mid_salary && g.mid_salary > 0
            ? Math.round(g.internal_female_median / g.mid_salary * 100) : null
        const compaM = g.internal_male_median && g.mid_salary && g.mid_salary > 0
            ? Math.round(g.internal_male_median  / g.mid_salary * 100) : null
        const euStr  = g.internal_n == null ? '—' : g.exceeds_5pct ? '\u26a0 n.k.' : '\u2713 ok'
        const euCol  = g.internal_n == null ? C.textSub : g.exceeds_5pct ? C.red : C.green

        slide.addShape('rect', { x: ML, y, w: CW, h: ROW_H, fill: { color: i % 2 === 0 ? C.bg : C.surface } })

        const cells: Array<{ x: number; w: number; val: string; color?: string; bold?: boolean }> = [
            { x: COLS[0].x + 0.04, w: COLS[0].w - 0.06, val: g.job_grade, bold: true },
            { x: COLS[1].x + 0.04, w: COLS[1].w - 0.06, val: g.internal_n != null ? String(g.internal_n) : '—', color: C.textSub },
            { x: COLS[2].x + 0.04, w: COLS[2].w - 0.06, val: eur(g.internal_female_median), color: 'C5A065' },
            { x: COLS[3].x + 0.04, w: COLS[3].w - 0.06, val: eur(g.internal_male_median),   color: C.brandLight },
            { x: COLS[4].x + 0.04, w: COLS[4].w - 0.06, val: gapStr, color: gapCol, bold: true },
            { x: COLS[5].x + 0.04, w: COLS[5].w - 0.06, val: compaF != null ? `${compaF}%` : '—', color: compaF != null && compaF < 87 ? C.red : C.text },
            { x: COLS[6].x + 0.04, w: COLS[6].w - 0.06, val: compaM != null ? `${compaM}%` : '—', color: compaM != null && compaM < 87 ? C.red : C.text },
            { x: COLS[7].x + 0.04, w: COLS[7].w - 0.06, val: euStr, color: euCol, bold: true },
        ]
        cells.forEach(c => {
            slide.addText(c.val, {
                x: c.x, y: y + 0.05, w: c.w, h: ROW_H - 0.08,
                fontSize: 8, bold: !!c.bold, color: c.color ?? C.text, fontFace: 'Calibri',
            })
        })
    })

    if (grades.length > maxRows) {
        slide.addText((L.pptMoreGrades || '… and {count} more grades').replace('{count}', String(grades.length - maxRows)), {
            x: ML, y: tY + 0.26 + maxRows * ROW_H + 0.04, w: CW, h: 0.2,
            fontSize: 7.5, color: C.textSub, fontFace: 'Calibri', italic: true,
        })
    }

    slide.addText(
        L.pptBandFootnote || 'Intra-grade gap: Median F. minus Median M. / Median M. Compa-Ratio = Median / band midpoint x 100. >= 5% triggers Art. 10 justification obligation. Source: imported employee data.',
        { x: ML, y: 5.0, w: CW, h: 0.2, fontSize: 6.5, color: C.textSub, fontFace: 'Calibri', italic: true }
    )
    addFooter(slide, slideNum, total, '', L)
}

// ── Slide: Salary Band IQR Chart (Internal Entgeltbänder) ────────────────────

function addSalaryBandChartSlide(
    pptx:     PptxGenJS,
    grades:   BandGradeSummary[],
    total:    number,
    slideNum: number,
    isSample = false,
    L: PptLabels = {},
    locale = 'de',
) {
    const slide = pptx.addSlide()
    addBackground(slide, isSample, L.sampleWatermark || 'SAMPLE')
    addHeader(
        slide,
        L.pptBandChartTitle || 'Internal Salary Bands — Base Salary',
        L.pptBandChartSubtitle || 'Base salary (gross, annual) · Interquartile range (P25–P75) with medians by gender · EU Dir. 2023/970 Art. 9',
    )

    // 'GRUNDGEHALT' badge top-right
    slide.addShape('rect', {
        x: W - MR - 2.1, y: MT + 0.08, w: 1.95, h: 0.28,
        fill: { color: '0e2146' }, line: { color: C.brand, width: 0.8 }, rectRadius: 0.05,
    })
    slide.addText(L.pptBaseSalary || 'BASE SALARY', {
        x: W - MR - 2.1, y: MT + 0.08, w: 1.95, h: 0.28,
        fontSize: 8, bold: true, color: C.brandLight, fontFace: 'Calibri', align: 'center', valign: 'middle',
    })

    const gradesWithData = grades.filter(g => g.internal_n != null && g.internal_p25_base != null && g.internal_p75_base != null)
    if (gradesWithData.length === 0) {
        slide.addText(L.pptNoBandData || 'No band data available.', {
            x: ML, y: 2.8, w: CW, h: 0.4,
            fontSize: 13, color: C.textSub, fontFace: 'Calibri', align: 'center',
        })
        addFooter(slide, slideNum, total, '', L)
        return
    }

    // Determine global min/max across all grades for consistent scale
    const allMins = gradesWithData.map(g => g.internal_min_base ?? g.internal_p25_base ?? 0)
    const allMaxs = gradesWithData.map(g => g.internal_max_base ?? g.internal_p75_base ?? 0)
    const globalMin = Math.min(...allMins) * 0.92
    const globalMax = Math.max(...allMaxs) * 1.05
    const range = globalMax - globalMin || 1

    const LABEL_W = 0.7    // grade label column width
    const N_W     = 0.4    // n column width
    const GAP_W   = 0.65   // gap % column width (right)
    const BAR_X   = ML + LABEL_W + N_W + 0.08
    const BAR_W   = CW - LABEL_W - N_W - GAP_W - 0.18

    const startY  = 1.62
    const maxRows = Math.min(gradesWithData.length, 9)
    const rowH    = Math.min(0.56, (FOOTER_Y - startY - 0.35) / maxRows)

    function xpos(val: number): number {
        return BAR_X + ((val - globalMin) / range) * BAR_W
    }

    // Column headers
    slide.addText(L.pptColGrade || 'Grade', { x: ML,  y: startY - 0.22, w: LABEL_W, h: 0.18, fontSize: 7, bold: true, color: C.textSub, fontFace: 'Calibri' })
    slide.addText(L.colN || 'n',        { x: ML + LABEL_W, y: startY - 0.22, w: N_W,  h: 0.18, fontSize: 7, bold: true, color: C.textSub, fontFace: 'Calibri' })
    slide.addText(L.pptColIqr || 'P25–P75 Interquartile Range (IQR)',
                            { x: BAR_X, y: startY - 0.22, w: BAR_W, h: 0.18, fontSize: 7, bold: true, color: C.textSub, fontFace: 'Calibri', align: 'center' })
    slide.addText(L.pptColGapFM || 'Gap F/M', { x: BAR_X + BAR_W + 0.06, y: startY - 0.22, w: GAP_W, h: 0.18, fontSize: 7, bold: true, color: C.textSub, fontFace: 'Calibri', align: 'right' })

    gradesWithData.slice(0, maxRows).forEach((g, i) => {
        const y   = startY + i * rowH
        const barY = y + rowH * 0.28
        const barH = rowH * 0.44

        const p25     = g.internal_p25_base!
        const p75     = g.internal_p75_base!
        const medAll  = g.internal_median_base
        const medF    = g.internal_female_median
        const medM    = g.internal_male_median
        const gap     = g.intra_grade_gap_pct
        const gapStr  = gap == null ? '—' : `${gap > 0 ? '+' : ''}${gap.toFixed(1)}%`
        const gapCol  = gap == null ? C.textSub : Math.abs(gap) >= 5 ? C.red : C.green

        // IQR track background (full bar range for context)
        slide.addShape('rect', {
            x: BAR_X, y: barY, w: BAR_W, h: barH,
            fill: { color: C.footer }, line: { color: C.border, width: 0.3 },
        })

        // IQR fill (P25→P75) — blue tinted
        const iqrX = xpos(p25)
        const iqrW = xpos(p75) - iqrX
        if (iqrW > 0.01) {
            slide.addShape('rect', {
                x: iqrX, y: barY, w: iqrW, h: barH,
                fill: { color: '1e3a5f' }, line: { color: '3b82f6', width: 0.5 },
            })
        }

        // Overall median line (bright blue)
        if (medAll != null) {
            const mx = xpos(medAll)
            slide.addShape('line', { x: mx, y: barY - 0.03, w: 0, h: barH + 0.06, line: { color: C.brand, width: 1.5 } })
        }

        // Female median marker (gold diamond) - rendered as a small rotated square
        if (medF != null) {
            const fx = xpos(medF)
            slide.addShape('rect', {
                x: fx - 0.07, y: barY + barH * 0.5 - 0.07, w: 0.14, h: 0.14,
                fill: { color: C.female }, line: { color: 'transparent', width: 0 }, rotate: 45,
            })
        }

        // Male median marker (blue dot)
        if (medM != null) {
            const mmx = xpos(medM)
            slide.addShape('ellipse', {
                x: mmx - 0.07, y: barY + barH * 0.5 - 0.07, w: 0.14, h: 0.14,
                fill: { color: C.brandLight }, line: { color: 'transparent', width: 0 },
            })
        }

        // EUR figures below each bar: P25 at far-left · Median centered on track · P75 at far-right
        // Anchored to BAR_X/BAR_W (fixed track bounds), NOT iqrX/iqrW, to prevent clustering
        const lblY    = barY + barH + 0.02   // just below the bar
        const lblH    = 0.13
        const lblSize = 5.5
        slide.addText(
            p25.toLocaleString(locale, { maximumFractionDigits: 0 }) + ' \u20ac',
            { x: BAR_X, y: lblY, w: 0.9, h: lblH, fontSize: lblSize, color: C.textSub, fontFace: 'Calibri', align: 'left' }
        )
        if (medAll != null) {
            slide.addText(
                'Med. ' + medAll.toLocaleString(locale, { maximumFractionDigits: 0 }) + ' \u20ac',
                { x: BAR_X + BAR_W * 0.5 - 0.6, y: lblY, w: 1.2, h: lblH, fontSize: lblSize, color: C.brandLight, fontFace: 'Calibri', align: 'center' }
            )
        }
        slide.addText(
            p75.toLocaleString(locale, { maximumFractionDigits: 0 }) + ' \u20ac',
            { x: BAR_X + BAR_W - 0.9, y: lblY, w: 0.9, h: lblH, fontSize: lblSize, color: C.textSub, fontFace: 'Calibri', align: 'right' }
        )

        // Grade label + n
        slide.addText(g.job_grade, {
            x: ML, y: y + rowH * 0.25, w: LABEL_W - 0.04, h: rowH * 0.5,
            fontSize: 9, bold: true, color: C.text, fontFace: 'Calibri', valign: 'middle',
        })
        slide.addText(g.internal_n != null ? String(g.internal_n) + ' MA' : '—', {
            x: ML + LABEL_W, y: y + rowH * 0.25, w: N_W - 0.04, h: rowH * 0.5,
            fontSize: 7.5, color: C.textSub, fontFace: 'Calibri', valign: 'middle',
        })

        // Gap % badge right
        slide.addText(gapStr, {
            x: BAR_X + BAR_W + 0.06, y: y + rowH * 0.25, w: GAP_W - 0.04, h: rowH * 0.5,
            fontSize: 10, bold: true, color: gapCol, fontFace: 'Calibri', valign: 'middle', align: 'right',
        })
    })

    // Legend
    const ly = startY + maxRows * rowH + 0.06
    slide.addShape('rect',    { x: ML,        y: ly + 0.01, w: 0.25, h: 0.09, fill: { color: '1e3a5f' }, line: { color: '3b82f6', width: 0.5 } })
    slide.addText(L.pptIqr || 'IQR (P25–P75)', { x: ML + 0.28, y: ly - 0.02, w: 1.0, h: 0.16, fontSize: 7, color: C.textSub, fontFace: 'Calibri' })
    slide.addShape('line',    { x: ML + 1.35, y: ly + 0.055, w: 0, h: 0.10, line: { color: C.brand, width: 1.5 } })
    slide.addText(L.pptOverallMedian || 'Overall Median', { x: ML + 1.42, y: ly - 0.02, w: 1.0, h: 0.16, fontSize: 7, color: C.textSub, fontFace: 'Calibri' })
    slide.addShape('rect',    { x: ML + 2.53, y: ly, w: 0.11, h: 0.11, fill: { color: C.female }, line: { color: 'transparent', width: 0 }, rotate: 45 })
    slide.addText('Median F.', { x: ML + 2.72, y: ly - 0.02, w: 0.8, h: 0.16, fontSize: 7, color: C.female, fontFace: 'Calibri' })
    slide.addShape('ellipse', { x: ML + 3.58, y: ly, w: 0.11, h: 0.11, fill: { color: C.brandLight }, line: { color: 'transparent', width: 0 } })
    slide.addText('Median M.', { x: ML + 3.74, y: ly - 0.02, w: 0.8, h: 0.16, fontSize: 7, color: C.brandLight, fontFace: 'Calibri' })

    slide.addText(
        L.pptBandChartFootnote || 'All salary values in EUR (gross, annual). IQR = interquartile range P25–P75. Grades with fewer than 5 employees are not shown. Source: imported employee data.',
        { x: ML, y: 5.0, w: CW, h: 0.2, fontSize: 6.5, color: C.textSub, fontFace: 'Calibri', italic: true }
    )
    addFooter(slide, slideNum, total, '', L)
}

export interface PptOptions {
    orgName:                 string
    analysisName:            string
    analysisDate:            string   // ISO string
    locale?:                 string
    labels?:                 PptLabels
    reportNotes?:            string | null
    plans?:                  PptRemPlan[]
    explanationAdjustedGap?: number | null
    explainedEmployeeIds?:   Set<string>
    explClaimedMap?:         Map<string, number>   // employee_id → total claimed reduction %
    isSample?:               boolean
    sampleMode?:             'trial' | 'expired' | null
    bandGrades?:             BandGradeSummary[]   // EU Art. 9 salary band data (optional)
}

// ── Locked upgrade slide (trial/expired) ─────────────────────────────

function addLockedSlide(pptx: PptxGenJS, slideNum: number, total: number, sampleMode: 'trial' | 'expired' = 'trial', L: PptLabels = {}) {
    const slide = pptx.addSlide()
    const watermark = L.sampleWatermark || 'SAMPLE'

    // Dark background
    slide.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.bg } })

    // Watermark (high opacity — on top of everything)
    slide.addText(watermark, {
        x: 0, y: 0, w: W, h: H,
        fontSize: 140, bold: true, color: 'dc2626', transparency: 40,
        align: 'center', valign: 'middle', rotate: 315, fontFace: 'Calibri',
    })

    // Lock icon
    slide.addText('🔒', {
        x: W / 2 - 0.5, y: 1.4, w: 1, h: 0.8,
        fontSize: 38, align: 'center', fontFace: 'Segoe UI Emoji',
    })

    // Headline
    const headline = sampleMode === 'expired'
        ? (L.pptLockedExpiredTitle || 'Trial period expired')
        : (L.pptLockedTrialTitle || 'Presentation restricted in trial mode')
    slide.addText(headline, {
        x: 1.5, y: 2.25, w: W - 3, h: 0.55,
        fontSize: 22, bold: true, color: C.text, fontFace: 'Calibri', align: 'center',
    })

    // Sub-text
    const body = sampleMode === 'expired'
        ? (L.pptLockedExpiredBody || 'Your trial period has ended. This and all subsequent slides are locked.\nLicence CompLens to download the full presentation.')
        : (L.pptLockedTrialBody || 'This and all subsequent slides are locked in trial mode.\nLicence CompLens to download the full presentation.')
    slide.addText(body, {
        x: 1.5, y: 2.88, w: W - 3, h: 0.7,
        fontSize: 11, color: C.textSub, fontFace: 'Calibri', align: 'center',
    })

    // CTA button
    slide.addShape('rect', {
        x: W / 2 - 1.5, y: 3.72, w: 3.0, h: 0.44,
        fill: { color: C.brand }, rectRadius: 0.06,
        line: { color: 'transparent', width: 0 },
    })
    slide.addText(L.pptLockedCta || 'Upgrade now — Unlock the full report at complens.de', {
        x: W / 2 - 1.5, y: 3.72, w: 3.0, h: 0.44,
        fontSize: 11, bold: true, color: 'ffffff', fontFace: 'Calibri', align: 'center', valign: 'middle',
    })

    addFooter(slide, slideNum, total, '', L)
}

export async function generateReportPptx(
    results: AnalysisResult,
    opts:    PptOptions,
): Promise<Uint8Array> {
    const pptx = new PptxGenJS()
    pptx.layout  = 'LAYOUT_16x9'
    pptx.author  = 'CompLens'
    pptx.company = 'CompLens'
    const L            = opts.labels ?? {} as PptLabels
    const pptLocale    = opts.locale ?? 'de'
    pptx.subject = (L.pptSubject || '{orgName} – Pay equity report {year} (EU Directive 2023/970)').replace('{orgName}', opts.orgName).replace('{year}', String(results.reporting_year))
    pptx.title   = opts.analysisName

    const date          = new Date(opts.analysisDate).toLocaleDateString(pptLocale, { day: '2-digit', month: 'long', year: 'numeric' })
    const hasMaßnahmen  = (opts.plans ?? []).length > 0
    const hasBandSlide   = (opts.bandGrades ?? []).length > 0
    const isSample       = !!opts.isSample
    // 8 base slides + 1 if Maßnahmen + 2 if Bands (chart + table) (dept slide removed — not EU mandatory)
    const total = 8 + (hasMaßnahmen ? 1 : 0) + (hasBandSlide ? 2 : 0)

    // Slide 1 — Cover (always shown)
    addCoverSlide(pptx, results, opts.orgName, opts.analysisName, date, total, isSample as any, L, pptLocale)
    // Slide 2 — Executive Summary (always shown)
    addSlide1(pptx, results, opts.orgName, date, total, opts.reportNotes, opts.explanationAdjustedGap, isSample, L, pptLocale)

    if (isSample) {
        // Trial/expired: from slide 3 onwards — single locked upgrade slide
        addLockedSlide(pptx, 3, total, opts.sampleMode ?? 'trial', L)
    } else {
        let currentSlide = 3
        // Slide 3 — Gap Overview (always)
        addSlide2(pptx, results, total, opts.explanationAdjustedGap ?? null, isSample, L, pptLocale)
        currentSlide++
        // Slides 4+5 — Salary bands: IQR chart + Compa-Ratio table (EU Art. 9, if available)
        if (hasBandSlide) {
            addSalaryBandChartSlide(pptx, opts.bandGrades!, total, currentSlide, isSample, L, pptLocale)
            currentSlide++
            addSalaryBandSlide(pptx, opts.bandGrades!, total, currentSlide, isSample, L, pptLocale)
            currentSlide++
        }
        // Slide 5 — Grade distribution (gender bars + WIF gap)
        addGradeSlide(pptx, results, total, opts.explClaimedMap ?? new Map(), isSample, L, pptLocale)
        currentSlide++
        // Slide 6 — Quartile distribution (EU Art. 9)
        addSlide4(pptx, results, total, isSample, L)
        currentSlide++
        // Slide 7 — Salary comparison (hourly rates)
        addSlide5(pptx, results, total, isSample, L, pptLocale)
        currentSlide++
        // Slide 8 — Individual remediation overview
        addSlide6(pptx, results, total, opts.explainedEmployeeIds ?? new Set(), isSample, L)
        currentSlide++
        // Optional: Remediation plan
        if (hasMaßnahmen) {
            addMaßnahmenSlide(pptx, opts.plans!, total, isSample, L, pptLocale)
            currentSlide++
        }
        addSlide7(pptx, results, opts.orgName, date, total, isSample, L)
    }

    const nodeBuf = await pptx.write({ outputType: 'nodebuffer' }) as unknown as Buffer
    return new Uint8Array(nodeBuf.buffer, nodeBuf.byteOffset, nodeBuf.byteLength)
}
