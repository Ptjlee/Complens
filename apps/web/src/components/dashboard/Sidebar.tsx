'use client'

import { Logo } from '@/components/ui/Logo'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
    Landmark,
    Network,
} from 'lucide-react'

const TOUR_ATTRS: Record<string, string> = {
    '/dashboard/import': 'nav-import',
    '/dashboard/analysis': 'nav-analysis',
    '/dashboard/salary-bands': 'nav-salary-bands',
    '/dashboard/job-architecture': 'nav-job-architecture',
    '/dashboard/reports': 'nav-reports',
    '/dashboard/settings': 'nav-settings',
    '/dashboard/help': 'nav-help',
}

const navItems = [
    { href: '/dashboard',               labelKey: 'dashboard',     icon: LayoutDashboard, adminOnly: false },
    { href: '/dashboard/import',        labelKey: 'import',        icon: Upload,          adminOnly: true  },
    { href: '/dashboard/datasets',      labelKey: 'datasets',      icon: Database,        adminOnly: true  },
    { href: '/dashboard/analysis',      labelKey: 'analysis',      icon: BarChart3,       adminOnly: false },
    { href: '/dashboard/trends',        labelKey: 'trends',        icon: TrendingUp,      adminOnly: false },
    { href: '/dashboard/reports',       labelKey: 'reports',       icon: FileText,        adminOnly: false },
    { href: '/dashboard/remediation',   labelKey: 'remediation',   icon: Wrench,          adminOnly: true  },
    { href: '/dashboard/salary-bands',  labelKey: 'salaryBands',   icon: Landmark,        adminOnly: true  },
    { href: '/dashboard/job-architecture', labelKey: 'jobArchitecture', icon: Network,    adminOnly: true  },
    { href: '/dashboard/portal',        labelKey: 'portal',        icon: Users,           adminOnly: true  },
]

const bottomItems = [
    { href: '/dashboard/compliance', labelKey: 'compliance', icon: ShieldCheck },
    { href: '/dashboard/settings', labelKey: 'settings', icon: Settings },
    { href: '/dashboard/help', labelKey: 'help', icon: HelpCircle },
]

export default function Sidebar({ role }: { role?: 'admin' | 'viewer' }) {
    const pathname = usePathname()
    const t = useTranslations('nav')

    const visibleNavItems = navItems.filter(item => {
        if (role !== 'admin' && item.adminOnly) return false
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
            {/* Logo → links to main site */}
            <a
                href="https://complens.de"
                className="flex items-center gap-2.5 px-5 py-5 border-b hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--color-pl-border)', textDecoration: 'none' }}
            >
                <Logo size={32} />
                <div>
                    <div className="font-bold text-sm" style={{ color: 'var(--color-pl-text-primary)' }}>
                        CompLens
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                        {t('subtitle')}
                    </div>
                </div>
            </a>

            {/* Main nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {visibleNavItems.map(({ href, labelKey, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`nav-link ${pathname === href || (href !== '/dashboard' && pathname.startsWith(href)) ? 'active' : ''}`}
                        {...(TOUR_ATTRS[href] ? { 'data-tour': TOUR_ATTRS[href] } : {})}
                    >
                        <Icon size={16} strokeWidth={1.8} />
                        <span>{t(labelKey)}</span>
                    </Link>
                ))}
            </nav>

            {/* Bottom nav */}
            <div className="px-3 py-4 border-t space-y-0.5" style={{ borderColor: 'var(--color-pl-border)' }}>
                {visibleBottomItems.map(({ href, labelKey, icon: Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`nav-link ${pathname.startsWith(href) ? 'active' : ''}`}
                        {...(TOUR_ATTRS[href] ? { 'data-tour': TOUR_ATTRS[href] } : {})}
                    >
                        <Icon size={16} strokeWidth={1.8} />
                        <span>{t(labelKey)}</span>
                    </Link>
                ))}
            </div>
        </aside>
    )
}
