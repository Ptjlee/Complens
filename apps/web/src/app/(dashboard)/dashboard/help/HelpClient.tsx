'use client'

import { useState } from 'react'
import {
    PlayCircle, Upload, BarChart3, FileText, MessageSquare, Users,
    ShieldCheck, Settings, TrendingUp, ChevronDown, ChevronRight,
    AlertTriangle, CheckCircle2, Info, Mail, Download, Search,
    BookOpen, Lightbulb, Zap, Globe, Layers, ExternalLink, Network,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'

const SupportTicketModal = dynamic(() => import('@/components/support/SupportTicketModal'), { ssr: false })

// ─── Types ───────────────────────────────────────────────────────────────────
type FaqItem = { q: string; a: string }
type GuideStep = { step: number; title: string; body: string; tip?: string }
type Module = {
    id: string
    icon: React.ReactNode
    color: string
    title: string
    subtitle: string
    steps: GuideStep[]
    faqs: FaqItem[]
}

// ─── FAQ Accordion ───────────────────────────────────────────────────────────
function FaqAccordion({ items }: { items: FaqItem[] }) {
    const [open, setOpen] = useState<number | null>(null)
    return (
        <div className="space-y-2 mt-4">
            {items.map((item, i) => (
                <div key={i} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-pl-border)' }}>
                    <button
                        onClick={() => setOpen(open === i ? null : i)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between text-sm font-medium transition-colors"
                        style={{
                            background: open === i ? 'rgba(59,130,246,0.06)' : 'transparent',
                            color: 'var(--color-pl-text-primary)',
                        }}
                    >
                        <span className="flex items-center gap-2">
                            <Info size={14} style={{ color: 'var(--color-pl-brand)', flexShrink: 0 }} />
                            {item.q}
                        </span>
                        {open === i ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {open === i && (
                        <div className="px-4 pb-4 pt-2 text-sm leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)', borderTop: '1px solid var(--color-pl-border)' }}>
                            {item.a}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Step Card ───────────────────────────────────────────────────────────────
function StepCard({ step, color }: { step: GuideStep; color: string }) {
    return (
        <div className="flex gap-4 p-4 rounded-xl" style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: color }}>
                {step.step}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>{step.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>{step.body}</p>
                {step.tip && (
                    <div className="mt-2 flex items-start gap-1.5 px-2.5 py-1.5 rounded-md" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <Lightbulb size={12} style={{ color: '#818cf8', flexShrink: 0, marginTop: 1 }} />
                        <p className="text-xs" style={{ color: '#a5b4fc' }}>{step.tip}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Module Panel ─────────────────────────────────────────────────────────────
function ModulePanel({ module, guideLabel, faqLabel }: { module: Module; guideLabel: string; faqLabel: string }) {
    const [tab, setTab] = useState<'guide' | 'faq'>('guide')
    return (
        <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="p-5 flex items-center gap-4" style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: module.color }}>
                    {module.icon}
                </div>
                <div>
                    <h2 className="text-base font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{module.title}</h2>
                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{module.subtitle}</p>
                </div>
                <div className="ml-auto flex gap-1 p-0.5 rounded-lg" style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>
                    {(['guide', 'faq'] as const).map(tabKey => (
                        <button key={tabKey} onClick={() => setTab(tabKey)}
                            className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                            style={{
                                background: tab === tabKey ? 'var(--color-pl-brand)' : 'transparent',
                                color: tab === tabKey ? '#fff' : 'var(--color-pl-text-tertiary)',
                            }}>
                            {tabKey === 'guide' ? guideLabel : faqLabel}
                        </button>
                    ))}
                </div>
            </div>
            {/* Body */}
            <div className="p-5">
                {tab === 'guide' ? (
                    <div className="space-y-3">
                        {module.steps.map(s => <StepCard key={s.step} step={s} color={module.color} />)}
                    </div>
                ) : (
                    <FaqAccordion items={module.faqs} />
                )}
            </div>
        </div>
    )
}

// ─── Data builder (from translations) ───────────────────────────────────────
function buildModules(t: (key: string) => string): Module[] {
    return [
        {
            id: 'start',
            icon: <PlayCircle size={20} />,
            color: 'linear-gradient(135deg,#1A3E66,#3b82f6)',
            title: t('start.title'),
            subtitle: t('start.subtitle'),
            steps: [
                { step: 1, title: t('start.step1Title'), body: t('start.step1Body'), tip: t('start.step1Tip') },
                { step: 2, title: t('start.step2Title'), body: t('start.step2Body'), tip: t('start.step2Tip') },
                { step: 3, title: t('start.step3Title'), body: t('start.step3Body') },
                { step: 4, title: t('start.step4Title'), body: t('start.step4Body'), tip: t('start.step4Tip') },
            ],
            faqs: [
                { q: t('start.faq1Q'), a: t('start.faq1A') },
                { q: t('start.faq2Q'), a: t('start.faq2A') },
                { q: t('start.faq3Q'), a: t('start.faq3A') },
                { q: t('start.faq4Q'), a: t('start.faq4A') },
            ],
        },
        {
            id: 'import',
            icon: <Upload size={20} />,
            color: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
            title: t('import.title'),
            subtitle: t('import.subtitle'),
            steps: [
                { step: 1, title: t('import.step1Title'), body: t('import.step1Body'), tip: t('import.step1Tip') },
                { step: 2, title: t('import.step2Title'), body: t('import.step2Body') },
                { step: 3, title: t('import.step3Title'), body: t('import.step3Body'), tip: t('import.step3Tip') },
                { step: 4, title: t('import.step4Title'), body: t('import.step4Body') },
                { step: 5, title: t('import.step5Title'), body: t('import.step5Body'), tip: t('import.step5Tip') },
            ],
            faqs: [
                { q: t('import.faq1Q'), a: t('import.faq1A') },
                { q: t('import.faq2Q'), a: t('import.faq2A') },
                { q: t('import.faq3Q'), a: t('import.faq3A') },
                { q: t('import.faq4Q'), a: t('import.faq4A') },
                { q: t('import.faq5Q'), a: t('import.faq5A') },
            ],
        },
        {
            id: 'analysis',
            icon: <BarChart3 size={20} />,
            color: 'linear-gradient(135deg,#f59e0b,#ef4444)',
            title: t('analysis.title'),
            subtitle: t('analysis.subtitle'),
            steps: [
                { step: 1, title: t('analysis.step1Title'), body: t('analysis.step1Body'), tip: t('analysis.step1Tip') },
                { step: 2, title: t('analysis.step2Title'), body: t('analysis.step2Body') },
                { step: 3, title: t('analysis.step3Title'), body: t('analysis.step3Body'), tip: t('analysis.step3Tip') },
                { step: 4, title: t('analysis.step4Title'), body: t('analysis.step4Body') },
                { step: 5, title: t('analysis.step5Title'), body: t('analysis.step5Body') },
            ],
            faqs: [
                { q: t('analysis.faq1Q'), a: t('analysis.faq1A') },
                { q: t('analysis.faq2Q'), a: t('analysis.faq2A') },
                { q: t('analysis.faq3Q'), a: t('analysis.faq3A') },
                { q: t('analysis.faq4Q'), a: t('analysis.faq4A') },
            ],
        },
        {
            id: 'explanations',
            icon: <MessageSquare size={20} />,
            color: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
            title: t('explanations.title'),
            subtitle: t('explanations.subtitle'),
            steps: [
                { step: 1, title: t('explanations.step1Title'), body: t('explanations.step1Body'), tip: t('explanations.step1Tip') },
                { step: 2, title: t('explanations.step2Title'), body: t('explanations.step2Body') },
                { step: 3, title: t('explanations.step3Title'), body: t('explanations.step3Body'), tip: t('explanations.step3Tip') },
                { step: 4, title: t('explanations.step4Title'), body: t('explanations.step4Body') },
            ],
            faqs: [
                { q: t('explanations.faq1Q'), a: t('explanations.faq1A') },
                { q: t('explanations.faq2Q'), a: t('explanations.faq2A') },
                { q: t('explanations.faq3Q'), a: t('explanations.faq3A') },
            ],
        },
        {
            id: 'remediation',
            icon: <Zap size={20} />,
            color: 'linear-gradient(135deg,#10b981,#3b82f6)',
            title: t('remediationModule.title'),
            subtitle: t('remediationModule.subtitle'),
            steps: [
                { step: 1, title: t('remediationModule.step1Title'), body: t('remediationModule.step1Body') },
                { step: 2, title: t('remediationModule.step2Title'), body: t('remediationModule.step2Body'), tip: t('remediationModule.step2Tip') },
                { step: 3, title: t('remediationModule.step3Title'), body: t('remediationModule.step3Body') },
            ],
            faqs: [
                { q: t('remediationModule.faq1Q'), a: t('remediationModule.faq1A') },
                { q: t('remediationModule.faq2Q'), a: t('remediationModule.faq2A') },
            ],
        },
        {
            id: 'reports',
            icon: <FileText size={20} />,
            color: 'linear-gradient(135deg,#14b8a6,#3b82f6)',
            title: t('reports.title'),
            subtitle: t('reports.subtitle'),
            steps: [
                { step: 1, title: t('reports.step1Title'), body: t('reports.step1Body'), tip: t('reports.step1Tip') },
                { step: 2, title: t('reports.step2Title'), body: t('reports.step2Body') },
                { step: 3, title: t('reports.step3Title'), body: t('reports.step3Body') },
                { step: 4, title: t('reports.step4Title'), body: t('reports.step4Body') },
            ],
            faqs: [
                { q: t('reports.faq1Q'), a: t('reports.faq1A') },
                { q: t('reports.faq2Q'), a: t('reports.faq2A') },
                { q: t('reports.faq3Q'), a: t('reports.faq3A') },
            ],
        },
        {
            id: 'portal',
            icon: <Users size={20} />,
            color: 'linear-gradient(135deg,#f59e0b,#10b981)',
            title: t('portal.title'),
            subtitle: t('portal.subtitle'),
            steps: [
                { step: 1, title: t('portal.step1Title'), body: t('portal.step1Body') },
                { step: 2, title: t('portal.step2Title'), body: t('portal.step2Body'), tip: t('portal.step2Tip') },
                { step: 3, title: t('portal.step3Title'), body: t('portal.step3Body') },
            ],
            faqs: [
                { q: t('portal.faq1Q'), a: t('portal.faq1A') },
                { q: t('portal.faq2Q'), a: t('portal.faq2A') },
                { q: t('portal.faq3Q'), a: t('portal.faq3A') },
            ],
        },
        {
            id: 'bands',
            icon: <Layers size={20} />,
            color: 'linear-gradient(135deg,#0ea5e9,#10b981)',
            title: t('bands.title'),
            subtitle: t('bands.subtitle'),
            steps: [
                { step: 1, title: t('bands.step1Title'), body: t('bands.step1Body'), tip: t('bands.step1Tip') },
                { step: 2, title: t('bands.step2Title'), body: t('bands.step2Body'), tip: t('bands.step2Tip') },
                { step: 3, title: t('bands.step3Title'), body: t('bands.step3Body') },
                { step: 4, title: t('bands.step4Title'), body: t('bands.step4Body') },
                { step: 5, title: t('bands.step5Title'), body: t('bands.step5Body') },
            ],
            faqs: [
                { q: t('bands.faq1Q'), a: t('bands.faq1A') },
                { q: t('bands.faq2Q'), a: t('bands.faq2A') },
                { q: t('bands.faq3Q'), a: t('bands.faq3A') },
            ],
        },
        {
            id: 'trends',
            icon: <TrendingUp size={20} />,
            color: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            title: t('trendsModule.title'),
            subtitle: t('trendsModule.subtitle'),
            steps: [
                { step: 1, title: t('trendsModule.step1Title'), body: t('trendsModule.step1Body'), tip: t('trendsModule.step1Tip') },
                { step: 2, title: t('trendsModule.step2Title'), body: t('trendsModule.step2Body'), tip: t('trendsModule.step2Tip') },
                { step: 3, title: t('trendsModule.step3Title'), body: t('trendsModule.step3Body') },
                { step: 4, title: t('trendsModule.step4Title'), body: t('trendsModule.step4Body') },
            ],
            faqs: [
                { q: t('trendsModule.faq1Q'), a: t('trendsModule.faq1A') },
                { q: t('trendsModule.faq2Q'), a: t('trendsModule.faq2A') },
                { q: t('trendsModule.faq3Q'), a: t('trendsModule.faq3A') },
            ],
        },
        {
            id: 'compliance',
            icon: <ShieldCheck size={20} />,
            color: 'linear-gradient(135deg,#10b981,#14b8a6)',
            title: t('compliance.title'),
            subtitle: t('compliance.subtitle'),
            steps: [
                { step: 1, title: t('compliance.step1Title'), body: t('compliance.step1Body'), tip: t('compliance.step1Tip') },
                { step: 2, title: t('compliance.step2Title'), body: t('compliance.step2Body') },
                { step: 3, title: t('compliance.step3Title'), body: t('compliance.step3Body') },
            ],
            faqs: [
                { q: t('compliance.faq1Q'), a: t('compliance.faq1A') },
                { q: t('compliance.faq2Q'), a: t('compliance.faq2A') },
            ],
        },
        {
            id: 'settings',
            icon: <Settings size={20} />,
            color: 'linear-gradient(135deg,#64748b,#334155)',
            title: t('settings.title'),
            subtitle: t('settings.subtitle'),
            steps: [
                { step: 1, title: t('settings.step1Title'), body: t('settings.step1Body') },
                { step: 2, title: t('settings.step2Title'), body: t('settings.step2Body'), tip: t('settings.step2Tip') },
                { step: 3, title: t('settings.step3Title'), body: t('settings.step3Body') },
                { step: 4, title: t('settings.step4Title'), body: t('settings.step4Body') },
            ],
            faqs: [
                { q: t('settings.faq1Q'), a: t('settings.faq1A') },
                { q: t('settings.faq2Q'), a: t('settings.faq2A') },
                { q: t('settings.faq3Q'), a: t('settings.faq3A') },
            ],
        },
        {
            id: 'jobArchitecture',
            icon: <Network size={20} />,
            color: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
            title: t('jobArchitecture.title'),
            subtitle: t('jobArchitecture.subtitle'),
            steps: [
                { step: 1, title: t('jobArchitecture.step1Title'), body: t('jobArchitecture.step1Body'), tip: t('jobArchitecture.step1Tip') },
                { step: 2, title: t('jobArchitecture.step2Title'), body: t('jobArchitecture.step2Body') },
                { step: 3, title: t('jobArchitecture.step3Title'), body: t('jobArchitecture.step3Body'), tip: t('jobArchitecture.step3Tip') },
                { step: 4, title: t('jobArchitecture.step4Title'), body: t('jobArchitecture.step4Body') },
                { step: 5, title: t('jobArchitecture.step5Title'), body: t('jobArchitecture.step5Body') },
                { step: 6, title: t('jobArchitecture.step6Title'), body: t('jobArchitecture.step6Body'), tip: t('jobArchitecture.step6Tip') },
            ],
            faqs: [
                { q: t('jobArchitecture.faq1Q'), a: t('jobArchitecture.faq1A') },
                { q: t('jobArchitecture.faq2Q'), a: t('jobArchitecture.faq2A') },
                { q: t('jobArchitecture.faq3Q'), a: t('jobArchitecture.faq3A') },
                { q: t('jobArchitecture.faq4Q'), a: t('jobArchitecture.faq4A') },
                { q: t('jobArchitecture.faq5Q'), a: t('jobArchitecture.faq5A') },
            ],
        },
    ]
}

function buildLegalRef(t: (key: string) => string) {
    return [
        { art: 'Art. 3', title: t('legal.art3Title'), desc: t('legal.art3Desc') },
        { art: 'Art. 7', title: t('legal.art7Title'), desc: t('legal.art7Desc') },
        { art: 'Art. 9', title: t('legal.art9Title'), desc: t('legal.art9Desc') },
        { art: 'Art. 10', title: t('legal.art10Title'), desc: t('legal.art10Desc') },
        { art: 'EntgTranspG', title: t('legal.entgTranspGTitle'), desc: t('legal.entgTranspGDesc') },
    ]
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HelpClient() {
    const t = useTranslations('help')
    const [activeModule,  setActiveModule]  = useState<string | null>(null)
    const [search,        setSearch]        = useState('')
    const [showSupport,   setShowSupport]   = useState(false)

    const MODULES = buildModules(t)
    const LEGAL_REF = buildLegalRef(t)

    const filtered = search.trim().length > 1
        ? MODULES.filter(m =>
            m.title.toLowerCase().includes(search.toLowerCase()) ||
            m.subtitle.toLowerCase().includes(search.toLowerCase()) ||
            m.steps.some(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.body.toLowerCase().includes(search.toLowerCase())) ||
            m.faqs.some(f => f.q.toLowerCase().includes(search.toLowerCase()))
          )
        : MODULES

    return (
        <div className="space-y-6">
            {showSupport && <SupportTicketModal onClose={() => setShowSupport(false)} />}

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 pb-5" style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                        <BookOpen size={22} style={{ color: 'var(--color-pl-brand)' }} />
                        {t('title')}
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            {/* ── Demo Video Banner ── */}
            <a
                href="https://www.youtube.com/watch?v=s7Y346Gxklo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl group transition-all hover:opacity-80"
                style={{
                    background: 'var(--color-pl-surface)',
                    border: '1px solid var(--color-pl-border)',
                    textDecoration: 'none',
                }}
            >
                {/* Play icon — neutral */}
                <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--color-pl-brand)', opacity: 0.85 }}
                >
                    <PlayCircle size={16} className="text-white" />
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('demoVideoTitle')}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('demoVideoSubtitle')}
                    </p>
                </div>
                {/* YouTube badge only is red */}
                <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: '#ef4444', color: '#fff' }}
                >
                    YouTube
                </span>
            </a>

            {/* ── Search ── */}
            <div className="relative max-w-lg">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-pl-text-tertiary)' }} />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-black/20 border focus:outline-none focus:border-blue-500 transition-colors"
                    style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                />
            </div>

            {/* ── Quick nav ── */}
            {!search && (
                <div className="flex flex-wrap gap-2">
                    {MODULES.map(m => (
                        <button
                            key={m.id}
                            onClick={() => {
                                setActiveModule(activeModule === m.id ? null : m.id)
                                setTimeout(() => document.getElementById(`module-${m.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
                            }}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                            style={{
                                background: activeModule === m.id ? 'var(--color-pl-brand)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${activeModule === m.id ? 'var(--color-pl-brand)' : 'var(--color-pl-border)'}`,
                                color: activeModule === m.id ? '#fff' : 'var(--color-pl-text-tertiary)',
                            }}
                        >
                            {m.title.split(' · ')[0]}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Modules ── */}
            <div className="space-y-4">
                {filtered.map(m => (
                    <div key={m.id} id={`module-${m.id}`}>
                        <ModulePanel module={m} guideLabel={t('guideTab')} faqLabel={t('faqTab')} />
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="glass-card p-12 text-center">
                        <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('noResults', { query: search })}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Legal quick reference ── */}
            <div className="glass-card p-5">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                    <Globe size={16} style={{ color: 'var(--color-pl-brand)' }} />
                    {t('legalTitle')}
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                                {[t('legalColArticle'), t('legalColName'), t('legalColContent')].map(h => (
                                    <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {LEGAL_REF.map(r => (
                                <tr key={r.art} className="border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                                    <td className="py-2 px-3 font-bold" style={{ color: 'var(--color-pl-brand-light)', whiteSpace: 'nowrap' }}>{r.art}</td>
                                    <td className="py-2 px-3 font-semibold" style={{ color: 'var(--color-pl-text-primary)', whiteSpace: 'nowrap' }}>{r.title}</td>
                                    <td className="py-2 px-3 leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>{r.desc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Support banner ── */}
            <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,var(--color-pl-brand),#6366f1)', boxShadow: '0 8px 20px rgba(99,102,241,0.25)' }}>
                    <MessageSquare size={22} className="text-white" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>{t('supportTitle')}</h3>
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('supportDesc')}
                    </p>
                </div>
                <button
                    onClick={() => setShowSupport(true)}
                    className="flex-shrink-0 flex items-center gap-2 font-bold text-white px-5 py-2.5 rounded-lg transition-transform hover:-translate-y-0.5 text-sm"
                    style={{ background: 'linear-gradient(135deg,var(--color-pl-brand),#6366f1)', boxShadow: '0 8px 20px rgba(99,102,241,0.25)' }}
                >
                    <MessageSquare size={15} /> {t('supportButton')}
                </button>
            </div>
        </div>
    )
}
