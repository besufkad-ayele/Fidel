import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { initialsFromName } from '@/lib/admin/nav'
import { cn } from '@/lib/utils'

type PersonAvatarProps = {
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'size-8 text-[10px]',
  md: 'size-10 text-xs',
  lg: 'size-12 text-sm',
} as const

export function PersonAvatar({
  name,
  email,
  avatarUrl,
  size = 'md',
  className,
}: PersonAvatarProps) {
  return (
    <Avatar className={cn(sizes[size], 'ring-1 ring-cream-300', className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
      <AvatarFallback className="bg-green-100 font-semibold text-green-700">
        {initialsFromName(name, email)}
      </AvatarFallback>
    </Avatar>
  )
}
