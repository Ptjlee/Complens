/**
 * CompLens In-App Knowledge Base
 *
 * This file is the authoritative source of product knowledge for the AI chatbot.
 * It mirrors the help guide shown to users in /dashboard/help.
 *
 * Both chat endpoints inject this knowledge into the system prompt so the assistant
 * can answer "how do I…" questions about CompLens — not just compliance law.
 */

const COMPLENS_KB_DE = `
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
- Testphase = 7 Tage, danach Sperre bis zur Lizenzaktivierung. Berichte mit MUSTER-Wasserzeichen.
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

Datensätze auswählen (WICHTIG — neue UI):
Trendanalyse öffnen → Bereich "Datensatz-Auswahl" → per Checkbox mindestens 2 Datensätze auswählen.
Ohne Auswahl erscheint der Hinweis "Wählen Sie mindestens einen Datensatz aus".
CompLens wählt automatisch eine sinnvolle Vorauswahl basierend auf Berichtsjahr vor.

Jahresvergleich vs. Vergleichsmodus:
Standard-Modus: Pro Berichtsjahr eine Linie (ein repräsentativer Datensatz pro Jahr).
Vergleichsmodus (Umschalter oben rechts): Jeder ausgewählte Datensatz = eigene Linie,
auch wenn mehrere Datensätze dasselbe Jahr abdecken. Ideal für A/B-Szenarien.

Delta-Karten: Grün = Gap gesunken (Verbesserung), Rot = Gap gestiegen (Verschlechterung).
Vergleich bezieht sich auf das unmittelbar vorherige Jahr in der Auswahl.

Bereichs-Heatmap (Tab "Bereiche") & Gruppen-Heatmap (Tab "Gruppen"):
Farbkodiert: Dunkelrot (>10%), Orange (5–10%), Gelb (2–5%), Grün (<2%).

FAQ:
- Keine Trendansicht? → Mindestens 2 Datensätze in der Datensatz-Auswahl anklicken.
- Derselbe Datensatz kann nicht zweimal ausgewählt werden.
- Trends aktuell nur interaktiv (nicht im PDF-Export, für zukünftige Version geplant).

── MODUL 9: DSGVO & COMPLIANCE ──

AVV (Auftragsverarbeitungsvertrag):
Pflicht gem. Art. 28 DSGVO wenn personenbezogene Daten verarbeitet werden.
Anfordern über Compliance-Seite → Bereich "AV-Vertrag anfordern" → Support-Ticket in CompLens eröffnen.
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
Per Support-Ticket in CompLens oder schriftlich, 3 Monate Frist zum Jahresende.
Nach Vertragsende: 30 Tage Datenexport möglich, dann vollständige Löschung.

── MODUL 11: ENTGELTBÄNDER (EU ART. 9) ──

Was sind Entgeltbänder?
Entgeltbänder definieren Min-/Maximalvergütung pro Stelle/Entgeltgruppe.
EU Art. 9 verpflichtet zur Veröffentlichung von Entgeltinformationen nach Kategorie und Geschlecht.
Intra-Gruppen-Lücke ≥ 5% → Begründungspflicht nach Art. 10.
Compa-Ratio = (Median-Gehalt ÷ Bandmitte) × 100.

Automatische Banderkennung:
CompLens erkennt job_grade-Werte aus importierten Daten und schlägt Benennungsschema vor
(G1/G2, L1/L2, TVöD, TV-L, ERA, E-Skala usw.). 1-Klick: alle Gruppen anlegen + Statistiken berechnen.

Interne Statistiken (pro Entgeltgruppe):
- Min, P25, Median, P75, Max (Grundgehalt)
- ♀/♂ Mediane getrennt, n, Intra-Gap, Gesamtvergütungs-Median

EU Art. 9 Heatmap: Binäre Bewertung — Grün (< 5%, konform) oder Rot (≥ 5%, Handlungsbedarf).

Markt-Benchmark (optional): Quelle, Jahr, P25/P50/P75 extern eintragen → erscheint im Diagramm.

Visualisierung: Horizontales Box-Plot (Grundgehalt oder Gesamtvergütung), mit Zielband + Marktdaten.

Dashboard: 7. KPI-Karte zeigt EU-konforme Gruppen X/Y + Hinweis-Banner bei Überschreitung.
Analyse: 3. Tab "Entgeltbänder (Art. 9)" mit Banddiagramm und Heatmap.
PDF: Optionale Seite "Entgeltbänder & Compa-Ratio" (in PDF-Optionen aktivierbar).

Tarifsysteme: TVöD, TV-L, ERA und ähnliche werden automatisch erkannt.

FAQ:
- Intra-Gruppen-Lücke vs. Gesamt-Gap: Intra-Lücke = innerhalb einer Gruppe (Art. 9);
  Gesamt-Gap = unternehmensweiter Gender Pay Gap. Beides meldepflichtig.
- Gruppen < 5 Personen werden anonymisiert.
- Compa-Ratio < 87%: typisches Warnsignal für Unterbezahlung im C&B-Management.

── MODUL: STELLENARCHITEKTUR (Zusatzmodul €3.900/Jahr) ──

Die Stellenarchitektur ist ein optionales Modul für die strukturierte
Verwaltung von Jobfamilien, Stellen, Kompetenzen und Einstufungen.

Leveling-Struktur einrichten:
Unter Stellenarchitektur → Einstufungen kann die Organisation ihre eigene
Einstufungsstruktur erstellen. Drei Optionen:
(1) CompLens-Standardvorlage (L1-L10) übernehmen
(2) Vom CompLens Assistenten generieren lassen (Branche, Größe, bestehende Strukturen angeben)
(3) Manuell erstellen
Mehrere Strukturen möglich, eine wird als Standard markiert.

Jobfamilien & Stellen:
Unter Stellenarchitektur → Familien & Stellen. Jobfamilien gruppieren verwandte Stellen
(z.B. Engineering, Finanzen, HR). Jede Stelle hat Titel, Einstufung, Stellenbeschreibung
und verknüpfte Kompetenzen. Stellenbeschreibungen können vom CompLens Assistenten generiert werden.
8 Standardfamilien können per Klick initialisiert werden.

Kompetenzen:
Unter Stellenarchitektur → Kompetenzen. Bibliothek mit 5-Stufen-Skala.
Kategorien: Kern, Führung, Fachlich, Funktional.
Beschreibungen und Verhaltensanker vom Assistenten generierbar.
14 Standardkompetenzen können per Klick initialisiert werden.

Einstufungszuordnung:
Unter Stellenarchitektur → Zuordnung. Verknüpft die Einstufungen mit den
Entgeltstufen aus dem Entgeltstufen-Modul. Zeigt Gehaltskorridore pro Stufe.

JD-Upload:
Unter Stellenarchitektur → JD-Upload. PDF oder Word-Datei hochladen.
Der CompLens Assistent analysiert die Stellenbeschreibung und schlägt
die passende Einstufung mit Konfidenzwert und Begründung vor.

Stellenbesetzung (Headcount):
Unter Stellenarchitektur → Stellenbesetzung. Ordnet Mitarbeitende aus importierten
Datensätzen den definierten Stellen zu. Drei Methoden:

(1) Zuordnungen übernehmen (Carryover):
Übernimmt bestätigte Zuordnungen aus einem vorherigen Datensatz. Mitarbeitende werden
anhand der Mitarbeiter-ID (employee_ref) über Datensätze hinweg abgeglichen.
~85-90% der Belegschaft behalten dieselbe Stelle — diese werden automatisch übernommen.
Geänderte Titel/Abteilungen/Stufen werden zur Überprüfung markiert.
Neue Mitarbeitende erhalten eine Stellenvorschlag basierend auf Titelabgleich.

(2) Automatische Zuordnung (Auto-Mapping):
Gleicht Mitarbeitende anhand von Entgeltgruppe + Stellenbezeichnung mit definierten
Stellen ab. 4-Stufen-Konfidenz: Stufe+Titel (95%), Stufe allein (80%),
Stufe+mehrere Stellen (50-70%), nur Titel (30-55%).
Ergebnisse werden in einer Übersichtstabelle zur Bestätigung/Ablehnung/Änderung angezeigt.

(3) Manuelle Zuordnung:
Über die Stellendetails → Mitarbeitende zuordnen. Suchfunktion nach Name, ID oder Abteilung.

Vergütungsstufenzuordnung verbindet Stellenarchitektur mit Entgeltbändern.
Ohne diese Zuordnung kann die automatische Zuordnung nur Titelabgleich verwenden.

Zugriff: Nur Admin/Analyst-Rollen. Im Testzeitraum voll verfügbar.
Nach Testende als separates Modul buchbar (€3.900/Jahr).

FAQ:
- Stellenarchitektur ist NICHT Voraussetzung für die Entgeltanalyse
- Die Zuordnung zu Entgeltstufen synchronisiert sich mit dem Entgeltstufen-Modul
- Eigene Einstufungsstrukturen können jederzeit angepasst werden
- Der CompLens Assistent generiert nur Vorschläge, die manuell überprüft und angepasst werden können
- Zuordnungen übernehmen benötigt mindestens 2 Datensätze (aktuell + Vorjahr)
- Neue Stellen können direkt aus der Zuordnungsübersicht erstellt werden
- Bereits bestätigte Zuordnungen können jederzeit geändert oder rückgängig gemacht werden

══ NAVIGATIONSÜBERSICHT ══
- Dashboard: Übersicht der letzten Analysen und Schnellzugriff
- Import: CSV-Datensätze hochladen und verwalten
- Analyse: Entgeltlücken berechnen und detailliert ansehen
- Begründungen (via Analyse): Entgeltunterschiede dokumentieren
- Maßnahmen: Entgeltlücken mit strukturierten Plänen schließen
- Trendanalyse: Jahresüberschreitende Entwicklung der Lücken (Datensätze müssen manuell ausgewählt werden)
- Entgeltbänder: Interne Gehaltsbänder + EU Art. 9 Intra-Gruppen-Compliance
- Stellenarchitektur: Einstufungen, Jobfamilien, Stellen, Kompetenzen, Stellenbesetzung
- Berichte: PDF/PPT-Exporte generieren
- Auskunftsrecht: Mitarbeiterauskunft Art. 7 EU-RL 2023/970
- DSGVO & Compliance: Datenschutz und Rechtsnachweise
- Einstellungen: Profil, Team, Organisation, Abonnement
- Hilfe: Bedienungsanleitung (enthält auch Demo-Video)

══ DEMO-VIDEO ══
Vollständige 8-minütige CompLens-Demo auf YouTube verfügbar:
https://www.youtube.com/watch?v=s7Y346Gxklo
Dort werden alle Module in Reihenfolge gezeigt: Import → Analyse → Entgeltbänder → Begründungen → Maßnahmen → Export.
Nutzer können auf das Video verwiesen werden, wenn sie eine visuelle Übersicht suchen.
`

const COMPLENS_KB_EN = `
═══ COMPLENS PRODUCT KNOWLEDGE — USER GUIDE ═══

You have full knowledge of CompLens and can help users with product questions.
When a user asks "how do I do X in CompLens?" or "where do I find Y?", answer
with concrete step-by-step instructions from this knowledge base.

── MODULE 1: GETTING STARTED ──

Step 1 – Registration & Organisation:
After registration the organisation is created automatically. Under Settings → Organisation
you can adjust the name, country, and other metadata. This data appears on
all generated reports and PDF exports.
Tip: Fill in the organisation name completely — it is automatically used on PDF reports and the licence agreement.

Step 2 – Invite Team Members:
Under Settings → Team, admins can invite additional people by email.
Roles: Admin (full access) or Viewer (read-only access). Invitations are valid for 7 days.
Seat count is licence-bound; add-on seats can be booked under Settings → Subscription.

Step 3 – Complete Your Profile:
Under Settings → Profile: set your name, job title, and preferred language (German/English).

Step 4 – Download CSV Template:
Under Import → Download Template. The template contains all required fields per EU Directive 2023/970.
Always use the latest template version.

FAQ:
- Trial period = 7 days, then access is blocked until licence activation. Reports carry a SAMPLE watermark.
- Organisation name can be changed later under Settings → Organisation (admins only).
- After trial period: overlay blocks access, data is preserved, upgrade via Stripe.

── MODULE 2: IMPORTING DATASETS ──

Step 1 – Prepare CSV:
Required fields: employee_id (unique), gender (m/f/d), job_grade (pay grade),
hourly_rate OR annual_salary, department, employment_type (full_time/part_time/minijob), weekly_hours.
Delimiter: semicolon (;). Decimal numbers with comma (25,50) or period (25.50) both accepted.
Encoding: UTF-8.

Step 2 – Optional Fields:
first_name, last_name (for right to information Art. 7), variable_pay (bonuses/premiums),
overtime_hours, benefits_value (benefits in kind in EUR/year).

Step 3 – Upload File:
Import → New Dataset → enter name + reporting year → upload CSV.
CompLens validates automatically and shows errors with line references.
The dataset name appears on the PDF cover page.

Step 4 – Fix Errors:
Common errors: missing gender values, invalid employment_type codes, negative hourly rates.
Correct the CSV and re-upload.

Step 5 – Archive/Delete:
Archive = hide (data preserved, usable for trends).
Hard Delete = all linked analyses and explanations are deleted in GDPR-compliant fashion.

FAQ:
- Part-time employees: employment_type="part_time", weekly_hours=contractual hours.
  CompLens normalises to gross hourly pay per Art. 3 EU Directive 2023/970.
- Mini-jobs: type "minijob", reported separately, not included in overall gap.
- External contractors/freelancers: DO NOT include. Only employees in the legal sense.
- job_grade = internal pay grade (e.g. "L1", "Senior", "Pay Band 5").

── MODULE 3: ANALYSIS & RESULTS ──

Step 1 – Start a New Analysis:
Analysis → New Analysis → select dataset → enter analysis name → "Start Analysis".
Multiple analyses from the same dataset are possible (e.g. different WIF weightings).

Step 2 – Unadjusted vs. Adjusted:
Unadjusted = direct comparison of all women and men without regard to job groups.
Adjusted = comparison within the same cohort (job_grade) + WIF factors.
Both values are legally reportable per Art. 9 EU Directive 2023/970.

Step 3 – 5% Threshold:
Above 5% unadjusted median gap → red status badge → action required (Art. 9(1c)).
CompLens automatically generates a remediation plan suggestion.

Step 4 – Results by Department & Pay Grade:
Broken down by department and job_grade in the analysis detail view.
Cohorts with fewer than 5 people are anonymised as "< 5 empl.".

Step 5 – Quartile Distribution:
Shows the female/male share in each pay quartile. Required per Art. 9(1b) EU Directive.

FAQ:
- WIF factors = Value, Content, Function. Objective factors for equal work assessment.
  CompLens considers: qualification requirements, responsibility, workload, working conditions.
- Median is more robust than mean (less susceptible to outliers). The EU Directive primarily prescribes the median.
- Cohorts < 5 are hidden for GDPR reasons (data minimisation Art. 5(1c)).
- Retention obligation: 4 years per EU Directive. CompLens stores data until explicit deletion.

── MODULE 4: RECORDING EXPLANATIONS ──

What are explanations? Justifications for statistically conspicuous pay gaps using objective factors.
Examples: performance reviews, seniority, market compensation for specialists.
Explanations reduce the ADJUSTED gap, never the unadjusted (both must be reported).

Add an Explanation:
Analysis detail view → Cohort → "Add Explanation" → select category →
explanation share in % or EUR/hour → write description.
Explanations automatically appear in the PDF report (page 3) and PPT presentation.

Edit/Delete Explanations:
Edit icon (✎) → immediate effect on the adjusted gap.

FAQ:
- No limit on the number of explanations per cohort. Multiple factors can be combined.
- Explanations are internal documentation, not legal advice. Can be presented to authorities on request.
- "Explained" = gap portion backed by a documented factor.
  "Unexplained" = remaining gap without justification = potentially legally relevant.

── MODULE 5: REMEDIATION PLANS ──

Create a Remediation Plan:
Remediation → New Plan → select affected analysis + title + target date.
A plan contains multiple steps that are assigned to cohorts/departments.

Define Steps:
Each step: title, description, assignment, responsible person, target date.
Status: "open" / "in progress" / "completed".
Tip: Measurable targets per step (e.g. "3% pay raise for women in L3 by 31 Dec 2025").

Track Progress:
Remediation dashboard shows all active plans with progress bars and open/overdue steps.

FAQ:
- Export: Remediation plan is integrated into the PDF report (from page 4).
- Remediation plans do NOT affect calculation results (documentation only).

── MODULE 6: REPORTS & EXPORTS ──

Generate PDF Report:
Analysis detail page → "Export PDF". Contains: cover page, executive summary,
gap overview, cohort details, quartile distribution, explanations overview, remediation plan.
Reports during trial/expired licence: SAMPLE watermark, max 4 pages.

Generate PPT Presentation:
"Export PPT" → 7 slides: cover page, executive summary, gap overview, departments,
quartiles, salary comparison, methodology. Ideal for management or works council.

Branding:
All exports prominently display the organisation name.
"Created with CompLens" appears only as a small note.

Download Licence Agreement:
Settings → Subscription → "Download Agreement". Pre-filled and digitally signed by DexterBee GmbH.

── MODULE 7: RIGHT TO INFORMATION (Art. 7 EU Directive 2023/970) ──

What is the Right to Information?
Art. 7 EU Directive obliges employers to provide employees with information about their own pay
vs. average pay of the comparison group. Deadline: 2 months.

Search for Employees:
Right to Information → Search Employee → enter name or employee ID (minimum 3 characters).
Requires: first_name/last_name in the imported dataset.

Generate PDF Letter:
"Generate PDF / Print" → information letter with organisation name,
legally required comparison data, legal basis reference (Art. 7 EU Directive 2023/970).

FAQ:
- Each employee may request once per year. Response: median of the cohort (not individual salaries).
- Cohort < 5 people: no information can be provided; define alternative comparison groups.
- Anonymity: only medians/means shown, no individual salaries of third parties.

── MODULE 8: TREND ANALYSIS ──

Select Datasets (IMPORTANT — new UI):
Open Trend Analysis → "Dataset Selection" area → select at least 2 datasets via checkbox.
Without a selection the message "Please select at least one dataset" appears.
CompLens automatically pre-selects a sensible default based on reporting year.

Year-over-Year vs. Comparison Mode:
Standard mode: one line per reporting year (one representative dataset per year).
Comparison mode (toggle top right): each selected dataset = its own line,
even if multiple datasets cover the same year. Ideal for A/B scenarios.

Delta Cards: Green = gap decreased (improvement), Red = gap increased (deterioration).
Comparison refers to the immediately preceding year in the selection.

Department Heatmap (tab "Departments") & Grade Heatmap (tab "Grades"):
Colour-coded: Dark red (>10%), Orange (5–10%), Yellow (2–5%), Green (<2%).

FAQ:
- No trend view? → Select at least 2 datasets in the dataset selection.
- The same dataset cannot be selected twice.
- Trends are currently interactive only (not in PDF export, planned for a future version).

── MODULE 9: GDPR & COMPLIANCE ──

DPA (Data Processing Agreement):
Required per Art. 28 GDPR when personal data is processed.
Request via Compliance page → "Request DPA" section → open a support ticket in CompLens.
DPA is free of charge, delivered within 2 business days.

Data Protection Architecture:
- Server location: Germany/EU (Frankfurt am Main)
- Transmission: TLS 1.3 encrypted
- Storage: AES-256 at rest
- AI models via EU endpoints; data NOT used for AI training

Deletion Policy:
Datasets/analyses/account can be deleted at any time. Hard Delete = irreversible.
On request: complete data export before deletion.

FAQ:
- Data controller = customer organisation (Art. 4(7) GDPR).
  Data processor = DexterBee GmbH (Art. 4(8) GDPR). Regulated in the DPA.
- Data usage: exclusively for the CompLens service. No sharing.
  Legal basis: Art. 6(1b) GDPR (performance of contract).

── MODULE 10: SETTINGS & TEAM ──

Edit Profile:
Settings → Profile → name, job title, preferred language (German/English).
User-specific settings (do not apply to other team members).

Switch Language:
CompLens supports German and English. Settings → Profile → select language.
Immediate switch of the entire interface. Reports remain in German (legal requirement).

Subscription:
Settings → Subscription: current plan, expiry date, user seats.
Licensed users: software licence agreement (PDF) pre-filled and downloadable.
Upgrade + add-ons: direct Stripe checkout links.

Roles:
- Admin: full access (import, analysis, settings, team)
- Viewer: read-only (analyses, reports, portal) — no import or settings permissions

Password Reset:
Login page → "Forgot password" → reset link via email (valid for 60 minutes).

Cancellation:
Via support ticket in CompLens or in writing, 3 months notice before year-end.
After contract end: 30 days data export possible, then complete deletion.

── MODULE 11: PAY BANDS (EU ART. 9) ──

What are Pay Bands?
Pay bands define minimum/maximum pay per position/pay grade.
EU Art. 9 requires publication of pay information by category and gender.
Intra-group gap >= 5% → justification obligation per Art. 10.
Compa-Ratio = (median salary / band midpoint) x 100.

Automatic Band Detection:
CompLens recognises job_grade values from imported data and suggests a naming scheme
(G1/G2, L1/L2, TVoeD, TV-L, ERA, E-Scale, etc.). 1-click: create all groups + calculate statistics.

Internal Statistics (per pay grade):
- Min, P25, Median, P75, Max (base salary)
- Female/male medians separately, n, intra-gap, total compensation median

EU Art. 9 Heatmap: binary assessment — Green (< 5%, compliant) or Red (>= 5%, action required).

Market Benchmark (optional): enter source, year, P25/P50/P75 externally → appears in the chart.

Visualisation: horizontal box plot (base salary or total compensation), with target band + market data.

Dashboard: 7th KPI card shows EU-compliant groups X/Y + notice banner when threshold exceeded.
Analysis: 3rd tab "Pay Bands (Art. 9)" with band chart and heatmap.
PDF: optional page "Pay Bands & Compa-Ratio" (activatable in PDF options).

Collective agreement systems: TVoeD, TV-L, ERA and similar are automatically recognised.

FAQ:
- Intra-group gap vs. overall gap: intra-gap = within a group (Art. 9);
  overall gap = company-wide Gender Pay Gap. Both must be reported.
- Groups with fewer than 5 people are anonymised.
- Compa-Ratio < 87%: typical warning sign for underpayment in C&B management.

── MODULE: JOB ARCHITECTURE (Add-on €3,900/year) ──

Job Architecture is an optional module for structured management of
job families, positions, competencies, and leveling.

Setting up a leveling structure:
Under Job Architecture → Leveling, the organisation can create its own
leveling structure. Three options:
(1) Use the CompLens Standard template (L1-L10)
(2) Generate with the CompLens Assistant (provide industry, size, existing structures)
(3) Create manually
Multiple structures supported, one marked as default.

Job families & positions:
Under Job Architecture → Families & Jobs. Job families group related positions
(e.g. Engineering, Finance, HR). Each job has a title, level, job description,
and linked competencies. Job descriptions can be generated by the CompLens Assistant.
8 default families can be initialised with one click.

Competencies:
Under Job Architecture → Competencies. Library with 5-level proficiency scale.
Categories: Core, Leadership, Technical, Functional.
Descriptions and behavioural indicators can be generated by the Assistant.
14 default competencies can be initialised with one click.

Grade mapping:
Under Job Architecture → Grade Mapping. Links levels to pay band grades
from the Pay Bands module. Shows salary corridors per level.

JD Upload:
Under Job Architecture → JD Upload. Upload a PDF or Word file.
The CompLens Assistant analyses the job description and suggests
the appropriate level with confidence score and reasoning.

Headcount (Employee Mapping):
Under Job Architecture → Headcount. Maps employees from imported datasets
to defined positions. Three methods:

(1) Carry Forward Assignments:
Carries over confirmed assignments from a previous dataset. Employees are matched
across datasets via employee ID (employee_ref).
~85-90% of the workforce keep the same position — these are auto-confirmed.
Changed titles/departments/grades are flagged for review.
New hires receive a suggested position based on title matching.

(2) Auto-Mapping:
Matches employees by pay grade + job title against defined positions.
4-tier confidence: grade+title (95%), grade only (80%),
grade+multiple jobs (50-70%), title only (30-55%).
Results are shown in a review table for confirmation/rejection/override.

(3) Manual Assignment:
Via position details → Assign employees. Search by name, ID, or department.

Grade mapping connects Job Architecture with Pay Bands.
Without grade mapping, auto-mapping can only use title matching.

Access: Admin/Analyst roles only. Full access during trial period.
After trial, available as a separate bookable module (€3,900/year).

FAQ:
- Job Architecture is NOT required for pay gap analysis
- Grade mappings synchronise with the Pay Bands module
- Custom leveling structures can be modified at any time
- The CompLens Assistant generates suggestions that can be reviewed and adjusted manually
- Carry Forward requires at least 2 datasets (current + previous year)
- New positions can be created directly from the mapping review
- Confirmed assignments can be changed or reverted at any time

══ NAVIGATION OVERVIEW ══
- Dashboard: overview of recent analyses and quick access
- Import: upload and manage CSV datasets
- Analysis: calculate and view pay gaps in detail
- Explanations (via Analysis): document pay differences
- Remediation: close pay gaps with structured plans
- Trend Analysis: multi-year development of gaps (datasets must be selected manually)
- Pay Bands: internal salary bands + EU Art. 9 intra-group compliance
- Job Architecture: leveling, job families, positions, competencies, headcount mapping
- Reports: generate PDF/PPT exports
- Right to Information: employee information per Art. 7 EU Directive 2023/970
- GDPR & Compliance: data protection and legal documentation
- Settings: profile, team, organisation, subscription
- Help: user guide (also includes demo video)

══ DEMO VIDEO ══
Full 8-minute CompLens demo available on YouTube:
https://www.youtube.com/watch?v=s7Y346Gxklo
All modules are shown in order: Import → Analysis → Pay Bands → Explanations → Remediation → Export.
Users can be referred to the video if they need a visual overview.
`

/**
 * Returns the knowledge base string for the given locale.
 * Falls back to German if the locale is unknown.
 */
export function getKnowledgeBase(locale: string): string {
    return locale === 'en' ? COMPLENS_KB_EN : COMPLENS_KB_DE
}

/** @deprecated Use getKnowledgeBase(locale) instead. Kept for backward-compat during migration. */
const COMPLENS_KB = COMPLENS_KB_DE
export { COMPLENS_KB }
export default COMPLENS_KB
