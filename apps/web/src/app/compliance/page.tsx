import type { Metadata } from 'next'
import Link from 'next/link'

import BackButton from '@/components/BackButton'
import { Logo } from '@/components/ui/Logo'

export const metadata: Metadata = {
    title: 'EU AI Act & DSGVO Compliance — CompLens',
    description: 'Informationen zur Datenverarbeitung, Hosting, Sicherheit (TOMs) und EU AI Act Compliance der CompLens Software.',
}

export default function CompliancePage() {
    return (
        <div className="min-h-screen" style={{ background: 'var(--color-pl-bg)' }}>
            <div className="max-w-3xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="mb-10">
                    <BackButton />
                    <div className="flex items-center gap-3 mb-6">
                        <Logo size={32} />
                        <span className="font-bold text-xl" style={{ color: 'var(--color-pl-text-primary)' }}>CompLens</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                        EU AI Act & DSGVO Compliance
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Transparente Informationen für Datenschutzbeauftragte (DPO) · Stand: März 2026
                    </p>
                </div>

                {/* Content */}
                <div className="prose-legal space-y-8" style={{ color: 'var(--color-pl-text-secondary)', lineHeight: 1.8 }}>

                    <Section title="1. Architektur, Hosting & Datenverarbeitung">
                        <p>CompLens fungiert als <strong>Auftragsverarbeiter</strong> gemäß Art. 28 DSGVO. Die Verarbeitung aller Daten findet ausschließlich auf hochsicheren Servern innerhalb der Europäischen Union statt. Die Architektur ist so konzipiert, dass Daten die EU zu keinem Zeitpunkt verlassen.</p>
                        <ul className="list-disc pl-5 mt-3 space-y-2">
                            <li><strong>Hosting & Frontend (Vercel):</strong> Das Frontend und die API-Routen werden über Vercel bereitgestellt. Serverless Functions werden strikt in der Region <code>fra1</code> (Frankfurt am Main) ausgeführt. Vercel ist SOC2 Typ II zertifiziert.</li>
                            <li><strong>Datenbank & Authentifizierung (Supabase):</strong> Alle Datenbankeinträge, Benutzerprofile und gespeicherten Dateien (z. B. Excel-Uploads) liegen physisch im AWS-Rechenzentrum <code>eu-central-1</code> (Frankfurt). Supabase bietet branchenüblichen Schutz (SOC2 Typ II, HIPAA-konform).</li>
                            <li><strong>Transaktions-E-Mails (Resend):</strong> System-E-Mails (z.B. Passwort-Resets) werden über den Dienstleister Resend verarbeitet. Die DSGVO-Konformität wird durch den Abschluss eines Auftragsverarbeitungsvertrags (AVV) sowie den EU-US Data Privacy Framework (DPF) Beschluss rechtlich vollständig abgesichert.</li>
                        </ul>
                    </Section>

                    <Section title="2. EU AI Act Compliance (Generative KI)">
                        <p>Die CompLens Software nutzt Generative KI (Google Gemini) zur Erstellung von Erklärungsentwürfen und Maßnahmenplänen. Bezüglich des <strong>EU Artificial Intelligence Act (AI Act)</strong> gelten folgende Grundsätze:</p>
                        <ul className="list-disc pl-5 mt-3 space-y-2">
                            <li><strong>Rollenverteilung:</strong> Gemäß AI Act sind wir der <em>Betreiber (Deployer)</em> des KI-Systems, während Google der <em>Anbieter (Provider)</em> des Basismodells ist.</li>
                            <li><strong>Keine automatisierte Entscheidungsfindung (Human-in-the-Loop):</strong> CompLens trifft <strong>keine</strong> autonomen Entscheidungen über Beschäftigte (Art. 22 DSGVO). Die KI erstellt lediglich Textentwürfe für Begründungen, die von HR-Verantwortlichen <strong>zwingend manuell überprüft, angepasst und genehmigt</strong> werden müssen, bevor sie in Berichte einfließen.</li>
                            <li><strong>Transparenz:</strong> Es ist an jeder Stelle im System klar ersichtlich, wenn Text durch KI generiert wurde.</li>
                            <li><strong>Zero-PII Prompting (Datensparsamkeit):</strong> Bei Anfragen an die KI-Modelle werden <strong>niemals personenbezogene Identifikationsmerkmale</strong> (wie Klarnamen, private E-Mails oder exakte Geburtsdaten) übermittelt. Die KI verarbeitet ausschließlich pseudonymisierte Kennungen (z.B. Mitarbeiter-IDs) und rein sachliche Job-Level-Informationen zur sprachlichen Formulierung.</li>
                        </ul>
                    </Section>

                    <Section title="3. Technische und organisatorische Maßnahmen (TOMs)">
                        <p>Zum Schutz der verarbeiteten Entgeltdaten setzen wir modernste Sicherheitsstandards ein:</p>
                        <ul className="list-disc pl-5 mt-3 space-y-2">
                            <li><strong>Verschlüsselung:</strong> Alle Daten sind sowohl im Ruhezustand (Data-at-Rest via AES-256 Verschlüsselung auf Laufwerksebene) als auch bei der Übertragung (Data-in-Transit via TLS 1.2+ oder höher) kryptografisch abgesichert.</li>
                            <li><strong>Mandantentrennung (Tenant Isolation):</strong> Der Zugriff auf die Datenbank wird durch PostgreSQL Row Level Security (RLS) strikt gesichert. Jede Zeile in der Datenbank ist mit einer <code>org_id</code> verknüpft; Datenbankabfragen können technisch nur Daten der aktuell authentifizierten Organisation zurückgeben.</li>
                            <li><strong>Zugriffskontrolle:</strong> Der Systemzugriff erfordert sichere Authentifizierung (Magic Links oder starke Passwörter). Passwörter werden niemals im Klartext, sondern durch starke Hashing-Algorithmen (bcrypt) gesichert.</li>
                            <li><strong>Löschkonzept:</strong> Nutzer können ihre Accounts und alle verknüpften Organisationsdaten jederzeit selbstständig unwiderruflich löschen. Entgeltanalysedaten, die nicht mehr benötigt werden, können systemseitig archiviert und entfernt werden.</li>
                        </ul>
                    </Section>

                    <Section title="4. Verträge zur Auftragsverarbeitung (AVV)">
                        <p>Wir stellen Unternehmenskunden standardmäßig einen DSGVO-konformen Vertrag zur Auftragsverarbeitung (AVV) nach Art. 28 DSGVO zur Verfügung. Die eingesetzten Unterauftragsverarbeiter (Vercel, Supabase, Google Cloud Europe) haben sich uns gegenüber via Standardvertragsklauseln (SCCs) bzw. EU-US Data Privacy Framework (DPF) ebenfalls zu strengsten europäischen Datenschutzstandards verpflichtet.</p>
                        <p className="mt-4">
                            Bei weiteren detaillierten Rückfragen zur Informationssicherheit oder zur Anforderung des AVVs wenden Sie sich jederzeit an unseren Datenschutzbeauftragten per E-Mail an:{' '}
                            <a href="mailto:hallo@complens.de" className="text-blue-500 hover:underline">
                                hallo@complens.de
                            </a>
                        </p>
                    </Section>

                </div>
            </div>
        </div>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                {title}
            </h2>
            <div className="text-sm">
                {children}
            </div>
        </section>
    )
}
