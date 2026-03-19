import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Verify the requesting user is in the SUPERADMIN_EMAILS allowlist.
 * Used by all /superadmin/actions/* routes instead of the old ?key= check.
 * Returns null on success, or a redirect/error response if unauthorised.
 */
export async function checkSuperadminAccess(
    req: NextRequest
): Promise<NextResponse | null> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user?.email) {
            return NextResponse.redirect(new URL('/login', req.url))
        }

        const allowedAdmins = (process.env.SUPERADMIN_EMAILS ?? '')
            .split(',')
            .map(e => e.trim().toLowerCase())

        if (!allowedAdmins.includes(user.email.toLowerCase())) {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }

        return null // authorised
    } catch {
        return NextResponse.redirect(new URL('/login', req.url))
    }
}
