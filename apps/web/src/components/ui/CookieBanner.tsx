'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'

export default function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false)

    useEffect(() => {
        const consent = localStorage.getItem('complens_cookie_consent')
        if (!consent) {
            setShowBanner(true)
        }
        // GA loading is handled by GoogleAnalyticsLoader, which polls localStorage
    }, [])

    function handleAccept() {
        localStorage.setItem('complens_cookie_consent', 'granted')
        // GoogleAnalyticsLoader polls localStorage and will load GA automatically
        setShowBanner(false)
    }

    function handleReject() {
        localStorage.setItem('complens_cookie_consent', 'denied')
        setShowBanner(false)
    }

    if (!showBanner) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none flex justify-center">
            <div 
                className="max-w-3xl w-full flex flex-col sm:flex-row items-center justify-between gap-6 px-6 py-5 rounded-2xl pointer-events-auto"
                style={{
                    background: 'rgba(15, 15, 20, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                <div className="flex gap-4 items-start sm:items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(56, 189, 248, 0.1)' }}>
                        <ShieldCheck size={20} style={{ color: '#38bdf8' }} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                            Ihre Privatsphäre ist uns wichtig
                        </h3>
                        <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed max-w-lg">
                            Wir verwenden Cookies zur Analyse unseres Traffics, um Ihr Nutzererlebnis stetig zu verbessern (Google Analytics). Mit einem Klick auf &bdquo;Alle akzeptieren&ldquo; stimmen Sie der Verwendung von Analyse-Cookies zu. Weitere Informationen finden Sie in unserer <a href="/privacy" className="text-[#38bdf8] hover:underline">Datenschutzerklärung</a>.
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
                    <button
                        onClick={handleReject}
                        className="text-xs font-semibold px-4 py-2.5 rounded-xl transition-all w-full sm:w-auto text-[#94a3b8] hover:text-white"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        Ablehnen
                    </button>
                    <button
                        onClick={handleAccept}
                        className="text-xs font-bold px-5 py-2.5 rounded-xl transition-all w-full sm:w-auto hover:brightness-110"
                        style={{ background: '#5b61ff', color: 'white', boxShadow: '0 4px 14px 0 rgba(91, 97, 255, 0.39)' }}
                    >
                        Alle akzeptieren
                    </button>
                </div>
            </div>
        </div>
    )
}
