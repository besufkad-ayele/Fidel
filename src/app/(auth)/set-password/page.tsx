import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SetPasswordForm } from '@/components/features/auth/set-password-form'
import { BrandLogo } from '@/components/shared/brand-logo'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { routes } from '@/lib/auth/routes'

export const metadata: Metadata = {
  title: 'Set password',
}

export default async function SetPasswordPage() {
  const t = await getTranslations('auth.setPassword')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div>
      <div className="mb-8 lg:hidden">
        <Link href={routes.home} aria-label="Back to Fidel home">
          <BrandLogo size={56} priority />
        </Link>
      </div>
      <h1 className="font-display text-3xl text-green-700">{t('title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>

      {!user ? (
        <div className="mt-8 space-y-4 rounded-xl border border-warning-500/30 bg-warning-50 p-5">
          <p className="text-sm text-warning-500">{t('noSession')}</p>
          <p className="text-sm text-muted-foreground">{t('noSessionHint')}</p>
          <Link
            href={routes.login}
            className="inline-block text-sm font-medium text-green-700 hover:underline"
          >
            {t('goLogin')}
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <p className="mb-4 text-sm text-muted-foreground">
            {t('signedInAs')} <span className="font-medium text-green-700">{user.email}</span>
          </p>
          <SetPasswordForm mode="activate" />
        </div>
      )}
    </div>
  )
}
