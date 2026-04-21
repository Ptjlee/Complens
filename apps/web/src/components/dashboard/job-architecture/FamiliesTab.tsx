'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Edit3, Trash2, Loader2, FolderTree } from 'lucide-react'
import type { JobArchitectureContext, JobFamily } from '@/lib/jobArchitecture/types'
import { initializeDefaultFamilies, deleteFamily } from './actions'
import JobFamilyModal from './JobFamilyModal'
import JobsPanel from './JobsPanel'

// ============================================================
// Onboarding card
// ============================================================

function FamilyOnboarding({ onInit, isPending, t }: { onInit: () => void; isPending: boolean; t: (k: string, values?: Record<string, string | number | Date>) => string }) {
    return (
        <div className="glass-card p-8 text-center">
            <FolderTree size={40} className="mx-auto mb-4" style={{ color: 'var(--color-pl-brand)' }} />
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>{t('familiesOnboardingTitle')}</h2>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('familiesOnboardingDesc')}</p>
            <button onClick={onInit} disabled={isPending}
                className="flex items-center gap-2 mx-auto px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'var(--color-pl-brand)', color: '#fff', opacity: isPending ? 0.6 : 1 }}>
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {t('initDefaultFamilies')}
            </button>
        </div>
    )
}

// ============================================================
// Family card
// ============================================================

function FamilyCard({
    family, isSelected, onClick, onEdit, onDelete, jobCount, t,
}: {
    family: JobFamily; isSelected: boolean; onClick: () => void
    onEdit: () => void; onDelete: () => void; jobCount: number; t: (k: string, values?: Record<string, string | number | Date>) => string
}) {
    return (
        <div onClick={onClick}
            className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all"
            style={{
                background: isSelected ? 'var(--color-pl-surface-raised)' : 'transparent',
                border: isSelected ? '1px solid var(--color-pl-brand)' : '1px solid var(--color-pl-border)',
            }}>
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: family.color }} />
                <div className="min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--color-pl-text-primary)' }}>{family.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('jobCount', { count: jobCount })}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={e => { e.stopPropagation(); onEdit() }} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    <Edit3 size={13} />
                </button>
                <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-pl-red)' }}>
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    )
}

// ============================================================
// Main component
// ============================================================

export default function FamiliesTab({ ctx, onUpdate }: { ctx: JobArchitectureContext; onUpdate: () => void }) {
    const t = useTranslations('jobArchitecture')
    const [isPending, startTransition] = useTransition()
    const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(ctx.jobFamilies[0]?.id ?? null)
    const [modalOpen, setModalOpen] = useState(false)
    const [editFamily, setEditFamily] = useState<JobFamily | null>(null)

    const handleInit = () => {
        startTransition(async () => {
            const res = await initializeDefaultFamilies()
            if (res.success) onUpdate()
        })
    }

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const res = await deleteFamily(id)
            if (res.success) {
                onUpdate()
                if (selectedFamilyId === id) setSelectedFamilyId(ctx.jobFamilies.find(f => f.id !== id)?.id ?? null)
            }
        })
    }

    const openEdit = (f: JobFamily) => { setEditFamily(f); setModalOpen(true) }
    const openCreate = () => { setEditFamily(null); setModalOpen(true) }

    if (ctx.jobFamilies.length === 0) {
        return <FamilyOnboarding onInit={handleInit} isPending={isPending} t={t} />
    }

    const selectedFamily = ctx.jobFamilies.find(f => f.id === selectedFamilyId) ?? null
    const familyJobs = ctx.jobs.filter(j => j.family_id === selectedFamilyId)

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left panel: families */}
            <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('jobFamilies')}</span>
                    <button onClick={openCreate} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'var(--color-pl-brand)', color: '#fff' }}>
                        <Plus size={12} /> {t('add')}
                    </button>
                </div>
                {ctx.jobFamilies.map(f => (
                    <FamilyCard key={f.id} family={f} isSelected={f.id === selectedFamilyId}
                        onClick={() => setSelectedFamilyId(f.id)}
                        onEdit={() => openEdit(f)} onDelete={() => handleDelete(f.id)}
                        jobCount={ctx.jobs.filter(j => j.family_id === f.id).length} t={t} />
                ))}
            </div>

            {/* Right panel: jobs */}
            <div className="md:col-span-2">
                {selectedFamily ? (
                    <JobsPanel family={selectedFamily} jobs={familyJobs} ctx={ctx} onUpdate={onUpdate} />
                ) : (
                    <div className="glass-card p-8 text-center">
                        <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('selectFamilyPrompt')}</p>
                    </div>
                )}
            </div>

            {modalOpen && (
                <JobFamilyModal family={editFamily} onClose={() => setModalOpen(false)}
                    onSaved={() => { onUpdate(); setModalOpen(false) }} />
            )}
        </div>
    )
}
