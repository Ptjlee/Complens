import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { ThemeProvider } from '@/components/ThemeProvider'
import CookieBanner from '@/components/ui/CookieBanner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations('metadata')

  const ogLocale = locale === 'en' ? 'en_GB' : 'de_DE'
  const ogAlternateLocale = locale === 'en' ? 'de_DE' : 'en_GB'
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://complens.de'

  return {
    title: {
      default: t('siteTitle'),
      template: t('siteTitleTemplate'),
    },
    description: t('siteDescription'),
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
    metadataBase: new URL(siteUrl),
    alternates: {
      languages: {
        'de': siteUrl,
        'en': siteUrl,
        'x-default': siteUrl,
      },
    },
    openGraph: {
      type: 'website',
      locale: ogLocale,
      alternateLocale: ogAlternateLocale,
      siteName: 'CompLens',
      title: t('ogTitle'),
      description: t('ogDescription'),
      // NOTE: og-image.jpg is currently 640x630. For optimal social sharing,
      // replace it with a 1200x630 image and update width/height below.
      images: [
        {
          url: '/og-image.jpg',
          width: 640,
          height: 640,
          alt: 'CompLens Dashboard Preview',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
      creator: '@complens',
    },
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  const t = await getTranslations('metadata')

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
        {/* JSON-LD: Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'CompLens',
              legalName: 'DexterBee GmbH',
              url: 'https://complens.de',
              logo: 'https://complens.de/icon.png',
              description: t('jsonLdOrgDescription'),
              inLanguage: locale,
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Industriestr. 13',
                addressLocality: 'Alzenau',
                postalCode: '63755',
                addressCountry: 'DE',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                email: 'hallo@complens.de',
                contactType: 'sales',
                availableLanguage: ['de', 'en'],
              },
            }),
          }}
        />
        {/* JSON-LD: SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'CompLens',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              inLanguage: locale,
              description: t('jsonLdAppDescription'),
              offers: {
                '@type': 'Offer',
                price: '5990',
                priceCurrency: 'EUR',
                url: 'https://complens.de',
              },
            }),
          }}
        />
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
