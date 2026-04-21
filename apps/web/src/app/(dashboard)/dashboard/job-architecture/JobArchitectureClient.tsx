'use client'

import { useState, useCallback, lazy, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import {
    Layers, FolderTree, Star, GitBranch, Upload, Settings, Users,
    Loader2, Lightbulb,
} from 'lucide-react'
import type { JobArchitectureContext } from '@/lib/jobArchitecture/types'
import { getJobArchitectureContext } from '@/lib/jobArchitecture/getJobArchitectureContext'

// ============================================================
// Lazy-loaded tab components
// ============================================================

const LevelingTab      = lazy(() => import('@/components/dashboard/job-architecture/LevelingTab'))
const FamiliesTab      = lazy(() => import('@/components/dashboard/job-architecture/FamiliesTab'))
const CompetenciesTab  = lazy(() => import('@/components/dashboard/job-architecture/CompetenciesTab'))
const GradeMappingTab  = lazy(() => import('@/components/dashboard/job-architecture/GradeMappingTab'))
const JdUploadTab      = lazy(() => import('@/components/dashboard/job-architecture/JdUploadTab'))
const HeadcountTab     = lazy(() => import('@/components/dashboard/job-architecture/HeadcountTab'))
const SettingsTab      = lazy(() => import('@/components/dashboard/job-architecture/SettingsTab'))

// ============================================================
// Tab types
// ============================================================

type Tab = 'leveling' | 'families' | 'competencies' | 'gradeMapping' | 'jdUpload' | 'headcount' | 'settings'

function TabSpinner() {
    return (
        <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-pl-brand)' }} />
        </div>
    )
}

// ============================================================
// Main client component
// ============================================================

export default function JobArchitectureClient({
    initialContext,
}: {
    initialContext: JobArchitectureContext
}) {
    const t = useTranslations('jobArchitecture')
    const hasStructures = initialContext.structures.length > 0
    const [tab, setTab] = useState<Tab>(hasStructures ? 'families' : 'leveling')
    const [ctx, setCtx] = useState(initialContext)

    const refreshCtx = useCallback(async () => {
        const fresh = await getJobArchitectureContext()
        setCtx(fresh)
    }, [])

    const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'leveling',      label: t('tabLeveling'),      icon: <Layers size={14} /> },
        { key: 'families',      label: t('tabFamilies'),      icon: <FolderTree size={14} /> },
        { key: 'competencies',  label: t('tabCompetencies'),  icon: <Star size={14} /> },
        { key: 'gradeMapping',  label: t('tabGradeMapping'),  icon: <GitBranch size={14} /> },
        { key: 'jdUpload',      label: t('tabJdUpload'),      icon: <Upload size={14} /> },
        { key: 'headcount',     label: t('tabHeadcount'),     icon: <Users size={14} /> },
        { key: 'settings',      label: t('tabSettings'),      icon: <Settings size={14} /> },
    ]

    return (
        <>
            {/* -- Onboarding card (greenfield) ---------------------- */}
            {!ctx.hasData && (
                <div className="glass-card p-6 mb-6">
                    <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('onboardingTitle')}
                    </h2>
                    <p className="text-sm mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('onboardingDesc')}
                    </p>

                    <ol className="list-none space-y-2 mb-4 pl-0">
                        {[1, 2, 3, 4].map(step => (
                            <li key={step} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                <span
                                    className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                                    style={{ background: 'var(--color-pl-brand)', color: '#fff' }}
                                >
                                    {step}
                                </span>
                                {t(`onboardingStep${step}`)}
                            </li>
                        ))}
                    </ol>

                    <div className="flex items-start gap-2 text-xs rounded-lg px-3 py-2"
                        style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-text-tertiary)' }}
                    >
                        <Lightbulb size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-pl-brand)' }} />
                        {t('onboardingTip')}
                    </div>
                </div>
            )}

            {/* -- Tab navigation ------------------------------------ */}
            <div className="flex border-b mb-4 overflow-x-auto" style={{ borderColor: 'var(--color-pl-border)', scrollbarWidth: 'none' }}>
                {TABS.map(tb => (
                    <button key={tb.key} onClick={() => setTab(tb.key)}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap"
                        style={{
                            borderColor: tab === tb.key ? 'var(--color-pl-brand)' : 'transparent',
                            color:       tab === tb.key ? 'var(--color-pl-brand-light)' : 'var(--color-pl-text-tertiary)',
                        }}>
                        {tb.icon}
                        {tb.label}
                    </button>
                ))}
            </div>

            {/* -- Tab content --------------------------------------- */}
            <Suspense fallback={<TabSpinner />}>
                {tab === 'leveling'      && <LevelingTab ctx={ctx} onUpdate={refreshCtx} />}
                {tab === 'families'      && <FamiliesTab ctx={ctx} onUpdate={refreshCtx} />}
                {tab === 'competencies'  && <CompetenciesTab ctx={ctx} onUpdate={refreshCtx} />}
                {tab === 'gradeMapping'  && <GradeMappingTab ctx={ctx} onUpdate={refreshCtx} />}
                {tab === 'jdUpload'      && <JdUploadTab ctx={ctx} onUpdate={refreshCtx} />}
                {tab === 'headcount'     && <HeadcountTab ctx={ctx} onUpdate={refreshCtx} />}
                {tab === 'settings'      && <SettingsTab ctx={ctx} onUpdate={refreshCtx} />}
            </Suspense>
        </>
    )
}
