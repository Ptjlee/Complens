import type { Metadata } from 'next'
import Link from 'next/link'

import BackButton from '@/components/BackButton'
import { Logo } from '@/components/ui/Logo'

export const metadata: Metadata = {
    title: 'Impressum — CompLens',
    description: 'Impressum der DexterBee GmbH gemäß § 5 TMG.',
}

export default function ImpressumPage() {
    return (
        <div className="min-h-screen" style={{ background: 'var(--color-pl-bg)' }}>
            <div className="max-w-2xl mx-auto px-6 py-16">
                <div className="mb-10">
                    <BackButton />
                    <div className="flex items-center gap-3 mb-6">
                        <Logo size={32} />
                        <span className="font-bold text-xl" style={{ color: 'var(--color-pl-text-primary)' }}>CompLens</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                        Impressum
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        Angaben gemäß § 5 TMG
                    </p>
                </div>

                <div className="space-y-8 text-sm" style={{ color: 'var(--color-pl-text-secondary)', lineHeight: 1.9 }}>

                    <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-pl-border)' }}>
                        <h2 className="font-bold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Angaben gemäß § 5 TMG
                        </h2>
                        <p><strong style={{ color: 'var(--color-pl-text-primary)' }}>DexterBee GmbH</strong></p>
                        <p>Industriestr. 13</p>
                        <p>63755 Alzenau</p>
                        <p>Deutschland</p>
                    </div>

                    <div>
                        <h2 className="font-bold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>Kontakt</h2>
                        <p>E-Mail: hallo@complens.de</p>
                        <p>Web: https://complens.de</p>
                    </div>

                    <div>
                        <h2 className="font-bold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Handelsregister
                        </h2>
                        <p>Registergericht: Amtsgericht Aschaffenburg</p>
                        <p>Registernummer: HRB 17694</p>
                    </div>

                    <div>
                        <h2 className="font-bold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Geschäftsführung
                        </h2>
                        <p>Stephan Dongjin Oh</p>
                    </div>

                    <div>
                        <h2 className="font-bold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Umsatzsteuer-ID
                        </h2>
                        <p>USt-IdNr.: DE369096037</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            (§ 27a Umsatzsteuergesetz)
                        </p>
                    </div>

                    <div>
                        <h2 className="font-bold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
                        </h2>
                        <p>Stephan Dongjin Oh</p>
                        <p>Industriestr. 13, 63755 Alzenau</p>
                    </div>

                    <div>
                        <h2 className="font-bold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Haftungshinweis
                        </h2>
                        <p>Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt.
                        Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch
                        keine Gewähr übernommen werden. Als Diensteanbieter sind wir gemäß § 7 Abs. 1
                        TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
                        verantwortlich.</p>
                    </div>

                    <div>
                        <h2 className="font-bold mb-3" style={{ color: 'var(--color-pl-text-primary)' }}>
                            Streitschlichtung
                        </h2>
                        <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung
                        (OS) bereit: <a href="https://ec.europa.eu/consumers/odr" className="underline" style={{ color: 'var(--color-pl-brand-light)' }}
                            target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a></p>
                        <p className="mt-2">Wir sind nicht bereit oder verpflichtet, an
                        Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen
                        (gilt nicht für B2C-Verträge).</p>
                    </div>

                    <div className="mt-10 pt-6 border-t text-xs" style={{ borderColor: 'var(--color-pl-border)', color: 'var(--color-pl-text-tertiary)' }}>
                        <div className="flex gap-4">
                            <Link href="/agb" style={{ color: 'var(--color-pl-brand-light)' }}>AGB</Link>
                            <Link href="/datenschutz" style={{ color: 'var(--color-pl-brand-light)' }}>Datenschutz</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
