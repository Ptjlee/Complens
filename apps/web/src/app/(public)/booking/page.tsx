'use client'

import Link from 'next/link'
import { CalendarDays, CheckCircle2, PlayCircle, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useTranslations } from 'next-intl'

export default function BookingPage() {
    const t = useTranslations('booking')

    return (
        <div className="min-h-screen bg-[#0c0f1a]">
            {/* Header */}
            <header className="border-b border-[#1e2336] bg-[#0c0f1a]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo size={32} />
                        <span className="text-lg font-bold text-white tracking-tight">CompLens</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <div className="flex items-center gap-2 text-sm text-[#4ade80] bg-[#142323] px-3 py-1.5 rounded-full border border-[#1b3a31]">
                            <CheckCircle2 size={16} /> {t('requestApproved')}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-12 lg:py-20 grid lg:grid-cols-2 gap-12 lg:gap-20">
                {/* Left Col: VSL / Education */}
                <div className="space-y-8">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-4">
                            {t('heroTitle')}
                        </h1>
                        <p className="text-lg text-[#a1a1aa] leading-relaxed"
                           dangerouslySetInnerHTML={{ __html: t('heroDescription') }}
                        />
                    </div>

                    {/* VSL Video Placeholder */}
                    <div className="aspect-video bg-[#141829] rounded-2xl border border-[#1e2336] shadow-xl overflow-hidden relative group">
                        <img
                            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=2000"
                            alt="Briefing Cover"
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-300"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                            <button className="w-16 h-16 bg-[#5b61ff] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(91,97,255,0.4)] group-hover:scale-110 transition-transform duration-300">
                                <PlayCircle size={32} className="text-white ml-1" />
                            </button>
                            <span className="text-white font-medium mt-4">{t('videoCta')}</span>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="bg-[#141829] p-5 rounded-2xl border border-[#1e2336]">
                            <ShieldCheck size={28} className="text-[#5b61ff] mb-3" />
                            <h3 className="font-semibold text-white mb-2">{t('featureAutomatedMappingTitle')}</h3>
                            <p className="text-sm text-[#a1a1aa]">{t('featureAutomatedMappingDesc')}</p>
                        </div>
                        <div className="bg-[#141829] p-5 rounded-2xl border border-[#1e2336]">
                            <CalendarDays size={28} className="text-[#5b61ff] mb-3" />
                            <h3 className="font-semibold text-white mb-2">{t('featureDeadlineTitle')}</h3>
                            <p className="text-sm text-[#a1a1aa]">{t('featureDeadlineDesc')}</p>
                        </div>
                    </div>
                </div>

                {/* Right Col: Booking Widget */}
                <div className="bg-[#141829] rounded-3xl border border-[#1e2336] shadow-2xl overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-[#1e2336]">
                        <h2 className="text-xl font-bold text-white mb-2">{t('calendarTitle')}</h2>
                        <p className="text-sm text-[#a1a1aa]">{t('calendarDescription')}</p>
                    </div>

                    <div className="flex-1 p-8 flex items-center justify-center bg-[#070911]">
                        {/* Placeholder for Calendly / Cal.com iframe */}
                        <div className="text-center max-w-sm">
                            <CalendarDays size={48} className="text-[#383d54] mx-auto mb-4" />
                            <h3 className="text-[#a1a1aa] font-medium mb-4">{t('calendarLoading')}</h3>
                            <p className="text-xs text-[#6e7185] mb-6">
                                {t('calendarPlaceholder')}
                            </p>
                            <a
                                href="mailto:hallo@complens.de?subject=Demo%20Buchungsanfrage"
                                className="inline-block w-full bg-[#1e2336] hover:bg-[#2a3045] text-white font-medium py-3 rounded-xl transition-colors"
                            >
                                {t('contactSales')}
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
