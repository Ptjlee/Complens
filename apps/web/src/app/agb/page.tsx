import type { Metadata } from 'next'
import Link from 'next/link'

import BackButton from '@/components/BackButton'

export const metadata: Metadata = {
    title: 'Allgemeine Geschäftsbedingungen — CompLens',
    description: 'AGB der DexterBee GmbH für die CompLens EU-Entgelttransparenz-Software.',
}

export default function AgbPage() {
    return (
        <div className="min-h-screen" style={{ background: 'var(--color-pl-bg)' }}>
            <div className="max-w-3xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="mb-10">
                    <BackButton />
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                            PL
                        </div>
                        <span className="font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>CompLens</span>
                    </div>
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
                        DexterBee GmbH (nachfolgend „Anbieter“) und Unternehmen (nachfolgend „Kunde“), die die
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
                        jeweiligen Vertragsjahres schriftlich (per E-Mail an support@complens.de) zu erklären.
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
                        <p className="mt-1">E-Mail: support@complens.de · Web: complens.de</p>
                        <div className="flex gap-4 mt-4">
                            <Link href="/impressum" style={{ color: 'var(--color-pl-brand-light)' }}>Impressum</Link>
                            <Link href="/datenschutz" style={{ color: 'var(--color-pl-brand-light)' }}>Datenschutz</Link>
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
            <div className="text-sm">{children}</div>
        </div>
    )
}
