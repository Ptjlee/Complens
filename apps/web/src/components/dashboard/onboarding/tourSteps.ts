export type TourStep = {
    id: string
    selector: string | null // null = centered card (no spotlight)
    titleKey: string
    bodyKey: string
    ctaKey?: string
    ctaHref?: string
    position: 'center' | 'right' | 'bottom'
}

export const TOUR_STEPS: TourStep[] = [
    { id: 'welcome', selector: null, titleKey: 'welcome.title', bodyKey: 'welcome.body', position: 'center' },
    { id: 'sidebar', selector: 'aside', titleKey: 'sidebar.title', bodyKey: 'sidebar.body', position: 'right' },
    { id: 'import', selector: '[data-tour="nav-import"]', titleKey: 'import.title', bodyKey: 'import.body', ctaKey: 'import.cta', ctaHref: '/dashboard/import', position: 'right' },
    { id: 'analysis', selector: '[data-tour="nav-analysis"]', titleKey: 'analysis.title', bodyKey: 'analysis.body', position: 'right' },
    { id: 'salaryBands', selector: '[data-tour="nav-salary-bands"]', titleKey: 'salaryBands.title', bodyKey: 'salaryBands.body', position: 'right' },
    { id: 'jobArchitecture', selector: '[data-tour="nav-job-architecture"]', titleKey: 'jobArchitecture.title', bodyKey: 'jobArchitecture.body', position: 'right' },
    { id: 'reports', selector: '[data-tour="nav-reports"]', titleKey: 'reports.title', bodyKey: 'reports.body', position: 'right' },
    { id: 'settings', selector: '[data-tour="nav-settings"]', titleKey: 'settings.title', bodyKey: 'settings.body', position: 'right' },
    { id: 'help', selector: '[data-tour="nav-help"]', titleKey: 'help.title', bodyKey: 'help.body', position: 'right' },
    { id: 'chatbot', selector: '#chatbot-toggle', titleKey: 'chatbot.title', bodyKey: 'chatbot.body', position: 'right' },
    { id: 'complete', selector: null, titleKey: 'complete.title', bodyKey: 'complete.body', ctaKey: 'complete.cta', ctaHref: '/dashboard/import', position: 'center' },
]
