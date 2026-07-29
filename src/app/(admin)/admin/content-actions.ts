'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { createAdminDb, writeAudit } from '@/lib/admin/db'
import { revalidateCurriculum } from '@/lib/data/curriculum'
import type { ActionResult } from '@/app/(admin)/admin/actions'
import { lessonPartContentSchema, type LessonPartKey } from '@/lib/validation/content'

const PUBLISH_STATUSES = new Set(['draft', 'in_review', 'published', 'archived'])

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

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

/* ─── Levels ───────────────────────────────────────────────────────── */

export async function updateLevelAction(formData: FormData): Promise<void> {
  await requireRole('admin')
  const id = String(formData.get('id') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const subtitle = String(formData.get('subtitle') ?? '').trim() || null
  const description = String(formData.get('description') ?? '').trim() || null
  const canDoSummary = String(formData.get('canDoSummary') ?? '').trim() || null
  const cefr = String(formData.get('cefrEquivalent') ?? '').trim()
  const isComingSoon = formData.get('isComingSoon') === 'on'
  const status = String(formData.get('status') ?? 'draft')

  if (!id || !title || !cefr) return
  if (!PUBLISH_STATUSES.has(status)) return

  const db = await createAdminDb()
  const { error } = await db
    .from('levels')
    .update({
      title,
      subtitle,
      description,
      can_do_summary: canDoSummary,
      cefr_equivalent: cefr,
      is_coming_soon: isComingSoon,
      status,
      updated_at: nowIso(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await audit('level.update', 'level', id, { title, status })
  revalidateCurriculum()
  revalidatePath('/admin/levels')
  revalidatePath(`/admin/levels/${id}`)
  revalidatePath(`/levels/${id}`)
}

export async function deleteLevelAction(levelId: string): Promise<void> {
  await requireRole('admin')
  const db = await createAdminDb()

  const { count } = await db
    .from('units')
    .select('id', { count: 'exact', head: true })
    .eq('level_id', levelId)

  if ((count ?? 0) > 0) {
    throw new Error('Remove or move all units before deleting this level.')
  }

  const { error } = await db.from('levels').delete().eq('id', levelId)
  if (error) throw new Error(error.message)

  await audit('level.delete', 'level', levelId)
  revalidateCurriculum()
  revalidatePath('/admin/levels')
  revalidatePath('/levels')
  redirect('/admin/levels')
}

/* ─── Units ────────────────────────────────────────────────────────── */

export async function createUnitAction(formData: FormData): Promise<void> {
  await requireRole('admin')
  const levelId = String(formData.get('levelId') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const slugInput = String(formData.get('slug') ?? '').trim()
  const subtitle = String(formData.get('subtitle') ?? '').trim() || null
  const description = String(formData.get('description') ?? '').trim() || null
  const estimatedMinutes = Number(formData.get('estimatedMinutes') ?? 45) || 45

  if (!levelId || !title) return
  const slug = slugify(slugInput || title)
  if (!slug) return

  const db = await createAdminDb()
  const { data: existing } = await db
    .from('units')
    .select('sort_order')
    .eq('level_id', levelId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const sortOrder = ((existing?.[0]?.sort_order as number | undefined) ?? 0) + 1
  const id = `${levelId}-unit-${String(sortOrder).padStart(2, '0')}`

  const { error } = await db.from('units').insert({
    id,
    level_id: levelId,
    slug,
    title,
    subtitle,
    description,
    estimated_minutes: estimatedMinutes,
    sort_order: sortOrder,
    status: 'draft',
  })
  if (error) throw new Error(error.message)

  // Seed empty part rows so editors open immediately
  await db.from('lesson_parts').insert([
    { unit_id: id, part: 'cultural_insight', content: {}, status: 'draft' },
    { unit_id: id, part: 'language_lesson', content: {}, status: 'draft' },
    { unit_id: id, part: 'practice', content: {}, status: 'draft' },
  ])

  await audit('unit.create', 'unit', id, { levelId, title })
  revalidateCurriculum()
  revalidatePath(`/admin/levels/${levelId}`)
  revalidatePath(`/levels/${levelId}`)
  redirect(`/admin/units/${id}`)
}

export async function updateUnitAction(formData: FormData): Promise<void> {
  await requireRole('admin')
  const id = String(formData.get('id') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const slug = slugify(String(formData.get('slug') ?? ''))
  const subtitle = String(formData.get('subtitle') ?? '').trim() || null
  const description = String(formData.get('description') ?? '').trim() || null
  const estimatedMinutes = Number(formData.get('estimatedMinutes') ?? 45) || 45
  const status = String(formData.get('status') ?? 'draft')
  const sortOrder = Number(formData.get('sortOrder') ?? 1) || 1

  if (!id || !title || !slug) return
  if (!PUBLISH_STATUSES.has(status)) return

  const db = await createAdminDb()
  const { data: unit } = await db.from('units').select('level_id').eq('id', id).maybeSingle()
  if (!unit) return

  const { error } = await db
    .from('units')
    .update({
      title,
      slug,
      subtitle,
      description,
      estimated_minutes: estimatedMinutes,
      status,
      sort_order: sortOrder,
      updated_at: nowIso(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await audit('unit.update', 'unit', id, { title, status })
  revalidateCurriculum()
  revalidatePath(`/admin/units/${id}`)
  revalidatePath(`/admin/levels/${unit.level_id}`)
  revalidatePath(`/levels/${unit.level_id}`)
}

export async function setUnitStatusAction(unitId: string, status: string): Promise<void> {
  await requireRole('admin')
  if (!PUBLISH_STATUSES.has(status)) return

  const db = await createAdminDb()
  const { data: unit } = await db.from('units').select('level_id').eq('id', unitId).maybeSingle()
  const { error } = await db
    .from('units')
    .update({ status, updated_at: nowIso() })
    .eq('id', unitId)
  if (error) throw new Error(error.message)

  await audit(status === 'published' ? 'unit.publish' : 'unit.update', 'unit', unitId, { status })
  revalidateCurriculum()
  revalidatePath(`/admin/units/${unitId}`)
  if (unit?.level_id) {
    revalidatePath(`/admin/levels/${unit.level_id}`)
    revalidatePath(`/levels/${unit.level_id}`)
  }
  revalidatePath('/admin/levels')
  revalidatePath('/levels')
}

export async function deleteUnitAction(unitId: string): Promise<void> {
  await requireRole('admin')
  const db = await createAdminDb()
  const { data: unit } = await db.from('units').select('level_id').eq('id', unitId).maybeSingle()
  if (!unit) return

  const { error } = await db.from('units').delete().eq('id', unitId)
  if (error) throw new Error(error.message)

  await audit('unit.delete', 'unit', unitId)
  revalidateCurriculum()
  revalidatePath(`/admin/levels/${unit.level_id}`)
  revalidatePath(`/levels/${unit.level_id}`)
  revalidatePath('/admin/levels')
  revalidatePath('/levels')
  redirect(`/admin/levels/${unit.level_id}`)
}

/* ─── Lesson parts ─────────────────────────────────────────────────── */

const PART_KEYS = new Set(['cultural_insight', 'language_lesson', 'practice'])

export async function upsertPartAction(formData: FormData): Promise<ActionResult> {
  await requireRole('admin')
  const unitId = String(formData.get('unitId') ?? '')
  const part = String(formData.get('part') ?? '')
  const status = String(formData.get('status') ?? 'draft')
  const contentRaw = String(formData.get('content') ?? '{}')

  if (!unitId || !PART_KEYS.has(part)) {
    return { ok: false, error: 'Invalid part' }
  }
  if (!PUBLISH_STATUSES.has(status)) {
    return { ok: false, error: 'Invalid status' }
  }

  let content: unknown
  try {
    content = JSON.parse(contentRaw)
  } catch {
    return { ok: false, error: 'Content must be valid JSON' }
  }

  const parsed = lessonPartContentSchema.safeParse({
    ...(typeof content === 'object' && content !== null ? content : {}),
    part: part as LessonPartKey,
    version: 1,
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid lesson content shape',
    }
  }
  content = parsed.data

  const db = await createAdminDb()
  const { data: existing } = await db
    .from('lesson_parts')
    .select('id')
    .eq('unit_id', unitId)
    .eq('part', part)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await db
      .from('lesson_parts')
      .update({ content, status, updated_at: nowIso() })
      .eq('id', existing.id)
    if (error) return { ok: false, error: error.message }
    await audit('part.update', 'lesson_part', existing.id, { unitId, part, status })
  } else {
    const { data: created, error } = await db
      .from('lesson_parts')
      .insert({ unit_id: unitId, part, content, status })
      .select('id')
      .single()
    if (error) return { ok: false, error: error.message }
    await audit('part.create', 'lesson_part', created.id, { unitId, part, status })
  }

  revalidateCurriculum()
  revalidatePath(`/admin/units/${unitId}`)
  const slug =
    part === 'cultural_insight'
      ? 'cultural-insight'
      : part === 'language_lesson'
        ? 'language-lesson'
        : 'practice'
  revalidatePath(`/admin/units/${unitId}/parts/${slug}`)
  revalidatePath('/levels')
  return { ok: true }
}

export async function upsertPartFormAction(formData: FormData): Promise<void> {
  const result = await upsertPartAction(formData)
  if (!result.ok) throw new Error(result.error ?? 'Failed to save part')
}

export async function setPartStatusAction(
  unitId: string,
  part: string,
  status: string,
): Promise<void> {
  await requireRole('admin')
  if (!PART_KEYS.has(part) || !PUBLISH_STATUSES.has(status)) return

  const db = await createAdminDb()
  const { data: row } = await db
    .from('lesson_parts')
    .select('id')
    .eq('unit_id', unitId)
    .eq('part', part)
    .maybeSingle()

  if (row?.id) {
    const { error } = await db
      .from('lesson_parts')
      .update({ status, updated_at: nowIso() })
      .eq('id', row.id)
    if (error) throw new Error(error.message)
    await audit(status === 'published' ? 'part.publish' : 'part.update', 'lesson_part', row.id, {
      unitId,
      part,
      status,
    })
  } else {
    const { data: created, error } = await db
      .from('lesson_parts')
      .insert({ unit_id: unitId, part, content: {}, status })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    await audit('part.create', 'lesson_part', created.id, { unitId, part, status })
  }

  revalidateCurriculum()
  revalidatePath(`/admin/units/${unitId}`)
  revalidatePath('/levels')
}

export async function deletePartAction(unitId: string, part: string): Promise<void> {
  await requireRole('admin')
  if (!PART_KEYS.has(part)) return

  const db = await createAdminDb()
  const { data: row } = await db
    .from('lesson_parts')
    .select('id')
    .eq('unit_id', unitId)
    .eq('part', part)
    .maybeSingle()

  if (!row?.id) return

  const { error } = await db.from('lesson_parts').delete().eq('id', row.id)
  if (error) throw new Error(error.message)

  await audit('part.delete', 'lesson_part', row.id, { unitId, part })
  revalidateCurriculum()
  revalidatePath(`/admin/units/${unitId}`)
  const slug =
    part === 'cultural_insight'
      ? 'cultural-insight'
      : part === 'language_lesson'
        ? 'language-lesson'
        : 'practice'
  revalidatePath(`/admin/units/${unitId}/parts/${slug}`)
  revalidatePath('/levels')
}

export async function resetPartContentAction(unitId: string, part: string): Promise<void> {
  await requireRole('admin')
  if (!PART_KEYS.has(part)) return

  const db = await createAdminDb()
  const { data: row } = await db
    .from('lesson_parts')
    .select('id')
    .eq('unit_id', unitId)
    .eq('part', part)
    .maybeSingle()

  if (!row?.id) return

  const { error } = await db
    .from('lesson_parts')
    .update({ content: {}, status: 'draft', updated_at: nowIso() })
    .eq('id', row.id)
  if (error) throw new Error(error.message)

  await audit('part.reset', 'lesson_part', row.id, { unitId, part })
  revalidateCurriculum()
  revalidatePath(`/admin/units/${unitId}`)
  revalidatePath('/levels')
}

/* ─── Vocabulary ───────────────────────────────────────────────────── */

export async function updateVocabularyAction(formData: FormData): Promise<void> {
  await requireRole('admin')
  const id = String(formData.get('id') ?? '')
  const amharic = String(formData.get('amharic') ?? '').trim()
  const english = String(formData.get('english') ?? '').trim()
  const transliteration = String(formData.get('transliteration') ?? '').trim() || null
  const levelId = String(formData.get('levelId') ?? 'ha')
  const notes = String(formData.get('notes') ?? '').trim() || null
  const audioSlow = String(formData.get('audioSlow') ?? '').trim() || null
  const audioNormal = String(formData.get('audioNormal') ?? '').trim() || null
  const audioNatural = String(formData.get('audioNatural') ?? '').trim() || null
  const unitIds = formData
    .getAll('unitIds')
    .map((v) => String(v).trim())
    .filter(Boolean)
  const syncUnits = String(formData.get('syncUnits') ?? '') === '1'

  if (!id || !amharic || !english) return

  const db = await createAdminDb()
  const { error } = await db
    .from('vocabulary_items')
    .update({
      amharic,
      english,
      transliteration,
      level_id: levelId,
      notes,
      audio_slow_path: audioSlow,
      audio_normal_path: audioNormal,
      audio_natural_path: audioNatural,
      updated_at: nowIso(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  if (syncUnits) {
    const { data: existing } = await db
      .from('unit_vocabulary')
      .select('unit_id')
      .eq('vocabulary_id', id)
    const previous = (existing ?? []).map((r: { unit_id: string }) => r.unit_id)

    await db.from('unit_vocabulary').delete().eq('vocabulary_id', id)
    if (unitIds.length > 0) {
      const { error: linkError } = await db.from('unit_vocabulary').insert(
        unitIds.map((unitId, index) => ({
          unit_id: unitId,
          vocabulary_id: id,
          sort_order: index,
          is_core: false,
        })),
      )
      if (linkError) throw new Error(linkError.message)
    }

    for (const unitId of new Set([...previous, ...unitIds])) {
      revalidatePath(`/admin/units/${unitId}`)
      revalidatePath(`/admin/units/${unitId}/vocabulary`)
    }
  }

  await audit('vocabulary.update', 'vocabulary_item', id, { amharic, english, unitIds: syncUnits ? unitIds : undefined })
  revalidateCurriculum()
  revalidatePath('/admin/vocabulary')
  revalidatePath('/vocabulary')
  revalidatePath('/levels')
}

export async function deleteVocabularyAction(id: string): Promise<void> {
  await requireRole('admin')
  const db = await createAdminDb()

  const { data: links } = await db
    .from('unit_vocabulary')
    .select('unit_id')
    .eq('vocabulary_id', id)

  const { error } = await db.from('vocabulary_items').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await audit('vocabulary.delete', 'vocabulary_item', id)
  revalidateCurriculum()
  revalidatePath('/admin/vocabulary')
  revalidatePath('/vocabulary')
  revalidatePath('/levels')
  for (const row of links ?? []) {
    revalidatePath(`/admin/units/${row.unit_id}`)
    revalidatePath(`/admin/units/${row.unit_id}/vocabulary`)
  }
}

export async function assignVocabularyToUnitAction(formData: FormData): Promise<void> {
  await requireRole('admin')
  const unitId = String(formData.get('unitId') ?? '').trim()
  const vocabularyIds = formData
    .getAll('vocabularyIds')
    .map((v) => String(v).trim())
    .filter(Boolean)
  const isCore = String(formData.get('isCore') ?? '') === 'on'
  if (!unitId || vocabularyIds.length === 0) return

  const db = await createAdminDb()
  const { count } = await db
    .from('unit_vocabulary')
    .select('vocabulary_id', { count: 'exact', head: true })
    .eq('unit_id', unitId)

  const rows = vocabularyIds.map((vocabularyId, index) => ({
    unit_id: unitId,
    vocabulary_id: vocabularyId,
    sort_order: (count ?? 0) + index,
    is_core: isCore,
  }))

  const { error } = await db.from('unit_vocabulary').upsert(rows, {
    onConflict: 'unit_id,vocabulary_id',
  })
  if (error) throw new Error(error.message)

  await audit('vocabulary.assign_unit', 'unit', unitId, { vocabularyIds })
  revalidateCurriculum()
  revalidatePath(`/admin/units/${unitId}`)
  revalidatePath(`/admin/units/${unitId}/vocabulary`)
  revalidatePath('/admin/vocabulary')
}

export async function unassignVocabularyFromUnitAction(formData: FormData): Promise<void> {
  await requireRole('admin')
  const unitId = String(formData.get('unitId') ?? '').trim()
  const vocabularyId = String(formData.get('vocabularyId') ?? '').trim()
  if (!unitId || !vocabularyId) return

  const db = await createAdminDb()
  const { error } = await db
    .from('unit_vocabulary')
    .delete()
    .eq('unit_id', unitId)
    .eq('vocabulary_id', vocabularyId)
  if (error) throw new Error(error.message)

  await audit('vocabulary.unassign_unit', 'unit', unitId, { vocabularyId })
  revalidateCurriculum()
  revalidatePath(`/admin/units/${unitId}`)
  revalidatePath(`/admin/units/${unitId}/vocabulary`)
  revalidatePath('/admin/vocabulary')
}

export async function setVocabularyUnitCoreAction(formData: FormData): Promise<void> {
  await requireRole('admin')
  const unitId = String(formData.get('unitId') ?? '').trim()
  const vocabularyId = String(formData.get('vocabularyId') ?? '').trim()
  const isCore = String(formData.get('isCore') ?? '') === 'on'
  if (!unitId || !vocabularyId) return

  const db = await createAdminDb()
  const { error } = await db
    .from('unit_vocabulary')
    .update({ is_core: isCore })
    .eq('unit_id', unitId)
    .eq('vocabulary_id', vocabularyId)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/units/${unitId}/vocabulary`)
}

/* ─── Blog ─────────────────────────────────────────────────────────── */

export async function updateBlogPostAction(formData: FormData): Promise<ActionResult> {
  await requireRole('admin')
  const { parseBlogFields } = await import('@/lib/blog/parse-form')
  const { applyBlogUploads } = await import('@/lib/blog/apply-uploads')

  const id = String(formData.get('id') ?? '')
  let fields = parseBlogFields(formData)
  if (!id || !fields.title || !fields.slug) {
    return { ok: false, error: 'Title and slug are required' }
  }
  if (!PUBLISH_STATUSES.has(fields.status)) {
    return { ok: false, error: 'Invalid status' }
  }

  try {
    fields = await applyBlogUploads(fields, formData)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Upload failed' }
  }

  const db = createAdminDb()
  const payload: Record<string, unknown> = {
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
    status: fields.status,
    updated_at: nowIso(),
  }
  if (fields.status === 'published') payload.published_at = nowIso()

  const { error } = await db.from('blog_posts').update(payload).eq('id', id)
  if (error) return { ok: false, error: error.message }

  await audit(
    fields.status === 'published' ? 'blog.publish' : 'blog.update',
    'blog_post',
    id,
    { title: fields.title, status: fields.status },
  )
  revalidatePath('/admin/blog')
  revalidatePath(`/admin/blog/${id}`)
  revalidatePath('/blog')
  revalidatePath(`/blog/${fields.slug}`)
  return { ok: true, id }
}

export async function updateBlogPostFormAction(formData: FormData): Promise<void> {
  const result = await updateBlogPostAction(formData)
  if (!result.ok) throw new Error(result.error ?? 'Could not save post')
}

export async function setBlogStatusAction(id: string, status: string): Promise<void> {
  await requireRole('admin')
  if (!PUBLISH_STATUSES.has(status)) return

  const db = createAdminDb()
  const { data: existing } = await db.from('blog_posts').select('slug').eq('id', id).maybeSingle()
  const payload: Record<string, unknown> = { status, updated_at: nowIso() }
  if (status === 'published') payload.published_at = nowIso()

  const { error } = await db.from('blog_posts').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  await audit(status === 'published' ? 'blog.publish' : 'blog.update', 'blog_post', id, { status })
  revalidatePath('/admin/blog')
  revalidatePath(`/admin/blog/${id}`)
  revalidatePath('/blog')
  if (existing?.slug) revalidatePath(`/blog/${existing.slug}`)
}

export async function deleteBlogPostAction(id: string): Promise<void> {
  await requireRole('admin')
  const db = createAdminDb()
  const { data: existing } = await db.from('blog_posts').select('slug').eq('id', id).maybeSingle()
  const { error } = await db.from('blog_posts').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await audit('blog.delete', 'blog_post', id)
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  if (existing?.slug) revalidatePath(`/blog/${existing.slug}`)
}

export async function deleteBlogPostAndRedirectAction(id: string): Promise<void> {
  await deleteBlogPostAction(id)
  redirect('/admin/blog')
}

/* ─── Media metadata ───────────────────────────────────────────────── */

export async function deleteMediaAction(id: string): Promise<void> {
  await requireRole('admin')
  const db = await createAdminDb()
  const { error } = await db.from('media_assets').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await audit('media.delete', 'media_asset', id)
  revalidatePath('/admin/media')
}

export async function createMediaMetaAction(formData: FormData): Promise<void> {
  const { user } = await requireRole('admin')
  const storagePath = String(formData.get('storagePath') ?? '').trim()
  const kind = String(formData.get('kind') ?? 'image')
  const mimeType = String(formData.get('mimeType') ?? 'application/octet-stream').trim()
  const levelId = String(formData.get('levelId') ?? '').trim() || null
  const unitId = String(formData.get('unitId') ?? '').trim() || null
  const altText = String(formData.get('altText') ?? '').trim() || null

  if (!storagePath) return

  const db = await createAdminDb()
  const { data, error } = await db
    .from('media_assets')
    .insert({
      storage_path: storagePath,
      kind,
      mime_type: mimeType,
      level_id: levelId,
      unit_id: unitId,
      alt_text: altText,
      uploaded_by: user.id,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await audit('media.create', 'media_asset', data.id, { storagePath, kind })
  revalidatePath('/admin/media')
}
