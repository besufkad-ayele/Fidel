'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { z } from 'zod'
import type { comprehensionCheckBlockSchema } from '@/lib/validation/content'
import { cn } from '@/lib/utils'

type Block = z.infer<typeof comprehensionCheckBlockSchema>

export function ComprehensionCheck({
  block,
  mode = 'student',
}: {
  block: Block
  mode?: 'student' | 'preview'
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="space-y-3 rounded-xl border border-cream-300 bg-cream-50 p-5">
      <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
        Comprehension check
      </p>
      <p className="font-medium text-green-900">{block.question}</p>
      <div className="space-y-2">
        {block.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            className={cn(
              'w-full rounded-lg border px-3 py-2.5 text-left text-sm',
              selected === i ? 'border-gold-500 bg-gold-50' : 'border-cream-300 bg-white',
              revealed && i === block.correctIndex && 'border-green-600 bg-green-50',
              revealed && selected === i && i !== block.correctIndex && 'border-danger-400 bg-danger-50',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        disabled={selected === null}
        onClick={() => setRevealed(true)}
      >
        Check
      </Button>
      {revealed ? (
        <p className="text-sm text-green-800">
          {selected === block.correctIndex ? 'Nice — that is correct.' : 'Review the section above and try again.'}
          {block.explanation ? ` ${block.explanation}` : ''}
          {mode === 'preview' ? ' (preview)' : ''}
        </p>
      ) : null}
    </div>
  )
}
