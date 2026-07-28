'use client'

import { useMemo, useState } from 'react'
import { TimedRecorder } from '@/components/content/interactive/timed-recorder'
import type { z } from 'zod'
import type { homeworkPromptBlockSchema } from '@/lib/validation/content'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Block = z.infer<typeof homeworkPromptBlockSchema>

export function HomeworkSubmission({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const [driveLink, setDriveLink] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const helperText = useMemo(() => {
    const parts: string[] = []
    if (block.allowFiles) parts.push('Upload PDF or image')
    if (block.allowDriveLink) parts.push('or paste Google Drive link')
    return parts.join(' ')
  }, [block.allowDriveLink, block.allowFiles])

  return (
    <div className="space-y-3 rounded-xl border border-gold-300 bg-gold-50 p-5">
      <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">Homework</p>
      <h3 className="font-display text-xl text-green-900">{block.title}</h3>
      <p className="text-sm leading-relaxed text-green-800">{block.instructions}</p>
      <div className="flex flex-wrap gap-2 text-[11px] font-medium text-green-700">
        {block.allowText ? <span className="rounded-full bg-white/70 px-2 py-1">Text</span> : null}
        {block.allowAudio ? (
          <span className="rounded-full bg-white/70 px-2 py-1">
            Audio{block.maxAudioSeconds ? ` ≤ ${block.maxAudioSeconds}s` : ''}
          </span>
        ) : null}
        {block.allowVideo ? (
          <span className="rounded-full bg-white/70 px-2 py-1">
            Video{block.maxVideoSeconds ? ` ≤ ${block.maxVideoSeconds}s` : ''}
          </span>
        ) : null}
        {block.allowFiles ? (
          <span className="rounded-full bg-white/70 px-2 py-1">PDF / Photo</span>
        ) : null}
        {block.allowDriveLink ? (
          <span className="rounded-full bg-white/70 px-2 py-1">Drive link</span>
        ) : null}
      </div>

      {helperText ? <p className="text-xs text-green-700">{helperText}</p> : null}

      {block.allowFiles ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-green-900">Upload PDF or image</label>
          <Input
            type="file"
            accept=".pdf,image/*"
            multiple
            disabled={mode === 'preview'}
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
          {files.length > 0 ? (
            <ul className="space-y-1 text-xs text-green-700">
              {files.map((file) => (
                <li key={`${file.name}-${file.size}`}>• {file.name}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {block.allowDriveLink ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-green-900">Google Drive link</label>
          <Input
            type="url"
            placeholder="https://drive.google.com/..."
            value={driveLink}
            disabled={mode === 'preview'}
            onChange={(e) => setDriveLink(e.target.value)}
          />
        </div>
      ) : null}

      {block.allowAudio ? (
        <TimedRecorder
          kind="audio"
          prompt="Record your homework response"
          maxSeconds={block.maxAudioSeconds ?? 60}
          mode={mode}
        />
      ) : null}
      {block.allowVideo ? (
        <TimedRecorder
          kind="video"
          prompt="Record your video practice"
          maxSeconds={block.maxVideoSeconds ?? 60}
          mode={mode}
        />
      ) : null}

      <div className="pt-1">
        <Button type="button" size="sm" disabled={mode === 'preview'}>
          Submit homework
        </Button>
      </div>
    </div>
  )
}
