'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { TOUR_STEPS } from './tourSteps'
import TourSpotlight from './TourSpotlight'
import TourTooltip from './TourTooltip'
import { useTargetRect } from './TourSpotlight'
import { advanceOnboardingStep, completeOnboarding } from '@/app/(dashboard)/dashboard/onboarding/actions'

interface GuidedTourProps {
    initialStep: number
}

export default function GuidedTour({ initialStep }: GuidedTourProps) {
    const router = useRouter()
    const t = useTranslations('guidedTour')

    // Map DB step (1-based) to tour index (0-based), clamped
    const startIdx = Math.max(0, Math.min((initialStep || 1) - 1, TOUR_STEPS.length - 1))
    const [currentStep, setCurrentStep] = useState(startIdx)
    const [visible, setVisible] = useState(true)

    const step = TOUR_STEPS[currentStep]
    const targetRect = useTargetRect(step.selector)

    const handleComplete = useCallback(async () => {
        setVisible(false)
        await completeOnboarding()
        router.refresh()
    }, [router])

    const handleNext = useCallback(async () => {
        if (currentStep >= TOUR_STEPS.length - 1) {
            // Last step ("complete") - finish and navigate
            await handleComplete()
            if (step.ctaHref) router.push(step.ctaHref)
            return
        }
        const nextIdx = currentStep + 1
        setCurrentStep(nextIdx)
        await advanceOnboardingStep(nextIdx + 1) // DB is 1-based

        // If step has a ctaHref, navigate
        if (step.ctaHref) {
            router.push(step.ctaHref)
        }
    }, [currentStep, step, handleComplete, router])

    const handleBack = useCallback(() => {
        if (currentStep > 0) {
            const prevIdx = currentStep - 1
            setCurrentStep(prevIdx)
            advanceOnboardingStep(prevIdx + 1)
        }
    }, [currentStep])

    const handleSkip = useCallback(async () => {
        await handleComplete()
    }, [handleComplete])

    // Keyboard navigation
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleSkip()
            if (e.key === 'ArrowRight') handleNext()
            if (e.key === 'ArrowLeft') handleBack()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [handleSkip, handleNext, handleBack])

    if (!visible) return null

    return (
        <>
            <TourSpotlight selector={step.selector} onClick={handleSkip} />
            <TourTooltip
                step={step}
                currentStep={currentStep}
                totalSteps={TOUR_STEPS.length}
                targetRect={targetRect}
                onNext={handleNext}
                onBack={handleBack}
                onSkip={handleSkip}
                t={(key, values) => {
                    try { return t(key, values) } catch { return key }
                }}
            />
        </>
    )
}
