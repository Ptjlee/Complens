'use client'

import { useState } from 'react'
import {
    PlayCircle, Upload, BarChart3, FileText, MessageSquare, Users,
    ShieldCheck, Settings, TrendingUp, ChevronDown, ChevronRight,
    AlertTriangle, CheckCircle2, Info, Mail, Download, Search,
    BookOpen, Lightbulb, Zap, Globe,
} from 'lucide-react'
import dynamic from 'next/dynamic'

const SupportTicketModal = dynamic(() => import('@/components/support/SupportTicketModal'), { ssr: false })

// ─── Types ───────────────────────────────────────────────────────────────────
type FaqItem = { q: string; a: string }
type GuideStep = { step: number; title: string; body: string; tip?: string }
type Module = {
    id: string
    icon: React.ReactNode
    color: string
    title: string
    subtitle: string
    steps: GuideStep[]
    faqs: FaqItem[]
}

// ─── FAQ Accordion ───────────────────────────────────────────────────────────
function FaqAccordion({ items }: { items: FaqItem[] }) {
    const [open, setOpen] = useState<number | null>(null)
    return (
        <div className="space-y-2 mt-4">
            {items.map((item, i) => (
                <div key={i} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-pl-border)' }}>
                    <button
                        onClick={() => setOpen(open === i ? null : i)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between text-sm font-medium transition-colors"
                        style={{
                            background: open === i ? 'rgba(59,130,246,0.06)' : 'transparent',
                            color: 'var(--color-pl-text-primary)',
                        }}
                    >
                        <span className="flex items-center gap-2">
                            <Info size={14} style={{ color: 'var(--color-pl-brand)', flexShrink: 0 }} />
                            {item.q}
                        </span>
                        {open === i ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {open === i && (
                        <div className="px-4 pb-4 pt-2 text-sm leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)', borderTop: '1px solid var(--color-pl-border)' }}>
                            {item.a}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Step Card ───────────────────────────────────────────────────────────────
function StepCard({ step, color }: { step: GuideStep; color: string }) {
    return (
        <div className="flex gap-4 p-4 rounded-xl" style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: color }}>
                {step.step}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>{step.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>{step.body}</p>
                {step.tip && (
                    <div className="mt-2 flex items-start gap-1.5 px-2.5 py-1.5 rounded-md" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <Lightbulb size={12} style={{ color: '#818cf8', flexShrink: 0, marginTop: 1 }} />
                        <p className="text-xs" style={{ color: '#a5b4fc' }}>{step.tip}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Module Panel ─────────────────────────────────────────────────────────────
function ModulePanel({ module }: { module: Module }) {
    const [tab, setTab] = useState<'guide' | 'faq'>('guide')
    return (
        <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="p-5 flex items-center gap-4" style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: module.color }}>
                    {module.icon}
                </div>
                <div>
                    <h2 className="text-base font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>{module.title}</h2>
                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{module.subtitle}</p>
                </div>
                <div className="ml-auto flex gap-1 p-0.5 rounded-lg" style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>
                    {(['guide', 'faq'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                            style={{
                                background: tab === t ? 'var(--color-pl-brand)' : 'transparent',
                                color: tab === t ? '#fff' : 'var(--color-pl-text-tertiary)',
                            }}>
                            {t === 'guide' ? 'Anleitung' : 'FAQ'}
                        </button>
                    ))}
                </div>
            </div>
            {/* Body */}
            <div className="p-5">
                {tab === 'guide' ? (
                    <div className="space-y-3">
                        {module.steps.map(s => <StepCard key={s.step} step={s} color={module.color} />)}
                    </div>
                ) : (
                    <FaqAccordion items={module.faqs} />
                )}
            </div>
        </div>
    )
}

// ─── Data ────────────────────────────────────────────────────────────────────
const MODULES: Module[] = [
    {
        id: 'start',
        icon: <PlayCircle size={20} />,
        color: 'linear-gradient(135deg,#1A3E66,#3b82f6)',
        title: '1 · Erste Schritte',
        subtitle: 'Organisation einrichten und CompLens kennenlernen',
        steps: [
            {
                step: 1,
                title: 'Registrierung & Organisation anlegen',
                body: 'Nach der Registrierung legt CompLens automatisch Ihre Organisation an. Im Bereich Einstellungen → Organisation können Sie den Namen, das Land und weitere Metadaten anpassen. Diese Daten erscheinen auf allen generierten Berichten und PDF-Exporten.',
                tip: 'Füllen Sie den Organisationsnamen vollständig und korrekt aus — er wird automatisch auf Ihren PDF-Berichten und dem Lizenzvertrag verwendet.',
            },
            {
                step: 2,
                title: 'Teammitglieder einladen',
                body: 'Unter Einstellungen → Team können Administratoren weitere Personen (z. B. HR-Leiterin, Datenschutzbeauftragte, Arbeitnehmervertretung) per E-Mail einladen. Wählen Sie die Rolle: Admin (voller Zugriff) oder Viewer (Lesezugriff). Die Einladung ist 7 Tage gültig.',
                tip: 'Die Gesamtanzahl Nutzerplätze ist an Ihre Lizenz gebunden. Zusätzliche Plätze können als Add-on gebucht werden.',
            },
            {
                step: 3,
                title: 'Profil vervollständigen',
                body: 'Unter Einstellungen → Profil können Sie Ihren vollständigen Namen, Ihre Jobbezeichnung und Ihre bevorzugte Sprache (Deutsch / Englisch) hinterlegen. Name und Jobbezeichnung erscheinen auf internen Exporten.',
            },
            {
                step: 4,
                title: 'CSV-Vorlage herunterladen',
                body: 'Bevor Sie Daten importieren, laden Sie die offizielle CSV-Vorlage unter Import → Vorlage herunterladen. Die Vorlage enthält alle Pflichtfelder gemäß EU-Richtlinie 2023/970 und der deutschen Entgelttransparenzgesetz-Anforderungen.',
                tip: 'Verwenden Sie immer die aktuellste Vorlage. Ältere Versionen können fehlende Pflichtfelder enthalten.',
            },
        ],
        faqs: [
            { q: 'Wie lange dauert die Testphase?', a: 'Die Testphase beträgt 14 Tage ab Registrierung. In dieser Zeit haben Sie vollen Zugriff auf alle Funktionen. Nach Ablauf wird der Zugang automatisch gesperrt, bis eine Lizenz aktiviert wird. Berichte aus der Testphase sind mit einem MUSTER-Wasserzeichen versehen.' },
            { q: 'Kann ich die Organisation nachträglich umbenennen?', a: 'Ja. Unter Einstellungen → Organisation können Administratoren den Organisationsnamen jederzeit ändern. Bereits erstellte PDF/PPT-Berichte werden nicht rückwirkend aktualisiert.' },
            { q: 'Was passiert nach dem Testzeitraum?', a: 'Nach Ablauf des Testzeitraums wird ein Overlay angezeigt, das alle Dashboard-Interaktionen blockiert. Daten und Analysen bleiben erhalten. Mit einem Klick auf „Jetzt upgraden" gelangen Sie zur sicheren Stripe-Zahlungsseite.' },
            { q: 'Welche Regionen werden unterstützt?', a: 'CompLens ist auf EU-Unternehmen ausgelegt, insbesondere auf den deutschen und europäischen Markt. Die Berechnungen orientieren sich an der EU-Richtlinie 2023/970 und dem deutschen EntgTranspG.' },
        ],
    },
    {
        id: 'import',
        icon: <Upload size={20} />,
        color: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
        title: '2 · Datensätze importieren',
        subtitle: 'CSV-Daten korrekt vorbereiten und hochladen',
        steps: [
            {
                step: 1,
                title: 'CSV-Datei vorbereiten',
                body: 'Öffnen Sie die CSV-Vorlage in Excel oder Google Sheets. Pflichtfelder: employee_id (eindeutig), gender (m/f/d), job_grade (Entgeltgruppe), hourly_rate oder annual_salary, department, employment_type (full_time/part_time/minijob), weekly_hours.',
                tip: 'Verwenden Sie ausschließlich Semikolon (;) als Trennzeichen. Dezimalzahlen mit Komma (z. B. 25,50) oder Punkt (25.50) werden beide akzeptiert.',
            },
            {
                step: 2,
                title: 'Optionale Felder ergänzen',
                body: 'Optionale Felder: first_name, last_name (für Auskunftsrecht Art. 7), variable_pay (Boni, Prämien), overtime_hours (Überstunden), benefits_value (Sachleistungen in €/Jahr). Diese Felder verbessern die Genauigkeit der Gesamtvergütungsberechnung.',
            },
            {
                step: 3,
                title: 'Datei hochladen',
                body: 'Öffnen Sie Import → Neuer Datensatz. Geben Sie einen sprechenden Datensatznamen und das Berichtsjahr ein. Laden Sie Ihre CSV-Datei hoch. CompLens validiert die Daten automatisch und zeigt erkannte Fehler mit Zeilenverweisen an.',
                tip: 'Der Datensatzname erscheint auf dem Deckblatt Ihres PDF-Berichts. Verwenden Sie z. B. „Entgeltdaten 2024 – Hauptgesellschaft".',
            },
            {
                step: 4,
                title: 'Fehler beheben',
                body: 'Falls Validierungsfehler auftreten, sehen Sie eine Liste mit Fehlermeldungen und den betroffenen Zeilen. Häufige Fehler: fehlende gender-Werte, ungültige employment_type-Codes, negative Stundenlöhne. Korrigieren Sie die CSV und laden Sie erneut hoch.',
            },
            {
                step: 5,
                title: 'Datensatz archivieren oder löschen',
                body: 'Nicht mehr benötigte Datensätze können archiviert (ausgeblendet, Daten erhalten) oder dauerhaft gelöscht werden. Bei einem Hard Delete werden alle verknüpften Analysen und Begründungen ebenfalls entfernt (DSGVO-konform).',
                tip: 'Archivieren statt löschen: Archivierte Datensätze bleiben für Trendanalysen nutzbar, erscheinen aber nicht in der Hauptauswahl.',
            },
        ],
        faqs: [
            { q: 'Welches Encoding muss die CSV haben?', a: 'CompLens erwartet UTF-8 (mit oder ohne BOM). Wenn Umlaute (ä, ö, ü) falsch angezeigt werden, öffnen Sie die Datei in einem Texteditor und speichern Sie sie explizit als UTF-8.' },
            { q: 'Wie gebe ich Teilzeitbeschäftigte korrekt ein?', a: 'Setzen Sie employment_type auf "part_time" und füllen Sie weekly_hours mit der vertraglich vereinbarten Stundenzahl. CompLens normiert alle Gehälter auf Bruttostundenverdienst gemäß Art. 3 EU-RL 2023/970.' },
            { q: 'Was passiert mit Minijobs?', a: 'Minijobs (Typ "minijob") werden in die Berechnungen einbezogen, aber separat aus der Gesamt-Gap-Berechnung ausgewiesen, da sie statistisch wenig aussagekräftig sind. Eine separate Kohorte wird angezeigt, falls ≥ 5 Minijobber vorhanden.' },
            { q: 'Sind Dienstleister / externe Mitarbeiter einzubeziehen?', a: 'Nein. Gemäß EU-RL 2023/970 sind nur Arbeitnehmer im arbeitsrechtlichen Sinne (Festangestellte, Teilzeitkräfte) zu erfassen, keine Selbstständigen, Leiharbeiter oder Werkvertragsnehmer.' },
            { q: 'Was bedeutet "job_grade" genau?', a: 'job_grade entspricht Ihrer internen Entgeltgruppe oder Vergütungsstufe (z. B. „L1", „Senior", „Tarifgruppe 5"). CompLens analysiert die Entgeltlücke innerhalb jeder Kohorte. Je granularer die Einteilung, desto aussagekräftiger das Ergebnis.' },
        ],
    },
    {
        id: 'analysis',
        icon: <BarChart3 size={20} />,
        color: 'linear-gradient(135deg,#f59e0b,#ef4444)',
        title: '3 · Analyse & Ergebnisse',
        subtitle: 'Pay-Gap-Berechnungen verstehen und interpretieren',
        steps: [
            {
                step: 1,
                title: 'Neue Analyse starten',
                body: 'Wählen Sie unter Analyse → Neue Analyse einen Datensatz. Geben Sie einen Analysenamen ein. Klicken Sie auf „Analyse starten". CompLens berechnet automatisch unbereinigten und bereinigten Median- und Mittelwert der Entgeltlücke nach EU-Standard.',
                tip: 'Sie können beliebig viele Analysen aus demselben Datensatz erstellen, z. B. mit unterschiedlichen WIF-Gewichtungen.',
            },
            {
                step: 2,
                title: 'Unbereinigter vs. bereinigter Gender Pay Gap',
                body: 'Der unbereinigte Gap vergleicht alle Frauen und Männer direkt (ohne Berücksichtigung von Berufsgruppen). Der bereinigte Gap vergleicht jeweils innerhalb derselben Kohorte (job_grade) und unter Berücksichtigung der WIF-Faktoren. Beide Werte sind gesetzlich meldepflichtig gemäß Art. 9 EU-RL 2023/970.',
            },
            {
                step: 3,
                title: '5%-Schwelle beachten',
                body: 'Übersteigt der unbereinigte Median-Gap 5%, besteht gemäß Art. 9 Abs. 1c der EU-Richtlinie Handlungsbedarf. CompLens kennzeichnet dies automatisch mit einem roten Status-Badge und generiert einen Maßnahmenplan-Vorschlag.',
                tip: 'Die 5%-Schwelle gilt für den unbereinigten Median-Gap. Der bereinigte Gap zeigt, wie viel nach Berücksichtigung von Berufsgruppen und Faktoren bestehen bleibt.',
            },
            {
                step: 4,
                title: 'Ergebnisse nach Abteilung & Entgeltgruppe',
                body: 'Im Analyse-Detailbereich sehen Sie Aufschlüsselungen nach Abteilung (department) und Entgeltgruppe (job_grade). Kohorten mit weniger als 5 Personen werden aus Datenschutzgründen anonymisiert und als „< 5 MA" angezeigt.',
            },
            {
                step: 5,
                title: 'Quartilsverteilung',
                body: 'Die Quartilsansicht zeigt, in welchem Entgeltquartil Frauen und Männer wie stark vertreten sind. Gemäß Art. 9 Abs. 1b EU-RL müssen Unternehmen diese Verteilung im Bericht ausweisen.',
            },
        ],
        faqs: [
            { q: 'Was sind WIF-Faktoren?', a: 'WIF steht für „Wertigkeit, Inhalt, Funktion" — die objektiven Faktoren, die laut EU-Richtlinie zur Beurteilung der Gleichwertigkeit von Arbeit herangezogen werden. CompLens berücksichtigt standardmäßig: Qualifikationsanforderungen, Verantwortung, Belastung und Arbeitsbedingungen.' },
            { q: 'Warum unterscheidet sich der Median vom Mittelwert?', a: 'Der Median ist der mittlere Wert einer sortierten Liste. Er ist robuster gegenüber Ausreißern (z. B. Toppverdiener). Der Mittelwert (Durchschnitt) wird durch Ausreißer beeinflusst. Die EU-Richtlinie schreibt primär den Median vor; CompLens zeigt beide Werte.' },
            { q: 'Warum werden Kohorten mit < 5 Personen ausgeblendet?', a: 'Kohorten mit weniger als 5 Personen einer Geschlechtergruppe werden aus datenschutzrechtlichen Gründen gem. DSGVO Art. 5 Abs. 1c (Datenminimierung) nicht aufgeschlüsselt ausgewiesen. Sie fließen aber in den Gesamt-Gap ein.' },
            { q: 'Muss ich alle Analysen aufbewahren?', a: 'Die EU-Richtlinie fordert eine Aufbewahrung der Berichtsdaten für mindestens 4 Jahre. CompLens speichert Analysen dauerhaft, bis Sie sie explizit löschen. Für die langfristige Archivierung empfehlen wir zusätzlich den PDF-Export.' },
        ],
    },
    {
        id: 'explanations',
        icon: <MessageSquare size={20} />,
        color: 'linear-gradient(135deg,#8b5cf6,#ec4899)',
        title: '4 · Begründungen erfassen',
        subtitle: 'Entgeltunterschiede dokumentieren und begründen',
        steps: [
            {
                step: 1,
                title: 'Was sind Begründungen?',
                body: 'Begründungen (Explanations) ermöglichen es Ihnen, statistisch auffällige Entgeltlücken innerhalb einer Kohorte mit objektiven, geschlechtsneutralen Faktoren zu erklären. Beispiele: Leistungsbeurteilungen, Betriebszugehörigkeit, Marktvergütung für Spezialisten.',
                tip: 'Begründungen reduzieren den bereinigten Gap, aber niemals den unbereinigten. Beide sind meldepflichtig.',
            },
            {
                step: 2,
                title: 'Begründung hinzufügen',
                body: 'Klicken Sie in der Analyse-Detailansicht bei einer Kohorte auf „Begründung hinzufügen". Wählen Sie eine Kategorie (Leistung, Markt, Dienstalter, ...), geben Sie den Erklärungsanteil in % oder als absoluter Stundenlohnwert ein und formulieren Sie eine Beschreibung.',
            },
            {
                step: 3,
                title: 'Begründungen im Bericht',
                body: 'Alle erfassten Begründungen erscheinen automatisch im PDF-Bericht (Seite 3: Bereinigungsübersicht) und in der PPT-Präsentation. Der Bericht weist aus, welcher Anteil der Gesamtlücke begründet ist.',
                tip: 'Formulieren Sie Begründungen klar und sachlich. Sie können bei einer Betriebsprüfung oder Behördenanfrage als Dokumentation vorgelegt werden.',
            },
            {
                step: 4,
                title: 'Begründungen bearbeiten und löschen',
                body: 'Bestehende Begründungen können über das Bearbeitungssymbol (✎) angepasst oder gelöscht werden. Änderungen wirken sich sofort auf den bereinigten Gap in der Analyseansicht aus.',
            },
        ],
        faqs: [
            { q: 'Wie viele Begründungen kann ich pro Kohorte erfassen?', a: 'Es gibt keine Begrenzung. Sie können mehrere Faktoren kombinieren (z. B. 2% Dienstalter + 1,5% Leistung). CompLens addiert alle Begründungsanteile und zeigt den verbleibenden unerklärten Rest.' },
            { q: 'Sind Begründungen rechtlich bindend?', a: 'Begründungen sind Ihre interne Dokumentation. Sie ersetzen keine arbeitsrechtliche Prüfung. Bei Anfragen von Behörden oder Gerichten können die Begründungen jedoch als Nachweisdokument dienen. Lassen Sie kritische Begründungen von einem Fachanwalt für Arbeitsrecht prüfen.' },
            { q: 'Was ist der Unterschied zwischen „erklärt" und „unerläutert"?', a: '„Erklärt" heißt: Der Gap-Anteil ist durch eine dokumentierte, objektive Begründung belegt. „Unerläutert" heißt: Der verbleibende Gap-Anteil hat keine hinterlegte Begründung und gilt rechtlich als potenzielle Diskriminierung.' },
        ],
    },
    {
        id: 'remediation',
        icon: <Zap size={20} />,
        color: 'linear-gradient(135deg,#10b981,#3b82f6)',
        title: '5 · Maßnahmenpläne',
        subtitle: 'Entgeltlücken mit strukturierten Plänen schließen',
        steps: [
            {
                step: 1,
                title: 'Maßnahmenplan erstellen',
                body: 'Unter Maßnahmen → Neuer Plan wählen Sie die betroffene Analyse und geben einen Titel und ein Zieldatum ein. Ein Plan kann mehrere Maßnahmen-Schritte (Steps) enthalten, die einzelnen Kohorten oder Abteilungen zugewiesen werden.',
            },
            {
                step: 2,
                title: 'Maßnahmen-Schritte definieren',
                body: 'Jeder Schritt enthält: Bezeichnung, Beschreibung, Zuordnung (Abteilung/Kohorte), Verantwortliche Person und Zieldatum. Schritte können als „offen", „in Bearbeitung" oder „abgeschlossen" markiert werden.',
                tip: 'Konkreter planen: Definieren Sie messbare Ziele pro Schritt, z. B. „Lohnerhöhung 3% für Frauen in L3 bis 31.12.2025".',
            },
            {
                step: 3,
                title: 'Fortschritt verfolgen',
                body: 'Im Maßnahmen-Dashboard sehen Sie alle aktiven Pläne mit Fortschrittsbalken, offenen Schritten und überfälligen Maßnahmen. Die Gesamtfortschrittsanzeige aggregiert alle Schritte aller Pläne.',
            },
        ],
        faqs: [
            { q: 'Kann ich Maßnahmenpläne exportieren?', a: 'Ja. Der Maßnahmenplan wird in den PDF-Bericht integriert (ab Seite 4). Eine separate Export-Funktion für Maßnahmenpläne wird in einem zukünftigen Update bereitgestellt.' },
            { q: 'Verändert ein Maßnahmenplan meine Analyse?', a: 'Nein. Maßnahmenpläne sind rein dokumentarisch und beeinflussen keine Berechnungsergebnisse. Für eine aktualisierte Analyse laden Sie einen neuen Datensatz hoch und starten eine neue Analyse.' },
        ],
    },
    {
        id: 'reports',
        icon: <FileText size={20} />,
        color: 'linear-gradient(135deg,#14b8a6,#3b82f6)',
        title: '6 · Berichte & Exporte',
        subtitle: 'PDF-Berichte und PPT-Präsentationen erstellen',
        steps: [
            {
                step: 1,
                title: 'PDF-Bericht generieren',
                body: 'Klicken Sie in der Analysedetailseite auf „PDF exportieren". Der Bericht enthält: Deckblatt mit Organisationsname, Executive Summary, Entgeltlücken-Übersicht, Kohortendetails, Quartilsverteilung, Begründungsübersicht und Maßnahmenplan (sofern vorhanden).',
                tip: 'Berichte im Testzeitraum oder bei abgelaufener Lizenz enthalten ein rotes MUSTER-Wasserzeichen und sind auf 4 Seiten beschränkt.',
            },
            {
                step: 2,
                title: 'PPT-Präsentation generieren',
                body: 'Klicken Sie auf „PPT exportieren". Die Präsentation enthält 7 Folien: Deckblatt, Executive Summary, Entgeltlücken-Übersicht, Bereiche, Quartile, Gehaltsvergleich und Methodik. Ideal für Präsentationen vor Geschäftsführung oder Betriebsrat.',
            },
            {
                step: 3,
                title: 'Branding im Export',
                body: 'Alle Exporte zeigen prominent den Namen Ihrer Organisation. CompLens erscheint nur als kleiner Hinweis „Erstellt mit CompLens". Das ermöglicht professionelle Berichte in Ihrem Corporate Design.',
            },
            {
                step: 4,
                title: 'Lizenzvertrag herunterladen',
                body: 'Unter Einstellungen → Abo können lizenzierte Nutzer den personalisierten Softwarenutzungsvertrag (bereits von DexterBee GmbH digital unterzeichnet) als PDF herunterladen.',
            },
        ],
        faqs: [
            { q: 'Wie viele Seiten hat der PDF-Bericht?', a: 'Ein vollständiger Bericht bei aktiver Lizenz umfasst je nach Datenmenge 6–10 Seiten. Im Testzeitraum sind die Seiten 5+ durch eine Upgrade-Seite ersetzt.' },
            { q: 'Kann ich den Bericht direkt an Behörden senden?', a: 'CompLens-Berichte sind als internes Dokumentations- und Analysewerkzeug konzipiert. Die genauen Meldeanforderungen an Behörden (Antidiskriminierungsstelle, Arbeitgeber­verbände) variieren je nach Unternehmensgröße und Land. Konsultieren Sie für die offizielle Meldung einen Fachanwalt für Arbeitsrecht.' },
            { q: 'In welchen Sprachen werden Berichte erstellt?', a: 'Aktuell werden alle Berichte auf Deutsch erstellt (Pflichtsprache gem. EntgTranspG für deutsche Unternehmen). Mehrsprachige Exporte sind für zukünftige Versionen geplant.' },
        ],
    },
    {
        id: 'portal',
        icon: <Users size={20} />,
        color: 'linear-gradient(135deg,#f59e0b,#10b981)',
        title: '7 · Auskunftsrecht (Art. 7)',
        subtitle: 'Individuelle Mitarbeiterinformationen bereitstellen',
        steps: [
            {
                step: 1,
                title: 'Was ist das Auskunftsrecht?',
                body: 'Artikel 7 der EU-Richtlinie 2023/970 verpflichtet Arbeitgeber, Mitarbeitenden auf Anfrage Auskunft über ihr eigenes Gehalt im Vergleich zur Durchschnittsvergütung ihrer Vergleichsgruppe zu geben. Die Auskunft muss binnen 2 Monaten erteilt werden.',
            },
            {
                step: 2,
                title: 'Mitarbeiter suchen',
                body: 'Im Bereich Auskunftsrecht → Mitarbeiter suchen geben Sie den Namen oder die Personal-ID der anfragenden Person ein (mindestens 3 Zeichen). CompLens zeigt die Entgeltinformationen der Vergleichsgruppe an.',
                tip: 'Suche funktioniert nur für Mitarbeitende, die im importierten Datensatz mit first_name/last_name erfasst sind.',
            },
            {
                step: 3,
                title: 'PDF-Brief generieren',
                body: 'Klicken Sie auf „PDF generieren / Drucken". CompLens erstellt ein professionelles Auskunftsschreiben mit dem Organisationsnamen, den gesetzlich vorgeschriebenen Vergleichsdaten und dem Rechtsgrundverweis (Art. 7 EU-RL 2023/970). Das Schreiben kann direkt gedruckt oder per E-Mail versendet werden.',
            },
        ],
        faqs: [
            { q: 'Wer darf die Auskunft anfordern?', a: 'Jeder Beschäftigte darf einmal pro Jahr eine Auskunft anfordern. Die Auskunft beinhaltet den Median der Vergleichsgruppe, aufgeschlüsselt nach Geschlecht — nicht das Gehalt einzelner Kolleginnen und Kollegen.' },
            { q: 'Wie schütze ich die Anonymität anderer Mitarbeiter?', a: 'CompLens zeigt nur Mediane und Mittelwerte je Kohorte, keine Einzelgehälter. Kohorten mit < 5 Personen werden nicht angezeigt. Das Schreiben enthält keine personenbezogenen Daten Dritter.' },
            { q: 'Was, wenn die Vergleichsgruppe zu klein ist?', a: 'Wenn die Kohorte des Mitarbeiters weniger als 5 Personen umfasst, kann CompLens keine Auskunft erteilen. In diesem Fall sind alternative Vergleichsgruppen zu definieren. Wenden Sie sich für diesen Sonderfall an den Support.' },
        ],
    },
    {
        id: 'trends',
        icon: <TrendingUp size={20} />,
        color: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        title: '8 · Trendanalyse',
        subtitle: 'Entwicklung der Entgeltlücke über mehrere Jahre',
        steps: [
            {
                step: 1,
                title: 'Mehrjährige Vergleiche',
                body: 'Die Trendanalyse wird automatisch aktiv, sobald mindestens 2 abgeschlossene Analysen mit unterschiedlichen Berichtsjahren vorhanden sind. Sie sehen dann Liniendiagramme, Delta-Karten und Heatmaps für Bereiche und Entgeltgruppen.',
            },
            {
                step: 2,
                title: 'Delta-Karten interpretieren',
                body: 'Jede Delta-Karte zeigt den aktuellen Wert und die Veränderung zum Vorjahreswert. Grün = Verbesserung (Gap gesunken), Rot = Verschlechterung (Gap gestiegen). Der Vergleich bezieht sich immer auf das unmittelbar vorherige Berichtsjahr.',
            },
            {
                step: 3,
                title: 'Bereichs-Heatmap',
                body: 'Die Heatmap im Tab „Bereiche" zeigt farbcodiert die bereinigte Entgeltlücke je Abteilung und Jahr. Dunkelrot = Gap > 10%, Orange = 5–10%, Gelb = 2–5%, Grün = < 2%. Ideal für Fortschrittsberichte an Geschäftsführung oder Betriebsrat.',
            },
        ],
        faqs: [
            { q: 'Warum sehe ich keine Trendansicht?', a: 'Die Trendansicht erfordert mindestens 2 abgeschlossene Analysen. Führen Sie zunächst Analysen für mehrere Berichtsjahre durch (oder importieren Sie Daten aus vergangenen Jahren).' },
            { q: 'Werden Trends auch im Bericht angezeigt?', a: 'Trendverläufe sind aktuell nur in der interaktiven Trendansicht verfügbar. Eine Integration in den PDF-Bericht ist für eine zukünftige Version geplant.' },
        ],
    },
    {
        id: 'compliance',
        icon: <ShieldCheck size={20} />,
        color: 'linear-gradient(135deg,#10b981,#14b8a6)',
        title: '9 · DSGVO & Compliance',
        subtitle: 'Datenschutz, AVV und Rechtsnachweise',
        steps: [
            {
                step: 1,
                title: 'Auftragsverarbeitungsvertrag (AVV)',
                body: 'Wenn Sie personenbezogene Daten (Gehalte, Namen) in CompLens verarbeiten, sind Sie gemäß Art. 28 DSGVO verpflichtet, einen Auftragsverarbeitungsvertrag mit DexterBee GmbH abzuschließen. Fordern Sie diesen über den Button auf der Compliance-Seite an.',
                tip: 'Der AVV ist kostenlos und wird innerhalb von 2 Werktagen per E-Mail zugesandt.',
            },
            {
                step: 2,
                title: 'Datenschutzarchitektur',
                body: 'Alle Daten werden in der EU verarbeitet (Frankfurt am Main). Übertragungen sind TLS 1.3-verschlüsselt, Daten at rest AES-256. CompLens nutzt Google Gemini über EU-API-Endpunkte; Ihre Daten werden nicht zum Training von Modellen verwendet.',
            },
            {
                step: 3,
                title: 'Löschkonzept',
                body: 'Sie können einzelne Datensätze, Analysen oder Ihren gesamten Account jederzeit löschen. Ein Hard Delete entfernt alle verknüpften Daten unwiderruflich. Auf Anfrage erstellt CompLens vor dem Löschen einen vollständigen Datenexport.',
            },
        ],
        faqs: [
            { q: 'Wer ist Verantwortlicher im Sinne der DSGVO?', a: 'Ihr Unternehmen ist der Verantwortliche gemäß Art. 4 Nr. 7 DSGVO. DexterBee GmbH ist Auftragsverarbeiter gemäß Art. 4 Nr. 8 DSGVO. Dies wird im AVV geregelt.' },
            { q: 'Werden die Daten für andere Zwecke genutzt?', a: 'Nein. Ihre Entgeltdaten werden ausschließlich zur Erbringung der CompLens-Dienstleistung genutzt. Keine Weitergabe an Dritte, kein Training von Modellen. Rechtsgrundlage: Art. 6 Abs. 1b DSGVO (Vertragserfüllung).' },
        ],
    },
    {
        id: 'settings',
        icon: <Settings size={20} />,
        color: 'linear-gradient(135deg,#64748b,#334155)',
        title: '10 · Einstellungen & Team',
        subtitle: 'Profil, Organisation und Abonnement verwalten',
        steps: [
            {
                step: 1,
                title: 'Profil bearbeiten',
                body: 'Unter Einstellungen → Profil können Sie Ihren Namen, Ihre Berufsbezeichnung und Ihre bevorzugte Sprache (Deutsch/Englisch) festlegen. Diese Einstellungen sind nutzerspezifisch und gelten nicht für andere Teammitglieder.',
            },
            {
                step: 2,
                title: 'Sprache wechseln',
                body: 'CompLens unterstützt Deutsch und Englisch. Wählen Sie Ihre bevorzugte Sprache im Profil-Tab. Die Sprache wird sofort für die gesamte Oberfläche übernommen. Berichte werden weiterhin auf Deutsch erstellt (gesetzliche Anforderung für deutsche Unternehmen).',
                tip: 'Als Admin können Sie für jedes Teammitglied individuell eine Sprache festlegen.',
            },
            {
                step: 3,
                title: 'Abonnement & Lizenz',
                body: 'Im Tab Abonnement sehen Sie Ihren aktuellen Plan, das Ablaufdatum und die Anzahl genutzter Nutzerplätze. Lizenzierte Nutzer können den vorausgefüllten Softwarenutzungsvertrag als PDF herunterladen. Für Upgrades und Add-ons stehen direkte Stripe-Checkout-Links bereit.',
            },
            {
                step: 4,
                title: 'Rollen und Berechtigungen',
                body: 'Admin: Vollzugriff inkl. Import, Analyse, Einstellungen, Teamverwaltung. Viewer: Lesezugriff auf Analysen, Berichte und Portal — keine Import- oder Einstellungsrechte. Rollen können nur von Admins geändert werden.',
            },
        ],
        faqs: [
            { q: 'Kann ich mein Passwort zurücksetzen?', a: 'Ja. Klicken Sie auf der Login-Seite auf „Passwort vergessen". Sie erhalten eine E-Mail mit einem Reset-Link (gültig für 60 Minuten).' },
            { q: 'Wie kündige ich mein Abonnement?', a: 'Kündigung per Support-Ticket oder schriftlich mit 3-monatiger Frist zum Jahresende. Bei Fragen zur Kündigung steht unser Support-Team zur Verfügung.' },
            { q: 'Was passiert mit meinen Daten nach der Kündigung?', a: 'Nach Vertragsende haben Sie 30 Tage Zeit, Ihre Daten (Analysen, Berichte) zu exportieren. Danach werden alle Daten unwiderruflich gelöscht. Auf Anfrage erstellen wir vorab einen Vollexport.' },
        ],
    },
]

// ─── Legal Quick Reference ───────────────────────────────────────────────────
const LEGAL_REF = [
    { art: 'Art. 3', title: 'Begriffsbestimmungen', desc: 'Definition von „Entgelt", „Arbeitnehmer" und „Gleichwertigkeit der Arbeit"' },
    { art: 'Art. 7', title: 'Auskunftsrecht', desc: 'Anspruch auf Auskunft über eigenes Gehalt im Vergleich zur Kohorte — binnen 2 Monaten zu erteilen' },
    { art: 'Art. 9', title: 'Berichts­pflicht', desc: 'Meldepflicht des Gender Pay Gaps ab 100 MA (ab 2027); ab 250 MA ab 2026. 5%-Schwelle = Handlungsbedarf + gemeinsame Entgeltbewertung' },
    { art: 'Art. 10', title: 'Gemeinsame Entgelt­bewertung', desc: 'Bei unbegründetem Gap > 5%: gemeinsame Prüfung mit Arbeitnehmervertretung' },
    { art: 'EntgTranspG', title: 'Deutsches Umsetzungsgesetz', desc: 'Gilt für Unternehmen ab 200 MA. Enthält Auskunfts- und Berichtspflichten analog zur EU-RL' },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HelpClient() {
    const [activeModule,  setActiveModule]  = useState<string | null>(null)
    const [search,        setSearch]        = useState('')
    const [showSupport,   setShowSupport]   = useState(false)

    const filtered = search.trim().length > 1
        ? MODULES.filter(m =>
            m.title.toLowerCase().includes(search.toLowerCase()) ||
            m.subtitle.toLowerCase().includes(search.toLowerCase()) ||
            m.steps.some(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.body.toLowerCase().includes(search.toLowerCase())) ||
            m.faqs.some(f => f.q.toLowerCase().includes(search.toLowerCase()))
          )
        : MODULES

    return (
        <div className="space-y-6">
            {showSupport && <SupportTicketModal onClose={() => setShowSupport(false)} />}
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 pb-5" style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                        <BookOpen size={22} style={{ color: 'var(--color-pl-brand)' }} />
                        Hilfe & Bedienungsanleitung
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Vollständige Anleitung für CompLens · EU-Richtlinie 2023/970 · EntgTranspG
                    </p>
                </div>
            </div>

            {/* ── Search ── */}
            <div className="relative max-w-lg">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-pl-text-tertiary)' }} />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Modul oder Thema suchen…"
                    className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-black/20 border focus:outline-none focus:border-blue-500 transition-colors"
                    style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                />
            </div>

            {/* ── Quick nav ── */}
            {!search && (
                <div className="flex flex-wrap gap-2">
                    {MODULES.map(m => (
                        <button
                            key={m.id}
                            onClick={() => {
                                setActiveModule(activeModule === m.id ? null : m.id)
                                setTimeout(() => document.getElementById(`module-${m.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
                            }}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                            style={{
                                background: activeModule === m.id ? 'var(--color-pl-brand)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${activeModule === m.id ? 'var(--color-pl-brand)' : 'var(--color-pl-border)'}`,
                                color: activeModule === m.id ? '#fff' : 'var(--color-pl-text-tertiary)',
                            }}
                        >
                            {m.title.split(' · ')[0]}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Modules ── */}
            <div className="space-y-4">
                {filtered.map(m => (
                    <div key={m.id} id={`module-${m.id}`}>
                        <ModulePanel module={m} />
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="glass-card p-12 text-center">
                        <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            Keine Ergebnisse für „{search}"
                        </p>
                    </div>
                )}
            </div>

            {/* ── Legal quick reference ── */}
            <div className="glass-card p-5">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                    <Globe size={16} style={{ color: 'var(--color-pl-brand)' }} />
                    Rechtsgrundlagen — Schnellübersicht
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                                {['Artikel/Norm', 'Bezeichnung', 'Inhalt'].map(h => (
                                    <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {LEGAL_REF.map(r => (
                                <tr key={r.art} className="border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                                    <td className="py-2 px-3 font-bold" style={{ color: 'var(--color-pl-brand-light)', whiteSpace: 'nowrap' }}>{r.art}</td>
                                    <td className="py-2 px-3 font-semibold" style={{ color: 'var(--color-pl-text-primary)', whiteSpace: 'nowrap' }}>{r.title}</td>
                                    <td className="py-2 px-3 leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>{r.desc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Support banner ── */}
            <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,var(--color-pl-brand),#6366f1)', boxShadow: '0 8px 20px rgba(99,102,241,0.25)' }}>
                    <MessageSquare size={22} className="text-white" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-pl-text-primary)' }}>Persönlichen Support anfordern</h3>
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        Unser Team steht Mo–Fr 09–17 Uhr zur Verfügung. Bei rechtlichen Fragen zur EU-Richtlinie 2023/970,
                        technischen Problemen oder individuellen Anforderungen helfen wir gerne.
                    </p>
                </div>
                <button
                    onClick={() => setShowSupport(true)}
                    className="flex-shrink-0 flex items-center gap-2 font-bold text-white px-5 py-2.5 rounded-lg transition-transform hover:-translate-y-0.5 text-sm"
                    style={{ background: 'linear-gradient(135deg,var(--color-pl-brand),#6366f1)', boxShadow: '0 8px 20px rgba(99,102,241,0.25)' }}
                >
                    <MessageSquare size={15} /> Support-Ticket öffnen
                </button>
            </div>
        </div>
    )
}
