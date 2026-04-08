'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Check, ArrowLeft, AlertTriangle } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const t = useTranslations('auth')

    const code = searchParams.get('code')

    const [showPassword, setShowPassword] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sessionReady, setSessionReady] = useState(false)
    const [exchanging, setExchanging] = useState(true)
    const [exchangeError, setExchangeError] = useState(false)

    const passwordRules = [
        { label: t('passwordRule8Chars'), test: (p: string) => p.length >= 8 },
        { label: t('passwordRuleNumber'), test: (p: string) => /\d/.test(p) },
    ]

    // Exchange the code for a session on mount
    useEffect(() => {
        async function exchange() {
            if (!code) {
                setExchanging(false)
                setExchangeError(true)
                return
            }

            const supabase = createClient()
            const { error: err } = await supabase.auth.exchangeCodeForSession(code)

            if (err) {
                setExchangeError(true)
            } else {
                setSessionReady(true)
            }
            setExchanging(false)
        }
        exchange()
    }, [code])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        // Validate
        if (password.length < 8) {
            setError(t('errorPasswordTooShort'))
            return
        }
        if (!/\d/.test(password)) {
            setError(t('errorPasswordNeedsNumber'))
            return
        }
        if (password !== confirmPassword) {
            setError(t('errorPasswordMismatch'))
            return
        }

        setLoading(true)

        const supabase = createClient()
        const { error: updateError } = await supabase.auth.updateUser({ password })

        if (updateError) {
            setError(t('errorPasswordUpdateFailed'))
            setLoading(false)
            return
        }

        // Sign out so the user logs in with their new password
        await supabase.auth.signOut()

        // Redirect to login with success message
        router.push('/login?message=password_reset_success')
    }

    // ── Loading state (exchanging code) ────────────────────────────
    if (exchanging) {
        return (
            <div className="text-center py-12">
                <Loader2 size={24} className="animate-spin mx-auto mb-4" style={{ color: 'var(--color-pl-brand-light)' }} />
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {t('loading')}
                </p>
            </div>
        )
    }

    // ── Expired / invalid link ─────────────────────────────────────
    if (exchangeError) {
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
                        style={{ background: 'rgba(239,68,68,0.1)' }}
                    >
                        <AlertTriangle size={24} style={{ color: 'var(--color-pl-red)' }} />
                    </div>

                    <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                        {t('resetLinkExpired')}
                    </h1>
                    <p className="text-sm mb-8" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t('resetLinkExpiredBody')}
                    </p>

                    <div className="flex flex-col items-center gap-3">
                        <Link
                            href="/forgot-password"
                            className="btn-primary inline-flex"
                        >
                            {t('sendResetLink')}
                        </Link>
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
            </div>
        )
    }

    // ── Password reset form ────────────────────────────────────────
    return (
        <div>
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                <Logo size={32} />
                <span className="font-bold text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>CompLens</span>
            </div>

            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('resetPasswordTitle')}
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {t('resetPasswordSubtitle')}
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

                {/* New password */}
                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--color-pl-text-secondary)' }}
                    >
                        {t('newPassword')}
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            placeholder={t('passwordPlaceholder')}
                            className="input-base pr-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                            style={{ color: 'var(--color-pl-text-tertiary)' }}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {/* Password strength indicators */}
                    {password.length > 0 && (
                        <ul className="mt-2 space-y-1">
                            {passwordRules.map(({ label, test }) => (
                                <li key={label} className="flex items-center gap-1.5 text-xs">
                                    <Check
                                        size={11}
                                        strokeWidth={3}
                                        style={{ color: test(password) ? 'var(--color-pl-green)' : 'var(--color-pl-text-tertiary)' }}
                                    />
                                    <span style={{ color: test(password) ? 'var(--color-pl-green)' : 'var(--color-pl-text-tertiary)' }}>
                                        {label}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Confirm password */}
                <div>
                    <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--color-pl-text-secondary)' }}
                    >
                        {t('confirmNewPassword')}
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        placeholder={t('passwordPlaceholder')}
                        className="input-base"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                        <><Loader2 size={15} className="animate-spin" /> {t('resettingPassword')}</>
                    ) : (
                        t('resetPassword')
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
        </div>
    )
}

export default function ResetPasswordClient() {
    const t = useTranslations('auth')
    return (
        <Suspense fallback={<div>{t('loading')}</div>}>
            <ResetPasswordForm />
        </Suspense>
    )
}
