'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  ShieldCheck,
  Server,
  MapPin,
  Scale,
  DollarSign,
  AlertTriangle,
  Upload,
  BarChart2,
  FileSignature,
  FileText,
  Check,
  Quote,
  ChevronDown,
  Play,
  Users,
  Clock,
  LayoutDashboard,
  PieChart,
  Wrench,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

/* ------------------------------------------------------------------ */
/*  Countdown timer component                                         */
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
      <p className="text-xs uppercase tracking-widest text-white/40 font-semibold">
        {t('countdownLabel')}
      </p>
      <div className="flex gap-3 sm:gap-5">
        {units.map((u) => (
          <div
            key={u.key}
            className="flex flex-col items-center min-w-[60px] sm:min-w-[76px] py-3 px-2 rounded-xl border border-white/10 bg-white/[0.03]"
          >
            <span className="text-2xl sm:text-4xl font-extrabold text-white tabular-nums">
              {String((remaining as Record<string, number>)[u.key]).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Showcase mockup components                                        */
/* ------------------------------------------------------------------ */
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
          <span className="text-[9px] text-white/40 text-center leading-tight">{kpi.label}</span>
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
      <div className="grid grid-cols-3 gap-2 text-[8px] text-white/30 uppercase tracking-wider px-1">
        <span>{t('showcaseMockupImportSource')}</span>
        <span>{t('showcaseMockupImportTarget')}</span>
        <span className="text-right">{t('showcaseMockupImportConfidence')}</span>
      </div>
      {rows.map((r) => (
        <div key={r.source} className="grid grid-cols-3 gap-2 items-center p-1.5 rounded bg-white/[0.03] border border-white/5">
          <span className="text-[10px] text-white/60 font-mono truncate">{r.source}</span>
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
      <p className="text-[9px] text-white/30 uppercase tracking-wider">{t('showcaseMockupWifGap')}</p>
      <div className="space-y-1.5">
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <span className="text-[9px] text-white/40 w-16 text-right shrink-0">{b.label}</span>
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
      <p className="text-[9px] text-white/30 uppercase tracking-wider">{t('showcaseMockupQuartileTitle')}</p>
      <div className="space-y-1.5">
        {quartiles.map((q) => (
          <div key={q.label} className="flex items-center gap-2">
            <span className="text-[9px] text-white/40 w-6 shrink-0">{q.label}</span>
            <div className="flex-1 h-4 rounded-full overflow-hidden flex">
              <div className="h-full bg-blue-500/60" style={{ width: `${q.m}%` }} />
              <div className="h-full bg-pink-500/60" style={{ width: `${q.f}%` }} />
            </div>
            <span className="text-[8px] text-white/30 w-12 shrink-0 text-right">{q.m}M/{q.f}F</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 justify-center pt-1">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-blue-500/60" /><span className="text-[8px] text-white/30">Male</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-pink-500/60" /><span className="text-[8px] text-white/30">Female</span></div>
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
      <p className="text-[9px] text-white/30 uppercase tracking-wider">{t('showcaseMockupRemediationTitle')}</p>
      <div className="space-y-1.5">
        {actions.map((a) => (
          <div key={a.action} className="flex items-center justify-between gap-2 p-1.5 rounded bg-white/[0.03] border border-white/5">
            <span className="text-[9px] text-white/60 truncate">{a.action}</span>
            <span className={`text-[8px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${a.statusColor}`}>{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockupReport({ t }: { t: (key: string) => string }) {
  return (
    <div className="p-3 flex flex-col items-center justify-center gap-2 relative">
      <div className="w-full max-w-[140px] bg-white/[0.06] border border-white/10 rounded-lg p-3 relative overflow-hidden">
        <div className="space-y-1.5">
          <div className="h-2 w-3/4 rounded bg-white/10" />
          <div className="h-1.5 w-full rounded bg-white/5" />
          <div className="h-1.5 w-full rounded bg-white/5" />
          <div className="h-1.5 w-2/3 rounded bg-white/5" />
          <div className="h-6 w-full rounded bg-white/[0.04] mt-2" />
          <div className="h-1.5 w-full rounded bg-white/5" />
          <div className="h-1.5 w-5/6 rounded bg-white/5" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-extrabold text-white/[0.08] rotate-[-20deg] tracking-widest">SAMPLE</span>
        </div>
      </div>
      <p className="text-[9px] text-white/30">{t('showcaseMockupReportTitle')}</p>
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
      {/* Cards — horizontal scroll on mobile, centered layout on desktop */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide lg:flex-wrap lg:justify-center lg:overflow-visible lg:pb-0"
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
                snap-center shrink-0 w-[280px] sm:w-[300px] lg:w-[280px] xl:w-[300px]
                rounded-2xl border text-left
                transition-all duration-500 ease-out cursor-pointer
                ${isActive
                  ? 'border-blue-500/40 bg-white/[0.06] scale-[1.02] shadow-[0_0_40px_rgba(99,102,241,0.15)]'
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
                    <Icon size={14} className={isActive ? 'text-blue-400' : 'text-white/40'} />
                  </div>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
                    {card.step}/6
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{t(card.titleKey)}</h3>
                <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{t(card.descKey)}</p>
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
          className="w-9 h-9 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
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
          className="w-9 h-9 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
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
          className={`text-white/40 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96 pb-5 px-6' : 'max-h-0'}`}
      >
        <p className="text-sm text-white/50 leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Intersection observer for fade-in on scroll                       */
/* ------------------------------------------------------------------ */
function useFadeIn() {
  const [ref, setRef] = useState<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref])

  return { setRef, visible }
}

function FadeSection({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const { setRef, visible } = useFadeIn()
  return (
    <div
      ref={setRef}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  UTM helper                                                        */
/* ------------------------------------------------------------------ */
function useUtmParams() {
  const searchParams = useSearchParams()

  return useMemo(() => {
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
    const params = new URLSearchParams()
    keys.forEach((k) => {
      const v = searchParams.get(k)
      if (v) params.set(k, v)
    })
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }, [searchParams])
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */
export default function AdLandingClient() {
  const t = useTranslations('adLanding')
  const tLanding = useTranslations('landing')
  const utm = useUtmParams()

  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const signupHref = `/signup${utm}`
  const bookingHref = `/booking${utm}`

  const testimonials = [
    {
      quoteKey: 'testimonial1Quote' as const,
      nameKey: 'testimonial1Name' as const,
      titleKey: 'testimonial1Title' as const,
      companyKey: 'testimonial1Company' as const,
    },
    {
      quoteKey: 'testimonial2Quote' as const,
      nameKey: 'testimonial2Name' as const,
      titleKey: 'testimonial2Title' as const,
      companyKey: 'testimonial2Company' as const,
    },
    {
      quoteKey: 'testimonial3Quote' as const,
      nameKey: 'testimonial3Name' as const,
      titleKey: 'testimonial3Title' as const,
      companyKey: 'testimonial3Company' as const,
    },
  ]

  const pricingFeatures = [
    'pricingFeature1',
    'pricingFeature2',
    'pricingFeature3',
    'pricingFeature4',
    'pricingFeature5',
    'pricingFeature6',
    'pricingFeature7',
  ] as const

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
      <div
        className="absolute top-0 left-0 w-full h-[800px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top center, rgba(99,102,241,0.15), transparent 70%)',
        }}
      />
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.4), transparent 60%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.3), transparent 60%)',
          filter: 'blur(60px)',
        }}
      />

      {/* ===== STICKY HEADER ===== */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}
        style={{
          background: scrolled ? 'rgba(10, 15, 28, 0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <span className="font-bold text-lg tracking-wide text-white">CompLens</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a
              href={signupHref}
              className="text-sm font-bold text-white px-5 py-2.5 rounded-full transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, var(--color-pl-brand), #7c3aed)',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
              }}
            >
              {t('navCta')}
            </a>
          </div>
        </div>
      </header>

      {/* ===== SECTION 1: HERO ===== */}
      <section className="relative pt-36 sm:pt-44 pb-20 px-6 max-w-5xl mx-auto text-center z-10">
        <FadeSection>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.15] tracking-tight max-w-4xl mx-auto">
            {t('heroHeadline')}{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #f97316, #ef4444)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('heroHeadlineHighlight')}
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-white/60 leading-relaxed max-w-3xl mx-auto">
            {t('heroSubheadline')}
          </p>

          {/* Countdown */}
          <div className="mt-10">
            <CountdownTimer t={t} />
          </div>

          {/* CTA */}
          <div className="mt-10">
            <a
              href={signupHref}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
              style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #6366f1)' }}
            >
              {t('heroCta')}
              <ArrowRight size={18} />
            </a>
          </div>

          {/* Risk reversal */}
          <p className="mt-4 text-xs text-white/40 max-w-lg mx-auto">
            {t('heroRiskReversal')}
          </p>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {[
              { key: 'trustGdpr', icon: ShieldCheck },
              { key: 'trustEuServers', icon: Server },
              { key: 'trustMadeInGermany', icon: MapPin },
            ].map((badge) => (
              <div
                key={badge.key}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/[0.02]"
              >
                <badge.icon size={14} className="text-green-400/70" />
                <span className="text-xs font-medium text-white/50">{t(badge.key)}</span>
              </div>
            ))}
          </div>
        </FadeSection>
      </section>

      {/* ===== SECTION 2: HERO SHOWCASE CAROUSEL ===== */}
      <section className="py-16 sm:py-20 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <FadeSection>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{t('showcaseTitle')}</h2>
              <p className="text-white/50 max-w-xl mx-auto text-sm">{t('showcaseSubtitle')}</p>
            </div>
          </FadeSection>

          <FadeSection>
            <HeroShowcase t={t} />
          </FadeSection>
        </div>
      </section>

      {/* ===== SECTION 3: PROBLEM AGITATION (The 5% Trap) ===== */}
      <section
        className="py-20 sm:py-24 border-y border-white/5 relative z-10"
        style={{ background: 'rgba(0,0,0,0.2)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <FadeSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-white mb-4">{t('problemHeadline')}</h2>
              <p className="text-white/50 max-w-2xl mx-auto">{t('problemSubheadline')}</p>
            </div>
          </FadeSection>

          <FadeSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                { icon: Scale, titleKey: 'problemLegalTitle', textKey: 'problemLegalText', color: 'text-red-400' },
                { icon: DollarSign, titleKey: 'problemFinancialTitle', textKey: 'problemFinancialText', color: 'text-amber-400' },
                { icon: AlertTriangle, titleKey: 'problemReputationalTitle', textKey: 'problemReputationalText', color: 'text-orange-400' },
              ].map((card, i) => (
                <div
                  key={i}
                  className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6">
                    <card.icon size={24} className={card.color} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{t(card.titleKey)}</h3>
                  <p className="text-white/50 leading-relaxed text-sm">{t(card.textKey)}</p>
                </div>
              ))}
            </div>
          </FadeSection>

          {/* 3-step process */}
          <FadeSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[
                { icon: Upload, num: '1', titleKey: 'solutionStep1Title', textKey: 'solutionStep1Text' },
                { icon: BarChart2, num: '2', titleKey: 'solutionStep2Title', textKey: 'solutionStep2Text' },
                { icon: FileSignature, num: '3', titleKey: 'solutionStep3Title', textKey: 'solutionStep3Text' },
              ].map((step, i) => (
                <div
                  key={i}
                  className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative"
                >
                  <div className="absolute top-4 right-4 text-5xl font-extrabold text-white/[0.03]">
                    {step.num}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                    <step.icon size={24} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{t(step.titleKey)}</h3>
                  <p className="text-white/50 leading-relaxed text-sm">{t(step.textKey)}</p>
                </div>
              ))}
            </div>
          </FadeSection>

          <FadeSection>
            <div className="max-w-3xl mx-auto text-center p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
              <Quote size={24} className="text-blue-400/40 mx-auto mb-4" />
              <p className="text-sm text-white/60 leading-relaxed italic">
                {t('problemDirectiveQuote')}
              </p>
              <p className="mt-3 text-xs text-white/30 font-medium">
                {t('problemDirectiveSource')}
              </p>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ===== SECTION 4: FOUNDER STORY ===== */}
      <section className="py-20 sm:py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <FadeSection>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-4">{t('founderHeadline')}</h2>
            </div>
          </FadeSection>

          <FadeSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Photo placeholder */}
              <div className="flex flex-col items-center gap-6">
                <div className="w-40 h-40 rounded-full border-2 border-white/10 bg-white/[0.03] flex items-center justify-center">
                  <Users size={48} className="text-white/10" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{t('founderName')}</p>
                  <p className="text-sm text-white/50 mt-1">{t('founderRole')}</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-base text-white/60 leading-relaxed">{t('founderStory')}</p>

                {/* Video embed placeholder */}
                <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden aspect-video flex items-center justify-center group cursor-pointer hover:border-white/20 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Play size={28} className="text-white ml-1" />
                  </div>
                  <p className="absolute bottom-4 text-xs text-white/30">
                    {t('founderVideoPlay')}
                  </p>
                </div>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ===== SECTION 5: SOCIAL PROOF ===== */}
      <section
        className="py-20 sm:py-24 border-y border-white/5 relative z-10"
        style={{ background: 'rgba(0,0,0,0.2)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <FadeSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-white mb-4">{t('socialProofHeadline')}</h2>
              <p className="text-white/50 max-w-2xl mx-auto">{t('socialProofSubheadline')}</p>
            </div>
          </FadeSection>

          <FadeSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {testimonials.map((testimonial, i) => (
                <div
                  key={i}
                  className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex flex-col"
                >
                  <Quote size={24} className="text-blue-400/40 mb-4" />
                  <p className="text-sm text-white/60 leading-relaxed flex-1 mb-6">
                    {tLanding(testimonial.quoteKey)}
                  </p>
                  <div className="border-t border-white/5 pt-5">
                    <p className="text-sm font-semibold text-white">
                      {tLanding(testimonial.nameKey)}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">{tLanding(testimonial.titleKey)}</p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {tLanding(testimonial.companyKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </FadeSection>

          <FadeSection>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {(['socialProofBadge150', 'socialProofBadge500', 'socialProofBadge1000'] as const).map(
                (key) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/5 bg-white/[0.02]"
                  >
                    <Users size={14} className="text-blue-400/60" />
                    <span className="text-xs font-medium text-white/50">{t(key)}</span>
                  </div>
                )
              )}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ===== SECTION 6: PRICING PREVIEW ===== */}
      <section className="py-20 sm:py-24 relative z-10">
        <div className="max-w-3xl mx-auto px-6">
          <FadeSection>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-4">{t('pricingHeadline')}</h2>
              <p className="text-white/50">{t('pricingSubheadline')}</p>
            </div>

            <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
              <ul className="space-y-3 mb-8">
                {pricingFeatures.map((key) => (
                  <li key={key} className="flex items-start gap-3 text-sm text-white/70">
                    <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
              <a
                href={signupHref}
                className="block w-full py-3.5 rounded-xl text-center text-sm font-bold text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #6366f1)' }}
              >
                {t('pricingCta')}
              </a>
              <p className="mt-4 text-xs text-white/30 text-center">
                {t('pricingTrialNote')}
              </p>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ===== SECTION 7: FAQ ===== */}
      <section
        className="py-20 sm:py-24 border-y border-white/5 relative z-10"
        style={{ background: 'rgba(0,0,0,0.2)' }}
      >
        <div className="max-w-3xl mx-auto px-6">
          <FadeSection>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-4">{t('faqHeadline')}</h2>
            </div>
          </FadeSection>

          <FadeSection>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <FaqItem key={faq.q} question={t(faq.q)} answer={t(faq.a)} />
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ===== SECTION 8: FINAL CTA ===== */}
      <section className="py-20 sm:py-24 relative z-10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeSection>
            <Clock size={32} className="text-blue-400/40 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 leading-tight">
              {t('finalCtaHeadline')}
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={signupHref}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #6366f1)' }}
              >
                {t('finalCtaPrimary')}
                <ArrowRight size={18} />
              </a>
              <a
                href={bookingHref}
                className="px-8 py-4 rounded-full text-base font-medium text-white/80 hover:text-white transition-colors border border-white/10 hover:bg-white/5"
              >
                {t('finalCtaSecondary')}
              </a>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 border-t border-white/5 bg-black/20 text-center relative z-10 px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <a href="/impressum" className="text-xs text-white/40 hover:text-white transition-colors">
            {t('footerImpressum')}
          </a>
          <a href="/datenschutz" className="text-xs text-white/40 hover:text-white transition-colors">
            {t('footerDatenschutz')}
          </a>
          <a href="/agb" className="text-xs text-white/40 hover:text-white transition-colors">
            {t('footerAgb')}
          </a>
        </div>
      </footer>
    </div>
  )
}
