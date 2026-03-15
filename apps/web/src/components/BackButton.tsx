'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
    const router = useRouter()
    
    return (
        <button 
            onClick={() => router.back()} 
            className="text-sm mb-6 inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
            style={{ color: 'var(--color-pl-text-tertiary)', background: 'none', border: 'none', padding: 0 }}
        >
            ← Zurück
        </button>
    )
}
