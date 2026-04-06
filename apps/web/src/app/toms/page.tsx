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
            title: 'Technical and Organisational Measures (TOMs) — CompLens',
            description: 'TOMs of DexterBee GmbH for CompLens pursuant to GDPR Art. 32.',
        }
        : {
            title: 'Technische und Organisatorische Maßnahmen (TOMs) — CompLens',
            description: 'TOMs der DexterBee GmbH für CompLens gemäß Art. 32 DSGVO.',
        }
}

export default async function TomsPage() {
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
                        Technische und Organisatorische Maßnahmen (TOMs)
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Stand: März 2026 · Gemäß Art. 32 DSGVO · DexterBee GmbH
                    </p>
                </div>

                <div className="space-y-8 text-sm" style={{ color: 'var(--color-pl-text-secondary)', lineHeight: 1.8 }}>

                    <Section title="1. Zugriffskontrolle (Art. 32 Abs. 1 lit. b DSGVO)">
                        <p className="mb-2">Maßnahmen zur Verhinderung unbefugten Zugangs zu Datenverarbeitungssystemen:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Authentifizierung:</strong> Supabase Auth mit bcrypt-Passwort-Hashing. Unterstützung für Multi-Faktor-Authentifizierung (MFA/TOTP).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Rollenbasiertes Rechtekonzept (RBAC):</strong> Drei Rollen — Admin, Analyst, Viewer — mit jeweils eingeschränkten Berechtigungen. Nur Admins können Daten importieren und Organisationseinstellungen ändern.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Row Level Security (RLS):</strong> PostgreSQL RLS auf Datenbankebene. Jede Zeile ist mit einer org_id verknüpft. Ein organisationsübergreifender Datenzugriff ist technisch ausgeschlossen.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Gerätemanagement:</strong> Maximal 3 vertrauenswürdige Geräte pro Nutzer. Geräte-Fingerprints werden als SHA-256-Hash gespeichert (nur nach Einwilligung).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Session-Management:</strong> Automatische Session-Invalidierung nach Inaktivität. Sichere Cookie-Flags (httpOnly, SameSite, Secure).</li>
                        </ul>
                    </Section>

                    <Section title="2. Verschlüsselung (Art. 32 Abs. 1 lit. a DSGVO)">
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Data-in-Transit:</strong> TLS 1.3 für alle Verbindungen zwischen Client, Server und Datenbank. HSTS (HTTP Strict Transport Security) aktiviert.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Data-at-Rest:</strong> AES-256-Verschlüsselung aller gespeicherten Daten einschließlich Datenbank-Backups (Supabase / AWS eu-central-1).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Passwörter:</strong> bcrypt-Hashing mit automatischem Salt. Klartext-Passwörter werden zu keinem Zeitpunkt gespeichert.</li>
                        </ul>
                    </Section>

                    <Section title="3. Pseudonymisierung (Art. 32 Abs. 1 lit. a DSGVO)">
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>KI-Verarbeitung (Zero-PII):</strong> Bei Anfragen an Google Gemini / Vertex AI werden keine Klarnamen, E-Mail-Adressen oder direkte Personenidentifikatoren übertragen. Es werden ausschließlich pseudonymisierte Kennungen, Gehaltskennzahlen, Jobstufen und Gap-Metriken übermittelt.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Spaltenzuordnung:</strong> Bei der KI-gestützten Spaltenerkennung werden nur Spaltenüberschriften und anonymisierte Beispielwerte (max. 5 pro Spalte) übertragen, niemals vollständige Datensätze.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Datei-Hashing:</strong> Hochgeladene Dateien erhalten einen SHA-256-Hash für die Audit-Trail-Nachverfolgung. Rohdateien werden nicht dauerhaft gespeichert.</li>
                        </ul>
                    </Section>

                    <Section title="4. Datenresidenz und Standorte (Art. 32 Abs. 1 lit. b DSGVO)">
                        <table className="w-full text-xs border-collapse mt-2">
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Dienst</th>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Anbieter</th>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Standort</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['Datenbank & Auth', 'Supabase (AWS)', 'eu-central-1, Frankfurt'],
                                    ['KI-Verarbeitung', 'Google Cloud Vertex AI', 'europe-west3, Frankfurt'],
                                    ['Frontend & API', 'Vercel', 'Edge fra1, Frankfurt'],
                                    ['E-Mail', 'Resend', 'EU-Datenspeicherung'],
                                    ['Zahlungen', 'Stripe', 'EU / USA (Angemessenheitsbeschluss)'],
                                ].map(([service, provider, location]) => (
                                    <tr key={service}>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{service}</td>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{provider}</td>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{location}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="mt-2">Alle personenbezogenen Daten verbleiben innerhalb der Europäischen Union.
                        Die primäre Datenresidenz ist Frankfurt am Main, Deutschland.</p>
                    </Section>

                    <Section title="5. Verfügbarkeit und Belastbarkeit (Art. 32 Abs. 1 lit. b, c DSGVO)">
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Verfügbarkeit:</strong> Angestrebte Systemverfügbarkeit von mindestens 99 % pro Kalendermonat (exkl. geplanter Wartung).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Backups:</strong> Regelmäßige automatische Backups in AWS eu-central-1. Supabase und Vercel sind SOC 2 Typ II zertifiziert.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Wiederherstellung:</strong> Im Falle eines Systemausfalls ist die Wiederherstellung aus Backups innerhalb von 24 Stunden vorgesehen.</li>
                        </ul>
                    </Section>

                    <Section title="6. Monitoring und Protokollierung">
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Server-Logs:</strong> IP-Adressen und Zeitstempel werden für Sicherheits- und Fehleranalysezwecke protokolliert (Art. 6 Abs. 1 lit. f DSGVO).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Audit-Trail:</strong> Wesentliche Nutzeraktionen (Datenimport, Berichterstellung, AVV-Akzeptanz) werden mit Zeitstempel und Nutzerkennung protokolliert.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Anomalie-Erkennung:</strong> Ungewöhnliche Zugriffsmuster und fehlgeschlagene Authentifizierungsversuche werden überwacht.</li>
                        </ul>
                    </Section>

                    <Section title="7. Incident Response und Meldepflichten">
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Benachrichtigung:</strong> Bei Datenpannen (Art. 4 Nr. 12 DSGVO) wird der Auftraggeber unverzüglich, spätestens innerhalb von 72 Stunden nach Bekanntwerden, informiert.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Meldekontakt:</strong> datenschutz@complens.de (24/7 überwacht).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Dokumentation:</strong> Alle Sicherheitsvorfälle werden dokumentiert, einschließlich Art der Verletzung, betroffene Datenkategorien, ergriffene Gegenmaßnahmen und Lessons Learned.</li>
                        </ul>
                    </Section>

                    <Section title="8. Mitarbeiterschulungen und Vertraulichkeit">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Alle Mitarbeitenden mit Zugang zu personenbezogenen Daten sind zur Vertraulichkeit verpflichtet (Art. 28 Abs. 3 lit. b DSGVO).</li>
                            <li>Regelmäßige Schulungen zu Datenschutz, IT-Sicherheit und dem sicheren Umgang mit personenbezogenen Daten.</li>
                            <li>Sensibilisierung für Social Engineering, Phishing und andere Angriffsvektoren.</li>
                        </ul>
                    </Section>

                    <Section title="9. Datenlöschung und Datenminimierung">
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Löschung nach Vertragsende:</strong> Alle personenbezogenen Daten werden binnen 30 Tagen nach Kündigung unwiderruflich gelöscht (Hard Delete mit Kaskade auf alle verknüpften Datensätze).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Aufbewahrungsfrist:</strong> Gehaltsdaten werden nach Ablauf der vertraglich vereinbarten Frist (Standard: 3 Jahre) automatisch gelöscht.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>KI-Daten:</strong> Google verarbeitet Daten nicht für eigene Zwecke und speichert keine Kundendaten über die Anfrageverarbeitung hinaus (vertraglich abgesichert über Data Processing Addendum).</li>
                        </ul>
                    </Section>

                    <div className="mt-10 pt-6 border-t text-xs" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}>
                        <p>DexterBee GmbH · Industriestr. 13 · 63755 Alzenau</p>
                        <p className="mt-1">Datenschutz-Kontakt: datenschutz@complens.de</p>
                        <div className="flex gap-4 mt-4">
                            <Link href="/datenschutz" style={{ color: 'var(--color-pl-brand-light)' }}>Datenschutz</Link>
                            <Link href="/agb" style={{ color: 'var(--color-pl-brand-light)' }}>AGB</Link>
                            <Link href="/impressum" style={{ color: 'var(--color-pl-brand-light)' }}>Impressum</Link>
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
                        Technical and Organisational Measures (TOMs)
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        As of: March 2026 · Pursuant to GDPR Art. 32 · DexterBee GmbH
                    </p>
                </div>

                <div className="space-y-8 text-sm" style={{ color: 'var(--color-pl-text-secondary)', lineHeight: 1.8 }}>

                    <Section title="1. Access Control (Art. 32(1)(b) GDPR)">
                        <p className="mb-2">Measures to prevent unauthorised access to data processing systems:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Authentication:</strong> Supabase Auth with bcrypt password hashing. Support for multi-factor authentication (MFA/TOTP).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Role-based access control (RBAC):</strong> Three roles — Admin, Analyst, Viewer — each with restricted permissions. Only Admins can import data and modify organisation settings.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Row Level Security (RLS):</strong> PostgreSQL RLS at the database level. Each row is linked to an org_id. Cross-organisation data access is technically impossible.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Device management:</strong> Maximum of 3 trusted devices per user. Device fingerprints are stored as SHA-256 hashes (only with consent).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Session management:</strong> Automatic session invalidation after inactivity. Secure cookie flags (httpOnly, SameSite, Secure).</li>
                        </ul>
                    </Section>

                    <Section title="2. Encryption (Art. 32(1)(a) GDPR)">
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Data-in-Transit:</strong> TLS 1.3 for all connections between client, server and database. HSTS (HTTP Strict Transport Security) enabled.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Data-at-Rest:</strong> AES-256 encryption for all stored data including database backups (Supabase / AWS eu-central-1).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Passwords:</strong> bcrypt hashing with automatic salt. Plaintext passwords are never stored at any point.</li>
                        </ul>
                    </Section>

                    <Section title="3. Pseudonymisation (Art. 32(1)(a) GDPR)">
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>AI Processing (Zero-PII):</strong> No real names, email addresses or direct personal identifiers are transmitted to Google Gemini / Vertex AI. Only pseudonymised identifiers, salary metrics, job levels and gap metrics are sent.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Column mapping:</strong> During AI-assisted column recognition, only column headers and anonymised sample values (max. 5 per column) are transmitted, never complete datasets.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>File hashing:</strong> Uploaded files receive a SHA-256 hash for audit trail tracking. Raw files are not stored permanently.</li>
                        </ul>
                    </Section>

                    <Section title="4. Data Residency and Locations (Art. 32(1)(b) GDPR)">
                        <table className="w-full text-xs border-collapse mt-2">
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Service</th>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Provider</th>
                                    <th className="text-left p-2 border" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['Database & Auth', 'Supabase (AWS)', 'eu-central-1, Frankfurt'],
                                    ['AI Processing', 'Google Cloud Vertex AI', 'europe-west3, Frankfurt'],
                                    ['Frontend & API', 'Vercel', 'Edge fra1, Frankfurt'],
                                    ['Email', 'Resend', 'EU data storage'],
                                    ['Payments', 'Stripe', 'EU / USA (adequacy decision)'],
                                ].map(([service, provider, location]) => (
                                    <tr key={service}>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{service}</td>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{provider}</td>
                                        <td className="p-2 border" style={{ borderColor: 'var(--color-pl-border)' }}>{location}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="mt-2">All personal data remains within the European Union.
                        The primary data residency is Frankfurt am Main, Germany.</p>
                    </Section>

                    <Section title="5. Availability and Resilience (Art. 32(1)(b), (c) GDPR)">
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Availability:</strong> Targeted system availability of at least 99% per calendar month (excluding scheduled maintenance).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Backups:</strong> Regular automated backups in AWS eu-central-1. Supabase and Vercel are SOC 2 Type II certified.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Recovery:</strong> In the event of a system failure, restoration from backups is planned within 24 hours.</li>
                        </ul>
                    </Section>

                    <Section title="6. Monitoring and Logging">
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Server logs:</strong> IP addresses and timestamps are logged for security and error analysis purposes (Art. 6(1)(f) GDPR).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Audit trail:</strong> Key user actions (data import, report generation, DPA acceptance) are logged with timestamps and user identifiers.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Anomaly detection:</strong> Unusual access patterns and failed authentication attempts are monitored.</li>
                        </ul>
                    </Section>

                    <Section title="7. Incident Response and Notification Obligations">
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Notification:</strong> In the event of a data breach (Art. 4(12) GDPR), the data controller will be notified without undue delay, no later than 72 hours after becoming aware of the breach.</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Contact:</strong> datenschutz@complens.de (monitored 24/7).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Documentation:</strong> All security incidents are documented, including the nature of the breach, affected data categories, countermeasures taken and lessons learned.</li>
                        </ul>
                    </Section>

                    <Section title="8. Staff Training and Confidentiality">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>All employees with access to personal data are bound by confidentiality obligations (Art. 28(3)(b) GDPR).</li>
                            <li>Regular training on data protection, IT security and the safe handling of personal data.</li>
                            <li>Awareness training for social engineering, phishing and other attack vectors.</li>
                        </ul>
                    </Section>

                    <Section title="9. Data Deletion and Data Minimisation">
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Deletion upon contract termination:</strong> All personal data is irrevocably deleted within 30 days of termination (hard delete with cascade to all linked records).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>Retention period:</strong> Salary data is automatically deleted upon expiry of the contractually agreed period (default: 3 years).</li>
                            <li><strong style={{ color: 'var(--color-pl-text-primary)' }}>AI data:</strong> Google does not process data for its own purposes and does not store customer data beyond request processing (contractually secured via Data Processing Addendum).</li>
                        </ul>
                    </Section>

                    <div className="mt-10 pt-6 border-t text-xs" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}>
                        <p>DexterBee GmbH · Industriestr. 13 · 63755 Alzenau</p>
                        <p className="mt-1">Data protection contact: datenschutz@complens.de</p>
                        <div className="flex gap-4 mt-4">
                            <Link href="/datenschutz" style={{ color: 'var(--color-pl-brand-light)' }}>Privacy Policy</Link>
                            <Link href="/agb" style={{ color: 'var(--color-pl-brand-light)' }}>Terms & Conditions</Link>
                            <Link href="/impressum" style={{ color: 'var(--color-pl-brand-light)' }}>Legal Notice</Link>
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
