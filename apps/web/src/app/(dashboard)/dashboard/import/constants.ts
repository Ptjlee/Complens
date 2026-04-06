// Shared constants for the import wizard
// This file is imported by both server actions and client components

export const PAYLENS_FIELDS: Array<{
    key: string
    label: string
    labelEn: string
    required: boolean
    nameField: boolean
    group: string
}> = [
    { key: 'employee_ref',    label: 'Mitarbeiter-ID',              labelEn: 'Employee ID',                           required: false, nameField: false, group: 'identity'  },
    { key: 'first_name',      label: 'Vorname',                     labelEn: 'First Name',                            required: false, nameField: true,  group: 'identity'  },
    { key: 'last_name',       label: 'Nachname',                    labelEn: 'Last Name',                             required: false, nameField: true,  group: 'identity'  },
    { key: 'gender',          label: 'Geschlecht',                  labelEn: 'Gender',                                required: true,  nameField: false, group: 'core'      },
    { key: 'salary_base',     label: 'Grundgehalt',                 labelEn: 'Base Salary',                           required: true,  nameField: false, group: 'pay'       },
    { key: 'salary_variable', label: 'Variable Vergütung (EUR oder %)', labelEn: 'Variable Pay (EUR or %)',           required: false, nameField: false, group: 'pay'       },
    { key: 'overtime_pay',    label: 'Überstundenvergütung',        labelEn: 'Overtime Pay',                          required: false, nameField: false, group: 'pay'       },
    { key: 'benefits_in_kind',label: 'Sachbezüge / Benefits in Kind / Sonstige Vergütung', labelEn: 'Benefits in Kind / Other Compensation', required: false, nameField: false, group: 'pay' },
    { key: 'salary_period',   label: 'Gehaltsangabe (Periode)',     labelEn: 'Salary Period',                         required: false, nameField: false, group: 'pay'       },
    { key: 'weekly_hours',    label: 'Wöchentliche Stunden',        labelEn: 'Weekly Hours',                          required: false, nameField: false, group: 'hours'     },
    { key: 'monthly_hours',   label: 'Monatliche Stunden',          labelEn: 'Monthly Hours',                         required: false, nameField: false, group: 'hours'     },
    { key: 'fte_ratio',       label: 'Stellenumfang (FTE %)',       labelEn: 'FTE Ratio (%)',                         required: false, nameField: false, group: 'hours'     },
    { key: 'job_title',       label: 'Berufsbezeichnung',           labelEn: 'Job Title',                             required: false, nameField: false, group: 'role'      },
    { key: 'department',      label: 'Abteilung',                   labelEn: 'Department',                            required: false, nameField: false, group: 'role'      },
    { key: 'job_grade',       label: 'Entgeltgruppe / Level',       labelEn: 'Pay Grade / Level',                     required: false, nameField: false, group: 'role'      },
    { key: 'employment_type', label: 'Beschäftigungsart',           labelEn: 'Employment Type',                       required: false, nameField: false, group: 'role'      },
    { key: 'hire_date',       label: 'Eintrittsdatum',              labelEn: 'Hire Date',                             required: false, nameField: false, group: 'role'      },
    { key: 'location',        label: 'Standort',                    labelEn: 'Location',                              required: false, nameField: false, group: 'role'      },
]

/** Returns the localised label for a PayLens field. */
export function getFieldLabel(field: typeof PAYLENS_FIELDS[number], locale: string): string {
    return locale === 'en' ? field.labelEn : field.label
}

// ============================================================
// EU Directive Art. 10 — Explanation categories
// max_justifiable_pct: guideline max % of gap this factor can
// objectively justify per directive & EntgTranspG case law.
//
// Note: the structural WIF adjustment (Tier 2) controls for
// job_grade × employment_type × department × location. These
// individual explanation categories therefore apply only to
// WITHIN-CELL deviations that the structural model cannot absorb.
//
// Combined cap: MAX_JUSTIFIABLE_CAP — regardless of how many
// categories are selected, total credit is capped at 25%.
// Rationale: Art. 18 — employer bears burden of proof per
// individual differential. A >25% within-cell gap implies the
// WIF cell definition is wrong, not that the gap is justified.
// ============================================================

/** Maximum combined justification credit across all selected categories (Art. 18) */
export const MAX_JUSTIFIABLE_CAP = 25  // percent

export const EXPLANATION_CATEGORIES = [
    {
        key:               'seniority',
        label:             'Betriebszugehörigkeit / Seniorität',
        labelEn:           'Seniority / Tenure',
        description:       'Längere Betriebszugehörigkeit oder höhere Berufserfahrung',
        descriptionEn:     'Longer tenure or greater professional experience',
        max_justifiable_pct: 12,   // ~1.5% per year; 12% = ~8 years seniority premium
        color:             '#6366f1',
    },
    {
        key:               'performance',
        label:             'Individuelle Leistung',
        labelEn:           'Individual Performance',
        description:       'Nachweislich bessere Leistungsbeurteilung (dokumentiert)',
        descriptionEn:     'Demonstrably better performance review (documented)',
        max_justifiable_pct: 8,    // must be based on written, non-subjective review
        color:             'var(--color-pl-brand)',
    },
    {
        key:               'qualification',
        label:             'Qualifikation / Ausbildung',
        labelEn:           'Qualification / Education',
        description:       'Höhere Bildungsabschlüsse oder Zertifizierungen',
        descriptionEn:     'Higher educational qualifications or certifications',
        max_justifiable_pct: 8,    // unchanged — well-accepted in case law
        color:             '#8b5cf6',
    },
    {
        key:               'market',
        label:             'Markt- / Regionalpremium',
        labelEn:           'Market / Regional Premium',
        description:       'Marktknappheit in spezifischer Rolle (innerhalb derselben Region)',
        descriptionEn:     'Labour market scarcity in a specific role (within the same region)',
        max_justifiable_pct: 12,   // cross-location differences absorbed by WIF; this covers within-location role scarcity
        color:             '#f59e0b',
    },
    {
        key:               'collective',
        label:             'Tarifvertrag / Kollektivvereinbarung',
        labelEn:           'Collective Agreement',
        description:       'Individuelle Tarifzulagen (z. B. Besitzstandszulage, Tarifanlage) — Klausel erforderlich',
        descriptionEn:     'Individual collective agreement supplements (e.g. grandfathered allowances) — clause required',
        max_justifiable_pct: 15,   // ↓ from 20%; grade-level tariff differences absorbed by WIF. Covers within-cell supplements only.
        color:             '#10b981',
    },
    {
        key:               'shift',
        label:             'Schicht- / Erschwerniszulage',
        labelEn:           'Shift / Hardship Allowance',
        description:       'Nachhaltige Schichtarbeit, Nachtarbeit oder Erschwernis',
        descriptionEn:     'Sustained shift work, night work, or hardship',
        max_justifiable_pct: 10,   // unchanged
        color:             '#06b6d4',
    },
    {
        key:               'other',
        label:             'Sonstiger objektiver Grund',
        labelEn:           'Other Objective Reason',
        description:       'Anderer nachweisbarer, geschlechtsneutraler Grund',
        descriptionEn:     'Another demonstrable, gender-neutral reason',
        max_justifiable_pct: 5,    // appropriately conservative catch-all
        color:             '#94a3b8',
    },
] as const

/** Returns the localised label for an explanation category. */
export function getCategoryLabel(cat: typeof EXPLANATION_CATEGORIES[number], locale: string): string {
    return locale === 'en' ? cat.labelEn : cat.label
}

/** Returns the localised description for an explanation category. */
export function getCategoryDescription(cat: typeof EXPLANATION_CATEGORIES[number], locale: string): string {
    return locale === 'en' ? cat.descriptionEn : cat.description
}

export type ExplanationCategoryKey = typeof EXPLANATION_CATEGORIES[number]['key']

export type PayLensField = string

export type ColumnMapping = {
    [sourceColumn: string]: string | null
}

export type MappingConfidence = {
    [sourceColumn: string]: number
}
