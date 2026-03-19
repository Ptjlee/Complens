/**
 * CompLens In-App Knowledge Base
 *
 * This file is the authoritative source of product knowledge for the AI chatbot.
 * It mirrors the help guide shown to users in /dashboard/help.
 *
 * Both chat endpoints inject this knowledge into the system prompt so the assistant
 * can answer "how do I…" questions about CompLens — not just compliance law.
 */

export const COMPLENS_KB = `
═══ COMPLENS PRODUKTWISSEN — BEDIENUNGSANLEITUNG ═══

Du kennst CompLens vollständig und kannst Nutzern bei Bedienungsfragen helfen.
Wenn ein Nutzer fragt "wie mache ich X in CompLens?" oder "wo finde ich Y?", antworte
mit konkreten Schritt-für-Schritt-Anweisungen aus diesem Wissensbereich.

── MODUL 1: ERSTE SCHRITTE ──

Schritt 1 – Registrierung & Organisation:
Nach der Registrierung wird die Organisation automatisch angelegt. Unter Einstellungen → Organisation
kann der Name, das Land und weitere Metadaten angepasst werden. Diese Daten erscheinen auf
allen generierten Berichten und PDF-Exporten.
Tipp: Organisationsname vollständig ausfüllen – er wird automatisch auf PDF-Berichten und dem Lizenzvertrag verwendet.

Schritt 2 – Teammitglieder einladen:
Unter Einstellungen → Team können Admins weitere Personen per E-Mail einladen.
Rollen: Admin (voller Zugriff) oder Viewer (Lesezugriff). Einladung ist 7 Tage gültig.
Platzanzahl ist lizenzgebunden; Add-on Plätze unter Einstellungen → Abonnement buchbar.

Schritt 3 – Profil vervollständigen:
Unter Einstellungen → Profil: Name, Berufsbezeichnung und bevorzugte Sprache (Deutsch/Englisch) festlegen.

Schritt 4 – CSV-Vorlage herunterladen:
Unter Import → Vorlage herunterladen. Vorlage enthält alle Pflichtfelder gem. EU-RL 2023/970.
Immer die aktuellste Vorlage verwenden.

FAQ:
- Testphase = 14 Tage, danach Sperre bis zur Lizenzaktivierung. Berichte mit MUSTER-Wasserzeichen.
- Organisationsname nachträglich änderbar unter Einstellungen → Organisation (nur Admins).
- Nach Testzeitraum: Overlay blockiert Zugriff, Daten bleiben erhalten, Upgrade per Stripe.

── MODUL 2: DATENSÄTZE IMPORTIEREN ──

Schritt 1 – CSV vorbereiten:
Pflichtfelder: employee_id (eindeutig), gender (m/f/d), job_grade (Entgeltgruppe),
hourly_rate ODER annual_salary, department, employment_type (full_time/part_time/minijob), weekly_hours.
Trennzeichen: Semikolon (;). Dezimalzahlen mit Komma (25,50) oder Punkt (25.50) beide akzeptiert.
Encoding: UTF-8.

Schritt 2 – Optionale Felder:
first_name, last_name (für Auskunftsrecht Art. 7), variable_pay (Boni/Prämien),
overtime_hours, benefits_value (Sachleistungen in €/Jahr).

Schritt 3 – Datei hochladen:
Import → Neuer Datensatz → Name + Berichtsjahr eingeben → CSV hochladen.
CompLens validiert automatisch und zeigt Fehler mit Zeilenverweisen an.
Datensatzname erscheint auf dem PDF-Deckblatt.

Schritt 4 – Fehler beheben:
Häufige Fehler: fehlende gender-Werte, ungültige employment_type-Codes, negative Stundenlöhne.
CSV korrigieren und erneut hochladen.

Schritt 5 – Archivieren/Löschen:
Archivieren = ausblenden (Daten erhalten, für Trends nutzbar).
Hard Delete = alle verknüpften Analysen und Begründungen werden DSGVO-konform gelöscht.

FAQ:
- Teilzeitbeschäftigte: employment_type="part_time", weekly_hours=vertragliche Stunden.
  CompLens normiert auf Bruttostundenverdienst gem. Art. 3 EU-RL 2023/970.
- Minijobs: typ "minijob", werden separat ausgewiesen, nicht im Gesamt-Gap.
- Externe/Selbstständige: NICHT einbeziehen. Nur Arbeitnehmer im arbeitsrechtlichen Sinne.
- job_grade = interne Entgeltgruppe (z.B. "L1", "Senior", "Tarifgruppe 5").

── MODUL 3: ANALYSE & ERGEBNISSE ──

Schritt 1 – Neue Analyse starten:
Analyse → Neue Analyse → Datensatz wählen → Analysenamen eingeben → "Analyse starten".
Mehrere Analysen aus demselben Datensatz möglich (z.B. verschiedene WIF-Gewichtungen).

Schritt 2 – Unbereinigt vs. bereinigt:
Unbereinigt = Direktvergleich aller Frauen und Männer ohne Berücksichtigung von Berufsgruppen.
Bereinigt = Vergleich innerhalb derselben Kohorte (job_grade) + WIF-Faktoren.
Beide Werte sind gesetzlich meldepflichtig gem. Art. 9 EU-RL 2023/970.

Schritt 3 – 5%-Schwelle:
Über 5% unbereinigter Median-Gap → roter Status-Badge → Handlungsbedarf (Art. 9 Abs. 1c).
CompLens generiert automatisch einen Maßnahmenplan-Vorschlag.

Schritt 4 – Ergebnisse nach Abteilung & Entgeltgruppe:
Im Analyse-Detailbereich aufgeschlüsselt nach department und job_grade.
Kohorten < 5 Personen werden anonymisiert als "< 5 MA" angezeigt.

Schritt 5 – Quartilsverteilung:
Zeigt Frauen-/Männeranteil in jedem Entgeltquartil. Pflichtangabe gem. Art. 9 Abs. 1b EU-RL.

FAQ:
- WIF-Faktoren = Wertigkeit, Inhalt, Funktion. Objektive Faktoren für Gleichwertigkeit der Arbeit.
  CompLens berücksichtigt: Qualifikationsanforderungen, Verantwortung, Belastung, Arbeitsbedingungen.
- Median robuster als Mittelwert (weniger anfällig für Ausreißer). EU-RL schreibt primär Median vor.
- Kohorten < 5 ausgeblendet aus DSGVO-Gründen (Datenminimierung Art. 5 Abs. 1c).
- Aufbewahrungspflicht: 4 Jahre gemäß EU-RL. CompLens speichert bis zu explizitem Löschen.

── MODUL 4: BEGRÜNDUNGEN ERFASSEN ──

Was sind Begründungen? Erklärungen für statistisch auffällige Entgeltlücken mit objektiven Faktoren.
Beispiele: Leistungsbeurteilungen, Betriebszugehörigkeit, Marktvergütung für Spezialisten.
Begründungen reduzieren den BEREINIGTEN Gap, nie den unbereinigten (beide meldepflichtig).

Begründung hinzufügen:
Analyse-Detailansicht → Kohorte → "Begründung hinzufügen" → Kategorie wählen →
Erklärungsanteil in % oder €/Stunde → Beschreibung formulieren.
Begründungen erscheinen automatisch im PDF-Bericht (Seite 3) und PPT-Präsentation.

Begründungen bearbeiten/löschen:
Bearbeitungssymbol (✎) → sofortige Auswirkung auf bereinigten Gap.

FAQ:
- Keine Begrenzung der Begründungsanzahl pro Kohorte. Mehrere Faktoren kombinierbar.
- Begründungen sind interne Dokumentation, keine Rechtsberatung. Bei Behördenanfragen vorlegbar.
- "Erklärt" = durch dokumentierten Faktor belegter Gap-Anteil.
  "Unerläutert" = verbleibender Gap ohne Begründung = potenziell rechtlich relevant.

── MODUL 5: MASSNAHMENPLÄNE ──

Maßnahmenplan erstellen:
Maßnahmen → Neuer Plan → betroffene Analyse + Titel + Zieldatum wählen.
Plan enthält mehrere Schritte (Steps), die Kohorten/Abteilungen zugewiesen werden.

Schritte definieren:
Jeder Schritt: Bezeichnung, Beschreibung, Zuordnung, verantwortliche Person, Zieldatum.
Status: "offen" / "in Bearbeitung" / "abgeschlossen".
Tipp: Messbare Ziele pro Schritt (z.B. "Lohnerhöhung 3% für Frauen in L3 bis 31.12.2025").

Fortschritt verfolgen:
Maßnahmen-Dashboard zeigt alle aktiven Pläne mit Fortschrittsbalken, offene/überfällige Schritte.

FAQ:
- Export: Maßnahmenplan wird in PDF-Bericht integriert (ab Seite 4).
- Maßnahmenpläne beeinflussen KEINE Berechnungsergebnisse (nur dokumentarisch).

── MODUL 6: BERICHTE & EXPORTE ──

PDF-Bericht generieren:
Analysedetailseite → "PDF exportieren". Enthält: Deckblatt, Executive Summary,
Gap-Übersicht, Kohortendetails, Quartilsverteilung, Begründungsübersicht, Maßnahmenplan.
Berichte im Testzeitraum/abgelaufener Lizenz: MUSTER-Wasserzeichen, max. 4 Seiten.

PPT-Präsentation generieren:
"PPT exportieren" → 7 Folien: Deckblatt, Executive Summary, Gap-Übersicht, Bereiche,
Quartile, Gehaltsvergleich, Methodik. Ideal für Geschäftsführung oder Betriebsrat.

Branding:
Alle Exporte zeigen prominent den Organisationsnamen.
"Erstellt mit CompLens" erscheint nur als kleiner Hinweis.

Lizenzvertrag herunterladen:
Einstellungen → Abonnement → "Vertrag herunterladen". Bereits von DexterBee GmbH vorausgefüllt und digital unterzeichnet.

── MODUL 7: AUSKUNFTSRECHT (Art. 7 EU-RL 2023/970) ──

Was ist das Auskunftsrecht?
Art. 7 EU-RL verpflichtet Arbeitgeber, Mitarbeitenden Auskunft über eigenes Gehalt
vs. Durchschnittsvergütung der Vergleichsgruppe zu geben. Frist: 2 Monate.

Mitarbeiter suchen:
Auskunftsrecht → Mitarbeiter suchen → Name oder Personal-ID eingeben (mindestens 3 Zeichen).
Benötigt: first_name/last_name im importierten Datensatz.

PDF-Brief generieren:
"PDF generieren / Drucken" → Auskunftsschreiben mit Organisationsname,
gesetzlich vorgeschriebenen Vergleichsdaten, Rechtsgrundverweis (Art. 7 EU-RL 2023/970).

FAQ:
- Jeder Beschäftigte darf 1× jährlich anfragen. Antwort: Median der Kohorte (nicht Einzelgehälter).
- Kohorte < 5 Personen: Keine Auskunft möglich; alternative Vergleichsgruppen definieren.
- Anonymität: Nur Mediane/Mittelwerte angezeigt, keine Einzelgehälter Dritter.

── MODUL 8: TRENDANALYSE ──

Wann verfügbar: Automatisch aktiv ab 2 abgeschlossenen Analysen mit verschiedenen Berichtsjahren.
Zeigt: Liniendiagramme, Delta-Karten (vs. Vorjahr), Heatmaps für Bereiche + Entgeltgruppen.

Delta-Karten: Grün = Gap gesunken (Verbesserung), Rot = Gap gestiegen (Verschlechterung).

Bereichs-Heatmap (Tab "Bereiche"):
Farbkodiert: Dunkelrot (>10%), Orange (5–10%), Gelb (2–5%), Grün (<2%).
Ideal für Fortschrittsberichte.

FAQ:
- Keine Trendansicht? → Mindestens 2 Analysen verschiedener Jahre erforderlich.
- Trends aktuell nur interaktiv (nicht im PDF-Export, für zukünftige Version geplant).

── MODUL 9: DSGVO & COMPLIANCE ──

AVV (Auftragsverarbeitungsvertrag):
Pflicht gem. Art. 28 DSGVO wenn personenbezogene Daten verarbeitet werden.
Anfordern über Compliance-Seite → Knopf "AV-Vertrag anfordern" → E-Mail an hallo@complens.de.
AVV kostenlos, Zusendung innerhalb 2 Werktagen.

Datenschutzarchitektur:
- Serverstandort: Deutschland/EU (Frankfurt am Main)
- Übertragung: TLS 1.3-verschlüsselt
- Speicherung: AES-256 at rest
- KI-Modelle über EU-Endpunkte; Daten NICHT für KI-Training verwendet

Löschkonzept:
Datensätze/Analysen/Account jederzeit löschbar. Hard Delete = unwiderruflich.
Auf Anfrage: vollständiger Datenexport vor Löschung.

FAQ:
- Verantwortlicher = Kundenunternehmen (Art. 4 Nr. 7 DSGVO).
  Auftragsverarbeiter = DexterBee GmbH (Art. 4 Nr. 8 DSGVO). Geregelt im AVV.
- Datennutzung: Ausschließlich zur CompLens-Dienstleistung. Keine Weitergabe.
  Rechtsgrundlage: Art. 6 Abs. 1b DSGVO (Vertragserfüllung).

── MODUL 10: EINSTELLUNGEN & TEAM ──

Profil bearbeiten:
Einstellungen → Profil → Name, Berufsbezeichnung, bevorzugte Sprache (Deutsch/Englisch).
Nutzerspezifische Einstellungen (gelten nicht für andere Teammitglieder).

Sprache wechseln:
CompLens unterstützt Deutsch und Englisch. Einstellungen → Profil → Sprache wählen.
Sofortige Umschaltung der gesamten Oberfläche. Berichte weiterhin auf Deutsch (gesetzl. Pflicht).

Abonnement:
Einstellungen → Abonnement: aktueller Plan, Ablaufdatum, Nutzerplätze.
Lizenzierte Nutzer: Softwarenutzungsvertrag (PDF) vorausgefüllt + vorausgefertigt herunterladbar.
Upgrade + Add-ons: direkte Stripe-Checkout-Links.

Rollen:
- Admin: Vollzugriff (Import, Analyse, Einstellungen, Team)
- Viewer: Lesezugriff (Analysen, Berichte, Portal) — keine Import- oder Einstellungsrechte

Passwort-Reset:
Login-Seite → "Passwort vergessen" → Reset-Link per E-Mail (60 Minuten gültig).

Kündigung:
Per E-Mail (hallo@complens.de) oder schriftlich, 3 Monate Frist zum Jahresende.
Nach Vertragsende: 30 Tage Datenexport möglich, dann vollständige Löschung.

══ NAVIGATIONSÜBERSICHT ══
- Dashboard: Übersicht der letzten Analysen und Schnellzugriff
- Import: CSV-Datensätze hochladen und verwalten
- Analyse: Entgeltlücken berechnen und detailliert ansehen
- Begründungen (via Analyse): Entgeltunterschiede dokumentieren
- Maßnahmen: Entgeltlücken mit strukturierten Plänen schließen
- Trendanalyse: Jahresüberschreitende Entwicklung der Lücken
- Berichte: PDF/PPT-Exporte generieren
- Auskunftsrecht: Mitarbeiterauskunft Art. 7 EU-RL 2023/970
- DSGVO & Compliance: Datenschutz und Rechtsnachweise
- Einstellungen: Profil, Team, Organisation, Abonnement
- Hilfe: Diese Bedienungsanleitung
`

export default COMPLENS_KB
