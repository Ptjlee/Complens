import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const admin = createAdminClient()
        
        const { error } = await admin.from('leads').insert([
            {
                first_name: body.firstName,
                last_name: body.lastName,
                email: body.email,
                company_name: body.companyName,
                company_size: body.companySize,
                hris: body.hris,
                urgency: body.urgency,
            }
        ])

        if (error) {
            console.error('Insert lead error:', error)
            // We still return success to the user to not break the funnel,
            // but we log the error for admin notification.
            return NextResponse.json({ success: false, error: error.message }, { status: 400 })
        }
        
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
