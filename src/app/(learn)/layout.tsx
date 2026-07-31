import { getTranslations } from 'next-intl/server'
import { AppShell, type AppNavItem } from '@/components/layout/app-shell'
import { requireRole } from '@/lib/auth/guards'

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole('student')

  const t = await getTranslations('nav')

  const nav: AppNavItem[] = [
    { href: '/dashboard', label: t('dashboard'), icon: 'dashboard' },
    { href: '/levels', label: t('levels'), icon: 'levels' },
    { href: '/vocabulary', label: t('vocabulary'), icon: 'vocabulary' },
    { href: '/sessions', label: t('sessions'), icon: 'sessions' },
    { href: '/homework', label: t('homework'), icon: 'homework' },
    { href: '/progress', label: t('progress'), icon: 'progress' },
    { href: '/certificates', label: t('certificates'), icon: 'certificates' },
    { href: '/account', label: t('account'), icon: 'account' },
  ]

  return (
    <AppShell profile={profile} nav={nav} brandHref="/dashboard" roleLabel={t('learner')}>
      {children}
    </AppShell>
  )
}
