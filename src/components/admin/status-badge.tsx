import {
  CircleCheck,
  CircleDashed,
  Circle,
  Clock3,
  Ban,
  Archive,
  Shield,
  GraduationCap,
  UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const config: Record<
  string,
  { className: string; icon: typeof Circle; label?: string }
> = {
  active: {
    className: 'border-success-500/25 bg-success-50 text-success-500',
    icon: CircleCheck,
  },
  published: {
    className: 'border-success-500/25 bg-success-50 text-success-500',
    icon: CircleCheck,
  },
  paid: {
    className: 'border-success-500/25 bg-success-50 text-success-500',
    icon: CircleCheck,
  },
  issued: {
    className: 'border-success-500/25 bg-success-50 text-success-500',
    icon: CircleCheck,
  },
  completed: {
    className: 'border-success-500/25 bg-success-50 text-success-500',
    icon: CircleCheck,
  },
  pending: {
    className: 'border-warning-500/25 bg-warning-50 text-warning-500',
    icon: Clock3,
  },
  partial: {
    className: 'border-warning-500/25 bg-warning-50 text-warning-500',
    icon: CircleDashed,
  },
  draft: {
    className: 'border-cream-400 bg-cream-100 text-muted-foreground',
    icon: Circle,
  },
  coming_soon: {
    className: 'border-cream-400 bg-cream-100 text-muted-foreground',
    icon: Circle,
  },
  in_review: {
    className: 'border-info-500/25 bg-info-50 text-info-500',
    icon: CircleDashed,
  },
  scheduled: {
    className: 'border-info-500/25 bg-info-50 text-info-500',
    icon: Clock3,
  },
  suspended: {
    className: 'border-danger-500/25 bg-danger-50 text-danger-500',
    icon: Ban,
  },
  expired: {
    className: 'border-danger-500/25 bg-danger-50 text-danger-500',
    icon: Ban,
  },
  revoked: {
    className: 'border-danger-500/25 bg-danger-50 text-danger-500',
    icon: Ban,
  },
  cancelled: {
    className: 'border-danger-500/25 bg-danger-50 text-danger-500',
    icon: Ban,
  },
  submitted: {
    className: 'border-warning-500/25 bg-warning-50 text-warning-500',
    icon: Clock3,
    label: 'Awaiting assessment',
  },
  reviewed: {
    className: 'border-success-500/25 bg-success-50 text-success-500',
    icon: CircleCheck,
    label: 'Reviewed',
  },
  needs_resubmission: {
    className: 'border-warning-500/25 bg-warning-50 text-warning-500',
    icon: CircleDashed,
    label: 'Needs resubmission',
  },
  archived: {
    className: 'border-cream-400 bg-cream-100 text-muted-foreground',
    icon: Archive,
  },
  student: {
    className: 'border-green-200 bg-green-50 text-green-700',
    icon: GraduationCap,
  },
  teacher: {
    className: 'border-gold-300 bg-gold-50 text-gold-700',
    icon: UserRound,
  },
  admin: {
    className: 'border-green-700/20 bg-green-700 text-cream-50',
    icon: Shield,
  },
}

type StatusBadgeProps = {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/\s+/g, '_')
  const meta = config[key] ?? {
    className: 'border-cream-300 bg-cream-50 text-muted-foreground',
    icon: Circle,
  }
  const Icon = meta.icon
  const label = meta.label ?? status.replace(/_/g, ' ')

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-xs font-medium capitalize',
        meta.className,
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={2} />
      {label}
    </span>
  )
}
