import { cn } from '@/lib/utils'

type ProgressRingProps = {
  value: number
  size?: 40 | 56 | 80
  className?: string
  label?: string
}

const stroke = 4

export function ProgressRing({ value, size = 56, className, label }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-cream-300"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-gold-500 transition-[stroke-dashoffset] duration-400 ease-brand"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-green-700 tabular-nums">{clamped}%</span>
    </div>
  )
}
