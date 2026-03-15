'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '../actions'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        const result = await login(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
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
                <h1 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                    Willkommen zurück
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    Melden Sie sich an, um Ihre Entgeltanalysen zu öffnen.
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

                {/* Email */}
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: 'var(--color-pl-text-secondary)' }}
                    >
                        E-Mail-Adresse
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="name@unternehmen.de"
                        className="input-base"
                    />
                </div>

                {/* Password */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label
                            htmlFor="password"
                            className="text-sm font-medium"
                            style={{ color: 'var(--color-pl-text-secondary)' }}
                        >
                            Passwort
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-xs font-medium hover:underline"
                            style={{ color: 'var(--color-pl-brand-light)' }}
                        >
                            Passwort vergessen?
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            placeholder="••••••••"
                            className="input-base pr-10"
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
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full mt-2"
                    style={{ opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? (
                        <><Loader2 size={15} className="animate-spin" /> Wird angemeldet…</>
                    ) : (
                        'Anmelden'
                    )}
                </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ background: 'var(--color-pl-border)' }} />
                <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>oder</span>
                <div className="flex-1 h-px" style={{ background: 'var(--color-pl-border)' }} />
            </div>

            {/* Signup link */}
            <p className="text-center text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                Noch kein Konto?{' '}
                <Link
                    href="/signup"
                    className="font-semibold hover:underline"
                    style={{ color: 'var(--color-pl-brand-light)' }}
                >
                    7 Tage kostenlos testen
                </Link>
            </p>

            {/* GDPR trust note */}
            <p className="text-center text-xs mt-6" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                Ihre Daten werden ausschließlich auf EU-Servern in Frankfurt gespeichert.
            </p>
        </div>
    )
}
