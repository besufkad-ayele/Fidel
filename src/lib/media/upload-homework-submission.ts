import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { LESSON_MEDIA_BUCKET } from '@/lib/media/urls'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_FILE_BYTES = 40 * 1024 * 1024

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/x-m4a',
  'audio/aac',
])
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'])

function extensionFor(file: File, fallback: string) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  if (file.type.startsWith('audio/')) return 'webm'
  if (file.type.startsWith('video/')) return 'webm'
  return fallback
}

async function uploadBytes(
  path: string,
  file: File,
): Promise<string> {
  const admin = createAdminClient()
  const bytes = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage.from(LESSON_MEDIA_BUCKET).upload(path, bytes, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return path
}

/** Student answer files for a homework submission (private path under lesson-media). */
export async function uploadHomeworkSubmissionFile(
  file: File,
  opts: {
    studentId: string
    assignmentId: string
    kind: 'image' | 'pdf' | 'audio' | 'video'
  },
): Promise<string> {
  if (opts.kind === 'image') {
    if (!IMAGE_TYPES.has(file.type)) throw new Error('Upload a jpeg, png, webp, or gif image.')
    if (file.size > MAX_IMAGE_BYTES) throw new Error('Image must be 5MB or smaller.')
  } else if (opts.kind === 'pdf') {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Upload a PDF file.')
    }
    if (file.size > MAX_FILE_BYTES) throw new Error('PDF must be 40MB or smaller.')
  } else if (opts.kind === 'audio') {
    if (file.type && !AUDIO_TYPES.has(file.type) && !file.type.startsWith('audio/')) {
      throw new Error('Upload an audio file.')
    }
    if (file.size > MAX_FILE_BYTES) throw new Error('Audio must be 40MB or smaller.')
  } else {
    if (file.type && !VIDEO_TYPES.has(file.type) && !file.type.startsWith('video/')) {
      throw new Error('Upload a video file.')
    }
    if (file.size > MAX_FILE_BYTES) throw new Error('Video must be 40MB or smaller.')
  }

  const ext = extensionFor(
    file,
    opts.kind === 'image' ? 'jpg' : opts.kind === 'pdf' ? 'pdf' : opts.kind === 'audio' ? 'webm' : 'webm',
  )
  const path = `homework-submissions/${opts.studentId}/${opts.assignmentId}/${opts.kind}-${crypto.randomUUID()}.${ext}`
  return uploadBytes(path, file)
}
