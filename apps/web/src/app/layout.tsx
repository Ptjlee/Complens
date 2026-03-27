import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from '@/components/ThemeProvider'
import CookieBanner from '@/components/ui/CookieBanner'
import GoogleAnalyticsLoader from '@/components/ui/GoogleAnalyticsLoader'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'CompLens — Entgelttransparenz einfach gemacht',
    template: '%s | CompLens',
  },
  description:
    'Erfüllen Sie die EU-Meldepflicht in unter 5 Minuten. Automatisierte Analysen, bereinigter Gender Pay Gap und fertige Berichte – 100% DSGVO-konform.',
  keywords: [
    'Entgelttransparenz',
    'Gender Pay Gap',
    'EU Pay Transparency Directive',
    'Entgelttransparenzgesetz',
    'Lohngleichheit',
    'Pay Equity Software',
    'GDPR compliant',
    'CompLens',
  ],
  authors: [{ name: 'DexterBee GmbH' }],
  creator: 'DexterBee GmbH',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://complens.de'
  ),
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    alternateLocale: 'en_GB',
    siteName: 'CompLens',
    title: 'CompLens — Entgelttransparenz einfach gemacht',
    description: 'Erfüllen Sie die EU-Meldepflicht in unter 5 Minuten. So einfach kann es sein.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CompLens Dashboard Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CompLens — Entgelttransparenz einfach gemacht',
    description: 'Erfüllen Sie die EU-Meldepflicht in unter 5 Minuten. Automatisierte Analysen und fertige Berichte.',
    creator: '@complens',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body className="antialiased font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <CookieBanner />
            {/* GA only loads after cookie consent is granted — no Consent Mode complexity */}
            <GoogleAnalyticsLoader />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
