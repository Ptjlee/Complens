'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient }       from '@/lib/supabase/server'
import { createAdminClient }  from '@/lib/supabase/admin'

export async function getOrgContext(): Promise<
    | { error: string }
    | { orgId: string; supabase: Awaited<ReturnType<typeof createClient>> }
> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const admin = createAdminClient()
    const { data: member } = await admin
        .from('organisation_members')
        .select('org_id, role')
        .eq('user_id', user.id)
        .single()
    if (!member) return { error: 'Organisation not found' }
    if (!['admin', 'analyst'].includes(member.role)) return { error: 'Insufficient permissions' }

    const { data: org } = await admin
        .from('organisations')
        .select('plan, trial_ends_at, job_architecture_enabled')
        .eq('id', member.org_id)
        .single()
    if (!org) return { error: 'Organisation not found' }

    const isLicensed = ['licensed', 'paylens', 'paylens_ai'].includes(org.plan ?? '')
    const isTrialActive = org.plan === 'trial' && (!org.trial_ends_at || new Date(org.trial_ends_at) > new Date())
    if (!isLicensed && !isTrialActive && !org.job_architecture_enabled) {
        return { error: 'Job Architecture module not enabled' }
    }

    return { orgId: member.org_id, supabase }
}

export async function getModel() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured')
    const genAI = new GoogleGenerativeAI(apiKey)
    return genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { temperature: 0.3, maxOutputTokens: 16000 },
    })
}

export async function parseJSON<T>(text: string): Promise<T> {
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    try { return JSON.parse(clean) }
    catch {
        const match = clean.match(/\{[\s\S]*\}/)
        if (match) return JSON.parse(match[0])
        throw new Error('Could not parse response')
    }
}
