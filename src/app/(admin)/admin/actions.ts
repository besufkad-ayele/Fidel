'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/admin'
import { createAdminDb, writeAudit } from '@/lib/admin/db'
import { createStudentSchema } from '@/lib/validation/admin-student'
import { createTeacherSchema } from '@/lib/validation/admin-teacher'
import { createAdminUserSchema } from '@/lib/validation/admin-admin'
import { createOrganizationSchema } from '@/lib/validation/admin-org'
import { grantEntitlementSchema } from '@/lib/validation/admin-entitlement'
import { recordPaymentSchema } from '@/lib/validation/admin-payment'

export type ActionResult = {
  ok: boolean
  error?: string
  id?: string
  setupLink?: string
  email?: string
}

async function createUserWithPassword(
  email: string,
  fullName: string,
  password: string,
  role: 'student' | 'teacher' | 'admin',
  meta: Record<string, unknown> = {},
) {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, ...meta },
    app_metadata: { role },
  })
  if (error) throw new Error(error.message)
  return data.user.id as string
}

async function inviteOrCreate(
  email: string,
  fullName: string,
  sendInvite: boolean,
  role: 'student' | 'teacher' | 'admin',
  meta: Record<string, unknown> = {},
) {
  const admin = createAdminClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/set-password`

  if (sendInvite) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, ...meta },
      redirectTo,
    })
    if (error) throw new Error(error.message)
    // inviteUserByEmail only sets user_metadata — stamp app_metadata.role too.
    await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { role } })
    return { userId: data.user.id as string, setupLink: undefined as string | undefined }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: false,
    user_metadata: { full_name: fullName, ...meta },
    app_metadata: { role },
  })
  if (error) throw new Error(error.message)

  const link = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo },
  })
  if (link.error) throw new Error(link.error.message)

  return {
    userId: data.user.id as string,
    setupLink: link.data.properties?.action_link as string | undefined,
  }
}

export async function createStudentAction(input: unknown): Promise<ActionResult> {
  const { user, profile } = await requireRole('admin')
  const parsed = createStudentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form data' }
  }
  const data = parsed.data
  const db = await createAdminDb()

  try {
    const userId = await createUserWithPassword(data.email, data.fullName, data.password, 'student')

    const now = new Date().toISOString()
    // Password-provisioned students can sign in immediately → mark active.
    const isSuspended = data.isActive === 'suspended'
    const { error: profileErr } = await db
      .from('profiles')
      .update({
        role: 'student',
        full_name: data.fullName,
        phone: data.phone || null,
        timezone: data.timezone,
        locale: data.locale,
        is_active: !isSuspended,
        invited_at: now,
        activated_at: isSuspended ? null : now,
        suspended_reason: isSuspended ? 'Created as suspended' : null,
        created_by: user.id,
      })
      .eq('id', userId)
    if (profileErr) throw new Error(profileErr.message)

    let organizationId: string | null = null
    if (data.organization?.name) {
      if (data.organization.id) {
        organizationId = data.organization.id
      } else {
        const { data: org, error: orgErr } = await db
          .from('organizations')
          .insert({
            name: data.organization.name,
            type: data.organization.type,
            billing_contact_name: data.organization.billingContactName ?? null,
            billing_contact_email: data.organization.billingContactEmail ?? null,
            created_by: user.id,
          })
          .select('id')
          .single()
        if (orgErr) throw new Error(orgErr.message)
        organizationId = org.id
      }
    }

    const { error: studentErr } = await db.from('student_profiles').upsert({
      user_id: userId,
      preferred_name: data.preferredName || data.fullName.split(' ')[0],
      persona: data.persona,
      study_intent: data.studyIntent,
      learning_goal: data.learningGoal ?? null,
      prior_experience: data.priorExperience,
      native_language: data.nativeLanguage ?? null,
      other_languages: data.otherLanguages,
      starting_level_id: data.startingLevelId,
      organization_id: organizationId,
      cohort_id: data.cohortId ?? null,
      job_title: data.jobTitle ?? null,
      department: data.department ?? null,
      country: data.country ?? null,
      preferred_days: data.preferredDays,
      preferred_times: data.preferredTimes,
    })
    if (studentErr) throw new Error(studentErr.message)

    if (data.adminNotes) {
      await db.from('student_internal_notes').insert({
        student_id: userId,
        body: data.adminNotes,
        author_id: user.id,
      })
    }

    let paymentId: string | null = null
    if (data.payment) {
      const { data: payment, error: payErr } = await db
        .from('payments')
        .insert({
          student_id: userId,
          organization_id: organizationId,
          amount_cents: Math.round(data.payment.amount * 100),
          currency: data.payment.currency,
          provider: data.payment.provider,
          reference: data.payment.reference ?? null,
          status: data.payment.status,
          paid_at: data.payment.paidAt?.toISOString() ?? null,
          note: data.payment.note ?? null,
          recorded_by: user.id,
        })
        .select('id')
        .single()
      if (payErr) throw new Error(payErr.message)
      paymentId = payment.id
    }

    if (data.access) {
      const rows =
        data.access.scope === 'level'
          ? data.access.levelIds.map((levelId) => ({
              student_id: userId,
              scope: 'level',
              level_id: levelId,
              unit_id: null,
              source: data.access!.source,
              note: data.access!.note,
              granted_by: user.id,
              payment_id: paymentId,
              granted_at: data.access!.grantedAt?.toISOString() ?? new Date().toISOString(),
              expires_at: data.access!.expiresAt?.toISOString() ?? null,
            }))
          : data.access.unitIds.map((unitId) => ({
              student_id: userId,
              scope: 'unit',
              level_id: null,
              unit_id: unitId,
              source: data.access!.source,
              note: data.access!.note,
              granted_by: user.id,
              payment_id: paymentId,
              granted_at: data.access!.grantedAt?.toISOString() ?? new Date().toISOString(),
              expires_at: data.access!.expiresAt?.toISOString() ?? null,
            }))

      if (rows.length) {
        const { error: entErr } = await db.from('entitlements').insert(rows)
        if (entErr) throw new Error(entErr.message)
      }

      if (data.access.sessionCredits > 0) {
        await db.from('session_credit_entries').insert({
          student_id: userId,
          delta: data.access.sessionCredits,
          reason: 'grant',
          payment_id: paymentId,
          note: data.access.note,
          expires_at: data.access.creditsExpireAt?.toISOString() ?? null,
          created_by: user.id,
        })
      }
    }

    if (data.teacherIds.length) {
      await db.from('student_teacher_assignments').insert(
        data.teacherIds.map((teacherId) => ({
          student_id: userId,
          teacher_id: teacherId,
          is_primary: teacherId === data.primaryTeacherId,
        })),
      )
    }

    await writeAudit({
      actorId: user.id,
      actorRole: profile.role,
      action: 'student.create',
      entityType: 'profile',
      entityId: userId,
      metadata: { email: data.email, passwordSetByAdmin: true },
    })

    revalidatePath('/admin/people')
    revalidatePath('/admin')
    return { ok: true, id: userId, email: data.email }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create student' }
  }
}

export async function createTeacherAction(input: unknown): Promise<ActionResult> {
  const { user, profile } = await requireRole('admin')
  const parsed = createTeacherSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form data' }
  }
  const data = parsed.data
  const db = await createAdminDb()

  try {
    const userId = await createUserWithPassword(data.email, data.fullName, data.password, 'teacher')

    const now = new Date().toISOString()
    const { error: deleteStudentErr } = await db.from('student_profiles').delete().eq('user_id', userId)
    if (deleteStudentErr) throw new Error(deleteStudentErr.message)

    const { error: profileErr } = await db
      .from('profiles')
      .update({
        role: 'teacher',
        full_name: data.fullName,
        phone: data.phone || null,
        timezone: data.timezone,
        locale: 'en',
        is_active: true,
        invited_at: now,
        activated_at: now,
        created_by: user.id,
      })
      .eq('id', userId)
    if (profileErr) throw new Error(profileErr.message)

    const { error: teacherErr } = await db.from('teacher_profiles').upsert({
      user_id: userId,
      headline: data.headline || null,
      bio: data.bio || null,
      years_experience: data.yearsExperience ?? null,
      languages_spoken: data.languages,
      is_accepting_students: data.isAcceptingStudents,
      hourly_rate_cents: data.hourlyRateCents ?? null,
    })
    if (teacherErr) throw new Error(teacherErr.message)

    await writeAudit({
      actorId: user.id,
      actorRole: profile.role,
      action: 'teacher.create',
      entityType: 'profile',
      entityId: userId,
      metadata: { email: data.email, passwordSetByAdmin: true },
    })

    revalidatePath('/admin/people')
    return { ok: true, id: userId, email: data.email }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create teacher' }
  }
}

export async function createAdminAction(input: unknown): Promise<ActionResult> {
  const { user, profile } = await requireRole('admin')
  const parsed = createAdminUserSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form data' }
  }
  const data = parsed.data

  if (data.adminTitle === 'super_admin' && data.confirmSuperAdmin !== 'SUPERADMIN') {
    return { ok: false, error: 'Type SUPERADMIN to create a Super Admin' }
  }

  const db = await createAdminDb()

  try {
    const now = new Date().toISOString()
    let userId: string
    let setupLink: string | undefined

    if (data.password) {
      userId = await createUserWithPassword(data.email, data.fullName, data.password, 'admin')
    } else {
      const invited = await inviteOrCreate(data.email, data.fullName, data.sendInvite, 'admin')
      userId = invited.userId
      setupLink = invited.setupLink
    }

    const { error: deleteStudentErr } = await db.from('student_profiles').delete().eq('user_id', userId)
    if (deleteStudentErr) throw new Error(deleteStudentErr.message)

    const { error: profileErr } = await db
      .from('profiles')
      .update({
        role: 'admin',
        full_name: data.fullName,
        admin_title: data.adminTitle,
        timezone: data.timezone,
        locale: 'en',
        is_active: true,
        invited_at: now,
        // Password create → active now; invite flow stays pending until set-password
        activated_at: data.password ? now : null,
        created_by: user.id,
      })
      .eq('id', userId)
    if (profileErr) throw new Error(profileErr.message)

    await writeAudit({
      actorId: user.id,
      actorRole: profile.role,
      action: 'admin.create',
      entityType: 'profile',
      entityId: userId,
      metadata: {
        email: data.email,
        adminTitle: data.adminTitle,
        passwordSetByAdmin: Boolean(data.password),
      },
    })

    revalidatePath('/admin/people')
    return { ok: true, id: userId, setupLink }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create admin' }
  }
}

export async function createOrganizationAction(input: unknown): Promise<ActionResult> {
  const { user, profile } = await requireRole('admin')
  const parsed = createOrganizationSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form data' }
  }
  const data = parsed.data
  const db = await createAdminDb()

  const { data: org, error } = await db
    .from('organizations')
    .insert({
      name: data.name,
      type: data.type,
      country: data.country ?? null,
      billing_contact_name: data.billingContactName ?? null,
      billing_contact_email: data.billingContactEmail ?? null,
      billing_address: data.billingAddress ?? null,
      tax_id: data.taxId ?? null,
      notes: data.notes ?? null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'organization.create',
    entityType: 'organization',
    entityId: org.id,
    metadata: { name: data.name },
  })

  revalidatePath('/admin/organizations')
  return { ok: true, id: org.id }
}

export async function grantEntitlementAction(input: unknown): Promise<ActionResult> {
  const { user, profile } = await requireRole('admin')
  const parsed = grantEntitlementSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form data' }
  }
  const data = parsed.data
  const db = await createAdminDb()

  const rows =
    data.scope === 'level'
      ? data.levelIds.map((levelId) => ({
          student_id: data.studentId,
          scope: 'level' as const,
          level_id: levelId,
          unit_id: null,
          source: data.source,
          note: data.note,
          granted_by: user.id,
          granted_at: data.grantedAt?.toISOString() ?? new Date().toISOString(),
          expires_at: data.expiresAt?.toISOString() ?? null,
        }))
      : data.unitIds.map((unitId) => ({
          student_id: data.studentId,
          scope: 'unit' as const,
          level_id: null,
          unit_id: unitId,
          source: data.source,
          note: data.note,
          granted_by: user.id,
          granted_at: data.grantedAt?.toISOString() ?? new Date().toISOString(),
          expires_at: data.expiresAt?.toISOString() ?? null,
        }))

  const { error } = await db.from('entitlements').insert(rows)
  if (error) return { ok: false, error: error.message }

  if (data.sessionCredits > 0) {
    await db.from('session_credit_entries').insert({
      student_id: data.studentId,
      delta: data.sessionCredits,
      reason: 'grant',
      note: data.note,
      expires_at: data.creditsExpireAt?.toISOString() ?? null,
      created_by: user.id,
    })
  }

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'entitlement.grant',
    entityType: 'profile',
    entityId: data.studentId,
    metadata: { scope: data.scope, levelIds: data.levelIds, unitIds: data.unitIds },
  })

  revalidatePath('/admin/entitlements')
  revalidatePath('/admin')
  return { ok: true }
}

export async function recordPaymentAction(input: unknown): Promise<ActionResult> {
  const { user, profile } = await requireRole('admin')
  const parsed = recordPaymentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid form data' }
  }
  const data = parsed.data
  const db = await createAdminDb()

  const { data: payment, error } = await db
    .from('payments')
    .insert({
      student_id: data.studentId,
      organization_id: data.organizationId ?? null,
      amount_cents: Math.round(data.amount * 100),
      currency: data.currency,
      provider: data.provider,
      reference: data.reference ?? null,
      status: data.status,
      paid_at: data.paidAt?.toISOString() ?? null,
      note: data.note ?? null,
      recorded_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'payment.record',
    entityType: 'payment',
    entityId: payment.id,
    metadata: { studentId: data.studentId, amount: data.amount, currency: data.currency },
  })

  revalidatePath('/admin/payments')
  revalidatePath('/admin')
  return { ok: true, id: payment.id }
}

export async function createCohortAction(formData: FormData): Promise<ActionResult> {
  const { user, profile } = await requireRole('admin')
  const name = String(formData.get('name') ?? '').trim()
  const organizationId = String(formData.get('organizationId') ?? '') || null
  const levelId = String(formData.get('levelId') ?? '') || null
  if (!name) return { ok: false, error: 'Name is required' }

  const db = await createAdminDb()
  const { data: cohort, error } = await db
    .from('cohorts')
    .insert({
      name,
      organization_id: organizationId,
      level_id: levelId,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'cohort.create',
    entityType: 'cohort',
    entityId: cohort.id,
    metadata: { name },
  })

  revalidatePath('/admin/cohorts')
  return { ok: true, id: cohort.id }
}

export async function updateLevelStatusAction(levelId: string, status: string): Promise<ActionResult> {
  const { user, profile } = await requireRole('admin')
  const db = await createAdminDb()
  const { error } = await db.from('levels').update({ status }).eq('id', levelId)
  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: status === 'published' ? 'content.publish' : 'content.update',
    entityType: 'level',
    entityId: levelId,
    metadata: { status },
  })

  revalidatePath('/admin/levels')
  return { ok: true }
}

export async function createBlogPostAction(formData: FormData): Promise<ActionResult> {
  const { user, profile } = await requireRole('admin')
  const { parseBlogFields } = await import('@/lib/blog/parse-form')
  const { applyBlogUploads } = await import('@/lib/blog/apply-uploads')
  let fields = parseBlogFields(formData)
  if (!fields.title || !fields.slug) return { ok: false, error: 'Title and slug are required' }

  const PUBLISH = new Set(['draft', 'in_review', 'published', 'archived'])
  const status = PUBLISH.has(fields.status) ? fields.status : 'draft'

  try {
    fields = await applyBlogUploads(fields, formData)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Upload failed' }
  }

  const now = new Date().toISOString()
  const db = createAdminDb()
  const { data: post, error } = await db
    .from('blog_posts')
    .insert({
      title: fields.title,
      slug: fields.slug,
      excerpt: fields.excerpt,
      body_md: fields.bodyMd,
      cover_path: fields.coverPath,
      cover_alt: fields.coverAlt,
      video_url: fields.videoUrl,
      video_path: fields.videoPath,
      video_caption: fields.videoCaption,
      gallery: fields.gallery,
      reference_links: fields.referenceLinks,
      blocks: fields.blocks,
      tags: fields.tags,
      seo_title: fields.seoTitle,
      seo_description: fields.seoDescription,
      author_id: user.id,
      status,
      published_at: status === 'published' ? now : null,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'blog.create',
    entityType: 'blog_post',
    entityId: post.id,
    metadata: { title: fields.title, slug: fields.slug, status },
  })

  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  if (status === 'published') revalidatePath(`/blog/${fields.slug}`)
  return { ok: true, id: post.id }
}

export async function createVocabularyAction(formData: FormData): Promise<ActionResult> {
  const { user, profile } = await requireRole('admin')
  const amharic = String(formData.get('amharic') ?? '').trim()
  const english = String(formData.get('english') ?? '').trim()
  const levelId = String(formData.get('levelId') ?? 'ha')
  const transliteration = String(formData.get('transliteration') ?? '').trim() || null
  const audioSlow = String(formData.get('audioSlow') ?? '').trim() || null
  const audioNormal = String(formData.get('audioNormal') ?? '').trim() || null
  const audioNatural = String(formData.get('audioNatural') ?? '').trim() || null
  if (!amharic || !english) return { ok: false, error: 'Amharic and English are required' }

  const db = await createAdminDb()
  const { data: item, error } = await db
    .from('vocabulary_items')
    .insert({
      amharic,
      english,
      level_id: levelId,
      transliteration,
      audio_slow_path: audioSlow,
      audio_normal_path: audioNormal,
      audio_natural_path: audioNatural,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'vocabulary.create',
    entityType: 'vocabulary_item',
    entityId: item.id,
    metadata: { amharic, english, levelId },
  })

  revalidatePath('/admin/vocabulary')
  return { ok: true, id: item.id }
}

export async function createVocabularyFormAction(formData: FormData): Promise<void> {
  await createVocabularyAction(formData)
}

export async function createBlogPostFormAction(formData: FormData): Promise<void> {
  const result = await createBlogPostAction(formData)
  if (!result.ok) throw new Error(result.error ?? 'Could not create post')
}

export async function setLevelStatusFormAction(levelId: string, status: string): Promise<void> {
  await updateLevelStatusAction(levelId, status)
}
