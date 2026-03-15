'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[dashboard] Unhandled error:', error)
    }, [error])

    return (
        <div className="flex-1 flex items-center justify-center p-8">
            <div className="glass-card p-8 max-w-md w-full text-center">
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                    <AlertTriangle size={24} style={{ color: 'var(--color-pl-red)' }} />
                </div>

                <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Etwas ist schiefgelaufen
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {error.message || 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'}
                </p>

                {error.digest && (
                    <p className="text-xs mb-4 font-mono" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Fehler-ID: {error.digest}
                    </p>
                )}

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="btn-primary"
                    >
                        <RefreshCw size={14} />
                        Erneut versuchen
                    </button>
                    <a
                        href="/dashboard"
                        className="btn-secondary"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                            background: 'var(--theme-pl-action-ghost)',
                            border: '1px solid var(--color-pl-border)',
                            color: 'var(--color-pl-text-secondary)',
                        }}
                    >
                        Zur Übersicht
                    </a>
                </div>
            </div>
        </div>
    )
}
