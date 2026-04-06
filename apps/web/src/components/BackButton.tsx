'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function BackButton() {
    const router = useRouter()
    const t = useTranslations('common')

    return (
        <button
            onClick={() => router.back()}
            className="text-sm mb-6 inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
            style={{ color: 'var(--color-pl-text-tertiary)', background: 'none', border: 'none', padding: 0 }}
        >
            ← {t('back')}
        </button>
    )
}
