import { cn } from '@/lib/utils'

const sizeClass = {
  hero: 'text-am-hero',
  display: 'text-am-display',
  xl: 'text-am-xl',
  lg: 'text-am-lg',
  md: 'text-am-md',
  sm: 'text-am-sm',
} as const

type AmharicSize = keyof typeof sizeClass

type AmharicTextProps = {
  children: React.ReactNode
  size?: AmharicSize
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div'
  className?: string
}

/**
 * Every Amharic glyph in the product goes through this component.
 * Applies Noto Sans Ethiopic, lang="am", and the compensated Amharic type scale.
 */
export function AmharicText({
  children,
  size = 'md',
  as: Tag = 'span',
  className,
}: AmharicTextProps) {
  return (
    <Tag lang="am" className={cn('font-ethiopic', sizeClass[size], className)}>
      {children}
    </Tag>
  )
}
