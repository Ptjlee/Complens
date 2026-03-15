'use client'

import { useState, useTransition } from 'react'
import { advanceOnboardingStep, completeOnboarding } from '@/app/(dashboard)/dashboard/onboarding/actions'
import { Upload, BarChart2, FileText, CheckCircle, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

// ── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
    {
        id: 1,
        icon: <span style={{ fontSize: 38 }}>👋</span>,
        badge: 'Willkommen',
        title: 'Willkommen bei CompLens',
        subtitle: 'EU Pay Transparency — einfach gemacht',
        body: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: 'var(--color-pl-text-sub)', fontSize: 14, lineHeight: 1.6 }}>
                    CompLens hilft Ihnen, die{' '}
                    <strong style={{ color: 'var(--color-pl-text)' }}>EU Pay Transparency Directive 2023/970</strong>{' '}
                    vollständig zu erfüllen — automatisiert, DSGVO-konform und in wenigen Minuten.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                    {[
                        { icon: '📊', text: 'Gender Pay Gap berechnen (bereinigt & unbereinigt)' },
                        { icon: '🔬', text: 'WIF-Analyse nach EU Art. 9' },
                        { icon: '📄', text: 'PDF & PPT-Berichte auf Knopfdruck' },
                        { icon: '🛡️', text: 'DSGVO-konform — Server in Frankfurt' },
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
                    💡 <strong>Tipp:</strong> Die meisten Unternehmen benötigen nur 3 Klicks, um ihren ersten Bericht zu erstellen.
                </div>
            </div>
        ),
    },
    {
        id: 2,
        icon: <Upload size={38} color="var(--color-pl-brand)" />,
        badge: 'Schritt 1',
        title: 'Datensatz hochladen',
        subtitle: 'Ihre Lohndaten — sicher und clever importiert',
        body: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ color: 'var(--color-pl-text-sub)', fontSize: 14, lineHeight: 1.6 }}>
                    Laden Sie eine <strong style={{ color: 'var(--color-pl-text)' }}>CSV oder Excel-Datei</strong> mit Ihren Lohndaten hoch.
                    Unser KI-Assistent erkennt automatisch, welche Spalte welchem Feld entspricht.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                        { num: '1', label: 'Import öffnen', desc: 'Menü links → „Datensatz importieren"' },
                        { num: '2', label: 'Datei hochladen', desc: 'CSV, XLSX — bis zu 10.000 Mitarbeitende' },
                        { num: '3', label: 'Spalten prüfen', desc: 'KI schlägt Mapping vor — Sie bestätigen' },
                        { num: '4', label: 'Speichern', desc: 'Datensatz wird DSGVO-konform gespeichert' },
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
                    ✓ Pflichtfelder: Mitarbeiter-ID, Geschlecht, Vergütung, Arbeitsstunden
                </div>
            </div>
        ),
    },
    {
        id: 3,
        icon: <BarChart2 size={38} color="var(--color-pl-brand)" />,
        badge: 'Schritt 2',
        title: 'Erste Analyse starten',
        subtitle: 'Gender Pay Gap — bereinigt nach EU Art. 9',
        body: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ color: 'var(--color-pl-text-sub)', fontSize: 14, lineHeight: 1.6 }}>
                    Wählen Sie Ihren Datensatz und die{' '}
                    <strong style={{ color: 'var(--color-pl-text)' }}>Wage Influencing Factors (WIF)</strong>,
                    nach denen der Entgelt-Gap bereinigt werden soll.
                </p>
                <div style={{
                    background: 'var(--color-pl-surface)',
                    border: '1px solid var(--color-pl-border)',
                    borderRadius: 8, padding: 14,
                }}>
                    <div style={{ fontSize: 12, color: 'var(--color-pl-text-sub)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        WIF-Faktoren (empfohlen)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {['Berufsgruppe / Job Family', 'Erfahrungsjahre', 'Standort', 'Vollzeit / Teilzeit', 'Entgeltgruppe'].map(f => (
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
                    ⚠ Bereiche mit &lt;5 Mitarbeitenden werden anonymisiert (DSGVO Art. 17)
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-pl-text-sub)', lineHeight: 1.5 }}>
                    CompLens berechnet automatisch den unbereinigten und bereinigten Gender Pay Gap (Median + Mittelwert)
                    sowie die 5%-Schwelle nach EU Art. 9 Abs. 1c.
                </p>
            </div>
        ),
    },
    {
        id: 4,
        icon: <FileText size={38} color="var(--color-pl-brand)" />,
        badge: 'Schritt 3',
        title: 'Bericht lesen & exportieren',
        subtitle: 'PDF & PowerPoint — direkt einreichbereit',
        body: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ color: 'var(--color-pl-text-sub)', fontSize: 14, lineHeight: 1.6 }}>
                    Ihr Bericht enthält alle Angaben nach{' '}
                    <strong style={{ color: 'var(--color-pl-text)' }}>EU-Richtlinie 2023/970 Art. 9</strong>{' '}
                    — bereit für Betriebsrat, Behörde oder Vorstand.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                        { icon: '📄', fmt: 'PDF', desc: 'Vollständiger Bericht mit Methodik und Einzelfallanalyse' },
                        { icon: '📊', fmt: 'PowerPoint', desc: '9-Folien-Präsentation — CompLens gebrandete, druckfertig' },
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
                        Sie sind bereit! Starten Sie jetzt mit Ihrem ersten Bericht.
                    </span>
                </div>
            </div>
        ),
    },
]

const TOTAL = STEPS.length

// ── Component ────────────────────────────────────────────────────────────────

interface OnboardingModalProps {
    initialStep: number   // from DB (1-4)
}

export default function OnboardingModal({ initialStep }: OnboardingModalProps) {
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
                        }}>Einrichtung</span>
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
                                Zurück
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
                                Überspringen
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
                                Los geht&apos;s!
                            </>
                        ) : (
                            <>
                                Weiter
                                <ChevronRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
