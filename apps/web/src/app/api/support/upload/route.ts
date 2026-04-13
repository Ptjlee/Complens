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

// ── Magic byte signatures for file type validation ────────────────────────
// We verify actual file content, not just the client-declared MIME type,
// to prevent disguised uploads (e.g. an executable renamed to .png).
type MagicSignature = { mime: string; offsets: Array<{ at: number; bytes: number[] }> }

const MAGIC_SIGNATURES: MagicSignature[] = [
    { mime: 'image/png',        offsets: [{ at: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }] },
    { mime: 'image/jpeg',       offsets: [{ at: 0, bytes: [0xFF, 0xD8, 0xFF] }] },
    { mime: 'image/webp',       offsets: [{ at: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, { at: 8, bytes: [0x57, 0x45, 0x42, 0x50] }] },
    { mime: 'image/gif',        offsets: [{ at: 0, bytes: [0x47, 0x49, 0x46, 0x38] }] },
    { mime: 'application/pdf',  offsets: [{ at: 0, bytes: [0x25, 0x50, 0x44, 0x46] }] },         // %PDF
    { mime: 'application/zip',  offsets: [{ at: 0, bytes: [0x50, 0x4B, 0x03, 0x04] }] },         // PK..
]

/** Returns true if the buffer matches the magic bytes for the declared MIME type. */
function validateMagicBytes(buf: Buffer, declaredMime: string): boolean {
    // text/plain has no magic bytes — accept if content is valid UTF-8 / ASCII
    if (declaredMime === 'text/plain') {
        // Reject if the first 512 bytes contain a NULL byte (binary indicator)
        const sample = buf.subarray(0, Math.min(512, buf.length))
        return !sample.includes(0x00)
    }
    const sig = MAGIC_SIGNATURES.find(s => s.mime === declaredMime)
    if (!sig) return false // unknown type — reject
    return sig.offsets.every(({ at, bytes }) => {
        if (at + bytes.length > buf.length) return false
        return bytes.every((b, i) => buf[at + i] === b)
    })
}

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

    // Validate magic bytes — reject files whose content doesn't match declared type
    if (!validateMagicBytes(buffer, file.type)) {
        const t = await getTranslations('errors')
        return NextResponse.json(
            { error: t('fileTypeNotAllowed') },
            { status: 415 },
        )
    }

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
