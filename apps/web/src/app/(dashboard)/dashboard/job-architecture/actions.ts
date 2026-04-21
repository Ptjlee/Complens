'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient }   from '@/lib/supabase/server'
import { requireAdminRoleAction } from '@/lib/api/planGuard'
import type {
    ActionResult,
    AssistantGeneratedStructure,
    LevelingStructure,
    LevelDefinition,
} from '@/lib/jobArchitecture/types'

const JA_PATH = '/dashboard/job-architecture'

// ============================================================
// Leveling Structure — CRUD
// ============================================================

/** Copy all default_level_definitions into a new leveling structure for the org. */
export async function initializeFromTemplate(): Promise<ActionResult<LevelingStructure>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()

    // Detect locale for content language
    const cookieStore = await cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'de'

    const structureName = locale === 'en' ? 'CompLens Standard (L1-L10)' : 'CompLens Standard (L1-L10)'
    const structureDesc = locale === 'en'
        ? 'Standard 10-level framework based on the CompLens template.'
        : 'Standard-10-Stufen-Framework basierend auf der CompLens-Vorlage.'

    // Create the structure
    const { data: structure, error: sErr } = await supabase
        .from('leveling_structures')
        .insert({
            org_id: auth.orgId,
            name: structureName,
            description: structureDesc,
            is_default: true,
            source: 'template_l1_l10',
        })
        .select()
        .single()

    if (sErr || !structure) return { success: false, error: sErr?.message ?? 'Failed to create structure.' }

    // Set all other structures to non-default
    await supabase
        .from('leveling_structures')
        .update({ is_default: false })
        .eq('org_id', auth.orgId)
        .neq('id', structure.id)

    // Fetch template levels
    const { data: defaults } = await supabase
        .from('default_level_definitions')
        .select('*')
        .order('level')

    if (defaults && defaults.length > 0) {
        const deOverrides: Record<string, { title: string; desc: string; ps: string; acc: string; pm: string; ke: string; ci: string; adr: string }> = {
            L1:  { title: 'Werkstudent / Praktikant', desc: 'Einstiegsrolle mit strukturierten Aufgaben unter enger Anleitung.', ps: 'Bearbeitet klar definierte Routineaufgaben anhand dokumentierter Verfahren und mit enger Begleitung.', acc: 'Verantwortlich für die korrekte und termingerechte Erledigung zugewiesener Aufgaben.', pm: 'Keine Personalverantwortung. Wird von erfahrenen Kolleg*innen angeleitet.', ke: 'Grundlagenwissen; eignet sich aktiv Kernkonzepte und Arbeitsmittel des Fachbereichs an.', ci: 'Kommuniziert innerhalb des unmittelbaren Teams. Stellt Rückfragen und berichtet über den Arbeitsstand.', adr: 'Arbeitet nach detaillierten Vorgaben. Gibt alle nicht-routinemäßigen Themen an die Führungskraft weiter.' },
            L2:  { title: 'Sachbearbeiter*in / Junior-Referent*in', desc: 'Berufseinsteiger*in mit zunehmender Eigenständigkeit in definierten Aufgabenbereichen.', ps: 'Bearbeitet einfache Sachverhalte innerhalb festgelegter Prozesse mit punktueller Unterstützung.', acc: 'Verantwortlich für die eigene Aufgabenerledigung innerhalb vorgegebener Fristen und Qualitätsstandards.', pm: 'Keine Personalverantwortung. Arbeitet kollegial im Team zusammen.', ke: 'Baut Fachwissen im Kernbereich auf und wendet erlernte Methoden unter Anleitung an.', ci: 'Kommuniziert im Team, gibt Statusupdates und holt bei Bedarf Klärung ein.', adr: 'Arbeitet mit regelmäßiger Abstimmung. Folgt etablierten Prozessen mit wenig Gestaltungsspielraum.' },
            L3:  { title: 'Referent*in / Spezialist*in', desc: 'Fachlich versierte Kraft mit eigenständiger Arbeitsweise im definierten Verantwortungsbereich.', ps: 'Bearbeitet Sachverhalte mittlerer Komplexität eigenständig. Erkennt Probleme und erarbeitet Lösungsvorschläge.', acc: 'Verantwortlich für eigene Arbeitsergebnisse und deren Qualität. Trägt zu den Teamzielen bei.', pm: 'Keine Personalverantwortung. Kann Berufseinsteiger*innen oder Praktikant*innen fachlich anleiten.', ke: 'Solides Fachwissen im Kernbereich. Wendet Standardmethoden sicher und selbständig an.', ci: 'Kommuniziert teamübergreifend und mit angrenzenden Fachbereichen. Präsentiert Ergebnisse vor Kolleg*innen und Vorgesetzten.', adr: 'Arbeitet eigenständig an definierten Aufgaben. Entscheidet im Rahmen bestehender Richtlinien; eskaliert bei Ausnahmen.' },
            L4:  { title: 'Senior-Referent*in / Senior-Spezialist*in', desc: 'Erfahrene Fachkraft für komplexe Themen und Projekte mit hoher Eigenverantwortung.', ps: 'Analysiert komplexe, bereichsübergreifende Fragestellungen und entwickelt fundierte Lösungsalternativen.', acc: 'Verantwortlich für Projektergebnisse und Qualitätsstandards innerhalb der eigenen Fachdisziplin.', pm: 'Kann 1-3 Nachwuchskräfte fachlich betreuen. Gibt Anleitung und führt fachliche Reviews durch.', ke: 'Tiefgehende Fachexpertise im Kernbereich mit fundiertem Verständnis angrenzender Themenfelder.', ci: 'Kommuniziert teamübergreifend und mit Entscheidungsträgern auf mittlerer Ebene. Beeinflusst fachliche Entscheidungen.', adr: 'Arbeitet eigenständig und trifft operative Entscheidungen im Rahmen bestehender Vorgaben. Setzt eigene Prioritäten.' },
            L5:  { title: 'Teamleiter*in / Fachliche Leitung', desc: 'Erste Führungsebene oder fachliche Leitungsfunktion mit bereichsübergreifender Verantwortung.', ps: 'Löst komplexe, funktionsübergreifende Probleme. Entwickelt neue Ansätze, wenn bestehende Methoden nicht greifen.', acc: 'Verantwortlich für Arbeitspakete oder Projektergebnisse. Entscheidungen wirken sich auf Produktivität und Qualität des Teams aus.', pm: 'Führt ein kleines Team (2-5 Personen) oder übernimmt eine fachliche Leitungsrolle. Mentoring und Coaching.', ke: 'Tiefgehende Expertise im Kernbereich mit solidem Überblick über angrenzende Fachgebiete. Intern als Expert*in anerkannt.', ci: 'Kommuniziert funktionsübergreifend und mit dem gehobenen Management. Beeinflusst Fach- und Prozessentscheidungen.', adr: 'Gestaltet die eigene Agenda innerhalb strategischer Leitplanken. Trifft eigenständige Entscheidungen zu Methodik und Vorgehen.' },
            L6:  { title: 'Teamleitung / Fachexpert*in', desc: 'Teamleitung oder ausgewiesene Fachexpertise mit Budget- und Personalverantwortung.', ps: 'Löst komplexe Probleme, die mehrere Teams oder Bereiche betreffen. Priorisiert bei konkurrierenden Anforderungen.', acc: 'Verantwortlich für Teamergebnisse, Budgets und Personalentwicklung.', pm: 'Führt ein Team von 5-15 Mitarbeitenden. Verantwortet Einstellung, Entwicklung und Leistungssteuerung.', ke: 'Breite Fachexpertise im Verantwortungsbereich. Versteht den organisatorischen Kontext und geschäftliche Zusammenhänge.', ci: 'Kommuniziert mit der Führungsebene und funktionsübergreifend auf Augenhöhe. Verhandelt Ressourcen und Prioritäten.', adr: 'Handelt mit hoher Eigenverantwortung innerhalb der Abteilungsstrategie. Trifft Personalentscheidungen.' },
            L7:  { title: 'Abteilungsleitung', desc: 'Leitung mehrerer Teams oder einer gesamten Funktion.', ps: 'Bearbeitet strategische Fragestellungen mit organisatorischer Tragweite. Antizipiert Risiken und entwickelt Gegenmaßnahmen.', acc: 'Verantwortlich für mehrere Teams oder eine Funktion. Trägt erhebliche Budget- und Personalverantwortung.', pm: 'Führt 15-30 Mitarbeitende inkl. Teamleitungen. Entwickelt die nächste Führungsgeneration.', ke: 'Übergreifende Expertise über mehrere Fachgebiete. Trägt zu branchenweiten Best Practices bei.', ci: 'Kommuniziert mit der Geschäftsleitung und externen Partnern. Gestaltet die Abteilungsstrategie mit.', adr: 'Setzt funktionale Prioritäten eigenständig. Trifft Entscheidungen mit erheblicher finanzieller und organisatorischer Tragweite.' },
            L8:  { title: 'Bereichsleitung', desc: 'Leitung eines Bereichs mit P&L-Verantwortung.', ps: 'Löst komplexe, bereichsübergreifende Problemstellungen mit erheblichen finanziellen und organisatorischen Auswirkungen.', acc: 'Verantwortlich für die Bereichs-P&L, strategische Zielerreichung und den Aufbau der Talent-Pipeline.', pm: 'Führt 30-80+ Mitarbeitende über mehrere Teams. Stellt ein, entwickelt und befördert Führungskräfte.', ke: 'Übergreifende Expertise über mehrere Bereiche. Externer Thought Leader. Prägt Branchenstandards.', ci: 'Präsentiert vor Geschäftsleitung und Aufsichtsgremien. Vertritt die Organisation nach außen.', adr: 'Bestimmt die Bereichsausrichtung eigenständig. Geht bindende Verpflichtungen für die Organisation ein.' },
            L9:  { title: 'Geschäftsbereichsleitung', desc: 'Leitung eines Geschäftsbereichs mit strategischer Gesamtverantwortung.', ps: 'Löst strategische Herausforderungen auf Unternehmensebene. Steuert durch regulatorische, Markt- und Wettbewerbsdynamiken.', acc: 'Verantwortlich für den Geschäftsbereich oder große funktionale Einheiten. Verantwortet die Mehrjahresstrategie.', pm: 'Führt 80-300+ Mitarbeitende über mehrere Abteilungen. Gestaltet das Organisationsdesign.', ke: 'Thought Leader mit tiefer und breiter Expertise. Gibt Impulse für die Branchenentwicklung.', ci: 'Kommuniziert auf Vorstands- und Aufsichtsratsebene sowie mit Investoren und Regulierungsbehörden. Prägt die funktionale Positionierung.', adr: 'Volle Ergebnisverantwortung im Mandat. Trifft strategische Entscheidungen mit langfristiger Bindungswirkung.' },
            L10: { title: 'Geschäftsführung / Vorstand', desc: 'Oberste Führungsebene mit unternehmerischer Gesamtverantwortung.', ps: 'Definiert die strategische Agenda des Unternehmens. Steuert durch geopolitische, regulatorische und Marktdynamiken.', acc: 'Trägt die Gesamtverantwortung für Unternehmensergebnisse: Umsatz, Marktposition, Compliance und Unternehmenskultur.', pm: 'Führt gesamte Funktionen oder Geschäftsbereiche (100-1000+ Mitarbeitende). Gestaltet das Organisationsdesign.', ke: 'Visionäre Expertise. Setzt Maßstäbe in der Branche. Berät Aufsichtsräte und Regulierungsbehörden.', ci: 'Kommuniziert auf Vorstands- und Aufsichtsratsebene, gegenüber Medien, Investoren und Regulierungsbehörden. Prägt das Unternehmensnarrativ.', adr: 'Volle Ergebnisverantwortung im Mandat. Berichtet an Aufsichtsrat/CEO. Trifft strategische Entscheidungen mit weitreichenden Konsequenzen.' },
        }

        const rows = defaults.map((d: Record<string, unknown>, i: number) => {
            const code = d.level as string
            const de = locale === 'de' ? deOverrides[code] : null
            return {
                org_id: auth.orgId,
                structure_id: structure.id,
                level_code: code,
                sort_order: i,
                title_examples: de?.title ?? d.title_examples ?? null,
                description: de?.desc ?? d.description ?? null,
                problem_solving: de?.ps ?? d.problem_solving ?? null,
                accountability: de?.acc ?? d.accountability ?? null,
                people_management: de?.pm ?? d.people_management ?? null,
                knowledge_expertise: de?.ke ?? d.knowledge_expertise ?? null,
                communication_influence: de?.ci ?? d.communication_influence ?? null,
                autonomy_decision_rights: de?.adr ?? d.autonomy_decision_rights ?? null,
            }
        })
        await supabase.from('level_definitions').insert(rows)
    }

    revalidatePath(JA_PATH)
    return { success: true, data: structure as LevelingStructure }
}

export async function createLevelingStructure(input: {
    name: string
    description?: string
}): Promise<ActionResult<LevelingStructure>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('leveling_structures')
        .insert({
            org_id: auth.orgId,
            name: input.name,
            description: input.description ?? null,
            is_default: false,
            source: 'custom',
        })
        .select()
        .single()

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: data as LevelingStructure }
}

export async function updateLevelingStructure(
    id: string,
    input: { name?: string; description?: string },
): Promise<ActionResult<LevelingStructure>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('leveling_structures')
        .update(input)
        .eq('id', id)
        .eq('org_id', auth.orgId)
        .select()
        .single()

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: data as LevelingStructure }
}

export async function deleteLevelingStructure(id: string): Promise<ActionResult> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
        .from('leveling_structures')
        .delete()
        .eq('id', id)
        .eq('org_id', auth.orgId)

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: undefined }
}

export async function setDefaultStructure(id: string): Promise<ActionResult> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()

    // Clear all defaults for this org
    await supabase
        .from('leveling_structures')
        .update({ is_default: false })
        .eq('org_id', auth.orgId)

    // Set the chosen one
    const { error } = await supabase
        .from('leveling_structures')
        .update({ is_default: true })
        .eq('id', id)
        .eq('org_id', auth.orgId)

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: undefined }
}

// ── Level Definitions ───────────────────────────────────────

export async function createLevelDefinition(input: {
    structure_id: string
    level_code: string
    sort_order: number
    title_examples?: string
    description?: string
    problem_solving?: string
    accountability?: string
    people_management?: string
    knowledge_expertise?: string
    communication_influence?: string
    autonomy_decision_rights?: string
}): Promise<ActionResult<LevelDefinition>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('level_definitions')
        .insert({
            org_id: auth.orgId,
            structure_id: input.structure_id,
            level_code: input.level_code,
            sort_order: input.sort_order,
            title_examples: input.title_examples ?? null,
            description: input.description ?? null,
            problem_solving: input.problem_solving ?? null,
            accountability: input.accountability ?? null,
            people_management: input.people_management ?? null,
            knowledge_expertise: input.knowledge_expertise ?? null,
            communication_influence: input.communication_influence ?? null,
            autonomy_decision_rights: input.autonomy_decision_rights ?? null,
        })
        .select()
        .single()

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: data as LevelDefinition }
}

export async function updateLevelDefinition(
    id: string,
    input: Partial<{
        level_code: string
        sort_order: number
        title_examples: string
        description: string
        problem_solving: string
        accountability: string
        people_management: string
        knowledge_expertise: string
        communication_influence: string
        autonomy_decision_rights: string
    }>,
): Promise<ActionResult<LevelDefinition>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('level_definitions')
        .update(input)
        .eq('id', id)
        .eq('org_id', auth.orgId)
        .select()
        .single()

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: data as LevelDefinition }
}

export async function deleteLevelDefinition(id: string): Promise<ActionResult> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()
    const { error } = await supabase
        .from('level_definitions')
        .delete()
        .eq('id', id)
        .eq('org_id', auth.orgId)

    if (error) return { success: false, error: error.message }
    revalidatePath(JA_PATH)
    return { success: true, data: undefined }
}

export async function reorderLevels(
    structureId: string,
    orderedIds: string[],
): Promise<ActionResult> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()

    // Update sort_order for each level based on array position
    const updates = orderedIds.map((id, index) =>
        supabase
            .from('level_definitions')
            .update({ sort_order: index })
            .eq('id', id)
            .eq('org_id', auth.orgId)
            .eq('structure_id', structureId)
    )

    const results = await Promise.all(updates)
    const failed = results.find(r => r.error)
    if (failed?.error) return { success: false, error: failed.error.message }

    revalidatePath(JA_PATH)
    return { success: true, data: undefined }
}

/** Create a full leveling structure + all levels from AI assistant output. */
export async function saveLevelingStructureFromAssistant(
    input: AssistantGeneratedStructure,
): Promise<ActionResult<LevelingStructure>> {
    const auth = await requireAdminRoleAction()
    if ('error' in auth) return { success: false, error: auth.error }

    const supabase = await createClient()

    const { data: structure, error: sErr } = await supabase
        .from('leveling_structures')
        .insert({
            org_id: auth.orgId,
            name: input.name,
            description: input.description,
            is_default: true,
            source: 'assistant_generated',
        })
        .select()
        .single()

    if (sErr || !structure) return { success: false, error: sErr?.message ?? 'Failed to create structure.' }

    // Set all other structures to non-default
    await supabase
        .from('leveling_structures')
        .update({ is_default: false })
        .eq('org_id', auth.orgId)
        .neq('id', structure.id)

    if (input.levels.length > 0) {
        const rows = input.levels.map(l => ({
            org_id: auth.orgId,
            structure_id: structure.id,
            level_code: l.level_code,
            sort_order: l.sort_order,
            title_examples: l.title_examples,
            description: l.description,
            problem_solving: l.problem_solving,
            accountability: l.accountability,
            people_management: l.people_management,
            knowledge_expertise: l.knowledge_expertise,
            communication_influence: l.communication_influence,
            autonomy_decision_rights: l.autonomy_decision_rights,
        }))
        const { error: lErr } = await supabase.from('level_definitions').insert(rows)
        if (lErr) return { success: false, error: lErr.message }
    }

    revalidatePath(JA_PATH)
    return { success: true, data: structure as LevelingStructure }
}
