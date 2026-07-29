'use client'

import { Children, cloneElement, isValidElement, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ConfirmFormProps = {
  action: () => Promise<void>
  message: string
  children?: React.ReactNode
  label?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm'
  className?: string
  disabled?: boolean
}

/** Client wrapper that confirms before calling a bound server action. */
export function ConfirmForm({
  action,
  message,
  children,
  label = 'Delete',
  variant = 'destructive',
  size = 'sm',
  className,
  disabled,
}: ConfirmFormProps) {
  const [pending, startTransition] = useTransition()

  const childButtons = children
    ? Children.map(children, (child) => {
        if (!isValidElement<{ disabled?: boolean; children?: React.ReactNode }>(child)) return child
        const prevDisabled = Boolean(child.props.disabled)
        const labelNode = child.props.children
        return cloneElement(child, {
          disabled: disabled || pending || prevDisabled,
          children: pending ? 'Working…' : labelNode,
        })
      })
    : null

  return (
    <form
      className={cn(className)}
      action={() => {
        if (!window.confirm(message)) return
        startTransition(async () => {
          await action()
        })
      }}
    >
      {childButtons ?? (
        <Button type="submit" variant={variant} size={size} disabled={disabled || pending}>
          {pending ? 'Working…' : label}
        </Button>
      )}
    </form>
  )
}
