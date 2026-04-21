'use client'

import { useState } from 'react'
import { ChevronDown, BookOpen } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Section = { id: string; title: string; content: React.ReactNode }

function Accordion({ sections }: { sections: Section[] }) {
    const [open, setOpen] = useState<string | null>(null)
    return (
        <div className="space-y-3">
            {sections.map(s => (
                <div key={s.id} id={`hb-${s.id}`} className="glass-card overflow-hidden">
                    <button
                        onClick={() => setOpen(open === s.id ? null : s.id)}
                        className="w-full text-left px-5 py-4 flex items-center justify-between font-semibold text-sm transition-colors"
                        style={{ color: 'var(--color-pl-text-primary)', background: open === s.id ? 'rgba(59,130,246,0.06)' : 'transparent' }}
                    >
                        <span>{s.title}</span>
                        <ChevronDown size={16} className="transition-transform" style={{ transform: open === s.id ? 'rotate(180deg)' : 'rotate(0)', color: 'var(--color-pl-text-tertiary)' }} />
                    </button>
                    {open === s.id && (
                        <div className="px-5 pb-5 text-xs leading-relaxed space-y-3" style={{ color: 'var(--color-pl-text-secondary)', borderTop: '1px solid var(--color-pl-border)' }}>
                            {s.content}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

const tbl = (headers: string[], rows: string[][]) => (
    <div className="overflow-x-auto mt-2">
        <table className="w-full text-xs border-collapse">
            <thead><tr className="border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                {headers.map(h => <th key={h} className="text-left py-1.5 px-2 font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>{h}</th>)}
            </tr></thead>
            <tbody>{rows.map((r, i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                    {r.map((c, j) => <td key={j} className="py-1.5 px-2" style={{ color: j === 0 ? 'var(--color-pl-text-primary)' : 'var(--color-pl-text-secondary)' }}>{c}</td>)}
                </tr>
            ))}</tbody>
        </table>
    </div>
)

const ul = (items: string[]) => <ul className="list-disc pl-4 space-y-1 mt-2">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>

export default function HandbookContent() {
    const t = useTranslations('help')

    const sections: Section[] = [
        { id: 'p1', title: 'Part 1 — Introduction', content: <>
            <p className="mt-2">CompLens is a pay transparency compliance platform for the EU market. It transforms payroll data into a complete EU Pay Transparency Directive (2023/970) compliance package in minutes.</p>
            {tbl(['Role', 'How CompLens helps'], [
                ['HR Director', 'Full compliance overview, board-ready reports, deadline management'],
                ['C&B Manager', 'Pay gap analysis, salary band design, market benchmarking'],
                ['Compliance Officer', 'Art. 9 reporting, Art. 7 employee rights, audit trail'],
                ['Works Council', 'Read-only access, independent verification (BetrVG §80)'],
                ['CFO / Finance', 'Budget simulation for remediation, cost-of-compliance forecasting'],
            ])}
            {tbl(['Company size', 'First report', 'Frequency'], [
                ['250+ employees', '7 Jun 2027', 'Annually'],
                ['150-249 employees', '7 Jun 2027', 'Every 3 years'],
                ['100-149 employees', '7 Jun 2031', 'Every 3 years'],
            ])}
            <p className="mt-2 font-semibold" style={{ color: 'var(--color-pl-brand-light)' }}>5% threshold (Art. 9): If the adjusted gender pay gap exceeds 5% in any category and cannot be justified, a joint pay assessment with worker reps is required.</p>
        </> },
        { id: 'p2', title: 'Part 2 — Getting Started', content: <>
            {ul(['Register at complens.de — 7-day full trial (10 employees max, MUSTER watermark)', 'Set up organisation: name, country, legal rep, address, VAT ID', 'Invite team: Admin (full) or Viewer (read-only) roles', 'Each user sets preferred language (DE/EN) independently'])}
        </> },
        { id: 'p3', title: 'Part 3 — Data Import', content: <>
            <p className="mt-2">Accepts CSV/Excel from any HR system (SAP, DATEV, Personio, Workday). AI auto-maps columns regardless of language or naming convention.</p>
            {tbl(['Field', 'Required', 'Purpose'], [
                ['Gender', 'Yes', 'Basis of pay gap calculation'],
                ['Base salary', 'Yes', 'Primary compensation figure'],
                ['Employee ID', 'Recommended', 'Year-over-year tracking'],
                ['Department', 'Recommended', 'Department-level gap breakdown'],
                ['Job grade', 'Recommended', 'Grade-level analysis & salary bands'],
                ['Weekly hours', 'Recommended', 'Part-time FTE normalisation'],
                ['Variable pay', 'Optional', 'Total compensation analysis'],
            ])}
            {ul(['Part-time auto-normalised to FTE', 'Both base pay and total comp gaps calculated', 'Datasets are named snapshots — archive or delete anytime'])}
        </> },
        { id: 'p4', title: 'Part 4 — Pay Gap Analysis', content: <>
            <p className="mt-2 font-semibold">Three-tier gap calculation:</p>
            {tbl(['Tier', 'Description'], [
                ['1: Unadjusted (raw)', 'Median/mean salary comparison with no adjustments — Art. 9 headline figure'],
                ['2: Adjusted (WIF)', 'Controls for grade, tenure, hours, education, location, age — determines 5% trigger'],
                ['3: Residual', 'After individual explanations applied — the truly unexplained gap requiring remediation'],
            ])}
            {ul(['Results broken down by department, pay grade, quartile', 'Individual flags for employees >5% from cohort median', 'AI chatbot available on every page for natural-language questions about your data'])}
        </> },
        { id: 'p5', title: 'Part 5 — Salary Bands (Art. 9)', content: <>
            {ul(['Auto-detects grade naming: G-scale, L-scale, TVoeD, TV-L, ERA, Band, Custom', 'One-click band generation from employee data', 'Per-grade stats: Min, P25, Median, P75, Max, female/male medians, headcount', 'Intra-grade gap calculated per grade — grades >5% flagged non-compliant', 'Compa-ratio: Internal median / Band midpoint x 100', 'External market benchmarks: Kienbaum, Radford, StepStone, Mercer, custom', 'Compliance heatmap: green (<5%) / red (>=5%) per grade', 'Box-plot visualisation with gender median markers and market overlay'])}
        </> },
        { id: 'p6', title: 'Part 6 — Job Architecture (Flagship)', content: <>
            <p className="mt-2">Structured job evaluation using a 6-dimension framework satisfying Art. 4 ("objective, gender-neutral criteria").</p>
            <pre className="mt-3 p-3 rounded-lg text-[10px] leading-snug overflow-x-auto" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--color-pl-text-secondary)', fontFamily: 'monospace' }}>{`┌─────────────────────┐     ┌─────────────────────┐
│   SALARY BANDS      │     │   JOB ARCHITECTURE  │
│ "What do we pay?"   │     │ "How is work        │
│  salary_band_grades │     │  organised?"        │
│  + market_data      │     │  leveling_structures│
│  + internal stats   │     │  job_families > jobs │
└────────┬────────────┘     └────────┬────────────┘
         │      ┌──────────────┐     │
         └──────┤ GRADE MAPPING├─────┘
                │ level ←→ grade│
                └──────┬───────┘
                ┌──────┴───────┐
                │EMP. MAPPING  │
                │employee → job│
                └──────────────┘`}</pre>
            {tbl(['Dimension', 'Measures', 'Art. 4 mapping'], [
                ['Problem Solving', 'Complexity, analytical depth, creativity', 'Effort'],
                ['Accountability & Impact', 'Scope of responsibility, financial impact', 'Responsibility'],
                ['People Leadership', 'Team management, coaching, development', 'Responsibility'],
                ['Knowledge & Expertise', 'Domain knowledge, qualifications, experience', 'Skills'],
                ['Communication & Influence', 'Stakeholder interactions, influence scope', 'Skills + Effort'],
                ['Autonomy & Decision Rights', 'Independence level, strategic vs. operational', 'Effort'],
            ])}
            {ul(['3 creation methods: CompLens Standard (L1-L10), AI Assistant, Manual', 'Job families group related roles; each job gets title, description, level, family', 'Competency framework: Core, Leadership, Technical, Functional types', 'Grade Mapping bridges levels to salary grades (many-to-many)', 'JD Upload: AI evaluates PDF/DOCX against your levels with confidence score', 'Headcount mapping: Carry Forward, Auto-Map, or Manual assignment'])}
        </> },
        { id: 'p7', title: 'Part 7 — Explanations & Justifications (Art. 10)', content: <>
            {tbl(['Justification category', 'Example'], [
                ['Seniority / Tenure', '15 years service vs. 6-year cohort median'],
                ['Performance', 'Documented above-average ratings'],
                ['Market rate', 'Recruitment premium for competitive role'],
                ['Qualifications', 'Additional certifications beyond requirements'],
                ['Shift / Working conditions', 'Night shift premium, hazard allowance'],
                ['Collective agreement', 'Tariff-mandated step or premium'],
                ['Grandfathering', 'Legacy salary from pre-merger entity'],
            ])}
            {ul(['Each explanation: category + claimed reduction (capped 25%)', 'Multiple explanations per employee allowed', 'Tier 3 residual gap recalculates automatically', 'If residual gap drops below 5%, joint pay assessment no longer required'])}
        </> },
        { id: 'p8', title: 'Part 8 — Remediation Planning (Art. 11)', content: <>
            {tbl(['Action type', 'Description'], [
                ['Salary increase', 'Direct base salary adjustment'],
                ['Bonus adjustment', 'One-time or recurring variable pay correction'],
                ['Regrading', 'Move employee to a higher pay grade'],
                ['Process change', 'Modify compensation process to prevent future gaps'],
            ])}
            {ul(['Steps with description, time horizon (short/medium/long), deadline, target salary', 'Budget Simulation Dashboard: baseline, incremental cost by horizon, total cost', 'Status lifecycle: Open -> In Progress -> Completed / Dismissed', 'Progress included in PDF/PPT reports for Art. 10/11 evidence'])}
        </> },
        { id: 'p9', title: 'Part 9 — Reports & Exports', content: <>
            <p className="mt-2 font-semibold">PDF Report sections:</p>
            {ul(['Cover page, Executive Summary, HR Notes', 'Department Breakdown (optional), Grades & Quartiles (Art. 9 mandatory)', 'Salary Bands & Compa-Ratio, Explanations (Art. 10), Remediation Plan (Art. 11)', 'Legal Declaration with signature fields'])}
            <p className="mt-2 font-semibold">PowerPoint: 7 slides</p>
            {ul(['Cover, Executive Summary, Grade analysis, Quartile distribution', 'Salary band chart, EU compliance table, Remediation summary'])}
            <p className="mt-2">Trial/expired: MUSTER watermark on all exports; content beyond executive summary locked.</p>
        </> },
        { id: 'p10', title: 'Part 10 — Employee Information Rights (Art. 7)', content: <>
            {ul(['Every worker can request their individual pay level + average pay by gender for their category', 'Employer must respond within 2 months', 'Self-service portal: employee enters ID, sees their pay vs. cohort median', 'Art. 7 Response Letter (PDF) generated automatically with legal basis reference', 'Anonymisation safeguards: categories with too few employees per gender are suppressed'])}
        </> },
        { id: 'p11', title: 'Part 11 — Trend Analysis', content: <>
            {ul(['Select 2+ datasets from different time periods', 'Standard mode: single-metric trend line over time', 'Comparison mode: side-by-side datasets with delta highlighting', 'Department and Grade heatmaps: green (improved) / red (worsened)', 'Delta KPIs: e.g. "Overall gap: -2.3pp (improved)"', 'Art. 10 progress tracking: baseline vs. current dataset after remediation'])}
        </> },
        { id: 'p12', title: 'Part 12 — Settings & Administration', content: <>
            {ul(['Organisation: name, country, legal rep, address, VAT ID', 'Team: invite members (Admin/Viewer), manage seats', 'Subscription: plan status, payment method (card/SEPA/bank transfer), Stripe portal', 'GDPR: EU data residency (Frankfurt), TLS 1.3 + AES-256, auto-generated AVV', 'AI processing: only anonymised data sent to EU-based endpoints', 'Full data deletion anytime; role-based access; complete audit trail'])}
        </> },
        { id: 'p13', title: 'Part 13 — Quick Reference', content: <>
            {tbl(['Directive Article', 'Requirement', 'CompLens Module'], [
                ['Art. 4', 'Objective, gender-neutral pay criteria', 'Job Architecture'],
                ['Art. 7', 'Employee right to pay information', 'Employee Portal'],
                ['Art. 9(1)(a)', 'Gender pay gap (organisation-wide)', 'Pay Gap Analysis'],
                ['Art. 9(1)(b)', 'Median gap by category of workers', 'Pay Gap Analysis'],
                ['Art. 9(1)(c)', 'Quartile pay band distribution', 'Pay Gap Analysis'],
                ['Art. 9', '5% threshold / joint assessment trigger', 'Salary Bands Heatmap'],
                ['Art. 10', 'Objective justification of pay differences', 'Explanations'],
                ['Art. 11', 'Remediation of unjustified gaps', 'Remediation Planner'],
            ])}
            <p className="mt-3 font-semibold">Key terms:</p>
            {tbl(['Term', 'Definition'], [
                ['Adjusted gap', 'Gap after accounting for WIF (grade, tenure, dept)'],
                ['Compa-ratio', 'Internal median / band midpoint x 100'],
                ['Intra-grade gap', 'Gender gap within a single pay grade (Art. 9 key metric)'],
                ['WIF', 'Wage Influencing Factors — objective criteria for adjusted gap'],
                ['FTE', 'Full-time equivalent — normalised salary'],
                ['AVV', 'Auftragsverarbeitungsvertrag — GDPR data processing agreement'],
                ['Joint pay assessment', 'Mandatory review when adjusted gap > 5% (Art. 9)'],
            ])}
        </> },
    ]

    return (
        <div className="space-y-4">
            {/* TOC */}
            <div className="glass-card p-5">
                <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                    <BookOpen size={16} style={{ color: 'var(--color-pl-brand)' }} />
                    {t('handbookTab')}
                </h2>
                <p className="text-xs mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('handbookDesc')}</p>
                <div className="flex flex-wrap gap-1.5">
                    {sections.map((s, i) => (
                        <a key={s.id} href={`#hb-${s.id}`}
                           className="text-[11px] px-2 py-1 rounded-md transition-colors hover:opacity-80"
                           style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--color-pl-brand-light)', border: '1px solid rgba(59,130,246,0.2)' }}
                           onClick={e => { e.preventDefault(); document.getElementById(`hb-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
                            {i + 1}. {s.title.split(' — ')[1]}
                        </a>
                    ))}
                </div>
            </div>
            <Accordion sections={sections} />
        </div>
    )
}
