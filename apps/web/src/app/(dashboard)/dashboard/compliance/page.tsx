import { ShieldCheck, Server, Lock, UserCheck, FileText, CheckCircle2 } from 'lucide-react'

export const metadata = { title: 'DSGVO & Compliance — CompLens' }

export default function CompliancePage() {
    return (
        <div className="flex flex-col h-full overflow-auto space-y-6">
            <div className="pb-5 border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            DSGVO & Compliance
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Datenschutz und Sicherheit gemäß europäischen Standards
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                            <Lock className="text-blue-500" size={20} /> Datensicherheit & Verschlüsselung
                        </h2>
                        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Der Schutz Ihrer Gehaltsdaten hat für uns höchste Priorität. Alle in CompLens verarbeiteten Daten werden nach dem Stand der Technik verschlüsselt und sicher verwahrt. Wir erfüllen die strengsten DSGVO-Anforderungen für sensible Personendaten.
                        </p>
                        <ul className="text-sm space-y-3" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                                <span><strong>End-to-End-Verschlüsselung:</strong> Alle Daten auf dem Transportweg (TLS 1.3) und im Ruhezustand (AES-256) sind kryptografisch abgesichert.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                                <span><strong>Anonymisierung:</strong> Echtnamen (sofern hochgeladen) dienen nur der internen Zuordnung durch Sie und können jederzeit durch Pseudonyme / IDs ersetzt werden. Die Berechnungen sind nicht auf persönliche Identifikatoren angewiesen.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                                <span><strong>Regelmäßige Audits:</strong> Unsere Cloud-Infrastruktur unterliegt SOC 2 und ISO 27001 Zertifizierungen.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                            <Server className="text-purple-500" size={20} /> Serverstandort Deutschland
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Die Datenspeicherung und Verarbeitung für CompLens findet ausschließlich auf Servern innerhalb der Europäischen Union statt, bevorzugt mit Standort in Frankfurt am Main, Deutschland. Es findet kein unzulässiger Datentransfer in Drittländer statt. Die verwendeten KI-Modelle werden über europäische Endpunkte bereitgestellt, bei denen Ihre Daten <strong>nicht zum Training</strong> von Modellen verwendet werden.
                        </p>
                    </div>

                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                            <FileText className="text-amber-500" size={20} /> EU-Richtlinie 2023/970
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Unsere Berechnungen und Berichtsexporte wurden in Zusammenarbeit mit Arbeitsrechtsexperten speziell für die Einhaltung der europäischen Anforderungen an Entgelttransparenz entwickelt. Dazu gehören:
                        </p>
                        <ul className="text-sm space-y-2 mt-4 ml-6 list-disc" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            <li>Berechnungsorientierung anhand objektiver Kriterien (WIF - Werte, die als gleichwertig erachtet werden).</li>
                            <li>Ausgabe des bereinigten Median- und Mittelwerts.</li>
                            <li>Automatisierte Warnung bei Überschreitung der 5%-Lücke sowie Plangenerierung.</li>
                            <li>Datenschutzkonformes Auskunftsrecht für Mitarbeitende.</li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-6">
                   <div className="glass-card p-6 border-l-4" style={{ borderColor: 'var(--color-pl-brand)' }}>
                        <ShieldCheck size={32} className="mb-4" style={{ color: 'var(--color-pl-brand)' }} />
                        <h3 className="text-md font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>AV-Vertrag (AVV)</h3>
                        <p className="text-sm mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Gemäß Artikel 28 DSGVO müssen Verantwortliche mit ihren Auftragsverarbeitern einen Vertrag schließen.
                        </p>
                        <button className="btn-primary w-full text-xs py-2">
                            AV-Vertrag anfordern
                        </button>
                   </div>
                   
                   <div className="glass-card p-6">
                       <h3 className="text-md font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>Löschkonzept</h3>
                       <p className="text-sm mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                           Nach Ablauf der vertragsgegenständlichen Nutzung oder auf explizite Anforderung können Sie Datensätze jederzeit restlos aus unserer Datenbank löschen (Hard Delete). Analysen und Reports werden automatisch kaskadierend mitgelöscht.
                       </p>
                   </div>
                   
                   <div className="glass-card p-6">
                       <h3 className="text-md font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>Ihre Betroffenenrechte</h3>
                       <p className="text-sm mb-2" style={{ color: 'var(--color-pl-text-secondary)' }}>
                           Sollten Ihre Angestellten das Recht auf Auskunft geltend machen, finden Sie im Modul <a href="/dashboard/portal" className="text-blue-500 hover:underline">Auskunftsrecht</a> alle notwendigen Tools, um Anfragen DSGVO- und Entgelttransparenz-konform zu bedienen.
                       </p>
                   </div>
                </div>
            </div>
        </div>
    )
}
