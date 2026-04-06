import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://complens.de'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/compliance',
    '/datenschutz',
    '/impressum',
    '/agb',
    '/toms',
  ]

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1.0 : 0.7,
    alternates: {
      languages: {
        de: `${BASE_URL}${route}`,
        en: `${BASE_URL}${route}`,
      },
    },
  }))
}
