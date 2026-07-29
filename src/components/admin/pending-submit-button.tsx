'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import type { ComponentProps } from 'react'

type PendingSubmitButtonProps = Omit<ComponentProps<typeof Button>, 'type'> & {
  pendingLabel?: string
}

/** Submit button that shows pending state for native `action={serverAction}` forms. */
export function PendingSubmitButton({
  children,
  pendingLabel = 'Working…',
  disabled,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={disabled || pending} aria-busy={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  )
}
