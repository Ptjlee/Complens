'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function ReadinessCheckPage() {
    return (
        <div className="min-h-screen bg-[#0c0f1a] font-sans">
            {/* Header */}
            <header className="border-b border-[#1e2336] bg-[#0c0f1a]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo size={32} />
                        <span className="text-lg font-bold text-white tracking-tight">CompLens</span>
                    </Link>
                    <Link 
                        href="/apply" 
                        className="text-sm font-medium text-white bg-[#5b61ff] hover:bg-[#4a50e6] px-4 py-2 rounded-lg transition-colors"
                    >
                        Prüfung starten
                    </Link>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative py-20 lg:py-32 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#5b61ff]/20 blur-[120px] rounded-full pointer-events-none" />
                    
                    <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-red-500 text-sm font-medium mb-8">
                            <ShieldAlert size={16} />
                            Stichtag: Beweislastumkehr
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                            Riskiert Ihr Gender Pay Gap eine <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-[#5b61ff]">gemeinsame Entgeltbewertung?</span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-[#a1a1aa] mb-10 max-w-2xl mx-auto leading-relaxed">
                            Mit der neuen EU-Entgelttransparenzrichtlinie löst ein unbereinigter Gap von über 5% massive finanzielle Risiken aus und kehrt die Beweislast zum Arbeitgeber um.
                        </p>

                        <Link 
                            href="/apply"
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#5b61ff] to-[#7b81ff] text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-[0_0_40px_rgba(91,97,255,0.4)] hover:scale-105 transition-transform duration-300"
                        >
                            Kostenlosen Readiness Check starten <ArrowRight size={20} />
                        </Link>
                        <p className="mt-4 text-sm text-[#6e7185]">Sichere, sofortige Berechnung basierend auf Ihren anonymisierten Daten.</p>
                    </div>
                </section>

                {/* Features / Details */}
                <section className="py-20 bg-[#111523] border-t border-[#1e2336]">
                    <div className="max-w-7xl mx-auto px-4 lg:px-8">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="p-8 bg-[#0c0f1a] rounded-2xl border border-[#1e2336]">
                                <div className="w-12 h-12 bg-[#1e2336] rounded-xl flex items-center justify-center mb-6">
                                    <BarChart3 className="text-[#5b61ff]" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Sofortige Berechnung</h3>
                                <p className="text-[#a1a1aa] text-sm leading-relaxed">
                                    Laden Sie einen Auszug Ihrer Daten hoch oder verbinden Sie SAP/Workday. Unsere KI harmonisiert Jobtitel und berechnet sofort Ihren aktuellen Gap.
                                </p>
                            </div>
                            
                            <div className="p-8 bg-[#0c0f1a] rounded-2xl border border-[#1e2336]">
                                <div className="w-12 h-12 bg-[#1e2336] rounded-xl flex items-center justify-center mb-6">
                                    <ShieldAlert className="text-red-500" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Risikoanalyse</h3>
                                <p className="text-[#a1a1aa] text-sm leading-relaxed">
                                    Finden Sie genau heraus, wie nah Sie der kritischen 5%-Grenze sind – aufgeschlüsselt in Festgehalt und variable Vergütung.
                                </p>
                            </div>

                            <div className="p-8 bg-[#0c0f1a] rounded-2xl border border-[#1e2336] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5b61ff]/10 blur-[40px]" />
                                <div className="w-12 h-12 bg-[#1e2336] rounded-xl flex items-center justify-center mb-6 relative z-10">
                                    <CheckCircle2 className="text-[#4ade80]" size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 relative z-10">Vorstandsbericht</h3>
                                <p className="text-[#a1a1aa] text-sm leading-relaxed relative z-10">
                                    Erhalten Sie eine strukturierte Zusammenfassung für den Vostand, die zeigt, welcher Anpassungsbedarf vor der Meldung besteht.
                                </p>
                            </div>
                        </div>

                        <div className="mt-20 text-center">
                            <p className="text-2xl font-semibold text-white mb-6">Entwickelt von HR-Experten für HR-Leader.</p>
                            <Link href="/apply" className="inline-block text-[#5b61ff] font-medium hover:underline">
                                Starten Sie jetzt Ihre Anfrage &rarr;
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
