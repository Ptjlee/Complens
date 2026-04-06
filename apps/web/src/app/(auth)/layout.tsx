import { Logo } from '@/components/ui/Logo'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { getTranslations } from 'next-intl/server'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
    const t = await getTranslations('auth')

    const bullets = [
        { icon: '🇩🇪', text: t('layoutBullet1') },
        { icon: '📊', text: t('layoutBullet2') },
        { icon: '⚡', text: t('layoutBullet3') },
        { icon: '🤖', text: t('layoutBullet4') },
    ]

    return (
        <div className="min-h-screen flex gradient-bg">
            {/* Left — brand panel */}
            <div
                className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 px-12 py-12 border-r"
                style={{ borderColor: 'var(--color-pl-border)', background: 'var(--color-pl-surface)' }}
            >
                {/* Logo → links to main site */}
                <a href="https://complens.de" className="flex items-center gap-3 hover:opacity-80 transition-opacity" style={{ textDecoration: 'none' }}>
                    <Logo size={40} />
                    <div>
                        <div className="font-bold text-base" style={{ color: 'var(--color-pl-text-primary)' }}>
                            CompLens
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('layoutTagline')}
                        </div>
                    </div>
                </a>

                {/* Headline + value props */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold leading-tight mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('layoutHeadline')}<br />
                            <span className="gradient-text" style={{ whiteSpace: 'pre-line' }}>{t('layoutHeadlineHighlight')}</span>
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('layoutBody')}
                        </p>
                    </div>

                    {/* Value props */}
                    <ul className="space-y-4">
                        {bullets.map(({ icon, text }) => (
                            <li key={text} className="flex items-start gap-3">
                                <span className="text-base mt-0.5">{icon}</span>
                                <span className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-8 text-xs text-center border-t pt-4 flex flex-col gap-2" style={{ color: 'var(--color-pl-text-tertiary)', borderColor: 'var(--color-pl-border)' }}>
                    <div>© {new Date().getFullYear()} DexterBee GmbH</div>
                    <div className="flex justify-center flex-wrap gap-x-3 gap-y-1">
                        <a href="/impressum" className="hover:underline">{t('layoutImprint')}</a>
                        <span>·</span>
                        <a href="/datenschutz" className="hover:underline">{t('layoutPrivacy')}</a>
                        <span>·</span>
                        <a href="/agb" className="hover:underline">{t('layoutTerms')}</a>
                        <span>·</span>
                        <a href="/compliance" className="hover:underline">AI & Compliance</a>
                    </div>
                </div>
            </div>

            {/* Right — auth form */}
            <div className="relative flex flex-1 items-center justify-center px-6 py-12">
                {/* Language switcher — top-right corner */}
                <div className="absolute top-4 right-6">
                    <LanguageSwitcher />
                </div>
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    )
}
