import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ThemeProvider } from '@/components/ThemeProvider'
import CookieBanner from '@/components/ui/CookieBanner'
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

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        {GA_ID && (
          <script
            id="ga-consent-init"
            dangerouslySetInnerHTML={{
              __html: `
(function(){
  var GA_ID = '${GA_ID}';
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;

  // Called by CookieBanner after user clicks 'Alle akzeptieren'
  window.grantGA = function(){
    if(document.getElementById('ga-script')) return;
    var s = document.createElement('script');
    s.id = 'ga-script';
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID);
  };

  // If user already consented on a previous visit, load GA immediately
  try {
    if(localStorage.getItem('complens_cookie_consent') === 'granted'){
      window.grantGA();
    }
  } catch(e){}
})();
              `,
            }}
          />
        )}
      </head>
      <body className="antialiased font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <CookieBanner />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
