import { getRemediationAnalyses, getRemediationPlans } from './actions'
import RemediationClient from './RemediationClient'

export const dynamic = 'force-dynamic'   // never serve a stale cached version

export const metadata = {
    title: 'Maßnahmen — CompLens',
    description: 'KI-gestützte Maßnahmenpläne für Entgeltlücken nach EU-Richtlinie 2023/970.',
}

export default async function RemediationPage() {
    const analyses = await getRemediationAnalyses()
    // Pre-load plans for the default (first) analysis so they're in
    // the initial React state — avoids the "born empty, loaded async" race.
    const initialPlans = analyses[0]
        ? await getRemediationPlans(analyses[0].id)
        : []
    return <RemediationClient analyses={analyses} initialPlans={initialPlans} />
}
