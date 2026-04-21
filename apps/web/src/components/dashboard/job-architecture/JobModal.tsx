'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { X, Plus, Trash2, Loader2, Sparkles, Star } from 'lucide-react'
import type { JobArchitectureContext, Job, CompetencyImportance, LevelDefinition } from '@/lib/jobArchitecture/types'
import { createJob, updateJob } from './actions'
import { generateJobDescription } from './aiActions'

// ============================================================
// List input (responsibilities / qualifications)
// ============================================================

function ListInput({ items, onChange, placeholder, t }: {
    items: string[]; onChange: (v: string[]) => void; placeholder: string; t: (k: string) => string
}) {
    const add = () => onChange([...items, ''])
    const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
    const update = (i: number, v: string) => onChange(items.map((it, idx) => idx === i ? v : it))

    return (
        <div className="space-y-1.5">
            {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input value={item} onChange={e => update(i, e.target.value)} placeholder={placeholder}
                        className="flex-1 px-2 py-1 text-xs rounded"
                        style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                    <button onClick={() => remove(i)} className="p-0.5" style={{ color: 'var(--color-pl-red)' }}>
                        <Trash2 size={12} />
                    </button>
                </div>
            ))}
            <button onClick={add} className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-pl-brand-light)' }}>
                <Plus size={12} /> {t('addItem')}
            </button>
        </div>
    )
}

// ============================================================
// Competency selector row
// ============================================================

function CompetencyRow({ compId, level, importance, onRemove, onChangeLevel, onChangeImportance, ctx, t }: {
    compId: string; level: number; importance: CompetencyImportance
    onRemove: () => void; onChangeLevel: (l: number) => void; onChangeImportance: (i: CompetencyImportance) => void
    ctx: JobArchitectureContext; t: (k: string) => string
}) {
    const comp = ctx.competencies.find(c => c.id === compId)
    if (!comp) return null
    return (
        <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
            <span className="flex-1 text-xs truncate" style={{ color: 'var(--color-pl-text-primary)' }}>{comp.name}</span>
            <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => onChangeLevel(s)} className="p-0">
                        <Star size={12} style={{ color: s <= level ? 'var(--color-pl-brand)' : 'var(--color-pl-border)', fill: s <= level ? 'var(--color-pl-brand)' : 'none' }} />
                    </button>
                ))}
            </div>
            <select value={importance} onChange={e => onChangeImportance(e.target.value as CompetencyImportance)}
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>
                <option value="critical">{t('importanceCritical')}</option>
                <option value="important">{t('importanceImportant')}</option>
                <option value="nice_to_have">{t('importanceNiceToHave')}</option>
            </select>
            <button onClick={onRemove} className="p-0.5" style={{ color: 'var(--color-pl-red)' }}>
                <Trash2 size={12} />
            </button>
        </div>
    )
}

// ============================================================
// Main modal
// ============================================================

type DraftComp = { competency_id: string; required_level: number; importance: CompetencyImportance }

export default function JobModal({ job, familyId, ctx, onClose, onSaved, prefill }: {
    job: Job | null; familyId: string; ctx: JobArchitectureContext
    onClose: () => void; onSaved: (newJobId?: string) => void
    prefill?: {
        title?: string; responsibilities?: string[]; qualifications?: string[]; summary?: string; levelId?: string
        competencyIds?: string[]
        competencies?: Array<{ competency_id: string; required_level: number; importance: string }>
    }
}) {
    const t = useTranslations('jobArchitecture')
    const [isPending, startTransition] = useTransition()
    const [title, setTitle] = useState(job?.title ?? prefill?.title ?? '')
    const [fid, setFid] = useState(job?.family_id ?? familyId)
    const [levelId, setLevelId] = useState(job?.level_id ?? prefill?.levelId ?? '')
    const [summary, setSummary] = useState(job?.jd_summary ?? prefill?.summary ?? '')
    const [responsibilities, setResponsibilities] = useState<string[]>(job?.jd_responsibilities ?? prefill?.responsibilities ?? [''])
    const [qualifications, setQualifications] = useState<string[]>(job?.jd_qualifications ?? prefill?.qualifications ?? [''])
    const [comps, setComps] = useState<DraftComp[]>(() => {
        // Use AI-assessed levels and importance if available
        if (prefill?.competencies?.length) {
            return prefill.competencies
                .filter(c => ctx.competencies.some(cc => cc.id === c.competency_id))
                .map(c => ({
                    competency_id: c.competency_id,
                    required_level: Math.min(5, Math.max(1, c.required_level)),
                    importance: (['critical', 'important', 'nice_to_have'].includes(c.importance) ? c.importance : 'important') as CompetencyImportance,
                }))
        }
        if (prefill?.competencyIds?.length) {
            return prefill.competencyIds
                .filter(id => ctx.competencies.some(c => c.id === id))
                .map(id => ({ competency_id: id, required_level: 3, importance: 'important' as const }))
        }
        return []
    })
    const [genPending, startGen] = useTransition()

    const defaultStructure = ctx.structures.find(s => s.is_default) ?? ctx.structures[0]
    const structureLevels = defaultStructure
        ? [...ctx.levels.filter(l => l.structure_id === defaultStructure.id)].sort((a, b) => {
            const numA = parseInt(a.level_code.replace(/\D/g, ''), 10) || 0
            const numB = parseInt(b.level_code.replace(/\D/g, ''), 10) || 0
            return numA - numB
        })
        : []

    const handleGenerateJD = () => {
        startGen(async () => {
            const family = ctx.jobFamilies.find(f => f.id === fid)
            const level = ctx.levels.find(l => l.id === levelId) as LevelDefinition | undefined
            const res = await generateJobDescription({
                jobTitle: title,
                jobFamily: family?.name ?? '',
                levelCode: level?.level_code ?? '',
                levelDetails: level ?? null,
                currentData: summary ? { summary, responsibilities: responsibilities.join('\n'), qualifications: qualifications.join('\n') } : null,
                competencyNames: ctx.competencies.map(c => c.name),
            })
            if (res.success) {
                setSummary(res.data.summary)
                setResponsibilities(res.data.responsibilities)
                setQualifications(res.data.qualifications)
                if (res.data.suggested_competencies) {
                    const mapped: DraftComp[] = res.data.suggested_competencies.map(sc => {
                        const match = ctx.competencies.find(c => c.name.toLowerCase() === sc.name.toLowerCase())
                        const imp = (['critical', 'important', 'nice_to_have'].includes(sc.importance ?? '') ? sc.importance : 'important') as CompetencyImportance
                        return match ? { competency_id: match.id, required_level: Math.min(5, Math.max(1, sc.level)), importance: imp } : null
                    }).filter(Boolean) as DraftComp[]
                    setComps(prev => [...prev, ...mapped])
                }
            }
        })
    }

    const addComp = (compId: string) => {
        if (!comps.find(c => c.competency_id === compId)) {
            setComps(prev => [...prev, { competency_id: compId, required_level: 3, importance: 'important' }])
        }
    }

    const removeComp = (i: number) => setComps(prev => prev.filter((_, idx) => idx !== i))
    const updateCompLevel = (i: number, l: number) => setComps(prev => prev.map((c, idx) => idx === i ? { ...c, required_level: l } : c))
    const updateCompImportance = (i: number, imp: CompetencyImportance) => setComps(prev => prev.map((c, idx) => idx === i ? { ...c, importance: imp } : c))

    const handleSave = () => {
        startTransition(async () => {
            const payload = {
                title,
                family_id: fid,
                level_id: levelId || undefined,
                jd_summary: summary || undefined,
                jd_responsibilities: responsibilities.filter(r => r.trim()),
                jd_qualifications: qualifications.filter(q => q.trim()),
                competencies: comps,
            }
            const res = job ? await updateJob(job.id, payload) : await createJob(payload)
            if (res.success) onSaved(res.data?.id)
        })
    }

    // Compute mapped grades for selected level (join gradeMappings with salaryBands)
    const mappedGrades = levelId
        ? ctx.gradeMappings
            .filter(gm => gm.level_id === levelId)
            .map(gm => {
                const band = ctx.salaryBands.find(b => b.id === gm.salary_band_id)
                return { grade: gm.mapped_grade, bandName: band?.name ?? '—' }
            })
        : []

    // Compute salary range from the job's linked salary_band_grade
    const salaryRange = job?.salary_band_grade
        ? `${job.salary_band_grade.min_salary.toLocaleString('de-DE')} – ${job.salary_band_grade.max_salary.toLocaleString('de-DE')} €`
        : null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl p-6"
                style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{job ? t('editJob') : t('createJob')}</h2>
                    <button onClick={onClose} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-pl-text-tertiary)' }}><X size={18} /></button>
                </div>
                <div className="space-y-4">
                    {/* Title, Family, Level */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('jobTitle')}</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-1.5 text-sm rounded-lg"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                        </div>
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('jobFamily')}</label>
                            <select value={fid} onChange={e => setFid(e.target.value)} className="w-full px-3 py-1.5 text-sm rounded-lg"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>
                                {ctx.jobFamilies.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('level')}</label>
                            <select value={levelId} onChange={e => setLevelId(e.target.value)} className="w-full px-3 py-1.5 text-sm rounded-lg"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>
                                <option value="">{t('selectLevel')}</option>
                                {structureLevels.map(l => <option key={l.id} value={l.id}>{l.level_code}</option>)}
                            </select>
                        </div>
                    </div>
                    {levelId && mappedGrades.length > 0 && (
                        <div className="mt-2 p-2.5 rounded-lg" style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)' }}>
                            <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                Zugeordnete Vergütungsgruppen
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {mappedGrades.map(g => (
                                    <span key={g.grade} className="px-2 py-0.5 text-xs rounded font-mono"
                                        style={{ background: 'var(--color-pl-surface)', color: 'var(--color-pl-brand-light)', border: '1px solid var(--color-pl-border)' }}>
                                        {g.bandName}: {g.grade}
                                    </span>
                                ))}
                            </div>
                            {salaryRange && (
                                <span className="text-[10px] block mt-1.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                    Gehaltsspanne: {salaryRange}
                                </span>
                            )}
                        </div>
                    )}
                    {/* JD Section */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('jobDescription')}</span>
                            <button onClick={handleGenerateJD} disabled={genPending || !title}
                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                                style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)', opacity: genPending || !title ? 0.6 : 1 }}>
                                {genPending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} {t('generateWithAssistant')}
                            </button>
                        </div>
                        <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3} placeholder={t('summaryPlaceholder')} className="w-full px-3 py-1.5 text-sm rounded-lg resize-none mb-2"
                            style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }} />
                        <label className="text-xs mb-1 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('responsibilities')}</label>
                        <ListInput items={responsibilities} onChange={setResponsibilities} placeholder={t('responsibilityPlaceholder')} t={t} />
                        <label className="text-xs mb-1 mt-2 block" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('qualifications')}</label>
                        <ListInput items={qualifications} onChange={setQualifications} placeholder={t('qualificationPlaceholder')} t={t} />
                    </div>
                    {/* Competencies */}
                    <div>
                        <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('competencies')}</span>
                        <div className="space-y-1.5 mb-2">
                            {comps.map((c, i) => (
                                <CompetencyRow key={c.competency_id} compId={c.competency_id} level={c.required_level} importance={c.importance}
                                    onRemove={() => removeComp(i)} onChangeLevel={l => updateCompLevel(i, l)} onChangeImportance={imp => updateCompImportance(i, imp)} ctx={ctx} t={t} />
                            ))}
                        </div>
                        <select onChange={e => { if (e.target.value) addComp(e.target.value); e.target.value = '' }} className="text-xs px-2 py-1 rounded-lg"
                            style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>
                            <option value="">{t('addCompetency')}</option>
                            {ctx.competencies.filter(c => !comps.find(dc => dc.competency_id === c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg"
                            style={{ background: 'var(--color-pl-surface-raised)', border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-primary)' }}>{t('cancel')}</button>
                        <button onClick={handleSave} disabled={isPending || !title}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg"
                            style={{ background: 'var(--color-pl-brand)', color: '#fff', opacity: isPending || !title ? 0.6 : 1 }}>
                            {isPending && <Loader2 size={14} className="animate-spin" />} {t('save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
