import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // ── Refresh Supabase session ─────────────────────────────────────────────
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: use getUser() (validates JWT server-side), not getSession()
    const { data: { user } } = await supabase.auth.getUser()

    // ── Protected dashboard routes — redirect to /login if unauthenticated ───
    const isProtected =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/superadmin')

    if (isProtected && !user) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        loginUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // ── Superadmin zone — restrict to allowlisted emails ─────────────────────
    if (pathname.startsWith('/superadmin') && user) {
        const allowedAdmins = (process.env.SUPERADMIN_EMAILS ?? '')
            .split(',')
            .map(e => e.trim().toLowerCase())
        if (!allowedAdmins.includes(user.email?.toLowerCase() ?? '')) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // ── Auth pages — redirect logged-in users away ────────────────────────────
    const isAuthPage =
        pathname === '/login'  ||
        pathname === '/signup' ||
        pathname.startsWith('/join')  ||
        pathname.startsWith('/apply')

    if (isAuthPage && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        // Match all paths except Next.js internals, static assets, and the
        // Stripe webhook (must be unauthenticated — Stripe calls it directly).
        '/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
