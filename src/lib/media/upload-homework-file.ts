import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { LESSON_MEDIA_BUCKET, lessonMediaPublicUrl } from '@/lib/media/urls'

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_BYTES = 20 * 1024 * 1024

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  return 'jpg'
}

/** Admin worksheet / assignment file for homework prompts. */
export async function uploadHomeworkAssignmentFile(
  file: File,
  opts?: { label?: string },
): Promise<{ path: string; publicUrl: string; bucket: string; fileName: string }> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Upload a PDF or image (jpeg, png, webp, gif).')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('File must be 20MB or smaller.')
  }

  const label = (opts?.label || 'homework').replace(/[^a-z0-9-_]/gi, '').slice(0, 40) || 'homework'
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
  const path = `homework/${label}-${crypto.randomUUID()}.${extensionFor(file)}`

  const admin = createAdminClient()
  const bytes = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage.from(LESSON_MEDIA_BUCKET).upload(path, bytes, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (error) throw new Error(error.message)

  return {
    path,
    publicUrl: lessonMediaPublicUrl(path)!,
    bucket: LESSON_MEDIA_BUCKET,
    fileName: safeName || `assignment.${extensionFor(file)}`,
  }
}
