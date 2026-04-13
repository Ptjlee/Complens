'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import {
  ArrowRight,
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
  Check,
  Quote,
  ChevronDown,
  Play,
  Users,
  Clock,
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

  const readinessHref = `/readiness-check${utm}`
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
              href={readinessHref}
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
              href={readinessHref}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
              style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #6366f1)' }}
            >
              {t('heroCta')}
              <ArrowRight size={18} />
            </a>
          </div>

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

      {/* ===== SECTION 2: PROBLEM AGITATION ===== */}
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

      {/* ===== SECTION 3: SOLUTION ===== */}
      <section className="py-20 sm:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <FadeSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-white mb-4">{t('solutionHeadline')}</h2>
              <p className="text-white/50 max-w-2xl mx-auto">{t('solutionSubheadline')}</p>
            </div>
          </FadeSection>

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

          {/* Screenshot placeholder */}
          <FadeSection>
            <div className="max-w-4xl mx-auto rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <div className="aspect-video flex items-center justify-center">
                <div className="text-center">
                  <BarChart2 size={48} className="text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-white/20">{t('solutionScreenshotAlt')}</p>
                </div>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ===== SECTION 4: FOUNDER STORY ===== */}
      <section
        className="py-20 sm:py-24 border-y border-white/5 relative z-10"
        style={{ background: 'rgba(0,0,0,0.2)' }}
      >
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
      <section className="py-20 sm:py-24 relative z-10">
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
      <section
        className="py-20 sm:py-24 border-y border-white/5 relative z-10"
        style={{ background: 'rgba(0,0,0,0.2)' }}
      >
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
                href={readinessHref}
                className="block w-full py-3.5 rounded-xl text-center text-sm font-bold text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #6366f1)' }}
              >
                {t('pricingCta')}
              </a>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ===== SECTION 7: FAQ ===== */}
      <section className="py-20 sm:py-24 relative z-10">
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
      <section
        className="py-20 sm:py-24 border-t border-white/5 relative z-10"
        style={{ background: 'rgba(0,0,0,0.2)' }}
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeSection>
            <Clock size={32} className="text-blue-400/40 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 leading-tight">
              {t('finalCtaHeadline')}
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={readinessHref}
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
