import { getAllDatasets } from '../analysis/actions'
import DatasetsClient from './DatasetsClient'

export const metadata = {
    title: 'Datensätze verwalten — CompLens',
    description: 'Importierte Datensätze anzeigen und verwalten.',
}

export default async function DatasetsPage() {
    const datasets = await getAllDatasets()
    return <DatasetsClient datasets={datasets} />
}
