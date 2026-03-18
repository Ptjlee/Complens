import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from '@/components/ThemeProvider'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'CompLens — EU Pay Transparency Software',
    template: '%s | CompLens',
  },
  description:
    'CompLens helps German and European companies comply with the EU Pay Transparency Directive (2023/970/EU). Run pay gap analyses, generate compliant reports, and close gender pay gaps. Made in Germany.',
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
    title: 'CompLens — EU Pay Transparency Software',
    description: 'Automatische Entgeltanalyse und Berichterstattung nach der EU-Richtlinie 2023/970.',
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
    title: 'CompLens — EU Pay Transparency Software',
    description: 'Automatische Entgeltanalyse und Berichterstattung nach der EU-Richtlinie 2023/970.',
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
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body className="antialiased font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
      {gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  )
}
