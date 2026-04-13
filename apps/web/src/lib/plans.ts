/**
 * CompLens — Plan Feature Matrix
 * Single source of truth for all plan gating logic.
 * Import this in API routes, server components, and client components.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type PlanId = 'free' | 'paylens' | 'paylens_ai' | 'licensed' | 'trial'

export type Feature =
    | 'pdf_export'            // Download PDF reports
    | 'ppt_export'            // Download PPT presentations
    | 'ai_import'             // AI-powered column mapping in import
    | 'ai_explanations'       // Per-employee AI pay explanations
    | 'ai_narrative'          // AI narrative report generator
    | 'unlimited_employees'   // > 10 employees per dataset
    | 'multi_user'            // Multiple team members

export type OrgPlanFields = {
    plan: PlanId
    trial_ends_at: string | null
    ai_enabled: boolean
}

// ── Plan metadata ─────────────────────────────────────────────────────────────

export const PLAN_META: Record<PlanId, {
    label:        string
    priceYearly:  number        // EUR/year (0 = free / not purchasable directly)
    color:        string
    colorBg:      string
    features:     Feature[]
}> = {
    free: {
        label: 'Free',
        priceYearly: 0,
        color: '#8b949e',
        colorBg: 'rgba(139,148,158,0.1)',
        features: [],
    },
    paylens: {
        label: 'CompLens',
        priceYearly: 5990,
        color: '#3b82f6',
        colorBg: 'rgba(59,130,246,0.1)',
        features: ['pdf_export', 'ppt_export', 'unlimited_employees', 'multi_user'],
    },
    licensed: {
        label: 'CompLens',
        priceYearly: 5990,
        color: '#3b82f6',
        colorBg: 'rgba(59,130,246,0.1)',
        features: [
            'pdf_export', 'ppt_export',
            'ai_import', 'ai_explanations', 'ai_narrative',
            'unlimited_employees', 'multi_user',
        ],
    },
    paylens_ai: {
        label: 'CompLens AI',
        priceYearly: 5990,
        color: '#6366f1',
        colorBg: 'rgba(99,102,241,0.1)',
        features: [
            'pdf_export', 'ppt_export',
            'ai_import', 'ai_explanations', 'ai_narrative',
            'unlimited_employees', 'multi_user',
        ],
    },
    trial: {
        label: 'Trial',
        priceYearly: 0,
        color: '#f59e0b',
        colorBg: 'rgba(245,158,11,0.1)',
        // Trial = full AI access
        features: [
            'pdf_export', 'ppt_export',
            'ai_import', 'ai_explanations', 'ai_narrative',
            'unlimited_employees', 'multi_user',
        ],
    },
}

const FEATURE_LABELS_DE: Record<Feature, string> = {
    pdf_export:           'PDF-Export',
    ppt_export:           'PowerPoint-Export',
    ai_import:            'Automatische Spaltenerkennung',
    ai_explanations:      'Individuelle Entgeltanalyse',
    ai_narrative:         'Berichtsgenerator',
    unlimited_employees:  'Unbegrenzte Mitarbeitende',
    multi_user:           'Mehrere Nutzer',
}

const FEATURE_LABELS_EN: Record<Feature, string> = {
    pdf_export:           'PDF Export',
    ppt_export:           'PowerPoint Export',
    ai_import:            'Automatic Column Detection',
    ai_explanations:      'Individual Pay Analysis',
    ai_narrative:         'Report Generator',
    unlimited_employees:  'Unlimited Employees',
    multi_user:           'Multiple Users',
}

/** Returns feature labels for the given locale. Falls back to German. */
export function getFeatureLabels(locale: string): Record<Feature, string> {
    return locale === 'en' ? FEATURE_LABELS_EN : FEATURE_LABELS_DE
}

/** @deprecated Use getFeatureLabels(locale) instead. Kept for backward-compat during migration. */
export const FEATURE_LABELS: Record<Feature, string> = FEATURE_LABELS_DE

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Is the trial period still valid? */
export function isTrialActive(org: OrgPlanFields): boolean {
    if (org.plan !== 'trial') return false
    if (!org.trial_ends_at) return true
    return new Date(org.trial_ends_at) > new Date()
}

/** Days remaining in trial (0 if expired or not on trial). */
export function trialDaysLeft(org: OrgPlanFields): number {
    if (org.plan !== 'trial' || !org.trial_ends_at) return 0
    const diff = new Date(org.trial_ends_at).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/** Resolve effective plan (expired trial → 'free'). */
export function effectivePlan(org: OrgPlanFields): PlanId {
    if (org.plan === 'trial') {
        return isTrialActive(org) ? 'trial' : 'free'
    }
    return org.plan
}

/** Returns true if the org's effective plan includes the requested feature. */
export function canUse(org: OrgPlanFields, feature: Feature): boolean {
    return PLAN_META[effectivePlan(org)].features.includes(feature)
}

/**
 * Returns true if the org's trial has expired (plan is 'trial' but past end date).
 * Used to allow read-only access to existing data while blocking new actions.
 */
export function isTrialExpired(org: OrgPlanFields): boolean {
    if (org.plan !== 'trial') return false
    if (!org.trial_ends_at) return false
    return new Date(org.trial_ends_at) <= new Date()
}

/**
 * Which paid plan is the minimum that unlocks this feature?
 * Used to show targeted upgrade messaging.
 */
export function requiredPlanFor(feature: Feature): 'paylens' | 'paylens_ai' {
    const aiOnly: Feature[] = ['ai_import', 'ai_explanations', 'ai_narrative']
    return aiOnly.includes(feature) ? 'paylens_ai' : 'paylens'
}
