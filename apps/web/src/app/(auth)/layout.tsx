import { Logo } from '@/components/ui/Logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex gradient-bg">
            {/* Left — brand panel */}
            <div
                className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 px-12 py-12 border-r"
                style={{ borderColor: 'var(--color-pl-border)', background: 'var(--color-pl-surface)' }}
            >
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <Logo size={40} />
                    <div>
                        <div className="font-bold text-base" style={{ color: 'var(--color-pl-text-primary)' }}>
                            CompLens
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            EU Entgelttransparenz
                        </div>
                    </div>
                </div>

                {/* Headline + value props */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold leading-tight mb-4" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Entgelttransparenz.<br />
                            <span className="gradient-text">Einfach. Sicher.<br />Made in Germany.</span>
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            Analysieren Sie Ihren Gender Pay Gap, erstellen Sie EU-konforme Berichte und
                            schließen Sie Lohnlücken — DSGVO-konform auf deutschen Servern.
                        </p>
                    </div>

                    {/* Value props */}
                    <ul className="space-y-4">
                        {[
                            { icon: '🇩🇪', text: 'Daten ausschließlich auf EU-Servern in Frankfurt' },
                            { icon: '📊', text: 'EU-Richtlinie 2023/970/EU — vollständig konform' },
                            { icon: '⚡', text: 'Erste Analyse in unter 5 Minuten' },
                            { icon: '🤖', text: 'KI-gestützte Spaltenzuordnung (optional, DSGVO-sicher)' },
                        ].map(({ icon, text }) => (
                            <li key={text} className="flex items-start gap-3">
                                <span className="text-base mt-0.5">{icon}</span>
                                <span className="text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-8 text-xs text-center border-t pt-4 flex flex-col gap-2" style={{ color: 'var(--color-pl-text-tertiary)', borderColor: 'var(--color-pl-border)' }}>
                    <div>© 2026 DexterBee GmbH</div>
                    <div className="flex justify-center flex-wrap gap-x-3 gap-y-1">
                        <a href="/impressum" className="hover:underline">Impressum</a>
                        <span>·</span>
                        <a href="/datenschutz" className="hover:underline">Datenschutz</a>
                        <span>·</span>
                        <a href="/agb" className="hover:underline">AGB</a>
                        <span>·</span>
                        <a href="/compliance" className="hover:underline">AI & Compliance</a>
                    </div>
                </div>
            </div>

            {/* Right — auth form */}
            <div className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    )
}
