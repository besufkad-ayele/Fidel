import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LoginForm } from '@/components/features/auth/login-form'
import { AmharicText } from '@/components/shared/amharic-text'

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
        <AmharicText size="xl" className="text-gold-500">
          ፊደል
        </AmharicText>
      </div>
      <h1 className="font-display text-3xl text-green-700">{t('title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
      <div className="mt-8">
        <LoginForm next={next} error={error} />
      </div>
    </div>
  )
}
