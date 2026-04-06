import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getTranslations } from 'next-intl/server'
import { rateLimit, RATE_LIMITS } from '@/lib/api/rateLimit'

const BUCKET   = 'support-attachments'
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB

const serviceClient = () =>
    createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

/**
 * POST /api/support/upload
 * Accepts multipart/form-data with field "file".
 * Uploads to Supabase Storage and returns { path, name }.
 * The ticketId is set after ticket creation; path is sent along during ticket POST.
 */
export async function POST(req: NextRequest) {
    const limited = rateLimit(req, RATE_LIMITS.form)
    if (limited) return limited

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'No file provided.' }, { status: 422 })
    }

    if (file.size > MAX_BYTES) {
        const t = await getTranslations('errors')
        return NextResponse.json({ error: t('fileTooLarge') }, { status: 413 })
    }

    // Allowed MIME types
    const ALLOWED = [
        'image/png', 'image/jpeg', 'image/webp', 'image/gif',
        'application/pdf',
        'text/plain',
        'application/zip',
    ]
    if (!ALLOWED.includes(file.type)) {
        const t = await getTranslations('errors')
        return NextResponse.json(
            { error: t('fileTypeNotAllowed') },
            { status: 415 },
        )
    }

    const ext      = file.name.split('.').pop() ?? 'bin'
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path     = `${user.id}/${Date.now()}_${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer      = Buffer.from(arrayBuffer)

    const { error } = await serviceClient()
        .storage
        .from(BUCKET)
        .upload(path, buffer, {
            contentType:    file.type,
            cacheControl:   '3600',
            upsert:         false,
        })

    if (error) {
        console.error('[support/upload]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ path, name: file.name, size: file.size }, { status: 201 })
}
