/**
 * CompLens — UI Translation Dictionary
 * DE (Deutsch) is the primary language / default.
 * EN (English) is the secondary language.
 *
 * Usage:
 *   import { useTranslation } from '@/lib/i18n/useTranslation'
 *   const { t } = useTranslation()
 *   t('nav.dashboard')  →  "Dashboard" | "Dashboard"
 */

export type Lang = 'de' | 'en'

export const translations = {
    // ── Navigation ──────────────────────────────────────────────
    'nav.dashboard':    { de: 'Dashboard',         en: 'Dashboard' },
    'nav.import':       { de: 'Import',             en: 'Import' },
    'nav.analysis':     { de: 'Analyse',            en: 'Analysis' },
    'nav.explanations': { de: 'Begründungen',       en: 'Explanations' },
    'nav.remediation':  { de: 'Maßnahmen',          en: 'Remediation' },
    'nav.trends':       { de: 'Trendanalyse',       en: 'Trend Analysis' },
    'nav.reports':      { de: 'Berichte',           en: 'Reports' },
    'nav.jobArchitecture': { de: 'Stellenarchitektur', en: 'Job Architecture' },
    'nav.portal':       { de: 'Auskunftsrecht',     en: 'Employee Portal' },
    'nav.compliance':   { de: 'DSGVO & Compliance', en: 'GDPR & Compliance' },
    'nav.settings':     { de: 'Einstellungen',      en: 'Settings' },
    'nav.help':         { de: 'Hilfe',              en: 'Help' },
    'nav.chat':         { de: 'Analyseassistent',   en: 'AI Assistant' },

    // ── Common actions ───────────────────────────────────────────
    'action.save':            { de: 'Speichern',         en: 'Save' },
    'action.cancel':          { de: 'Abbrechen',         en: 'Cancel' },
    'action.delete':          { de: 'Löschen',           en: 'Delete' },
    'action.edit':            { de: 'Bearbeiten',        en: 'Edit' },
    'action.download':        { de: 'Herunterladen',     en: 'Download' },
    'action.upload':          { de: 'Hochladen',         en: 'Upload' },
    'action.export':          { de: 'Exportieren',       en: 'Export' },
    'action.create':          { de: 'Erstellen',         en: 'Create' },
    'action.confirm':         { de: 'Bestätigen',        en: 'Confirm' },
    'action.search':          { de: 'Suchen',            en: 'Search' },
    'action.filter':          { de: 'Filtern',           en: 'Filter' },
    'action.back':            { de: 'Zurück',            en: 'Back' },
    'action.close':           { de: 'Schließen',         en: 'Close' },
    'action.continue':        { de: 'Weiter',            en: 'Continue' },
    'action.upgrade':         { de: 'Jetzt upgraden',    en: 'Upgrade now' },
    'action.startAnalysis':   { de: 'Analyse starten',   en: 'Start analysis' },
    'action.exportPDF':       { de: 'PDF exportieren',   en: 'Export PDF' },
    'action.exportPPT':       { de: 'PPT exportieren',   en: 'Export PPT' },
    'action.downloadContract':{ de: 'Vertrag herunterladen', en: 'Download contract' },

    // ── Status & Labels ──────────────────────────────────────────
    'status.active':       { de: 'Aktiv',             en: 'Active' },
    'status.inactive':     { de: 'Inaktiv',           en: 'Inactive' },
    'status.pending':      { de: 'Ausstehend',        en: 'Pending' },
    'status.complete':     { de: 'Abgeschlossen',     en: 'Complete' },
    'status.inProgress':   { de: 'In Bearbeitung',    en: 'In progress' },
    'status.licensed':     { de: 'Lizenziert',        en: 'Licensed' },
    'status.trial':        { de: 'Testversion',       en: 'Trial' },
    'status.expired':      { de: 'Abgelaufen',        en: 'Expired' },
    'status.exceeds5pct':  { de: '5%-Schwelle überschritten', en: 'Exceeds 5% threshold' },
    'status.under5pct':    { de: 'Unter 5%-Schwelle', en: 'Under 5% threshold' },

    // ── Dashboard ────────────────────────────────────────────────
    'dashboard.title':       { de: 'Dashboard',                   en: 'Dashboard' },
    'dashboard.welcome':     { de: 'Willkommen bei CompLens',     en: 'Welcome to CompLens' },
    'dashboard.subtitle':    { de: 'EU-Entgelttransparenz-Analyse', en: 'EU Pay Transparency Analysis' },
    'dashboard.quickActions':{ de: 'Schnellzugriff',              en: 'Quick Actions' },
    'dashboard.noAnalyses':  { de: 'Noch keine Analysen vorhanden', en: 'No analyses yet' },

    // ── Import ───────────────────────────────────────────────────
    'import.title':          { de: 'Datensatz importieren',      en: 'Import Dataset' },
    'import.newDataset':     { de: 'Neuer Datensatz',            en: 'New Dataset' },
    'import.datasetName':    { de: 'Datensatzname',              en: 'Dataset name' },
    'import.reportingYear':  { de: 'Berichtsjahr',               en: 'Reporting year' },
    'import.dropzone':       { de: 'CSV-Datei hier ablegen oder klicken', en: 'Drop CSV file here or click' },
    'import.downloadTemplate':{ de: 'Vorlage herunterladen',     en: 'Download template' },
    'import.validating':     { de: 'Validiert…',                 en: 'Validating…' },
    'import.success':        { de: 'Datensatz erfolgreich importiert', en: 'Dataset imported successfully' },
    'import.errors':         { de: 'Validierungsfehler',         en: 'Validation errors' },

    // ── Analysis ─────────────────────────────────────────────────
    'analysis.title':            { de: 'Analyse',                        en: 'Analysis' },
    'analysis.new':              { de: 'Neue Analyse',                   en: 'New Analysis' },
    'analysis.unadjustedMedian': { de: 'Unbereinigter Median',           en: 'Unadjusted Median' },
    'analysis.adjustedMedian':   { de: 'Bereinigter Median',             en: 'Adjusted Median' },
    'analysis.unadjustedMean':   { de: 'Unbereinigter Mittelwert',       en: 'Unadjusted Mean' },
    'analysis.adjustedMean':     { de: 'Bereinigter Mittelwert',         en: 'Adjusted Mean' },
    'analysis.byDepartment':     { de: 'Nach Abteilung',                 en: 'By Department' },
    'analysis.byGrade':          { de: 'Nach Entgeltgruppe',             en: 'By Pay Grade' },
    'analysis.quartiles':        { de: 'Quartilsverteilung',             en: 'Quartile Distribution' },
    'analysis.totalEmployees':   { de: 'Mitarbeitende gesamt',           en: 'Total Employees' },
    'analysis.female':           { de: 'Frauen',                         en: 'Female' },
    'analysis.male':             { de: 'Männer',                         en: 'Male' },
    'analysis.suppressed':       { de: '< 5 MA (anonymisiert)',          en: '< 5 employees (anonymised)' },
    'analysis.noActionNeeded':   { de: 'Kein Handlungsbedarf',           en: 'No action required' },
    'analysis.actionNeeded':     { de: 'Handlungsbedarf vorhanden',      en: 'Action required' },

    // ── Explanations ─────────────────────────────────────────────
    'explanations.title':    { de: 'Begründungen',          en: 'Explanations' },
    'explanations.add':      { de: 'Begründung hinzufügen', en: 'Add explanation' },
    'explanations.edit':     { de: 'Begründung bearbeiten', en: 'Edit explanation' },
    'explanations.category': { de: 'Kategorie',             en: 'Category' },
    'explanations.amount':   { de: 'Erklärungsanteil',      en: 'Explained amount' },
    'explanations.desc':     { de: 'Beschreibung',          en: 'Description' },
    'explanations.explained':{ de: 'Erklärt',               en: 'Explained' },
    'explanations.unexplained':{ de: 'Unerläutert',         en: 'Unexplained' },

    // ── Remediation ──────────────────────────────────────────────
    'remediation.title':     { de: 'Maßnahmenpläne',        en: 'Remediation Plans' },
    'remediation.newPlan':   { de: 'Neuer Plan',            en: 'New Plan' },
    'remediation.step':      { de: 'Maßnahme',              en: 'Action step' },
    'remediation.dueDate':   { de: 'Zieldatum',             en: 'Due date' },
    'remediation.responsible':{ de: 'Verantwortlich',       en: 'Responsible' },
    'remediation.progress':  { de: 'Fortschritt',           en: 'Progress' },

    // ── Reports ──────────────────────────────────────────────────
    'reports.title':         { de: 'Berichte',              en: 'Reports' },
    'reports.generate':      { de: 'Bericht erstellen',     en: 'Generate report' },
    'reports.preview':       { de: 'Vorschau',              en: 'Preview' },
    'reports.interactiveReport':{ de: 'Interaktiver Bericht', en: 'Interactive report' },

    // ── Portal ───────────────────────────────────────────────────
    'portal.title':          { de: 'Auskunftsrecht (Art. 7)', en: 'Employee Right to Know (Art. 7)' },
    'portal.searchEmployee': { de: 'Mitarbeiter suchen',      en: 'Search employee' },
    'portal.generatePDF':    { de: 'PDF generieren / Drucken', en: 'Generate PDF / Print' },
    'portal.employeeInfo':   { de: 'Mitarbeiterinformation',  en: 'Employee information' },
    'portal.cohort':         { de: 'Vergleichsgruppe (Kohorte)', en: 'Comparison group (cohort)' },
    'portal.yourPay':        { de: 'Ihr Entgelt (Analyse-Stichtag)', en: 'Your pay (analysis reference date)' },

    // ── Trends ───────────────────────────────────────────────────
    'trends.title':          { de: 'Trendanalyse',          en: 'Trend Analysis' },
    'trends.overview':       { de: 'Übersicht',             en: 'Overview' },
    'trends.departments':    { de: 'Bereiche',              en: 'Departments' },
    'trends.grades':         { de: 'Entgeltgruppen',        en: 'Pay Grades' },
    'trends.vsLastYear':     { de: 'ggü. Vorjahr',          en: 'vs. prior year' },
    'trends.notEnoughData':  { de: 'Mindestens 2 Analysen für Trendvergleich erforderlich', en: 'At least 2 analyses required for trend comparison' },

    // ── Settings ─────────────────────────────────────────────────
    'settings.title':         { de: 'Einstellungen',         en: 'Settings' },
    'settings.org':           { de: 'Organisation',          en: 'Organisation' },
    'settings.profile':       { de: 'Profil',                en: 'Profile' },
    'settings.subscription':  { de: 'Abonnement',            en: 'Subscription' },
    'settings.security':      { de: 'Sicherheit',            en: 'Security' },
    'settings.team':          { de: 'Team',                  en: 'Team' },
    'settings.fullName':      { de: 'Vollständiger Name',    en: 'Full name' },
    'settings.jobTitle':      { de: 'Berufsbezeichnung',     en: 'Job title' },
    'settings.language':      { de: 'Bevorzugte Sprache',    en: 'Preferred language' },
    'settings.languageDe':    { de: 'Deutsch',               en: 'German' },
    'settings.languageEn':    { de: 'Englisch',              en: 'English' },
    'settings.saved':         { de: 'Gespeichert',           en: 'Saved' },
    'settings.inviteMember':  { de: 'Mitglied einladen',     en: 'Invite member' },
    'settings.role.admin':    { de: 'Admin',                 en: 'Admin' },
    'settings.role.viewer':   { de: 'Betrachter',            en: 'Viewer' },
    'settings.currentPlan':   { de: 'Ihr aktueller Plan',    en: 'Your current plan' },
    'settings.trialEnds':     { de: 'Testphase endet am',    en: 'Trial ends on' },
    'settings.licenseContract':{ de: 'Lizenzvertrag (PDF)',  en: 'License contract (PDF)' },
    'settings.presigned':     { de: 'Bereits von DexterBee GmbH digital unterzeichnet', en: 'Pre-signed by DexterBee GmbH' },

    // ── Compliance ───────────────────────────────────────────────
    'compliance.title':      { de: 'DSGVO & Compliance',    en: 'GDPR & Compliance' },
    'compliance.avv':        { de: 'AV-Vertrag anfordern',  en: 'Request DPA' },
    'compliance.serverDE':   { de: 'Serverstandort Deutschland', en: 'Server location Germany' },

    // ── Help ─────────────────────────────────────────────────────
    'help.title':            { de: 'Hilfe & Bedienungsanleitung', en: 'Help & User Guide' },
    'help.searchPlaceholder':{ de: 'Modul oder Thema suchen…',    en: 'Search module or topic…' },
    'help.guide':            { de: 'Anleitung',             en: 'Guide' },
    'help.faq':              { de: 'FAQ',                   en: 'FAQ' },
    'help.support':          { de: 'Support kontaktieren',  en: 'Contact support' },
    'help.legalRef':         { de: 'Rechtsgrundlagen — Schnellübersicht', en: 'Legal Reference — Overview' },

    // ── Trial expired overlay ────────────────────────────────────
    'trial.expiredTitle':    { de: 'Testzeitraum abgelaufen', en: 'Trial period expired' },
    'trial.expiredSubtitle': { de: 'Der Testzeitraum ist abgelaufen. Upgraden Sie, um alle Funktionen weiter zu nutzen.', en: 'Your trial has ended. Upgrade to continue using all features.' },
    'trial.upgradeNow':      { de: 'Jetzt upgraden',         en: 'Upgrade now' },
    'trial.expiredOn':       { de: 'Abgelaufen am',          en: 'Expired on' },

    // ── Errors ───────────────────────────────────────────────────
    'error.notFound':        { de: 'Nicht gefunden',         en: 'Not found' },
    'error.unauthorized':    { de: 'Nicht autorisiert',      en: 'Unauthorized' },
    'error.generic':         { de: 'Ein Fehler ist aufgetreten', en: 'An error occurred' },
    'error.tryAgain':        { de: 'Bitte erneut versuchen', en: 'Please try again' },
} satisfies Record<string, Record<Lang, string>>

export type TranslationKey = keyof typeof translations

/** Resolve a translation key to the correct language string. */
export function translate(key: TranslationKey, lang: Lang): string {
    return translations[key]?.[lang] ?? translations[key]?.de ?? key
}
