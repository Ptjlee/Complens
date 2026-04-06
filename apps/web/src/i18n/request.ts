import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import messagesDE from '@messages/de.json'
import messagesEN from '@messages/en.json'

// CompLens reads the user's preferred language from the NEXT_LOCALE cookie.
// The cookie is set by /api/profile/language and by the dashboard layout.
// Falls back to 'de' (German-first product).
export default getRequestConfig(async () => {
    const cookieStore = await cookies()
    const raw = cookieStore.get('NEXT_LOCALE')?.value
    const locale = raw === 'en' ? 'en' : 'de'
    return {
        locale,
        messages: locale === 'en' ? messagesEN : messagesDE,
    }
})
