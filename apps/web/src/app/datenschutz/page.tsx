import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'

import BackButton from '@/components/BackButton'
import { Logo } from '@/components/ui/Logo'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export async function generateMetadata(): Promise<Metadata> {
    const store = await cookies()
    const locale = store.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'de'

    return locale === 'en'
        ? {
            title: 'Privacy Policy — CompLens',
            description: 'Privacy Policy of DexterBee GmbH for CompLens pursuant to GDPR Art. 13.',
        }
        : {
            title: 'Datenschutzerklärung — CompLens',
            description: 'Datenschutzerklärung der DexterBee GmbH für CompLens gemäß DSGVO Art. 13.',
        }
}

export default async function DatenschutzPage() {
    const store = await cookies()
    const locale = store.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'de'

    if (locale === 'en') return <EnglishVersion />
    return <GermanVersion />
}

/* ─── German Version (original) ──────────────────────────────────────── */

function GermanVersion() {
    return (
        <div className="min-h-screen" style={{ background: 'var(--color-pl-bg)' }}>
            <div className="max-w-3xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <BackButton />
                        <LanguageSwitcher />
                    </div>
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
                        Ohne gültigen AVV darf CompLens keine Mitarbeiterdaten verarbeiten.
                        Unsere vollständigen Technischen und Organisatorischen Maßnahmen (TOMs) finden Sie unter{' '}
                        <Link href="/toms" style={{ color: 'var(--color-pl-brand-light)' }}>complens.de/toms</Link>.</p>
                    </Section>

                    <Section title="5. KI-Verarbeitung &amp; Unterauftragsverarbeiter">
                        <p className="mb-3">CompLens setzt Google Gemini (Google Ireland Ltd.) als KI-Modell für
                        folgende Verarbeitungstätigkeiten ein:</p>
                        <table className="w-full text-xs border-collapse mb-3">
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Verarbeitungstätigkeit</th>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Übermittelte Datenkategorien</th>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Rechtsgrundlage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['Automatische Spaltenzuordnung', 'Spaltenüberschriften, max. 5 anonymisierte Beispielwerte pro Spalte', 'Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)'],
                                    ['Chatbot / Erklärungen', 'Aggregierte Analyseergebnisse, pseudonymisierte Mitarbeiter-IDs (keine Namen)', 'Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)'],
                                    ['Narrative Berichte', 'Aggregierte Kennzahlen (Gap-Werte, Kohorten-Statistiken)', 'Art. 6 Abs. 1 lit. b DSGVO'],
                                    ['Support-Triage', 'Support-Nachrichtentext (keine Gehaltsdaten)', 'Art. 6 Abs. 1 lit. f DSGVO'],
                                    ['E-Mail-Textoptimierung', 'Vom Nutzer eingegebener E-Mail-Entwurf', 'Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)'],
                                ].map(([activity, data, basis]) => (
                                    <tr key={activity}>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{activity}</td>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{data}</td>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{basis}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="mb-2"><strong style={{ color: 'var(--color-pl-text-primary)' }}>Unterauftragsverarbeiter:</strong> Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.
                        Die Verarbeitung erfolgt auf Grundlage eines Auftragsverarbeitungsvertrags gem. Art. 28 DSGVO mit Google.
                        Google speichert API-Anfragen nicht für das Training eigener Modelle (Google Cloud Data Processing Addendum).</p>
                        <p className="mb-2"><strong style={{ color: 'var(--color-pl-text-primary)' }}>Pseudonymisierung:</strong> Mitarbeiter-IDs können an Gemini übermittelt werden; Vor- und Nachnamen werden <strong>niemals</strong> übermittelt.
                        Die Zuordnung von IDs zu natürlichen Personen ist für Google nicht möglich.</p>
                        <p>Einwilligungsbasierte Verarbeitungen (Spaltenzuordnung, E-Mail-Optimierung) können
                        jederzeit widerrufen werden. Die übrigen Verarbeitungen sind für die Vertragserfüllung
                        bzw. das berechtigte Interesse erforderlich.</p>
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

                    <Section title="7. Cookies &amp; Geräte-Fingerprinting">
                        <p>CompLens verwendet ausschließlich technisch notwendige Cookies für die
                        Sitzungsverwaltung (Supabase Auth). Es werden keine Tracking- oder
                        Marketing-Cookies eingesetzt.</p>
                        <p className="mt-2">Nach Erteilung der Cookie-Einwilligung wird ein Geräte-Fingerprint
                        (gehashte Kombination aus Browser-Typ, Bildschirmauflösung, Zeitzone, Sprache,
                        Plattform, CPU-Kerne und Touch-Punkte) erstellt und als SHA-256-Hash gespeichert.
                        Dieser dient ausschließlich der Erkennung vertrauenswürdiger Geräte (max. 3 pro Nutzer)
                        und wird nicht an Dritte weitergegeben. Ohne Cookie-Einwilligung erfolgt kein Fingerprinting.</p>
                    </Section>

                    <div className="mt-10 pt-6 border-t text-xs" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}>
                        <p>Bei Fragen zum Datenschutz wenden Sie sich an: hallo@complens.de</p>
                        <div className="flex gap-4">
                            <Link href="/impressum" style={{ color: 'var(--color-pl-brand-light)' }}>Impressum</Link>
                            <Link href="/agb" style={{ color: 'var(--color-pl-brand-light)' }}>AGB</Link>
                            <Link href="/toms" style={{ color: 'var(--color-pl-brand-light)' }}>TOMs</Link>
                            <Link href="/compliance" style={{ color: 'var(--color-pl-brand-light)' }}>AI & Compliance</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─── English Version ────────────────────────────────────────────────── */

function EnglishVersion() {
    return (
        <div className="min-h-screen" style={{ background: 'var(--color-pl-bg)' }}>
            <div className="max-w-3xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <BackButton />
                        <LanguageSwitcher />
                    </div>
                    <a href="https://complens.de" className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity" style={{ textDecoration: 'none' }}>
                        <Logo size={32} />
                        <span className="font-bold text-xl" style={{ color: 'var(--color-pl-text-primary)' }}>CompLens</span>
                    </a>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                        Privacy Policy
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        As of: March 2026 · Pursuant to GDPR Art. 13
                    </p>
                </div>

                <div className="space-y-8 text-sm" style={{ color: 'var(--color-pl-text-secondary)', lineHeight: 1.8 }}>

                    <Section title="1. Controller">
                        <p>The controller within the meaning of the GDPR is:</p>
                        <div className="mt-2 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-pl-border)' }}>
                            <p><strong style={{ color: 'var(--color-pl-text-primary)' }}>DexterBee GmbH</strong></p>
                            <p>Industriestr. 13</p>
                            <p>63755 Alzenau, Germany</p>
                            <p className="mt-1">Email: hallo@complens.de</p>
                        </div>
                    </Section>

                    <Section title="2. Processed Data and Purposes">
                        <p className="mb-2">We process the following categories of personal data:</p>
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Data Category</th>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Purpose</th>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Legal Basis</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['Email address, password hash', 'Authentication', 'Art. 6(1)(b) GDPR'],
                                    ['Company name', 'Contract fulfilment', 'Art. 6(1)(b) GDPR'],
                                    ['Employee salary data', 'Pay gap analysis (data processing on behalf)', 'Art. 6(1)(c), Art. 28 GDPR'],
                                    ['Server logs (IP, timestamp)', 'Security and error analysis', 'Art. 6(1)(f) GDPR'],
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

                    <Section title="3. Data Storage and Deletion">
                        <p>All data is stored exclusively on servers within the EU (Frankfurt am Main,
                        Germany) hosted by Supabase. Salary data is automatically deleted after the
                        contractually agreed retention period (default: 3 years). Account data is
                        deleted within 30 days following termination of the contract.</p>
                    </Section>

                    <Section title="4. Data Processing Agreement (DPA)">
                        <p>CompLens processes personal data of your employees exclusively on behalf
                        of your organisation. A Data Processing Agreement (DPA) pursuant to
                        Art. 28 GDPR is available upon request at hallo@complens.de.
                        Without a valid DPA, CompLens may not process any employee data.
                        Our full Technical and Organisational Measures (TOMs) are available at{' '}
                        <Link href="/toms" style={{ color: 'var(--color-pl-brand-light)' }}>complens.de/toms</Link>.</p>
                    </Section>

                    <Section title="5. AI Processing &amp; Sub-processors">
                        <p className="mb-3">CompLens uses Google Gemini (Google Ireland Ltd.) as an AI model for
                        the following processing activities:</p>
                        <table className="w-full text-xs border-collapse mb-3">
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Processing activity</th>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Data categories transmitted</th>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Legal basis</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['Automatic column mapping', 'Column headers, max. 5 anonymised sample values per column', 'Art. 6(1)(a) GDPR (consent)'],
                                    ['Chatbot / Explanations', 'Aggregated analysis results, pseudonymised employee IDs (no names)', 'Art. 6(1)(b) GDPR (contract performance)'],
                                    ['Narrative reports', 'Aggregated metrics (gap values, cohort statistics)', 'Art. 6(1)(b) GDPR'],
                                    ['Support triage', 'Support message text (no salary data)', 'Art. 6(1)(f) GDPR'],
                                    ['Email text polish', 'User-entered email draft', 'Art. 6(1)(a) GDPR (consent)'],
                                ].map(([activity, data, basis]) => (
                                    <tr key={activity}>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{activity}</td>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{data}</td>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{basis}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="mb-2"><strong style={{ color: 'var(--color-pl-text-primary)' }}>Sub-processor:</strong> Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland.
                        Processing is governed by a Data Processing Agreement pursuant to Art. 28 GDPR with Google.
                        Google does not store API requests for training its own models (Google Cloud Data Processing Addendum).</p>
                        <p className="mb-2"><strong style={{ color: 'var(--color-pl-text-primary)' }}>Pseudonymisation:</strong> Employee IDs may be transmitted to Gemini; first and last names are <strong>never</strong> transmitted.
                        Google cannot link IDs to natural persons.</p>
                        <p>Consent-based processing activities (column mapping, email polish) may
                        be withdrawn at any time. The remaining activities are necessary for
                        contract performance or legitimate interest.</p>
                    </Section>

                    <Section title="6. Your Rights">
                        <p>You have the following rights under the GDPR:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Access (Art. 15), Rectification (Art. 16), Erasure (Art. 17)</li>
                            <li>Restriction of processing (Art. 18)</li>
                            <li>Data portability (Art. 20)</li>
                            <li>Objection (Art. 21)</li>
                            <li>Right to lodge a complaint with the competent data protection authority</li>
                        </ul>
                        <p className="mt-2">Competent supervisory authority: The Hessian Commissioner for Data Protection and Freedom of Information (HBDI)</p>
                    </Section>

                    <Section title="7. Cookies &amp; Device Fingerprinting">
                        <p>CompLens uses only technically necessary cookies for session management
                        (Supabase Auth). No tracking or marketing cookies are used.</p>
                        <p className="mt-2">After granting cookie consent, a device fingerprint
                        (hashed combination of browser type, screen resolution, timezone, language,
                        platform, CPU cores, and touch points) is generated and stored as a SHA-256 hash.
                        This serves solely to identify trusted devices (max. 3 per user)
                        and is not shared with third parties. No fingerprinting occurs without cookie consent.</p>
                    </Section>

                    <div className="mt-10 pt-6 border-t text-xs" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}>
                        <p>For data protection enquiries, please contact: hallo@complens.de</p>
                        <div className="flex gap-4">
                            <Link href="/impressum" style={{ color: 'var(--color-pl-brand-light)' }}>Legal Notice</Link>
                            <Link href="/agb" style={{ color: 'var(--color-pl-brand-light)' }}>Terms & Conditions</Link>
                            <Link href="/toms" style={{ color: 'var(--color-pl-brand-light)' }}>TOMs</Link>
                            <Link href="/compliance" style={{ color: 'var(--color-pl-brand-light)' }}>AI & Compliance</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─── Shared Section component ───────────────────────────────────────── */

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
