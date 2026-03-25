import { getAnalysisForReport } from '../actions'
import { getBandContext } from '@/lib/band/getBandContext'
import { notFound } from 'next/navigation'
import ReportView from './ReportView'

export default async function ReportDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const [{ analysis, explanations, remediationPlans, org }, bandCtx] = await Promise.all([
        getAnalysisForReport(id),
        getBandContext(),
    ])
    if (!analysis) notFound()
    return (
        <ReportView
            analysis={analysis}
            explanations={explanations}
            remediationPlans={remediationPlans}
            orgName={org?.name ?? 'Organisation'}
            bandGrades={bandCtx.grades}
        />
    )
}
