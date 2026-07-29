'use server'

import { requireRole } from '@/lib/auth/guards'
import { createAdminDb, writeAudit } from '@/lib/admin/db'
import { uploadAudioMedia, getUploadFile, type AudioUploadFolder } from '@/lib/media/upload-audio'
import { uploadImageMedia, type ImageUploadFolder } from '@/lib/media/upload-image'
import { uploadHomeworkAssignmentFile } from '@/lib/media/upload-homework-file'

export type UploadAudioResult =
  | { ok: true; path: string; publicUrl: string; bucket: string }
  | { ok: false; error: string }

export type UploadImageResult =
  | { ok: true; path: string; publicUrl: string; bucket: string }
  | { ok: false; error: string }

export type UploadHomeworkFileResult =
  | { ok: true; path: string; publicUrl: string; bucket: string; fileName: string }
  | { ok: false; error: string }

export async function uploadAdminAudioAction(formData: FormData): Promise<UploadAudioResult> {
  const { user, profile } = await requireRole('admin')

  const file = getUploadFile(formData, 'file')
  if (!file) return { ok: false, error: 'No audio file received' }

  const folder = (String(formData.get('folder') ?? 'vocab') as AudioUploadFolder) || 'vocab'
  const levelId = String(formData.get('levelId') ?? 'ha')
  const label = String(formData.get('label') ?? 'clip')
  const speed = String(formData.get('speed') ?? '') || null

  try {
    const uploaded = await uploadAudioMedia(file, folder, { levelId, label })

    const db = await createAdminDb()
    const { error: metaError } = await db.from('media_assets').insert({
      bucket: uploaded.bucket,
      storage_path: uploaded.path,
      kind: 'audio',
      mime_type: file.type || 'audio/webm',
      size_bytes: file.size,
      speed: speed && ['slow', 'normal', 'natural'].includes(speed) ? speed : null,
      level_id: levelId || null,
      uploaded_by: user.id,
      alt_text: label,
    })
    if (metaError) {
      console.error('[uploadAdminAudio] media_assets', metaError.message)
    }

    await writeAudit({
      actorId: user.id,
      actorRole: profile.role,
      action: 'media.audio_upload',
      entityType: 'media_asset',
      entityId: uploaded.path,
      metadata: { folder, levelId, label, speed, size: file.size },
    })

    return {
      ok: true,
      path: uploaded.path,
      publicUrl: uploaded.publicUrl,
      bucket: uploaded.bucket,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    }
  }
}

export async function uploadAdminImageAction(formData: FormData): Promise<UploadImageResult> {
  const { user, profile } = await requireRole('admin')

  const file = getUploadFile(formData, 'file')
  if (!file) return { ok: false, error: 'No image file received' }

  const folder = (String(formData.get('folder') ?? 'lesson') as ImageUploadFolder) || 'lesson'
  const levelId = String(formData.get('levelId') ?? 'ha')
  const label = String(formData.get('label') ?? 'image')

  try {
    const uploaded = await uploadImageMedia(file, folder, { levelId, label })

    const db = await createAdminDb()
    const { error: metaError } = await db.from('media_assets').insert({
      bucket: uploaded.bucket,
      storage_path: uploaded.path,
      kind: 'image',
      mime_type: file.type || 'image/jpeg',
      size_bytes: file.size,
      level_id: levelId || null,
      uploaded_by: user.id,
      alt_text: label,
    })
    if (metaError) {
      console.error('[uploadAdminImage] media_assets', metaError.message)
    }

    await writeAudit({
      actorId: user.id,
      actorRole: profile.role,
      action: 'media.image_upload',
      entityType: 'media_asset',
      entityId: uploaded.path,
      metadata: { folder, levelId, label, size: file.size },
    })

    return {
      ok: true,
      path: uploaded.path,
      publicUrl: uploaded.publicUrl,
      bucket: uploaded.bucket,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    }
  }
}

export async function uploadAdminHomeworkFileAction(
  formData: FormData,
): Promise<UploadHomeworkFileResult> {
  const { user, profile } = await requireRole('admin')

  const file = getUploadFile(formData, 'file')
  if (!file) return { ok: false, error: 'No file received' }

  const label = String(formData.get('label') ?? 'homework')

  try {
    const uploaded = await uploadHomeworkAssignmentFile(file, { label })

    const db = await createAdminDb()
    const { error: metaError } = await db.from('media_assets').insert({
      bucket: uploaded.bucket,
      storage_path: uploaded.path,
      kind: file.type.startsWith('image/') ? 'image' : 'document',
      mime_type: file.type || 'application/pdf',
      size_bytes: file.size,
      uploaded_by: user.id,
      alt_text: uploaded.fileName,
    })
    if (metaError) {
      console.error('[uploadAdminHomeworkFile] media_assets', metaError.message)
    }

    await writeAudit({
      actorId: user.id,
      actorRole: profile.role,
      action: 'media.homework_file_upload',
      entityType: 'media_asset',
      entityId: uploaded.path,
      metadata: { label, size: file.size, fileName: uploaded.fileName },
    })

    return {
      ok: true,
      path: uploaded.path,
      publicUrl: uploaded.publicUrl,
      bucket: uploaded.bucket,
      fileName: uploaded.fileName,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    }
  }
}
