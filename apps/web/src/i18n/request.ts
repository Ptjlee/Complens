import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { routing } from './routing'

export default getRequestConfig(async () => {
    // Read locale from a cookie instead of URL
    const cookieStore = await cookies()
    const localeParams = cookieStore.get('locale')?.value
    let locale = 'de'

    if (localeParams && (routing.locales as readonly string[]).includes(localeParams)) {
        locale = localeParams
    }

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    }
})
