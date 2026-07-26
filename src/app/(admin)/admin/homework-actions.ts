'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/guards'
import { createAdminDb, writeAudit } from '@/lib/admin/db'

export async function createHomeworkAssignmentAction(formData: FormData) {
  const { user, profile } = await requireRole('admin')
  const title = String(formData.get('title') ?? '').trim()
  const instructions = String(formData.get('instructions') ?? '').trim()
  const unitId = String(formData.get('unitId') ?? '').trim() || null
  const isUnitDefault = formData.get('isUnitDefault') === 'on'
  const allowAudio = formData.get('allowAudio') === 'on'
  const allowVideo = formData.get('allowVideo') === 'on'
  const maxAudioSeconds = Number(formData.get('maxAudioSeconds') ?? 60) || 60

  if (!title || !instructions) throw new Error('Title and instructions are required')
  if (isUnitDefault && !unitId) throw new Error('Unit default homework needs a unit')

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
      allow_text: true,
      allow_audio: allowAudio,
      allow_video: allowVideo,
      allow_files: false,
      max_audio_seconds: maxAudioSeconds,
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
