'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, CheckCircle, BarChart2, Shield, Upload, FileSignature, Send, Loader2 } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function LandingClient() {
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
                        <a href="/login" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                            Login
                        </a>
                        <a href="/signup" className="text-sm font-bold text-white px-5 py-2.5 rounded-full transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #7c3aed)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
                            Kostenlos starten
                        </a>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1 space-y-8 z-10 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 mb-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        Bereit für die EU-Richtlinie 2023/970
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
                        Pay Transparency. <br />
                        <span style={{ background: 'linear-gradient(135deg, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            So einfach kann's sein.
                        </span>
                    </h1>
                    <p className="text-lg text-white/60 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                        Erfüllen Sie die EU-Meldepflicht in unter 5 Minuten. Automatisierte Analysen, bereinigter Gender Pay Gap (WIF) und fertige Vorstands-Berichte — 100% DSGVO-konform.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
                        <a href="/signup" className="flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                            style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #6366f1)' }}>
                            Jetzt testen
                            <ArrowRight size={18} />
                        </a>
                        <a href="#contact" className="px-8 py-4 rounded-full text-base font-medium text-white/80 hover:text-white transition-colors border border-white/10 hover:bg-white/5">
                            Live Demo buchen
                        </a>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap items-center lg:items-start gap-x-6 gap-y-3 justify-center lg:justify-start pt-4 text-sm text-white/50 font-medium">
                        <span className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto"><CheckCircle size={16} className="text-green-400 shrink-0" /> Daten ausschließlich auf EU-Servern in Frankfurt</span>
                        <span className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto"><CheckCircle size={16} className="text-green-400 shrink-0" /> EU-Richtlinie 2023/970/EU — vollständig konform</span>
                        <span className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto"><CheckCircle size={16} className="text-green-400 shrink-0" /> Erste Analyse in unter 5 Minuten</span>
                        <span className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto"><CheckCircle size={16} className="text-green-400 shrink-0" /> KI-gestützte Spaltenzuordnung (optional, DSGVO-sicher)</span>
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
                                <span className="text-sm font-semibold text-white">Analyse 2026</span>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">Exzellent</div>
                        </div>
                        {/* Fake Dashboard Content */}
                        <div className="p-6 space-y-6">
                            <div className="flex items-baseline justify-between">
                                <span className="text-xs text-white/50 uppercase tracking-widest font-semibold">Gender Pay Gap (Bereinigt)</span>
                                <span className="text-xs text-white/40">vs. Vorjahr: <span className="text-green-400">-1.2%</span></span>
                            </div>
                            <div className="flex gap-8">
                                <div>
                                    <div className="text-4xl font-light text-white tracking-tight">2.4%</div>
                                    <div className="text-xs text-white/40 mt-1">Median, Bruttostundenverdienst</div>
                                </div>
                                <div className="h-12 w-1 border-r border-white/10" />
                                <div>
                                    <div className="text-4xl font-light text-white tracking-tight">3.1%</div>
                                    <div className="text-xs text-white/40 mt-1">Mittelwert</div>
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
                                    <FileSignature size={16} /> Berichte generieren
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
                        <h2 className="text-3xl font-bold text-white mb-4">Ein Workflow, der HR entlastet</h2>
                        <p className="text-white/50 max-w-2xl mx-auto">Vergessen Sie Excel-Chaos und unklare Formeln. CompLens automatisiert den kompletten EU-Reporting-Prozess von A bis Z.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: Upload, title: '1. Sicherer Import', text: 'CSV hochladen, KI sortiert automatisch die Lohnspalten zu. Ohne Namen hochladbar.' },
                            { icon: BarChart2, title: '2. Smarte Analyse', text: 'Bereinigt Gehaltslücken objektiv über WIF-Faktoren (Wage Influencing Factors).' },
                            { icon: FileSignature, title: '3. Fertige Exports', text: '1-Klick Export von PDF & Vorstands-Präsentationen (PowerPoint).' }
                        ].map((F, i) => (
                            <div key={i} className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <F.icon size={24} className="text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{F.title}</h3>
                                <p className="text-white/50 leading-relaxed text-sm">{F.text}</p>
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
                            <h2 className="text-3xl font-bold text-white mb-4">Fragen? Wir helfen gerne weiter.</h2>
                            <p className="text-white/60">Unser Experte meldet sich noch am selben Tag bei Ihnen.</p>
                        </div>
                        
                        {!contactDone ? (
                            <form onSubmit={handleContact} className="max-w-xl mx-auto space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-white/50 ml-1">Name</label>
                                        <input name="name" required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="Max Mustermann" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-white/50 ml-1">Firma</label>
                                        <input name="company" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="Muster GmbH" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/50 ml-1">E-Mail Adresse</label>
                                    <input name="email" required type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="max@firma.de" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/50 ml-1">Ihre Nachricht</label>
                                    <textarea name="message" required rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none" placeholder="Wie können wir Ihnen weiterhelfen?" />
                                </div>
                                <button disabled={contacting} type="submit" className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #6366f1)', boxShadow: '0 8px 20px rgba(99,102,241,0.25)' }}>
                                    {contacting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Nachricht senden</>}
                                </button>
                            </form>
                        ) : (
                            <div className="max-w-xl mx-auto py-12 text-center bg-white/5 rounded-2xl border border-white/10">
                                <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Vielen Dank für Ihre Nachricht!</h3>
                                <p className="text-white/60 text-sm">Wir haben Ihre Anfrage erhalten und melden uns in Kürze bei Ihnen.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <footer className="py-8 border-t border-white/5 bg-black/20 text-center relative z-10 px-4">
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-4">
                    <a href="/impressum" className="text-xs text-white/40 hover:text-white transition-colors">Impressum</a>
                    <a href="/compliance" className="text-xs text-white/40 hover:text-white transition-colors">AI & Compliance</a>
                    <a href="/datenschutz" className="text-xs text-white/40 hover:text-white transition-colors">Datenschutz</a>
                    <a href="/agb" className="text-xs text-white/40 hover:text-white transition-colors">AGB</a>
                </div>
                <p className="text-xs text-white/30">
                    © {new Date().getFullYear()} DexterBee GmbH. Made with ♥ in Germany.
                </p>
            </footer>
        </div>
    )
}
