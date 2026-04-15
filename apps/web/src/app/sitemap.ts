import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://complens.de'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: '', priority: 1.0, freq: 'weekly' as const },
    { path: '/booking', priority: 0.8, freq: 'monthly' as const },
    { path: '/compliance', priority: 0.7, freq: 'monthly' as const },
    { path: '/datenschutz', priority: 0.5, freq: 'monthly' as const },
    { path: '/impressum', priority: 0.3, freq: 'monthly' as const },
    { path: '/agb', priority: 0.3, freq: 'monthly' as const },
    { path: '/toms', priority: 0.5, freq: 'monthly' as const },
  ]

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.freq,
    priority: route.priority,
    alternates: {
      languages: {
        de: `${BASE_URL}${route.path}`,
        en: `${BASE_URL}${route.path}`,
      },
    },
  }))
}
