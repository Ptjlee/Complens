'use client'

import { Logo } from '@/components/ui/Logo'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Upload,
    BarChart3,
    FileText,
    Wrench,
    Users,
    ShieldCheck,
    Settings,
    HelpCircle,
    Database,
    TrendingUp,
} from 'lucide-react'

const navItems = [
    { href: '/dashboard',          label: 'Übersicht',             icon: LayoutDashboard },
    { href: '/dashboard/import',   label: 'Daten importieren',     icon: Upload },
    { href: '/dashboard/datasets', label: 'Datensätze verwalten',  icon: Database },
    { href: '/dashboard/analysis', label: 'Analyse',               icon: BarChart3 },
    { href: '/dashboard/trends',   label: 'Trendanalyse',          icon: TrendingUp },
    { href: '/dashboard/reports',  label: 'Berichte',              icon: FileText },
    { href: '/dashboard/remediation', label: 'Maßnahmen',          icon: Wrench },
    { href: '/dashboard/portal',   label: 'Auskunftsrecht',        icon: Users },
]

const bottomItems = [
    { href: '/dashboard/compliance', label: 'DSGVO & Compliance', icon: ShieldCheck },
    { href: '/dashboard/settings', label: 'Einstellungen', icon: Settings },
    { href: '/dashboard/help', label: 'Hilfe & Handbuch', icon: HelpCircle },
]

export default function Sidebar({ role }: { role?: 'admin' | 'viewer' }) {
    const pathname = usePathname()

    // Filter out items that viewers shouldn't see
    const visibleNavItems = navItems.filter(item => {
        if (role !== 'admin' && [
            '/dashboard/import',
            '/dashboard/datasets',
            '/dashboard/remediation',
            '/dashboard/portal',
        ].includes(item.href)) {
            return false
        }
        return true
    })

    const visibleBottomItems = bottomItems.filter(item => {
        if (role !== 'admin' && item.href === '/dashboard/settings') {
            return false
        }
        return true
    })

    return (
        <aside
            className="flex flex-col w-60 h-full flex-shrink-0 border-r"
            style={{
                background: 'var(--color-pl-surface)',
                borderColor: 'var(--color-pl-border)',
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                <Logo size={32} />
                <div>
                    <div className="font-bold text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>
                        CompLens
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        EU Entgelttransparenz
                    </div>
                </div>
            </div>

            {/* Main nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {visibleNavItems.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`nav-link ${pathname === href || (href !== '/dashboard' && pathname.startsWith(href)) ? 'active' : ''}`}
                    >
                        <Icon size={16} strokeWidth={1.8} />
                        <span>{label}</span>
                    </Link>
                ))}
            </nav>

            {/* Bottom nav */}
            <div className="px-3 py-4 border-t space-y-0.5" style={{ borderColor: 'var(--color-pl-border)' }}>
                {visibleBottomItems.map(({ href, label, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`nav-link ${pathname.startsWith(href) ? 'active' : ''}`}
                    >
                        <Icon size={16} strokeWidth={1.8} />
                        <span>{label}</span>
                    </Link>
                ))}
            </div>
        </aside>
    )
}
