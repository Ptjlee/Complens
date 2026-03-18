/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://complens.de',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  exclude: ['/dashboard', '/dashboard/*', '/auth/*', '/setup', '/api/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/auth', '/api', '/setup'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
    ],
  },
}
