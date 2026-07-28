'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { createTeacherAction } from '@/app/(admin)/admin/actions'
import { TIMEZONES } from '@/lib/admin/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

export function TeacherForm() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [createdEmail, setCreatedEmail] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [timezone, setTimezone] = useState('Africa/Addis_Ababa')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [isAccepting, setIsAccepting] = useState(true)

  function reportError(message: string) {
    console.error('[TeacherForm]', message)
    setError(message)
    toast.error(message)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      reportError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      reportError('Passwords do not match')
      return
    }

    startTransition(async () => {
      const result = await createTeacherAction({
        fullName,
        email,
        phone: phone || undefined,
        password,
        timezone,
        headline: headline || undefined,
        bio: bio || undefined,
        yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
        languages: ['am', 'en'],
        qualifications: [],
        specializations: [],
        isAcceptingStudents: isAccepting,
        hourlyRateCents: hourlyRate ? Math.round(Number(hourlyRate) * 100) : undefined,
        currency: 'ETB',
        isPublic: false,
      })
      if (!result.ok) {
        reportError(result.error ?? 'Failed')
        return
      }
      toast.success('Teacher created')
      setCreatedId(result.id ?? null)
      setCreatedEmail(result.email ?? email)
    })
  }

  if (createdId) {
    return (
      <div className="rounded-xl border border-success-500/30 bg-success-50 p-6">
        <h2 className="font-display text-2xl text-green-700">Teacher created</h2>
        <ul className="mt-4 space-y-2 text-sm text-green-800">
          <li>Account is active — email confirmed, no invite needed.</li>
          <li>
            Login: <span className="font-medium">{createdEmail}</span>
          </li>
          <li>Share the password you set with the teacher out of band.</li>
        </ul>
        <Button asChild className="mt-4">
          <Link href={`/admin/people/${createdId}` as '/'}>View profile</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      ) : null}

      <section className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
        <h2 className="font-display text-lg text-green-700">Account</h2>
        <div>
          <Label>Full name</Label>
          <Input
            className="mt-1.5"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            className="mt-1.5"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Password</Label>
            <div className="relative mt-1.5">
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-green-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Teacher can sign in immediately — no email verification.
            </p>
          </div>
          <div>
            <Label>Confirm password</Label>
            <div className="relative mt-1.5">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-green-700"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </div>
        <div>
          <Label>Phone</Label>
          <Input className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
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
      </section>

      <section className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
        <h2 className="font-display text-lg text-green-700">Professional</h2>
        <div>
          <Label>Headline</Label>
          <Input className="mt-1.5" value={headline} onChange={(e) => setHeadline(e.target.value)} />
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea className="mt-1.5" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Years experience</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
            />
          </div>
          <div>
            <Label>Hourly rate (ETB)</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={isAccepting} onCheckedChange={(v) => setIsAccepting(Boolean(v))} />
          Accepting students
        </label>
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create teacher'}
      </Button>
    </form>
  )
}
