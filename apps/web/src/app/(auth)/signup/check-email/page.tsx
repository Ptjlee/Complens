'use client'

import Link from 'next/link'
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useState, useEffect, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { resendVerification } from '@/app/(auth)/actions'

const COOLDOWN_SECONDS = 60

function CheckEmailContent() {
    const searchParams = useSearchParams()
    const emailParam = searchParams.get('email') ?? ''

    const [email, setEmail] = useState(emailParam)
    const [cooldown, setCooldown] = useState(0)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')
    const [isPending, startTransition] = useTransition()

    // Countdown timer
    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [cooldown])

    async function handleResend() {
        setStatus('idle')
        setErrorMsg('')
        startTransition(async () => {
            const result = await resendVerification(email)
            if (result.error) {
                setStatus('error')
                setErrorMsg(result.error)
            } else {
                setStatus('success')
                setCooldown(COOLDOWN_SECONDS)
            }
        })
    }

    const canResend = !isPending && cooldown === 0 && email.includes('@')

    return (
        <div className="text-center">
            {/* Icon */}
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.2)',
                }}
            >
                <Mail size={28} style={{ color: 'var(--color-pl-brand-light)' }} />
            </div>

            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                Bitte bestätigen Sie Ihre E-Mail
            </h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-pl-text-secondary)' }}>
                Wir haben Ihnen einen Bestätigungslink gesendet.<br />
                Bitte prüfen Sie Ihren Posteingang und klicken Sie auf den Link, um Ihr Konto zu aktivieren.
            </p>

            {/* Info box */}
            <div
                className="p-4 rounded-xl text-sm text-left mb-6"
                style={{
                    background: 'rgba(59,130,246,0.06)',
                    border: '1px solid rgba(59,130,246,0.15)',
                    color: 'var(--color-pl-text-secondary)',
                }}
            >
                <strong style={{ color: 'var(--color-pl-text-primary)' }}>Keine E-Mail erhalten?</strong><br />
                Prüfen Sie Ihren Spam-Ordner. Die E-Mail kommt von{' '}
                <span style={{ color: 'var(--color-pl-brand-light)' }}>hallo@paylens.de</span>.
            </div>

            {/* Resend section */}
            <div className="mb-6">
                {/* Email input — prefilled but editable */}
                <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setStatus('idle') }}
                    placeholder="Ihre E-Mail-Adresse"
                    className="input-field w-full mb-3"
                    style={{ textAlign: 'center' }}
                />

                {/* Resend button */}
                <button
                    onClick={handleResend}
                    disabled={!canResend}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    style={!canResend ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                    <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} />
                    {isPending
                        ? 'Wird gesendet…'
                        : cooldown > 0
                            ? `Erneut senden in ${cooldown}s`
                            : 'Bestätigungs-E-Mail erneut senden'}
                </button>

                {/* Success message */}
                {status === 'success' && (
                    <div
                        className="mt-3 p-3 rounded-xl text-sm flex items-center gap-2"
                        style={{
                            background: 'rgba(16,185,129,0.08)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            color: '#10b981',
                        }}
                    >
                        <CheckCircle size={16} />
                        E-Mail wurde erneut gesendet. Bitte prüfen Sie Ihren Posteingang.
                    </div>
                )}

                {/* Error message */}
                {status === 'error' && (
                    <div
                        className="mt-3 p-3 rounded-xl text-sm flex items-center gap-2"
                        style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: '#ef4444',
                        }}
                    >
                        <AlertCircle size={16} />
                        {errorMsg}
                    </div>
                )}
            </div>

            <Link href="/login" className="btn-outline inline-flex">
                Zurück zur Anmeldung
            </Link>
        </div>
    )
}

export default function CheckEmailPage() {
    return (
        <Suspense fallback={<div className="text-center" style={{ color: 'var(--color-pl-text-secondary)' }}>Laden…</div>}>
            <CheckEmailContent />
        </Suspense>
    )
}
