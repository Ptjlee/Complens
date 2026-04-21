/**
 * Job Architecture Module — Type Definitions
 */

// ── Enums & Literals ─────────────────────────────────────────

export type CompetencyCategory = 'technical' | 'leadership' | 'core' | 'functional'
export type CompetencyImportance = 'critical' | 'important' | 'nice_to_have'
export type LevelingSource = 'template_l1_l10' | 'assistant_generated' | 'custom'

// ── Leveling ─────────────────────────────────────────────────

export type LevelingStructure = {
    id: string
    org_id: string
    name: string
    description: string | null
    is_default: boolean
    source: LevelingSource
    created_at: string
    updated_at: string
}

export type LevelDefinition = {
    id: string
    org_id: string
    structure_id: string
    level_code: string
    sort_order: number
    title_examples: string | null
    description: string | null
    problem_solving: string | null
    accountability: string | null
    people_management: string | null
    knowledge_expertise: string | null
    communication_influence: string | null
    autonomy_decision_rights: string | null
    created_at: string
    updated_at: string
}

export type DefaultLevelDefinition = {
    id: string
    level: string
    title_examples: string | null
    description: string | null
    problem_solving: string | null
    accountability: string | null
    people_management: string | null
    knowledge_expertise: string | null
    communication_influence: string | null
    autonomy_decision_rights: string | null
}

// ── Job Families ─────────────────────────────────────────────

export type JobFamily = {
    id: string
    org_id: string
    name: string
    description: string | null
    color: string
    icon: string
    is_active: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

// ── Competencies ─────────────────────────────────────────────

export type CompetencyLevel = {
    level: number
    name: string
    description: string
    behaviours?: string[]
}

export type Competency = {
    id: string
    org_id: string
    name: string
    category: CompetencyCategory
    description: string | null
    levels: CompetencyLevel[]
    is_active: boolean
    created_at: string
    updated_at: string
}

// ── Employee-to-Job Assignments ──────────────────────────────

export type EmployeeJobAssignment = {
    id: string
    org_id: string
    employee_id: string
    job_id: string
    dataset_id: string
    source: 'auto' | 'manual' | 'ai_suggested' | 'carryover'
    confidence: number | null
    match_reason: string | null
    status: 'pending' | 'confirmed' | 'rejected'
    assigned_by: string | null
    created_at: string
    updated_at: string
    // Joined fields (optional)
    employee?: {
        employee_ref: string
        first_name: string | null
        last_name: string | null
        department: string | null
        job_grade: string | null
        job_title: string | null
    }
}

export type DatasetRef = {
    id: string
    name: string
    reporting_year: number
}

// ── Jobs ─────────────────────────────────────────────────────

export type Job = {
    id: string
    org_id: string
    family_id: string
    title: string
    level_id: string | null
    salary_band_grade_id: string | null
    jd_summary: string | null
    jd_responsibilities: string[] | null
    jd_qualifications: string[] | null
    jd_benefits: string[] | null
    jd_generated_at: string | null
    is_active: boolean
    headcount: number
    headcount_source: 'manual' | 'computed' | 'both'
    created_at: string
    updated_at: string
    // Joined relations
    job_family?: JobFamily
    level_definition?: LevelDefinition
    salary_band_grade?: {
        id: string
        job_grade: string
        min_salary: number
        max_salary: number
        mid_salary: number | null
    }
}

export type JobCompetency = {
    id: string
    org_id: string
    job_id: string
    competency_id: string
    required_level: number
    importance: CompetencyImportance
    created_at: string
    competency?: Competency
}

// ── Grade Mapping ────────────────────────────────────────────

export type JobGradeMapping = {
    id: string
    org_id: string
    level_id: string
    salary_band_id: string
    mapped_grade: string
    mapped_grade_id: string | null
    created_at: string
    updated_at: string
}

// ── Salary Band Reference (for mapping UI) ───────────────────

export type SalaryBandRef = {
    id: string
    name: string
    grades: { id: string; job_grade: string }[]
}

// ── Context (returned by getJobArchitectureContext) ──────────

export type JobArchitectureContext = {
    structures: LevelingStructure[]
    levels: LevelDefinition[]
    defaultLevels: DefaultLevelDefinition[]
    jobFamilies: JobFamily[]
    jobs: Job[]
    competencies: Competency[]
    gradeMappings: JobGradeMapping[]
    salaryBands: SalaryBandRef[]
    datasets: DatasetRef[]
    assignmentCounts: Record<string, number>
    hasData: boolean
}

// ── Assistant Results ────────────────────────────────────────

export type AssistantGeneratedStructure = {
    name: string
    description: string
    levels: {
        level_code: string
        sort_order: number
        title_examples: string
        description: string
        problem_solving: string
        accountability: string
        people_management: string
        knowledge_expertise: string
        communication_influence: string
        autonomy_decision_rights: string
    }[]
}

export type AssistantGeneratedJD = {
    summary: string
    responsibilities: string[]
    qualifications: string[]
    suggested_competencies: {
        name: string
        level: number
        importance?: string
        reason: string
    }[]
}

export type JdUploadResult = {
    suggested_level_id: string | null
    suggested_level_code: string
    suggested_family_id: string | null
    suggested_family_name: string | null
    confidence: number
    reasoning: string
    extracted_title: string | null
    extracted_summary: string | null
    extracted_responsibilities: string[]
    extracted_qualifications: string[]
    suggested_competency_ids: string[]
    suggested_competencies?: Array<{ competency_id: string; required_level: number; importance: string }>
}

// ── Action Results ───────────────────────────────────────────

export type ActionResult<T = undefined> =
    | { success: true; data: T }
    | { success: false; error: string }
