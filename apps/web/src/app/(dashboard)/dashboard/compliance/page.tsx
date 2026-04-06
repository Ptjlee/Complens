import {
    ShieldCheck, Server, Lock, UserCheck, FileText,
    CheckCircle2, Globe, Cpu, Key, Trash2, AlertCircle,
    Building2, Mail,
} from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
    const t = await getTranslations('metadata')
    return {
        title: t('complianceTitle'),
        description: t('complianceDescription'),
    }
}

// ─── Reusable components ───────────────────────────────────────────────────────

function SectionCard({
    icon, title, iconColor, children,
}: {
    icon: React.ReactNode
    title: string
    iconColor: string
    children: React.ReactNode
}) {
    return (
        <div className="glass-card p-6">
            <h2
                className="text-base font-bold mb-4 flex items-center gap-2"
                style={{ color: 'var(--color-pl-text-primary)' }}
            >
                <span style={{ color: iconColor }}>{icon}</span>
                {title}
            </h2>
            {children}
        </div>
    )
}

function CheckItem({ label, detail }: { label: string; detail: string }) {
    return (
        <li className="flex items-start gap-2.5">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
            <span className="text-sm leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>
                <strong style={{ color: 'var(--color-pl-text-primary)' }}>{label}:</strong>{' '}
                {detail}
            </span>
        </li>
    )
}

function Tag({ label, color }: { label: string; color: string }) {
    return (
        <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
        >
            {label}
        </span>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function CompliancePage() {
    const t = await getTranslations('compliance')

    const SUBPROCESSORS = [
        {
            name:     'Supabase (AWS eu-central-1)',
            role:     t('subprocessors.supabaseRole'),
            region:   t('subprocessors.supabaseRegion'),
            basis:    t('subprocessors.supabaseBasis'),
            certs:    ['SOC 2 Typ II'],
        },
        {
            name:     'Vercel (Edge Region fra1)',
            role:     t('subprocessors.vercelRole'),
            region:   t('subprocessors.vercelRegion'),
            basis:    t('subprocessors.vercelBasis'),
            certs:    ['SOC 2 Typ II'],
        },
        {
            name:     t('subprocessors.googleName'),
            role:     t('subprocessors.googleRole'),
            region:   t('subprocessors.googleRegion'),
            basis:    t('subprocessors.googleBasis'),
            certs:    ['ISO 27001', 'SOC 2'],
        },
        {
            name:     'Resend',
            role:     t('subprocessors.resendRole'),
            region:   t('subprocessors.resendRegion'),
            basis:    t('subprocessors.resendBasis'),
            certs:    ['SOC 2'],
        },
    ]

    return (
        <div className="flex flex-col h-full overflow-auto space-y-6 pb-8">

            {/* ── Header ── */}
            <div className="pb-5 border-b" style={{ borderColor: 'var(--color-pl-border)' }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('heading')}
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('subheading')}{' '}
                            <a href="mailto:datenschutz@complens.de" className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>
                                datenschutz@complens.de
                            </a>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Tag label={t('tagGdpr')} color="#22c55e" />
                        <Tag label="EU AI Act" color="#6366f1" />
                        <Tag label={t('tagMadeIn')} color="#3b82f6" />
                    </div>
                </div>
            </div>

            {/* ── Summary banner ── */}
            <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
                <ShieldCheck size={22} className="shrink-0 mt-0.5" style={{ color: '#6366f1' }} />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>
                    {t.rich('summaryBanner', {
                        strong: (chunks) => <strong style={{ color: 'var(--color-pl-text-primary)' }}>{chunks}</strong>,
                    })}
                </p>
            </div>

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left column ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. Server infrastructure */}
                    <SectionCard icon={<Server size={20} />} title={t('infrastructure.title')} iconColor="#a855f7">
                        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('infrastructure.intro')}
                        </p>
                        <div className="space-y-3">
                            {([
                                {
                                    name: t('infrastructure.dbName'),
                                    provider: 'Supabase / AWS eu-central-1',
                                    location: t('infrastructure.dbLocation'),
                                    detail: t('infrastructure.dbDetail'),
                                },
                                {
                                    name: t('infrastructure.frontendName'),
                                    provider: 'Vercel (Region fra1)',
                                    location: t('infrastructure.frontendLocation'),
                                    detail: t('infrastructure.frontendDetail'),
                                },
                                {
                                    name: t('infrastructure.aiName'),
                                    provider: 'Google Gemini 2.5 Pro (EU-API)',
                                    location: t('infrastructure.aiLocation'),
                                    detail: t('infrastructure.aiDetail'),
                                },
                                {
                                    name: t('infrastructure.emailName'),
                                    provider: 'Resend',
                                    location: t('infrastructure.emailLocation'),
                                    detail: t('infrastructure.emailDetail'),
                                },
                            ]).map((s) => (
                                <div
                                    key={s.name}
                                    className="rounded-lg p-3"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-pl-border)' }}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
                                        <span className="text-xs font-bold" style={{ color: 'var(--color-pl-text-primary)' }}>
                                            {s.name}
                                        </span>
                                        <span className="text-xs" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                            {s.location}
                                        </span>
                                    </div>
                                    <span className="text-xs font-medium" style={{ color: 'var(--color-pl-brand-light)' }}>
                                        {s.provider}
                                    </span>
                                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                        {s.detail}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* 2. TOMs */}
                    <SectionCard icon={<Lock size={20} />} title={t('toms.title')} iconColor="#3b82f6">
                        <p className="text-sm mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('toms.summary')}
                        </p>
                        <Link
                            href="/toms"
                            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--color-pl-brand-light)' }}
                        >
                            {t('toms.fullTomsLink')} →
                        </Link>
                    </SectionCard>

                    {/* 3. EU AI Act */}
                    <SectionCard icon={<Cpu size={20} />} title={t('aiAct.title')} iconColor="#f59e0b">
                        <div
                            className="rounded-lg p-3 mb-4 text-xs"
                            style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', color: '#d97706' }}
                        >
                            {t.rich('aiAct.banner', {
                                strong: (chunks) => <strong>{chunks}</strong>,
                            })}
                        </div>
                        <ul className="space-y-3">
                            <CheckItem
                                label={t('aiAct.rolesLabel')}
                                detail={t('aiAct.rolesDetail')}
                            />
                            <CheckItem
                                label={t('aiAct.humanLabel')}
                                detail={t('aiAct.humanDetail')}
                            />
                            <CheckItem
                                label={t('aiAct.transparencyLabel')}
                                detail={t('aiAct.transparencyDetail')}
                            />
                            <CheckItem
                                label={t('aiAct.noTrainingLabel')}
                                detail={t('aiAct.noTrainingDetail')}
                            />
                            <CheckItem
                                label={t('aiAct.minimisationLabel')}
                                detail={t('aiAct.minimisationDetail')}
                            />
                        </ul>
                    </SectionCard>

                    {/* 4. EU Directive */}
                    <SectionCard icon={<FileText size={20} />} title={t('directive.title')} iconColor="#10b981">
                        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('directive.intro')}
                        </p>
                        <ul className="space-y-2 text-sm" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {([
                                t('directive.item1'),
                                t('directive.item2'),
                                t('directive.item3'),
                                t('directive.item4'),
                                t('directive.item5'),
                                t('directive.item6'),
                            ]).map((item) => (
                                <li key={item} className="flex items-start gap-2">
                                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </SectionCard>

                    {/* 5. Sub-processors */}
                    <SectionCard icon={<Globe size={20} />} title={t('subprocessors.title')} iconColor="#8b5cf6">
                        <p className="text-sm mb-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('subprocessors.intro')}
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                                        {[t('subprocessors.colProvider'), t('subprocessors.colPurpose'), t('subprocessors.colRegion'), t('subprocessors.colLegalBasis')].map((h) => (
                                            <th key={h} className="text-left pb-2 pr-4 font-semibold"
                                                style={{ color: 'var(--color-pl-text-tertiary)' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {SUBPROCESSORS.map((sp) => (
                                        <tr key={sp.name} style={{ borderBottom: '1px solid var(--color-pl-border)' }}>
                                            <td className="py-2.5 pr-4 font-medium" style={{ color: 'var(--color-pl-text-primary)' }}>
                                                {sp.name}
                                            </td>
                                            <td className="py-2.5 pr-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                                {sp.role}
                                            </td>
                                            <td className="py-2.5 pr-4" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                                {sp.region}
                                            </td>
                                            <td className="py-2.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                                                {sp.basis}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                </div>

                {/* ── Right sidebar ── */}
                <div className="space-y-5">

                    {/* DPA CTA */}
                    <div
                        className="glass-card p-5 border-l-4"
                        style={{ borderColor: 'var(--color-pl-brand)' }}
                    >
                        <ShieldCheck size={28} className="mb-3" style={{ color: 'var(--color-pl-brand)' }} />
                        <h3 className="text-sm font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('sidebar.dpaTitle')}
                        </h3>
                        <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('sidebar.dpaDescription')}
                        </p>
                        <a
                            href="/api/contracts/avv"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary w-full text-xs py-2 text-center block"
                            style={{ textDecoration: 'none' }}
                        >
                            {t('sidebar.dpaDownload')}
                        </a>
                        <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-pl-text-tertiary)' }}>
                            {t('sidebar.dpaQuestions')}{' '}
                            <a href="mailto:datenschutz@complens.de" className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>
                                datenschutz@complens.de
                            </a>
                        </p>
                    </div>

                    {/* Data deletion policy */}
                    <div className="glass-card p-5">
                        <Trash2 size={18} className="mb-2" style={{ color: '#ef4444' }} />
                        <h3 className="text-sm font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('sidebar.deletionTitle')}
                        </h3>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t('sidebar.deletionDescription')}
                        </p>
                    </div>

                    {/* Data subject rights */}
                    <div className="glass-card p-5">
                        <UserCheck size={18} className="mb-2" style={{ color: '#10b981' }} />
                        <h3 className="text-sm font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('sidebar.rightsTitle')}
                        </h3>
                        <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            {t.rich('sidebar.rightsDescription', {
                                link: (chunks) => (
                                    <a href="/dashboard/portal" className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>
                                        {chunks}
                                    </a>
                                ),
                            })}
                        </p>
                    </div>

                    {/* Controller */}
                    <div className="glass-card p-5">
                        <Building2 size={18} className="mb-2" style={{ color: '#6366f1' }} />
                        <h3 className="text-sm font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('sidebar.controllerTitle')}
                        </h3>
                        <p className="text-xs leading-relaxed space-y-0.5" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            <strong style={{ color: 'var(--color-pl-text-primary)' }}>DexterBee GmbH</strong><br />
                            Industriestr. 13 · 63755 Alzenau<br />
                            HRB 17694 · AG Aschaffenburg<br />
                            {t('sidebar.controllerCeo')}: Stephan Dongjin Oh<br />
                            {t('sidebar.controllerVat')}: DE369096037
                        </p>
                    </div>

                    {/* Contact */}
                    <div className="glass-card p-5">
                        <Mail size={18} className="mb-2" style={{ color: '#f59e0b' }} />
                        <h3 className="text-sm font-bold mb-1.5" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('sidebar.contactTitle')}
                        </h3>
                        <div className="text-xs space-y-1" style={{ color: 'var(--color-pl-text-secondary)' }}>
                            <div>
                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('sidebar.contactGeneral')}: </span>
                                <Link href="/dashboard/help" className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>
                                    {t('sidebar.contactSupportLink')}
                                </Link>
                            </div>
                            <div>
                                <span style={{ color: 'var(--color-pl-text-tertiary)' }}>{t('sidebar.contactPrivacy')}: </span>
                                <a href="mailto:datenschutz@complens.de" className="underline" style={{ color: 'var(--color-pl-brand-light)' }}>
                                    datenschutz@complens.de
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Certifications */}
                    <div className="glass-card p-5">
                        <Key size={18} className="mb-2" style={{ color: '#22c55e' }} />
                        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-pl-text-primary)' }}>
                            {t('sidebar.certsTitle')}
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                'SOC 2 Typ II',
                                'ISO 27001',
                                'TLS 1.3',
                                'AES-256',
                                t('sidebar.certsGdprArt28'),
                                'EU AI Act',
                                'eIDAS',
                            ].map((c) => (
                                <span
                                    key={c}
                                    className="text-xs px-2 py-0.5 rounded"
                                    style={{
                                        background: 'rgba(34,197,94,0.1)',
                                        color: '#22c55e',
                                        border: '1px solid rgba(34,197,94,0.2)',
                                    }}
                                >
                                    {c}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Notice */}
                    <div
                        className="rounded-xl p-4 text-xs"
                        style={{
                            background: 'rgba(245,158,11,0.06)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            color: '#d97706',
                        }}
                    >
                        <AlertCircle size={14} className="inline mr-1 mb-0.5" />
                        {t.rich('sidebar.notice', {
                            strong: (chunks) => <strong>{chunks}</strong>,
                        })}{' '}
                        <a href="mailto:datenschutz@complens.de" className="underline">
                            datenschutz@complens.de
                        </a>.
                    </div>
                </div>
            </div>
        </div>
    )
}
