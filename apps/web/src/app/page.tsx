import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import LandingClient from '@/components/landing/LandingClient'

export default async function RootPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Auto-login active sessions
    if (user) redirect('/dashboard')

    const t = await getTranslations('adLanding')

    // FAQ schema for Google "People Also Ask" rich snippets
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
            acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <LandingClient />
        </>
    )
}
