'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { completeUnitPartAction } from '@/lib/actions/progress'
import { cn } from '@/lib/utils'

type Props = {
  unitId: string
  part: 'cultural_insight' | 'language_lesson' | 'practice'
  levelSlug: string
  unitSlug: string
  alreadyComplete?: boolean
  label?: string
  className?: string
}

export function CompletePartButton({
  unitId,
  part,
  levelSlug,
  unitSlug,
  alreadyComplete = false,
  label = 'Mark practice complete',
  className,
}: Props) {
  const [done, setDone] = useState(alreadyComplete)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await completeUnitPartAction(formData)
        setDone(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save progress')
      }
    })
  }

  return (
    <div className={cn('flex flex-col items-end gap-1', className)}>
      <form action={onSubmit} className="flex items-center gap-2">
        <input type="hidden" name="unitId" value={unitId} />
        <input type="hidden" name="part" value={part} />
        <input type="hidden" name="levelSlug" value={levelSlug} />
        <input type="hidden" name="unitSlug" value={unitSlug} />
        {done ? (
          <Button type="button" disabled variant="outline" className="gap-2">
            <CheckCircle2 className="size-4 text-success-500" />
            Completed
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={pending}
            className="bg-gold-500 text-green-950 hover:bg-gold-600"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {pending ? 'Saving…' : label}
          </Button>
        )}
      </form>
      {error ? <p className="max-w-xs text-right text-xs text-danger-500">{error}</p> : null}
    </div>
  )
}
