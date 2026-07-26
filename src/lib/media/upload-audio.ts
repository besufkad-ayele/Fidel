import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  LESSON_MEDIA_BUCKET,
  VOCAB_AUDIO_BUCKET,
  lessonMediaPublicUrl,
  vocabAudioPublicUrl,
} from '@/lib/media/urls'

const AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/x-m4a',
  'audio/aac',
  'audio/wave',
  'audio/x-wav',
])

const MAX_AUDIO_BYTES = 10 * 1024 * 1024

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName
  if (file.type.includes('webm')) return 'webm'
  if (file.type.includes('mpeg') || file.type.includes('mp3')) return 'mp3'
  if (file.type.includes('wav')) return 'wav'
  if (file.type.includes('ogg')) return 'ogg'
  if (file.type.includes('mp4') || file.type.includes('m4a') || file.type.includes('aac')) {
    return 'm4a'
  }
  return 'webm'
}

export type AudioUploadFolder = 'vocab' | 'lesson' | 'dialogue'

export async function uploadAudioMedia(
  file: File,
  folder: AudioUploadFolder,
  opts?: { levelId?: string; label?: string },
): Promise<{ path: string; publicUrl: string; bucket: string }> {
  if (!AUDIO_TYPES.has(file.type) && !file.type.startsWith('audio/')) {
    throw new Error('Please upload an audio file (mp3, wav, webm, m4a, ogg).')
  }
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error('Audio must be 10MB or smaller.')
  }

  const bucket = folder === 'vocab' ? VOCAB_AUDIO_BUCKET : LESSON_MEDIA_BUCKET
  const level = (opts?.levelId || 'ha').replace(/[^a-z0-9-]/gi, '')
  const label = (opts?.label || 'clip').replace(/[^a-z0-9-_]/gi, '').slice(0, 40) || 'clip'
  const path = `${folder}/${level}/${label}-${crypto.randomUUID()}.${extensionFor(file)}`

  const admin = createAdminClient()
  const bytes = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage.from(bucket).upload(path, bytes, {
    contentType: file.type || 'audio/webm',
    upsert: false,
  })
  if (error) throw new Error(error.message)

  const publicUrl =
    bucket === VOCAB_AUDIO_BUCKET ? vocabAudioPublicUrl(path)! : lessonMediaPublicUrl(path)!

  return { path, publicUrl, bucket }
}

export function getUploadFile(formData: FormData, key: string): File | null {
  const value = formData.get(key)
  if (!(value instanceof File) || value.size === 0) return null
  return value
}
