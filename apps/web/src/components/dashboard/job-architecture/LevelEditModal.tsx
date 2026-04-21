'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { X, Loader2 } from 'lucide-react'
import type { LevelDefinition } from '@/lib/jobArchitecture/types'
import { updateLevel } from './actions'

type Props = {
    level: LevelDefinition
    onClose: () => void
    onSaved: () => void
}

const DIMENSION_KEYS = [
    { field: 'problem_solving', label: 'dimProblemSolving' },
    { field: 'accountability', label: 'dimAccountability' },
    { field: 'people_management', label: 'dimPeopleLeadership' },
    { field: 'knowledge_expertise', label: 'dimKnowledge' },
    { field: 'communication_influence', label: 'dimCommunication' },
    { field: 'autonomy_decision_rights', label: 'dimAutonomy' },
] as const

type DimensionField = typeof DIMENSION_KEYS[number]['field']

export default function LevelEditModal({ level, onClose, onSaved }: Props) {
    const t = useTranslations('jobArchitecture')
    const [isPending, startTransition] = useTransition()

    const [levelCode, setLevelCode] = useState(level.level_code)
    const [titleExamples, setTitleExamples] = useState(level.title_examples ?? '')
    const [description, setDescription] = useState(level.description ?? '')
    const [dims, setDims] = useState<Record<DimensionField, string>>({
        problem_solving: level.problem_solving ?? '',
        accountability: level.accountability ?? '',
        people_management: level.people_management ?? '',
        knowledge_expertise: level.knowledge_expertise ?? '',
        communication_influence: level.communication_influence ?? '',
        autonomy_decision_rights: level.autonomy_decision_rights ?? '',
    })

    const setDim = (field: DimensionField, value: string) => {
        setDims(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateLevel(level.id, {
                level_code: levelCode,
                title_examples: titleExamples || undefined,
                description: description || undefined,
                problem_solving: dims.problem_solving || undefined,
                accountability: dims.accountability || undefined,
                people_management: dims.people_management || undefined,
                knowledge_expertise: dims.knowledge_expertise || undefined,
                communication_influence: dims.communication_influence || undefined,
                autonomy_decision_rights: dims.autonomy_decision_rights || undefined,
            })
            if (res.success) onSaved()
        })
    }

    const inputStyle = {
        background: 'var(--color-pl-surface-raised)',
        border: '1px solid var(--color-pl-border)',
        color: 'var(--color-pl-text-primary)',
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl p-6"
                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('editLevel')} — {level.level_code}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Overview fields */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('levelCode')}</label>
                            <input value={levelCode} onChange={e => setLevelCode(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm rounded-lg" style={inputStyle} />
                        </div>
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('titleExamples')}</label>
                            <input value={titleExamples} onChange={e => setTitleExamples(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm rounded-lg" style={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('description')}</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                            className="w-full px-3 py-1.5 text-sm rounded-lg resize-none" style={inputStyle} />
                    </div>

                    {/* Dimensions section */}
                    <div>
                        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('dimensions')}</h3>
                        <p className="text-xs mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('dimensionsHint')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {DIMENSION_KEYS.map(({ field, label }) => (
                                <div key={field}>
                                    <label className="text-xs mb-1 block font-medium" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t(label)}</label>
                                    <textarea value={dims[field]} onChange={e => setDim(field, e.target.value)} rows={3}
                                        className="w-full px-3 py-1.5 text-xs rounded-lg resize-none" style={inputStyle} />
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
                        <button onClick={handleSave} disabled={isPending || !levelCode}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg"
                            style={{ background: 'var(--color-pl-brand)', color: '#fff', opacity: isPending || !levelCode ? 0.6 : 1 }}>
                            {isPending && <Loader2 size={14} className="animate-spin" />}
                            {t('save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
