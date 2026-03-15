import { HelpCircle, Book, MessageSquare, Mail, PlayCircle, ExternalLink } from 'lucide-react'

export const metadata = { title: 'Hilfe & Handbuch — CompLens' }

export default function HelpPage() {
    return (
        <div className="flex flex-col h-full overflow-auto space-y-6">
            <div className="pb-5 border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Hilfe & Handbuch
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Ressourcen, FAQ und Support-Zugang für CompLens
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Getting started card */}
                <div className="glass-card p-6 flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white mb-2" style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #6366f1)', boxShadow: '0 8px 20px rgba(99,102,241,0.25)' }}>
                        <PlayCircle size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>1. Erste Schritte</h2>
                        <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>Wie Sie CompLens optimal einrichten und Ihren ersten Gehaltsdatensatz fehlerfrei hochladen.</p>
                    </div>
                    <ul className="text-sm mt-auto space-y-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        <li><a href="#" className="hover:text-blue-500 hover:underline flex items-center gap-1">Datensatz vorbereiten <ExternalLink size={12} /></a></li>
                        <li><a href="#" className="hover:text-blue-500 hover:underline flex items-center gap-1">CSV-Vorlagen herunterladen <ExternalLink size={12} /></a></li>
                        <li><a href="#" className="hover:text-blue-500 hover:underline flex items-center gap-1">Erste Analyse starten <ExternalLink size={12} /></a></li>
                    </ul>
                </div>

                {/* Analysis & Explanations */}
                <div className="glass-card p-6 flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white mb-2" style={{ background: 'linear-gradient(135deg, var(--color-pl-amber), #fb923c)', boxShadow: '0 8px 20px rgba(251,146,60,0.25)' }}>
                        <Book size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>2. Analysen & Maßnahmen</h2>
                        <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>Ergebnisse richtig interpretieren und Ausnahmefälle plausibel begründen.</p>
                    </div>
                    <ul className="text-sm mt-auto space-y-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        <li><a href="#" className="hover:text-orange-500 hover:underline flex items-center gap-1">Unbereinigt vs Bereinigt <ExternalLink size={12} /></a></li>
                        <li><a href="#" className="hover:text-orange-500 hover:underline flex items-center gap-1">Begründungen nach DSGVO erfassen <ExternalLink size={12} /></a></li>
                        <li><a href="#" className="hover:text-orange-500 hover:underline flex items-center gap-1">Maßnahmenpläne der KI prüfen <ExternalLink size={12} /></a></li>
                    </ul>
                </div>

                {/* FAQ Support */}
                 <div className="glass-card p-6 flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white mb-2" style={{ background: 'linear-gradient(135deg, var(--color-pl-green), #10b981)', boxShadow: '0 8px 20px rgba(16,185,129,0.25)' }}>
                        <MessageSquare size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>3. FAQ & Häufige Fragen</h2>
                        <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>Schnelle Antworten auf die häufigsten Nutzerfragen und Workarounds.</p>
                    </div>
                    <ul className="text-sm mt-auto space-y-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        <li><a href="#" className="hover:text-emerald-500 hover:underline flex items-center gap-1">Was bedeutet "objektive Wertigkeit" (WIF)? <ExternalLink size={12} /></a></li>
                        <li><a href="#" className="hover:text-emerald-500 hover:underline flex items-center gap-1">Mein Datensatz wird abgewiesen? <ExternalLink size={12} /></a></li>
                        <li><a href="#" className="hover:text-emerald-500 hover:underline flex items-center gap-1">Auskunftsrecht: Prozess in CompLens <ExternalLink size={12} /></a></li>
                    </ul>
                </div>
            </div>

            <div className="mt-8 glass-card p-8 flex flex-col items-center justify-center text-center">
                <Mail size={48} className="mb-4" style={{ color: 'var(--color-pl-brand)' }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>Brauchen Sie persönliche Hilfe?</h3>
                <p className="text-sm mb-6 max-w-lg" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    Unser CompLens-Support-Team steht Ihnen werktags zwischen 09:00 und 17:00 Uhr zur Verfügung. Bei technischen Fragestellungen oder rechtlichen Verständnisfragen zur Richtlinie 2023/970 helfen wir gerne weiter.
                </p>
                
                <a 
                    href="mailto:hallo@paylens.de" 
                    className="flex justify-center items-center gap-2 font-bold text-white px-6 py-3 rounded-lg transition-transform hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, var(--color-pl-brand), #6366f1)', boxShadow: '0 8px 20px rgba(99,102,241,0.25)' }}
                >
                    <Mail size={18} /> Support kontaktieren
                </a>
            </div>

        </div>
    )
}
