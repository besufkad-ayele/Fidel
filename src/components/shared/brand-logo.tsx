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

export function BrandLogo({
  className,
  size = 48,
  showWordmark = true,
  priority = false,
}: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <Image
        src={FIDEL_LOGO_SRC}
        alt={BRAND.name}
        width={size}
        height={size}
        className="h-auto w-auto object-contain"
        style={{ width: size, height: size }}
        priority={priority}
      />
      {showWordmark ? (
        <span className="font-display text-2xl leading-none text-green-700">{BRAND.name}</span>
      ) : null}
    </span>
  )
}
