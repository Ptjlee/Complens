'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient }   from '@/lib/supabase/server'
import { requireAdminRoleAction } from '@/lib/api/planGuard'
import type {
    ActionResult,
    CompetencyImportance,
    JobFamily,
    Job,
} from '@/lib/jobArchitecture/types'

const JA_PATH = '/dashboard/job-architecture'

// ============================================================
// Job Families — CRUD
// ============================================================

export async function createJobFamily(input: {
    name: string
    description?: string
    color?: string
    icon?: string
}): Promise<ActionResult<JobFamily>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()

    // Determine next sort_order
    const { count } = await supabase
        .from('job_families')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', auth.orgId)

    const { data, error } = await supabase
        .from('job_families')
        .insert({
            org_id: auth.orgId,
            name: input.name,
            description: input.description ?? null,
            color: input.color ?? '#6366f1',
            icon: input.icon ?? 'briefcase',
            sort_order: count ?? 0,
        })
        .select()
        .single()

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: data as JobFamily }
}

export async function updateJobFamily(
    id: string,
    input: Partial<{ name: string; description: string; color: string; icon: string; sort_order: number }>,
): Promise<ActionResult<JobFamily>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('job_families')
        .update(input)
        .eq('id', id)
        .eq('org_id', auth.orgId)
        .select()
        .single()

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: data as JobFamily }
}

export async function deleteJobFamily(id: string): Promise<ActionResult> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
        .from('job_families')
        .delete()
        .eq('id', id)
        .eq('org_id', auth.orgId)

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: undefined }
}

/** Seed 12 standard job families (locale-aware). */
export async function initializeDefaultFamilies(): Promise<ActionResult> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()

    // Detect locale for content language
    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'de'

    const familiesEn = [
        { name: 'Finance & Accounting',      color: '#10b981', icon: 'banknote',       description: 'Financial planning, controlling, accounting, treasury, tax, and audit' },
        { name: 'Human Resources',            color: '#f59e0b', icon: 'users',          description: 'HR business partnering, talent acquisition, compensation & benefits, learning & development' },
        { name: 'Information Technology',     color: '#3b82f6', icon: 'server',         description: 'IT infrastructure, software development, data engineering, cybersecurity, and digital transformation' },
        { name: 'Sales & Business Development', color: '#ef4444', icon: 'handshake',    description: 'Direct and indirect sales, key account management, business development, and revenue growth' },
        { name: 'Marketing & Communications', color: '#8b5cf6', icon: 'megaphone',     description: 'Brand management, product marketing, corporate communications, and digital marketing' },
        { name: 'Operations & Production',    color: '#6366f1', icon: 'factory',        description: 'Manufacturing, production planning, facility management, and operational excellence' },
        { name: 'Supply Chain & Logistics',   color: '#0891b2', icon: 'truck',          description: 'Procurement, warehousing, distribution, logistics, and supply chain planning' },
        { name: 'Research & Development',     color: '#7c3aed', icon: 'flask-conical',  description: 'Product development, R&D, innovation, engineering design, and scientific research' },
        { name: 'Legal & Compliance',         color: '#64748b', icon: 'scale',          description: 'Legal counsel, contracts, regulatory compliance, data protection, and risk management' },
        { name: 'Customer Service & Support', color: '#f97316', icon: 'headset',        description: 'Customer care, technical support, service desk, and client success' },
        { name: 'Quality & Regulatory Affairs', color: '#059669', icon: 'shield-check', description: 'Quality management, HSE, regulatory affairs, and standards compliance' },
        { name: 'Administration & Corporate Services', color: '#0ea5e9', icon: 'building-2', description: 'General administration, office management, corporate strategy, and shared services' },
    ]

    const familiesDe = [
        { name: 'Finanzen & Rechnungswesen',   color: '#10b981', icon: 'banknote',       description: 'Finanzplanung, Controlling, Buchhaltung, Treasury, Steuern und Revision' },
        { name: 'Personalwesen',               color: '#f59e0b', icon: 'users',          description: 'HR Business Partnering, Recruiting, Vergütung & Zusatzleistungen, Personalentwicklung' },
        { name: 'Informationstechnologie',     color: '#3b82f6', icon: 'server',         description: 'IT-Infrastruktur, Softwareentwicklung, Data Engineering, Cybersicherheit und Digitalisierung' },
        { name: 'Vertrieb',                    color: '#ef4444', icon: 'handshake',      description: 'Direkt- und Partnervertrieb, Key Account Management, Geschäftsentwicklung und Umsatzwachstum' },
        { name: 'Marketing & Kommunikation',   color: '#8b5cf6', icon: 'megaphone',      description: 'Markenführung, Produktmarketing, Unternehmenskommunikation und digitales Marketing' },
        { name: 'Betrieb & Produktion',        color: '#6366f1', icon: 'factory',        description: 'Fertigung, Produktionsplanung, Gebäudemanagement und operative Exzellenz' },
        { name: 'Einkauf & Logistik',          color: '#0891b2', icon: 'truck',          description: 'Beschaffung, Lagerwirtschaft, Distribution, Logistik und Supply-Chain-Planung' },
        { name: 'Forschung & Entwicklung',     color: '#7c3aed', icon: 'flask-conical',  description: 'Produktentwicklung, F&E, Innovation, Konstruktion und wissenschaftliche Forschung' },
        { name: 'Recht & Compliance',          color: '#64748b', icon: 'scale',          description: 'Rechtsberatung, Vertragswesen, regulatorische Compliance, Datenschutz und Risikomanagement' },
        { name: 'Kundenservice',               color: '#f97316', icon: 'headset',        description: 'Kundenbetreuung, technischer Support, Service Desk und Client Success' },
        { name: 'Qualität & Regulierung',      color: '#059669', icon: 'shield-check',   description: 'Qualitätsmanagement, Arbeitssicherheit, Regulatory Affairs und Normenkonformität' },
        { name: 'Verwaltung & Zentralbereiche', color: '#0ea5e9', icon: 'building-2',    description: 'Allgemeine Verwaltung, Office Management, Unternehmensstrategie und Shared Services' },
    ]

    const families = locale === 'de' ? familiesDe : familiesEn

    const rows = families.map((f, i) => ({
        org_id: auth.orgId,
        name: f.name,
        description: f.description,
        color: f.color,
        icon: f.icon,
        sort_order: i,
    }))

    const { error } = await supabase.from('job_families').insert(rows)
    if (error) return { success: false, error: error.message }

    revalidatePath(JA_PATH)
    return { success: true, data: undefined }
}

// ============================================================
// Jobs — CRUD
// ============================================================

export async function createJob(input: {
    family_id: string
    title: string
    level_id?: string
    salary_band_grade_id?: string
    jd_summary?: string
    jd_responsibilities?: string[]
    jd_qualifications?: string[]
    competencies?: { competency_id: string; required_level: number; importance: CompetencyImportance }[]
}): Promise<ActionResult<Job>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()

    const { data: job, error } = await supabase
        .from('jobs')
        .insert({
            org_id: auth.orgId,
            family_id: input.family_id,
            title: input.title,
            level_id: input.level_id ?? null,
            salary_band_grade_id: input.salary_band_grade_id ?? null,
            jd_summary: input.jd_summary ?? null,
            jd_responsibilities: input.jd_responsibilities ?? null,
            jd_qualifications: input.jd_qualifications ?? null,
        })
        .select()
        .single()

    if (error || !job) return { success: false, error: error?.message ?? 'Failed to create job.' }

    // Link competencies
    if (input.competencies && input.competencies.length > 0) {
        const links = input.competencies.map(c => ({
            org_id: auth.orgId,
            job_id: job.id,
            competency_id: c.competency_id,
            required_level: c.required_level,
            importance: c.importance,
        }))
        await supabase.from('job_competencies').insert(links)
    }

    revalidatePath(JA_PATH)
    return { success: true, data: job as Job }
}

export async function updateJob(
    id: string,
    input: Partial<{
        family_id: string
        title: string
        level_id: string | null
        salary_band_grade_id: string | null
        is_active: boolean
        headcount: number
        jd_summary: string | null
        jd_responsibilities: string[] | null
        jd_qualifications: string[] | null
    }> & {
        competencies?: { competency_id: string; required_level: number; importance: CompetencyImportance }[]
    },
): Promise<ActionResult<Job>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()

    // Separate competencies from job fields
    const { competencies, ...jobFields } = input

    if (Object.keys(jobFields).length > 0) {
        const { error } = await supabase
            .from('jobs')
            .update(jobFields)
            .eq('id', id)
            .eq('org_id', auth.orgId)

        if (error) return { success: false, error: error.message }
    }

    // Replace competency links if provided
    if (competencies !== undefined) {
        await supabase
            .from('job_competencies')
            .delete()
            .eq('job_id', id)
            .eq('org_id', auth.orgId)

        if (competencies.length > 0) {
            const links = competencies.map(c => ({
                org_id: auth.orgId,
                job_id: id,
                competency_id: c.competency_id,
                required_level: c.required_level,
                importance: c.importance,
            }))
            await supabase.from('job_competencies').insert(links)
        }
    }

    // Fetch updated job with joins
    const { data: updated, error: fetchErr } = await supabase
        .from('jobs')
        .select(`
            *,
            job_family:job_families(*),
            level_definition:level_definitions(*),
            salary_band_grade:salary_band_grades(id, job_grade, min_salary, max_salary, mid_salary)
        `)
        .eq('id', id)
        .single()

    if (fetchErr) return { success: false, error: fetchErr.message }

    revalidatePath(JA_PATH)
    return { success: true, data: updated as Job }
}

export async function deleteJob(id: string): Promise<ActionResult> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()

    // Delete competency links first
    await supabase.from('job_competencies').delete().eq('job_id', id).eq('org_id', auth.orgId)

    const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id)
        .eq('org_id', auth.orgId)

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: undefined }
}

export async function updateJobDescription(
    jobId: string,
    jd: {
        jd_summary: string
        jd_responsibilities: string[]
        jd_qualifications: string[]
    },
): Promise<ActionResult> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
        .from('jobs')
        .update({
            jd_summary: jd.jd_summary,
            jd_responsibilities: jd.jd_responsibilities,
            jd_qualifications: jd.jd_qualifications,
            jd_generated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('org_id', auth.orgId)

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: undefined }
}
