import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// ─── Palette ─────────────────────────────────────────────────────────────────
const NAVY   = '#0f172a'
const BRAND  = '#1A3E66'
const MUTED  = '#64748b'
const BORDER = '#e2e8f0'
const WHITE  = '#ffffff'
const LIGHT  = '#f8fafc'

// ─── DexterBee GmbH — official data from Impressum ───────────────────────────
const DEXTERBEE = {
    name:     'DexterBee GmbH',
    street:   'Industriestr. 13',
    zip:      '63755',
    city:     'Alzenau',
    country:  'Deutschland',
    hrb:      'HRB 17694',
    court:    'Amtsgericht Aschaffenburg',
    gf:       'Stephan Dongjin Oh',
    gftitle:  'Geschäftsführer',
    vatId:    'DE369096037',
    email:    'hallo@complens.de',
    web:      'complens.de',
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        fontFamily:        'Helvetica',
        backgroundColor:   WHITE,
        paddingTop:        48,
        paddingBottom:     72,   // reserve space for fixed footer
        fontSize:          9.5,
        color:             NAVY,
    },

    // ── Header bar (Page 1) ──
    headerBar: {
        marginTop:         -48,
        backgroundColor:   BRAND,
        paddingHorizontal: 40,
        paddingVertical:   20,
        marginBottom:      24,
    },
    headerTitle: {
        fontSize:    18,
        fontFamily:  'Helvetica-Bold',
        color:       WHITE,
        marginBottom: 4,
    },
    headerSub: {
        fontSize: 9,
        color:    'rgba(255,255,255,0.7)',
    },



    // ── Content area ──
    content: {
        paddingHorizontal: 40,
    },

    // ── Parties box ──
    partiesRow: {
        flexDirection:  'row',
        gap:            16,
        marginBottom:   20,
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
        marginBottom: 6,
    },
    partyName: {
        fontSize:   10.5,
        fontFamily: 'Helvetica-Bold',
        color:      NAVY,
        marginBottom: 2,
    },
    partyDetail: {
        fontSize: 8.5,
        color:    MUTED,
        lineHeight: 1.5,
    },

    // ── Section heading ──
    sectionHeading: {
        fontSize:    11,
        fontFamily:  'Helvetica-Bold',
        color:       BRAND,
        marginTop:   16,
        marginBottom: 6,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#dbeafe',
    },

    // ── Paragraph ──
    para: {
        fontSize:   9,
        lineHeight: 1.65,
        color:      '#334155',
        marginBottom: 6,
    },

    // ── List ──
    listItem: {
        flexDirection:  'row',
        marginBottom:   4,
        paddingLeft:    8,
    },
    bullet: {
        fontSize:   9,
        color:      BRAND,
        marginRight: 6,
        marginTop:  1,
    },
    listText: {
        flex:       1,
        fontSize:   9,
        lineHeight: 1.6,
        color:      '#334155',
    },

    // ── Table ──
    table: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 4,
        marginBottom: 12,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection:    'row',
        backgroundColor:  LIGHT,
        paddingVertical:   8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    tableRow: {
        flexDirection:    'row',
        paddingVertical:   7,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    tableRowLast: {
        flexDirection:    'row',
        paddingVertical:   7,
        paddingHorizontal: 10,
    },
    tableColL: { flex: 2, fontSize: 9, color: MUTED, fontFamily: 'Helvetica-Bold' },
    tableColR: { flex: 3, fontSize: 9, color: '#334155' },

    // ── Highlight box ──
    infoBox: {
        backgroundColor: '#eff6ff',
        borderWidth:     1,
        borderColor:     '#bfdbfe',
        borderRadius:    4,
        padding:         10,
        marginBottom:    12,
    },
    infoText: {
        fontSize:   8.5,
        color:      '#1e40af',
        lineHeight: 1.55,
    },

    // ── Signature section ──
    sigSection: {
        flexDirection:  'row',
        marginTop:      28,
        gap:            24,
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
        marginBottom: 6,
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

    // ── Badge ──
    badge: {
        alignSelf:        'flex-start',
        backgroundColor:  '#dcfce7',
        borderWidth:      1,
        borderColor:      '#86efac',
        borderRadius:     4,
        paddingVertical:  3,
        paddingHorizontal: 8,
        marginBottom:     18,
    },
    badgeText: {
        fontSize:   8,
        color:      '#15803d',
        fontFamily: 'Helvetica-Bold',
    },

    // ── Footer ──
    footer: {
        position:   'absolute',
        bottom:     24,
        left:       40,
        right:      40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: BORDER,
        paddingTop: 7,
    },
    footerTxt: {
        fontSize: 7.5,
        color:    MUTED,
    },
})

// ─── Props ───────────────────────────────────────────────────────────────────
export type ContractDocumentProps = {
    orgName:             string
    orgAddress:          string   // e.g. "Musterstr. 1, 80331 München, Deutschland"
    legalRepresentative: string   // e.g. "Maria Müller, Geschäftsführerin"
    vatId:               string   // optional
    contactEmail:        string
    contactName:         string
    contactTitle:        string   // job title
    plan:                'paylens' | 'paylens_ai' | 'additional_user' | string
    issuedDate:          string
    contractId:          string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function planLabel(plan: string): string {
    if (plan === 'additional_user') return 'CompLens Nutzerplatz-Erweiterung (Add-on)'
    return 'CompLens Lizenz (SaaS, jährlich)'
}

function planPrice(plan: string): string {
    if (plan === 'additional_user') return '€ 990,00 zzgl. MwSt. pro Platz/Jahr'
    return '€ 5.990,00 zzgl. MwSt. pro Jahr'
}

function Item({ text }: { text: string }) {
    return (
        <View style={s.listItem} wrap={false}>
            <Text style={s.bullet}>›</Text>
            <Text style={s.listText}>{text}</Text>
        </View>
    )
}

function Section({ title, children, breakBefore }: { title: string; children: React.ReactNode; breakBefore?: boolean }) {
    return (
        <View break={breakBefore}>
            <Text style={s.sectionHeading}>{title}</Text>
            {children}
        </View>
    )
}

// ─── Footer (shared across all pages) ────────────────────────────────────────
function Footer({ contractId }: { contractId: string }) {
    return (
        <View style={s.footer} fixed>
            <Text style={s.footerTxt}>
                CompLens Softwarenutzungsvertrag · {contractId} · {DEXTERBEE.name}
            </Text>
            <Text
                style={s.footerTxt}
                render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`}
            />
        </View>
    )
}

// ─── Contract Document ────────────────────────────────────────────────────────
export const ContractDocument = ({
    orgName, orgAddress, legalRepresentative, vatId,
    contactEmail, contactName, contactTitle, plan, issuedDate, contractId,
}: ContractDocumentProps) => {
    const isAddon = plan === 'additional_user'
    const docTitle = isAddon
        ? 'Nutzerplatz-Erweiterungsvereinbarung'
        : 'Softwarenutzungsvertrag (SaaS)'

    return (
        <Document
            title={`CompLens ${docTitle} — ${orgName}`}
            author={DEXTERBEE.name}
            subject="SaaS-Lizenzvertrag CompLens"
            language="de"
            creator={`${DEXTERBEE.name} · ${DEXTERBEE.web}`}
        >
            {/* ══════════════════════════════════════════════════════
                PAGE 1 — Deckblatt, Parteien, §§ 1–4
            ══════════════════════════════════════════════════════ */}
            <Page size="A4" style={s.page}>
                {/* ── Header ── */}
                <View style={s.headerBar}>
                    <Text style={s.headerTitle}>{docTitle}</Text>
                    <Text style={s.headerSub}>
                        CompLens · Vertragsnummer: {contractId} · Ausstellungsdatum: {issuedDate}
                    </Text>
                </View>

                <View style={s.content}>
                    {/* ── Signed badge ── */}
                    <View style={s.badge}>
                        <Text style={s.badgeText}>
                            ✓  Von {DEXTERBEE.name} unterzeichnet · {issuedDate}
                        </Text>
                    </View>

                    {/* ── Parteien ── */}
                    <View style={s.partiesRow}>
                        {/* Anbieter */}
                        <View style={s.partyBox}>
                            <Text style={s.partyLabel}>Auftragnehmer (Anbieter)</Text>
                            <Text style={s.partyName}>{DEXTERBEE.name}</Text>
                            <Text style={s.partyDetail}>
                                {DEXTERBEE.street} · {DEXTERBEE.zip} {DEXTERBEE.city}{'\n'}
                                {DEXTERBEE.country}{'\n'}
                                Handelsregister: {DEXTERBEE.hrb}, {DEXTERBEE.court}{'\n'}
                                USt-IdNr.: {DEXTERBEE.vatId}{'\n'}
                                Vertreten durch: {DEXTERBEE.gf} ({DEXTERBEE.gftitle}){'\n'}
                                E-Mail: {DEXTERBEE.email} · Web: {DEXTERBEE.web}
                            </Text>
                        </View>

                        {/* Auftraggeber */}
                        <View style={s.partyBox}>
                            <Text style={s.partyLabel}>Auftraggeber (Kunde)</Text>
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
                            Die {DEXTERBEE.name} (nachfolgend „Anbieter") ist Entwicklerin und Betreiberin
                            der cloudbasierten Softwarelösung CompLens zur EU-konformen Entgelttransparenzanalyse
                            gemäß Richtlinie 2023/970/EU und dem deutschen Entgelttransparenzgesetz (EntgTranspG).
                            Der Auftraggeber (nachfolgend „Kunde") wünscht die Nutzung dieser Lösung im Rahmen
                            einer SaaS-Lizenz. Dieser Vertrag regelt die Bedingungen dieser Nutzung abschließend
                            und ergänzt die Allgemeinen Geschäftsbedingungen der {DEXTERBEE.name} (abrufbar unter
                            complens.de/agb), die im Zweifelsfall diesem Vertrag vorgehen.
                        </Text>
                    </Section>

                    {/* ── §1 Vertragsgegenstand ── */}
                    <Section title="§ 1  Vertragsgegenstand">
                        <Text style={s.para}>
                            Gegenstand dieses Vertrages ist die zeitlich befristete Überlassung des Zugangs zur
                            webbasierten Software CompLens als Software-as-a-Service (SaaS) über das Internet.
                            Der Anbieter stellt dem Kunden die Software auf seinen Servern bereit
                            (Hosting ausschließlich in der EU, Rechenzentrum Frankfurt am Main / Deutschland).
                        </Text>
                        <Text style={s.para}>Der gebuchte Leistungsumfang ist in folgender Tabelle zusammengefasst:</Text>
                        <View style={s.table}>
                            <View style={s.tableHeader}>
                                <Text style={s.tableColL}>Position</Text>
                                <Text style={s.tableColR}>Details</Text>
                            </View>
                            <View style={s.tableRow}>
                                <Text style={s.tableColL}>Produkt</Text>
                                <Text style={s.tableColR}>{planLabel(plan)}</Text>
                            </View>
                            <View style={s.tableRow}>
                                <Text style={s.tableColL}>Laufzeit</Text>
                                <Text style={s.tableColR}>12 Monate, automatische Verlängerung um jeweils 12 Monate</Text>
                            </View>
                            <View style={s.tableRow}>
                                <Text style={s.tableColL}>Vergütung</Text>
                                <Text style={s.tableColR}>{planPrice(plan)}</Text>
                            </View>
                            <View style={s.tableRowLast}>
                                <Text style={s.tableColL}>Abrechnung</Text>
                                <Text style={s.tableColR}>Jährlich im Voraus · Kreditkarte oder SEPA-Lastschrift (Stripe)</Text>
                            </View>
                        </View>
                    </Section>

                    {/* ── §2 Lizenzgewährung ── */}
                    <Section title="§ 2  Lizenzgewährung">
                        <Text style={s.para}>
                            Der Anbieter räumt dem Kunden für die Dauer des Vertrages ein einfaches,
                            nicht übertragbares und nicht unterlizenzierbares Recht ein, die Software
                            CompLens im Rahmen des gebuchten Leistungsumfangs zu nutzen. Das Nutzungsrecht
                            beschränkt sich auf den internen Geschäftsbetrieb des Kunden.
                        </Text>
                        <Item text="Die Nutzung ist auf die im Vertrag vereinbarte Anzahl an Nutzerplätzen beschränkt." />
                        <Item text="Eine Weitergabe von Zugangsdaten an Dritte außerhalb der Organisation ist untersagt." />
                        <Item text="Reverse Engineering, Dekompilierung oder Modifikation der Software ist untersagt (§ 69e UrhG bleibt unberührt)." />
                        <Item text="Der Kunde ist berechtigt, in CompLens erzeugte Berichte und Exporte (PDF, PPT) uneingeschränkt intern und behördlich zu verwenden." />
                    </Section>

                    {/* ── §3 Leistungen des Anbieters ── */}
                    <Section title="§ 3  Leistungen des Anbieters">
                        <Item text="Bereitstellung der Software CompLens über das Internet (HTTPS) mit einer Verfügbarkeit von ≥ 99 % pro Kalendermonat (gemessen ohne angekündigte Wartungsfenster)." />
                        <Item text="Hosting auf EU-Servern; Datenspeicherung ausschließlich in der Europäischen Union (AWS eu-central-1, Frankfurt am Main)." />
                        <Item text="TLS 1.3-Verschlüsselung (in transit) und AES-256-Verschlüsselung (at rest)." />
                        <Item text="Laufende Wartung, Sicherheitsupdates und Weiterentwicklung der Software." />
                        <Item text="Support per E-Mail (hallo@complens.de) innerhalb von 2 Werktagen (Montag–Freitag)." />
                        <Item text="Bereitstellung eines Auftragsverarbeitungsvertrages (AVV) gemäß Art. 28 DSGVO auf Anfrage." />
                    </Section>

                    {/* ── §4 Pflichten des Kunden ── */}
                    <Section title="§ 4  Pflichten des Kunden">
                        <Item text="Der Kunde stellt sicher, dass nur berechtigte Personen Zugang zur Software erhalten." />
                        <Item text="Der Kunde ist verantwortlich für die Vollständigkeit und Richtigkeit der hochgeladenen Entgeltdaten." />
                        <Item text="Beim Hochladen personenbezogener Daten (Namen, Gehälter) ist der Kunde Verantwortlicher i. S. d. Art. 4 Nr. 7 DSGVO; der Anbieter handelt als Auftragsverarbeiter." />
                        <Item text="Der Kunde verpflichtet sich zur fristgerechten Zahlung der vereinbarten Vergütung." />
                        <Item text="Der Kunde informiert den Anbieter unverzüglich über Sicherheitsvorfälle oder Missbrauch (hallo@complens.de)." />
                    </Section>
                    {/* ── §5 Vergütung & Zahlung ── */}
                    <Section title="§ 5  Vergütung und Zahlung">
                        <Text style={s.para}>
                            Die Vergütung beträgt {planPrice(plan)}, fällig jährlich im Voraus.
                            Die Abrechnung erfolgt automatisiert über den Zahlungsdienstleister Stripe.
                            Der Kunde erhält eine umsatzsteuerrechtskonforme Rechnung gem. § 14 UStG
                            per E-Mail. Alle Preise verstehen sich zuzüglich der gesetzlich gültigen
                            Umsatzsteuer.
                        </Text>
                        <Text style={s.para}>
                            Bei Zahlungsverzug von mehr als 14 Tagen ist der Anbieter berechtigt,
                            den Zugang zur Software zu sperren, bis der ausstehende Betrag beglichen ist.
                            Gesetzliche Verzugszinsen gem. § 288 Abs. 2 BGB (9 Prozentpunkte über Basiszinssatz)
                            werden geltend gemacht.
                        </Text>
                        <Text style={s.para}>
                            Preisanpassungen werden dem Kunden mindestens 6 Wochen vor Inkrafttreten
                            per E-Mail mitgeteilt. Der Kunde hat in diesem Fall ein Sonderkündigungsrecht
                            innerhalb von 4 Wochen nach Bekanntgabe.
                        </Text>
                    </Section>

                    {/* ── §6 Laufzeit und Kündigung ── */}
                    <Section title="§ 6  Vertragslaufzeit und Kündigung">
                        <Text style={s.para}>
                            Der Vertrag läuft für 12 Monate ab dem Aktivierungsdatum und verlängert sich
                            automatisch um jeweils weitere 12 Monate, sofern er nicht mit einer Frist von
                            drei (3) Monaten zum Ende der jeweiligen Vertragslaufzeit schriftlich oder
                            per E-Mail an hallo@complens.de gekündigt wird. Dies entspricht § 7 der AGB.
                        </Text>
                        <Item text="Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt (§ 314 BGB)." />
                        <Item text="Als wichtiger Grund gilt insbesondere eine schuldhafte schwerwiegende Vertragsverletzung oder dauerhafter Zahlungsverzug (> 30 Tage)." />
                        <Item text="Nach Vertragsende werden alle Daten des Kunden innerhalb von 30 Tagen unwiderruflich gelöscht, sofern keine gesetzliche Aufbewahrungspflicht entgegensteht." />
                        <Item text="Der Kunde kann vor Vertragsende einen vollständigen Datenexport aller Analysen anfordern (hallo@complens.de)." />
                    </Section>

                    {/* ── §7 Datenschutz ── */}
                    <Section title="§ 7  Datenschutz und Auftragsverarbeitung (DSGVO)">
                        <Text style={s.para}>
                            Soweit der Kunde personenbezogene Daten (Entgeltdaten, Beschäftigtendaten) in
                            CompLens verarbeitet, ist der Anbieter Auftragsverarbeiter gem. Art. 28 DSGVO.
                            Ein Auftragsverarbeitungsvertrag (AVV) steht auf Anfrage (hallo@complens.de)
                            zur Verfügung und wird Bestandteil dieses Vertrages.
                        </Text>
                        <View style={s.infoBox}>
                            <Text style={s.infoText}>
                                Serverstandort: Deutschland / EU (Frankfurt am Main, AWS eu-central-1).{'\n'}
                                KI-Funktionen (Google Gemini) werden ausschließlich über EU-API-Endpunkte
                                bereitgestellt. Kundendaten werden nicht für das Training von KI-Modellen
                                verwendet.{'\n'}
                                Datenschutz-Kontakt: datenschutz@complens.de
                            </Text>
                        </View>
                    </Section>

                    {/* ── §8 Gewährleistung ── */}
                    <Section title="§ 8  Gewährleistung und Verfügbarkeit">
                        <Text style={s.para}>
                            Der Anbieter gewährleistet eine Systemverfügbarkeit von ≥ 99 % pro Kalendermonat
                            (Jahresdurchschnitt), gemessen exklusive geplanter Wartungsfenster. Wartungsfenster
                            werden mindestens 48 Stunden im Voraus angekündigt.
                        </Text>
                        <Text style={s.para}>
                            Bei erheblicher Unterschreitung (Verfügbarkeit {'<'} 95 % in einem Kalendermonat)
                            hat der Kunde Anspruch auf Gutschrift von bis zu 10 % der monatlich anteiligen
                            Vergütung für den betroffenen Monat. Weitergehende Ansprüche sind ausgeschlossen,
                            soweit gesetzlich zulässig.
                        </Text>
                    </Section>

                    {/* ── §9 Haftungsbeschränkung ── */}
                    <Section title="§ 9  Haftungsbeschränkung">
                        <Text style={s.para}>
                            Die Berichte und Analysen von CompLens dienen als Entscheidungsunterstützung
                            und ersetzen keine Rechtsberatung. Der Anbieter haftet nicht für die rechtliche
                            Korrektheit der generierten Berichte im konkreten Einzelfall; der Kunde trägt
                            die Verantwortung für die Einhaltung der gesetzlichen Meldepflichten.
                        </Text>
                        <Text style={s.para}>
                            Die Haftung des Anbieters für einfache Fahrlässigkeit ist — soweit gesetzlich
                            zulässig — der Höhe nach begrenzt auf den im betreffenden Vertragsjahr vom Kunden
                            bezahlten Nettobetrag. Diese Begrenzung gilt nicht bei Verletzung von Leben,
                            Körper oder Gesundheit sowie bei Vorsatz oder grober Fahrlässigkeit
                            (§ 6 AGB bleibt unberührt).
                        </Text>
                        <Item text="Der Anbieter haftet nicht für Schäden, die auf fehlerhaften oder unvollständigen Eingabedaten des Kunden beruhen." />
                        <Item text="Der Anbieter übernimmt keine Haftung für die rechtliche Verwendung der generierten Berichte durch den Kunden." />
                        <Item text="Der Anbieter empfiehlt, alle Berichte vor gesetzlicher Einreichung von einem Fachanwalt für Arbeitsrecht prüfen zu lassen." />
                    </Section>

                    {/* ── §10 Geistiges Eigentum ── */}
                    <Section title="§ 10  Geistiges Eigentum und Urheberrecht">
                        <Text style={s.para}>
                            Alle Rechte an der Software CompLens, einschließlich Quellcode, Design,
                            Datenmodelle und Dokumentation, verbleiben ausschließlich beim Anbieter
                            (§§ 69a ff. UrhG). Der Kunde erwirbt kein Eigentum an der Software,
                            sondern lediglich das in § 2 beschriebene Nutzungsrecht.
                        </Text>
                        <Text style={s.para}>
                            Die vom Kunden in CompLens eingebrachten Daten (Entgeltdaten, Analysen,
                            Berichte) verbleiben im Eigentum des Kunden. Der Anbieter erhält hieran
                            kein Nutzungsrecht über die vertragsgemäße Leistungserbringung hinaus.
                        </Text>
                    </Section>

                    {/* ── §11 Vertraulichkeit ── */}
                    <Section title="§ 11  Vertraulichkeit">
                        <Text style={s.para}>
                            Beide Parteien verpflichten sich, alle im Rahmen dieses Vertrages erlangten
                            vertraulichen Informationen der jeweils anderen Partei geheim zu halten und
                            ausschließlich zur Erfüllung dieses Vertrages zu verwenden. Diese Verpflichtung
                            besteht auch nach Vertragsende fort und gilt für einen Zeitraum von fünf (5) Jahren.
                        </Text>
                        <Item text="Als vertraulich gelten insbesondere Geschäftsgeheimnisse, Preislisten, Kundendaten, Algorithmen und technische Dokumentation." />
                        <Item text="Ausgenommen sind Informationen, die dem Empfänger bereits vor Vertragsschluss bekannt waren oder die öffentlich zugänglich sind." />
                    </Section>

                    {/* ── §12 Vertragsänderungen ── */}
                    <Section title="§ 12  Vertragsänderungen">
                        <Text style={s.para}>
                            Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform oder
                            der nachweisbaren E-Mail-Form. Der Anbieter ist berechtigt, die
                            Vertragsbedingungen mit einer Ankündigungsfrist von mindestens 6 Wochen
                            anzupassen. Der Kunde kann in diesem Fall dem widersprechen und den Vertrag
                            außerordentlich zum Änderungszeitpunkt kündigen.
                        </Text>
                    </Section>

                    {/* ── §13 Schlussbestimmungen ── */}
                    <Section title="§ 13  Schlussbestimmungen">
                        <Item text="Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG)." />
                        <Item text={`Ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist ${DEXTERBEE.city} (${DEXTERBEE.court}), sofern der Kunde Kaufmann i. S. d. HGB ist.`} />
                        <Item text="Sollten einzelne Bestimmungen dieses Vertrages unwirksam sein, bleibt die Wirksamkeit des Vertrages im Übrigen unberührt (salvatorische Klausel, § 139 BGB analog)." />
                        <Item text="Dieser Vertrag tritt mit Aktivierung der Lizenz durch den Anbieter in Kraft." />
                        <Item text="Dieser Vertrag wird in elektronischer Form geschlossen und ist gemäß eIDAS-Verordnung und §§ 126a, 127 BGB formwirksam." />
                        <Item text="Die Allgemeinen Geschäftsbedingungen der DexterBee GmbH (complens.de/agb) gelten ergänzend." />
                    </Section>

                    {/* ── Unterschriften ── */}
                    <View style={s.sigSection}>
                        {/* Anbieter — vorunterschrieben */}
                        <View style={s.sigBox}>
                            <Text style={s.sigLabel}>Für den Anbieter — {DEXTERBEE.name}</Text>
                            <Text style={s.sigName}>{DEXTERBEE.gf}</Text>
                            <Text style={s.sigDetail}>{DEXTERBEE.gftitle}</Text>
                            <Text style={s.sigDetail}>{DEXTERBEE.name}</Text>
                            <Text style={s.sigDetail}>{DEXTERBEE.email}</Text>
                            <Text style={s.sigDateLine}>✓ Digital unterzeichnet am {issuedDate}</Text>
                            <Text style={{ fontSize: 7, color: MUTED, marginTop: 4 }}>
                                Einfache elektronische Signatur gem. Art. 3 Nr. 10 eIDAS-VO
                            </Text>
                        </View>

                        {/* Auftraggeber — zu unterschreiben */}
                        <View style={s.sigBox}>
                            <Text style={s.sigLabel}>Für den Auftraggeber — {orgName}</Text>
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
                                Durch Aktivierung der Lizenz und Bestätigung per E-Mail stimmt der
                                Auftraggeber diesem Vertrag zu (konkludenter Vertragsschluss gem. § 151 BGB).
                            </Text>
                        </View>
                    </View>

                    {/* ── Rechtlicher Hinweis ── */}
                    <View style={{ marginTop: 20, padding: 10, backgroundColor: LIGHT, borderRadius: 4, borderWidth: 1, borderColor: BORDER }}>
                        <Text style={{ fontSize: 7.5, color: MUTED, lineHeight: 1.5 }}>
                            Rechtlicher Hinweis: Dieser Vertrag wurde nach bestem Wissen auf Basis deutschen
                            Rechts erstellt, ersetzt jedoch keine individuelle Rechtsberatung.
                            {DEXTERBEE.name} empfiehlt, den Vertrag bei Bedarf von einem Fachanwalt für
                            IT-Recht prüfen zu lassen.{'\n'}
                            Für Rückfragen: {DEXTERBEE.email} · {DEXTERBEE.name} · {DEXTERBEE.street},
                            {' '}{DEXTERBEE.zip} {DEXTERBEE.city} · {DEXTERBEE.hrb}, {DEXTERBEE.court}
                        </Text>
                    </View>
                </View>

                <Footer contractId={contractId} />
            </Page>
        </Document>
    )
}
