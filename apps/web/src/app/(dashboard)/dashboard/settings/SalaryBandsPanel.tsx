'use client'

import { useState, useEffect, useTransition } from 'react'
import {
    Plus, Trash2, Check, AlertTriangle, ChevronDown, ChevronUp,
    Info, Save, Loader2, TrendingUp,
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type SalaryGrade = {
    id:          string
    band_id:     string
    job_grade:   string
    job_family:  string | null
    level_label: string | null
    min_salary:  number
    mid_salary:  number | null
    max_salary:  number
    created_at:  string
}

type SalaryBand = {
    id:          string
    org_id:      string
    name:        string
    description: string | null
    created_at:  string
    grades:      SalaryGrade[]
}

// ─── Compa-ratio chip ─────────────────────────────────────────────────────────

function CompaChip({ ratio, t }: { ratio: number; t: ReturnType<typeof useTranslations> }) {
    const color = ratio < 0.8   ? '#ef4444'
                : ratio < 0.875 ? '#f59e0b'
                : ratio > 1.125 ? '#818cf8'
                : '#34d399'
    const label = ratio < 0.8   ? t('underpayment')
                : ratio < 0.875 ? t('riskZone')
                : ratio > 1.125 ? t('overpayment')
                : t('onTarget')
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
            <TrendingUp size={10} />
            {(ratio * 100).toFixed(0)}% · {label}
        </span>
    )
}

// ─── Grade form state ─────────────────────────────────────────────────────────

type GradeFormState = {
    job_grade:   string
    job_family:  string
    level_label: string
    min_salary:  string
    mid_salary:  string
    max_salary:  string
}

function emptyGrade(): GradeFormState {
    return { job_grade: '', job_family: '', level_label: '', min_salary: '', mid_salary: '', max_salary: '' }
}

function gradeToForm(g: SalaryGrade): GradeFormState {
    return {
        job_grade:   g.job_grade,
        job_family:  g.job_family  ?? '',
        level_label: g.level_label ?? '',
        min_salary:  String(g.min_salary),
        mid_salary:  g.mid_salary != null ? String(g.mid_salary) : '',
        max_salary:  String(g.max_salary),
    }
}

// ─── Band card ────────────────────────────────────────────────────────────────

function BandCard({
    band, onUpdated, onDeleted, t, currFmt,
}: {
    band:      SalaryBand
    onUpdated: (b: SalaryBand) => void
    onDeleted: (id: string) => void
    t:         ReturnType<typeof useTranslations>
    currFmt:   (n: number) => string
}) {
    const [expanded,  setExpanded]  = useState(false)
    const [adding,    setAdding]    = useState(false)
    const [gradeForm, setGradeForm] = useState<GradeFormState>(emptyGrade())
    const [editId,    setEditId]    = useState<string | null>(null)
    const [editForm,  setEditForm]  = useState<GradeFormState>(emptyGrade())
    const [saving,    setSaving]    = useState(false)
    const [deleting,  setDeleting]  = useState<string | null>(null)
    const [error,     setError]     = useState<string | null>(null)

    const supabase = createClient()

    async function saveGrade() {
        setError(null)
        const min = parseFloat(gradeForm.min_salary)
        const max = parseFloat(gradeForm.max_salary)
        const mid = gradeForm.mid_salary ? parseFloat(gradeForm.mid_salary) : null
        if (!gradeForm.job_grade.trim()) { setError(t('gradeRequired')); return }
        if (isNaN(min) || isNaN(max) || min <= 0 || max <= min) {
            setError(t('minMaxError')); return
        }

        setSaving(true)
        const { data, error: e } = await supabase
            .from('salary_band_grades')
            .insert({
                band_id:     band.id,
                job_grade:   gradeForm.job_grade.trim(),
                job_family:  gradeForm.job_family.trim()  || null,
                level_label: gradeForm.level_label.trim() || null,
                min_salary:  min,
                mid_salary:  mid,
                max_salary:  max,
            })
            .select()
            .single()

        setSaving(false)
        if (e) { setError(e.message); return }
        onUpdated({ ...band, grades: [...band.grades, data as SalaryGrade] })
        setAdding(false)
        setGradeForm(emptyGrade())
    }

    async function saveEdit(gradeId: string) {
        setError(null)
        const min = parseFloat(editForm.min_salary)
        const max = parseFloat(editForm.max_salary)
        const mid = editForm.mid_salary ? parseFloat(editForm.mid_salary) : null
        if (!editForm.job_grade.trim()) { setError(t('gradeRequired')); return }
        if (isNaN(min) || isNaN(max) || min <= 0 || max <= min) {
            setError(t('minMaxError')); return
        }

        setSaving(true)
        const { data, error: e } = await supabase
            .from('salary_band_grades')
            .update({
                job_grade:   editForm.job_grade.trim(),
                job_family:  editForm.job_family.trim()  || null,
                level_label: editForm.level_label.trim() || null,
                min_salary:  min,
                mid_salary:  mid,
                max_salary:  max,
            })
            .eq('id', gradeId)
            .select()
            .single()

        setSaving(false)
        if (e) { setError(e.message); return }
        onUpdated({ ...band, grades: band.grades.map(g => g.id === gradeId ? data as SalaryGrade : g) })
        setEditId(null)
    }

    async function deleteGrade(gradeId: string) {
        setDeleting(gradeId)
        const { error: e } = await supabase.from('salary_band_grades').delete().eq('id', gradeId)
        setDeleting(null)
        if (e) { setError(e.message); return }
        onUpdated({ ...band, grades: band.grades.filter(g => g.id !== gradeId) })
    }

    async function deleteBand() {
        if (!confirm(t('deleteBandConfirm', { name: band.name }))) return
        const { error: e } = await supabase.from('salary_bands').delete().eq('id', band.id)
        if (e) { setError(e.message); return }
        onDeleted(band.id)
    }

    const sortedGrades = [...band.grades].sort((a, b) => a.job_grade.localeCompare(b.job_grade))

    return (
        <div className="glass-card overflow-hidden" style={{ border: '1px solid var(--color-pl-border)' }}>
            {/* Band header */}
            <div className="flex items-center justify-between px-5 py-4"
                style={{ background: 'var(--theme-pl-action-ghost)', borderBottom: expanded ? '1px solid var(--color-pl-border)' : 'none' }}>
                <button className="flex items-center gap-2.5 text-left flex-1" onClick={() => setExpanded(v => !v)}>
                    {expanded
                        ? <ChevronUp size={15} style={{ color: 'var(--color-pl-text-tertiary)' }} />
                        : <ChevronDown size={15} style={{ color: 'var(--color-pl-text-tertiary)' }} />}
                    <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{band.name}</p>
                        <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('gradeCount', { count: band.grades.length })}
                            {band.description ? ` · ${band.description}` : ''}
                        </p>
                    </div>
                </button>
                <button onClick={deleteBand} className="p-1.5 rounded-lg transition-colors ml-2"
                    title={t('deleteBandTitle')}
                    style={{ color: 'var(--color-pl-text-tertiary)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-pl-text-tertiary)')}>
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Expanded */}
            {expanded && (
                <div className="p-4 space-y-3">
                    {error && (
                        <p className="text-xs px-3 py-2 rounded-lg flex items-center gap-1.5"
                            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <AlertTriangle size={12} /> {error}
                        </p>
                    )}

                    {/* Grade table */}
                    {sortedGrades.length > 0 && (
                        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--color-pl-border)' }}>
                            <table className="text-xs w-full border-collapse">
                                <thead>
                                    <tr style={{ background: 'var(--theme-pl-action-ghost)', borderBottom: '1px solid var(--color-pl-border)' }}>
                                        {[t('tableGroup'), t('tableFamilyLevel'), t('tableMin'), t('tableMid'), t('tableMax'), t('tableCompa'), ''].map(h => (
                                            <th key={h} className="py-2 px-3 text-left font-medium"
                                                style={{ color: 'var(--color-pl-text-tertiary)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedGrades.map(g => {
                                        const mid   = g.mid_salary ?? (g.min_salary + g.max_salary) / 2
                                        const ratio = g.mid_salary ? g.mid_salary / mid : 1

                                        if (editId === g.id) {
                                            return (
                                                <tr key={g.id} style={{ background: 'rgba(99,102,241,0.04)' }}>
                                                    <td className="px-3 py-2">
                                                        <input value={editForm.job_grade}
                                                            onChange={e => setEditForm(f => ({ ...f, job_grade: e.target.value }))}
                                                            className="input-base text-xs py-1 w-20" />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex gap-1">
                                                            <input value={editForm.job_family}
                                                                onChange={e => setEditForm(f => ({ ...f, job_family: e.target.value }))}
                                                                placeholder={t('jobFamilyLabel')}
                                                                className="input-base text-xs py-1 w-20" />
                                                            <input value={editForm.level_label}
                                                                onChange={e => setEditForm(f => ({ ...f, level_label: e.target.value }))}
                                                                placeholder={t('levelLabel')}
                                                                className="input-base text-xs py-1 w-16" />
                                                        </div>
                                                    </td>
                                                    {(['min_salary', 'mid_salary', 'max_salary'] as const).map(k => (
                                                        <td key={k} className="px-3 py-2">
                                                            <input type="number" value={editForm[k]}
                                                                onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))}
                                                                className="input-base text-xs py-1 w-24"
                                                                placeholder={k === 'mid_salary' ? `(${t('midPlaceholder')})` : undefined} />
                                                        </td>
                                                    ))}
                                                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>—</td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => saveEdit(g.id)} disabled={saving}
                                                                className="p-1 rounded flex items-center gap-0.5 text-xs px-2"
                                                                style={{ background: 'var(--color-pl-brand)', color: '#fff' }}>
                                                                {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                                            </button>
                                                            <button onClick={() => setEditId(null)}
                                                                className="p-1 rounded text-xs px-2"
                                                                style={{ color: 'var(--color-pl-text-tertiary)', border: '1px solid var(--color-pl-border)' }}>
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        }

                                        return (
                                            <tr key={g.id} className="border-t"
                                                style={{ borderColor: 'var(--color-pl-border)' }}
                                                onDoubleClick={() => { setEditId(g.id); setEditForm(gradeToForm(g)); setError(null) }}>
                                                <td className="px-3 py-2 font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                                    {g.job_grade}
                                                </td>
                                                <td className="px-3 py-2 text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                    {[g.job_family, g.level_label].filter(Boolean).join(' · ') || '—'}
                                                </td>
                                                <td className="px-3 py-2" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                                    {currFmt(g.min_salary)}
                                                </td>
                                                <td className="px-3 py-2" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                                    {g.mid_salary
                                                        ? currFmt(g.mid_salary)
                                                        : <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{currFmt((g.min_salary + g.max_salary) / 2)} {t('calculatedMid')}</span>}
                                                </td>
                                                <td className="px-3 py-2" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                                    {currFmt(g.max_salary)}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <CompaChip ratio={ratio} t={t} />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => { setEditId(g.id); setEditForm(gradeToForm(g)); setError(null) }}
                                                            className="text-xs px-2 py-0.5 rounded"
                                                            style={{ color: 'var(--color-pl-brand-light)', border: '1px solid rgba(99,102,241,0.3)' }}>
                                                            {t('editButton')}
                                                        </button>
                                                        <button onClick={() => deleteGrade(g.id)} disabled={deleting === g.id}
                                                            className="p-1 rounded transition-colors"
                                                            style={{ color: 'var(--color-pl-text-tertiary)' }}
                                                            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                                                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-pl-text-tertiary)')}>
                                                            {deleting === g.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Add grade form */}
                    {adding ? (
                        <div className="rounded-xl p-4 space-y-3"
                            style={{ background: 'var(--theme-pl-action-ghost)', border: '1px solid var(--color-pl-border)' }}>
                            <p className="text-xs font-semibold uppercase tracking-wide"
                                style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('newGradeTitle')}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                        {t('gradeLabel')} <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <input value={gradeForm.job_grade}
                                        onChange={e => setGradeForm(f => ({ ...f, job_grade: e.target.value }))}
                                        placeholder={t('gradePlaceholder')}
                                        className="input-base text-xs w-full" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                        {t('jobFamilyLabel')}
                                    </label>
                                    <input value={gradeForm.job_family}
                                        onChange={e => setGradeForm(f => ({ ...f, job_family: e.target.value }))}
                                        placeholder={t('jobFamilyPlaceholder')}
                                        className="input-base text-xs w-full" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                    {t('levelLabel')}
                                </label>
                                <input value={gradeForm.level_label}
                                    onChange={e => setGradeForm(f => ({ ...f, level_label: e.target.value }))}
                                    placeholder={t('levelPlaceholder')}
                                    className="input-base text-xs w-full" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {([
                                    { key: 'min_salary' as const, label: t('minSalaryLabel'), req: true },
                                    { key: 'mid_salary' as const, label: t('midSalaryLabel'), req: false },
                                    { key: 'max_salary' as const, label: t('maxSalaryLabel'), req: true },
                                ]).map(({ key, label, req }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-medium mb-1"
                                            style={{ color: 'var(--color-pl-text-secondary)' }}>
                                            {label} {req && <span style={{ color: '#ef4444' }}>*</span>}
                                        </label>
                                        <input type="number" value={gradeForm[key]}
                                            onChange={e => setGradeForm(f => ({ ...f, [key]: e.target.value }))}
                                            placeholder={req ? '0' : t('midPlaceholder')}
                                            className="input-base text-xs w-full" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={saveGrade} disabled={saving} className="btn-primary text-xs py-1.5">
                                    {saving ? <><Loader2 size={12} className="animate-spin" /> {t('savingButton')}</> : <><Save size={12} /> {t('saveGradeButton')}</>}
                                </button>
                                <button onClick={() => { setAdding(false); setError(null) }}
                                    className="text-xs px-3 py-1.5 rounded-lg"
                                    style={{ border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-secondary)' }}>
                                    {t('cancelButton')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => { setAdding(true); setError(null) }}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                            style={{
                                background: 'rgba(99,102,241,0.08)',
                                border: '1px solid rgba(99,102,241,0.25)',
                                color: 'var(--color-pl-brand-light)',
                            }}>
                            <Plus size={13} /> {t('addGradeButton')}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function SalaryBandsPanel() {
    const [bands,    setBands]    = useState<SalaryBand[]>([])
    const [loading,  setLoading]  = useState(true)
    const [creating, setCreating] = useState(false)
    const [newName,  setNewName]  = useState('')
    const [newDesc,  setNewDesc]  = useState('')
    const [saving,   setSaving]   = useState(false)
    const [error,    setError]    = useState<string | null>(null)
    const [, startTransition] = useTransition()

    const t = useTranslations('salaryBands')
    const locale = useLocale()

    const currFmt = (n: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

    const supabase = createClient()

    useEffect(() => {
        async function load() {
            setLoading(true)
            const { data: bandsData } = await supabase
                .from('salary_bands')
                .select('id, org_id, name, description, created_at')
                .order('created_at', { ascending: true })

            if (!bandsData) { setLoading(false); return }

            const { data: gradesData } = await supabase
                .from('salary_band_grades')
                .select('*')
                .in('band_id', bandsData.map(b => b.id))
                .order('job_grade')

            const gradesByBand = (gradesData ?? []).reduce<Record<string, SalaryGrade[]>>((acc, g) => {
                const arr = acc[g.band_id] ?? []
                arr.push(g as SalaryGrade)
                acc[g.band_id] = arr
                return acc
            }, {})

            setBands(bandsData.map(b => ({ ...b, grades: gradesByBand[b.id] ?? [] })))
            setLoading(false)
        }
        startTransition(() => { load() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function createBand() {
        if (!newName.trim()) { setError(t('nameRequired')); return }
        setError(null)
        setSaving(true)
        const { data, error: e } = await supabase
            .from('salary_bands')
            .insert({ name: newName.trim(), description: newDesc.trim() || null })
            .select()
            .single()
        setSaving(false)
        if (e) { setError(e.message); return }
        setBands(prev => [...prev, { ...data as SalaryBand, grades: [] }])
        setNewName('')
        setNewDesc('')
        setCreating(false)
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('panelTitle')}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('panelSubtitle')}
                    </p>
                </div>
                {!creating && (
                    <button onClick={() => { setCreating(true); setError(null) }}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
                        style={{ background: 'var(--color-pl-brand)', color: '#fff' }}>
                        <Plus size={13} /> {t('newBandButton')}
                    </button>
                )}
            </div>

            {/* EU compliance note */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Info size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#818cf8' }} />
                <div style={{ color: 'var(--color-pl-text-secondary)' }}>
                    <strong style={{ color: 'var(--color-pl-text-primary)' }}>{t('euComplianceNoteLabel')}</strong>{' '}
                    <span dangerouslySetInnerHTML={{ __html: t('euComplianceNote') }} />
                </div>
            </div>

            {/* Create band form */}
            {creating && (
                <div className="glass-card p-4 space-y-3"
                    style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
                    <p className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('newBandFormTitle')}</p>
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('bandNameLabel')} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input value={newName} onChange={e => setNewName(e.target.value)}
                            placeholder={t('bandNamePlaceholderPanel')}
                            className="input-base text-sm w-full"
                            onKeyDown={e => e.key === 'Enter' && createBand()} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('bandDescLabel')}
                        </label>
                        <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                            placeholder={t('bandDescPlaceholder')}
                            className="input-base text-sm w-full" />
                    </div>
                    {error && (
                        <p className="text-xs flex items-center gap-1.5" style={{ color: '#ef4444' }}>
                            <AlertTriangle size={12} /> {error}
                        </p>
                    )}
                    <div className="flex items-center gap-2">
                        <button onClick={createBand} disabled={saving} className="btn-primary text-xs py-1.5">
                            {saving ? <><Loader2 size={12} className="animate-spin" /> {t('savingButton')}</> : t('createBandButton')}
                        </button>
                        <button onClick={() => { setCreating(false); setError(null) }}
                            className="text-xs px-3 py-1.5 rounded-lg"
                            style={{ border: '1px solid var(--color-pl-border)', color: 'var(--color-pl-text-secondary)' }}>
                            {t('cancelButton')}
                        </button>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="py-12 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: 'var(--color-pl-text-tertiary)' }} />
                    <p className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('loadingData')}</p>
                </div>
            )}

            {/* Empty state */}
            {!loading && bands.length === 0 && !creating && (
                <div className="glass-card py-12 text-center" style={{ borderStyle: 'dashed' }}>
                    <TrendingUp size={32} className="mx-auto mb-3" style={{ color: 'var(--color-pl-text-tertiary)' }} />
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('noBandsYet')}
                    </p>
                    <p className="text-xs mb-4" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('noBandsDesc')}
                    </p>
                    <button onClick={() => setCreating(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--color-pl-brand)', color: '#fff' }}>
                        <Plus size={13} /> {t('createNow')}
                    </button>
                </div>
            )}

            {/* Band list */}
            {!loading && bands.map(band => (
                <BandCard
                    key={band.id}
                    band={band}
                    onUpdated={updated => setBands(prev => prev.map(b => b.id === updated.id ? updated : b))}
                    onDeleted={id => setBands(prev => prev.filter(b => b.id !== id))}
                    t={t}
                    currFmt={currFmt}
                />
            ))}
        </div>
    )
}
