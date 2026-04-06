import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_LANGS = ['de', 'en'] as const
type Lang = (typeof VALID_LANGS)[number]

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

        // Use admin client to bypass RLS on organisation_members
        const admin = createAdminClient()
        const { error } = await admin
            .from('organisation_members')
            .update({ preferred_language: language })
            .eq('user_id', user.id)

        if (error) {
            console.error('[profile/language]', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Set NEXT_LOCALE cookie so next-intl picks up the language on SSR
        const res = NextResponse.json({ ok: true, language })
        res.cookies.set('NEXT_LOCALE', language, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'lax',
            httpOnly: false,
        })
        return res
    } catch (err) {
        console.error('[profile/language]', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
