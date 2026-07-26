'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createAdminAction } from '@/app/(admin)/admin/actions'
import { ADMIN_TITLES, TIMEZONES } from '@/lib/admin/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export function AdminForm() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [setupLink, setSetupLink] = useState<string | null>(null)
  const [createdWithPassword, setCreatedWithPassword] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [adminTitle, setAdminTitle] = useState('program_coordinator')
  const [timezone, setTimezone] = useState('Africa/Addis_Ababa')
  const [sendInvite, setSendInvite] = useState(true)
  const [confirmSuperAdmin, setConfirmSuperAdmin] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    startTransition(async () => {
      const result = await createAdminAction({
        fullName,
        email,
        password: password || undefined,
        adminTitle,
        timezone,
        sendInvite: password ? false : sendInvite,
        confirmSuperAdmin,
      })
      if (!result.ok) {
        setError(result.error ?? 'Failed')
        return
      }
      setCreatedId(result.id ?? null)
      setSetupLink(result.setupLink ?? null)
      setCreatedWithPassword(Boolean(password))
    })
  }

  if (createdId) {
    return (
      <div className="rounded-xl border border-success-500/30 bg-success-50 p-6">
        <h2 className="font-display text-2xl text-green-700">Admin created</h2>
        <ul className="mt-4 space-y-2 text-sm text-green-800">
          {createdWithPassword ? (
            <>
              <li>Account is active — they can sign in with the password you set.</li>
              <li>
                Login: <span className="font-medium">{email}</span>
              </li>
            </>
          ) : (
            <li>Invite sent — status stays pending until they set a password.</li>
          )}
        </ul>
        {setupLink ? <code className="mt-4 block break-all text-xs">{setupLink}</code> : null}
        <Button asChild className="mt-4">
          <Link href={`/admin/people/${createdId}` as '/'}>View profile</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
      <div>
        <Label>Full name</Label>
        <Input className="mt-1.5" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div>
        <Label>Email</Label>
        <Input className="mt-1.5" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Password (optional)</Label>
          <Input
            className="mt-1.5"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Set a password to create an active admin who can sign in immediately.
          </p>
        </div>
        <div>
          <Label>Confirm password</Label>
          <Input
            className="mt-1.5"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            disabled={!password}
          />
        </div>
      </div>
      <div>
        <Label>Admin title</Label>
        <select
          className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={adminTitle}
          onChange={(e) => setAdminTitle(e.target.value)}
        >
          {ADMIN_TITLES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      {adminTitle === 'super_admin' ? (
        <div>
          <Label>Type SUPERADMIN to confirm</Label>
          <Input
            className="mt-1.5"
            value={confirmSuperAdmin}
            onChange={(e) => setConfirmSuperAdmin(e.target.value)}
            required
          />
        </div>
      ) : null}
      <div>
        <Label>Timezone</Label>
        <select
          className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>
      {!password ? (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={sendInvite} onCheckedChange={(v) => setSendInvite(Boolean(v))} />
          Send invite email
        </label>
      ) : null}
      {error ? <p className="text-sm text-danger-500">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create admin'}
      </Button>
    </form>
  )
}
