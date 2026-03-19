import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Lang } from '@/lib/i18n/translations'

const VALID_LANGS: Lang[] = ['de', 'en']

/**
 * POST /api/profile/language
 * Body: { language: 'de' | 'en' }
 * Updates preferred_language for the authenticated user's member row.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { language }: { language: Lang } = await req.json()
        if (!VALID_LANGS.includes(language)) {
            return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
        }

        const { error } = await supabase
            .from('organisation_members')
            .update({ preferred_language: language })
            .eq('user_id', user.id)

        if (error) {
            console.error('[profile/language]', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ ok: true, language })
    } catch (err) {
        console.error('[profile/language]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
