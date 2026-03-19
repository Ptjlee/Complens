'use client'

/**
 * useDeviceFingerprint
 * ─────────────────────
 * Runs once in the dashboard layout after auth.
 * Generates a stable browser fingerprint from public signals and
 * calls the server action to register/update this device.
 *
 * Why this approach:
 *  - No 3rd-party library needed
 *  - Fingerprint is client-side only (never sent raw — only hashed)
 *  - Stored per user in device_sessions table
 *  - Max 3 trusted devices per user, oldest auto-rotated
 */

import { useEffect } from 'react'
import { registerDevice } from '@/app/(dashboard)/dashboard/settings/actions'

async function generateFingerprint(): Promise<{ hash: string; label: string }> {
    const ua         = navigator.userAgent
    const lang       = navigator.language
    const tz         = Intl.DateTimeFormat().resolvedOptions().timeZone
    const screen     = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
    const platform   = navigator.platform ?? 'unknown'
    const cores      = navigator.hardwareConcurrency ?? 0
    const touchPts   = navigator.maxTouchPoints ?? 0

    const raw = [ua, lang, tz, screen, platform, cores, touchPts].join('|')

    // SHA-256 via Web Crypto API (available in all modern browsers)
    const encoded = new TextEncoder().encode(raw)
    const buf     = await crypto.subtle.digest('SHA-256', encoded)
    const arr     = Array.from(new Uint8Array(buf))
    const hash    = arr.map(b => b.toString(16).padStart(2, '0')).join('')

    // Build a human-readable label
    const browser = (() => {
        if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
        if (ua.includes('Firefox'))  return 'Firefox'
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
        if (ua.includes('Edg'))      return 'Edge'
        return 'Browser'
    })()
    const os = (() => {
        if (ua.includes('Mac'))     return 'macOS'
        if (ua.includes('Windows')) return 'Windows'
        if (ua.includes('Linux'))   return 'Linux'
        if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
        if (ua.includes('Android')) return 'Android'
        return platform
    })()

    return { hash, label: `${os} — ${browser}` }
}

export function useDeviceFingerprint() {
    useEffect(() => {
        // Fire-and-forget — DevTools errors are swallowed, never blocks UI
        generateFingerprint()
            .then(({ hash, label }) => registerDevice(hash, label))
            .catch(() => { /* non-critical */ })
    }, []) // Run once per page load / session
}
