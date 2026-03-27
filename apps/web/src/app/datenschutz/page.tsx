import type { Metadata } from 'next'
import Link from 'next/link'

import BackButton from '@/components/BackButton'
import { Logo } from '@/components/ui/Logo'

export const metadata: Metadata = {
    title: 'Datenschutzerklärung — CompLens',
    description: 'Datenschutzerklärung der DexterBee GmbH für CompLens gemäß DSGVO Art. 13.',
}

export default function DatenschutzPage() {
    return (
        <div className="min-h-screen" style={{ background: 'var(--color-pl-bg)' }}>
            <div className="max-w-3xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="mb-10">
                    <BackButton />
                    <a href="https://complens.de" className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity" style={{ textDecoration: 'none' }}>
                        <Logo size={32} />
                        <span className="font-bold text-xl" style={{ color: 'var(--color-pl-text-primary)' }}>CompLens</span>
                    </a>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                        Datenschutzerklärung
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Stand: März 2026 · Gemäß DSGVO Art. 13
                    </p>
                </div>

                <div className="space-y-8 text-sm" style={{ color: 'var(--color-pl-text-secondary)', lineHeight: 1.8 }}>

                    <Section title="1. Verantwortlicher">
                        <p>Verantwortlicher im Sinne der DSGVO ist:</p>
                        <div className="mt-2 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-pl-border)' }}>
                            <p><strong style={{ color: 'var(--color-pl-text-primary)' }}>DexterBee GmbH</strong></p>
                            <p>Industriestr. 13</p>
                            <p>63755 Alzenau, Deutschland</p>
                            <p className="mt-1">E-Mail: hallo@complens.de</p>
                        </div>
                    </Section>

                    <Section title="2. Verarbeitete Daten und Zwecke">
                        <p className="mb-2">Wir verarbeiten folgende Kategorien personenbezogener Daten:</p>
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Datenkategorie</th>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Zweck</th>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Rechtsgrundlage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['E-Mail-Adresse, Passwort-Hash', 'Authentifizierung', 'Art. 6 Abs. 1 lit. b DSGVO'],
                                    ['Unternehmensname', 'Vertragserfüllung', 'Art. 6 Abs. 1 lit. b DSGVO'],
                                    ['Gehaltsdaten der Mitarbeitenden', 'Entgeltlückenanalyse (Auftragsverarbeitung)', 'Art. 6 Abs. 1 lit. c, Art. 28 DSGVO'],
                                    ['Server-Logs (IP, Zeitstempel)', 'Sicherheit und Fehleranalyse', 'Art. 6 Abs. 1 lit. f DSGVO'],
                                ].map(([cat, purpose, basis]) => (
                                    <tr key={cat}>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{cat}</td>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{purpose}</td>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{basis}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Section>

                    <Section title="3. Datenspeicherung und -löschung">
                        <p>Alle Daten werden ausschließlich auf Servern innerhalb der EU (Frankfurt am Main,
                        Deutschland) bei Supabase gespeichert. Gehaltsdaten werden nach Ablauf der
                        vertraglich vereinbarten Aufbewahrungsfrist (Standard: 3 Jahre) automatisch
                        gelöscht. Kontodaten werden nach Kündigung des Vertrages innerhalb von 30 Tagen
                        gelöscht.</p>
                    </Section>

                    <Section title="4. Auftragsverarbeitung (AVV)">
                        <p>CompLens verarbeitet personenbezogene Daten Ihrer Mitarbeitenden ausschließlich
                        im Auftrag Ihres Unternehmens. Ein Auftragsverarbeitungsvertrag (AVV) gemäß
                        Art. 28 DSGVO wird auf Anfrage unter hallo@complens.de bereitgestellt.
                        Ohne gültigen AVV darf CompLens keine Mitarbeiterdaten verarbeiten.</p>
                    </Section>

                    <Section title="5. KI-Verarbeitung (optional)">
                        <p>Die KI-gestützte Spaltenzuordnung (Google Gemini) ist optional und erfordert
                        Ihre ausdrückliche Einwilligung (DSGVO Art. 6 Abs. 1 lit. a). Die Daten werden
                        vor der Übertragung anonymisiert — es werden ausschließlich Spaltenüberschriften,
                        niemals Gehaltsdaten oder Personennamen übermittelt. Die Einwilligung kann
                        jederzeit widerrufen werden.</p>
                    </Section>

                    <Section title="6. Ihre Rechte">
                        <p>Sie haben folgende Rechte gemäß DSGVO:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17)</li>
                            <li>Einschränkung der Verarbeitung (Art. 18)</li>
                            <li>Datenübertragbarkeit (Art. 20)</li>
                            <li>Widerspruch (Art. 21)</li>
                            <li>Beschwerderecht bei der zuständigen Datenschutzbehörde</li>
                        </ul>
                        <p className="mt-2">Zuständige Aufsichtsbehörde: Der Hessische Beauftragte für Datenschutz und Informationsfreiheit (HBDI)</p>
                    </Section>

                    <Section title="7. Cookies">
                        <p>CompLens verwendet ausschließlich technisch notwendige Cookies für die
                        Sitzungsverwaltung (Supabase Auth). Es werden keine Tracking- oder
                        Marketing-Cookies eingesetzt. Es ist keine Cookie-Einwilligung erforderlich.</p>
                    </Section>

                    <div className="mt-10 pt-6 border-t text-xs" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}>
                        <p>Bei Fragen zum Datenschutz wenden Sie sich an: hallo@complens.de</p>
                        <div className="flex gap-4">
                            <Link href="/impressum" style={{ color: 'var(--color-pl-brand-light)' }}>Impressum</Link>
                            <Link href="/agb" style={{ color: 'var(--color-pl-brand-light)' }}>AGB</Link>
                            <Link href="/compliance" style={{ color: 'var(--color-pl-brand-light)' }}>AI & Compliance</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 className="text-base font-bold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>
                {title}
            </h2>
            <div>{children}</div>
        </div>
    )
}
