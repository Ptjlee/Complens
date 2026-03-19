'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Bell, MessageSquare, Globe, LogOut, Settings, ChevronDown } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { routing } from '@/i18n/routing'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import dynamic from 'next/dynamic'

const SupportTicketModal = dynamic(() => import('@/components/support/SupportTicketModal'), { ssr: false })

interface HeaderProps {
    user: User
}

export default function Header({ user }: HeaderProps) {
    const initials = user.email?.slice(0, 2).toUpperCase() ?? 'CL'
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showSupport, setShowSupport] = useState(false)

    // Locale switcher
    const [locale, setLocale] = useState<string>(() => {
        if (typeof document !== 'undefined') {
            const match = document.cookie.match(/(?:^|; )locale=([^;]*)/)
            return match ? match[1] : routing.defaultLocale
        }
        return routing.defaultLocale
    })

    function switchLocale(next: string) {
        setLocale(next)
        if (typeof document !== 'undefined') {
            document.cookie = `locale=${next}; path=/; max-age=31536000`
            window.location.reload()
        }
    }

    // Avatar dropdown
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        function handleOpenChatbot() {
            window.dispatchEvent(new CustomEvent('toggle-chatbot'))
        }
        function handleKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                handleOpenChatbot()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [router])

    function handleLogout() {
        startTransition(async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            router.push('/login')
        })
    }

    return (
        <header
            className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
            style={{ background: 'var(--color-pl-surface)', borderColor: 'var(--color-pl-border)' }}
        >
            <div />

            {/* Right: actions */}
            <div className="flex items-center gap-3">
                <ThemeToggle />
                


                {showSupport && <SupportTicketModal onClose={() => setShowSupport(false)} />}
                
                {/* Support trigger */}
                <button
                    onClick={() => setShowSupport(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02]"
                    style={{
                        background: 'color-mix(in srgb, var(--color-pl-accent) 10%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--color-pl-accent) 30%, transparent)',
                        color: 'var(--color-pl-accent)',
                    }}
                    title="Support kontaktieren"
                >
                    <MessageSquare size={13} />
                    Support
                </button>

                {/* Notifications */}
                <button
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ color: 'var(--color-pl-text-secondary)' }}
                    title="Benachrichtigungen"
                >
                    <Bell size={16} />
                </button>

                {/* Avatar + dropdown */}
                <div ref={menuRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setMenuOpen(v => !v)}
                        className="flex items-center gap-1.5"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title={user.email}
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: 'var(--color-pl-brand)' }}
                        >
                            {initials}
                        </div>
                        <ChevronDown
                            size={13}
                            style={{
                                color: 'var(--color-pl-text-sub)',
                                transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)',
                                transition: 'transform 0.2s',
                            }}
                        />
                    </button>

                    {/* Dropdown */}
                    {menuOpen && (
                        <div style={{
                            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                            background: 'var(--color-pl-surface)',
                            border: '1px solid var(--color-pl-border)',
                            borderRadius: 10,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            minWidth: 220,
                            zIndex: 1000,
                            overflow: 'hidden',
                            animation: 'slideDown 0.15s ease',
                        }}>
                            <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`}</style>

                            {/* User info */}
                            <div style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--color-pl-border)',
                            }}>
                                <div style={{ fontSize: 11, color: 'var(--color-pl-text-sub)', marginBottom: 2 }}>
                                    Angemeldet als
                                </div>
                                <div style={{
                                    fontSize: 13, fontWeight: 600,
                                    color: 'var(--color-pl-text)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {user.email}
                                </div>
                            </div>

                            {/* Settings link */}
                            <Link
                                href="/dashboard/settings"
                                onClick={() => setMenuOpen(false)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 16px',
                                    color: 'var(--color-pl-text-secondary)',
                                    fontSize: 13, fontWeight: 500,
                                    textDecoration: 'none',
                                    borderBottom: '1px solid var(--color-pl-border)',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                            >
                                <Settings size={15} />
                                Einstellungen
                            </Link>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                disabled={isPending}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 16px',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: isPending ? 'var(--color-pl-text-sub)' : '#ef4444',
                                    fontSize: 13, fontWeight: 600,
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                            >
                                <LogOut size={15} />
                                {isPending ? 'Abmelden…' : 'Abmelden'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
