'use client'

import { useRef, useEffect, useState } from 'react'
import { Sparkles, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'
import type { TourStep } from './tourSteps'

interface TourTooltipProps {
    step: TourStep
    currentStep: number
    totalSteps: number
    targetRect: DOMRect | null
    onNext: () => void
    onBack: () => void
    onSkip: () => void
    t: (key: string, values?: Record<string, string | number>) => string
}

export default function TourTooltip({
    step, currentStep, totalSteps, targetRect, onNext, onBack, onSkip, t,
}: TourTooltipProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
    const isCentered = !targetRect

    useEffect(() => {
        if (isCentered || !targetRect || !ref.current) { setPos(null); return }
        const tooltip = ref.current.getBoundingClientRect()
        let top = targetRect.top
        let left = targetRect.right + 16
        // Prevent overflow right
        if (left + tooltip.width > window.innerWidth - 16) {
            left = targetRect.left - tooltip.width - 16
        }
        // Prevent overflow bottom
        if (top + tooltip.height > window.innerHeight - 16) {
            top = window.innerHeight - tooltip.height - 16
        }
        if (top < 16) top = 16
        setPos({ top, left })
    }, [targetRect, isCentered, currentStep])

    const isWelcome = step.id === 'welcome'
    const isComplete = step.id === 'complete'
    const width = isCentered ? 480 : 320

    const cardStyle: React.CSSProperties = {
        position: isCentered ? 'fixed' : 'fixed',
        zIndex: 9999,
        width,
        maxWidth: 'calc(100vw - 32px)',
        background: 'var(--color-pl-surface)',
        border: '1px solid var(--color-pl-border)',
        borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        padding: 24,
        backdropFilter: 'blur(16px)',
        animation: 'tourSlideUp 0.3s ease',
        ...(isCentered
            ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            : pos
                ? { top: pos.top, left: pos.left, transition: 'top 0.35s ease, left 0.35s ease' }
                : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }),
    }

    return (
        <>
            <style>{`
                @keyframes tourSlideUp { from { opacity: 0; transform: translate(-50%, -48%) } to { opacity: 1; transform: translate(-50%, -50%) } }
            `}</style>
            <div ref={ref} style={cardStyle}>
                {/* Arrow for spotlight steps */}
                {!isCentered && pos && (
                    <div style={{
                        position: 'absolute', top: 24, left: -8,
                        width: 0, height: 0,
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent',
                        borderRight: '8px solid var(--color-pl-border)',
                    }} />
                )}

                {/* Icon for centered steps */}
                {isWelcome && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                        <Sparkles size={48} style={{ color: 'var(--color-pl-brand)' }} />
                    </div>
                )}
                {isComplete && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                        <CheckCircle2 size={48} style={{ color: '#34d399' }} />
                    </div>
                )}

                {/* Step counter for spotlight steps */}
                {!isCentered && (
                    <div style={{ fontSize: 11, color: 'var(--color-pl-text-tertiary)', marginBottom: 8, fontWeight: 600 }}>
                        {t('stepOf', { current: String(currentStep + 1), total: String(totalSteps) })}
                    </div>
                )}

                {/* Welcome subtitle */}
                {isWelcome && (
                    <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-pl-text-tertiary)', marginBottom: 4 }}>
                        {t('welcome.subtitle')}
                    </p>
                )}

                {/* Title */}
                <h2 style={{
                    margin: 0, fontSize: isCentered ? 22 : 16, fontWeight: 700,
                    color: 'var(--color-pl-text-primary)', lineHeight: 1.3,
                    textAlign: isCentered ? 'center' : 'left',
                    marginBottom: 8,
                }}>
                    {t(step.titleKey)}
                </h2>

                {/* Body */}
                <p style={{
                    margin: 0, fontSize: 14, lineHeight: 1.6,
                    color: 'var(--color-pl-text-secondary)',
                    textAlign: isCentered ? 'center' : 'left',
                    marginBottom: 20,
                }}>
                    {t(step.bodyKey)}
                </p>

                {/* Actions */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: isCentered ? 'center' : 'space-between',
                    gap: 8, flexWrap: 'wrap',
                }}>
                    {/* Left: back + skip */}
                    {!isCentered && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {currentStep > 1 && (
                                <button onClick={onBack} style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    background: 'none', border: '1px solid var(--color-pl-border)',
                                    borderRadius: 10, cursor: 'pointer', fontSize: 13,
                                    color: 'var(--color-pl-text-tertiary)', fontWeight: 600, padding: '7px 12px',
                                }}>
                                    <ChevronLeft size={14} /> {t('back')}
                                </button>
                            )}
                            <button onClick={onSkip} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: 12, color: 'var(--color-pl-text-tertiary)', padding: '7px 8px',
                            }}>
                                {t('skip')}
                            </button>
                        </div>
                    )}

                    {/* Welcome actions */}
                    {isWelcome && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%' }}>
                            <button onClick={onNext} style={primaryBtnStyle}>
                                {t('welcome.startTour')} <ChevronRight size={16} />
                            </button>
                            <button onClick={onSkip} style={skipBtnStyle}>{t('welcome.skipTour')}</button>
                        </div>
                    )}

                    {/* Complete actions */}
                    {isComplete && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%' }}>
                            <button onClick={onNext} style={{ ...primaryBtnStyle, background: '#34d399' }}>
                                <CheckCircle2 size={16} /> {t('complete.cta')}
                            </button>
                        </div>
                    )}

                    {/* Spotlight step CTA / Next */}
                    {!isCentered && (
                        <button onClick={onNext} style={primaryBtnStyle}>
                            {step.ctaKey ? t(step.ctaKey) : t('next')} <ChevronRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}

const primaryBtnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'var(--color-pl-brand)', color: '#fff', border: 'none',
    borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14,
    padding: '10px 22px', transition: 'opacity 0.2s',
}

const skipBtnStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, color: 'var(--color-pl-text-tertiary)', padding: '6px 12px',
}
