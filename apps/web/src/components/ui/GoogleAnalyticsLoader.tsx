'use client'

import { useEffect } from 'react'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/**
 * Injects the GA4 gtag.js script ONLY after the user has accepted cookies.
 *
 * CRITICAL: The gtag stub MUST use `arguments` (not spread ...args).
 * GA4's gtag.js processes IArguments objects from the dataLayer queue.
 * Plain arrays are silently ignored, causing zero network requests.
 */
export default function GoogleAnalyticsLoader() {
    useEffect(() => {
        if (!GA_ID) return

        function loadGA() {
            if (document.getElementById('ga-script')) return // already injected

            // Step 1: Bootstrap dataLayer BEFORE loading the script
            // so the queue is ready when gtag.js reads it on load.
            const w = window as unknown as Record<string, unknown>
            w['dataLayer'] = w['dataLayer'] || []
            const dl = w['dataLayer'] as IArguments[]

            // CRITICAL: must be old-style function — uses `arguments` (IArguments),
            // NOT spread params. GA4 gtag.js distinguishes the two.
            /* eslint-disable prefer-rest-params */
            w['gtag'] = function gtag() { dl.push(arguments as unknown as IArguments) }
            /* eslint-enable prefer-rest-params */

            const g = w['gtag'] as (...a: unknown[]) => void
            g('js', new Date())
            g('config', GA_ID)

            // Step 2: Load gtag.js — by the time it executes, dataLayer
            // already has [js, Date] and [config, GA_ID] queued.
            const script = document.createElement('script')
            script.id = 'ga-script'
            script.async = true
            script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
            document.head.appendChild(script)
        }

        // Check current consent
        const consent = localStorage.getItem('complens_cookie_consent')
        if (consent === 'granted') {
            loadGA()
            return
        }

        // Poll for same-tab consent updates (storage events don't fire for the originating tab)
        const interval = setInterval(() => {
            if (localStorage.getItem('complens_cookie_consent') === 'granted') {
                clearInterval(interval)
                loadGA()
            }
        }, 500)

        // Also listen for cross-tab consent changes
        function onStorage(e: StorageEvent) {
            if (e.key === 'complens_cookie_consent' && e.newValue === 'granted') {
                clearInterval(interval)
                loadGA()
            }
        }
        window.addEventListener('storage', onStorage)

        return () => {
            clearInterval(interval)
            window.removeEventListener('storage', onStorage)
        }
    }, [])

    return null
}
