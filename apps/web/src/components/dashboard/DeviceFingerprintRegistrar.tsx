'use client'

import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint'

/**
 * Thin client component — just runs the fingerprint hook once per session.
 * Renders nothing visible.
 */
export default function DeviceFingerprintRegistrar() {
    useDeviceFingerprint()
    return null
}
