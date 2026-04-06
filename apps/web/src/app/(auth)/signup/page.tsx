'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '../actions'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { trackSignup } from '@/lib/analytics'
import { useTranslations } from 'next-intl'

export default function SignupPage() {
    const t = useTranslations('auth')
    const [showPassword, setShowPassword] = useState(false)
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const passwordRules = [
        { label: t('passwordRule8Chars'), test: (p: string) => p.length >= 8 },
        { label: t('passwordRuleNumber'), test: (p: string) => /\d/.test(p) },
    ]

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        const result = await signup(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else {
            trackSignup()
        }
    }

    return (
        <div>
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                <Logo size={32} />
                <span className="font-bold text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>CompLens</span>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <div className="ai-badge inline-flex">{t('freeTrialBadge')}</div>
                    <LanguageSwitcher />
                </div>
                <h1 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {t('createAccount')}
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {t('signupSubtitle')}
                </p>
            </div>

            <form action={handleSubmit} className="space-y-4">
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

                {/* Company name */}
                <div>
                    <label
                        htmlFor="companyName"
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--color-pl-text-secondary)' }}
                    >
                        {t('companyName')}
                    </label>
                    <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        autoComplete="organization"
                        required
                        placeholder={t('companyPlaceholder')}
                        className="input-base"
                    />
                </div>

                {/* Email */}
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--color-pl-text-secondary)' }}
                    >
                        {t('businessEmail')}
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder={t('emailPlaceholder')}
                        className="input-base"
                    />
                </div>

                {/* Password */}
                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--color-pl-text-secondary)' }}
                    >
                        {t('password')}
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
                        {t('confirmPassword')}
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        placeholder={t('passwordPlaceholder')}
                        className="input-base"
                    />
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        name="terms"
                        required
                        className="mt-0.5 w-4 h-4 rounded accent-blue-500 flex-shrink-0"
                    />
                    <span className="text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                        {t.rich('terms', {
                            agbLink: (chunks) => <a href="/agb" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>{chunks}</a>,
                            datenschutzLink: (chunks) => <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>{chunks}</a>,
                        })}
                    </span>
                </label>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full mt-2"
                    style={{ opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? (
                        <><Loader2 size={15} className="animate-spin" /> {t('creatingAccount')}</>
                    ) : (
                        t('startTrialBtn')
                    )}
                </button>
            </form>

            {/* Trial details */}
            <div
                className="mt-5 p-3 rounded-lg"
                style={{
                    background: 'rgba(59,130,246,0.06)',
                    border: '1px solid rgba(59,130,246,0.15)',
                }}
            >
                <ul className="space-y-1">
                    {([t('trialBullet1'), t('trialBullet2'), t('trialBullet3')] as string[]).map((item) => (
                        <li key={item} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            <Check size={11} strokeWidth={3} style={{ color: 'var(--color-pl-brand-light)', flexShrink: 0 }} />
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Login link */}
            <p className="text-center text-sm mt-6" style={{ color: 'var(--color-pl-text-secondary)' }}>
                {t('alreadyHaveAccount')}{' '}
                <Link
                    href="/login"
                    className="font-semibold hover:underline"
                    style={{ color: 'var(--color-pl-brand-light)' }}
                >
                    {t('loginLink')}
                </Link>
            </p>
        </div>
    )
}
