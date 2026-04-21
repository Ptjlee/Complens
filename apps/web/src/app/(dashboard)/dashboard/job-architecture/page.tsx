import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getJobArchitectureContext, canUseJobArchitecture } from '@/lib/jobArchitecture/getJobArchitectureContext'
import JobArchitectureClient from './JobArchitectureClient'

export async function generateMetadata() {
    const t = await getTranslations('jobArchitecture')
    return {
        title:       t('pageMetaTitle'),
        description: t('pageMetaDescription'),
    }
}

export default async function JobArchitecturePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: member } = await supabase
        .from('organisation_members')
        .select('role')
        .eq('user_id', user.id)
        .single()

    if (!member || (member.role !== 'admin' && member.role !== 'analyst')) {
        redirect('/dashboard')
    }

    const hasAccess = await canUseJobArchitecture()
    if (!hasAccess) redirect('/dashboard')

    const ctx = await getJobArchitectureContext()
    const t = await getTranslations('jobArchitecture')

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* -- Page header ---------------------------------------- */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('pageTitle')}
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('pageSubtitle')}
                </p>
            </div>

            <JobArchitectureClient initialContext={ctx} />
        </div>
    )
}
