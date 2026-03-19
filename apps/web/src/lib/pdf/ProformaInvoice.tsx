import React from 'react'
import {
    Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer'

// ─── Types ──────────────────────────────────────────────────────────────────

export type ProformaLine = {
    description: string   // e.g. "CompLens Lizenz – Jahresabonnement 2026/2027"
    quantity:    number
    unitPrice:   number   // net, in EUR
}

export type ProformaInvoiceProps = {
    invoiceRef:  string   // e.g. "PF-2026-A3B2C1"
    issuedDate:  string   // e.g. "19. März 2026"
    validUntil:  string   // e.g. "2. April 2026" (14 days)

    // Customer
    customerName:    string
    customerAddress: string   // full multi-line address
    customerVatId:   string

    // Line items
    lines: ProformaLine[]

    // Payment method context
    paymentMethod: 'card' | 'sepa' | 'vorkasse'
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const BRAND   = '#4f46e5'
const DARK    = '#0f172a'
const MID     = '#475569'
const LIGHT   = '#94a3b8'
const BORDER  = '#e2e8f0'
const BG_THEAD= '#f8fafc'

// ─── Seller (DexterBee GmbH) ─────────────────────────────────
// TODO: fill in HRB, USt-IdNr, IBAN, BIC, bank name before go-live
const SELLER = {
    name:         'DexterBee GmbH',
    address:      'Industriestr. 13',
    zip_city:     '63755 Alzenau',
    country:      'Deutschland',
    ust_id:       'DE__________',       // ← TODO: USt-IdNr. eintragen
    hrb:          'HRB ______ Aschaffenburg', // ← TODO: HRB eintragen
    bank_name:    '________________',   // ← TODO: Bank eintragen
    iban:         'DE__ ____ ____ ____ ____ __', // ← TODO: IBAN eintragen
    bic:          '___________',        // ← TODO: BIC eintragen
    email:        'hallo@complens.de',
    web:          'complens.de',
    tax_note:     'Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge) gilt nicht; Leistungsort: Deutschland.',
}


const VAT_RATE = 0.19  // 19 % Umsatzsteuer

const s = StyleSheet.create({
    page: {
        fontFamily:   'Helvetica',
        fontSize:      9,
        color:         DARK,
        paddingTop:    36,
        paddingBottom: 56,
        paddingLeft:   48,
        paddingRight:  48,
    },

    // Header brand bar
    headerBar: {
        flexDirection:  'row',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:    24,
        paddingBottom:   16,
        borderBottom:    `1pt solid ${BORDER}`,
    },
    brandBox: {
        flexDirection: 'row',
        alignItems:    'center',
        gap:            4,
    },
    brandComp: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: BRAND },
    brandLens: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: DARK },
    brandSub:  { fontSize: 7,  color: LIGHT, marginTop: 2, letterSpacing: 1 },

    sellerRight: { fontSize: 7.5, color: MID, textAlign: 'right', lineHeight: 1.55 },

    // Document title
    titleRow: {
        flexDirection:  'row',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:    20,
    },
    docTitle:    { fontSize: 18, fontFamily: 'Helvetica-Bold', color: DARK },
    docSubtitle: { fontSize: 8,  color: LIGHT, marginTop: 3 },
    refBox: {
        alignItems:      'flex-end',
    },
    refLabel: { fontSize: 7, color: LIGHT, marginBottom: 2 },
    refValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK },

    // Address blocks
    addressRow: {
        flexDirection:  'row',
        gap:             32,
        marginBottom:    24,
    },
    addressBlock: { flex: 1 },
    addressLabel: { fontSize: 7, color: LIGHT, marginBottom: 4, letterSpacing: 0.5 },
    addressLine:  { fontSize: 8.5, color: DARK, lineHeight: 1.55 },

    // Table
    table:       { marginBottom: 20 },
    thead:       {
        flexDirection:   'row',
        backgroundColor: BG_THEAD,
        borderTop:       `1pt solid ${BORDER}`,
        borderBottom:    `1pt solid ${BORDER}`,
        paddingVertical: 5,
        paddingHorizontal: 8,
    },
    trow: {
        flexDirection:   'row',
        borderBottom:    `0.5pt solid ${BORDER}`,
        paddingVertical: 7,
        paddingHorizontal: 8,
    },
    th:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: MID, textTransform: 'uppercase' },
    td:  { fontSize: 8.5, color: DARK, lineHeight: 1.45 },

    colDesc: { flex: 4 },
    colQty:  { flex: 1, textAlign: 'right' },
    colUnit: { flex: 1.5, textAlign: 'right' },
    colNet:  { flex: 1.5, textAlign: 'right' },

    // Totals
    totals: {
        alignSelf:    'flex-end',
        width:         220,
        marginBottom:  24,
    },
    totalRow: {
        flexDirection:   'row',
        justifyContent:  'space-between',
        paddingVertical: 3,
    },
    totalLabel:    { fontSize: 8.5, color: MID },
    totalValue:    { fontSize: 8.5, color: DARK, textAlign: 'right' },
    totalRowGross: {
        flexDirection:   'row',
        justifyContent:  'space-between',
        paddingVertical: 5,
        borderTop:       `1.5pt solid ${DARK}`,
        marginTop:        3,
    },
    totalLabelGross: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK },
    totalValueGross: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BRAND, textAlign: 'right' },

    // Payment info box
    payBox: {
        backgroundColor: '#f0f4ff',
        borderLeft:      `3pt solid ${BRAND}`,
        padding:          10,
        marginBottom:     20,
        borderRadius:     2,
    },
    payTitle:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: BRAND, marginBottom: 5 },
    payLine:   { fontSize: 8, color: DARK, lineHeight: 1.65 },
    payLabel:  { fontFamily: 'Helvetica-Bold' },

    // Legal notes
    notesBox: {
        borderTop:  `1pt solid ${BORDER}`,
        paddingTop:  12,
        marginTop:   8,
    },
    noteTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: MID, marginBottom: 4 },
    noteText:  { fontSize: 7.5, color: LIGHT, lineHeight: 1.6 },

    // Footer
    footer: {
        position:   'absolute',
        bottom:      24,
        left:        48,
        right:       48,
        borderTop:   `0.5pt solid ${BORDER}`,
        paddingTop:  8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    footerText: { fontSize: 6.5, color: LIGHT },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function eur(amount: number): string {
    return amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProformaInvoice({
    invoiceRef,
    issuedDate,
    validUntil,
    customerName,
    customerAddress,
    customerVatId,
    lines,
    paymentMethod,
}: ProformaInvoiceProps) {
    const totalNet = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0)
    const vatAmt   = totalNet * VAT_RATE
    const totalGross = totalNet + vatAmt

    const paymentLabel: Record<ProformaInvoiceProps['paymentMethod'], string> = {
        card:     'Kreditkarte (Stripe)',
        sepa:     'SEPA-Lastschrift (Stripe)',
        vorkasse: 'Vorkasse (Überweisung)',
    }

    return (
        <Document
            title={`Proforma-Rechnung ${invoiceRef}`}
            author="CompLens by DexterBee GmbH"
            subject="Proforma-Rechnung für CompLens Lizenz"
            language="de"
        >
            <Page size="A4" style={s.page}>

                {/* ── Header ───────────────────────────────────────── */}
                <View style={s.headerBar}>
                    <View>
                        <View style={s.brandBox}>
                            <Text style={s.brandComp}>Comp</Text>
                            <Text style={s.brandLens}>Lens</Text>
                        </View>
                        <Text style={s.brandSub}>EU PAY TRANSPARENCY PLATFORM</Text>
                    </View>
                    <View style={s.sellerRight}>
                        <Text style={{ fontFamily: 'Helvetica-Bold', color: DARK }}>{SELLER.name}</Text>
                        <Text>{SELLER.address}</Text>
                        <Text>{SELLER.zip_city}</Text>
                        <Text>{SELLER.country}</Text>
                        <Text style={{ marginTop: 4 }}>USt-IdNr.: {SELLER.ust_id}</Text>
                        <Text>{SELLER.hrb}</Text>
                        <Text style={{ marginTop: 4, color: BRAND }}>{SELLER.email}</Text>
                    </View>
                </View>

                {/* ── Document title + ref ──────────────────────────── */}
                <View style={s.titleRow}>
                    <View>
                        <Text style={s.docTitle}>Proforma-Rechnung</Text>
                        <Text style={s.docSubtitle}>
                            Diese Proforma-Rechnung ist kein steuerrechtliches Dokument.{'\n'}
                            Die offizielle Rechnung erhalten Sie nach Zahlungseingang über Stripe.
                        </Text>
                    </View>
                    <View style={s.refBox}>
                        <Text style={s.refLabel}>BELEGNUMMER</Text>
                        <Text style={s.refValue}>{invoiceRef}</Text>
                        <Text style={[s.refLabel, { marginTop: 8 }]}>AUSGESTELLT AM</Text>
                        <Text style={s.refValue}>{issuedDate}</Text>
                        <Text style={[s.refLabel, { marginTop: 8 }]}>GÜLTIG BIS</Text>
                        <Text style={s.refValue}>{validUntil}</Text>
                    </View>
                </View>

                {/* ── Address blocks ───────────────────────────────── */}
                <View style={s.addressRow}>
                    <View style={s.addressBlock}>
                        <Text style={s.addressLabel}>LEISTUNGSERBRINGER</Text>
                        <Text style={[s.addressLine, { fontFamily: 'Helvetica-Bold' }]}>{SELLER.name}</Text>
                        <Text style={s.addressLine}>{SELLER.address}</Text>
                        <Text style={s.addressLine}>{SELLER.zip_city}</Text>
                        <Text style={s.addressLine}>{SELLER.country}</Text>
                    </View>
                    <View style={s.addressBlock}>
                        <Text style={s.addressLabel}>RECHNUNGSEMPFÄNGER</Text>
                        <Text style={[s.addressLine, { fontFamily: 'Helvetica-Bold' }]}>{customerName}</Text>
                        <Text style={s.addressLine}>{customerAddress}</Text>
                        {customerVatId ? (
                            <Text style={[s.addressLine, { marginTop: 4 }]}>USt-IdNr.: {customerVatId}</Text>
                        ) : null}
                    </View>
                </View>

                {/* ── Line items table ─────────────────────────────── */}
                <View style={s.table}>
                    <View style={s.thead}>
                        <Text style={[s.th, s.colDesc]}>Leistungsbeschreibung</Text>
                        <Text style={[s.th, s.colQty]}>Menge</Text>
                        <Text style={[s.th, s.colUnit]}>Einzelpreis (netto)</Text>
                        <Text style={[s.th, s.colNet]}>Betrag (netto)</Text>
                    </View>
                    {lines.map((line, i) => (
                        <View key={i} style={s.trow}>
                            <Text style={[s.td, s.colDesc]}>{line.description}</Text>
                            <Text style={[s.td, s.colQty]}>{line.quantity}</Text>
                            <Text style={[s.td, s.colUnit]}>{eur(line.unitPrice)}</Text>
                            <Text style={[s.td, s.colNet]}>{eur(line.quantity * line.unitPrice)}</Text>
                        </View>
                    ))}
                </View>

                {/* ── Totals ──────────────────────────────────────── */}
                <View style={s.totals}>
                    <View style={s.totalRow}>
                        <Text style={s.totalLabel}>Nettobetrag</Text>
                        <Text style={s.totalValue}>{eur(totalNet)}</Text>
                    </View>
                    <View style={s.totalRow}>
                        <Text style={s.totalLabel}>Umsatzsteuer (19 %)</Text>
                        <Text style={s.totalValue}>{eur(vatAmt)}</Text>
                    </View>
                    <View style={s.totalRowGross}>
                        <Text style={s.totalLabelGross}>Gesamtbetrag (brutto)</Text>
                        <Text style={s.totalValueGross}>{eur(totalGross)}</Text>
                    </View>
                </View>

                {/* ── Payment info ─────────────────────────────────── */}
                <View style={s.payBox}>
                    <Text style={s.payTitle}>
                        ZAHLUNGSWEISE: {paymentLabel[paymentMethod].toUpperCase()}
                    </Text>
                    {paymentMethod === 'vorkasse' ? (
                        <>
                            <Text style={s.payLine}>
                                Bitte überweisen Sie den Gesamtbetrag von{' '}
                                <Text style={s.payLabel}>{eur(totalGross)}</Text>{' '}
                                innerhalb von <Text style={s.payLabel}>14 Tagen</Text> auf folgendes Konto:
                            </Text>
                            <Text style={[s.payLine, { marginTop: 6 }]}>
                                <Text style={s.payLabel}>Empfänger: </Text>{SELLER.name}{'\n'}
                                <Text style={s.payLabel}>IBAN: </Text>{SELLER.iban}{'\n'}
                                <Text style={s.payLabel}>BIC: </Text>{SELLER.bic}{'\n'}
                                <Text style={s.payLabel}>Bank: </Text>{SELLER.bank_name}{'\n'}
                                <Text style={s.payLabel}>Verwendungszweck: </Text>{invoiceRef} – {customerName}
                            </Text>
                            <Text style={[s.payLine, { marginTop: 6, color: MID }]}>
                                Ihre Lizenz wird nach Eingang der Zahlung freigeschaltet. Bei Fragen: {SELLER.email}
                            </Text>
                        </>
                    ) : (
                        <Text style={s.payLine}>
                            Die Zahlung erfolgt sicher über Stripe (
                            {paymentMethod === 'sepa' ? 'SEPA-Lastschrift' : 'Kreditkarte'}).
                            Nach der Zahlung erhalten Sie per E-Mail eine steuerrechtliche Rechnung von Stripe.
                            Ihre Lizenz wird sofort freigeschaltet.
                        </Text>
                    )}
                </View>

                {/* ── Legal notes ──────────────────────────────────── */}
                <View style={s.notesBox}>
                    <Text style={s.noteTitle}>RECHTLICHE HINWEISE</Text>
                    <Text style={s.noteText}>
                        Dies ist eine Proforma-Rechnung und kein steuerrechtliches Dokument im Sinne des § 14 UStG.
                        Sie dient ausschließlich zur Vorauszahlung und Dokumentation.
                        Die offizielle Mehrwertsteuerrechnung erhalten Sie nach Eingang der Zahlung automatisch per E-Mail von Stripe Payments Europe, Ltd.{'\n\n'}
                        {SELLER.tax_note}{'\n\n'}
                        Alle Preise verstehen sich in EUR zzgl. der gesetzlichen Umsatzsteuer (19 %).
                        Jahresabonnement, zahlbar jährlich im Voraus. Kündigung mit einer Frist von 3 Monaten zum Jahresende.
                    </Text>
                </View>

                {/* ── Footer ──────────────────────────────────────── */}
                <View style={s.footer} fixed>
                    <Text style={s.footerText}>{SELLER.name} · {SELLER.hrb} · {SELLER.ust_id}</Text>
                    <Text style={s.footerText}>Proforma-Rechnung {invoiceRef} · Seite 1</Text>
                    <Text style={s.footerText}>{SELLER.web}</Text>
                </View>

            </Page>
        </Document>
    )
}
