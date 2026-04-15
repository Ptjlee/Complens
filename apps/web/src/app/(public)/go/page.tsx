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
    alternates: {
      canonical: 'https://complens.de/go',
    },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      locale: locale === 'de' ? 'de_DE' : 'en_GB',
      type: 'website',
      images: [{ url: '/og-image.jpg', width: 640, height: 640, alt: 'CompLens' }],
    },
  }
}

export default async function AdLandingPage() {
  const t = await getTranslations('adLanding')

  // FAQ schema for rich snippets (even on noindex pages, useful for social/previews)
  const faqs = [
    { q: t('faq1Question'), a: t('faq1Answer') },
    { q: t('faq2Question'), a: t('faq2Answer') },
    { q: t('faq3Question'), a: t('faq3Answer') },
    { q: t('faq4Question'), a: t('faq4Answer') },
    { q: t('faq5Question'), a: t('faq5Answer') },
    { q: t('faq6Question'), a: t('faq6Answer') },
  ]

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Suspense>
        <AdLandingClient />
      </Suspense>
    </>
  )
}
