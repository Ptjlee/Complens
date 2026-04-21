'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { X, Plus, Trash2, Loader2, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import type { Competency, CompetencyCategory, CompetencyLevel } from '@/lib/jobArchitecture/types'
import { createCompetency, updateCompetency } from './actions'
import { generateCompetencyDescription, generateBehaviours } from './aiActions'

// ============================================================
// Level editor
// ============================================================

function LevelEditor({ level, onChange, onRemove, onGenerateBehaviours, genPending, t }: {
    level: CompetencyLevel; onChange: (l: CompetencyLevel) => void; onRemove: () => void
    onGenerateBehaviours: () => void; genPending: boolean; t: (k: string, values?: Record<string, string | number | Date>) => string
}) {
    const [expanded, setExpanded] = useState(false)

    const updateBehaviour = (i: number, v: string) => {
        const updated = [...(level.behaviours ?? [])]
        updated[i] = v
        onChange({ ...level, behaviours: updated })
    }
    const addBehaviour = () => onChange({ ...level, behaviours: [...(level.behaviours ?? []), ''] })
    const removeBehaviour = (i: number) => onChange({ ...level, behaviours: (level.behaviours ?? []).filter((_, idx) => idx !== i) })

    return (
        <div className="rounded-lg p-3" style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
            <div className="flex items-center justify-between">
                <button onClick={() => setExpanded(e => !e)} className="flex items-center gap-2">
                    {expanded ? <ChevronDown size={13} style={{ color: 'var(--color-pl-text-tertiary)' }} />
                        : <ChevronRight size={13} style={{ color: 'var(--color-pl-text-tertiary)' }} />}
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('levelLabel', { level: level.level })} — {level.name || t('unnamed')}
                    </span>
                </button>
                <button onClick={onRemove} className="p-0.5" style={{ color: 'var(--color-pl-red)' }}><Trash2 size={12} /></button>
            </div>

            {expanded && (
                <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('levelName')}</label>
                            <input value={level.name} onChange={e => onChange({ ...level, name: e.target.value })}
                                className="w-full px-2 py-1 text-xs rounded"
                                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                        </div>
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('levelDescription')}</label>
                            <input value={level.description} onChange={e => onChange({ ...level, description: e.target.value })}
                                className="w-full px-2 py-1 text-xs rounded"
                                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                        </div>
                    </div>

                    {/* Behaviours */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('behaviours')}</label>
                            <button onClick={onGenerateBehaviours} disabled={genPending}
                                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)', opacity: genPending ? 0.6 : 1 }}>
                                {genPending ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                {t('generateBehaviours')}
                            </button>
                        </div>
                        {(level.behaviours ?? []).map((b, i) => (
                            <div key={i} className="flex items-center gap-1 mb-1">
                                <input value={b} onChange={e => updateBehaviour(i, e.target.value)}
                                    className="flex-1 px-2 py-0.5 text-xs rounded"
                                    style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                                <button onClick={() => removeBehaviour(i)} className="p-0.5" style={{ color: 'var(--color-pl-red)' }}><Trash2 size={10} /></button>
                            </div>
                        ))}
                        <button onClick={addBehaviour} className="flex items-center gap-1 text-xs mt-1" style={{ color: 'var(--color-pl-brand-light)' }}>
                            <Plus size={10} /> {t('addBehaviour')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================================
// Main modal
// ============================================================

const CATEGORIES: CompetencyCategory[] = ['core', 'leadership', 'technical', 'functional']

export default function CompetencyModal({ competency, onClose, onSaved }: {
    competency: Competency | null; onClose: () => void; onSaved: () => void
}) {
    const t = useTranslations('jobArchitecture')
    const [isPending, startTransition] = useTransition()
    const [name, setName] = useState(competency?.name ?? '')
    const [category, setCategory] = useState<CompetencyCategory>(competency?.category ?? 'core')
    const [description, setDescription] = useState(competency?.description ?? '')
    const [levels, setLevels] = useState<CompetencyLevel[]>(competency?.levels ?? [])
    const [descPending, startDescGen] = useTransition()
    const [behPending, startBehGen] = useTransition()

    const handleGenerateDesc = () => {
        startDescGen(async () => {
            const res = await generateCompetencyDescription({ name, category })
            if (res.success) setDescription(res.data)
        })
    }

    const handleGenerateBehaviours = (levelIdx: number) => {
        const lv = levels[levelIdx]
        startBehGen(async () => {
            const res = await generateBehaviours({ name, category, level: lv.level })
            if (res.success) {
                setLevels(prev => prev.map((l, i) => i === levelIdx ? { ...l, behaviours: res.data } : l))
            }
        })
    }

    const addLevel = () => {
        const next = levels.length + 1
        setLevels(prev => [...prev, { level: next, name: '', description: '', behaviours: [] }])
    }

    const removeLevel = (i: number) => setLevels(prev => prev.filter((_, idx) => idx !== i))
    const updateLevel = (i: number, lv: CompetencyLevel) => setLevels(prev => prev.map((l, idx) => idx === i ? lv : l))

    const handleSave = () => {
        startTransition(async () => {
            const payload = { name, category, description, levels }
            const res = competency ? await updateCompetency(competency.id, payload) : await createCompetency(payload)
            if (res.success) onSaved()
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl p-6"
                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {competency ? t('editCompetency') : t('createCompetency')}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-pl-text-tertiary)' }}><X size={18} /></button>
                </div>

                <div className="space-y-4">
                    {/* Name + Category */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('competencyName')}</label>
                            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-1.5 text-sm rounded-lg"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                        </div>
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('competencyCategory')}</label>
                            <select value={category} onChange={e => setCategory(e.target.value as CompetencyCategory)} className="w-full px-3 py-1.5 text-sm rounded-lg"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{t(`category_${c}`)}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('description')}</label>
                            <button onClick={handleGenerateDesc} disabled={descPending || !name}
                                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)', opacity: descPending || !name ? 0.6 : 1 }}>
                                {descPending ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} {t('generateWithAssistant')}
                            </button>
                        </div>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-1.5 text-sm rounded-lg resize-none"
                            style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                    </div>

                    {/* Levels */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('competencyLevels')}</span>
                            <button onClick={addLevel} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>
                                <Plus size={12} /> {t('addLevel')}
                            </button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {levels.map((lv, i) => (
                                <LevelEditor key={i} level={lv} onChange={l => updateLevel(i, l)} onRemove={() => removeLevel(i)}
                                    onGenerateBehaviours={() => handleGenerateBehaviours(i)} genPending={behPending} t={t} />
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg"
                            style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>{t('cancel')}</button>
                        <button onClick={handleSave} disabled={isPending || !name}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg"
                            style={{ background: 'var(--color-pl-brand)', color: '#fff', opacity: isPending || !name ? 0.6 : 1 }}>
                            {isPending && <Loader2 size={14} className="animate-spin" />} {t('save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
