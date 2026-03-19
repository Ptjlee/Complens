import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'

/**
 * Parse and validate a request body against a Zod schema.
 * Returns { data } on success or { error: NextResponse } on failure.
 *
 * Usage in a route:
 *   const parsed = await parseBody(req, MySchema)
 *   if ('error' in parsed) return parsed.error
 *   const { data } = parsed
 */
export async function parseBody<T>(
    req: NextRequest,
    schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
    let raw: unknown
    try {
        raw = await req.json()
    } catch {
        return {
            error: NextResponse.json(
                { error: 'Invalid JSON body' },
                { status: 400 }
            ),
        }
    }

    const result = schema.safeParse(raw)
    if (!result.success) {
        const messages = result.error.issues.map((e) => ({
            field:   e.path.join('.'),
            message: e.message,
        }))
        return {
            error: NextResponse.json(
                { error: 'Validation failed', details: messages },
                { status: 422 }
            ),
        }
    }

    return { data: result.data }
}
