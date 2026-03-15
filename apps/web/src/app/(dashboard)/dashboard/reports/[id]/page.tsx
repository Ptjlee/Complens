import { getAnalysisForReport } from '../actions'
import { notFound } from 'next/navigation'
import ReportView from './ReportView'

export default async function ReportDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const { analysis, explanations, remediationPlans, org } = await getAnalysisForReport(id)
    if (!analysis) notFound()
    return (
        <ReportView
            analysis={analysis}
            explanations={explanations}
            remediationPlans={remediationPlans}
            orgName={org?.name ?? 'Organisation'}
        />
    )
}
