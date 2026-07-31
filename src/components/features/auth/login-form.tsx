'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn } from '@/lib/actions/auth'
import { routes } from '@/lib/auth/routes'
import { publicEnv } from '@/lib/env'

type LoginFormProps = {
  next?: string
  error?: string
}

export function LoginForm({ next, error }: LoginFormProps) {
  const t = useTranslations('auth')
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const requestUrl = publicEnv.NEXT_PUBLIC_REQUEST_ACCESS_URL

  const banner =
    error === 'inactive'
      ? t('errors.inactive')
      : error === 'no_account'
        ? t('errors.noAccount')
        : error === 'session_expired'
          ? t('errors.sessionExpired')
          : null

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        startTransition(async () => {
          try {
            const result = await signIn({ email, password, next })
            if (result && !result.ok) {
              toast.error(t(`errors.${result.error}` as 'errors.invalidCredentials'))
            }
          } catch {
            // redirect() from the server action throws — Next.js handles navigation
          }
        })
      }}
    >
      {banner ? (
        <div className="rounded-md border border-warning-500/30 bg-warning-50 px-3 py-2 text-sm text-warning-500">
          {banner}
        </div>
      ) : null}

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t('login.passwordLabel')}</Label>
          <Link
            href={routes.forgotPassword}
            className="text-xs font-medium text-gold-700 hover:text-gold-800"
          >
            {t('login.forgot')}
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-green-700"
            aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-green-700 hover:bg-green-600"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? '…' : t('login.submit')}
      </Button>

      <div className="rounded-md border border-cream-300 bg-cream-50 px-3 py-3 text-sm">
        <p className="font-medium text-green-700">{t('login.noAccountTitle')}</p>
        <p className="mt-1 text-muted-foreground">{t('login.noAccountBody')}</p>
        {requestUrl ? (
          <a
            href={requestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-gold-700 hover:text-gold-800"
          >
            Request access →
          </a>
        ) : null}
      </div>
    </form>
  )
}
