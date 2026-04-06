'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { advanceOnboardingStep, completeOnboarding } from '@/app/(dashboard)/dashboard/onboarding/actions'
import { Upload, BarChart2, FileText, CheckCircle, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

// ── Step definitions ─────────────────────────────────────────────────────────

function useSteps() {
    const t = useTranslations('onboarding')

    return [
        {
            id: 1,
            icon: <span style={{ fontSize: 38 }}>👋</span>,
            badge: t('step1Badge'),
            title: t('step1Title'),
            subtitle: t('step1Subtitle'),
            body: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ color: 'var(--color-pl-text-sub)', fontSize: 14, lineHeight: 1.6 }}>
                        {t.rich('step1Body', { strong: (chunks) => <strong>{chunks}</strong> })}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                        {[
                            { icon: '📊', text: t('step1Feature1') },
                            { icon: '🔬', text: t('step1Feature2') },
                            { icon: '📄', text: t('step1Feature3') },
                            { icon: '🛡️', text: t('step1Feature4') },
                        ].map(({ icon, text }) => (
                            <div key={text} style={{
                                background: 'var(--color-pl-surface)',
                                border: '1px solid var(--color-pl-border)',
                                borderRadius: 8,
                                padding: '10px 12px',
                                display: 'flex',
                                gap: 8,
                                alignItems: 'flex-start',
                            }}>
                                <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                                <span style={{ fontSize: 12, color: 'var(--color-pl-text-sub)', lineHeight: 1.5 }}>{text}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{
                        background: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.25)',
                        borderRadius: 8,
                        padding: '10px 14px',
                        fontSize: 12,
                        color: '#60a5fa',
                        lineHeight: 1.6,
                        marginTop: 4,
                    }}>
                        💡 {t.rich('step1Tip', { strong: (chunks) => <strong>{chunks}</strong> })}
                    </div>
                </div>
            ),
        },
        {
            id: 2,
            icon: <Upload size={38} color="var(--color-pl-brand)" />,
            badge: t('step2Badge'),
            title: t('step2Title'),
            subtitle: t('step2Subtitle'),
            body: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <p style={{ color: 'var(--color-pl-text-sub)', fontSize: 14, lineHeight: 1.6 }}>
                        {t.rich('step2Body', { strong: (chunks) => <strong>{chunks}</strong> })}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                            { num: '1', label: t('step2Item1Label'), desc: t('step2Item1Desc') },
                            { num: '2', label: t('step2Item2Label'), desc: t('step2Item2Desc') },
                            { num: '3', label: t('step2Item3Label'), desc: t('step2Item3Desc') },
                            { num: '4', label: t('step2Item4Label'), desc: t('step2Item4Desc') },
                        ].map(({ num, label, desc }) => (
                            <div key={num} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{
                                    width: 26, height: 26, borderRadius: '50%',
                                    background: 'var(--color-pl-brand)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                                }}>{num}</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-pl-text)' }}>{label}</div>
                                    <div style={{ fontSize: 12, color: 'var(--color-pl-text-sub)' }}>{desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{
                        background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)',
                        borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#34d399',
                    }}>
                        {t('step2Required')}
                    </div>
                </div>
            ),
        },
        {
            id: 3,
            icon: <BarChart2 size={38} color="var(--color-pl-brand)" />,
            badge: t('step3Badge'),
            title: t('step3Title'),
            subtitle: t('step3Subtitle'),
            body: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <p style={{ color: 'var(--color-pl-text-sub)', fontSize: 14, lineHeight: 1.6 }}>
                        {t.rich('step3Body', { strong: (chunks) => <strong>{chunks}</strong> })}
                    </p>
                    <div style={{
                        background: 'var(--color-pl-surface)',
                        border: '1px solid var(--color-pl-border)',
                        borderRadius: 8, padding: 14,
                    }}>
                        <div style={{ fontSize: 12, color: 'var(--color-pl-text-sub)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {t('step3WifLabel')}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {[t('step3Wif1'), t('step3Wif2'), t('step3Wif3'), t('step3Wif4'), t('step3Wif5')].map(f => (
                                <span key={f} style={{
                                    background: 'rgba(59,130,246,0.12)',
                                    border: '1px solid rgba(59,130,246,0.25)',
                                    borderRadius: 4, padding: '3px 8px',
                                    fontSize: 11, color: '#60a5fa',
                                }}>{f}</span>
                            ))}
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#f59e0b',
                    }}>
                        {t('step3Warning')}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--color-pl-text-sub)', lineHeight: 1.5 }}>
                        {t('step3Footer')}
                    </p>
                </div>
            ),
        },
        {
            id: 4,
            icon: <FileText size={38} color="var(--color-pl-brand)" />,
            badge: t('step4Badge'),
            title: t('step4Title'),
            subtitle: t('step4Subtitle'),
            body: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <p style={{ color: 'var(--color-pl-text-sub)', fontSize: 14, lineHeight: 1.6 }}>
                        {t.rich('step4Body', { strong: (chunks) => <strong>{chunks}</strong> })}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                            { icon: '📄', fmt: 'PDF', desc: t('step4PdfDesc') },
                            { icon: '📊', fmt: 'PowerPoint', desc: t('step4PptDesc') },
                        ].map(({ icon, fmt, desc }) => (
                            <div key={fmt} style={{
                                background: 'var(--color-pl-surface)',
                                border: '1px solid var(--color-pl-border)',
                                borderRadius: 8, padding: '12px 14px',
                            }}>
                                <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-pl-text)', marginBottom: 4 }}>{fmt}</div>
                                <div style={{ fontSize: 11, color: 'var(--color-pl-text-sub)', lineHeight: 1.5 }}>{desc}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{
                        background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)',
                        borderRadius: 8, padding: '10px 14px',
                        display: 'flex', gap: 10, alignItems: 'center',
                    }}>
                        <CheckCircle size={18} color="#34d399" />
                        <span style={{ fontSize: 13, color: '#34d399', fontWeight: 600 }}>
                            {t('step4Ready')}
                        </span>
                    </div>
                </div>
            ),
        },
    ]
}

// ── Component ────────────────────────────────────────────────────────────────

interface OnboardingModalProps {
    initialStep: number   // from DB (1-4)
}

export default function OnboardingModal({ initialStep }: OnboardingModalProps) {
    const t = useTranslations('onboarding')
    const STEPS = useSteps()
    const TOTAL = STEPS.length

    const [step, setStep] = useState(Math.max(1, Math.min(initialStep, TOTAL)))
    const [dismissed, setDismissed] = useState(false)
    const canGoBack = step > 1
    const [isPending, startTransition] = useTransition()

    if (dismissed) return null

    const current = STEPS[step - 1]
    const isLast = step === TOTAL

    function handleBack() {
        const prevStep = step - 1
        setStep(prevStep)
        startTransition(() => advanceOnboardingStep(prevStep))
    }

    function handleNext() {
        if (isLast) {
            startTransition(async () => {
                await completeOnboarding()
                setDismissed(true)
            })
        } else {
            const nextStep = step + 1
            setStep(nextStep)
            startTransition(() => advanceOnboardingStep(nextStep))
        }
    }

    function handleSkip() {
        startTransition(async () => {
            await completeOnboarding()
            setDismissed(true)
        })
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            animation: 'fadeIn 0.25s ease',
        }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
            `}</style>

            <div style={{
                background: 'var(--color-pl-bg)',
                border: '1px solid var(--color-pl-border)',
                borderRadius: 16,
                width: '100%',
                maxWidth: 560,
                overflow: 'hidden',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                animation: 'slideUp 0.3s ease',
            }}>
                {/* Header bar */}
                <div style={{
                    background: 'var(--color-pl-surface)',
                    borderBottom: '1px solid var(--color-pl-border)',
                    padding: '14px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    {/* Brand */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Logo size={22} />
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-pl-text)' }}>CompLens</span>
                        <span style={{
                            fontSize: 10, color: 'var(--color-pl-text-sub)',
                            background: 'var(--color-pl-bg)',
                            border: '1px solid var(--color-pl-border)',
                            borderRadius: 4, padding: '1px 7px',
                        }}>{t('setup')}</span>
                    </div>

                    {/* Step pills */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {STEPS.map(s => (
                            <div key={s.id} style={{
                                width: step === s.id ? 20 : 7,
                                height: 7, borderRadius: 4,
                                background: s.id <= step ? 'var(--color-pl-brand)' : 'var(--color-pl-border)',
                                transition: 'all 0.3s ease',
                            }} />
                        ))}
                        <span style={{ fontSize: 11, color: 'var(--color-pl-text-sub)', marginLeft: 4 }}>
                            {step}/{TOTAL}
                        </span>
                    </div>

                    {/* Dismiss (only after step 1) */}
                    {step > 1 && (
                        <button onClick={handleSkip} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--color-pl-text-sub)', padding: 4, borderRadius: 4,
                            display: 'flex', alignItems: 'center',
                        }}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div style={{ padding: '28px 28px 20px' }} key={step}>
                    {/* Icon + badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 14,
                            background: 'var(--color-pl-surface)',
                            border: '1px solid var(--color-pl-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            {current.icon}
                        </div>
                        <div>
                            <span style={{
                                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                                color: 'var(--color-pl-brand)', display: 'block', marginBottom: 4,
                            }}>{current.badge}</span>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-pl-text)', lineHeight: 1.2 }}>
                                {current.title}
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-pl-text-sub)' }}>
                                {current.subtitle}
                            </p>
                        </div>
                    </div>

                    {/* Step content */}
                    <div style={{ animation: 'slideUp 0.25s ease' }}>
                        {current.body}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 28px 24px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {canGoBack && (
                            <button
                                onClick={handleBack}
                                disabled={isPending}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    background: 'var(--color-pl-surface)',
                                    border: '1px solid var(--color-pl-border)',
                                    borderRadius: 8, cursor: 'pointer',
                                    fontSize: 13, color: 'var(--color-pl-text-sub)',
                                    fontWeight: 600,
                                    padding: '8px 14px',
                                    opacity: isPending ? 0.6 : 1,
                                }}
                            >
                                <ChevronLeft size={15} />
                                {t('back')}
                            </button>
                        )}
                        {step > 1 && (
                            <button
                                onClick={handleSkip}
                                disabled={isPending}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: 13, color: 'var(--color-pl-text-sub)',
                                    padding: '8px 12px',
                                }}
                            >
                                {t('skip')}
                            </button>
                        )}
                        {step === 1 && <div />}
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={isPending}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: isLast ? 'var(--color-pl-green, #34d399)' : 'var(--color-pl-brand)',
                            color: '#fff',
                            border: 'none', borderRadius: 8, cursor: 'pointer',
                            fontWeight: 700, fontSize: 14,
                            padding: '10px 22px',
                            transition: 'opacity 0.2s',
                            opacity: isPending ? 0.7 : 1,
                        }}
                    >
                        {isLast ? (
                            <>
                                <CheckCircle size={16} />
                                {t('letsGo')}
                            </>
                        ) : (
                            <>
                                {t('next')}
                                <ChevronRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
