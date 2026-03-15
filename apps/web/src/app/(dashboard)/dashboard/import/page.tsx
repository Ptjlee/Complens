import ImportWizard from './ImportWizard'

export const metadata = {
    title: 'Daten importieren — CompLens',
    description: 'Laden Sie Ihre Gehaltsdaten hoch und lassen Sie die KI die Spaltenzuordnung automatisch erkennen.',
}

export default function ImportPage() {
    return <ImportWizard />
}
