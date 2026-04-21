'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Trash2, Settings, AlertTriangle, X } from 'lucide-react'
import type { JobArchitectureContext } from '@/lib/jobArchitecture/types'
import { deleteStructure } from './actions'

// ============================================================
// Confirmation modal
// ============================================================

function DeleteConfirmModal({
    structureName,
    onConfirm,
    onCancel,
    isPending,
    t,
}: {
    structureName: string
    onConfirm: () => void
    onCancel: () => void
    isPending: boolean
    t: (key: string) => string
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="w-full max-w-md mx-4 rounded-2xl p-6" style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                        <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('deleteStructureTitle')}
                        </h3>
                    </div>
                    <button onClick={onCancel} className="ml-auto p-1 rounded" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 rounded-lg mb-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('deleteStructureWarning')}
                    </p>
                    <p className="text-sm font-semibold mt-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                        &quot;{structureName}&quot;
                    </p>
                </div>

                <div className="flex items-center gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="text-sm px-4 py-2 rounded-lg"
                        style={{ color: 'var(--color-pl-text-secondary)', background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isPending}
                        className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg"
                        style={{ background: '#ef4444', color: '#fff', opacity: isPending ? 0.7 : 1 }}
                    >
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        {t('confirmDelete')}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============================================================
// Settings tab
// ============================================================

export default function SettingsTab({
    ctx,
    onUpdate,
}: {
    ctx: JobArchitectureContext
    onUpdate: () => void
}) {
    const t = useTranslations('jobArchitecture')
    const [isPending, startTransition] = useTransition()
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

    const handleDeleteStructure = () => {
        if (!deleteTarget) return
        startTransition(async () => {
            const res = await deleteStructure(deleteTarget.id)
            if (res.success) { onUpdate(); setDeleteTarget(null) }
        })
    }

    return (
        <div className="space-y-6">
            {/* Overview */}
            <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Settings size={16} style={{ color: 'var(--color-pl-text-primary)' }} />
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('settingsOverview')}
                    </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <span className="text-xs block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('tabLeveling')}</span>
                        <span className="text-lg font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{ctx.structures.length}</span>
                    </div>
                    <div>
                        <span className="text-xs block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('tabFamilies')}</span>
                        <span className="text-lg font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{ctx.jobFamilies.length}</span>
                    </div>
                    <div>
                        <span className="text-xs block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('jobs')}</span>
                        <span className="text-lg font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{ctx.jobs.length}</span>
                    </div>
                    <div>
                        <span className="text-xs block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('tabCompetencies')}</span>
                        <span className="text-lg font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{ctx.competencies.length}</span>
                    </div>
                </div>
            </div>

            {/* Structures management */}
            {ctx.structures.length > 0 && (
                <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('manageStructures')}
                    </h3>
                    <div className="space-y-2">
                        {ctx.structures.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                                <div>
                                    <span className="text-sm font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>{s.name}</span>
                                    {s.is_default && (
                                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full"
                                            style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--color-pl-green)' }}>
                                            {t('default')}
                                        </span>
                                    )}
                                    <span className="ml-2 text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        {ctx.levels.filter(l => l.structure_id === s.id).length} {t('levels')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
                                    className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
                                    style={{ color: 'var(--color-pl-red)' }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Danger zone */}
            <div className="rounded-xl p-5" style={{ border: '1px solid var(--color-pl-red)', background: 'rgba(239,68,68,0.03)' }}>
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} style={{ color: 'var(--color-pl-red)' }} />
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--color-pl-red)' }}>
                        {t('dangerZone')}
                    </h3>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('dangerZoneDesc')}
                </p>
            </div>

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <DeleteConfirmModal
                    structureName={deleteTarget.name}
                    onConfirm={handleDeleteStructure}
                    onCancel={() => setDeleteTarget(null)}
                    isPending={isPending}
                    t={t}
                />
            )}
        </div>
    )
}
