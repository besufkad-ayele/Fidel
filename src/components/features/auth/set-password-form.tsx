'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setPassword } from '@/lib/actions/auth'

type SetPasswordFormProps = {
  mode?: 'activate' | 'reset'
}

export function SetPasswordForm({ mode = 'activate' }: SetPasswordFormProps) {
  const t = useTranslations('auth.setPassword')
  const tLogin = useTranslations('auth.login')
  const [pending, startTransition] = useTransition()
  const [password, setPasswordValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)

        if (password.length < 8) {
          setError(t('tooShort'))
          return
        }
        if (password !== confirm) {
          setError(t('mismatch'))
          return
        }

        startTransition(async () => {
          try {
            const result = await setPassword({ password, confirm, mode })
            if (result && !result.ok) {
              const message =
                result.error === 'noSession'
                  ? t('noSession')
                  : result.error === 'mismatch'
                    ? t('mismatch')
                    : result.error === 'tooShort'
                      ? t('tooShort')
                      : t('failed')
              setError(message)
              toast.error(message)
            }
          } catch {
            // redirect() from the server action throws — Next.js handles navigation
          }
        })
      }}
    >
      {error ? (
        <div className="rounded-md border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-500">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="password">{t('passwordLabel')}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-green-700"
            aria-label={showPassword ? tLogin('hidePassword') : tLogin('showPassword')}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{t('hint')}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">{t('confirmLabel')}</Label>
        <div className="relative">
          <Input
            id="confirm"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-green-700"
            aria-label={showConfirm ? tLogin('hidePassword') : tLogin('showPassword')}
            aria-pressed={showConfirm}
          >
            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-green-700 hover:bg-green-600"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? '…' : mode === 'reset' ? t('submitReset') : t('submit')}
      </Button>
    </form>
  )
}
