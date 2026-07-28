'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { ImageIcon, Upload, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { uploadAdminImageAction } from '@/app/(admin)/admin/media-upload-actions'
import { lessonMediaPublicUrl } from '@/lib/media/urls'
import { cn } from '@/lib/utils'

type AdminImageFieldProps = {
  label: string
  folder?: 'lesson' | 'dialogue' | 'article' | 'avatar'
  levelId?: string
  clipLabel?: string
  className?: string
  value?: string
  onChange?: (pathOrUrl: string) => void
  /** Round avatar preview for dialogue speakers */
  avatar?: boolean
}

export function AdminImageField({
  label,
  folder = 'lesson',
  levelId = 'ha',
  clipLabel = 'image',
  className,
  value = '',
  onChange,
  avatar = false,
}: AdminImageFieldProps) {
  const [stored, setStored] = useState(value ?? '')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setStored(value ?? '')
  }, [value])

  const playable = lessonMediaPublicUrl(stored)

  function commit(next: string) {
    setStored(next)
    onChange?.(next)
  }

  function uploadFile(file: File) {
    setError(null)
    const fd = new FormData()
    fd.set('file', file)
    fd.set('folder', folder)
    fd.set('levelId', levelId)
    fd.set('label', clipLabel)

    startTransition(async () => {
      const result = await uploadAdminImageAction(fd)
      if (!result.ok) {
        setError(result.error)
        return
      }
      commit(result.path)
    })
  }

  return (
    <div className={cn('space-y-2 rounded-lg border border-cream-300 bg-cream-50 p-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="inline-flex items-center gap-1.5">
          <ImageIcon className="size-3.5 text-green-700" />
          {label}
        </Label>
        {stored ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-danger-500"
            onClick={() => commit('')}
          >
            <Trash2 className="size-3" />
            Clear
          </button>
        ) : null}
      </div>

      {playable ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={playable}
          alt=""
          className={cn(
            'border border-cream-300 object-cover',
            avatar ? 'size-16 rounded-full' : 'max-h-40 w-full rounded-lg',
          )}
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          Optional — upload an image or paste a direct image URL.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            uploadFile(file)
            e.target.value = ''
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => fileInputRef.current?.click()}
        >
          {pending ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <Upload className="mr-1.5 size-3.5" />
          )}
          Upload
        </Button>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Or image link</Label>
        <Input
          className="mt-1.5"
          placeholder="https://…/photo.jpg"
          value={stored}
          onChange={(e) => commit(e.target.value)}
        />
      </div>

      {error ? <p className="text-xs text-danger-500">{error}</p> : null}
      {pending ? <p className="text-xs text-green-600">Uploading…</p> : null}
    </div>
  )
}
