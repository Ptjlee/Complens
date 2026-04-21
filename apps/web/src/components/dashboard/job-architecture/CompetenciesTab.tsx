'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Edit3, Trash2, Loader2, Star } from 'lucide-react'
import type { JobArchitectureContext, Competency, CompetencyCategory } from '@/lib/jobArchitecture/types'
import { initializeDefaultCompetencies, deleteCompetency } from './actions'
import CompetencyModal from './CompetencyModal'

// ============================================================
// Category badge
// ============================================================

const CATEGORY_STYLES: Record<CompetencyCategory, { bg: string; color: string }> = {
    core:       { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6' },
    leadership: { bg: 'rgba(139,92,246,0.1)',  color: '#8b5cf6' },
    technical:  { bg: 'rgba(34,197,94,0.1)',   color: '#22c55e' },
    functional: { bg: 'rgba(249,115,22,0.1)',  color: '#f97316' },
}

function CategoryBadge({ category, t }: { category: CompetencyCategory; t: (k: string, values?: Record<string, string | number | Date>) => string }) {
    const style = CATEGORY_STYLES[category]
    return (
        <span className="px-2 py-0.5 text-xs rounded-full font-medium" style={{ background: style.bg, color: style.color }}>
            {t(`category_${category}`)}
        </span>
    )
}

// ============================================================
// Competency card
// ============================================================

function CompetencyCard({ comp, onEdit, onDelete, t }: {
    comp: Competency; onEdit: () => void; onDelete: () => void; t: (k: string, values?: Record<string, string | number | Date>) => string
}) {
    return (
        <div className="p-3 rounded-lg" style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--color-pl-text-primary)' }}>{comp.name}</span>
                    <CategoryBadge category={comp.category} t={t} />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={onEdit} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-pl-text-tertiary)' }}><Edit3 size={13} /></button>
                    <button onClick={onDelete} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-pl-red)' }}><Trash2 size={13} /></button>
                </div>
            </div>
            {comp.description && (
                <p className="text-xs line-clamp-2" style={{ color: 'var(--color-pl-text-secondary)' }}>{comp.description}</p>
            )}
            {comp.levels.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                    <Star size={11} style={{ color: 'var(--color-pl-brand)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('levelCount', { count: comp.levels.length })}
                    </span>
                </div>
            )}
        </div>
    )
}

// ============================================================
// Main component
// ============================================================

type FilterTab = 'all' | CompetencyCategory

export default function CompetenciesTab({ ctx, onUpdate }: { ctx: JobArchitectureContext; onUpdate: () => void }) {
    const t = useTranslations('jobArchitecture')
    const [isPending, startTransition] = useTransition()
    const [filter, setFilter] = useState<FilterTab>('all')
    const [modalOpen, setModalOpen] = useState(false)
    const [editComp, setEditComp] = useState<Competency | null>(null)

    const FILTERS: { key: FilterTab; label: string }[] = [
        { key: 'all',        label: t('filterAll') },
        { key: 'core',       label: t('category_core') },
        { key: 'leadership', label: t('category_leadership') },
        { key: 'technical',  label: t('category_technical') },
        { key: 'functional', label: t('category_functional') },
    ]

    const filtered = filter === 'all' ? ctx.competencies : ctx.competencies.filter(c => c.category === filter)

    const handleInit = () => {
        startTransition(async () => {
            const res = await initializeDefaultCompetencies()
            if (res.success) onUpdate()
        })
    }

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const res = await deleteCompetency(id)
            if (res.success) onUpdate()
        })
    }

    if (ctx.competencies.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <Star size={40} className="mx-auto mb-4" style={{ color: 'var(--color-pl-brand)' }} />
                <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>{t('competenciesOnboardingTitle')}</h2>
                <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('competenciesOnboardingDesc')}</p>
                <button onClick={handleInit} disabled={isPending}
                    className="flex items-center gap-2 mx-auto px-4 py-2.5 rounded-lg text-sm font-medium"
                    style={{ background: 'var(--color-pl-brand)', color: '#fff', opacity: isPending ? 0.6 : 1 }}>
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {t('initDefaults')}
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filter tabs + add button */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-1">
                    {FILTERS.map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                            style={{
                                background: filter === f.key ? 'var(--color-pl-brand)' : 'var(--color-pl-surface-raised)',
                                color: filter === f.key ? '#fff' : 'var(--color-pl-text-tertiary)',
                                border: '1px solid var(--color-pl-border)',
                            }}>
                            {f.label}
                        </button>
                    ))}
                </div>
                <button onClick={() => { setEditComp(null); setModalOpen(true) }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--color-pl-brand)', color: '#fff' }}>
                    <Plus size={13} /> {t('addCompetency')}
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map(c => (
                    <CompetencyCard key={c.id} comp={c}
                        onEdit={() => { setEditComp(c); setModalOpen(true) }}
                        onDelete={() => handleDelete(c.id)} t={t} />
                ))}
            </div>

            {modalOpen && (
                <CompetencyModal competency={editComp} onClose={() => setModalOpen(false)}
                    onSaved={() => { onUpdate(); setModalOpen(false) }} />
            )}
        </div>
    )
}
