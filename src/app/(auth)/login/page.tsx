import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { LoginForm } from '@/components/features/auth/login-form'
import { BrandLogo } from '@/components/shared/brand-logo'
import { routes } from '@/lib/auth/routes'

export const metadata: Metadata = {
  title: 'Sign in',
}

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const t = await getTranslations('auth.login')
  const { next, error } = await searchParams

  return (
    <div>
      <div className="mb-8 lg:hidden">
        <Link href={routes.home} aria-label="Back to Fidel home">
          <BrandLogo size={56} priority />
        </Link>
      </div>
      <h1 className="font-display text-3xl text-green-700">{t('title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
      <div className="mt-8">
        <LoginForm next={next} error={error} />
      </div>
    </div>
  )
}
