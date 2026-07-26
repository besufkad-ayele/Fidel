import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  Building2,
  UsersRound,
  KeyRound,
  Wallet,
  Layers,
  BookOpen,
  ImageIcon,
  ClipboardList,
  CalendarDays,
  Award,
  Newspaper,
  ScrollText,
} from 'lucide-react'
import type { AdminNavGroup } from '@/components/admin/admin-nav'

export type AdminNavItemWithIcon = {
  href: string
  label: string
  icon: LucideIcon
}

export type AdminNavGroupWithIcons = {
  label: string
  items: AdminNavItemWithIcon[]
}

export const adminNavGroups: AdminNavGroupWithIcons[] = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'People & access',
    items: [
      { href: '/admin/people', label: 'People', icon: Users },
      { href: '/admin/organizations', label: 'Organizations', icon: Building2 },
      { href: '/admin/cohorts', label: 'Cohorts', icon: UsersRound },
      { href: '/admin/entitlements', label: 'Entitlements', icon: KeyRound },
      { href: '/admin/payments', label: 'Payments', icon: Wallet },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/levels', label: 'Levels', icon: Layers },
      { href: '/admin/vocabulary', label: 'Vocabulary', icon: BookOpen },
      { href: '/admin/homework', label: 'Homework', icon: ClipboardList },
      { href: '/admin/media', label: 'Media', icon: ImageIcon },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/sessions', label: 'Sessions', icon: CalendarDays },
      { href: '/admin/certificates', label: 'Certificates', icon: Award },
      { href: '/admin/blog', label: 'Blog', icon: Newspaper },
      { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
    ],
  },
]

/** Strip icons for any consumer that only needs href/label. */
export function toPlainNavGroups(groups: AdminNavGroupWithIcons[] = adminNavGroups): AdminNavGroup[] {
  return groups.map((g) => ({
    label: g.label,
    items: g.items.map(({ href, label }) => ({ href, label })),
  }))
}

export function initialsFromName(name: string | null | undefined, email?: string | null) {
  const source = (name || email || '?').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}
