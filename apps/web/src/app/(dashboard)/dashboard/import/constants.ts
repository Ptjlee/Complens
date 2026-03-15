// Shared constants for the import wizard
// This file is imported by both server actions and client components

export const PAYLENS_FIELDS: Array<{ key: string; label: string; required: boolean; nameField: boolean; group: string }> = [
    { key: 'employee_ref',    label: 'Mitarbeiter-ID',              required: false, nameField: false, group: 'identity'  },
    { key: 'first_name',      label: 'Vorname',                     required: false, nameField: true,  group: 'identity'  },
    { key: 'last_name',       label: 'Nachname',                    required: false, nameField: true,  group: 'identity'  },
    { key: 'gender',          label: 'Geschlecht',                  required: true,  nameField: false, group: 'core'      },
    { key: 'salary_base',     label: 'Grundgehalt',                 required: true,  nameField: false, group: 'pay'       },
    { key: 'salary_variable',   label: 'Variable Vergütung (EUR oder %)',  required: false, nameField: false, group: 'pay' },
    { key: 'overtime_pay',      label: 'Überstundenvergütung',             required: false, nameField: false, group: 'pay'       },
    { key: 'benefits_in_kind', label: 'Sachbezüge / Benefits in Kind / Sonstige Vergütung', required: false, nameField: false, group: 'pay' },
    { key: 'salary_period',   label: 'Gehaltsangabe (Periode)',     required: false, nameField: false, group: 'pay'       },
    { key: 'weekly_hours',    label: 'Wöchentliche Stunden',        required: false, nameField: false, group: 'hours'     },
    { key: 'monthly_hours',   label: 'Monatliche Stunden',          required: false, nameField: false, group: 'hours'     },
    { key: 'fte_ratio',       label: 'Stellenumfang (FTE %)',       required: false, nameField: false, group: 'hours'     },
    { key: 'job_title',       label: 'Berufsbezeichnung',           required: false, nameField: false, group: 'role'      },
    { key: 'department',      label: 'Abteilung',                   required: false, nameField: false, group: 'role'      },
    { key: 'job_grade',       label: 'Entgeltgruppe / Level',       required: false, nameField: false, group: 'role'      },
    { key: 'employment_type', label: 'Beschäftigungsart',           required: false, nameField: false, group: 'role'      },
    { key: 'hire_date',       label: 'Eintrittsdatum',              required: false, nameField: false, group: 'role'      },
    { key: 'location',        label: 'Standort',                    required: false, nameField: false, group: 'role'      },
]

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
        description:       'Längere Betriebszugehörigkeit oder höhere Berufserfahrung',
        max_justifiable_pct: 12,   // ~1.5% per year; 12% = ~8 years seniority premium
        color:             '#6366f1',
    },
    {
        key:               'performance',
        label:             'Individuelle Leistung',
        description:       'Nachweislich bessere Leistungsbeurteilung (dokumentiert)',
        max_justifiable_pct: 8,    // must be based on written, non-subjective review
        color:             'var(--color-pl-brand)',
    },
    {
        key:               'qualification',
        label:             'Qualifikation / Ausbildung',
        description:       'Höhere Bildungsabschlüsse oder Zertifizierungen',
        max_justifiable_pct: 8,    // unchanged — well-accepted in case law
        color:             '#8b5cf6',
    },
    {
        key:               'market',
        label:             'Markt- / Regionalpremium',
        description:       'Marktknappheit in spezifischer Rolle (innerhalb derselben Region)',
        max_justifiable_pct: 12,   // cross-location differences absorbed by WIF; this covers within-location role scarcity
        color:             '#f59e0b',
    },
    {
        key:               'collective',
        label:             'Tarifvertrag / Kollektivvereinbarung',
        description:       'Individuelle Tarifzulagen (z. B. Besitzstandszulage, Tarifanlage) — Klausel erforderlich',
        max_justifiable_pct: 15,   // ↓ from 20%; grade-level tariff differences absorbed by WIF. Covers within-cell supplements only.
        color:             '#10b981',
    },
    {
        key:               'shift',
        label:             'Schicht- / Erschwerniszulage',
        description:       'Nachhaltige Schichtarbeit, Nachtarbeit oder Erschwernis',
        max_justifiable_pct: 10,   // unchanged
        color:             '#06b6d4',
    },
    {
        key:               'other',
        label:             'Sonstiger objektiver Grund',
        description:       'Anderer nachweisbarer, geschlechtsneutraler Grund',
        max_justifiable_pct: 5,    // appropriately conservative catch-all
        color:             '#94a3b8',
    },
] as const

export type ExplanationCategoryKey = typeof EXPLANATION_CATEGORIES[number]['key']

export type PayLensField = string

export type ColumnMapping = {
    [sourceColumn: string]: string | null
}

export type MappingConfidence = {
    [sourceColumn: string]: number
}
