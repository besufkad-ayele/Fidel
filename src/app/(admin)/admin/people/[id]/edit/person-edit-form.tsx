'use client'

import { useState, useTransition } from 'react'
import { updatePersonAction } from '@/app/(admin)/admin/manage-actions'
import { TIMEZONES } from '@/lib/admin/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  id: string
  fullName: string
  phone: string
  timezone: string
  locale: string
}

export function PersonEditForm({ id, fullName: initialName, phone: initialPhone, timezone: initialTz, locale: initialLocale }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [timezone, setTimezone] = useState(initialTz)
  const [locale, setLocale] = useState(initialLocale)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.set('id', id)
        fd.set('fullName', fullName)
        fd.set('phone', phone)
        fd.set('timezone', timezone)
        fd.set('locale', locale)
        await updatePersonAction(fd)
      } catch (err) {
        // redirect() throws; ignore navigation digests
        if (err && typeof err === 'object' && 'digest' in err) return
        setError(err instanceof Error ? err.message : 'Update failed')
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          className="mt-1.5"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <select
          id="timezone"
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
      <div>
        <Label htmlFor="locale">Locale</Label>
        <select
          id="locale"
          className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
        >
          <option value="en">English</option>
          <option value="am">Amharic</option>
        </select>
      </div>
      {error ? <p className="text-sm text-danger-500">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
