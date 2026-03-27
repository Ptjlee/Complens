'use client'

import { useEffect } from 'react'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/**
 * Injects the GA4 gtag.js script ONLY after the user has accepted cookies.
 * This avoids all Consent Mode complexity — the script simply never loads
 * until consent is granted.
 *
 * On first visit: the CookieBanner is shown; GA is not loaded.
 * After acceptance: localStorage is set to 'granted', script injected.
 * On return visits: consent is already 'granted', script loads immediately.
 */
export default function GoogleAnalyticsLoader() {
    useEffect(() => {
        if (!GA_ID) return

        function loadGA() {
            if (document.getElementById('ga-script')) return // already loaded

            // Inject gtag.js
            const script = document.createElement('script')
            script.id = 'ga-script'
            script.async = true
            script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
            document.head.appendChild(script)

            // Bootstrap dataLayer and gtag on window using a safe cast
            const win = window as unknown as Record<string, unknown>
            if (!Array.isArray(win['dataLayer'])) win['dataLayer'] = []
            const dataLayer = win['dataLayer'] as unknown[]
            win['gtag'] = function gtag(...args: unknown[]) { dataLayer.push(args) }
            const g = win['gtag'] as (...args: unknown[]) => void
            g('js', new Date())
            g('config', GA_ID)
        }

        // Check current consent
        const consent = localStorage.getItem('complens_cookie_consent')
        if (consent === 'granted') {
            loadGA()
            return
        }

        // Listen for consent being granted later (cross-tab)
        function onStorage(e: StorageEvent) {
            if (e.key === 'complens_cookie_consent' && e.newValue === 'granted') {
                loadGA()
            }
        }
        window.addEventListener('storage', onStorage)

        // Poll for same-tab updates (storage events don't fire for the originating tab)
        const interval = setInterval(() => {
            if (localStorage.getItem('complens_cookie_consent') === 'granted') {
                clearInterval(interval)
                loadGA()
            }
        }, 500)

        return () => {
            window.removeEventListener('storage', onStorage)
            clearInterval(interval)
        }
    }, [])

    return null
}
