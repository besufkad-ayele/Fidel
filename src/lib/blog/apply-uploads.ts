import type { BlogBlock } from '@/lib/blog/blocks'
import { getUploadFile, getUploadFiles, uploadBlogMedia } from '@/lib/blog/upload'

/** Apply cover + per-block file uploads onto parsed blog fields. */
export async function applyBlogUploads<
  T extends {
    coverPath: string | null
    blocks: BlogBlock[]
    videoUrl: string | null
    videoPath: string | null
    videoCaption: string | null
    gallery: { path: string; alt?: string; caption?: string }[]
    referenceLinks: { title: string; url?: string; note?: string }[]
    bodyMd: string
  },
>(fields: T, formData: FormData): Promise<T> {
  const coverFile = getUploadFile(formData, 'coverFile')
  if (coverFile) fields.coverPath = await uploadBlogMedia(coverFile, 'covers')

  const nextBlocks: BlogBlock[] = []
  for (const block of fields.blocks) {
    if (block.type === 'image') {
      const file = getUploadFile(formData, `file_${block.id}`)
      if (file) {
        nextBlocks.push({
          ...block,
          path: await uploadBlogMedia(file, 'gallery'),
        })
        continue
      }
    }

    if (block.type === 'video') {
      const file = getUploadFile(formData, `file_${block.id}`)
      if (file) {
        nextBlocks.push({
          ...block,
          path: await uploadBlogMedia(file, 'videos'),
        })
        continue
      }
    }

    if (block.type === 'gallery') {
      const files = getUploadFiles(formData, `galleryFiles_${block.id}`)
      const uploaded = []
      for (const file of files) {
        uploaded.push({ path: await uploadBlogMedia(file, 'gallery') })
      }
      nextBlocks.push({
        ...block,
        items: [...block.items, ...uploaded],
      })
      continue
    }

    nextBlocks.push(block)
  }

  fields.blocks = nextBlocks

  const firstVideo = nextBlocks.find((b) => b.type === 'video')
  const firstGallery = nextBlocks.find((b) => b.type === 'gallery')
  const firstRefs = nextBlocks.find((b) => b.type === 'references')

  fields.videoUrl = firstVideo?.type === 'video' ? firstVideo.url || null : null
  fields.videoPath = firstVideo?.type === 'video' ? firstVideo.path || null : null
  fields.videoCaption = firstVideo?.type === 'video' ? firstVideo.caption || null : null
  fields.gallery = firstGallery?.type === 'gallery' ? firstGallery.items : []
  fields.referenceLinks = firstRefs?.type === 'references' ? firstRefs.items : []

  return fields
}
