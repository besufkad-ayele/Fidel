import Image from 'next/image'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/constants/brand'

export const FIDEL_LOGO_SRC = '/icons/Fidel_logo.png' as const

type BrandLogoProps = {
  className?: string
  /** Pixel size of the mark */
  size?: number
  showWordmark?: boolean
  priority?: boolean
}

/** Asset has generous empty margins; scale so the circular mark fills the box. */
const MARK_SCALE = 1.45

export function BrandLogo({
  className,
  size = 48,
  showWordmark = true,
  priority = false,
}: BrandLogoProps) {
  const rendered = Math.round(size * MARK_SCALE)

  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <span
        className="relative shrink-0 overflow-hidden rounded-full"
        style={{ width: size, height: size }}
      >
        <Image
          src={FIDEL_LOGO_SRC}
          alt={BRAND.name}
          width={rendered}
          height={rendered}
          className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
          style={{ width: rendered, height: rendered }}
          priority={priority}
        />
      </span>
      {showWordmark ? (
        <span className="font-display text-2xl leading-none text-green-700">{BRAND.name}</span>
      ) : null}
    </span>
  )
}
