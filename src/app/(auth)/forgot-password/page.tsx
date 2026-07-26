import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ForgotPasswordForm } from '@/components/features/auth/forgot-password-form'

export const metadata: Metadata = {
  title: 'Forgot password',
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations('auth.forgot')

  return (
    <div>
      <h1 className="font-display text-3xl text-green-700">{t('title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
