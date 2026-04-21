// Carryover feature types and helpers

export type CarryoverResult = {
    employee_id: string
    source_employee_id: string
    identity_id: string
    employee_ref: string
    employee_name: string | null
    department: string | null
    job_grade: string | null
    job_title: string | null
    carried_job_id: string
    carried_job_title: string
    match_method: 'employee_ref' | 'name_department' | 'name_only'
    match_confidence: number
    change_flags: {
        title_changed: boolean
        department_changed: boolean
        grade_changed: boolean
    }
    previous_title: string | null
    previous_department: string | null
    previous_grade: string | null
    category: 'unchanged' | 'changed' | 'new_hire' | 'departed'
}

export type CarryoverSummary = {
    results: CarryoverResult[]
    total: number
    unchanged: number
    changed: number
    newHires: number
    departed: number
    sourceDatasetName: string
}

export function normalize(value: string | null | undefined): string {
    return (value ?? '').toLowerCase().trim()
}

export function buildName(first: string | null, last: string | null): string | null {
    const parts = [first, last].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : null
}

export const NO_CHANGE_FLAGS = { title_changed: false, department_changed: false, grade_changed: false } as const

// ── Title similarity (reused from autoMapAction logic) ──────

function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-zäöüß0-9\s]/g, '')
        .replace(/\b(senior|junior|lead|staff|principal|chief|head|leiter|leiterin|stellvertretend)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

export function titleSimilarity(a: string, b: string): number {
    const na = normalizeTitle(a)
    const nb = normalizeTitle(b)
    if (!na || !nb) return 0
    if (na === nb) return 0.95
    if (na.includes(nb) || nb.includes(na)) return 0.85
    const wordsA = new Set(na.split(/\s+/).filter(Boolean))
    const wordsB = new Set(nb.split(/\s+/).filter(Boolean))
    const intersection = [...wordsA].filter(w => wordsB.has(w))
    const union = new Set([...wordsA, ...wordsB])
    if (union.size === 0) return 0
    return intersection.length / union.size
}
