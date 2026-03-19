import {
    ShieldCheck, Server, Lock, UserCheck, FileText,
    CheckCircle2, Globe, Cpu, Key, Trash2, AlertCircle,
    Building2, Mail,
} from 'lucide-react'

export const metadata = {
    title: 'DSGVO & Compliance — CompLens',
    description: 'Datenschutz, Sicherheit, EU AI Act und GDPR-Compliance-Details für CompLens.',
}

// ─── Reusable components ───────────────────────────────────────────────────────

function SectionCard({
    icon, title, iconColor, children,
}: {
    icon: React.ReactNode
    title: string
    iconColor: string
    children: React.ReactNode
}) {
    return (
        <div className="glass-card p-6">
            <h2
                className="text-base font-bold mb-4 flex items-center gap-2"
                style={{ color: 'var(--color-pl-text-primary)' }}
            >
                <span style={{ color: iconColor }}>{icon}</span>
                {title}
            </h2>
            {children}
        </div>
    )
}

function CheckItem({ label, detail }: { label: string; detail: string }) {
    return (
        <li className="flex items-start gap-2.5">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
            <span className="text-sm leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>
                <strong style={{ color: 'var(--color-pl-text-primary)' }}>{label}:</strong>{' '}
                {detail}
            </span>
        </li>
    )
}

function Tag({ label, color }: { label: string; color: string }) {
    return (
        <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
        >
            {label}
        </span>
    )
}

// ─── Subprocessors table ───────────────────────────────────────────────────────
const SUBPROCESSORS = [
    {
        name:     'Supabase (AWS eu-central-1)',
        role:     'Datenbank, Auth, Dateispeicher',
        region:   'Frankfurt, Deutschland 🇩🇪',
        basis:    'EU-Vertragsklauseln (SCC)',
        certs:    ['SOC 2 Typ II'],
    },
    {
        name:     'Vercel (Edge Region fra1)',
        role:     'Frontend-Hosting, API-Routen (Serverless)',
        region:   'Frankfurt, Deutschland 🇩🇪',
        basis:    'EU-Vertragsklauseln (SCC)',
        certs:    ['SOC 2 Typ II'],
    },
    {
        name:     'Google Cloud (EU-Endpunkte)',
        role:     'Generative KI: Gemini 2.5 Pro (AI-Only)',
        region:   'EU-API-Endpunkte · keine US-Übertragung',
        basis:    'EU-Vertragsklauseln (SCC)',
        certs:    ['ISO 27001', 'SOC 2'],
    },
    {
        name:     'Resend',
        role:     'Transaktions-E-Mails (Einladungen, Resets)',
        region:   'EU-Datenspeicherung',
        basis:    'EU-US DPF + AVV',
        certs:    ['SOC 2'],
    },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CompliancePage() {
    return (
        <div className="flex flex-col h-full overflow-auto space-y-6 pb-8">

            {/* ── Header ── */}
            <div className="pb-5 border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            DSGVO &amp; Compliance
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Datenschutz, Sicherheit &amp; EU AI Act — Stand: März 2026 ·{' '}
                            <a href="mailto:datenschutz@complens.de" className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>
                                datenschutz@complens.de
                            </a>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Tag label="DSGVO-konform" color="#22c55e" />
                        <Tag label="EU AI Act" color="#6366f1" />
                        <Tag label="Made in Germany 🇩🇪" color="#3b82f6" />
                    </div>
                </div>
            </div>

            {/* ── Summary banner ── */}
            <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
                <ShieldCheck size={22} className="shrink-0 mt-0.5" style={{ color: '#6366f1' }} />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    CompLens verarbeitet Entgeltdaten ausschließlich auf Servern der Europäischen Union.
                    Alle Daten verlassen die EU zu keinem Zeitpunkt. Der Betrieb erfolgt durch die{' '}
                    <strong style={{ color: 'var(--color-pl-text-primary)' }}>DexterBee GmbH</strong>
                    {' '}(HRB 17694, Amtsgericht Aschaffenburg) als Auftragsverarbeiter gemäß Art. 28 DSGVO.
                    Geschäftsführer: Stephan Dongjin Oh · USt-IdNr.: DE369096037
                </p>
            </div>

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left column ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. Serverinfrastruktur */}
                    <SectionCard icon={<Server size={20} />} title="Serverinfrastruktur &amp; Datenstandort" iconColor="#a855f7">
                        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Alle Komponenten der CompLens-Plattform werden ausschließlich innerhalb der
                            Europäischen Union betrieben. Es findet kein Datentransfer in Drittländer statt.
                        </p>
                        <div className="space-y-3">
                            {[
                                {
                                    name: 'Datenbank & Authentifizierung',
                                    provider: 'Supabase / AWS eu-central-1',
                                    location: 'Frankfurt am Main 🇩🇪',
                                    detail: 'Alle Datenbankeinträge, Nutzerprofile und hochgeladene Dateien liegen physisch im AWS-RZ Frankfurt. Row Level Security (RLS) stellt technische Mandantentrennung sicher.',
                                },
                                {
                                    name: 'Frontend & API-Routen',
                                    provider: 'Vercel (Region fra1)',
                                    location: 'Frankfurt am Main 🇩🇪',
                                    detail: 'Serverless Functions werden strikt in der Region fra1 ausgeführt. SOC 2 Typ II zertifiziert.',
                                },
                                {
                                    name: 'KI-Verarbeitung',
                                    provider: 'Google Gemini 2.5 Pro (EU-API)',
                                    location: 'EU-Endpunkte · keine US-Übertragung',
                                    detail: 'KI-Anfragen laufen über zertifizierte EU-API-Endpunkte. Kundendaten werden nicht für das KI-Training verwendet (kein Data-Opt-in).',
                                },
                                {
                                    name: 'Transaktions-E-Mails',
                                    provider: 'Resend',
                                    location: 'EU-Datenspeicherung',
                                    detail: 'Systembenachrichtigungen (Einladungen, Passwort-Resets). DSGVO-Konformität via EU-US DPF und AVV.',
                                },
                            ].map((s) => (
                                <div
                                    key={s.name}
                                    className="rounded-lg p-3"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-pl-border)' }}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
                                        <span className="text-xs font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                            {s.name}
                                        </span>
                                        <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            {s.location}
                                        </span>
                                    </div>
                                    <span className="text-xs font-medium" style={{ color: 'var(--color-pl-brand-light)' }}>
                                        {s.provider}
                                    </span>
                                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        {s.detail}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* 2. Sicherheit & TOMs */}
                    <SectionCard icon={<Lock size={20} />} title="Technische &amp; Organisatorische Maßnahmen (TOMs)" iconColor="#3b82f6">
                        <ul className="space-y-3">
                            <CheckItem
                                label="Verschlüsselung in Transit"
                                detail="TLS 1.3 für alle Verbindungen zwischen Client, CDN und API-Routen. Ältere Protokolle (TLS 1.0/1.1) sind deaktiviert."
                            />
                            <CheckItem
                                label="Verschlüsselung at Rest"
                                detail="AES-256-Verschlüsselung auf Laufwerksebene in AWS eu-central-1 für alle Datenbanken, Backups und Dateispeicher."
                            />
                            <CheckItem
                                label="Mandantentrennung (Row Level Security)"
                                detail="Jede Datenbankzeile ist mit einer org_id verknüpft. PostgreSQL RLS-Policies stellen sicher, dass keine Organisation auf Daten einer anderen zugreifen kann — auch bei Programmierfehlern."
                            />
                            <CheckItem
                                label="Zugriffskontrolle"
                                detail="Authentifizierung via Supabase Auth (Magic Link / E-Mail+Passwort, bcrypt-Hashing). Rollenbasiertes Rechtekonzept: Admin / HR-Analyst / Viewer."
                            />
                            <CheckItem
                                label="Zero-PII-KI-Prompting"
                                detail="Bei KI-Anfragen werden keine Klarnamen oder persönlichen Identifikatoren übermittelt. Die KI erhält ausschließlich pseudonymisierte Kennungen und sachliche Entgeltdaten."
                            />
                            <CheckItem
                                label="Löschkonzept"
                                detail="Nutzerkonten und alle verknüpften Organisationsdaten können jederzeit selbstständig unwiderruflich gelöscht werden (Hard Delete mit kaskadierende Entfernung aller Analysen und Berichte). Nach Vertragsende: Löschung innerhalb von 30 Tagen."
                            />
                            <CheckItem
                                label="Regelmäßige Audits"
                                detail="Supabase und Vercel sind SOC 2 Typ II zertifiziert. Google Cloud ist ISO 27001 und SOC 2 zertifiziert."
                            />
                        </ul>
                    </SectionCard>

                    {/* 3. EU AI Act */}
                    <SectionCard icon={<Cpu size={20} />} title="EU AI Act Compliance (Generative KI)" iconColor="#f59e0b">
                        <div
                            className="rounded-lg p-3 mb-4 text-xs"
                            style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', color: '#d97706' }}
                        >
                            CompLens nutzt Generative KI (Google Gemini 2.5 Pro) als Hilfssystem.
                            Die KI fällt in die Kategorie <strong>„geringes Risiko"</strong> gemäß EU AI Act Klassifizierung
                            (kein Hochrisiko-System gem. Anhang III).
                        </div>
                        <ul className="space-y-3">
                            <CheckItem
                                label="Rollenverteilung"
                                detail="Gemäß EU AI Act ist DexterBee GmbH der Betreiber (Deployer) des KI-Systems. Google ist der Anbieter (Provider) des Basismodells. Die Verantwortlichkeiten sind laut Art. 28 AI Act klar geregelt."
                            />
                            <CheckItem
                                label="Human-in-the-Loop (kein Art. 22 DSGVO)"
                                detail="CompLens trifft keine autonomen Entscheidungen über Beschäftigte. KI-generierte Texte (Begründungen, Maßnahmenpläne) müssen von HR-Verantwortlichen zwingend manuell geprüft und freigegeben werden."
                            />
                            <CheckItem
                                label="Transparenz"
                                detail="An jeder Stelle im System ist klar ersichtlich, wenn Inhalte durch KI generiert wurden. Es gibt keine versteckten KI-Ausgaben."
                            />
                            <CheckItem
                                label="Kein KI-Training mit Kundendaten"
                                detail="Google verarbeitet Anfragen über EU-API-Endpunkte ohne Datenspeicherung für Trainingszwecke (Data Processing Addendum aktiv)."
                            />
                            <CheckItem
                                label="Datensparsamkeit (Art. 5 DSGVO)"
                                detail="KI-Prompts enthalten ausschließlich pseudonymisierte Mitarbeiter-IDs und sachliche Entgeltinformationen. Klarnamen, E-Mails und direkte Personenidentifikatoren werden niemals an KI-APIs übertragen."
                            />
                        </ul>
                    </SectionCard>

                    {/* 4. EU-Richtlinie */}
                    <SectionCard icon={<FileText size={20} />} title="EU-Richtlinie 2023/970/EU — Entgelttransparenz" iconColor="#10b981">
                        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            CompLens wurde speziell für die Einhaltung der EU-Entgelttransparenzrichtlinie und des
                            deutschen Entgelttransparenzgesetzes (EntgTranspG) entwickelt. Die Berechnungen
                            und Berichtsexporte wurden in Zusammenarbeit mit HR- und Datenschutzfachleuten validiert.
                        </p>
                        <ul className="space-y-2 text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {[
                                'Berechnung des unbereinigten und bereinigten Gender Pay Gap nach Art. 9 der Richtlinie',
                                'Ausgabe von Median- und Mittelwert (Mean) der Entgeltlücke je Entgeltbestandteil',
                                'Automatische Warnung bei Überschreitung der 5%-Schwelle (Art. 10) mit Maßnahmenplan',
                                'EU-konforme Berichte (PDF und PowerPoint) zur Einreichung bei Behörden',
                                'DSGVO-konformes Auskunftsrecht-Modul für individuelle Mitarbeiteranfragen (§ 10 EntgTranspG)',
                                'Unterstützung für Arbeitnehmervertretungen mit differenzierten Leserechten',
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-2">
                                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </SectionCard>

                    {/* 5. Sub-Auftragsverarbeiter */}
                    <SectionCard icon={<Globe size={20} />} title="Unterauftragsverarbeiter (Subprocessors)" iconColor="#8b5cf6">
                        <p className="text-sm mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Alle Unterauftragsverarbeiter wurden auf EU-Datenschutzkonformität geprüft
                            und haben sich durch AVVs oder SCCs zu strengsten europäischen Standards verpflichtet.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                                        {['Anbieter', 'Zweck', 'Region', 'Rechtsgrundlage'].map((h) => (
                                            <th key={h} className="text-left pb-2 pr-4 font-semibold"
                                                style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {SUBPROCESSORS.map((sp) => (
                                        <tr key={sp.name} style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                                            <td className="py-2.5 pr-4 font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>
                                                {sp.name}
                                            </td>
                                            <td className="py-2.5 pr-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                                {sp.role}
                                            </td>
                                            <td className="py-2.5 pr-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                                {sp.region}
                                            </td>
                                            <td className="py-2.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                                {sp.basis}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                </div>

                {/* ── Right sidebar ── */}
                <div className="space-y-5">

                    {/* AVV CTA */}
                    <div
                        className="glass-card p-5 border-l-4"
                        style={{ borderColor: 'var(--color-pl-brand)' }}
                    >
                        <ShieldCheck size={28} className="mb-3" style={{ color: 'var(--color-pl-brand)' }} />
                        <h3 className="text-sm font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Auftragsverarbeitungsvertrag (AVV)
                        </h3>
                        <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Gem. Art. 28 DSGVO · personalisiert auf Ihre Organisation · bereits von
                            DexterBee GmbH digital unterzeichnet. Voraussetzung: rechtliche Angaben
                            in den Einstellungen ausfüllen.
                        </p>
                        <a
                            href="/api/contracts/avv"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary w-full text-xs py-2 text-center block"
                            style={{ textDecoration: 'none' }}
                        >
                            AVV als PDF herunterladen
                        </a>
                        <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Fragen?{' '}
                            <a href="mailto:datenschutz@complens.de" className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>
                                datenschutz@complens.de
                            </a>
                        </p>
                    </div>

                    {/* Löschkonzept */}
                    <div className="glass-card p-5">
                        <Trash2 size={18} className="mb-2" style={{ color: '#ef4444' }} />
                        <h3 className="text-sm font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Löschkonzept
                        </h3>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Auf explizite Anfrage oder nach Vertragsende werden alle Daten (Analysen,
                            Berichte, Hochladen) innerhalb von 30 Tagen unwiderruflich gelöscht (Hard Delete
                            mit Kaskade). Datenexport vor Löschung auf Anfrage möglich.
                        </p>
                    </div>

                    {/* Betroffenenrechte */}
                    <div className="glass-card p-5">
                        <UserCheck size={18} className="mb-2" style={{ color: '#10b981' }} />
                        <h3 className="text-sm font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Betroffenenrechte (Art. 15–22 DSGVO)
                        </h3>
                        <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Das Modul{' '}
                            <a href="/dashboard/portal" className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>
                                Auskunftsrecht
                            </a>
                            {' '}stellt alle Werkzeuge bereit, um individuelle Mitarbeiteranfragen
                            gemäß § 10 EntgTranspG und Art. 15 DSGVO DSGVO-konform zu bedienen.
                        </p>
                    </div>

                    {/* Zuständigkeit */}
                    <div className="glass-card p-5">
                        <Building2 size={18} className="mb-2" style={{ color: '#6366f1' }} />
                        <h3 className="text-sm font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Verantwortlicher
                        </h3>
                        <p className="text-xs leading-relaxed space-y-0.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            <strong style={{ color: 'var(--color-pl-text-primary)' }}>DexterBee GmbH</strong><br />
                            Industriestr. 13 · 63755 Alzenau<br />
                            HRB 17694 · AG Aschaffenburg<br />
                            GF: Stephan Dongjin Oh<br />
                            USt-IdNr.: DE369096037
                        </p>
                    </div>

                    {/* Kontakt */}
                    <div className="glass-card p-5">
                        <Mail size={18} className="mb-2" style={{ color: '#f59e0b' }} />
                        <h3 className="text-sm font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Datenschutz-Kontakt
                        </h3>
                        <div className="text-xs space-y-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            <div>
                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>Allgemein: </span>
                                <a href="mailto:hallo@complens.de" className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>
                                    hallo@complens.de
                                </a>
                            </div>
                            <div>
                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>Datenschutz: </span>
                                <a href="mailto:datenschutz@complens.de" className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>
                                    datenschutz@complens.de
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Certifications */}
                    <div className="glass-card p-5">
                        <Key size={18} className="mb-2" style={{ color: '#22c55e' }} />
                        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Zertifizierungen (Infrastruktur)
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                'SOC 2 Typ II',
                                'ISO 27001',
                                'TLS 1.3',
                                'AES-256',
                                'DSGVO Art. 28',
                                'EU AI Act',
                                'eIDAS',
                            ].map((c) => (
                                <span
                                    key={c}
                                    className="text-xs px-2 py-0.5 rounded"
                                    style={{
                                        background: 'rgba(34,197,94,0.1)',
                                        color: '#22c55e',
                                        border: '1px solid rgba(34,197,94,0.2)',
                                    }}
                                >
                                    {c}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Hinweis */}
                    <div
                        className="rounded-xl p-4 text-xs"
                        style={{
                            background: 'rgba(245,158,11,0.06)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            color: '#d97706',
                        }}
                    >
                        <AlertCircle size={14} className="inline mr-1 mb-0.5" />
                        <strong>Hinweis:</strong> Diese Seite richtet sich an Datenschutzbeauftragte (DPO)
                        und IT-Verantwortliche. Für den AVV oder einen Penetrationstest-Bericht
                        kontaktieren Sie bitte{' '}
                        <a href="mailto:datenschutz@complens.de" className="underline">
                            datenschutz@complens.de
                        </a>.
                    </div>
                </div>
            </div>
        </div>
    )
}
