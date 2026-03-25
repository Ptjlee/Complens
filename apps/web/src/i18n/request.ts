import { getRequestConfig } from 'next-intl/server'

// CompLens is a German-first product — always serve German messages.
// If multi-language support is added later, derive locale from the DB
// member.preferred_language column instead of a browser cookie.
export default getRequestConfig(async () => {
    const locale = 'de'
    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    }
})
