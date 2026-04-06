'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signup } from '../actions'
import { ArrowRight, Building2, CheckCircle2, ChevronLeft, Loader2, Users, Eye, EyeOff, Check } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useTranslations } from 'next-intl'

type Step = 1 | 2 | 3 | 4
type FormData = {
    firstName: string
    lastName: string
    email: string
    companyName: string
    companySize: string
    hris: string
    urgency: string
    password?: string
    confirmPassword?: string
}

export default function ApplyPage() {
    const router = useRouter()
    const t = useTranslations('auth')
    const tApply = useTranslations('apply')
    const [step, setStep] = useState<Step>(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        companyName: '',
        companySize: '',
        hris: '',
        urgency: '',
        password: '',
        confirmPassword: '',
    })

    const passwordRules = [
        { label: t('passwordRule8Chars'), test: (p: string) => p.length >= 8 },
        { label: t('passwordRuleNumber'), test: (p: string) => /\d/.test(p) },
    ]

    const updateForm = (data: Partial<FormData>) => {
        setFormData((prev) => ({ ...prev, ...data }))
    }

    const nextStep = () => setStep((prev) => Math.min(prev + 1, 4) as Step)
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1) as Step)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (step < 4) {
            nextStep()
            return
        }

        setLoading(true)
        setError(null)

        try {
            await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
        } catch (e) {
            console.error('Failed to submit lead', e)
        }

        const fd = new window.FormData()
        fd.append('email', formData.email)
        fd.append('password', formData.password || '')
        fd.append('confirmPassword', formData.confirmPassword || '')
        fd.append('companyName', formData.companyName)
        fd.append('firstName', formData.firstName)
        fd.append('lastName', formData.lastName)

        const result = await signup(fd)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
            return
        }

        // If it succeeds, signup() redirects automatically to /signup/check-email.
    }

    const companySizeOptions = [
        { value: '<100', label: tApply('sizeUnder100'), desc: tApply('sizeUnder100Desc') },
        { value: '100-149', label: tApply('size100to149'), desc: tApply('size100to149Desc') },
        { value: '150-249', label: tApply('size150to249'), desc: tApply('size150to249Desc') },
        { value: '250+', label: tApply('size250plus'), desc: tApply('size250plusDesc') },
    ]

    const hrisOptions = [
        { value: 'sap', label: tApply('hrisSap'), desc: tApply('hrisSapDesc') },
        { value: 'workday', label: tApply('hrisWorkday'), desc: tApply('hrisWorkdayDesc') },
        { value: 'personio', label: tApply('hrisPersonio'), desc: tApply('hrisPersonioDesc') },
        { value: 'excel', label: tApply('hrisExcel'), desc: tApply('hrisExcelDesc') },
        { value: 'other', label: tApply('hrisOther'), desc: tApply('hrisOtherDesc') },
    ]

    const urgencyOptions = [
        { value: 'critical', label: tApply('urgencyCritical'), desc: tApply('urgencyCriticalDesc') },
        { value: 'soon', label: tApply('urgencySoon'), desc: tApply('urgencySoonDesc') },
        { value: 'exploring', label: tApply('urgencyExploring'), desc: tApply('urgencyExploringDesc') },
    ]

    return (
        <div>
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                <Logo size={32} />
                <span className="font-bold text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>CompLens</span>
            </div>

            <div className="mb-8">
                <div className="ai-badge inline-flex mb-3">{t('freeTrialBadge')}</div>
                <h1 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                    {step === 1 && tApply('step1Title')}
                    {step === 2 && tApply('step2Title')}
                    {step === 3 && tApply('step3Title')}
                    {step === 4 && tApply('step4Title')}
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {step === 1 && tApply('step1Subtitle')}
                    {step === 2 && tApply('step2Subtitle')}
                    {step === 3 && tApply('step3Subtitle')}
                    {step === 4 && tApply('step4Subtitle')}
                </p>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-2 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-colors duration-300"
                        style={{ background: step >= i ? 'var(--color-pl-brand)' : 'var(--color-pl-surface)' }}
                    />
                ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div
                        className="px-4 py-3 rounded-lg text-sm mb-4 animate-in fade-in"
                        style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            color: 'var(--color-pl-red)',
                        }}
                    >
                        {error}
                    </div>
                )}
                {/* Step 1: Contact */}
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>{tApply('firstName')}</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => updateForm({ firstName: e.target.value })}
                                    className="input-base"
                                    placeholder={tApply('firstNamePlaceholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>{tApply('lastName')}</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => updateForm({ lastName: e.target.value })}
                                    className="input-base"
                                    placeholder={tApply('lastNamePlaceholder')}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>{tApply('workEmail')}</label>
                            <input
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => updateForm({ email: e.target.value })}
                                className="input-base"
                                placeholder={tApply('workEmailPlaceholder')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>{tApply('company')}</label>
                            <input
                                required
                                type="text"
                                value={formData.companyName}
                                onChange={(e) => updateForm({ companyName: e.target.value })}
                                className="input-base"
                                placeholder={tApply('companyPlaceholder')}
                            />
                        </div>
                    </div>
                )}

                {/* Step 2: Company Size */}
                {step === 2 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {companySizeOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    updateForm({ companySize: option.value })
                                    nextStep()
                                }}
                                className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                                    formData.companySize === option.value
                                        ? 'border-transparent bg-[rgba(91,97,255,0.1)]'
                                        : 'hover:border-[#383d54] hover:bg-[#111523]'
                                }`}
                                style={{
                                    borderColor: formData.companySize === option.value ? 'var(--color-pl-brand)' : 'var(--color-pl-border)',
                                    background: formData.companySize === option.value ? 'rgba(99,102,241,0.1)' : 'var(--color-pl-surface)'
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg" style={{ background: 'var(--color-pl-background)', color: 'var(--color-pl-text-secondary)' }}>
                                        {option.value === '<100' ? <Users size={20} /> : <Building2 size={20} />}
                                    </div>
                                    <div>
                                        <div className="font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{option.label}</div>
                                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{option.desc}</div>
                                    </div>
                                </div>
                                {formData.companySize === option.value && (
                                    <CheckCircle2 size={20} style={{ color: 'var(--color-pl-brand)' }} />
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Step 3: HRIS */}
                {step === 3 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {hrisOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    updateForm({ hris: option.value })
                                    nextStep()
                                }}
                                className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                                    formData.hris === option.value
                                        ? 'border-transparent bg-[rgba(91,97,255,0.1)]'
                                        : 'hover:border-[#383d54] hover:bg-[#111523]'
                                }`}
                                style={{
                                    borderColor: formData.hris === option.value ? 'var(--color-pl-brand)' : 'var(--color-pl-border)',
                                    background: formData.hris === option.value ? 'rgba(99,102,241,0.1)' : 'var(--color-pl-surface)'
                                }}
                            >
                                <div>
                                    <div className="font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{option.label}</div>
                                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{option.desc}</div>
                                </div>
                                {formData.hris === option.value && (
                                    <CheckCircle2 size={20} style={{ color: 'var(--color-pl-brand)' }} />
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Step 4: Urgency & Opt-In */}
                {step === 4 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {urgencyOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => updateForm({ urgency: option.value })}
                                className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                                    formData.urgency === option.value
                                        ? 'border-transparent bg-[rgba(91,97,255,0.1)]'
                                        : 'hover:border-[#383d54] hover:bg-[#111523]'
                                }`}
                                style={{
                                    borderColor: formData.urgency === option.value ? 'var(--color-pl-brand)' : 'var(--color-pl-border)',
                                    background: formData.urgency === option.value ? 'rgba(99,102,241,0.1)' : 'var(--color-pl-surface)'
                                }}
                            >
                                <div>
                                    <div className="font-semibold" style={{ color: 'var(--color-pl-text-primary)' }}>{option.label}</div>
                                    <div className="text-xs mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>{option.desc}</div>
                                </div>
                                {formData.urgency === option.value && (
                                    <CheckCircle2 size={20} style={{ color: 'var(--color-pl-brand)' }} />
                                )}
                            </button>
                        ))}

                        {/* Password Creation */}
                        <div className="pt-4 space-y-4">
                            <div className="h-px w-full" style={{ background: 'var(--color-pl-border)' }} />
                            <div>
                                <h3 className="text-base font-bold mb-3 mt-1" style={{ color: 'var(--color-pl-text-primary)' }}>{t('createAccount')}</h3>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('passwordLoginKey')}</label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) => updateForm({ password: e.target.value })}
                                        className="input-base pr-10"
                                        placeholder={t('passwordPlaceholder')}
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
                                {(formData.password || '').length > 0 && (
                                    <ul className="mt-2 space-y-1 text-left">
                                        {passwordRules.map(({ label, test }) => (
                                            <li key={label} className="flex items-center gap-1.5 text-xs">
                                                <Check
                                                    size={11}
                                                    strokeWidth={3}
                                                    style={{ color: test(formData.password || '') ? 'var(--color-pl-green)' : 'var(--color-pl-text-tertiary)' }}
                                                />
                                                <span style={{ color: test(formData.password || '') ? 'var(--color-pl-green)' : 'var(--color-pl-text-tertiary)' }}>
                                                    {label}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-pl-text-secondary)' }}>{t('confirmPassword')}</label>
                                <input
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => updateForm({ confirmPassword: e.target.value })}
                                    className="input-base"
                                    placeholder={t('passwordPlaceholder')}
                                />
                            </div>
                        </div>

                        {/* Terms Opt-in */}
                        <div className="pt-2">
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
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={prevStep}
                            className="flex items-center gap-2 text-sm font-medium transition-colors"
                            style={{ color: 'var(--color-pl-text-secondary)' }}
                        >
                            <ChevronLeft size={16} /> {tApply('back')}
                        </button>
                    ) : (
                        <div className="hidden sm:block"></div>
                    )}

                    <button
                        type="submit"
                        disabled={
                            (step === 1 && (!formData.firstName || !formData.lastName || !formData.email || !formData.companyName)) ||
                            (step === 2 && (!formData.companySize)) ||
                            (step === 3 && (!formData.hris)) ||
                            (step === 4 && (!formData.urgency || !formData.password || !formData.confirmPassword)) ||
                            loading
                        }
                        className="btn-primary w-full sm:w-auto mt-2 sm:mt-0"
                        style={{ opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? (
                            <><Loader2 size={15} className="animate-spin" /> {tApply('processing')}</>
                        ) : step === 4 ? (
                            tApply('startFree')
                        ) : (
                            <>{tApply('next')} <ArrowRight size={16} /></>
                        )}
                    </button>
                </div>
            </form>

            {/* Trial details shown ONLY on final step, just like signup */}
            {step === 4 && (
                <div
                    className="mt-6 p-3 rounded-lg"
                    style={{
                        background: 'rgba(59,130,246,0.06)',
                        border: '1px solid rgba(59,130,246,0.15)',
                    }}
                >
                    <ul className="space-y-1">
                        {([t('trialBullet1'), t('trialBullet2'), t('trialBullet3')] as string[]).map((item) => (
                            <li key={item} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                <CheckCircle2 size={11} strokeWidth={3} style={{ color: 'var(--color-pl-brand-light)', flexShrink: 0 }} />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
