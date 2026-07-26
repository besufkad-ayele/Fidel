import { publicEnv } from '@/lib/env'

export const VOCAB_AUDIO_BUCKET = 'vocab-audio'
export const LESSON_MEDIA_BUCKET = 'lesson-media'

/** Resolve a stored path or absolute URL into a browser-playable URL. */
export function mediaPublicUrl(
  bucket: string,
  path: string | null | undefined,
): string | null {
  if (!path) return null
  if (/^(https?:|blob:|data:)/i.test(path)) return path
  const base = publicEnv.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')
  const clean = path.replace(/^\//, '')
  return `${base}/storage/v1/object/public/${bucket}/${clean}`
}

export function vocabAudioPublicUrl(path: string | null | undefined) {
  return mediaPublicUrl(VOCAB_AUDIO_BUCKET, path)
}

export function lessonMediaPublicUrl(path: string | null | undefined) {
  return mediaPublicUrl(LESSON_MEDIA_BUCKET, path)
}
