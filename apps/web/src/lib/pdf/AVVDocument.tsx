import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// ─── Palette ─────────────────────────────────────────────────────────────────
const NAVY   = '#0f172a'
const BRAND  = '#1A3E66'
const MUTED  = '#64748b'
const BORDER = '#e2e8f0'
const WHITE  = '#ffffff'
const LIGHT  = '#f8fafc'

// ─── DexterBee GmbH — official data ──────────────────────────────────────────
const DEXTERBEE = {
    name:    'DexterBee GmbH',
    street:  'Industriestr. 13',
    zip:     '63755',
    city:    'Alzenau',
    country: 'Deutschland',
    hrb:     'HRB 17694',
    court:   'Amtsgericht Aschaffenburg',
    gf:      'Stephan Dongjin Oh',
    gftitle: 'Geschäftsführer',
    vatId:   'DE369096037',
    email:   'hallo@complens.de',
    dsemail: 'datenschutz@complens.de',
    web:     'complens.de',
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        fontFamily:        'Helvetica',
        backgroundColor:   WHITE,
        paddingTop:        48,
        paddingBottom:     60,
        fontSize:          9.5,
        color:             NAVY,
    },
    headerBar: {
        marginTop:         -48,
        backgroundColor:   BRAND,
        paddingHorizontal: 40,
        paddingVertical:   20,
        marginBottom:      24,
    },
    headerTitle: {
        fontSize:    17,
        fontFamily:  'Helvetica-Bold',
        color:       WHITE,
        marginBottom: 3,
    },
    headerSub: {
        fontSize: 9,
        color:    'rgba(255,255,255,0.7)',
    },

    content: {
        paddingHorizontal: 40,
    },
    badge: {
        alignSelf:        'flex-start',
        backgroundColor:  '#dcfce7',
        borderWidth:      1,
        borderColor:      '#86efac',
        borderRadius:     4,
        paddingVertical:  3,
        paddingHorizontal: 8,
        marginBottom:     16,
    },
    badgeText: {
        fontSize:   8,
        color:      '#15803d',
        fontFamily: 'Helvetica-Bold',
    },
    partiesRow: {
        flexDirection:  'row',
        gap:            16,
        marginBottom:   18,
    },
    partyBox: {
        flex:           1,
        padding:        12,
        backgroundColor: LIGHT,
        borderRadius:   4,
        borderWidth:    1,
        borderColor:    BORDER,
        borderLeftWidth: 3,
        borderLeftColor: BRAND,
    },
    partyLabel: {
        fontSize:    7.5,
        fontFamily:  'Helvetica-Bold',
        color:       MUTED,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 5,
    },
    partyName: {
        fontSize:   10,
        fontFamily: 'Helvetica-Bold',
        color:      NAVY,
        marginBottom: 2,
    },
    partyDetail: {
        fontSize: 8.5,
        color:    MUTED,
        lineHeight: 1.5,
    },
    sectionHeading: {
        fontSize:    11,
        fontFamily:  'Helvetica-Bold',
        color:       BRAND,
        marginTop:   16,
        marginBottom: 5,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#dbeafe',
    },
    para: {
        fontSize:   9,
        lineHeight: 1.65,
        color:      '#334155',
        marginBottom: 6,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom:  4,
        paddingLeft:   8,
    },
    bullet: {
        fontSize:   9,
        color:      BRAND,
        marginRight: 5,
        marginTop:  1,
    },
    listText: {
        flex:       1,
        fontSize:   9,
        lineHeight: 1.6,
        color:      '#334155',
    },
    // Numbered list item
    numRow: {
        flexDirection:  'row',
        marginBottom:   5,
        paddingLeft:    4,
    },
    numLabel: {
        fontSize:   9,
        fontFamily: 'Helvetica-Bold',
        color:      BRAND,
        marginRight: 6,
        minWidth:   18,
    },
    numText: {
        flex:       1,
        fontSize:   9,
        lineHeight: 1.6,
        color:      '#334155',
    },
    table: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 3,
        marginBottom: 10,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: LIGHT,
        paddingVertical: 7,
        paddingHorizontal: 9,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 9,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    tableRowLast: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 9,
    },
    colA: { flex: 2, fontSize: 9, color: MUTED, fontFamily: 'Helvetica-Bold' },
    colB: { flex: 2, fontSize: 9, color: '#334155' },
    colC: { flex: 2, fontSize: 9, color: '#334155' },
    colD: { flex: 2, fontSize: 9, color: '#334155' },
    infoBox: {
        backgroundColor: '#eff6ff',
        borderWidth:     1,
        borderColor:     '#bfdbfe',
        borderRadius:    4,
        padding:         9,
        marginBottom:    10,
    },
    infoText: {
        fontSize:   8.5,
        color:      '#1e40af',
        lineHeight: 1.5,
    },
    sigSection: {
        flexDirection: 'row',
        marginTop:     28,
        gap:           24,
    },
    sigBox: {
        flex:           1,
        borderTopWidth: 1.5,
        borderTopColor: BORDER,
        paddingTop:     10,
    },
    sigLabel: {
        fontSize:   7.5,
        color:      MUTED,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 5,
    },
    sigName: {
        fontSize:   11,
        fontFamily: 'Helvetica-BoldOblique',
        color:      BRAND,
        marginBottom: 2,
    },
    sigDetail: {
        fontSize: 8.5,
        color:    MUTED,
        lineHeight: 1.4,
    },
    sigDateLine: {
        fontSize: 8,
        color:    MUTED,
        marginTop: 8,
    },
    footer: {
        position:   'absolute',
        bottom:     18,
        left:       40,
        right:      40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: BORDER,
        paddingTop: 6,
    },
    footerTxt: {
        fontSize: 7,
        color:    MUTED,
    },
})

// ─── Props ───────────────────────────────────────────────────────────────────
export type AVVDocumentProps = {
    orgName:             string
    orgAddress:          string
    legalRepresentative: string
    vatId:               string
    contactEmail:        string
    contactName:         string
    contactTitle:        string
    issuedDate:          string
    avvId:               string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Item({ text }: { text: string }) {
    return (
        <View style={s.listItem} wrap={false}>
            <Text style={s.bullet}>›</Text>
            <Text style={s.listText}>{text}</Text>
        </View>
    )
}

function Num({ n, text }: { n: string; text: string }) {
    return (
        <View style={s.numRow} wrap={false}>
            <Text style={s.numLabel}>{n}</Text>
            <Text style={s.numText}>{text}</Text>
        </View>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View>
            <Text style={s.sectionHeading}>{title}</Text>
            {children}
        </View>
    )
}

function Footer({ avvId }: { avvId: string }) {
    return (
        <View style={s.footer} fixed>
            <Text style={s.footerTxt}>
                Auftragsverarbeitungsvertrag (AVV) gem. Art. 28 DSGVO · {avvId} · {DEXTERBEE.name}
            </Text>
            <Text
                style={s.footerTxt}
                render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`}
            />
        </View>
    )
}

// ─── Subprocessors ────────────────────────────────────────────────────────────
const SUBPROCESSORS = [
    {
        name:    'Supabase Inc.',
        purpose: 'Datenbank, Auth, Dateispeicher',
        region:  'AWS eu-central-1 (Frankfurt 🇩🇪)',
        basis:   'SCC + DPA',
    },
    {
        name:    'Vercel Inc.',
        purpose: 'Frontend-Hosting, API-Routen',
        region:  'Edge fra1 (Frankfurt 🇩🇪)',
        basis:   'SCC + DPA',
    },
    {
        name:    'Google LLC (EU-Endpunkte)',
        purpose: 'Generative KI (Gemini 2.5 Pro)',
        region:  'EU-API · kein US-Transfer',
        basis:   'SCC + DPA',
    },
    {
        name:    'Resend Inc.',
        purpose: 'Transaktions-E-Mails',
        region:  'EU-Datenspeicherung',
        basis:   'EU-US DPF + DPA',
    },
]

// ─── AVV Document ─────────────────────────────────────────────────────────────
export const AVVDocument = ({
    orgName, orgAddress, legalRepresentative, vatId,
    contactEmail, contactName, contactTitle, issuedDate, avvId,
}: AVVDocumentProps) => (
    <Document
        title={`AVV gem. Art. 28 DSGVO — ${orgName}`}
        author={DEXTERBEE.name}
        subject="Auftragsverarbeitungsvertrag DSGVO Art. 28"
        language="de"
        creator={`${DEXTERBEE.name} · ${DEXTERBEE.web}`}
    >
        {/* ══════════════════════════════════════════════════════
            PAGE 1 — Parteien, Gegenstand, §§ 1–4
        ══════════════════════════════════════════════════════ */}
        <Page size="A4" style={s.page}>
            <View style={s.headerBar}>
                <Text style={s.headerTitle}>Auftragsverarbeitungsvertrag</Text>
                <Text style={s.headerSub}>
                    gemäß Art. 28 DSGVO · Vertragsnummer: {avvId} · Ausstellungsdatum: {issuedDate}
                </Text>
            </View>

            <View style={s.content}>
                <View style={s.badge}>
                    <Text style={s.badgeText}>
                        ✓  Von {DEXTERBEE.name} unterzeichnet · {issuedDate}
                    </Text>
                </View>

                {/* ── Parteien ── */}
                <View style={s.partiesRow}>
                    <View style={s.partyBox}>
                        <Text style={s.partyLabel}>Auftragsverarbeiter</Text>
                        <Text style={s.partyName}>{DEXTERBEE.name}</Text>
                        <Text style={s.partyDetail}>
                            {DEXTERBEE.street} · {DEXTERBEE.zip} {DEXTERBEE.city}{'\n'}
                            {DEXTERBEE.country}{'\n'}
                            {DEXTERBEE.hrb}, {DEXTERBEE.court}{'\n'}
                            USt-IdNr.: {DEXTERBEE.vatId}{'\n'}
                            Vertreten durch: {DEXTERBEE.gf} ({DEXTERBEE.gftitle}){'\n'}
                            {DEXTERBEE.email} · {DEXTERBEE.web}
                        </Text>
                    </View>
                    <View style={s.partyBox}>
                        <Text style={s.partyLabel}>Verantwortlicher (Auftraggeber)</Text>
                        <Text style={s.partyName}>{orgName}</Text>
                        <Text style={s.partyDetail}>
                            {orgAddress}{'\n'}
                            Vertreten durch: {legalRepresentative}{'\n'}
                            {vatId ? `USt-IdNr.: ${vatId}\n` : ''}E-Mail: {contactEmail}
                        </Text>
                    </View>
                </View>

                {/* ── Präambel ── */}
                <Section title="Präambel">
                    <Text style={s.para}>
                        Dieser Auftragsverarbeitungsvertrag (nachfolgend „AVV") wird zwischen dem Verantwortlichen
                        (nachfolgend „Auftraggeber") und dem Auftragsverarbeiter {DEXTERBEE.name}
                        (nachfolgend „Auftragnehmer") gemäß Art. 28 der Datenschutz-Grundverordnung (DSGVO)
                        abgeschlossen und ist Bestandteil des Softwarenutzungsvertrages für CompLens.
                    </Text>
                    <Text style={s.para}>
                        Der Auftragnehmer verarbeitet im Rahmen der Softwarenutzung personenbezogene Daten
                        im Auftrag und nach Weisung des Auftraggebers. Dieser AVV legt die Bedingungen
                        dieser Verarbeitung abschließend fest.
                    </Text>
                </Section>

                {/* ── Art. 1 Gegenstand ── */}
                <Section title="Art. 1  Gegenstand und Dauer der Verarbeitung">
                    <Num n="1.1" text="Gegenstand der Auftragsverarbeitung ist die Bereitstellung der cloudbasierten Software CompLens als Software-as-a-Service (SaaS) zur Analyse von Entgeltlücken gemäß EU-Richtlinie 2023/970/EU." />
                    <Num n="1.2" text="Die Verarbeitung personenbezogener Daten erfolgt für die Dauer des zwischen den Parteien geschlossenen Softwarenutzungsvertrages. Nach Vertragsende werden alle personenbezogenen Daten binnen 30 Tagen unwiderruflich gelöscht, sofern keine gesetzliche Aufbewahrungspflicht besteht." />
                    <Num n="1.3" text="Der Auftragnehmer verarbeitet die Daten ausschließlich in der Europäischen Union (EU) / dem Europäischen Wirtschaftsraum (EWR), konkret auf Servern in Frankfurt am Main, Deutschland (AWS eu-central-1)." />
                </Section>

                {/* ── Art. 2 Art der Daten ── */}
                <Section title="Art. 2  Art der personenbezogenen Daten und Kategorien betroffener Personen">
                    <Text style={s.para}>Folgende Kategorien personenbezogener Daten werden verarbeitet:</Text>
                    <Item text="Beschäftigtenstammdaten: Mitarbeiter-Identifikatoren (ggf. Klarnamen, soweit vom Auftraggeber hochgeladen), Jobtitel, Abteilung, Einstellungsdatum, Beschäftigungsgrad, Berufsgruppe." />
                    <Item text="Entgeltdaten: Bruttoverdienst (Basis- und Variablelohn), Bonuszahlungen — qualifiziert als besondere Kategorie sensibler Beschäftigtendaten." />
                    <Item text="Nutzerdaten: Namen und E-Mail-Adressen der Plattformnutzer (HR-Mitarbeitende) für Authentifizierung und Audit-Log." />
                    <Text style={[s.para, { marginTop: 4 }]}>
                        Kategorien betroffener Personen: Beschäftigte und Dienstleister des Auftraggebers.
                    </Text>
                </Section>

                {/* ── Art. 3 Pflichten Auftragsverarbeiter ── */}
                <Section title="Art. 3  Pflichten des Auftragsverarbeiters">
                    <Num n="3.1" text="Der Auftragnehmer verarbeitet personenbezogene Daten ausschließlich auf dokumentierte Weisung des Auftraggebers, es sei denn, er ist nach dem Unionsrecht oder dem Recht eines Mitgliedstaats verpflichtet (Art. 28 Abs. 3 lit. a DSGVO)." />
                    <Num n="3.2" text="Der Auftragnehmer gewährleistet, dass die zur Verarbeitung befugten Personen zur Vertraulichkeit verpflichtet sind oder einer angemessenen gesetzlichen Schweigepflicht unterliegen (Art. 28 Abs. 3 lit. b DSGVO)." />
                    <Num n="3.3" text="Der Auftragnehmer setzt die in Art. 5 dieses AVV beschriebenen technischen und organisatorischen Maßnahmen um (Art. 28 Abs. 3 lit. c DSGVO)." />
                    <Num n="3.4" text="Der Auftragnehmer unterstützt den Auftraggeber bei der Erfüllung der Betroffenenrechte (Auskunft, Berichtigung, Löschung, Einschränkung, Datenportabilität) gemäß Art. 28 Abs. 3 lit. e DSGVO." />
                    <Num n="3.5" text="Der Auftragnehmer stellt alle notwendigen Informationen zum Nachweis der Einhaltung dieses Artikels zur Verfügung und ermöglicht Überprüfungen durch den Auftraggeber oder von ihm beauftragte Prüfer (Art. 28 Abs. 3 lit. h DSGVO)." />
                </Section>
                {/* ── Art. 4 Unterauftragsverarbeiter ── */}
                <Section title="Art. 4  Unterauftragsverarbeiter (Subprocessors)">
                    <Num n="4.1" text="Der Auftraggeber erteilt dem Auftragnehmer die allgemeine Genehmigung zur Beauftragung der nachfolgend aufgeführten Unterauftragsverarbeiter. Der Auftragnehmer informiert den Auftraggeber über geplante Änderungen im Unteraufträgerverhältnis und räumt dem Auftraggeber ein Widerspruchsrecht ein (Art. 28 Abs. 2 DSGVO)." />
                    <Num n="4.2" text="Alle Unterauftragsverarbeiter wurden vertraglich zu gleichwertigen Datenschutzpflichten verpflichtet (Standardvertragsklauseln / SCC oder EU-US Data Privacy Framework)." />

                    {/* Subprocessors table */}
                    <View style={[s.table, { marginTop: 8 }]}>
                        <View style={s.tableHeader}>
                            <Text style={[s.colA, { flex: 2.5 }]}>Anbieter</Text>
                            <Text style={[s.colB, { flex: 2.5 }]}>Zweck</Text>
                            <Text style={s.colC}>Serverstandort</Text>
                            <Text style={s.colD}>Rechtsgrundlage</Text>
                        </View>
                        {SUBPROCESSORS.map((sp, i) => (
                            <View key={sp.name} style={i === SUBPROCESSORS.length - 1 ? s.tableRowLast : s.tableRow}>
                                <Text style={[s.colA, { flex: 2.5, fontFamily: 'Helvetica' }]}>{sp.name}</Text>
                                <Text style={[s.colB, { flex: 2.5 }]}>{sp.purpose}</Text>
                                <Text style={s.colC}>{sp.region}</Text>
                                <Text style={s.colD}>{sp.basis}</Text>
                            </View>
                        ))}
                    </View>
                </Section>

                {/* ── Art. 5 TOMs ── */}
                <Section title="Art. 5  Technische und Organisatorische Maßnahmen (TOMs)">
                    <Text style={s.para}>
                        Der Auftragnehmer hat die folgenden Maßnahmen zum Schutz der verarbeiteten Daten
                        gemäß Art. 32 DSGVO implementiert:
                    </Text>
                    <Item text="Vertraulichkeit: TLS 1.3 für alle Datenübertragungen (Data-in-Transit). AES-256 Verschlüsselung aller gespeicherten Daten inkl. Backups (Data-at-Rest)." />
                    <Item text="Mandantentrennung: PostgreSQL Row Level Security (RLS) — jede Zeile in der Datenbank ist mit einer org_id verknüpft. Technisch ist kein organisationsübergreifender Datenzugriff möglich." />
                    <Item text="Zugriffskontrolle: Authentifizierung über Supabase Auth (bcrypt-Passwort-Hashing). Rollenbasiertes Rechtekonzept (Admin / Analyst / Viewer). Multi-Faktor-Authentifizierung (MFA) verfügbar." />
                    <Item text="Datensparsamkeit bei KI-Anfragen (Zero-PII): Bei Anfragen an generative KI-Modelle werden keine Klarnamen, E-Mail-Adressen oder direkte Personenidentifikatoren übertragen — ausschließlich pseudonymisierte Kennungen und sachliche Entgeltinformationen." />
                    <Item text="Verfügbarkeit: Systemverfügbarkeit ≥ 99 % pro Kalendermonat. Regelmäßige Backups in AWS eu-central-1. Supabase und Vercel sind SOC 2 Typ II zertifiziert." />
                    <Item text="Löschung: Auf Anfrage oder nach Vertragsende werden alle personenbezogenen Daten binnen 30 Tagen unwiderruflich gelöscht (Hard Delete mit Kaskade auf alle verknüpften Datensätze)." />
                    <Item text="Vorfallmanagement: Bei Datenpannen (Art. 4 Nr. 12 DSGVO) informiert der Auftragnehmer den Auftraggeber unverzüglich, spätestens innerhalb von 72 Stunden nach Bekanntwerden." />
                </Section>

                {/* ── Art. 6 AI Act ── */}
                <Section title="Art. 6  Generative KI und EU AI Act">
                    <Text style={s.para}>
                        CompLens setzt Generative KI (Google Gemini 2.5 Pro) für die Erstellung von
                        Erklärungsentwürfen und Maßnahmenplänen ein. Bezüglich des EU Artificial
                        Intelligence Act (AI Act, VO (EU) 2024/1689) gilt:
                    </Text>
                    <Num n="6.1" text={'Klassifizierung: Das eingesetzte KI-System fällt in die Kategorie \u201egeringes Risiko\u201c gem\u00e4\u00df EU AI Act (kein Hochrisiko-System nach Anhang III, da keine autonomen Entscheidungen \u00fcber Besch\u00e4ftigte getroffen werden).'} />
                    <Num n="6.2" text="Human-in-the-Loop: Alle KI-generierten Textvorschläge müssen von HR-Verantwortlichen manuell geprüft, angepasst und freigegeben werden, bevor sie in Berichte einfließen. Autonome Entscheidungsfindung über Beschäftigte (Art. 22 DSGVO) findet nicht statt." />
                    <Num n="6.3" text="Kein KI-Training: Kundendaten werden von Google nicht für das Training von KI-Modellen verwendet (vertraglich über ein Data Processing Addendum mit EU-SCC abgesichert)." />
                    <Num n="6.4" text="Transparenz: Im System ist an jeder Stelle klar ersichtlich, wenn Inhalte durch KI generiert wurden." />
                </Section>

                {/* ── Art. 7 Rechte des Auftraggebers ── */}
                <Section title="Art. 7  Rechte des Auftraggebers / Betroffenenrechte">
                    <Num n="7.1" text="Der Auftragnehmer unterstützt den Auftraggeber bei der Erfüllung von Auskunftsersuchen, Berichtigungs-, Löschungs- und Einschränkungsanfragen betroffener Personen gemäß Art. 15–22 DSGVO." />
                    <Num n="7.2" text={'Das CompLens-Modul \u201eAuskunftsrecht\u201c stellt Werkzeuge zur datenschutzkonformen Bearbeitung individueller Mitarbeiteranfragen gem. \u00a7 10 EntgTranspG und Art. 15 DSGVO bereit.'} />
                    <Num n="7.3" text="Der Auftraggeber ist berechtigt, Datenschutzaudits beim Auftragnehmer durchzuführen oder durch einen beauftragten Dritten (Datenschutzbeauftragter, Wirtschaftsprüfer) durchführen zu lassen. Der Auftragnehmer kooperiert dabei vollständig." />
                    <Num n="7.4" text="Kontakt für Datenschutzanfragen: datenschutz@complens.de" />
                </Section>
                {/* ── Art. 8 Datenpannen ── */}
                <Section title="Art. 8  Meldepflichten bei Datenpannen">
                    <Num n="8.1" text="Der Auftragnehmer meldet dem Auftraggeber Datenschutzverletzungen i. S. d. Art. 4 Nr. 12 DSGVO unverzüglich — soweit möglich innerhalb von 24 Stunden nach Bekanntwerden, spätestens jedoch innerhalb von 72 Stunden." />
                    <Num n="8.2" text="Die Meldung enthält mindestens: (a) Art der Verletzung, (b) Kategorien und ungefähre Zahl der betroffenen Personen und Datensätze, (c) ergriffene und vorgeschlagene Maßnahmen." />
                    <Num n="8.3" text="Meldekontakt für Datenpannen: datenschutz@complens.de (24/7 überwacht)." />
                </Section>

                {/* ── Art. 9 Löschung und Rückgabe ── */}
                <Section title="Art. 9  Löschung und Rückgabe von Daten">
                    <Num n="9.1" text="Nach Beendigung der Auftragsverarbeitung löscht der Auftragnehmer alle personenbezogenen Daten des Auftraggebers binnen 30 Tagen vollständig und unwiderruflich aus allen Systemen, sofern keine gesetzliche Aufbewahrungspflicht besteht." />
                    <Num n="9.2" text="Auf Anfrage des Auftraggebers stellt der Auftragnehmer vor der Löschung einen vollständigen Datenexport aller Analysen im maschinenlesbaren Format (CSV/JSON) bereit." />
                    <Num n="9.3" text="Der Auftragnehmer bestätigt die vollständige Löschung auf Wunsch des Auftraggebers schriftlich." />
                </Section>

                {/* ── Art. 10 Weisungsrecht ── */}
                <Section title="Art. 10  Weisungsrecht des Auftraggebers">
                    <Num n="10.1" text="Der Auftraggeber ist berechtigt, dem Auftragnehmer jederzeit Weisungen zur Datenverarbeitung zu erteilen. Weisungen sind schriftlich (E-Mail genügt) zu dokumentieren." />
                    <Num n="10.2" text="Hält der Auftragnehmer eine Weisung für datenschutzrechtlich unzulässig, informiert er den Auftraggeber unverzüglich. Der Auftraggeber trägt in diesem Fall die Verantwortung für die Rechtskonformität der Weisung." />
                    <Text style={[s.para, { marginTop: 6 }]}>
                        Weisungsadresse: {DEXTERBEE.email}
                    </Text>
                </Section>

                {/* ── Art. 11 Schlussbestimmungen ── */}
                <Section title="Art. 11  Schlussbestimmungen">
                    <Item text="Dieser AVV unterliegt dem Recht der Bundesrepublik Deutschland; Gerichtsstand ist Alzenau / Aschaffenburg." />
                    <Item text="Änderungen dieses AVV bedürfen der Schriftform und der gegenseitigen Zustimmung." />
                    <Item text="Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit des AVV im Übrigen unberührt (salvatorische Klausel)." />
                    <Item text="Dieser AVV wird in elektronischer Form geschlossen und ist gemäß eIDAS-VO und §§ 126a, 127 BGB formwirksam." />
                    <Item text={`Dieser AVV ist Bestandteil des Softwarenutzungsvertrages (CompLens Lizenzvertrag) zwischen ${orgName} und ${DEXTERBEE.name}.`} />
                </Section>

                {/* ── Unterschriften ── */}
                <View style={s.sigSection}>
                    {/* Auftragsverarbeiter — vorunterschrieben */}
                    <View style={s.sigBox}>
                        <Text style={s.sigLabel}>Auftragsverarbeiter — {DEXTERBEE.name}</Text>
                        <Text style={s.sigName}>{DEXTERBEE.gf}</Text>
                        <Text style={s.sigDetail}>{DEXTERBEE.gftitle}</Text>
                        <Text style={s.sigDetail}>{DEXTERBEE.name}</Text>
                        <Text style={s.sigDetail}>{DEXTERBEE.email}</Text>
                        <Text style={s.sigDateLine}>✓ Digital unterzeichnet am {issuedDate}</Text>
                        <Text style={{ fontSize: 7, color: MUTED, marginTop: 4 }}>
                            Einfache elektronische Signatur gem. Art. 3 Nr. 10 eIDAS-VO
                        </Text>
                    </View>

                    {/* Verantwortlicher — zu unterschreiben */}
                    <View style={s.sigBox}>
                        <Text style={s.sigLabel}>Verantwortlicher — {orgName}</Text>
                        <Text style={[s.sigName, { color: MUTED }]}>
                            {legalRepresentative || '______________________________'}
                        </Text>
                        <Text style={s.sigDetail}>{contactTitle || contactName || '—'}</Text>
                        <Text style={s.sigDetail}>{orgName}</Text>
                        <Text style={s.sigDetail}>{contactEmail}</Text>
                        <Text style={s.sigDateLine}>
                            Datum / Ort: ___________________________
                        </Text>
                        <Text style={{ fontSize: 7, color: MUTED, marginTop: 4 }}>
                            Durch Aktivierung der CompLens-Lizenz stimmt der Verantwortliche
                            diesem AVV zu (Art. 28 Abs. 1 DSGVO, § 151 BGB).
                        </Text>
                    </View>
                </View>

                {/* ── Legal note ── */}
                <View style={{
                    marginTop: 18, padding: 10, backgroundColor: LIGHT,
                    borderRadius: 4, borderWidth: 1, borderColor: BORDER,
                }}>
                    <Text style={{ fontSize: 7.5, color: MUTED, lineHeight: 1.5 }}>
                        Dieser AVV wurde gemäß den Anforderungen des Art. 28 DSGVO erstellt. Er ersetzt keine
                        individuelle Rechtsberatung. Für Fragen wenden Sie sich an: {DEXTERBEE.dsemail}.{'\n'}
                        {DEXTERBEE.name} · {DEXTERBEE.street}, {DEXTERBEE.zip} {DEXTERBEE.city} ·
                        {' '}{DEXTERBEE.hrb}, {DEXTERBEE.court} · Stand: März 2026
                    </Text>
                </View>
            </View>

            <Footer avvId={avvId} />
        </Page>
    </Document>
)
