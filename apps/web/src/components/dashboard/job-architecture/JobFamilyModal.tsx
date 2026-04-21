'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { X, Loader2 } from 'lucide-react'
import type { JobFamily } from '@/lib/jobArchitecture/types'
import { createFamily, updateFamily } from './actions'

const PRESET_COLORS = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#6366f1',
]

const PRESET_ICONS = [
    'briefcase', 'code', 'chart', 'heart', 'shield',
    'wrench', 'globe', 'users', 'megaphone', 'lightbulb',
]

type Props = {
    family: JobFamily | null
    onClose: () => void
    onSaved: () => void
}

export default function JobFamilyModal({ family, onClose, onSaved }: Props) {
    const t = useTranslations('jobArchitecture')
    const [isPending, startTransition] = useTransition()
    const [name, setName] = useState(family?.name ?? '')
    const [description, setDescription] = useState(family?.description ?? '')
    const [color, setColor] = useState(family?.color ?? PRESET_COLORS[0])
    const [icon, setIcon] = useState(family?.icon ?? PRESET_ICONS[0])

    const handleSave = () => {
        startTransition(async () => {
            const payload = { name, description, color, icon }
            const res = family
                ? await updateFamily(family.id, payload)
                : await createFamily(payload)
            if (res.success) onSaved()
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-full max-w-md rounded-xl p-6"
                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {family ? t('editFamily') : t('createFamily')}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('familyName')}</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-1.5 text-sm rounded-lg"
                            style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('familyDescription')}</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-1.5 text-sm rounded-lg resize-none"
                            style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                    </div>

                    {/* Color picker */}
                    <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('familyColor')}</label>
                        <div className="flex gap-2 flex-wrap">
                            {PRESET_COLORS.map(c => (
                                <button key={c} onClick={() => setColor(c)}
                                    className="w-7 h-7 rounded-full transition-all"
                                    style={{ background: c, outline: color === c ? '2px solid var(--color-pl-brand)' : 'none', outlineOffset: '2px' }} />
                            ))}
                        </div>
                    </div>

                    {/* Icon selector */}
                    <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('familyIcon')}</label>
                        <div className="flex gap-2 flex-wrap">
                            {PRESET_ICONS.map(ic => (
                                <button key={ic} onClick={() => setIcon(ic)}
                                    className="px-2.5 py-1 text-xs rounded-lg transition-all"
                                    style={{
                                        background: icon === ic ? 'var(--color-pl-brand)' : 'var(--color-pl-surface-raised)',
                                        color: icon === ic ? '#fff' : 'var(--color-pl-text-secondary)',
                                        border: '1px solid var(--color-pl-border)',
                                    }}>
                                    {ic}
                                </button>
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
            </div>
        </div>
    )
}
