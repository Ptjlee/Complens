'use client'

import { useEffect } from 'react'

/**
 * Sets the NEXT_LOCALE cookie client-side when the DB-stored language
 * doesn't match the current cookie, then reloads so next-intl picks it up.
 */
export default function LocaleSync({ locale }: { locale: string }) {
    useEffect(() => {
        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
        window.location.reload()
    }, [locale])
    return null
}
