'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/lib/actions/auth'
import { routes } from '@/lib/auth/routes'

export function ForgotPasswordForm() {
  const t = useTranslations('auth')
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-success-500/30 bg-success-50 px-3 py-3 text-sm text-success-500">
          {t('forgot.sent')}
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href={routes.login}>{t('login.submit')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        startTransition(async () => {
          const result = await requestPasswordReset({ email })
          if (!result.ok) {
            toast.error(t('errors.validation'))
            return
          }
          setSent(true)
        })
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">{t('login.emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-green-700 hover:bg-green-600"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? '…' : t('forgot.submit')}
      </Button>
      <Button asChild variant="ghost" className="w-full">
        <Link href={routes.login}>Back to sign in</Link>
      </Button>
    </form>
  )
}
