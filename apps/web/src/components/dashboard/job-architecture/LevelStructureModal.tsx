'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { X, Plus, Trash2, Loader2, Sparkles } from 'lucide-react'
import type {
    LevelingStructure,
    DefaultLevelDefinition,
    AssistantGeneratedStructure,
} from '@/lib/jobArchitecture/types'
import { createStructure, updateStructure } from './actions'
import { generateLevelingStructure } from './aiActions'

// ============================================================
// Types
// ============================================================

type DraftLevel = {
    level_code: string
    sort_order: number
    title_examples: string
    description: string
}

type Props = {
    mode: 'manual' | 'assistant'
    structure: LevelingStructure | null
    defaultLevels: DefaultLevelDefinition[]
    onClose: () => void
    onSaved: () => void
}

// ============================================================
// Assistant form
// ============================================================

function AssistantForm({
    onGenerated,
    isPending,
    t,
}: {
    onGenerated: (result: AssistantGeneratedStructure) => void
    isPending: boolean
    t: (key: string) => string
}) {
    const [industry, setIndustry] = useState('')
    const [companySize, setCompanySize] = useState('')
    const [existingScheme, setExistingScheme] = useState('')
    const [numLevels, setNumLevels] = useState('')
    const [generating, startGen] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleGenerate = () => {
        setError(null)
        startGen(async () => {
            const res = await generateLevelingStructure({ industry, companySize, existingScheme, levelCount: numLevels, requirements: '' })
            if (res.success) {
                onGenerated(res.data)
            } else {
                setError(res.error)
            }
        })
    }

    const busy = isPending || generating

    return (
        <div className="space-y-3">
            <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('assistantIndustry')}</label>
                <input value={industry} onChange={e => setIndustry(e.target.value)} className="w-full px-3 py-1.5 text-sm rounded-lg"
                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                    placeholder={t('assistantIndustryPlaceholder')} />
            </div>
            <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('assistantCompanySize')}</label>
                <input value={companySize} onChange={e => setCompanySize(e.target.value)} className="w-full px-3 py-1.5 text-sm rounded-lg"
                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                    placeholder={t('assistantCompanySizePlaceholder')} />
            </div>
            <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('assistantExistingScheme')}</label>
                <textarea value={existingScheme} onChange={e => setExistingScheme(e.target.value)} rows={3} className="w-full px-3 py-1.5 text-sm rounded-lg resize-none"
                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}
                    placeholder={t('assistantExistingSchemePlaceholder')} />
            </div>
            <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('assistantNumLevels')}</label>
                <input type="number" min={3} max={20} value={numLevels} onChange={e => setNumLevels(e.target.value)} placeholder="8–12" className="w-24 px-3 py-1.5 text-sm rounded-lg"
                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('assistantNumLevelsHint')}</p>
            </div>
            <button onClick={handleGenerate} disabled={busy || !industry}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: 'var(--color-pl-brand)', color: '#fff', opacity: busy || !industry ? 0.6 : 1 }}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {t('generateWithAssistant')}
            </button>
            {error && (
                <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                    {error}
                </div>
            )}
        </div>
    )
}

// ============================================================
// Main modal
// ============================================================

export default function LevelStructureModal({ mode, structure, defaultLevels, onClose, onSaved }: Props) {
    const t = useTranslations('jobArchitecture')
    const [isPending, startTransition] = useTransition()
    const [name, setName] = useState(structure?.name ?? '')
    const [description, setDescription] = useState(structure?.description ?? '')
    const [showAssistant, setShowAssistant] = useState(mode === 'assistant')
    const [draftLevels, setDraftLevels] = useState<DraftLevel[]>(
        structure ? [] : [{ level_code: '', sort_order: 1, title_examples: '', description: '' }]
    )

    const handleAssistantResult = (result: AssistantGeneratedStructure) => {
        // Save the full structure with all dimensions directly
        startTransition(async () => {
            const { saveLevelingStructureFromAssistant } = await import('@/app/(dashboard)/dashboard/job-architecture/actions')
            const res = await saveLevelingStructureFromAssistant(result)
            if (res.success) onSaved()
        })
    }

    const addLevel = () => {
        setDraftLevels(prev => [...prev, { level_code: '', sort_order: prev.length + 1, title_examples: '', description: '' }])
    }

    const removeLevel = (idx: number) => {
        setDraftLevels(prev => prev.filter((_, i) => i !== idx))
    }

    const updateLevel = (idx: number, field: keyof DraftLevel, value: string | number) => {
        setDraftLevels(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
    }

    const handleSave = () => {
        startTransition(async () => {
            const payload = { name, description, levels: draftLevels }
            const res = structure
                ? await updateStructure(structure.id, payload)
                : await createStructure(payload)
            if (res.success) onSaved()
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl p-6"
                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {structure ? t('editStructure') : t('createStructure')}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        <X size={18} />
                    </button>
                </div>

                {showAssistant ? (
                    <AssistantForm onGenerated={handleAssistantResult} isPending={isPending} t={t} />
                ) : (
                    <div className="space-y-4">
                        {/* Name / Desc */}
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('structureName')}</label>
                            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-1.5 text-sm rounded-lg"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                        </div>
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('structureDescription')}</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-1.5 text-sm rounded-lg resize-none"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                        </div>

                        {/* Levels */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('levels')}</span>
                                <button onClick={addLevel} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                                    style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>
                                    <Plus size={12} /> {t('addLevel')}
                                </button>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {draftLevels.map((lv, i) => (
                                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                                        <input value={lv.level_code} onChange={e => updateLevel(i, 'level_code', e.target.value)} placeholder={t('levelCodePlaceholder')}
                                            className="w-16 px-2 py-1 text-xs rounded" style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                                        <input value={lv.title_examples} onChange={e => updateLevel(i, 'title_examples', e.target.value)} placeholder={t('titleExamplesPlaceholder')}
                                            className="flex-1 px-2 py-1 text-xs rounded" style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                                        <button onClick={() => removeLevel(i)} className="p-1 mt-0.5" style={{ color: 'var(--color-pl-red)' }}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>
                                {t('cancel')}
                            </button>
                            <button onClick={handleSave} disabled={isPending || !name}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg"
                                style={{ background: 'var(--color-pl-brand)', color: '#fff', opacity: isPending || !name ? 0.6 : 1 }}>
                                {isPending && <Loader2 size={14} className="animate-spin" />}
                                {t('save')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
