'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
    ArrowRight,
    ArrowLeft,
    CheckCircle,
    BarChart2,
    Shield,
    Upload,
    FileSignature,
    FileText,
    Send,
    Loader2,
    Check,
    Globe,
    Server,
    ShieldCheck,
    MapPin,
    Scale,
    DollarSign,
    AlertTriangle,
    ChevronDown,
    LayoutDashboard,
    PieChart,
    Wrench,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

/* ------------------------------------------------------------------ */
/*  Showcase mockup components                                        */
/* ------------------------------------------------------------------ */
function CountdownTimer({ t }: { t: (key: string) => string }) {
    const deadline = useMemo(() => new Date('2027-06-07T00:00:00+02:00').getTime(), [])
    const calcRemaining = useCallback(() => {
        const diff = Math.max(0, deadline - Date.now())
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
        }
    }, [deadline])
    const [remaining, setRemaining] = useState(calcRemaining)
    useEffect(() => {
        const id = setInterval(() => setRemaining(calcRemaining()), 1000)
        return () => clearInterval(id)
    }, [calcRemaining])
    const units: { key: string; label: string }[] = [
        { key: 'days', label: t('countdownDays') },
        { key: 'hours', label: t('countdownHours') },
        { key: 'minutes', label: t('countdownMinutes') },
        { key: 'seconds', label: t('countdownSeconds') },
    ]
    return (
        <div className="flex flex-col items-center gap-3">
            <p className="text-xs uppercase tracking-widest text-white/80 font-semibold">
                {t('countdownLabel')}
            </p>
            <div className="flex gap-3 sm:gap-5">
                {units.map((u) => (
                    <div key={u.key} className="flex flex-col items-center min-w-[60px] sm:min-w-[76px] py-3 px-2 rounded-xl border border-white/10 bg-white/[0.03]">
                        <span className="text-2xl sm:text-4xl font-extrabold text-white tabular-nums">
                            {String((remaining as Record<string, number>)[u.key]).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-white/80 mt-1">{u.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function MockupDashboard({ t }: { t: (key: string) => string }) {
    return (
        <div className="grid grid-cols-3 gap-2 p-3">
            {[
                { label: t('showcaseMockupDashboardKpi1'), value: '12.5%', color: 'bg-red-500/80', ring: 'ring-red-500/30' },
                { label: t('showcaseMockupDashboardKpi2'), value: '7.9%', color: 'bg-amber-500/80', ring: 'ring-amber-500/30' },
                { label: t('showcaseMockupDashboardKpi3'), value: '4.8%', color: 'bg-green-500/80', ring: 'ring-green-500/30' },
            ].map((kpi) => (
                <div key={kpi.label} className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white/[0.04] border border-white/5">
                    <div className={`w-2.5 h-2.5 rounded-full ${kpi.color} ring-2 ${kpi.ring}`} />
                    <span className="text-lg font-bold text-white tabular-nums">{kpi.value}</span>
                    <span className="text-[9px] text-white/80 text-center leading-tight">{kpi.label}</span>
                </div>
            ))}
        </div>
    )
}

function MockupImport({ t }: { t: (key: string) => string }) {
    const rows = [
        { source: 'Gehalt_Brutto', target: 'base_salary', conf: '98%' },
        { source: 'Abteilung', target: 'department', conf: '95%' },
        { source: 'Geschlecht_MA', target: 'gender', conf: '92%' },
    ]
    return (
        <div className="p-3 space-y-1.5">
            <div className="grid grid-cols-3 gap-2 text-[8px] text-white/80 uppercase tracking-wider px-1">
                <span>{t('showcaseMockupImportSource')}</span>
                <span>{t('showcaseMockupImportTarget')}</span>
                <span className="text-right">{t('showcaseMockupImportConfidence')}</span>
            </div>
            {rows.map((r) => (
                <div key={r.source} className="grid grid-cols-3 gap-2 items-center p-1.5 rounded bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] text-white/80 font-mono truncate">{r.source}</span>
                    <div className="flex items-center gap-1">
                        <ArrowRight size={8} className="text-blue-400/60 shrink-0" />
                        <span className="text-[10px] text-blue-300/80 font-mono truncate">{r.target}</span>
                    </div>
                    <span className="text-[10px] text-green-400/80 font-semibold text-right">{r.conf}</span>
                </div>
            ))}
        </div>
    )
}

function MockupWif({ t }: { t: (key: string) => string }) {
    const pills = ['Job Grade', 'Department', 'Location', 'FTE']
    const bars = [
        { label: 'Sales', w: '75%', color: 'bg-red-400/70' },
        { label: 'Engineering', w: '45%', color: 'bg-amber-400/70' },
        { label: 'HR', w: '25%', color: 'bg-green-400/70' },
    ]
    return (
        <div className="p-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">
                {pills.map((p) => (
                    <span key={p} className="px-2 py-0.5 text-[9px] rounded-full bg-blue-500/20 text-blue-300/80 border border-blue-500/20">
                        {p}
                    </span>
                ))}
            </div>
            <p className="text-[9px] text-white/80 uppercase tracking-wider">{t('showcaseMockupWifGap')}</p>
            <div className="space-y-1.5">
                {bars.map((b) => (
                    <div key={b.label} className="flex items-center gap-2">
                        <span className="text-[9px] text-white/80 w-16 text-right shrink-0">{b.label}</span>
                        <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                            <div className={`h-full rounded-full ${b.color}`} style={{ width: b.w }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function MockupQuartile({ t }: { t: (key: string) => string }) {
    const quartiles = [
        { label: 'Q1', m: 70, f: 30 },
        { label: 'Q2', m: 58, f: 42 },
        { label: 'Q3', m: 45, f: 55 },
        { label: 'Q4', m: 35, f: 65 },
    ]
    return (
        <div className="p-3 space-y-2">
            <p className="text-[9px] text-white/80 uppercase tracking-wider">{t('showcaseMockupQuartileTitle')}</p>
            <div className="space-y-1.5">
                {quartiles.map((q) => (
                    <div key={q.label} className="flex items-center gap-2">
                        <span className="text-[9px] text-white/80 w-6 shrink-0">{q.label}</span>
                        <div className="flex-1 h-4 rounded-full overflow-hidden flex">
                            <div className="h-full bg-blue-500/60" style={{ width: `${q.m}%` }} />
                            <div className="h-full bg-pink-500/60" style={{ width: `${q.f}%` }} />
                        </div>
                        <span className="text-[8px] text-white/80 w-12 shrink-0 text-right">{q.m}M/{q.f}F</span>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-3 justify-center pt-1">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-blue-500/60" /><span className="text-[8px] text-white/80">Male</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-pink-500/60" /><span className="text-[8px] text-white/80">Female</span></div>
            </div>
        </div>
    )
}

function MockupRemediation({ t }: { t: (key: string) => string }) {
    const actions = [
        { action: 'Salary adjustment — Sales Q1', status: 'In Progress', statusColor: 'bg-amber-500/80 text-amber-100' },
        { action: 'Job re-grading — Engineering', status: 'Planned', statusColor: 'bg-blue-500/80 text-blue-100' },
        { action: 'Promotion pipeline review', status: 'Done', statusColor: 'bg-green-500/80 text-green-100' },
    ]
    return (
        <div className="p-3 space-y-2">
            <p className="text-[9px] text-white/80 uppercase tracking-wider">{t('showcaseMockupRemediationTitle')}</p>
            <div className="space-y-1.5">
                {actions.map((a) => (
                    <div key={a.action} className="flex items-center justify-between gap-2 p-1.5 rounded bg-white/[0.03] border border-white/5">
                        <span className="text-[9px] text-white/80 truncate">{a.action}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${a.statusColor}`}>{a.status}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function MockupReport({ t }: { t: (key: string) => string }) {
    return (
        <div className="p-3 flex gap-3 items-start">
            {/* PDF mockup */}
            <div className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-4 h-4 rounded bg-red-500/30 flex items-center justify-center">
                        <span className="text-[7px] font-bold text-red-400">PDF</span>
                    </div>
                    <span className="text-[8px] text-white/60 font-medium">Art. 9 Report</span>
                </div>
                <div className="space-y-1">
                    <div className="h-1.5 w-full rounded bg-white/10" />
                    <div className="h-1.5 w-4/5 rounded bg-white/5" />
                    <div className="h-4 w-full rounded bg-blue-500/10 mt-1.5 flex items-center justify-center">
                        <span className="text-[6px] text-blue-400/80">&#10003; EU Art. 9</span>
                    </div>
                    <div className="h-1.5 w-full rounded bg-white/5" />
                    <div className="h-1.5 w-3/4 rounded bg-white/5" />
                </div>
            </div>
            {/* PPT mockup */}
            <div className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-4 h-4 rounded bg-orange-500/30 flex items-center justify-center">
                        <span className="text-[7px] font-bold text-orange-400">PPT</span>
                    </div>
                    <span className="text-[8px] text-white/60 font-medium">Board Deck</span>
                </div>
                <div className="space-y-1">
                    <div className="h-3 w-3/4 rounded bg-white/10" />
                    <div className="flex gap-1 mt-1">
                        <div className="h-6 flex-1 rounded bg-green-500/10" />
                        <div className="h-6 flex-1 rounded bg-amber-500/10" />
                        <div className="h-6 flex-1 rounded bg-red-500/10" />
                    </div>
                    <div className="h-1.5 w-full rounded bg-white/5" />
                </div>
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  HeroShowcase carousel                                             */
/* ------------------------------------------------------------------ */
interface ShowcaseCard {
    icon: React.ComponentType<{ size?: number; className?: string }>
    step: number
    titleKey: string
    descKey: string
    mockup: React.ComponentType<{ t: (key: string) => string }>
}

const showcaseCards: ShowcaseCard[] = [
    { icon: LayoutDashboard, step: 1, titleKey: 'showcase1Title', descKey: 'showcase1Desc', mockup: MockupDashboard },
    { icon: Upload, step: 2, titleKey: 'showcase2Title', descKey: 'showcase2Desc', mockup: MockupImport },
    { icon: BarChart2, step: 3, titleKey: 'showcase3Title', descKey: 'showcase3Desc', mockup: MockupWif },
    { icon: PieChart, step: 4, titleKey: 'showcase4Title', descKey: 'showcase4Desc', mockup: MockupQuartile },
    { icon: Wrench, step: 5, titleKey: 'showcase5Title', descKey: 'showcase5Desc', mockup: MockupRemediation },
    { icon: FileText, step: 6, titleKey: 'showcase6Title', descKey: 'showcase6Desc', mockup: MockupReport },
]

function HeroShowcase({ t }: { t: (key: string) => string }) {
    const [active, setActive] = useState(0)
    const [paused, setPaused] = useState(false)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Auto-advance only when carousel is visible in viewport
    useEffect(() => {
        if (paused) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            return
        }
        const el = containerRef.current
        if (!el) return

        let visible = false
        const observer = new IntersectionObserver(
            ([entry]) => { visible = entry.isIntersecting },
            { threshold: 0.3 }
        )
        observer.observe(el)

        intervalRef.current = setInterval(() => {
            if (visible) setActive((prev) => (prev + 1) % showcaseCards.length)
        }, 5000)

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            observer.disconnect()
        }
    }, [paused])

    const goTo = useCallback((idx: number) => {
        setActive(idx)
    }, [])

    const goPrev = useCallback(() => {
        setActive((prev) => (prev - 1 + showcaseCards.length) % showcaseCards.length)
    }, [])

    const goNext = useCallback(() => {
        setActive((prev) => (prev + 1) % showcaseCards.length)
    }, [])

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault()
                goPrev()
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                goNext()
            }
        },
        [goPrev, goNext]
    )

    // Scroll active card into view within the container only (no page scroll)
    useEffect(() => {
        if (!containerRef.current) return
        const card = containerRef.current.querySelector(`[data-showcase-card="${active}"]`) as HTMLElement
        if (card) {
            containerRef.current.scrollTo({
                left: card.offsetLeft - containerRef.current.offsetLeft - 16,
                behavior: 'smooth',
            })
        }
    }, [active])

    return (
        <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            role="region"
            aria-roledescription="carousel"
            aria-label={t('showcaseTitle')}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            className="outline-none"
        >
            {/* Cards — horizontal scroll on mobile, 3-col grid on desktop */}
            <div
                ref={containerRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {showcaseCards.map((card, idx) => {
                    const isActive = idx === active
                    const Icon = card.icon
                    const Mockup = card.mockup
                    return (
                        <button
                            key={idx}
                            data-showcase-card={idx}
                            onClick={() => goTo(idx)}
                            aria-label={`${card.step}. ${t(card.titleKey)}`}
                            aria-current={isActive ? 'true' : undefined}
                            className={`
                                snap-center shrink-0 w-[280px] sm:w-[300px] lg:w-auto
                                rounded-2xl border text-left
                                transition-all duration-300 ease-out cursor-pointer
                                ${isActive
                                    ? 'border-blue-500/40 bg-white/[0.06] shadow-[0_0_30px_rgba(99,102,241,0.12)]'
                                    : 'border-white/5 bg-white/[0.02] opacity-60 hover:opacity-80 hover:bg-white/[0.03]'
                                }
                            `}
                        >
                            {/* Mockup area */}
                            <div className="h-[140px] overflow-hidden rounded-t-2xl border-b border-white/5 bg-black/20">
                                <Mockup t={t} />
                            </div>

                            {/* Text area */}
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                                        <Icon size={14} className={isActive ? 'text-blue-400' : 'text-white/80'} />
                                    </div>
                                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                                        {card.step}/6
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1">{t(card.titleKey)}</h3>
                                <p className="text-xs text-white/80 leading-relaxed line-clamp-3">{t(card.descKey)}</p>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Navigation: arrows + dots */}
            <div className="flex items-center justify-center gap-4 mt-6">
                <button
                    onClick={goPrev}
                    aria-label="Previous slide"
                    className="w-9 h-9 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                    <ArrowLeft size={16} />
                </button>

                <div className="flex gap-2">
                    {showcaseCards.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => goTo(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                            className={`
                                h-2 rounded-full transition-all duration-300
                                ${idx === active ? 'w-6 bg-blue-500' : 'w-2 bg-white/20 hover:bg-white/40'}
                            `}
                        />
                    ))}
                </div>

                <button
                    onClick={goNext}
                    aria-label="Next slide"
                    className="w-9 h-9 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  FAQ accordion item                                                */
/* ------------------------------------------------------------------ */
function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.02]">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
            >
                <span className="text-sm font-semibold text-white">{question}</span>
                <ChevronDown
                    size={18}
                    className={`text-white/80 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96 pb-5 px-6' : 'max-h-0'}`}
            >
                <p className="text-sm text-white/80 leading-relaxed">{answer}</p>
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  Main page component                                               */
/* ------------------------------------------------------------------ */
export default function LandingClient() {
    const t = useTranslations('landing')
    const tAd = useTranslations('adLanding')
    const [scrolled, setScrolled] = useState(false)
    const [contacting, setContacting] = useState(false)
    const [contactDone, setContactDone] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleContact = async (e: React.FormEvent) => {
        e.preventDefault()
        setContacting(true)

        try {
            const formData = new FormData(e.target as HTMLFormElement)
            const payload = Object.fromEntries(formData.entries())

            await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            setContacting(false)
            setContactDone(true)
            setTimeout(() => setContactDone(false), 5000)
            ;(e.target as HTMLFormElement).reset()
        } catch (error) {
            console.error("Fehler beim Senden:", error)
            setContacting(false)
        }
    }

    const faqs = [
        { q: 'faq1Question', a: 'faq1Answer' },
        { q: 'faq2Question', a: 'faq2Answer' },
        { q: 'faq3Question', a: 'faq3Answer' },
        { q: 'faq4Question', a: 'faq4Answer' },
        { q: 'faq5Question', a: 'faq5Answer' },
        { q: 'faq6Question', a: 'faq6Answer' },
    ] as const

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ background: '#0a0f1c' }}>
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[800px] pointer-events-none" style={{
                background: 'radial-gradient(ellipse at top center, rgba(99,102,241,0.15), transparent 70%)'
            }} />
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none opacity-30" style={{
                background: 'radial-gradient(circle, rgba(124,58,237,0.4), transparent 60%)', filter: 'blur(80px)'
            }} />
            <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none opacity-20" style={{
                background: 'radial-gradient(circle, rgba(59,130,246,0.3), transparent 60%)', filter: 'blur(60px)'
            }} />

            {/* Navbar */}
            <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}
                style={{
                    background: scrolled ? 'rgba(10, 15, 28, 0.8)' : 'transparent',
                    backdropFilter: scrolled ? 'blur(12px)' : 'none',
                    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent'
                }}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo size={36} />
                        <span className="font-bold text-lg tracking-wide text-white">
                            CompLens
                        </span>
                    </div>
                    <div className="flex items-center gap-6">
                        <LanguageSwitcher />
                        <a href="/login" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                            {t('navLogin')}
                        </a>
                        <a href="/signup" className="text-sm font-bold text-white px-5 py-2.5 rounded-full transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #7c3aed)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
                            {t('navCtaStart')}
                        </a>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1 space-y-8 z-10 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 mb-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        {t('heroBadge')}
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
                        {t('heroHeadlinePlain')} <br />
                        <span style={{ background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {t('heroHeadlineGradient')}
                        </span>
                    </h1>
                    <p className="text-lg text-white/60 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                        {t('heroSubheadline')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
                        <a href="/signup" className="flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                            style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #6366f1)' }}>
                            {t('heroCtaPrimary')}
                            <ArrowRight size={18} />
                        </a>
                        <a href="#contact" className="px-8 py-4 rounded-full text-base font-medium text-white/80 hover:text-white transition-colors border border-white/10 hover:bg-white/5">
                            {t('heroCtaSecondary')}
                        </a>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-x-6 gap-y-3 justify-center lg:justify-start pt-4 text-sm text-white/50 font-medium">
                        <span className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto"><CheckCircle size={16} className="text-green-400 shrink-0" /> {t('trustEuServers')}</span>
                        <span className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto"><CheckCircle size={16} className="text-green-400 shrink-0" /> {t('trustEuDirective')}</span>
                        <span className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto"><CheckCircle size={16} className="text-green-400 shrink-0" /> {t('trustFirstAnalysis')}</span>
                        <span className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto"><CheckCircle size={16} className="text-green-400 shrink-0" /> {t('trustAutoMapping')}</span>
                    </div>
                </div>

                {/* UI Showcase Floating Panel */}
                <div className="flex-1 w-full max-w-xl z-10 relative perspective-1000 group">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 opacity-30 blur-2xl group-hover:opacity-60 transition duration-1000"></div>
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl transition-transform duration-700 hover:-translate-y-2 hover:rotate-1"
                        style={{ background: 'rgba(22, 33, 62, 0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {/* Fake Dashboard Header */}
                        <div className="border-b border-white/10 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <BarChart2 size={20} className="text-blue-400" />
                                <span className="text-sm font-semibold text-white">{t('showcaseTitle')}</span>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">{t('showcaseRating')}</div>
                        </div>
                        {/* Fake Dashboard Content */}
                        <div className="p-6 space-y-6">
                            <div className="flex items-baseline justify-between">
                                <span className="text-xs text-white/50 uppercase tracking-widest font-semibold">{t('showcaseGapLabel')}</span>
                                <span className="text-xs text-white/40">{t('showcaseVsLastYear')} <span className="text-green-400">-1.2%</span></span>
                            </div>
                            <div className="flex gap-8">
                                <div>
                                    <div className="text-4xl font-light text-white tracking-tight">2.4%</div>
                                    <div className="text-xs text-white/40 mt-1">{t('showcaseMedianLabel')}</div>
                                </div>
                                <div className="h-12 w-1 border-r border-white/10" />
                                <div>
                                    <div className="text-4xl font-light text-white tracking-tight">3.1%</div>
                                    <div className="text-xs text-white/40 mt-1">{t('showcaseMeanLabel')}</div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {['Software Engineering', 'Marketing', 'Sales'].map((dept, i) => (
                                    <div key={dept} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5">
                                        <span className="text-sm text-white/80">{dept}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                <div className="h-full rounded-full bg-blue-500" style={{ width: `${(3-i)*25}%` }} />
                                            </div>
                                            <span className="text-sm font-medium text-white w-8 text-right">{((3-i)*1.4).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2">
                                <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-sm font-semibold text-white border border-white/5 flex items-center justify-center gap-2">
                                    <FileSignature size={16} /> {t('showcaseGenerateReports')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Countdown + The 5% Trap — one cohesive warning block */}
            <section
                className="py-20 sm:py-24 relative z-10"
                style={{ background: 'rgba(0,0,0,0.2)' }}
            >
                <div className="max-w-7xl mx-auto px-6">
                    {/* Countdown headline + timer */}
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                            {tAd('heroHeadline')}
                            <br />
                            <span style={{
                                background: 'linear-gradient(135deg, #f97316, #ef4444)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                {tAd('heroHeadlineHighlight')}
                            </span>
                        </h2>
                    </div>

                    <div className="mb-24">
                        <CountdownTimer t={tAd} />
                    </div>

                    {/* 5% trap headline */}
                    <div className="text-center mb-14">
                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">{tAd('problemHeadline')}</h3>
                        <p className="text-white/80 max-w-2xl mx-auto">{tAd('problemSubheadline')}</p>
                    </div>

                    {/* Risk cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {[
                            { icon: Scale, titleKey: 'problemLegalTitle', textKey: 'problemLegalText', color: 'text-red-400' },
                            { icon: DollarSign, titleKey: 'problemFinancialTitle', textKey: 'problemFinancialText', color: 'text-amber-400' },
                            { icon: AlertTriangle, titleKey: 'problemReputationalTitle', textKey: 'problemReputationalText', color: 'text-orange-400' },
                        ].map((card, i) => (
                            <div
                                key={i}
                                className="p-8 rounded-2xl border border-red-500/10 bg-red-500/[0.02] hover:bg-red-500/[0.04] transition-colors"
                            >
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6">
                                    <card.icon size={24} className={card.color} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{tAd(card.titleKey)}</h3>
                                <p className="text-white/80 leading-relaxed text-sm">{tAd(card.textKey)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Directive quote removed from main landing — kept on /go only */}
                </div>
            </section>

            {/* Interactive Carousel */}
            <section className="py-16 sm:py-20 relative z-10">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{tAd('showcaseTitle')}</h2>
                        <p className="mt-4 text-base text-white/80 leading-relaxed max-w-3xl mx-auto">
                            {tAd('heroSubheadline')}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                            {([
                                { key: 'trustBadgeGdpr' as const, icon: ShieldCheck },
                                { key: 'trustBadgeEuServers' as const, icon: Server },
                                { key: 'trustBadgeSoc2' as const, icon: Shield },
                                { key: 'trustBadgeMadeInGermany' as const, icon: MapPin }
                            ]).map((badge) => (
                                <div key={badge.key} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04]">
                                    <badge.icon size={14} className="text-green-400" />
                                    <span className="text-xs font-semibold text-white/90">{t(badge.key)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <HeroShowcase t={tAd} />
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">{t('pricingHeadline')}</h2>
                        <p className="text-white/50 max-w-2xl mx-auto">{t('pricingSubheadline')}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Professional Plan */}
                        <div className="relative rounded-2xl p-[1px] overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.6), rgba(124,58,237,0.6))' }}>
                            <div className="rounded-2xl p-8 h-full flex flex-col"
                                style={{
                                    background: 'rgba(22, 33, 62, 0.9)',
                                    backdropFilter: 'blur(16px)',
                                    boxShadow: '0 0 40px rgba(99,102,241,0.15)'
                                }}>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white">{t('pricingProTitle')}</h3>
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                        {t('pricingRecommended')}
                                    </span>
                                </div>
                                <div className="mb-8">
                                    <span className="text-4xl font-extrabold text-white">{t('pricingProPrice')}</span>
                                    <span className="text-white/40 text-sm ml-1">{t('pricingProPeriod')}</span>
                                </div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    {([
                                        'pricingProFeature1', 'pricingProFeature2', 'pricingProFeature3',
                                        'pricingProFeature4', 'pricingProFeature5', 'pricingProFeature6',
                                        'pricingProFeature7', 'pricingProFeature8', 'pricingProFeature9',
                                        'pricingProFeature10'
                                    ] as const).map((key) => (
                                        <li key={key} className="flex items-start gap-3 text-sm text-white/70">
                                            <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
                                            <span>{t(key)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-white/40 mb-6">{t('pricingProSeats')}</p>
                                <a href="/signup"
                                    className="block w-full py-3.5 rounded-xl text-center text-sm font-bold text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                                    style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #6366f1)' }}>
                                    {t('pricingProCta')}
                                </a>
                                <p className="text-xs text-white/30 text-center mt-3">{t('pricingProNote')}</p>
                            </div>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="rounded-2xl p-8 h-full flex flex-col"
                            style={{
                                background: 'rgba(22, 33, 62, 0.5)',
                                backdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255,255,255,0.08)'
                            }}>
                            <h3 className="text-xl font-bold text-white mb-6">{t('pricingEntTitle')}</h3>
                            <div className="mb-8">
                                <span className="text-4xl font-extrabold text-white">{t('pricingEntPrice')}</span>
                                <span className="text-white/40 text-sm ml-2">{t('pricingEntPeriod')}</span>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                {([
                                    'pricingEntFeature1', 'pricingEntFeature2', 'pricingEntFeature3',
                                    'pricingEntFeature4', 'pricingEntFeature5', 'pricingEntFeature6',
                                    'pricingEntFeature7', 'pricingEntFeature8'
                                ] as const).map((key) => (
                                    <li key={key} className="flex items-start gap-3 text-sm text-white/70">
                                        <Check size={16} className="text-blue-400 mt-0.5 shrink-0" />
                                        <span>{t(key)}</span>
                                    </li>
                                ))}
                            </ul>
                            <a href="#contact"
                                className="block w-full py-3.5 rounded-xl text-center text-sm font-bold text-white/90 transition-all hover:bg-white/10 border border-white/10 hover:border-white/20">
                                {t('pricingEntCta')}
                            </a>
                        </div>
                    </div>

                    {/* Cost comparison removed — out of place on main landing */}
                </div>
            </section>

            {/* Trust badges moved to showcase section */}

            {/* FAQ Section */}
            <section
                className="py-20 sm:py-24 border-y border-white/5 relative z-10"
                style={{ background: 'rgba(0,0,0,0.2)' }}
            >
                <div className="max-w-3xl mx-auto px-6">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4">{tAd('faqHeadline')}</h2>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq) => (
                            <FaqItem key={faq.q} question={tAd(faq.q)} answer={tAd(faq.a)} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Form Section */}
            <section id="contact" className="py-24 relative z-10">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="rounded-3xl p-1 lg:p-12" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(124,58,237,0.1))', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-white mb-4">{t('contactHeadline')}</h2>
                            <p className="text-white/60">{t('contactSubheadline')}</p>
                        </div>

                        {!contactDone ? (
                            <form onSubmit={handleContact} className="max-w-xl mx-auto space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-white/50 ml-1">{t('contactNameLabel')}</label>
                                        <input name="name" required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder={t('contactNamePlaceholder')} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-white/50 ml-1">{t('contactCompanyLabel')}</label>
                                        <input name="company" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder={t('contactCompanyPlaceholder')} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/50 ml-1">{t('contactEmailLabel')}</label>
                                    <input name="email" required type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder={t('contactEmailPlaceholder')} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/50 ml-1">{t('contactMessageLabel')}</label>
                                    <textarea name="message" required rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none" placeholder={t('contactMessagePlaceholder')} />
                                </div>
                                <button disabled={contacting} type="submit" className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #6366f1)', boxShadow: '0 8px 20px rgba(99,102,241,0.25)' }}>
                                    {contacting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> {t('contactSubmit')}</>}
                                </button>
                            </form>
                        ) : (
                            <div className="max-w-xl mx-auto py-12 text-center bg-white/5 rounded-2xl border border-white/10">
                                <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">{t('contactSuccessTitle')}</h3>
                                <p className="text-white/60 text-sm">{t('contactSuccessText')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <footer className="py-10 border-t border-white/10 bg-black/20 text-center relative z-10 px-4">
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-4">
                    <a href="/impressum" className="text-sm text-white/70 hover:text-white transition-colors">{t('footerImpressum')}</a>
                    <a href="/compliance" className="text-sm text-white/70 hover:text-white transition-colors">{t('footerCompliance')}</a>
                    <a href="/datenschutz" className="text-sm text-white/70 hover:text-white transition-colors">{t('footerDatenschutz')}</a>
                    <a href="/agb" className="text-sm text-white/70 hover:text-white transition-colors">{t('footerAgb')}</a>
                </div>
                <p className="text-sm text-white/60">
                    {t('footerCopyright', { year: new Date().getFullYear() })}
                </p>
            </footer>
        </div>
    )
}
