'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient }   from '@/lib/supabase/server'
import { requireAdminRoleAction } from '@/lib/api/planGuard'
import type {
    ActionResult,
    CompetencyCategory,
    CompetencyLevel,
    Competency,
    JobGradeMapping,
} from '@/lib/jobArchitecture/types'

const JA_PATH = '/dashboard/job-architecture'

// ============================================================
// Competencies — CRUD
// ============================================================

export async function createCompetency(input: {
    name: string
    category: CompetencyCategory
    description?: string
    levels?: CompetencyLevel[]
}): Promise<ActionResult<Competency>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('competencies')
        .insert({
            org_id: auth.orgId,
            name: input.name,
            category: input.category,
            description: input.description ?? null,
            levels: input.levels ?? [],
        })
        .select()
        .single()

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: data as Competency }
}

export async function updateCompetency(
    id: string,
    input: Partial<{
        name: string
        category: CompetencyCategory
        description: string
        levels: CompetencyLevel[]
        is_active: boolean
    }>,
): Promise<ActionResult<Competency>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('competencies')
        .update(input)
        .eq('id', id)
        .eq('org_id', auth.orgId)
        .select()
        .single()

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: data as Competency }
}

export async function deleteCompetency(id: string): Promise<ActionResult> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
        .from('competencies')
        .delete()
        .eq('id', id)
        .eq('org_id', auth.orgId)

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: undefined }
}

/** Seed 14 core competencies (locale-aware). */
export async function initializeDefaultCompetencies(): Promise<ActionResult> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()

    // Detect locale for content language
    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'de'

    const en: { name: string; category: CompetencyCategory; description: string }[] = [
        // Core
        { name: 'Communication',        category: 'core',       description: 'Ability to convey information clearly and effectively.' },
        { name: 'Collaboration',         category: 'core',       description: 'Working effectively with others toward shared goals.' },
        { name: 'Problem Solving',       category: 'core',       description: 'Analyzing issues and developing effective solutions.' },
        { name: 'Adaptability',          category: 'core',       description: 'Adjusting to new conditions and embracing change.' },
        { name: 'Accountability',        category: 'core',       description: 'Taking ownership of actions and outcomes.' },
        // Leadership
        { name: 'Strategic Thinking',    category: 'leadership', description: 'Setting vision and aligning teams to long-term goals.' },
        { name: 'People Management',     category: 'leadership', description: 'Coaching, developing, and empowering direct reports.' },
        { name: 'Decision Making',       category: 'leadership', description: 'Making timely, well-informed decisions under uncertainty.' },
        { name: 'Change Leadership',     category: 'leadership', description: 'Driving and guiding organizational change initiatives.' },
        // Technical
        { name: 'Technical Expertise',   category: 'technical',  description: 'Deep knowledge in domain-specific technical areas.' },
        { name: 'Data Analysis',         category: 'technical',  description: 'Interpreting data to inform decisions and strategy.' },
        { name: 'Project Management',    category: 'technical',  description: 'Planning, executing, and delivering projects on time and budget.' },
        // Functional
        { name: 'Customer Focus',        category: 'functional', description: 'Understanding and prioritizing customer needs.' },
        { name: 'Innovation',            category: 'functional', description: 'Generating and implementing new ideas and approaches.' },
    ]

    const de: { name: string; category: CompetencyCategory; description: string }[] = [
        // Kern
        { name: 'Kommunikation',            category: 'core',       description: 'Fähigkeit, Informationen klar und wirkungsvoll zu vermitteln.' },
        { name: 'Zusammenarbeit',            category: 'core',       description: 'Effektive Kooperation mit anderen zur Erreichung gemeinsamer Ziele.' },
        { name: 'Problemlösung',             category: 'core',       description: 'Analyse von Sachverhalten und Entwicklung wirksamer Lösungen.' },
        { name: 'Anpassungsfähigkeit',       category: 'core',       description: 'Anpassung an neue Gegebenheiten und konstruktiver Umgang mit Veränderungen.' },
        { name: 'Verantwortungsbewusstsein', category: 'core',       description: 'Übernahme von Verantwortung für eigenes Handeln und dessen Ergebnisse.' },
        // Führung
        { name: 'Strategisches Denken',      category: 'leadership', description: 'Entwicklung einer Vision und Ausrichtung von Teams auf langfristige Ziele.' },
        { name: 'Personalführung',           category: 'leadership', description: 'Coaching, Entwicklung und Befähigung von Mitarbeitenden.' },
        { name: 'Entscheidungsfähigkeit',    category: 'leadership', description: 'Treffen fundierter Entscheidungen unter Unsicherheit.' },
        { name: 'Veränderungsmanagement',    category: 'leadership', description: 'Steuerung und Begleitung organisatorischer Veränderungsprozesse.' },
        // Fachlich
        { name: 'Fachkompetenz',             category: 'technical',  description: 'Vertiefte Kenntnisse in fachspezifischen Bereichen.' },
        { name: 'Datenanalyse',              category: 'technical',  description: 'Interpretation von Daten zur Unterstützung von Entscheidungen und Strategien.' },
        { name: 'Projektmanagement',         category: 'technical',  description: 'Planung, Durchführung und termingerechte Lieferung von Projekten im Budgetrahmen.' },
        // Funktional
        { name: 'Kundenorientierung',        category: 'functional', description: 'Verstehen und Priorisieren von Kundenbedürfnissen.' },
        { name: 'Innovationsfähigkeit',      category: 'functional', description: 'Entwicklung und Umsetzung neuer Ideen und Ansätze.' },
    ]

    const defaults = locale === 'de' ? de : en

    const rows = defaults.map(d => ({
        org_id: auth.orgId,
        name: d.name,
        category: d.category,
        description: d.description,
        levels: [],
    }))

    const { error } = await supabase.from('competencies').insert(rows)
    if (error) return { success: false, error: error.message }

    revalidatePath(JA_PATH)
    return { success: true, data: undefined }
}

// ============================================================
// Grade Mappings — level <-> salary band grade
// ============================================================

export async function addGradeMapping(input: {
    level_id: string
    salary_band_id: string
    mapped_grade: string
    mapped_grade_id?: string
}): Promise<ActionResult<JobGradeMapping>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()

    // Check for duplicate mapping first
    const { data: existing } = await supabase
        .from('job_grade_mappings')
        .select('id')
        .eq('org_id', auth.orgId)
        .eq('level_id', input.level_id)
        .eq('salary_band_id', input.salary_band_id)
        .eq('mapped_grade', input.mapped_grade)
        .maybeSingle()

    if (existing) {
        return { success: false, error: 'This grade is already mapped to this level.' }
    }

    const { data, error } = await supabase
        .from('job_grade_mappings')
        .insert({
            org_id: auth.orgId,
            level_id: input.level_id,
            salary_band_id: input.salary_band_id,
            mapped_grade: input.mapped_grade,
            mapped_grade_id: input.mapped_grade_id ?? null,
        })
        .select()
        .single()

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: data as JobGradeMapping }
}

export async function removeGradeMapping(input: {
    level_id: string
    salary_band_id: string
    mapped_grade: string
}): Promise<ActionResult> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
        .from('job_grade_mappings')
        .delete()
        .eq('org_id', auth.orgId)
        .eq('level_id', input.level_id)
        .eq('salary_band_id', input.salary_band_id)
        .eq('mapped_grade', input.mapped_grade)

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: undefined }
}

export async function deleteGradeMapping(id: string): Promise<ActionResult> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
        .from('job_grade_mappings')
        .delete()
        .eq('id', id)
        .eq('org_id', auth.orgId)

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: undefined }
}
