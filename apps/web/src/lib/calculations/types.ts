// ============================================================
// PayLens — Pay Gap Calculation Engine Types
// EU Pay Transparency Directive 2023/970 / EntgTranspG
// ============================================================

export type GenderGroup = 'male' | 'female' | 'non_binary' | 'not_specified'
export type SalaryPeriod = 'annual' | 'monthly' | 'hourly'

export interface EmployeeRecord {
    id: string
    employee_ref:     string | null
    first_name:       string | null
    last_name:        string | null
    gender: GenderGroup
    salary_base: number            // Gross pay in the salary_period unit
    salary_variable: number        // Bonus/variable — amount in EUR if variable_pay_type='eur',
                                   //                  fraction (0.1 = 10%) if variable_pay_type='pct'
    variable_pay_type: 'eur' | 'pct' | 'auto'  // 'auto' = engine decides based on value magnitude
    overtime_pay: number           // Annual overtime compensation (cash)
    benefits_in_kind: number       // Annual value of non-cash benefits
    salary_period: SalaryPeriod    // How salary_base is expressed
    // Working hours (at most one should be set — priority: weekly > monthly > fte)
    weekly_hours:  number | null   // Contractual hours/week (e.g. 32)
    monthly_hours: number | null   // Contractual hours/month
    fte_ratio:     number          // Fallback: 0.0–1.0 (1.0 = full-time)
    // Role / context
    job_title?: string | null
    department?: string | null
    job_grade?: string | null
    employment_type: string
    seniority_years?: number | null
    location?: string | null
}

// Derived after normalisation: all pay expressed as hourly rate
export interface NormalisedEmployee extends EmployeeRecord {
    annualised_hours: number   // Contractual hours/year (derived)
    annual_base_eur:  number   // Annualised base salary only (before variable/OT/BIK)
    hourly_rate: number        // (annual_salary + variable_EUR + overtime + benefits) / annualised_hours
    fte_derived: number        // annualised_hours / (standard_weekly_hours × 52)
    has_hours_data: boolean    // true if weekly_hours or monthly_hours was provided
    variable_pay_eur: number   // salary_variable resolved to annual EUR (after pct conversion)
}

// ---- Gap results for a single cohort ----

export interface GapResult {
    unadjusted_mean: number
    unadjusted_median: number
    adjusted_mean: number | null
    adjusted_median: number | null
    exceeds_5pct: boolean
    female_count: number
    male_count: number
    total_count: number
    // Total remuneration hourly rates (base + variable + OT + BIK)
    female_median_salary: number
    male_median_salary:   number
    female_mean_salary:   number
    male_mean_salary:     number
    // Base salary only hourly rates (Grundgehalt — no variable, OT, or BIK)
    female_base_only_median_salary: number
    male_base_only_median_salary:   number
    female_base_only_mean_salary:   number
    male_base_only_mean_salary:     number
}

// ---- Quartile distribution (EU Directive requirement) ----

export interface QuartileResult {
    q1: { female_pct: number; male_pct: number; count: number }
    q2: { female_pct: number; male_pct: number; count: number }
    q3: { female_pct: number; male_pct: number; count: number }
    q4: { female_pct: number; male_pct: number; count: number }
}

// ---- Department breakdown ----

export interface DepartmentResult {
    department: string
    gap: GapResult
    employee_count: number
    suppressed: boolean
}

// ---- Job grade breakdown ----

export interface GradeResult {
    grade: string
    gap: GapResult
    employee_count: number
    suppressed: boolean
}

// ---- Salary dispersion point (for dot-plot chart) ----
// Suppressed if grade has < 5 employees (GDPR / anonymisation)
export interface DispersionPoint {
    gender:       'male' | 'female' | 'other'
    annual_salary: number     // base salary annualised, EUR
    grade:        string | null
    department:   string | null
}

// ---- Gender distribution row (for stacked bar) ----
export interface GenderDistRow {
    label:        string      // grade label or department name
    female_count: number
    male_count:   number
    other_count:  number
    total:        number
    female_pct:   number      // 0–100
    male_pct:     number
}

// ---- Individual employee flag (drill-down analysis) ----

export interface IndividualFlag {
    employee_id:            string
    employee_ref:           string | null
    first_name:             string | null
    last_name:              string | null
    gender:                 GenderGroup
    department:             string | null
    job_grade:              string | null
    employment_type:        string
    hourly_rate:            number
    cohort_median:          number       // median of same job_grade + employment_type
    cohort_size:            number
    gap_vs_cohort_pct:      number       // (hourly_rate - cohort_median) / cohort_median
    opposite_gender_median: number | null
    opposite_gender_count:  number          // employees of opposite gender in same WIF cell
    gap_vs_gender_pct:      number | null   // null when opposite_gender_count < 2 (unreliable)
    severity:               'high' | 'medium' | 'low' | 'ok' | 'overpaid'
                            // high     = ≥25% underpaid (Kritisch — Red, pay raise required)
                            // medium   = 5–24.99% underpaid (Prüfen — investigate and document)
                            // low      = legacy only; no longer generated by engine (< 5% was Gering)
                            // ok       = within tolerable range (< 5% deviation)
                            // overpaid = ≥20% above peers (document objective justification)
    // Populated after DB fetch
    explanation_status?:    'open' | 'in_review' | 'explained' | 'rejected'
    explanation_category?:  string | null
    total_justified_pct?:   number
    // Raw imported compensation — used to pre-fill the Vergütungsdetails panel
    imported_salary_base:        number
    imported_salary_period:      'annual' | 'monthly' | 'hourly'
    imported_salary_variable:    number          // raw value (EUR or fraction, see variable_pay_type)
    imported_variable_pay_type:  'eur' | 'pct' | 'auto'
    imported_variable_pay_eur:   number          // always resolved to EUR by the engine
    imported_overtime_pay:       number
    imported_benefits_in_kind:   number
    imported_weekly_hours:       number | null
    imported_monthly_hours:      number | null
    imported_fte_ratio:          number
    imported_annualised_hours:   number          // derived by engine
}

// ---- Full analysis result (stored in analyses.results JSONB) ----

export interface AnalysisResult {
    dataset_id: string
    org_id: string
    reporting_year: number
    computed_at: string
    standard_weekly_hours: number   // org FTE reference used

    overall: GapResult
    quartiles: QuartileResult
    by_department: DepartmentResult[]
    by_grade: GradeResult[]

    total_employees: number
    departments_exceeding_5pct: string[]
    wif_factors_used: string[]          // factors used for adjusted gap (Track 2)
    wif_factors_selected?: string[]     // explicit selection by analyst (may differ from used if fallback)

    // Working hours coverage (quality indicator)
    hours_coverage_pct: number
    hours_assumption: string

    // Variable pay gap
    variable_pay_gap_mean:   number | null
    variable_pay_gap_median: number | null

    // Individual flags
    individual_flags:        IndividualFlag[]
    flag_threshold_pct:      number

    // Track 1 — Dispersion + gender distribution
    dispersion_points:       DispersionPoint[]    // salary dots per employee (grade < 5 suppressed)
    gender_by_grade:         GenderDistRow[]      // for stacked bar toggle
    gender_by_department:    GenderDistRow[]      // for stacked bar toggle

    // Track 6 — Benefits quality indicator
    benefits_coverage_pct:   number               // % employees with benefits_in_kind > 0
}
