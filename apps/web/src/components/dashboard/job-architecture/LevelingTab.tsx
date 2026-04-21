'use client'

import React, { useState, useTransition, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
    Plus, Trash2, Edit3, CheckCircle2, Loader2, Sparkles, Layers, Star, ChevronDown, ChevronRight,
} from 'lucide-react'
import type { JobArchitectureContext, LevelingStructure, LevelDefinition } from '@/lib/jobArchitecture/types'
import { initializeFromTemplate, deleteLevel, setDefaultStructure, deleteStructure } from './actions'
import LevelStructureModal from './LevelStructureModal'
import LevelEditModal from './LevelEditModal'

// ============================================================
// Onboarding card (no structures yet)
// ============================================================

function OnboardingCard({
    onTemplate,
    onAssistant,
    onManual,
    isPending,
    t,
}: {
    onTemplate: () => void
    onAssistant: () => void
    onManual: () => void
    isPending: boolean
    t: (key: string) => string
}) {
    return (
        <div className="glass-card p-8 text-center">
            <Layers size={40} className="mx-auto mb-4" style={{ color: 'var(--color-pl-brand)' }} />
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                {t('levelingOnboardingTitle')}
            </h2>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                {t('levelingOnboardingDesc')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={onTemplate} disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{ background: 'var(--color-pl-brand)', color: '#fff', opacity: isPending ? 0.6 : 1 }}>
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {t('useStandardTemplate')}
                </button>
                <button onClick={onAssistant}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>
                    <Sparkles size={14} />
                    {t('createWithAssistant')}
                </button>
                <button onClick={onManual}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>
                    <Plus size={14} />
                    {t('createManually')}
                </button>
            </div>
        </div>
    )
}

// ============================================================
// Level grid
// ============================================================

const DIMENSION_KEYS = [
    { field: 'problem_solving', label: 'dimProblemSolving' },
    { field: 'accountability', label: 'dimAccountability' },
    { field: 'people_management', label: 'dimPeopleLeadership' },
    { field: 'knowledge_expertise', label: 'dimKnowledge' },
    { field: 'communication_influence', label: 'dimCommunication' },
    { field: 'autonomy_decision_rights', label: 'dimAutonomy' },
] as const

function DimensionGrid({ level, t }: { level: LevelDefinition; t: (key: string) => string }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
            {DIMENSION_KEYS.map(({ field, label }) => (
                <div key={field}>
                    <span className="text-xs font-semibold block mb-0.5" style={{ color: 'var(--color-pl-text-secondary)' }}>{t(label)}</span>
                    <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {level[field] || t('noDimensionData')}
                    </span>
                </div>
            ))}
        </div>
    )
}

function LevelGrid({
    levels,
    onEdit,
    onDelete,
    isPending,
    t,
}: {
    levels: LevelDefinition[]
    onEdit: (l: LevelDefinition) => void
    onDelete: (id: string) => void
    isPending: boolean
    t: (key: string) => string
}) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const sorted = [...levels].sort((a, b) => {
        const numA = parseInt(a.level_code.replace(/\D/g, ''), 10) || 0
        const numB = parseInt(b.level_code.replace(/\D/g, ''), 10) || 0
        return numA - numB
    })

    const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id)

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                        <th className="w-8" />
                        <th className="text-left py-2 px-3 text-xs font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('colLevelCode')}</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('colTitleExamples')}</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('colDescription')}</th>
                        <th className="w-20" />
                    </tr>
                </thead>
                <tbody>
                    {sorted.map(l => (
                        <React.Fragment key={l.id}>
                            <tr style={{ borderBottom: expandedId === l.id ? 'none' : '1px solid var(--color-pl-border)' }}
                                className="cursor-pointer hover:opacity-90" onClick={() => toggleExpand(l.id)}>
                                <td className="py-2 px-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    {expandedId === l.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </td>
                                <td className="py-2 px-3 font-mono text-xs" style={{ color: 'var(--color-pl-brand-light)' }}>{l.level_code}</td>
                                <td className="py-2 px-3 text-xs" style={{ color: 'var(--color-pl-text-primary)' }}>{l.title_examples ?? '\u2014'}</td>
                                <td className="py-2 px-3 text-xs max-w-xs truncate" style={{ color: 'var(--color-pl-text-secondary)' }}>{l.description ?? '\u2014'}</td>
                                <td className="py-2 px-3 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => onEdit(l)} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        <Edit3 size={13} />
                                    </button>
                                    <button onClick={() => onDelete(l.id)} disabled={isPending} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-pl-red)' }}>
                                        <Trash2 size={13} />
                                    </button>
                                </td>
                            </tr>
                            {expandedId === l.id && (
                                <tr style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                                    <td colSpan={5} style={{ background: 'var(--color-pl-surface-raised)' }}>
                                        <DimensionGrid level={l} t={t} />
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// ============================================================
// Main component
// ============================================================

export default function LevelingTab({
    ctx,
    onUpdate,
}: {
    ctx: JobArchitectureContext
    onUpdate: () => void
}) {
    const t = useTranslations('jobArchitecture')
    const [isPending, startTransition] = useTransition()
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'manual' | 'assistant'>('manual')
    const [editStructure, setEditStructure] = useState<LevelingStructure | null>(null)
    const [editLevel, setEditLevel] = useState<LevelDefinition | null>(null)
    const [activeStructureId, setActiveStructureId] = useState<string | null>(
        ctx.structures.find(s => s.is_default)?.id ?? ctx.structures[0]?.id ?? null
    )

    // Sync activeStructureId when ctx changes (e.g., after template init)
    useEffect(() => {
        const defaultId = ctx.structures.find(s => s.is_default)?.id ?? ctx.structures[0]?.id ?? null
        if (defaultId && !activeStructureId) setActiveStructureId(defaultId)
    }, [ctx.structures, activeStructureId])

    const activeLevels = ctx.levels.filter(l => l.structure_id === activeStructureId)
    const activeStructure = ctx.structures.find(s => s.id === activeStructureId) ?? null

    const handleTemplate = () => {
        startTransition(async () => {
            const res = await initializeFromTemplate()
            if (res.success) onUpdate()
        })
    }

    const handleDeleteLevel = (id: string) => {
        startTransition(async () => {
            const res = await deleteLevel(id)
            if (res.success) onUpdate()
        })
    }

    const handleSetDefault = (id: string) => {
        startTransition(async () => {
            const res = await setDefaultStructure(id)
            if (res.success) onUpdate()
        })
    }

    const handleDeleteStructure = (id: string) => {
        startTransition(async () => {
            const res = await deleteStructure(id)
            if (res.success) onUpdate()
        })
    }

    const openModal = (mode: 'manual' | 'assistant', structure?: LevelingStructure) => {
        setModalMode(mode)
        setEditStructure(structure ?? null)
        setModalOpen(true)
    }

    if (ctx.structures.length === 0) {
        return (
            <>
                <OnboardingCard onTemplate={handleTemplate} onAssistant={() => openModal('assistant')} onManual={() => openModal('manual')} isPending={isPending} t={t} />
                {modalOpen && (
                    <LevelStructureModal mode={modalMode} structure={editStructure} defaultLevels={ctx.defaultLevels}
                        onClose={() => setModalOpen(false)} onSaved={() => { onUpdate(); setModalOpen(false) }} />
                )}
            </>
        )
    }

    return (
        <div className="space-y-4">
            {/* Structure selector + actions */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    {ctx.structures.length > 1 && (
                        <select value={activeStructureId ?? ''} onChange={e => setActiveStructureId(e.target.value)}
                            className="text-sm px-3 py-1.5 rounded-lg"
                            style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>
                            {ctx.structures.map(s => (
                                <option key={s.id} value={s.id}>{s.name}{s.is_default ? ` (${t('default')})` : ''}</option>
                            ))}
                        </select>
                    )}
                    {ctx.structures.length > 1 && activeStructure && !activeStructure.is_default && (
                        <button onClick={() => handleSetDefault(activeStructure.id)} disabled={isPending}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}>
                            <Star size={12} /> {t('setAsDefault')}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => openModal('manual')}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: 'var(--color-pl-brand)', color: '#fff' }}>
                        <Plus size={13} /> {t('addLevel')}
                    </button>
                    <button onClick={() => openModal('assistant')}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>
                        <Sparkles size={13} /> {t('newStructure')}
                    </button>
                </div>
            </div>

            {/* Level grid */}
            <div className="glass-card p-4">
                <LevelGrid levels={activeLevels} onEdit={l => setEditLevel(l)} onDelete={handleDeleteLevel} isPending={isPending} t={t} />
            </div>

            {modalOpen && (
                <LevelStructureModal mode={modalMode} structure={editStructure} defaultLevels={ctx.defaultLevels}
                    onClose={() => setModalOpen(false)} onSaved={() => { onUpdate(); setModalOpen(false) }} />
            )}

            {editLevel && (
                <LevelEditModal level={editLevel}
                    onClose={() => setEditLevel(null)}
                    onSaved={() => { onUpdate(); setEditLevel(null) }} />
            )}
        </div>
    )
}
