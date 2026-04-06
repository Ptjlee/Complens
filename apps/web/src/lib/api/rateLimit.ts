import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
    timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
    const now = Date.now()
    if (now - lastCleanup < CLEANUP_INTERVAL) return
    lastCleanup = now
    const cutoff = now - windowMs
    for (const [key, entry] of store) {
        entry.timestamps = entry.timestamps.filter(t => t > cutoff)
        if (entry.timestamps.length === 0) store.delete(key)
    }
}

/**
 * Sliding-window rate limiter using IP-based keys.
 * Returns null if the request is allowed, or a 429 NextResponse if rate-limited.
 */
export function rateLimit(
    req: NextRequest,
    { maxRequests, windowMs }: { maxRequests: number; windowMs: number },
): NextResponse | null {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? req.headers.get('x-real-ip')
        ?? 'unknown'

    const key = `${ip}:${req.nextUrl.pathname}`

    cleanup(windowMs)

    const now = Date.now()
    const entry = store.get(key) ?? { timestamps: [] }
    const cutoff = now - windowMs

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter(t => t > cutoff)

    if (entry.timestamps.length >= maxRequests) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil(windowMs / 1000)),
                },
            },
        )
    }

    entry.timestamps.push(now)
    store.set(key, entry)
    return null
}

/** Presets for common route types */
export const RATE_LIMITS = {
    ai:      { maxRequests: 10, windowMs: 60_000 },   // 10 req/min
    form:    { maxRequests: 5,  windowMs: 60_000 },   // 5 req/min
    stripe:  { maxRequests: 20, windowMs: 60_000 },   // 20 req/min
} as const
