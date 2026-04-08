'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, CheckCircle, BarChart2, Shield, Upload, FileSignature, Send, Loader2, Check, Quote, Globe, Server, ShieldCheck, MapPin } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export default function LandingClient() {
    const t = useTranslations('landing')
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

    const features = [
        { icon: Upload, titleKey: 'feature1Title' as const, textKey: 'feature1Text' as const },
        { icon: BarChart2, titleKey: 'feature2Title' as const, textKey: 'feature2Text' as const },
        { icon: FileSignature, titleKey: 'feature3Title' as const, textKey: 'feature3Text' as const }
    ]

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
                        <a href="/readiness-check" className="text-sm font-bold text-white px-5 py-2.5 rounded-full transition-all hover:scale-105"
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
                        <a href="/readiness-check" className="flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
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

            {/* Features Showcase Strip */}
            <section id="demo-showcase" className="py-24 border-y border-white/5 relative z-10" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">{t('featuresHeadline')}</h2>
                        <p className="text-white/50 max-w-2xl mx-auto">{t('featuresSubheadline')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((F, i) => (
                            <div key={i} className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <F.icon size={24} className="text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{t(F.titleKey)}</h3>
                                <p className="text-white/50 leading-relaxed text-sm">{t(F.textKey)}</p>
                            </div>
                        ))}
                    </div>
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
                                <a href="/readiness-check"
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

                    {/* Cost comparison note */}
                    <div className="max-w-3xl mx-auto mt-12 text-center">
                        <p className="text-sm text-white/40 leading-relaxed italic">{t('pricingComparison')}</p>
                    </div>
                </div>
            </section>

            {/* Social Proof / Testimonials Section */}
            <section className="py-24 border-y border-white/5 relative z-10" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">{t('testimonialsHeadline')}</h2>
                        <p className="text-white/50 max-w-2xl mx-auto">{t('testimonialsSubheadline')}</p>
                    </div>

                    {/* Testimonial Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {([
                            { quoteKey: 'testimonial1Quote', nameKey: 'testimonial1Name', titleKey: 'testimonial1Title', companyKey: 'testimonial1Company' },
                            { quoteKey: 'testimonial2Quote', nameKey: 'testimonial2Name', titleKey: 'testimonial2Title', companyKey: 'testimonial2Company' },
                            { quoteKey: 'testimonial3Quote', nameKey: 'testimonial3Name', titleKey: 'testimonial3Title', companyKey: 'testimonial3Company' }
                        ] as const).map((testimonial, i) => (
                            <div key={i} className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex flex-col">
                                <Quote size={24} className="text-blue-400/40 mb-4" />
                                <p className="text-sm text-white/60 leading-relaxed flex-1 mb-6">
                                    {t(testimonial.quoteKey)}
                                </p>
                                <div className="border-t border-white/5 pt-5">
                                    <p className="text-sm font-semibold text-white">{t(testimonial.nameKey)}</p>
                                    <p className="text-xs text-white/50 mt-0.5">{t(testimonial.titleKey)}</p>
                                    <p className="text-xs text-white/30 mt-0.5">{t(testimonial.companyKey)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        {([
                            { key: 'trustBadgeGdpr' as const, icon: ShieldCheck },
                            { key: 'trustBadgeEuServers' as const, icon: Server },
                            { key: 'trustBadgeSoc2' as const, icon: Shield },
                            { key: 'trustBadgeMadeInGermany' as const, icon: MapPin }
                        ]).map((badge) => (
                            <div key={badge.key} className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/5 bg-white/[0.02]">
                                <badge.icon size={16} className="text-blue-400/60" />
                                <span className="text-xs font-medium text-white/50">{t(badge.key)}</span>
                            </div>
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

            <footer className="py-8 border-t border-white/5 bg-black/20 text-center relative z-10 px-4">
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-4">
                    <a href="/impressum" className="text-xs text-white/40 hover:text-white transition-colors">{t('footerImpressum')}</a>
                    <a href="/compliance" className="text-xs text-white/40 hover:text-white transition-colors">{t('footerCompliance')}</a>
                    <a href="/datenschutz" className="text-xs text-white/40 hover:text-white transition-colors">{t('footerDatenschutz')}</a>
                    <a href="/agb" className="text-xs text-white/40 hover:text-white transition-colors">{t('footerAgb')}</a>
                </div>
                <p className="text-xs text-white/30">
                    {t('footerCopyright', { year: new Date().getFullYear() })}
                </p>
            </footer>
        </div>
    )
}
