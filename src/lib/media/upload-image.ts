import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { LESSON_MEDIA_BUCKET, lessonMediaPublicUrl } from '@/lib/media/urls'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  return 'jpg'
}

export type ImageUploadFolder = 'lesson' | 'dialogue' | 'article' | 'avatar'

export async function uploadImageMedia(
  file: File,
  folder: ImageUploadFolder,
  opts?: { levelId?: string; label?: string },
): Promise<{ path: string; publicUrl: string; bucket: string }> {
  if (!IMAGE_TYPES.has(file.type) && !file.type.startsWith('image/')) {
    throw new Error('Please upload an image (jpeg, png, webp, or gif).')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image must be 5MB or smaller.')
  }

  const level = (opts?.levelId || 'ha').replace(/[^a-z0-9-]/gi, '')
  const label = (opts?.label || 'image').replace(/[^a-z0-9-_]/gi, '').slice(0, 40) || 'image'
  const path = `${folder}/${level}/${label}-${crypto.randomUUID()}.${extensionFor(file)}`

  const admin = createAdminClient()
  const bytes = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage.from(LESSON_MEDIA_BUCKET).upload(path, bytes, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })
  if (error) throw new Error(error.message)

  return {
    path,
    publicUrl: lessonMediaPublicUrl(path)!,
    bucket: LESSON_MEDIA_BUCKET,
  }
}
