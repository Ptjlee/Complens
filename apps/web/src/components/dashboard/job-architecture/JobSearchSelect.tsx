'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, Search } from 'lucide-react'

export type JobOption = { id: string; title: string; level_code: string | null }

export default function JobSearchSelect({
    jobs, value, onChange, disabled, placeholder,
}: {
    jobs: JobOption[]
    value: string | null
    onChange: (jobId: string) => void
    disabled: boolean
    placeholder?: string
}) {
    const t = useTranslations('jobArchitecture')
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const ref = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Close on outside click
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    // Focus search input on open
    useEffect(() => {
        if (open) inputRef.current?.focus()
    }, [open])

    const selected = jobs.find(j => j.id === value)
    const q = search.toLowerCase().trim()
    const filtered = q
        ? jobs.filter(j => j.title.toLowerCase().includes(q) || (j.level_code ?? '').toLowerCase().includes(q))
        : jobs

    const label = selected
        ? (selected.level_code ? `${selected.level_code} — ${selected.title}` : selected.title)
        : (placeholder ?? '—')

    return (
        <div ref={ref} className="relative inline-flex">
            <button
                type="button"
                onClick={() => { if (!disabled) { setOpen(o => !o); setSearch('') } }}
                disabled={disabled}
                className="appearance-none flex items-center gap-1 pl-2 pr-5 py-0.5 text-xs rounded cursor-pointer max-w-[220px] truncate text-left"
                style={{
                    background: 'var(--color-pl-surface-raised)',
                    border: '1px solid var(--color-pl-border)',
                    color: selected ? 'var(--color-pl-text-primary)' : 'var(--color-pl-text-tertiary)',
                }}
            >
                <span className="truncate">{label}</span>
                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-pl-text-tertiary)' }} />
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-1 z-50 rounded-lg shadow-lg overflow-hidden"
                    style={{ background: 'var(--color-pl-surface)', border: '1px solid var(--color-pl-border)', width: '280px' }}>
                    {/* Search input */}
                    <div className="p-1.5" style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                        <div className="relative">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2"
                                style={{ color: 'var(--color-pl-text-tertiary)' }} />
                            <input
                                ref={inputRef}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={t('searchPlaceholder')}
                                className="w-full text-xs pl-7 pr-2 py-1.5 rounded"
                                style={{ background: 'var(--color-pl-surface-raised)', color: 'var(--color-pl-text-primary)', border: '1px solid var(--color-pl-border)' }}
                            />
                        </div>
                    </div>

                    {/* Options list */}
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length === 0 && (
                            <div className="px-3 py-2 text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                {t('noResults')}
                            </div>
                        )}
                        {filtered.map(j => {
                            const isSelected = j.id === value
                            return (
                                <button
                                    key={j.id}
                                    type="button"
                                    onClick={() => { onChange(j.id); setOpen(false); setSearch('') }}
                                    className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:opacity-80"
                                    style={{
                                        background: isSelected ? 'var(--color-pl-brand)' : 'transparent',
                                        color: isSelected ? '#fff' : 'var(--color-pl-text-primary)',
                                    }}
                                >
                                    {j.level_code && (
                                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] flex-shrink-0"
                                            style={{
                                                background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--color-pl-surface-raised)',
                                                color: isSelected ? '#fff' : 'var(--color-pl-brand-light)',
                                                border: isSelected ? 'none' : '1px solid var(--color-pl-border)',
                                            }}>
                                            {j.level_code}
                                        </span>
                                    )}
                                    <span className="truncate">{j.title}</span>
                                    {isSelected && <span className="ml-auto flex-shrink-0">✓</span>}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
