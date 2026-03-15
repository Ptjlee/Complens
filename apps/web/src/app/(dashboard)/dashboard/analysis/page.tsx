import { getReadyDatasets } from './actions'
import AnalysisPageClient from './AnalysisPage'

export const metadata = {
    title: 'Analyse — CompLens',
    description: 'EU-konforme Entgeltlückenanalyse nach EU-Richtlinie 2023/970.',
}

export default async function AnalysisPage() {
    const datasets = await getReadyDatasets()

    return (
        <AnalysisPageClient datasets={datasets} />
    )
}
