import Link from 'next/link'
import { Check, Circle, CircleDashed, Clock, Calendar, Lock, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const CONFIG = {
  not_started: {
    bg: 'bg-cream-200',
    text: 'text-green-700/60',
    icon: Circle,
    label: 'Not started',
  },
  in_progress: {
    bg: 'bg-gold-100',
    text: 'text-gold-800',
    icon: CircleDashed,
    label: 'In progress',
  },
  completed: {
    bg: 'bg-success-50',
    text: 'text-success-500',
    icon: Check,
    label: 'Completed',
  },
  not_booked: {
    bg: 'bg-transparent border border-cream-300',
    text: 'text-green-700/50',
    icon: Calendar,
    label: 'Not booked',
  },
  booked: {
    bg: 'bg-info-50',
    text: 'text-info-500',
    icon: Clock,
    label: 'Session booked',
  },
  locked: {
    bg: 'bg-cream-200',
    text: 'text-green-700/40',
    icon: Lock,
    label: 'Locked',
  },
} as const satisfies Record<
  string,
  { bg: string; text: string; icon: LucideIcon; label: string }
>

export type StatusChipState = keyof typeof CONFIG

export function StatusChip({ state }: { state: StatusChipState }) {
  const conf = CONFIG[state]
  const Icon = conf.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium',
        conf.bg,
        conf.text,
      )}
    >
      <Icon className="size-3.5" strokeWidth={1.75} />
      <span>{conf.label}</span>
    </span>
  )
}

/** Optional link wrapper for chips used as CTAs */
export function StatusChipLink({
  state,
  href,
}: {
  state: StatusChipState
  href: string
}) {
  return (
    <Link href={href as '/'} className="inline-flex">
      <StatusChip state={state} />
    </Link>
  )
}
