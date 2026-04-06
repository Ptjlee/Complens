'use client'

import { useState, useEffect } from 'react'

const LANGS = [
    { code: 'de', label: 'DE', flag: '\u{1F1E9}\u{1F1EA}' },
    { code: 'en', label: 'EN', flag: '\u{1F1EC}\u{1F1E7}' },
] as const

export function LanguageSwitcher() {
    const [locale, setLocale] = useState<string>('de')

    useEffect(() => {
        const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
        if (match?.[1] === 'en') setLocale('en')
    }, [])

    function handleSwitch(code: string) {
        if (code === locale) return
        document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
        window.location.reload()
    }

    return (
        <div className="flex gap-1.5">
            {LANGS.map((l) => {
                const active = locale === l.code
                return (
                    <button
                        key={l.code}
                        type="button"
                        onClick={() => handleSwitch(l.code)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
                        style={{
                            background: active ? 'var(--color-pl-brand)' : 'transparent',
                            border: `1px solid ${active ? 'var(--color-pl-brand)' : 'var(--color-pl-border)'}`,
                            color: active ? '#fff' : 'var(--color-pl-text-secondary)',
                        }}
                    >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                    </button>
                )
            })}
        </div>
    )
}
