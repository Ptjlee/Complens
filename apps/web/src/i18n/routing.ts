import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
    locales:       ['de', 'en'],
    defaultLocale: 'de',
    // Prefix the default locale only when there's more than one locale
    localePrefix:  'as-needed',
})

export type Locale = (typeof routing.locales)[number]
