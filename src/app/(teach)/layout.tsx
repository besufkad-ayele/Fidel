import { getTranslations } from 'next-intl/server'
import { AppShell, type AppNavItem } from '@/components/layout/app-shell'
import { requireRole } from '@/lib/auth/guards'

export default async function TeachLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole('teacher')
  const t = await getTranslations('nav')

  const nav: AppNavItem[] = [
    { href: '/teach', label: t('today'), icon: 'today' },
    { href: '/teach/schedule', label: t('schedule'), icon: 'schedule' },
    { href: '/teach/students', label: t('students'), icon: 'students' },
    { href: '/teach/homework', label: t('homework'), icon: 'homework' },
    { href: '/teach/availability', label: t('availability'), icon: 'availability' },
    { href: '/teach/settings', label: t('settings'), icon: 'settings' },
  ]

  return (
    <AppShell profile={profile} nav={nav} brandHref="/teach" roleLabel={t('teacher')}>
      {children}
    </AppShell>
  )
}
