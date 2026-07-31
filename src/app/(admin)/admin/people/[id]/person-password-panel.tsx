'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  generatePersonPasswordAction,
  setPersonPasswordAction,
} from '@/app/(admin)/admin/manage-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  personId: string
  email: string
  hasPendingResetRequest?: boolean
}

export function PersonPasswordPanel({
  personId,
  email,
  hasPendingResetRequest = false,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  function copy(value: string, label: string) {
    void navigator.clipboard.writeText(value).then(
      () => toast.success(`${label} copied`),
      () => toast.error('Could not copy — select the text manually'),
    )
  }

  return (
    <div className="space-y-6">
      {hasPendingResetRequest ? (
        <div className="rounded-lg border border-gold-400 bg-gold-50 px-3 py-3 text-sm text-green-900">
          This person requested a password reset. Set or generate a new password below, then share
          the credentials with them out of band.
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Learners request resets from the login page (“Forgot your password?”). Those requests
          appear under Notifications. Here you can set a new password for {email} when fulfilling a
          request.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (
              !window.confirm(
                `Generate a new temporary password for ${email}? Their current password will stop working.`,
              )
            ) {
              return
            }
            startTransition(async () => {
              const result = await generatePersonPasswordAction(personId)
              if (!result.ok) {
                toast.error(result.error)
                return
              }
              setTempPassword(result.password)
              toast.success('Temporary password generated — copy it now; it will not be shown again')
            })
          }}
        >
          {pending ? 'Working…' : 'Generate temporary password'}
        </Button>

        {tempPassword ? (
          <div className="rounded-lg border border-cream-300 bg-cream-100 p-3">
            <p className="text-xs font-medium text-green-800">Temporary password (shown once)</p>
            <code className="mt-2 block break-all text-sm font-medium text-green-900">
              {tempPassword}
            </code>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={() => copy(tempPassword, 'Password')}
            >
              Copy password
            </Button>
          </div>
        ) : null}
      </div>

      <div className="border-t border-cream-300 pt-6">
        <p className="mb-3 text-sm font-medium text-green-800">Or set a password manually</p>
        <form action={setPersonPasswordAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={personId} />
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              className="mt-1.5"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="mt-1.5"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" variant="outline">
              Update password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
