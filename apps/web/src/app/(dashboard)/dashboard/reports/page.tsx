import { getAllAnalyses } from './actions'
import ReportsListClient from './ReportsList'

export const metadata = {
    title: 'Berichte — CompLens',
    description: 'EU-konforme Entgeltberichte nach Art. 9 EU-Richtlinie 2023/970.',
}

export default async function ReportsPage() {
    const analyses = await getAllAnalyses()
    return <ReportsListClient analyses={analyses} />
}
