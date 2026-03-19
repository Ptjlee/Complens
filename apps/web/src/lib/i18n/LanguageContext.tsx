'use client'

/**
 * CompLens i18n — React context + hook
 *
 * Server-side: the layout reads preferred_language from the DB and passes it
 *              as a prop to <LanguageProvider>.
 * Client-side: components call useTranslation() to get t() and lang.
 *              Updating the language saves to the DB via /api/profile/language
 *              and updates context instantly (optimistic).
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { type Lang, type TranslationKey, translate } from './translations'

// ─── Context ─────────────────────────────────────────────────────────────────
type LanguageContextValue = {
    lang:      Lang
    setLang:   (l: Lang) => Promise<void>
    t:         (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue>({
    lang:    'de',
    setLang: async () => {},
    t:       (key) => key,
})

// ─── Provider ────────────────────────────────────────────────────────────────
export function LanguageProvider({
    initialLang = 'de',
    children,
}: {
    initialLang?: Lang
    children: ReactNode
}) {
    const [lang, setLangState] = useState<Lang>(initialLang)

    const setLang = useCallback(async (newLang: Lang) => {
        // Optimistic update — update UI immediately
        setLangState(newLang)

        // Persist to DB via API
        try {
            await fetch('/api/profile/language', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ language: newLang }),
            })
        } catch {
            // Silently fail — UI still uses optimistic value
        }
    }, [])

    const t = useCallback(
        (key: TranslationKey) => translate(key, lang),
        [lang],
    )

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useTranslation() {
    return useContext(LanguageContext)
}
