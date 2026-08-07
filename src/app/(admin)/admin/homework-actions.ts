'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { createAdminDb, writeAudit } from '@/lib/admin/db'
import type { ActionResult } from '@/app/(admin)/admin/actions'
import {
  lessonPartContentSchema,
  type ContentBlock,
} from '@/lib/validation/content'

const PUBLISH_STATUSES = new Set(['draft', 'in_review', 'published', 'archived'])

function nowIso() {
  return new Date().toISOString()
}

function emptyHomeworkContent(title: string) {
  // Blank studio doc — no starter speaking/homework_prompt blocks.
  // Admins add only the blocks they want (e.g. one voice task).
  return {
    part: 'practice' as const,
    version: 1 as const,
    title: title || 'Homework',
    categories: [] as { id: string; name: string }[],
    blocks: [] as ContentBlock[],
  }
}

export async function createHomeworkAssignmentAction(formData: FormData) {
  const { user, profile } = await requireRole('admin')
  const title = String(formData.get('title') ?? '').trim()
  const instructions = String(formData.get('instructions') ?? '').trim() || title
  const unitId = String(formData.get('unitId') ?? '').trim() || null
  const isUnitDefault = formData.get('isUnitDefault') === 'on'
  const allowAudio = formData.get('allowAudio') === 'on'
  const allowVideo = formData.get('allowVideo') === 'on'
  const maxAudioSeconds = Number(formData.get('maxAudioSeconds') ?? 60) || 60

  if (!title) throw new Error('Title is required')
  if (isUnitDefault && !unitId) throw new Error('Unit default homework needs a unit')

  const content = emptyHomeworkContent(title)

  const db = await createAdminDb()
  const { data, error } = await db
    .from('homework_assignments')
    .insert({
      title,
      instructions,
      unit_id: unitId,
      is_unit_default: isUnitDefault,
      student_id: null,
      assigned_by: user.id,
      // Answer options come only from studio blocks (speaking / homework_prompt), not create toggles.
      allow_text: false,
      allow_audio: allowAudio,
      allow_video: allowVideo,
      allow_files: false,
      max_audio_seconds: maxAudioSeconds,
      status: 'draft',
      content,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'homework.create',
    entityType: 'homework_assignment',
    entityId: data.id,
    metadata: { title, unitId, isUnitDefault },
  })

  revalidatePath('/admin/homework')
  redirect(`/admin/homework/${data.id}` as '/')
}

export async function upsertHomeworkContentAction(formData: FormData): Promise<ActionResult> {
  const { user, profile } = await requireRole('admin')
  const id = String(formData.get('assignmentId') ?? '')
  const status = String(formData.get('status') ?? 'draft')
  const title = String(formData.get('title') ?? '').trim()
  const contentRaw = String(formData.get('content') ?? '{}')

  if (!id) return { ok: false, error: 'Missing assignment' }
  if (!PUBLISH_STATUSES.has(status)) return { ok: false, error: 'Invalid status' }

  let content: unknown
  try {
    content = JSON.parse(contentRaw)
  } catch {
    return { ok: false, error: 'Content must be valid JSON' }
  }

  const parsed = lessonPartContentSchema.safeParse({
    ...(typeof content === 'object' && content !== null ? content : {}),
    part: 'practice',
    version: 1,
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid homework content shape',
    }
  }

  const nextTitle = title || parsed.data.title || 'Homework'
  const homeworkBlock = parsed.data.blocks.find((b) => b.type === 'homework_prompt')
  const richTextBlock = parsed.data.blocks.find((b) => b.type === 'rich_text')
  const instructions =
    (homeworkBlock && homeworkBlock.type === 'homework_prompt'
      ? homeworkBlock.instructions
      : null) ||
    (richTextBlock && richTextBlock.type === 'rich_text'
      ? richTextBlock.markdown.slice(0, 280)
      : null) ||
    nextTitle

  const hasVoice =
    parsed.data.blocks.some(
      (b) => b.type === 'speaking_task' || b.type === 'read_aloud' || b.type === 'audio_match',
    ) ||
    (homeworkBlock?.type === 'homework_prompt' && homeworkBlock.allowAudio)
  const hasVideo =
    parsed.data.blocks.some((b) => b.type === 'video_practice') ||
    (homeworkBlock?.type === 'homework_prompt' && homeworkBlock.allowVideo)
  const hasTextForm =
    homeworkBlock?.type === 'homework_prompt' &&
    (homeworkBlock.allowText || homeworkBlock.allowDriveLink || homeworkBlock.allowImage)
  const hasFiles = homeworkBlock?.type === 'homework_prompt' && homeworkBlock.allowFiles
  const maxAudioFromBlocks = parsed.data.blocks
    .filter(
      (b): b is Extract<typeof b, { type: 'speaking_task' | 'read_aloud' }> =>
        b.type === 'speaking_task' || b.type === 'read_aloud',
    )
    .map((b) => b.maxSeconds)
  const maxVideoFromBlocks = parsed.data.blocks
    .filter((b): b is Extract<typeof b, { type: 'video_practice' }> => b.type === 'video_practice')
    .map((b) => b.maxSeconds)

  const db = await createAdminDb()
  const { error } = await db
    .from('homework_assignments')
    .update({
      title: nextTitle,
      instructions,
      content: parsed.data,
      status,
      allow_text: Boolean(hasTextForm),
      allow_audio: hasVoice,
      allow_video: hasVideo,
      allow_files: Boolean(hasFiles),
      ...(maxAudioFromBlocks.length > 0
        ? { max_audio_seconds: Math.max(...maxAudioFromBlocks) }
        : {}),
      ...(maxVideoFromBlocks.length > 0
        ? { max_video_seconds: Math.max(...maxVideoFromBlocks) }
        : {}),
      updated_at: nowIso(),
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: status === 'published' ? 'homework.publish' : 'homework.update',
    entityType: 'homework_assignment',
    entityId: id,
    metadata: { status, title: nextTitle },
  })

  revalidatePath('/admin/homework')
  revalidatePath(`/admin/homework/${id}`)
  revalidatePath('/homework')
  revalidatePath(`/homework/${id}`)
  return { ok: true }
}

export async function setHomeworkStatusAction(id: string, status: string): Promise<void> {
  const { user, profile } = await requireRole('admin')
  if (!PUBLISH_STATUSES.has(status)) return

  const db = await createAdminDb()
  const { error } = await db
    .from('homework_assignments')
    .update({ status, updated_at: nowIso() })
    .eq('id', id)
  if (error) throw new Error(error.message)

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: status === 'published' ? 'homework.publish' : 'homework.update',
    entityType: 'homework_assignment',
    entityId: id,
    metadata: { status },
  })

  revalidatePath('/admin/homework')
  revalidatePath(`/admin/homework/${id}`)
  revalidatePath('/homework')
  revalidatePath(`/homework/${id}`)
}

export async function resetHomeworkContentAction(id: string): Promise<void> {
  const { user, profile } = await requireRole('admin')
  const db = await createAdminDb()

  const { data: row } = await db
    .from('homework_assignments')
    .select('title')
    .eq('id', id)
    .maybeSingle()

  const content = emptyHomeworkContent(row?.title ?? 'Homework')
  const { error } = await db
    .from('homework_assignments')
    .update({
      content,
      status: 'draft',
      instructions: row?.title ?? 'Homework',
      updated_at: nowIso(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'homework.reset',
    entityType: 'homework_assignment',
    entityId: id,
  })

  revalidatePath('/admin/homework')
  revalidatePath(`/admin/homework/${id}`)
}

export async function deleteHomeworkAssignmentAction(id: string) {
  const { user, profile } = await requireRole('admin')
  const db = await createAdminDb()
  const { error } = await db.from('homework_assignments').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await writeAudit({
    actorId: user.id,
    actorRole: profile.role,
    action: 'homework.delete',
    entityType: 'homework_assignment',
    entityId: id,
  })

  revalidatePath('/admin/homework')
}
