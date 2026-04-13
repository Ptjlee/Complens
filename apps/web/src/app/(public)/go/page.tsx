import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import AdLandingClient from './AdLandingClient'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations('adLanding')

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      locale: locale === 'de' ? 'de_DE' : 'en_GB',
      type: 'website',
    },
  }
}

export default function AdLandingPage() {
  return (
    <Suspense>
      <AdLandingClient />
    </Suspense>
  )
}
