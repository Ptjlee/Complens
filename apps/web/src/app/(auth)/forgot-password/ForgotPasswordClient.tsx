'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useTranslations } from 'next-intl'
import { sendPasswordResetEmail } from '../actions'

function ForgotPasswordForm() {
    const searchParams = useSearchParams()
    const prefillEmail = searchParams.get('email') ?? ''
    const t = useTranslations('auth')

    const [email, setEmail] = useState(prefillEmail)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sent, setSent] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const result = await sendPasswordResetEmail(email)
        if (result?.error) {
            setError(result.error)
        } else {
            setSent(true)
        }
        setLoading(false)
    }

    // ── Success state ──────────────────────────────────────────────
    if (sent) {
        return (
            <div>
                {/* Mobile logo */}
                <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                    <Logo size={32} />
                    <span className="font-bold text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>CompLens</span>
                </div>

                <div className="text-center">
                    <div
                        className="mx-auto mb-6 w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(59,130,246,0.1)' }}
                    >
                        <Mail size={24} style={{ color: 'var(--color-pl-brand-light)' }} />
                    </div>

                    <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('resetEmailSent')}
                    </h1>
                    <p className="text-sm mb-8" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('resetEmailSentBody')}
                    </p>

                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                        style={{ color: 'var(--color-pl-brand-light)' }}
                    >
                        <ArrowLeft size={14} />
                        {t('backToLogin')}
                    </Link>
                </div>
            </div>
        )
    }

    // ── Form state ─────────────────────────────────────────────────
    return (
        <div>
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                <Logo size={32} />
                <span className="font-bold text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>CompLens</span>
            </div>

            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('forgotPasswordTitle')}
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {t('forgotPasswordSubtitle')}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error */}
                {error && (
                    <div
                        className="px-4 py-3 rounded-lg text-sm"
                        style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            color: 'var(--color-pl-red)',
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Email */}
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--color-pl-text-secondary)' }}
                    >
                        {t('email')}
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder={t('emailPlaceholder')}
                        className="input-base"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full mt-2"
                    style={{ opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? (
                        <><Loader2 size={15} className="animate-spin" /> {t('sendingResetLink')}</>
                    ) : (
                        t('sendResetLink')
                    )}
                </button>
            </form>

            {/* Back to login */}
            <p className="text-center text-sm mt-6" style={{ color: 'var(--color-pl-text-secondary)' }}>
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 font-semibold hover:underline"
                    style={{ color: 'var(--color-pl-brand-light)' }}
                >
                    <ArrowLeft size={14} />
                    {t('backToLogin')}
                </Link>
            </p>

            {/* GDPR trust note */}
            <p className="text-center text-xs mt-6" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                {t('gdprNote')}
            </p>
        </div>
    )
}

export default function ForgotPasswordClient() {
    const t = useTranslations('auth')
    return (
        <Suspense fallback={<div>{t('loading')}</div>}>
            <ForgotPasswordForm />
        </Suspense>
    )
}
