import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// ─── Security Headers ────────────────────────────────────────────────────────
// Applied to every response. Supabase, Stripe, and Gemini APIs are explicitly
// allowlisted so legitimate app functionality is not blocked.
const CSP = [
    "default-src 'self'",
    // Scripts: self + Stripe (checkout iframe/popup) + Next.js hot reload (dev only)
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    // Styles: self + inline (Next.js CSS-in-JS, Tailwind) + Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Fonts
    "font-src 'self' https://fonts.gstatic.com data:",
    // Images: self + blob (PDF previews) + data URIs + Supabase storage
    `img-src 'self' blob: data: ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}`,
    // API connections: Supabase, Stripe, Google Gemini API
    `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''} wss://*.supabase.co https://api.stripe.com https://generativelanguage.googleapis.com`,
    // Stripe elements load in iframes
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    // Workers: blob for PDF generation
    "worker-src 'self' blob:",
    // No plugins or embeds allowed
    "object-src 'none'",
    // Base URI restricted to self
    "base-uri 'self'",
    // Form submissions only to self
    "form-action 'self'",
].join('; ')

const securityHeaders = [
    // Prevent clickjacking
    { key: 'X-Frame-Options',           value: 'DENY' },
    // Stop MIME-type sniffing
    { key: 'X-Content-Type-Options',    value: 'nosniff' },
    // Referrer: send origin only on same-origin, just the origin on cross-origin
    { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
    // HSTS: 1 year, include subdomains, preload-ready
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
    // Disable browser features not needed by the app
    {
        key:   'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), bluetooth=()',
    },
    // Content-Security-Policy
    { key: 'Content-Security-Policy', value: CSP },
]

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                // Apply to every route
                source: '/(.*)',
                headers: securityHeaders,
            },
        ]
    },
}

export default withNextIntl(nextConfig)

