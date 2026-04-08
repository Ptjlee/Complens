import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import ResetPasswordClient from './ResetPasswordClient'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('metadata')
    return {
        title: t('resetPasswordTitle'),
        description: t('resetPasswordDescription'),
    }
}

export default function ResetPasswordPage() {
    return <ResetPasswordClient />
}
