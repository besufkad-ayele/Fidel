'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAdminDb, writeAudit } from '@/lib/admin/db'
import { createOrganizationSchema } from '@/lib/validation/admin-org'
import type { ActionResult } from '@/app/(admin)/admin/actions'

function nowIso() {
  return new Date().toISOString()
}

async function audit(
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
) {
  const { user, profile } = await requireRole('admin')
  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action,
    entityType,
    entityId,
    metadata,
  })
}

/* ─── Organizations ────────────────────────────────────────────────── */

export async function updateOrganizationAction(formData: FormData): Promise<ActionResult> {
  await requireRole('admin')
  const id = String(formData.get('id') ?? '')
  const parsed = createOrganizationSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    country: formData.get('country') || undefined,
    billingContactName: formData.get('billingContactName') || undefined,
    billingContactEmail: formData.get('billingContactEmail') || undefined,
    billingAddress: formData.get('billingAddress') || undefined,
    taxId: formData.get('taxId') || undefined,
    notes: formData.get('notes') || undefined,
  })
  if (!id || !parsed.success) {
    return { ok: false, error: parsed.success ? 'Missing id' : parsed.error.issues[0]?.message }
  }

  const data = parsed.data
  const db = await createAdminDb()
  const { error } = await db
    .from('organizations')
    .update({
      name: data.name,
      type: data.type,
      country: data.country || null,
      billing_contact_name: data.billingContactName || null,
      billing_contact_email: data.billingContactEmail || null,
      billing_address: data.billingAddress || null,
      tax_id: data.taxId || null,
      notes: data.notes || null,
      updated_at: nowIso(),
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  await audit('organization.update', 'organization', id, { name: data.name })
  revalidatePath('/admin/organizations')
  revalidatePath(`/admin/organizations/${id}`)
  return { ok: true, id }
}

export async function updateOrganizationFormAction(formData: FormData): Promise<void> {
  const result = await updateOrganizationAction(formData)
  if (!result.ok) throw new Error(result.error ?? 'Update failed')
}

export async function deleteOrganizationAction(id: string): Promise<void> {
  await requireRole('admin')
  const db = await createAdminDb()

  const { count } = await db
    .from('student_profiles')
    .select('user_id', { count: 'exact', head: true })
    .eq('organization_id', id)

  if ((count ?? 0) > 0) {
    throw new Error('Reassign or remove students before deleting this organization.')
  }

  const { error } = await db.from('organizations').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await audit('organization.delete', 'organization', id)
  revalidatePath('/admin/organizations')
  redirect('/admin/organizations')
}

/* ─── Cohorts ──────────────────────────────────────────────────────── */

export async function updateCohortAction(formData: FormData): Promise<void> {
  await requireRole('admin')
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const organizationId = String(formData.get('organizationId') ?? '').trim() || null
  const levelId = String(formData.get('levelId') ?? '').trim() || null
  const startsOn = String(formData.get('startsOn') ?? '').trim() || null
  const endsOn = String(formData.get('endsOn') ?? '').trim() || null
  const notes = String(formData.get('notes') ?? '').trim() || null

  if (!id || !name) return

  const db = await createAdminDb()
  const { error } = await db
    .from('cohorts')
    .update({
      name,
      organization_id: organizationId,
      level_id: levelId,
      starts_on: startsOn,
      ends_on: endsOn,
      notes,
      updated_at: nowIso(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await audit('cohort.update', 'cohort', id, { name })
  revalidatePath('/admin/cohorts')
}

export async function deleteCohortAction(id: string): Promise<void> {
  await requireRole('admin')
  const db = await createAdminDb()

  await db.from('student_profiles').update({ cohort_id: null }).eq('cohort_id', id)

  const { error } = await db.from('cohorts').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await audit('cohort.delete', 'cohort', id)
  revalidatePath('/admin/cohorts')
}

/* ─── Entitlements ─────────────────────────────────────────────────── */

export async function revokeEntitlementAction(formData: FormData): Promise<void> {
  const { user } = await requireRole('admin')
  const id = String(formData.get('id') ?? '')
  const reason = String(formData.get('reason') ?? '').trim()
  if (!id || !reason) throw new Error('A revoke reason is required')

  const db = await createAdminDb()
  const { error } = await db
    .from('entitlements')
    .update({
      status: 'revoked',
      revoked_at: nowIso(),
      revoked_by: user.id,
      revoked_reason: reason,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await audit('entitlement.revoke', 'entitlement', id, { reason })
  revalidatePath('/admin/entitlements')
}

export async function extendEntitlementAction(formData: FormData): Promise<void> {
  await requireRole('admin')
  const id = String(formData.get('id') ?? '')
  const expiresAt = String(formData.get('expiresAt') ?? '').trim() || null
  if (!id) return

  const db = await createAdminDb()
  const { error } = await db
    .from('entitlements')
    .update({
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      status: 'active',
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await audit('entitlement.extend', 'entitlement', id, { expiresAt })
  revalidatePath('/admin/entitlements')
}

/* ─── People lifecycle ─────────────────────────────────────────────── */

export async function updatePersonAction(formData: FormData): Promise<void> {
  await requireRole('admin')
  const id = String(formData.get('id') ?? '')
  const fullName = String(formData.get('fullName') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim() || null
  const timezone = String(formData.get('timezone') ?? 'Africa/Addis_Ababa').trim()
  const locale = String(formData.get('locale') ?? 'en').trim()

  if (!id || !fullName) return

  const db = await createAdminDb()
  const { error } = await db
    .from('profiles')
    .update({
      full_name: fullName,
      phone,
      timezone,
      locale,
      updated_at: nowIso(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await audit('person.update', 'profile', id, { fullName })
  revalidatePath(`/admin/people/${id}`)
  revalidatePath('/admin/people')
  redirect(`/admin/people/${id}`)
}

export async function suspendPersonAction(formData: FormData): Promise<void> {
  await requireRole('admin')
  const id = String(formData.get('id') ?? '')
  const reason = String(formData.get('reason') ?? '').trim()
  if (!id || !reason) throw new Error('A suspension reason is required')

  const db = await createAdminDb()
  const { error } = await db
    .from('profiles')
    .update({
      is_active: false,
      suspended_reason: reason,
      updated_at: nowIso(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await audit('person.suspend', 'profile', id, { reason })
  revalidatePath(`/admin/people/${id}`)
  revalidatePath('/admin/people')
}

export async function reactivatePersonAction(id: string): Promise<void> {
  await requireRole('admin')
  const db = await createAdminDb()
  const now = nowIso()

  const { data: existing } = await db
    .from('profiles')
    .select('activated_at')
    .eq('id', id)
    .maybeSingle()

  const { error } = await db
    .from('profiles')
    .update({
      is_active: true,
      suspended_reason: null,
      activated_at: existing?.activated_at ?? now,
      updated_at: now,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await audit('person.reactivate', 'profile', id)
  revalidatePath(`/admin/people/${id}`)
  revalidatePath('/admin/people')
}

/** Pending → Active: marks the account usable (sets activated_at). */
export async function activatePersonAction(id: string): Promise<void> {
  await requireRole('admin')
  const db = await createAdminDb()
  const now = nowIso()

  const { error } = await db
    .from('profiles')
    .update({
      is_active: true,
      suspended_reason: null,
      activated_at: now,
      updated_at: now,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await audit('person.activate', 'profile', id)
  revalidatePath(`/admin/people/${id}`)
  revalidatePath('/admin/people')
}

export async function activatePersonFormAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '')
  if (!id) throw new Error('Missing person id')
  await activatePersonAction(id)
}

export async function suspendPersonFormAction(formData: FormData): Promise<void> {
  await suspendPersonAction(formData)
}

export async function deletePersonFormAction(formData: FormData): Promise<void> {
  await deletePersonAndRedirectAction(formData)
}

export async function resendInviteAction(id: string): Promise<void> {
  await requireRole('admin')
  const db = await createAdminDb()
  const { data: profile } = await db.from('profiles').select('email, full_name').eq('id', id).maybeSingle()
  if (!profile?.email) throw new Error('Person not found')

  const admin = createAdminClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/set-password`
  const { error } = await admin.auth.admin.inviteUserByEmail(profile.email, {
    data: { full_name: profile.full_name },
    redirectTo,
  })
  // inviteUserByEmail may fail if user already exists — generate a recovery/invite link instead
  if (error) {
    const link = await admin.auth.admin.generateLink({
      type: 'invite',
      email: profile.email,
      options: { redirectTo },
    })
    if (link.error) throw new Error(link.error.message)
  }

  await db.from('profiles').update({ invited_at: nowIso() }).eq('id', id)
  await audit('person.resend_invite', 'profile', id, { email: profile.email })
  revalidatePath(`/admin/people/${id}`)
}

export async function resetPasswordAction(id: string): Promise<void> {
  await requireRole('admin')
  const db = await createAdminDb()
  const { data: profile } = await db.from('profiles').select('email').eq('id', id).maybeSingle()
  if (!profile?.email) throw new Error('Person not found')

  const admin = createAdminClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/reset-password`
  const link = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: profile.email,
    options: { redirectTo },
  })
  if (link.error) throw new Error(link.error.message)

  await audit('person.reset_password', 'profile', id, { email: profile.email })
  revalidatePath(`/admin/people/${id}`)
}

export async function deletePersonAction(formData: FormData): Promise<void> {
  await requireRole('admin')
  const id = String(formData.get('id') ?? '')
  const confirmName = String(formData.get('confirmName') ?? '').trim()

  const db = await createAdminDb()
  const { data: profile } = await db
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', id)
    .maybeSingle()

  if (!profile) throw new Error('Person not found')

  const expected = (profile.full_name || profile.email).trim()
  if (confirmName !== expected) {
    throw new Error(`Type "${expected}" exactly to confirm deletion.`)
  }

  const { count: certCount } = await db
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', id)
    .eq('status', 'issued')

  if ((certCount ?? 0) > 0) {
    throw new Error('Cannot delete: issued certificates must remain verifiable. Suspend instead.')
  }

  const admin = createAdminClient()
  const { error: authError } = await admin.auth.admin.deleteUser(id)
  if (authError) throw new Error(authError.message)

  await audit('person.delete', 'profile', id, {
    email: profile.email,
    role: profile.role,
    name: profile.full_name,
  })

  revalidatePath('/admin/people')
}

export async function deletePersonAndRedirectAction(formData: FormData): Promise<void> {
  await deletePersonAction(formData)
  redirect('/admin/people')
}
