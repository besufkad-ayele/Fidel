import { AmharicText } from '@/components/shared/amharic-text'
import { LEVELS, type LevelId } from '@/lib/constants/brand'
import { cn } from '@/lib/utils'

const sizeMap = {
  sm: { char: 'sm' as const, charClass: 'text-xl', showCefr: false },
  md: { char: 'md' as const, charClass: 'text-[2rem]', showCefr: true },
  lg: { char: 'lg' as const, charClass: 'text-[3.5rem]', showCefr: true },
  xl: { char: 'xl' as const, charClass: 'text-[5.5rem]', showCefr: true },
}

type FidelBadgeProps = {
  level: LevelId
  size?: keyof typeof sizeMap
  className?: string
  dark?: boolean
}

export function FidelBadge({ level, size = 'md', className, dark = false }: FidelBadgeProps) {
  const meta = LEVELS.find((l) => l.id === level)
  if (!meta) return null

  const config = sizeMap[size]

  return (
    <span className={cn('inline-flex flex-col items-center gap-1', className)}>
      <AmharicText
        size={config.char === 'sm' ? 'sm' : config.char === 'md' ? 'md' : config.char === 'lg' ? 'lg' : 'hero'}
        className={cn('fidel-char leading-none', config.charClass)}
      >
        {meta.fidel}
      </AmharicText>
      {config.showCefr && (
        <span
          className={cn(
            'text-xs font-semibold uppercase tracking-[0.14em]',
            dark ? 'text-cream-100/70' : 'text-muted-foreground',
          )}
        >
          {meta.cefr}
        </span>
      )}
    </span>
  )
}
