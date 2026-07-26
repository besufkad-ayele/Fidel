import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { BLOG_BUCKET } from '@/lib/blog/media'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'video/mp4') return 'mp4'
  if (file.type === 'video/webm') return 'webm'
  return 'bin'
}

export async function uploadBlogMedia(
  file: File,
  folder: 'covers' | 'gallery' | 'videos',
): Promise<string> {
  const isImage = IMAGE_TYPES.has(file.type)
  const isVideo = VIDEO_TYPES.has(file.type)

  if (folder === 'videos') {
    if (!isVideo) throw new Error('Video must be MP4 or WebM')
    if (file.size > MAX_VIDEO_BYTES) throw new Error('Video must be 50MB or smaller')
  } else {
    if (!isImage) throw new Error('Image must be JPEG, PNG, or WebP')
    if (file.size > MAX_IMAGE_BYTES) throw new Error('Image must be 10MB or smaller')
  }

  const path = `${folder}/${crypto.randomUUID()}.${extensionFor(file)}`
  const admin = createAdminClient()
  const bytes = Buffer.from(await file.arrayBuffer())
  const { error } = await admin.storage.from(BLOG_BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return path
}

export function getUploadFile(formData: FormData, key: string): File | null {
  const value = formData.get(key)
  if (!(value instanceof File) || value.size === 0) return null
  return value
}

export function getUploadFiles(formData: FormData, key: string): File[] {
  return formData
    .getAll(key)
    .filter((v): v is File => v instanceof File && v.size > 0)
}
