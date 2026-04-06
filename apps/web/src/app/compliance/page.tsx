import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'

import BackButton from '@/components/BackButton'
import { Logo } from '@/components/ui/Logo'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('metadata')
    return {
        title: t('publicComplianceTitle'),
        description: t('publicComplianceDescription'),
    }
}

export default async function CompliancePage() {
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
                        <p>Zum Schutz der verarbeiteten Entgeltdaten setzen wir modernste Sicherheitsstandards ein, darunter AES-256-Verschlüsselung, strikte Mandantentrennung via Row Level Security, sichere Authentifizierung und vollständige Löschkonzepte.</p>
                        <div className="mt-4">
                            <Link
                                href="/toms"
                                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--color-pl-brand-light)' }}
                            >
                                Vollständige TOMs ansehen →
                            </Link>
                        </div>
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
                        EU AI Act & GDPR Compliance
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Transparent information for Data Protection Officers (DPO) · As of: March 2026
                    </p>
                </div>

                {/* Content */}
                <div className="prose-legal space-y-8" style={{ color: 'var(--color-pl-text-secondary)', lineHeight: 1.8 }}>

                    <Section title="1. Architecture, Hosting & Data Processing">
                        <p>CompLens acts as a <strong>Data processor</strong> pursuant to Art. 28 GDPR. All data processing takes place exclusively on highly secure servers within the European Union. The architecture is designed so that data never leaves the EU at any point.</p>
                        <ul className="list-disc pl-5 mt-3 space-y-2">
                            <li><strong>Hosting & Frontend (Vercel):</strong> The frontend and API routes are served via Vercel. Serverless Functions are strictly executed in the <code>fra1</code> region (Frankfurt am Main). Vercel is SOC2 Type II certified.</li>
                            <li><strong>Database & Authentication (Supabase):</strong> All database records, user profiles, and stored files (e.g. Excel uploads) are physically located in the AWS data centre <code>eu-central-1</code> (Frankfurt). Supabase provides industry-standard protection (SOC2 Type II, HIPAA-compliant).</li>
                            <li><strong>Transactional emails (Resend):</strong> System emails (e.g. password resets) are processed via the service provider Resend. GDPR compliance is fully ensured through a Data Processing Agreement (DPA) as well as the EU-US Data Privacy Framework (DPF) adequacy decision.</li>
                        </ul>
                    </Section>

                    <Section title="2. EU AI Act Compliance (Generative AI)">
                        <p>The CompLens software uses Generative AI (Google Gemini) to create draft explanations and action plans. With regard to the <strong>EU Artificial Intelligence Act (AI Act)</strong>, the following principles apply:</p>
                        <ul className="list-disc pl-5 mt-3 space-y-2">
                            <li><strong>Role allocation:</strong> Under the AI Act, we are the <em>Deployer</em> of the AI system, while Google is the <em>Provider</em> of the foundation model.</li>
                            <li><strong>No automated decision-making (Human-in-the-Loop):</strong> CompLens makes <strong>no</strong> autonomous decisions about employees (Art. 22 GDPR). The AI merely creates text drafts for justifications, which must be <strong>mandatorily reviewed, adjusted, and approved manually</strong> by HR managers before they are included in reports.</li>
                            <li><strong>Transparency:</strong> It is clearly visible at every point in the system when text has been generated by AI.</li>
                            <li><strong>Zero-PII Prompting (Data minimisation):</strong> When sending requests to the AI models, <strong>no personally identifiable information</strong> (such as full names, private email addresses, or exact dates of birth) is ever transmitted. The AI exclusively processes pseudonymised identifiers (e.g. employee IDs) and purely factual job-level information for linguistic formulation.</li>
                        </ul>
                    </Section>

                    <Section title="3. Technical and Organisational Measures (TOMs)">
                        <p>To protect the processed compensation data, we employ state-of-the-art security standards, including AES-256 encryption, strict tenant isolation via Row Level Security, secure authentication, and comprehensive data deletion policies.</p>
                        <div className="mt-4">
                            <Link
                                href="/toms"
                                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--color-pl-brand-light)' }}
                            >
                                View full TOMs →
                            </Link>
                        </div>
                    </Section>

                    <Section title="4. Data Processing Agreement (DPA)">
                        <p>We provide enterprise customers with a GDPR-compliant Data Processing Agreement (DPA) pursuant to Art. 28 GDPR as standard. The sub-processors we employ (Vercel, Supabase, Google Cloud Europe) have likewise committed to the strictest European data protection standards via Standard Contractual Clauses (SCCs) and the EU-US Data Privacy Framework (DPF).</p>
                        <p className="mt-4">
                            For further detailed enquiries regarding information security or to request the DPA, please contact our Data Protection Officer at any time by email at:{' '}
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

/* ─── Shared ─────────────────────────────────────────────────────────── */

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
