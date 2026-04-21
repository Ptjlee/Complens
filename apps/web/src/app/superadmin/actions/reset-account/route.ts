import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkSuperadminAccess } from '@/lib/api/superadminAuth'

// Reset an organisation to a fresh state (as if newly registered).
// Keeps: user auth (email/password), organisation row, organisation_members.
// Deletes: all data, job architecture, salary bands, remediation, tickets.
// Resets: onboarding progress, plan to trial with 7-day window.

export async function POST(req: NextRequest) {
    const authErr = await checkSuperadminAccess(req)
    if (authErr) return authErr

    let body: { orgId?: string }
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { orgId } = body
    if (!orgId) {
        return NextResponse.json({ error: 'Missing orgId' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify org exists
    const { data: org } = await admin
        .from('organisations')
        .select('id, name')
        .eq('id', orgId)
        .single()

    if (!org) {
        return NextResponse.json({ error: 'Organisation not found' }, { status: 404 })
    }

    console.log(`[reset-account] Resetting org "${org.name}" (${orgId})`)

    try {
        // Phase 1: Delete tables with foreign key dependencies first
        // These must go before their parent tables.
        await Promise.all([
            admin.from('employee_job_assignments').delete().eq('org_id', orgId),
            admin.from('assignment_carryovers').delete().eq('org_id', orgId),
        ])

        // Phase 2: Delete employee identities (depends on employees)
        await admin.from('employee_identities').delete().eq('org_id', orgId)

        // Phase 3: Delete datasets — cascades to employees, analyses, etc.
        await admin.from('datasets').delete().eq('org_id', orgId)

        // Phase 4: Delete job architecture (independent of datasets)
        await Promise.all([
            admin.from('job_competencies').delete().eq('org_id', orgId),
            admin.from('job_grade_mappings').delete().eq('org_id', orgId),
        ])

        // Phase 5: Delete jobs (depends on job_families, level_definitions)
        await admin.from('jobs').delete().eq('org_id', orgId)

        // Phase 6: Delete remaining job architecture parents
        await Promise.all([
            admin.from('job_families').delete().eq('org_id', orgId),
            admin.from('leveling_structures').delete().eq('org_id', orgId),
            admin.from('competencies').delete().eq('org_id', orgId),
        ])

        // Phase 7: Delete salary bands (cascades to grades + market data)
        await admin.from('salary_bands').delete().eq('org_id', orgId)

        // Phase 8: Delete remediation plans (cascades to steps)
        await admin.from('remediation_plans').delete().eq('org_id', orgId)

        // Phase 9: Delete support tickets (user-scoped, find via org members)
        const { data: members } = await admin
            .from('organisation_members')
            .select('user_id')
            .eq('org_id', orgId)

        const userIds = (members ?? []).map(m => m.user_id)
        if (userIds.length > 0) {
            await admin
                .from('support_tickets')
                .delete()
                .in('user_id', userIds)
        }

        // Phase 10: Reset onboarding progress
        await admin
            .from('onboarding_progress')
            .update({ current_step: 0, completed_at: null })
            .eq('org_id', orgId)

        // Phase 11: Reset organisation plan fields
        const sevenDaysFromNow = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString()

        await admin
            .from('organisations')
            .update({
                plan: 'trial',
                trial_ends_at: sevenDaysFromNow,
                subscription_ends_at: null,
                job_architecture_enabled: true,
                ai_enabled: true,
            })
            .eq('id', orgId)

        console.log(`[reset-account] Successfully reset org "${org.name}" (${orgId})`)

        return NextResponse.json({
            success: true,
            reset: {
                orgId,
                orgName: org.name,
                newPlan: 'trial',
                trialEndsAt: sevenDaysFromNow,
            },
        })
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error(`[reset-account] Failed for org ${orgId}:`, message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
