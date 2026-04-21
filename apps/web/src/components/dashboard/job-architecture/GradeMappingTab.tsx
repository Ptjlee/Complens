'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, GitBranch, AlertTriangle, X, ChevronDown, Info } from 'lucide-react'
import type { JobArchitectureContext, JobGradeMapping, SalaryBandRef } from '@/lib/jobArchitecture/types'
import { addGradeMapping, removeGradeMapping } from './actions'

// ============================================================
// Empty state
// ============================================================

function EmptyState({ message, icon }: { message: string; icon: React.ReactNode }) {
    return (
        <div className="glass-card p-8 text-center">
            <div className="mx-auto mb-4 flex justify-center">{icon}</div>
            <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>{message}</p>
        </div>
    )
}

// ============================================================
// Grade chip
// ============================================================

function GradeChip({ label, onRemove, disabled }: { label: string; onRemove: () => void; disabled: boolean }) {
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: 'var(--color-pl-brand-subtle, rgba(59,130,246,0.12))', color: 'var(--color-pl-brand)' }}
        >
            {label}
            <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                className="inline-flex items-center justify-center rounded-full hover:opacity-70 disabled:opacity-40"
                style={{ width: 14, height: 14 }}
            >
                <X size={10} />
            </button>
        </span>
    )
}

// ============================================================
// Add-grade dropdown
// ============================================================

function AddGradeDropdown({
    band,
    availableGrades,
    onSelect,
    disabled,
    label,
}: {
    band: SalaryBandRef
    availableGrades: { id: string; job_grade: string }[]
    onSelect: (gradeId: string, gradeLabel: string) => void
    disabled: boolean
    label: string
}) {
    if (availableGrades.length === 0) return null

    return (
        <div className="relative inline-flex">
            <select
                value=""
                onChange={e => {
                    const grade = band.grades.find(g => g.id === e.target.value)
                    if (grade) onSelect(grade.id, grade.job_grade)
                }}
                disabled={disabled}
                className="appearance-none pl-2 pr-5 py-0.5 text-xs rounded cursor-pointer"
                style={{
                    background: 'var(--color-pl-surface-raised)',
                    border: '1px dashed var(--color-pl-border)',
                    color: 'var(--color-pl-text-tertiary)',
                }}
            >
                <option value="">{label}</option>
                {availableGrades.map(g => (
                    <option key={g.id} value={g.id}>{g.job_grade}</option>
                ))}
            </select>
            <ChevronDown
                size={10}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-pl-text-tertiary)' }}
            />
        </div>
    )
}

// ============================================================
// Grade cell (chips + dropdown for one level/band intersection)
// ============================================================

function GradeCell({
    levelId,
    band,
    mappings,
    onAdd,
    onRemove,
    isSaving,
    addLabel,
    noGradesLabel,
}: {
    levelId: string
    band: SalaryBandRef
    mappings: JobGradeMapping[]
    onAdd: (gradeId: string, gradeLabel: string) => void
    onRemove: (mappedGrade: string) => void
    isSaving: boolean
    addLabel: string
    noGradesLabel: string
}) {
    const mappedGradeNames = new Set(mappings.map(m => m.mapped_grade))
    const availableGrades = band.grades.filter(g => !mappedGradeNames.has(g.job_grade))

    return (
        <td className="py-2 px-3">
            <div className="flex flex-wrap items-center gap-1.5 min-h-[24px]">
                {mappings.map(m => (
                    <GradeChip
                        key={m.id}
                        label={m.mapped_grade}
                        onRemove={() => onRemove(m.mapped_grade)}
                        disabled={isSaving}
                    />
                ))}
                {mappings.length === 0 && availableGrades.length === 0 && (
                    <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {noGradesLabel}
                    </span>
                )}
                <AddGradeDropdown
                    band={band}
                    availableGrades={availableGrades}
                    onSelect={onAdd}
                    disabled={isSaving}
                    label={addLabel}
                />
                {isSaving && (
                    <Loader2 size={12} className="animate-spin" style={{ color: 'var(--color-pl-brand)' }} />
                )}
            </div>
        </td>
    )
}

// ============================================================
// Main component
// ============================================================

export default function GradeMappingTab({
    ctx,
    onUpdate,
}: {
    ctx: JobArchitectureContext
    onUpdate: () => void
}) {
    const t = useTranslations('jobArchitecture')
    const [, startTransition] = useTransition()
    const [savingCell, setSavingCell] = useState<string | null>(null)

    const defaultStructure = ctx.structures.find(s => s.is_default) ?? ctx.structures[0]
    const structureLevels = defaultStructure
        ? [...ctx.levels.filter(l => l.structure_id === defaultStructure.id)].sort((a, b) => {
            const numA = parseInt(a.level_code.replace(/\D/g, ''), 10) || 0
            const numB = parseInt(b.level_code.replace(/\D/g, ''), 10) || 0
            return numA - numB
        })
        : []

    if (!defaultStructure || structureLevels.length === 0) {
        return <EmptyState message={t('gradeMappingNoStructures')} icon={<GitBranch size={40} style={{ color: 'var(--color-pl-brand)' }} />} />
    }

    if (ctx.salaryBands.length === 0) {
        return <EmptyState message={t('gradeMappingNoBands')} icon={<AlertTriangle size={40} style={{ color: 'var(--color-pl-text-tertiary)' }} />} />
    }

    const getMappedGrades = (levelId: string, bandId: string) => {
        return ctx.gradeMappings.filter(gm => gm.level_id === levelId && gm.salary_band_id === bandId)
    }

    const handleAdd = (levelId: string, bandId: string, gradeId: string, gradeLabel: string) => {
        const cellKey = `${levelId}-${bandId}`
        setSavingCell(cellKey)
        startTransition(async () => {
            const res = await addGradeMapping({
                level_id: levelId,
                salary_band_id: bandId,
                mapped_grade: gradeLabel,
                mapped_grade_id: gradeId || undefined,
            })
            setSavingCell(null)
            if (res.success) onUpdate()
        })
    }

    const handleRemove = (levelId: string, bandId: string, mappedGrade: string) => {
        const cellKey = `${levelId}-${bandId}`
        setSavingCell(cellKey)
        startTransition(async () => {
            const res = await removeGradeMapping({
                level_id: levelId,
                salary_band_id: bandId,
                mapped_grade: mappedGrade,
            })
            setSavingCell(null)
            if (res.success) onUpdate()
        })
    }

    return (
        <div className="space-y-4">
            {/* Cross-module info banner */}
            <div
                className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs"
                style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-text-secondary)' }}
            >
                <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-pl-brand)' }} />
                <span>{t('gradeMappingInfo')}</span>
            </div>

            <div>
                <h2 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('gradeMappingTitle')}
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                    {t('gradeMappingDesc')}
                </p>
            </div>

            <div className="glass-card overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                            <th className="text-left py-2.5 px-3 text-xs font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {t('levelColumn')}
                            </th>
                            {ctx.salaryBands.map(band => (
                                <th key={band.id} className="text-left py-2.5 px-3 text-xs font-semibold" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    {band.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {structureLevels.map(level => (
                            <tr key={level.id} style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                                <td className="py-2 px-3">
                                    <span className="font-mono text-xs px-2 py-0.5 rounded"
                                        style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-brand-light)' }}>
                                        {level.level_code}
                                    </span>
                                    {level.title_examples && (
                                        <span className="text-xs ml-2" style={{ color: 'var(--color-pl-text-tertiary)' }}>{level.title_examples}</span>
                                    )}
                                </td>
                                {ctx.salaryBands.map(band => {
                                    const mappings = getMappedGrades(level.id, band.id)
                                    const cellKey = `${level.id}-${band.id}`
                                    const isSaving = savingCell === cellKey

                                    return (
                                        <GradeCell
                                            key={band.id}
                                            levelId={level.id}
                                            band={band}
                                            mappings={mappings}
                                            onAdd={(gradeId, gradeLabel) => handleAdd(level.id, band.id, gradeId, gradeLabel)}
                                            onRemove={(mappedGrade) => handleRemove(level.id, band.id, mappedGrade)}
                                            isSaving={isSaving}
                                            addLabel={t('addGrade')}
                                            noGradesLabel={t('noGradesAssigned')}
                                        />
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
