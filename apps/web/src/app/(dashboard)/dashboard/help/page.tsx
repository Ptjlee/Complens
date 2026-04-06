import HelpClient from './HelpClient'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
    const t = await getTranslations('metadata')
    return { title: t('helpTitle') }
}

export default function HelpPage() {
    return <HelpClient />
}
