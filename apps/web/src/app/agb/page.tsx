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
            title: 'Terms & Conditions — CompLens',
            description: 'Terms & Conditions of DexterBee GmbH for the CompLens EU pay transparency software.',
        }
        : {
            title: 'Allgemeine Geschäftsbedingungen — CompLens',
            description: 'AGB der DexterBee GmbH für die CompLens EU-Entgelttransparenz-Software.',
        }
}

export default async function AgbPage() {
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
                        Allgemeine Geschäftsbedingungen
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Stand: März 2026 · DexterBee GmbH
                    </p>
                </div>

                {/* Content */}
                <div className="prose-legal space-y-8" style={{ color: 'var(--color-pl-text-secondary)', lineHeight: 1.8 }}>

                    <Section title="§ 1 Geltungsbereich">
                        <p>Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen der
                        DexterBee GmbH (nachfolgend „Anbieter") und Unternehmen (nachfolgend „Kunde"), die die
                        Software CompLens als Software-as-a-Service (SaaS) nutzen.</p>
                        <p className="mt-2">CompLens ist eine Software zur Analyse und Berichterstattung von
                        Entgeltlücken gemäß EU-Richtlinie 2023/970/EU und dem deutschen
                        Entgelttransparenzgesetz (EntgTranspG). Sie richtet sich ausschließlich an
                        Geschäftskunden (B2B).</p>
                    </Section>

                    <Section title="§ 2 Vertragsschluss und Testphase">
                        <p>Mit der Registrierung auf complens.de schließt der Kunde einen Vertrag
                        mit dem Anbieter ab. Es gilt eine kostenlose Testphase von 7 Tagen. Während der
                        Testphase stehen alle Funktionen zur Verfügung. Nach Ablauf der Testphase ist ein
                        kostenpflichtiges Abonnement erforderlich, um die Software weiter zu nutzen.</p>
                        <p className="mt-2">PDF-Export und Berichte sind während der Testphase deaktiviert.</p>
                    </Section>

                    <Section title="§ 3 Leistungsumfang">
                        <p>Der Anbieter stellt dem Kunden folgende Leistungen bereit:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Import und Verarbeitung von Gehaltsdaten (CSV/XLSX)</li>
                            <li>Automatisierte Entgeltlückenanalyse (unbereinigt und bereinigt)</li>
                            <li>Erstellung EU-konformer Berichte nach Art. 9 und Art. 10 der Richtlinie 2023/970/EU</li>
                            <li>PDF-Export von Entgeltberichten (je nach Tarif)</li>
                            <li>KI-gestützte Spaltenzuordnung (je nach Tarif, DSGVO-konform)</li>
                        </ul>
                    </Section>

                    <Section title="§ 4 Vergütung und Zahlungsbedingungen">
                        <p>Die aktuellen Preise sind auf der Website des Anbieters abrufbar. Die
                        Abrechnung erfolgt jährlich im Voraus per Kreditkarte oder SEPA-Lastschrift
                        über den Zahlungsdienstleister Stripe.</p>
                        <p className="mt-2">Bei Zahlungsverzug ist der Anbieter berechtigt, den Zugang
                        zur Software zu sperren, bis der ausstehende Betrag beglichen ist.</p>
                    </Section>

                    <Section title="§ 5 Datenschutz und DSGVO">
                        <p>Die Verarbeitung personenbezogener Daten erfolgt ausschließlich auf Servern
                        innerhalb der Europäischen Union (Frankfurt am Main, Deutschland) in Übereinstimmung
                        mit der DSGVO. Der Anbieter fungiert als Auftragsverarbeiter gemäß Art. 28 DSGVO.
                        Ein Auftragsverarbeitungsvertrag (AVV) steht auf Anfrage zur Verfügung.</p>
                        <p className="mt-2">Gehaltsdaten werden ausschließlich für die vertragsgemäße
                        Leistungserbringung verarbeitet und nicht mit Dritten geteilt.</p>
                    </Section>

                    <Section title="§ 6 Haftungsbeschränkung">
                        <p>Die Berichte und Analysen von CompLens dienen als Entscheidungsunterstützung
                        und ersetzen keine Rechtsberatung. Der Anbieter haftet nicht für die rechtliche
                        Korrektheit der generierten Berichte im konkreten Einzelfall. Der Kunde trägt
                        die Verantwortung für die Einhaltung der gesetzlichen Meldepflichten.</p>
                        <p className="mt-2">Die Haftung des Anbieters ist auf vorsätzliche und grob
                        fahrlässige Handlungen sowie auf Schäden aus der Verletzung von Leben, Körper
                        oder Gesundheit beschränkt.</p>
                    </Section>

                    <Section title="§ 7 Vertragslaufzeit und Kündigung">
                        <p>Der Vertrag wird für eine Laufzeit von einem (1) Jahr geschlossen und verlängert sich
                        automatisch um ein weiteres Jahr, sofern er nicht rechtzeitig gekündigt wird.</p>
                        <p className="mt-2">Die Kündigung ist mit einer Frist von drei (3) Monaten zum Ende des
                        jeweiligen Vertragsjahres schriftlich (per E-Mail an hallo@complens.de) zu erklären.
                        Bei nicht rechtzeitiger Kündigung verlängert sich der Vertrag automatisch um
                        ein weiteres Jahr zum dann gültigen Listenpreis.</p>
                        <p className="mt-2">Bei Kündigung werden alle Daten des Kunden nach Ablauf der
                        gesetzlichen Aufbewahrungsfrist unwiderruflich gelöscht.</p>
                    </Section>

                    <Section title="§ 8 Anwendbares Recht und Gerichtsstand">
                        <p>Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
                        UN-Kaufrechts. Gerichtsstand für alle Streitigkeiten ist, soweit gesetzlich
                        zulässig, der Sitz des Anbieters.</p>
                    </Section>

                    <div className="mt-10 pt-6 border-t text-xs" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}>
                        <p>DexterBee GmbH · Industriestr. 13 · 63755 Alzenau</p>
                        <p className="mt-1">E-Mail: hallo@complens.de · Web: complens.de</p>
                        <div className="flex gap-4 mt-4">
                            <Link href="/impressum" style={{ color: 'var(--color-pl-brand-light)' }}>Impressum</Link>
                            <Link href="/datenschutz" style={{ color: 'var(--color-pl-brand-light)' }}>Datenschutz</Link>
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
                        Terms & Conditions
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        As of: March 2026 · DexterBee GmbH
                    </p>
                </div>

                {/* Content */}
                <div className="prose-legal space-y-8" style={{ color: 'var(--color-pl-text-secondary)', lineHeight: 1.8 }}>

                    <Section title="§ 1 Scope (Geltungsbereich)">
                        <p>These Terms & Conditions apply to all contracts between
                        DexterBee GmbH (hereinafter &quot;Provider&quot;) and businesses (hereinafter &quot;Customer&quot;) that
                        use the CompLens software as a Software-as-a-Service (SaaS) solution.</p>
                        <p className="mt-2">CompLens is a software application for the analysis and reporting of
                        pay gaps in accordance with EU Directive 2023/970/EU and the German Pay Transparency
                        Act (Entgelttransparenzgesetz, EntgTranspG). It is intended exclusively for
                        business customers (B2B).</p>
                    </Section>

                    <Section title="§ 2 Conclusion of Contract and Trial Period (Vertragsschluss und Testphase)">
                        <p>By registering on complens.de, the Customer enters into a contract
                        with the Provider. A free trial period of 7 days applies. During the
                        trial period, all features are available. After the trial period expires, a
                        paid subscription is required to continue using the software.</p>
                        <p className="mt-2">PDF export and reports are disabled during the trial period.</p>
                    </Section>

                    <Section title="§ 3 Scope of Services (Leistungsumfang)">
                        <p>The Provider shall make the following services available to the Customer:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Import and processing of salary data (CSV/XLSX)</li>
                            <li>Automated pay gap analysis (unadjusted and adjusted)</li>
                            <li>Generation of EU-compliant reports pursuant to Art. 9 and Art. 10 of Directive 2023/970/EU</li>
                            <li>PDF export of pay reports (depending on plan)</li>
                            <li>AI-assisted column mapping (depending on plan, GDPR-compliant)</li>
                        </ul>
                    </Section>

                    <Section title="§ 4 Fees and Payment Terms (Vergütung und Zahlungsbedingungen)">
                        <p>Current prices are available on the Provider&apos;s website. Billing
                        is carried out annually in advance by credit card or SEPA direct debit
                        via the payment service provider Stripe.</p>
                        <p className="mt-2">In the event of late payment, the Provider is entitled to suspend access
                        to the software until the outstanding amount has been settled.</p>
                    </Section>

                    <Section title="§ 5 Data Protection and GDPR (Datenschutz und DSGVO)">
                        <p>The processing of personal data takes place exclusively on servers
                        within the European Union (Frankfurt am Main, Germany) in accordance
                        with the GDPR. The Provider acts as a data processor pursuant to Art. 28 GDPR.
                        A Data Processing Agreement (DPA) is available upon request.</p>
                        <p className="mt-2">Salary data is processed exclusively for the purpose of contractual
                        service provision and is not shared with third parties.</p>
                    </Section>

                    <Section title="§ 6 Limitation of Liability (Haftungsbeschränkung)">
                        <p>The reports and analyses provided by CompLens serve as decision-support tools
                        and do not constitute legal advice. The Provider shall not be liable for the legal
                        accuracy of the generated reports in any individual case. The Customer bears
                        responsibility for compliance with statutory reporting obligations.</p>
                        <p className="mt-2">The Provider&apos;s liability is limited to intentional and grossly
                        negligent conduct as well as to damages arising from injury to life, body
                        or health.</p>
                    </Section>

                    <Section title="§ 7 Contract Term and Termination (Vertragslaufzeit und Kündigung)">
                        <p>The contract is concluded for a term of one (1) year and shall be automatically
                        renewed for a further year unless terminated in due time.</p>
                        <p className="mt-2">Termination must be declared in writing (by email to hallo@complens.de)
                        with a notice period of three (3) months prior to the end of the respective
                        contract year. If termination is not given in time, the contract shall be
                        automatically renewed for a further year at the then-current list price.</p>
                        <p className="mt-2">Upon termination, all Customer data shall be irrevocably deleted
                        after the expiry of the statutory retention period.</p>
                    </Section>

                    <Section title="§ 8 Applicable Law and Jurisdiction (Anwendbares Recht und Gerichtsstand)">
                        <p>The laws of the Federal Republic of Germany shall apply, excluding the
                        UN Convention on Contracts for the International Sale of Goods (CISG).
                        The place of jurisdiction for all disputes shall be, to the extent
                        permitted by law, the registered office of the Provider.</p>
                    </Section>

                    <div className="mt-10 pt-6 border-t text-xs" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}>
                        <p>DexterBee GmbH · Industriestr. 13 · 63755 Alzenau</p>
                        <p className="mt-1">Email: hallo@complens.de · Web: complens.de</p>
                        <div className="flex gap-4 mt-4">
                            <Link href="/impressum" style={{ color: 'var(--color-pl-brand-light)' }}>Legal Notice</Link>
                            <Link href="/datenschutz" style={{ color: 'var(--color-pl-brand-light)' }}>Privacy Policy</Link>
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
            <div className="text-sm">{children}</div>
        </div>
    )
}
