'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ────────────────────────────────────────────────────

export type MemberRole = 'admin' | 'viewer'

type ActionResult = { error?: string }

// ─── Action: Update organisation name ────────────────────────

export async function updateOrgName(name: string): Promise<ActionResult> {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length < 2) return { error: 'Name muss mindestens 2 Zeichen lang sein.' }
    if (trimmed.length > 100)            return { error: 'Name darf maximal 100 Zeichen lang sein.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const { data: member } = await supabase
        .from('organisation_members')
        .select('org_id, role')
        .eq('user_id', user.id)
        .single()

    if (!member)                  return { error: 'Mitgliedschaft nicht gefunden.' }
    if (member.role !== 'admin')  return { error: 'Nur Administratoren können den Unternehmensnamen ändern.' }

    const { error } = await supabase
        .from('organisations')
        .update({ name: trimmed })
        .eq('id', member.org_id)

    if (error) return { error: 'Aktualisierung fehlgeschlagen: ' + error.message }

    revalidatePath('/dashboard/settings')
    return {}
}

// ─── Action: Update organisation legal fields ─────────────────

export async function updateOrgLegal(fields: {
    legal_representative: string
    legal_address:        string
    legal_city:           string
    legal_zip:            string
    vat_id:               string
}): Promise<ActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    const { data: member } = await supabase
        .from('organisation_members')
        .select('org_id, role')
        .eq('user_id', user.id)
        .single()

    if (!member)                 return { error: 'Mitgliedschaft nicht gefunden.' }
    if (member.role !== 'admin') return { error: 'Nur Administratoren können Rechtsdaten ändern.' }

    const { error } = await supabase
        .from('organisations')
        .update({
            legal_representative: fields.legal_representative.trim() || null,
            legal_address:        fields.legal_address.trim()        || null,
            legal_city:           fields.legal_city.trim()           || null,
            legal_zip:            fields.legal_zip.trim()            || null,
            vat_id:               fields.vat_id.trim()               || null,
        })
        .eq('id', member.org_id)

    if (error) return { error: 'Speichern fehlgeschlagen: ' + error.message }

    revalidatePath('/dashboard/settings')
    return {}
}



// ─── Action: Update user profile (name + job title) ──────────

export async function updateProfile(
    fullName: string,
    jobTitle: string,
): Promise<ActionResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nicht angemeldet.' }

    // Use admin client — no UPDATE RLS policy exists for members updating their own row
    const admin = createAdminClient()
    const { error } = await admin
        .from('organisation_members')
        .update({
            full_name: fullName.trim() || null,
            job_title: jobTitle.trim() || null,
        })
        .eq('user_id', user.id)  // safe: scoped to the calling user only

    if (error) return { error: 'Profil konnte nicht gespeichert werden: ' + error.message }

    revalidatePath('/dashboard/settings')
    return {}
}

// ─── Helper: get calling user's org + role (with seat info) ──

async function getCallerContext() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: member } = await supabase
        .from('organisation_members')
        .select('org_id, role')
        .eq('user_id', user.id)
        .single()

    if (!member || member.role !== 'admin') return null

    const { data: org } = await supabase
        .from('organisations')
        .select('id, max_users, plan')
        .eq('id', member.org_id)
        .single()

    const { count: memberCount } = await supabase
        .from('organisation_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', member.org_id)

    const { count: pendingCount } = await supabase
        .from('pending_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', member.org_id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())

    return {
        supabase,
        user,
        orgId:     member.org_id,
        maxUsers:  org?.max_users ?? 2,
        plan:      org?.plan ?? 'trial',
        usedSeats: (memberCount ?? 0) + (pendingCount ?? 0),
    }
}

// ─── Invite Email Template ────────────────────────────────────

function buildInviteEmailHtml(opts: {
    recipientName: string | undefined
    inviterName:   string | undefined
    inviterEmail:  string
    orgName:       string
    roleLabel:     string
    inviteUrl:     string
    siteUrl:       string
}) {
    const { recipientName, inviterName, inviterEmail, orgName, roleLabel, inviteUrl, siteUrl } = opts
    const greeting = recipientName ? `Hallo ${recipientName},` : 'Hallo,'
    // Show "Name (email)" if name exists, otherwise just email
    const inviterDisplay = inviterName
        ? `${inviterName} <span style="color:#64748b;font-size:14px;">(${inviterEmail})</span>`
        : `<a href="mailto:${inviterEmail}" style="color:#4f46e5;">${inviterEmail}</a>`
    const subjectSender = inviterName ? `${inviterName} (${inviterEmail})` : inviterEmail

    return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Einladung zu CompLens</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">

        <tr>
          <td style="background:linear-gradient(90deg,#4f46e5,#7c3aed);height:4px;border-radius:8px 8px 0 0;"></td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:40px 44px 32px;">

            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#4f46e5;border-radius:8px;padding:6px 12px;">
                  <span style="font-size:14px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Comp</span><span style="font-size:14px;font-weight:800;color:#a5b4fc;letter-spacing:-0.3px;">Lens</span>
                </td>
                <td style="padding-left:10px;vertical-align:middle;">
                  <span style="font-size:11px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;">EU Pay Transparency</span>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:15px;color:#1e293b;">${greeting}</p>

            <p style="margin:0 0 16px;line-height:1.7;font-size:15px;color:#1e293b;">
              <strong>${inviterDisplay}</strong> hat Sie eingeladen, dem Team von <strong>${orgName}</strong> auf <strong>CompLens</strong> beizutreten.
            </p>

            <p style="margin:0 0 20px;line-height:1.7;font-size:15px;color:#1e293b;">
              Sie erhalten Zugang als: <strong style="color:#4f46e5;">${roleLabel}</strong>
            </p>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
              <tr>
                <td style="background:#f0f4ff;border-left:3px solid #4f46e5;border-radius:0 8px 8px 0;padding:14px 18px;">
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#3730a3;">Was ist CompLens?</p>
                  <p style="margin:0;font-size:13px;line-height:1.65;color:#475569;">
                    CompLens ist die EU-Compliance-Plattform f&uuml;r Entgelttransparenz. Unternehmen nutzen CompLens, um die Anforderungen der EU-Entgelttransparenzrichtlinie zu erf&uuml;llen &mdash; mit automatischer Lohnl&uuml;ckenanalyse, Berichterstellung und Auditing.
                  </p>
                </td>
              </tr>
            </table>

            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#4f46e5;border-radius:8px;">
                  <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Einladung annehmen &rarr;</a>
                </td>
              </tr>
            </table>

            <div style="height:1px;background:#e2e8f0;margin:24px 0;"></div>

            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
              Dieser Link ist <strong>7 Tage g&uuml;ltig</strong>.<br>
              Falls Sie diese Einladung nicht erwartet haben, k&ouml;nnen Sie diese E-Mail ignorieren.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f1f5f9;padding:20px 44px;border-radius:0 0 8px 8px;border-top:1px solid #e2e8f0;">
            <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;">CompLens by DexterBee &middot; EU-Entgelttransparenz-Plattform</p>
            <p style="margin:0;font-size:11px;color:#cbd5e1;">
              <a href="${siteUrl}/datenschutz" style="color:#94a3b8;text-decoration:none;">Datenschutz</a>
              &nbsp;&middot;&nbsp;
              <a href="${siteUrl}/agb" style="color:#94a3b8;text-decoration:none;">AGB</a>
              &nbsp;&middot;&nbsp;
              <a href="mailto:hallo@complens.de" style="color:#94a3b8;text-decoration:none;">Support</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Action: Invite a member ──────────────────────────────────

export async function inviteMember(
    email: string,
    role: MemberRole,
    name?: string,
    title?: string,
): Promise<ActionResult & { token?: string }> {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return { error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }
    }

    const ctx = await getCallerContext()
    if (!ctx) return { error: 'Nicht autorisiert.' }

    const { supabase, user, orgId, maxUsers, usedSeats, plan } = ctx

    if (plan === 'trial' || plan === 'free') {
        return { error: 'Team-Einladungen sind nur mit einer aktiven Lizenz verfügbar.' }
    }

    if (usedSeats >= maxUsers) {
        return {
            error: `Alle ${maxUsers} Nutzerplätze sind belegt. Bitte kontaktieren Sie uns für einen zusätzlichen Platz (€ 990/Jahr): hallo@complens.de`,
        }
    }

    const adminClient = createAdminClient()
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === trimmedEmail)

    if (existingUser) {
        const { data: existingMember } = await supabase
            .from('organisation_members')
            .select('id')
            .eq('org_id', orgId)
            .eq('user_id', existingUser.id)
            .single()

        if (existingMember) {
            return { error: 'Diese E-Mail-Adresse ist bereits Mitglied Ihrer Organisation.' }
        }
    }

    // Fetch inviter full_name + email + org name for personalised email
    const inviterEmail = user.email ?? 'Ihr HR-Administrator'
    const { data: inviterMember } = await supabase
        .from('organisation_members')
        .select('full_name')
        .eq('user_id', user.id)
        .single()
    const inviterName = inviterMember?.full_name ?? undefined
    const { data: orgRow } = await supabase
        .from('organisations')
        .select('name')
        .eq('id', orgId)
        .single()
    const orgName = orgRow?.name ?? 'Ihrer Organisation'

    const { data: invitation, error: invErr } = await adminClient
        .from('pending_invitations')
        .upsert(
            {
                org_id:      orgId,
                invited_by:  user.id,
                email:       trimmedEmail,
                role,
                full_name:   name?.trim() || null,
                job_title:   title?.trim() || null,
                expires_at:  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                accepted_at: null,
            },
            { onConflict: 'org_id,email', ignoreDuplicates: false },
        )
        .select('token')
        .single()

    if (invErr || !invitation) {
        console.error('[inviteMember] DB error:', invErr)
        return { error: 'Einladung konnte nicht erstellt werden: ' + invErr?.message }
    }

    const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://complens.de'
    const inviteUrl = `${siteUrl}/join?token=${invitation.token}`
    const resendKey = process.env.RESEND_API_KEY

    if (resendKey) {
        const roleLabel = role === 'admin'
            ? 'HR-Administrator (voller Zugriff)'
            : 'Mitarbeitervertretung (Lesezugriff)'
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'hallo@complens.de'

        const emailHtml = buildInviteEmailHtml({
            recipientName: name,
            inviterName,
            inviterEmail,
            orgName,
            roleLabel,
            inviteUrl,
            siteUrl,
        })

        const subjectSender = inviterName ? `${inviterName} (${inviterEmail})` : inviterEmail

        const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify({
                from:    `CompLens <${fromEmail}>`,
                to:      trimmedEmail,
                subject: `${subjectSender} hat Sie zu CompLens eingeladen`,
                html:    emailHtml,
            }),
        })
        if (!emailRes.ok) {
            const body = await emailRes.text().catch(() => '')
            console.error('[inviteMember] Resend error:', emailRes.status, body)
        }
    }

    revalidatePath('/dashboard/settings')
    return { token: invitation.token }
}

// ─── Action: Remove a member ──────────────────────────────────

export async function removeMember(memberId: string): Promise<ActionResult> {
    const ctx = await getCallerContext()
    if (!ctx) return { error: 'Nicht autorisiert.' }

    const { supabase, user, orgId } = ctx

    const { data: target } = await supabase
        .from('organisation_members')
        .select('id, user_id, role')
        .eq('id', memberId)
        .eq('org_id', orgId)
        .single()

    if (!target) return { error: 'Mitglied nicht gefunden.' }

    if (target.user_id === user.id) {
        return { error: 'Sie können sich nicht selbst entfernen.' }
    }

    if (target.role === 'admin') {
        const { count } = await supabase
            .from('organisation_members')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('role', 'admin')
        if ((count ?? 0) <= 1) {
            return { error: 'Sie können den einzigen Administrator nicht entfernen.' }
        }
    }

    const { error } = await supabase
        .from('organisation_members')
        .delete()
        .eq('id', memberId)

    if (error) return { error: 'Mitglied konnte nicht entfernt werden: ' + error.message }

    const adminClient = createAdminClient()
    await adminClient
        .from('device_sessions')
        .delete()
        .eq('user_id', target.user_id)
        .eq('org_id', orgId)

    revalidatePath('/dashboard/settings')
    return {}
}

// ─── Action: Revoke a pending invitation ─────────────────────

export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
    const ctx = await getCallerContext()
    if (!ctx) return { error: 'Nicht autorisiert.' }

    const { supabase, orgId } = ctx

    const { error } = await supabase
        .from('pending_invitations')
        .delete()
        .eq('id', invitationId)
        .eq('org_id', orgId)

    if (error) return { error: 'Einladung konnte nicht widerrufen werden: ' + error.message }

    revalidatePath('/dashboard/settings')
    return {}
}

// ─── Action: Resend invitation email ─────────────────────────

export async function resendInvitation(invitationId: string): Promise<ActionResult> {
    const ctx = await getCallerContext()
    if (!ctx) return { error: 'Nicht autorisiert.' }

    const { supabase, user, orgId } = ctx

    const { data: inv, error } = await supabase
        .from('pending_invitations')
        .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
        .eq('id', invitationId)
        .eq('org_id', orgId)
        .select('token, email, role')
        .single()

    if (error || !inv) return { error: 'Einladung nicht gefunden.' }

    const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://complens.de'
    const inviteUrl = `${siteUrl}/join?token=${inv.token}`
    const resendKey = process.env.RESEND_API_KEY

    if (resendKey) {
        const inviterEmail = user.email ?? 'CompLens'
        const { data: inviterMember } = await supabase
            .from('organisation_members')
            .select('full_name')
            .eq('user_id', user.id)
            .single()
        const inviterName = inviterMember?.full_name ?? undefined
        const { data: orgRow } = await supabase
            .from('organisations')
            .select('name')
            .eq('id', orgId)
            .single()
        const orgName = orgRow?.name ?? 'Ihrer Organisation'

        const roleLabel = inv.role === 'admin'
            ? 'HR-Administrator (voller Zugriff)'
            : 'Mitarbeitervertretung (Lesezugriff)'
        const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'hallo@complens.de'
        const subjectSender = inviterName ? `${inviterName} (${inviterEmail})` : inviterEmail

        const emailHtml = buildInviteEmailHtml({
            recipientName: undefined,
            inviterName,
            inviterEmail,
            orgName,
            roleLabel,
            inviteUrl,
            siteUrl,
        })

        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from:    `CompLens <${fromEmail}>`,
                to:      inv.email,
                subject: `Erinnerung: ${subjectSender} hat Sie zu CompLens eingeladen`,
                html:    emailHtml,
            }),
        }).catch(() => {})
    }

    revalidatePath('/dashboard/settings')
    return {}
}

// ─── Action: Register device fingerprint after login ─────────

export async function registerDevice(fingerprint: string, label: string): Promise<ActionResult> {
    if (!fingerprint) return {}

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    const { data: member } = await supabase
        .from('organisation_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single()

    if (!member) return {}

    const adminClient = createAdminClient()

    const { count } = await adminClient
        .from('device_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('trusted', true)

    if ((count ?? 0) >= 3) {
        const { data: oldest } = await adminClient
            .from('device_sessions')
            .select('id')
            .eq('user_id', user.id)
            .order('last_seen_at', { ascending: true })
            .limit(1)
            .single()

        if (oldest) {
            await adminClient.from('device_sessions').delete().eq('id', oldest.id)
        }
    }

    await adminClient
        .from('device_sessions')
        .upsert(
            {
                user_id:      user.id,
                org_id:       member.org_id,
                fingerprint,
                label,
                trusted:      true,
                last_seen_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,fingerprint' },
        )

    return {}
}

// ─── Action: Get team members + pending invitations ───────────

export async function getTeamData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: member } = await supabase
        .from('organisation_members')
        .select('org_id, role')
        .eq('user_id', user.id)
        .single()

    if (!member) return null

    const [{ data: members }, { data: pendingInvites }, { data: org }] = await Promise.all([
        supabase
            .from('organisation_members')
            .select('id, role, joined_at, user_id, full_name, job_title')
            .eq('org_id', member.org_id)
            .order('joined_at', { ascending: true }),
        member.role === 'admin'
            ? supabase
                .from('pending_invitations')
                .select('id, email, role, expires_at, created_at')
                .eq('org_id', member.org_id)
                .is('accepted_at', null)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: [] }),
        supabase
            .from('organisations')
            .select('max_users, plan')
            .eq('id', member.org_id)
            .single(),
    ])

    const adminClient = createAdminClient()
    const { data: usersData } = await adminClient.auth.admin.listUsers()
    const userMap = Object.fromEntries((usersData?.users ?? []).map(u => [u.id, u.email ?? '']))

    const enrichedMembers = (members ?? []).map(m => ({
        ...m,
        email: userMap[m.user_id] ?? '—',
        isMe:  m.user_id === user.id,
    }))

    return {
        members:        enrichedMembers,
        pendingInvites: pendingInvites ?? [],
        maxUsers:       org?.max_users  ?? 2,
        plan:           org?.plan        ?? 'trial',
        callerRole:     member.role,
        usedSeats:      (members?.length ?? 0) + (pendingInvites?.length ?? 0),
    }
}
