'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateOrgName(name: string): Promise<{ error?: string }> {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) {
        return { error: 'Name muss mindestens 2 Zeichen lang sein.' }
    }
    if (trimmed.length > 100) {
        return { error: 'Name darf maximal 100 Zeichen lang sein.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    // Get org_id and verify admin role in one query
    const { data: member } = await supabase
        .from('organisation_members')
        .select('org_id, role')
        .eq('user_id', user.id)
        .single()

    if (!member) return { error: 'Mitgliedschaft nicht gefunden.' }
    if (member.role !== 'admin') {
        return { error: 'Nur Administratoren können den Unternehmensnamen ändern.' }
    }

    const { error } = await supabase
        .from('organisations')
        .update({ name: trimmed })
        .eq('id', member.org_id)

    if (error) {
        return { error: 'Aktualisierung fehlgeschlagen: ' + error.message }
    }

    revalidatePath('/dashboard/settings')
    return {}
}

