'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Building2, CheckCircle2, ChevronLeft, Loader2, Users } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

type Step = 1 | 2 | 3 | 4
type FormData = {
    firstName: string
    lastName: string
    email: string
    companyName: string
    companySize: string
    hris: string
    urgency: string
}

export default function ApplyPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>(1)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        companyName: '',
        companySize: '',
        hris: '',
        urgency: '',
    })

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
        // Simulate API call to CRM
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setLoading(false)

        // Route logic based on company size
        if (formData.companySize === '<100') {
            // Under 100 employees -> Send to self-serve 7-day trial fallback
            router.push('/signup?reason=under100')
        } else {
            // Enterprise -> Send to homework & booking
            router.push('/booking')
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#0c0f1a] to-[#161a2b]">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <Link href="/" className="mb-6 flex items-center justify-center gap-2">
                        <Logo size={40} />
                        <span className="text-xl font-bold tracking-tight text-white">CompLens</span>
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                        {step === 1 && 'Prüfen Sie Ihre EU-Readiness'}
                        {step === 2 && 'Wie groß ist Ihr Team?'}
                        {step === 3 && 'Ihre aktuelle HR-Infrastruktur'}
                        {step === 4 && 'Wann müssen Sie reporten?'}
                    </h1>
                    <p className="text-[#a1a1aa]">
                        {step === 1 && 'Geben Sie Ihre Kontaktdaten ein, um den Audit zu starten.'}
                        {step === 2 && 'Die Richtlinie betrifft Unternehmen je nach Größe zu anderen Stichtagen.'}
                        {step === 3 && 'CompLens verbindet sich direkt mit Ihren bestehenden Systemen.'}
                        {step === 4 && 'Helfen Sie uns, die Dringlichkeit für Ihr Unternehmen einzuschätzen.'}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                step >= i ? 'bg-[#5b61ff]' : 'bg-[#1e2336]'
                            }`}
                        />
                    ))}
                </div>

                {/* Form Card */}
                <div className="p-6 md:p-8 rounded-2xl bg-[#141829] border border-[#1e2336] shadow-2xl relative overflow-hidden">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Step 1: Contact */}
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Vorname</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => updateForm({ firstName: e.target.value })}
                                            className="w-full bg-[#0c0f1a] border border-[#1e2336] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5b61ff] transition-colors"
                                            placeholder="Max"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Nachname</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => updateForm({ lastName: e.target.value })}
                                            className="w-full bg-[#0c0f1a] border border-[#1e2336] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5b61ff] transition-colors"
                                            placeholder="Mustermann"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Arbeits-E-Mail</label>
                                    <input
                                        required
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateForm({ email: e.target.value })}
                                        className="w-full bg-[#0c0f1a] border border-[#1e2336] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5b61ff] transition-colors"
                                        placeholder="max@unternehmen.de"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">Unternehmen</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => updateForm({ companyName: e.target.value })}
                                        className="w-full bg-[#0c0f1a] border border-[#1e2336] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5b61ff] transition-colors"
                                        placeholder="Muster GmbH"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Company Size */}
                        {step === 2 && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {[
                                    { value: '<100', label: 'Unter 100 Mitarbeiter', desc: 'Meldepflicht je nach EU-Land ggf. später' },
                                    { value: '100-149', label: '100 - 149 Mitarbeiter', desc: 'Meldepflicht ab 2031 (Daten von 2030)' },
                                    { value: '150-249', label: '150 - 249 Mitarbeiter', desc: 'Meldepflicht ab 2027 (Daten von 2026)' },
                                    { value: '250+', label: '250+ Mitarbeiter', desc: 'Meldepflicht ab 2027, jährliche Berichte' }
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            updateForm({ companySize: option.value })
                                            nextStep()
                                        }}
                                        className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                                            formData.companySize === option.value
                                                ? 'border-[#5b61ff] bg-[rgba(91,97,255,0.1)]'
                                                : 'border-[#1e2336] bg-[#0c0f1a] hover:border-[#383d54] hover:bg-[#111523]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-[#1e2336] rounded-lg text-[#a1a1aa]">
                                                {option.value === '<100' ? <Users size={20} /> : <Building2 size={20} />}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white">{option.label}</div>
                                                <div className="text-xs text-[#a1a1aa] mt-0.5">{option.desc}</div>
                                            </div>
                                        </div>
                                        {formData.companySize === option.value && (
                                            <CheckCircle2 size={20} className="text-[#5b61ff]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Step 3: HRIS */}
                        {step === 3 && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {[
                                    { value: 'sap', label: 'SAP SuccessFactors', desc: 'Nativer Excel-Import verfügbar' },
                                    { value: 'workday', label: 'Workday', desc: 'Nativer Excel-Import verfügbar' },
                                    { value: 'personio', label: 'Personio', desc: 'Standard CSV-Import' },
                                    { value: 'excel', label: 'Excel / Manuell', desc: 'Wir bereinigen unstrukturierte Daten' },
                                    { value: 'other', label: 'Andere Software', desc: 'Universeller Import möglich' }
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            updateForm({ hris: option.value })
                                            nextStep()
                                        }}
                                        className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                                            formData.hris === option.value
                                                ? 'border-[#5b61ff] bg-[rgba(91,97,255,0.1)]'
                                                : 'border-[#1e2336] bg-[#0c0f1a] hover:border-[#383d54] hover:bg-[#111523]'
                                        }`}
                                    >
                                        <div>
                                            <div className="font-semibold text-white">{option.label}</div>
                                            <div className="text-xs text-[#a1a1aa] mt-0.5">{option.desc}</div>
                                        </div>
                                        {formData.hris === option.value && (
                                            <CheckCircle2 size={20} className="text-[#5b61ff]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Step 4: Urgency */}
                        {step === 4 && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {[
                                    { value: 'critical', label: 'Sofort / Kritisch', desc: 'Wir vermuten einen Gap > 5% und brauchen eine Lösung.' },
                                    { value: 'soon', label: 'In den nächsten 3-6 Monaten', desc: 'Wir wollen 2026 perfekt vorbereitet sein.' },
                                    { value: 'exploring', label: 'Information gathering', desc: 'Wir beginnen gerade erst mit der Recherche.' }
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => updateForm({ urgency: option.value })}
                                        className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                                            formData.urgency === option.value
                                                ? 'border-[#5b61ff] bg-[rgba(91,97,255,0.1)]'
                                                : 'border-[#1e2336] bg-[#0c0f1a] hover:border-[#383d54] hover:bg-[#111523]'
                                        }`}
                                    >
                                        <div>
                                            <div className="font-semibold text-white">{option.label}</div>
                                            <div className="text-xs text-[#a1a1aa] mt-0.5">{option.desc}</div>
                                        </div>
                                        {formData.urgency === option.value && (
                                            <CheckCircle2 size={20} className="text-[#5b61ff]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="pt-4 flex items-center justify-between border-t border-[#1e2336] mt-8">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="flex items-center gap-2 text-sm font-medium text-[#a1a1aa] hover:text-white transition-colors px-4 py-2"
                                >
                                    <ChevronLeft size={16} /> Zurück
                                </button>
                            ) : (
                                <div></div>
                            )}

                            <button
                                type="submit"
                                disabled={
                                    (step === 1 && (!formData.firstName || !formData.lastName || !formData.email || !formData.companyName)) ||
                                    (step === 2 && (!formData.companySize)) ||
                                    (step === 3 && (!formData.hris)) ||
                                    (step === 4 && (!formData.urgency)) ||
                                    loading
                                }
                                className="flex items-center gap-2 bg-[#5b61ff] hover:bg-[#4a50e6] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-[0_0_20px_rgba(91,97,255,0.3)]"
                            >
                                {loading ? (
                                    <><Loader2 size={16} className="animate-spin" /> Verarbeiten...</>
                                ) : step === 4 ? (
                                    <>Kostenlos starten <ArrowRight size={16} /></>
                                ) : (
                                    <>Weiter <ArrowRight size={16} /></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-xs text-[#6e7185] mt-6">
                    Ihre Daten werden sicher und DSGVO-konform in Frankfurt gespeichert.
                </p>
            </div>
        </div>
    )
}
