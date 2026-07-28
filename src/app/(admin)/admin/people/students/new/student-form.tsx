'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { createStudentAction } from '@/app/(admin)/admin/actions'
import { PERSONAS, LEVEL_OPTIONS, ORG_TYPES, TIMEZONES, PAYMENT_PROVIDERS } from '@/lib/admin/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { AmharicText } from '@/components/shared/amharic-text'

type Org = { id: string; name: string; type: string }
type Teacher = { id: string; full_name: string }
type Unit = { id: string; title: string; level_id: string }

type Props = {
  organizations: Org[]
  teachers: Teacher[]
  units: Unit[]
}

export function StudentForm({ organizations, teachers, units }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [createdEmail, setCreatedEmail] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [persona, setPersona] = useState('diplomat')
  const [studyIntent, setStudyIntent] = useState('steady')
  const [learningGoal, setLearningGoal] = useState('')
  const [priorExperience, setPriorExperience] = useState('none')
  const [startingLevelId, setStartingLevelId] = useState('ha')
  const [orgMode, setOrgMode] = useState<'none' | 'existing' | 'new'>('none')
  const [organizationId, setOrganizationId] = useState('')
  const [orgName, setOrgName] = useState('')
  const [orgType, setOrgType] = useState('embassy')
  const [jobTitle, setJobTitle] = useState('')
  const [timezone, setTimezone] = useState('Africa/Addis_Ababa')
  const [country, setCountry] = useState('')
  const [grantAccess, setGrantAccess] = useState(true)
  const [scope, setScope] = useState<'level' | 'unit'>('level')
  const [levelIds, setLevelIds] = useState<string[]>(['ha'])
  const [unitIds, setUnitIds] = useState<string[]>([])
  const [accessSource, setAccessSource] = useState('admin_grant')
  const [accessNote, setAccessNote] = useState('Admin grant')
  const [sessionCredits, setSessionCredits] = useState(0)
  const [expiresAt, setExpiresAt] = useState('')
  const [includePayment, setIncludePayment] = useState(false)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('ETB')
  const [provider, setProvider] = useState('manual_bank')
  const [paymentStatus, setPaymentStatus] = useState('paid')
  const [paymentRef, setPaymentRef] = useState('')
  const [teacherIds, setTeacherIds] = useState<string[]>([])
  const [primaryTeacherId, setPrimaryTeacherId] = useState('')

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  function reportError(message: string) {
    console.error('[StudentForm]', message)
    setError(message)
    toast.error(message)
  }

  const summary = useMemo(() => {
    const lines = [
      `Account: ${fullName || '—'} · ${email || '—'}`,
      `Persona: ${persona} · Intent: ${studyIntent}`,
      grantAccess
        ? `Access: ${scope === 'level' ? levelIds.join(', ') || 'none' : unitIds.join(', ') || 'none'}`
        : 'Access: none (student cannot open content)',
      sessionCredits > 0 ? `Credits: ${sessionCredits}` : 'Credits: 0',
      teacherIds.length ? `Teachers: ${teacherIds.length}` : 'Teachers: self-paced only',
      includePayment || accessSource === 'purchase'
        ? `Payment: ${amount || '0'} ${currency}`
        : 'Payment: not recorded',
      password ? 'Login: ready immediately with admin-set password' : 'Login: password required',
    ]
    return lines
  }, [
    fullName,
    email,
    persona,
    studyIntent,
    grantAccess,
    scope,
    levelIds,
    unitIds,
    sessionCredits,
    teacherIds,
    includePayment,
    accessSource,
    amount,
    currency,
    password,
  ])

  function toggleLevel(id: string) {
    setLevelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleUnit(id: string) {
    setUnitIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleTeacher(id: string) {
    setTeacherIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      if (!next.includes(primaryTeacherId)) setPrimaryTeacherId(next[0] ?? '')
      return next
    })
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      reportError('Full name is required')
      return
    }
    if (!email.trim()) {
      reportError('Email is required')
      return
    }
    if (password.length < 8) {
      reportError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      reportError('Passwords do not match')
      return
    }
    if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) {
      reportError('Phone must be E.164 format, e.g. +251911234567')
      return
    }
    if (grantAccess) {
      if (scope === 'level' && levelIds.length === 0) {
        reportError('Select at least one level to grant')
        return
      }
      if (scope === 'unit' && unitIds.length === 0) {
        reportError('Select at least one unit to grant')
        return
      }
      if (!(accessNote.trim() || 'Admin grant')) {
        reportError('Access grant note is required')
        return
      }
    }
    if (teacherIds.length > 0 && !primaryTeacherId) {
      reportError('Choose which teacher is primary')
      return
    }
    if ((includePayment || accessSource === 'purchase') && (!amount || Number(amount) <= 0)) {
      reportError('Enter a payment amount greater than 0')
      return
    }

    const selectedOrg = organizations.find((o) => o.id === organizationId)
    type OrgType = (typeof ORG_TYPES)[number]['id']
    const orgTypeIds = ORG_TYPES.map((t) => t.id) as OrgType[]
    const resolvedOrgType: OrgType =
      orgMode === 'existing'
        ? orgTypeIds.includes((selectedOrg?.type ?? '') as OrgType)
          ? (selectedOrg!.type as OrgType)
          : 'other'
        : (orgType as OrgType)

    startTransition(async () => {
      const payload = {
        fullName: fullName.trim(),
        preferredName: preferredName.trim() || undefined,
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        isActive: 'active' as const,
        adminNotes: adminNotes.trim() || undefined,
        persona,
        studyIntent,
        learningGoal: learningGoal.trim() || undefined,
        priorExperience,
        startingLevelId,
        organization:
          orgMode === 'existing' && organizationId
            ? {
                id: organizationId,
                name: selectedOrg?.name ?? 'Org',
                type: resolvedOrgType,
              }
            : orgMode === 'new' && orgName.trim()
              ? { name: orgName.trim(), type: orgType }
              : undefined,
        jobTitle: jobTitle.trim() || undefined,
        timezone,
        country: country.trim() || undefined,
        locale: 'en' as const,
        preferredDays: [] as number[],
        preferredTimes: [] as ('morning' | 'afternoon' | 'evening')[],
        otherLanguages: [] as string[],
        access: grantAccess
          ? {
              scope,
              levelIds,
              unitIds,
              source: accessSource,
              note: accessNote.trim() || 'Admin grant',
              sessionCredits,
              expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            }
          : undefined,
        payment:
          includePayment || accessSource === 'purchase'
            ? {
                amount: Number(amount),
                currency,
                provider,
                status: paymentStatus,
                reference: paymentRef.trim() || undefined,
                paidAt: new Date(),
              }
            : undefined,
        teacherIds,
        primaryTeacherId: primaryTeacherId || undefined,
      }

      try {
        const result = await createStudentAction(payload)
        if (!result.ok) {
          reportError(result.error ?? 'Failed to create student')
          return
        }
        toast.success('Student created')
        setCreatedId(result.id ?? null)
        setCreatedEmail(result.email ?? email)
        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create student'
        reportError(message)
      }
    })
  }

  if (createdId) {
    return (
      <div className="rounded-xl border border-success-500/30 bg-success-50 p-6">
        <h2 className="font-display text-2xl text-green-700">Student created</h2>
        <ul className="mt-4 space-y-2 text-sm text-green-800">
          <li>Account is active — email is confirmed, no invite needed.</li>
          <li>
            Login: <span className="font-medium">{createdEmail}</span>
          </li>
          <li>Share the password you set with the student out of band.</li>
          <li>Access and payment were recorded as configured.</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/admin/people/${createdId}` as '/'}>View student</Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Create another
          </Button>
          <Button asChild variant="ghost">
            <Link href={'/admin/people' as '/'}>Back to people</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        {error ? (
          <div
            ref={errorRef}
            role="alert"
            className="rounded-lg border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-500"
          >
            <p className="font-medium">Could not create student</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : null}

        <Section letter="A" title="Account" description="Login identity — student signs in immediately with this password.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </Field>
            <Field label="Preferred name">
              <Input value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
            </Field>
            <Field label="Email" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Phone (E.164)" hint="Optional. Example: +251911234567">
              <Input
                placeholder="+251911234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field
              label="Password"
              required
              hint="Student can sign in immediately — no email verification."
            >
              <div className="relative">
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
            </Field>
            <Field label="Confirm password" required>
              <div className="relative">
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
            </Field>
          </div>
          <Field label="Internal notes (staff only)" className="mt-4">
            <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} />
          </Field>
        </Section>

        <Section
          letter="B"
          title="Learner profile"
          description="Persona drives cultural framing in every unit."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersona(p.id)}
                className={`rounded-lg border px-3 py-3 text-left text-sm ${
                  persona === p.id
                    ? 'border-green-700 bg-green-50 text-green-700'
                    : 'border-cream-300 bg-cream-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Study intent">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={studyIntent}
                onChange={(e) => setStudyIntent(e.target.value)}
              >
                <option value="casual">Casual</option>
                <option value="steady">Steady</option>
                <option value="intensive">Intensive</option>
              </select>
            </Field>
            <Field label="Prior Amharic">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={priorExperience}
                onChange={(e) => setPriorExperience(e.target.value)}
              >
                <option value="none">None</option>
                <option value="few_words">A few words</option>
                <option value="speaks_some">Can speak some</option>
                <option value="reads_fidel">Can read fidel</option>
                <option value="conversational">Conversational</option>
              </select>
            </Field>
            <Field label="Starting level">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={startingLevelId}
                onChange={(e) => setStartingLevelId(e.target.value)}
              >
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Learning goal" className="mt-4">
            <Textarea value={learningGoal} onChange={(e) => setLearningGoal(e.target.value)} />
          </Field>
        </Section>

        <Section
          letter="C"
          title="Organization & sponsor"
          description="Skip for individuals. Required when an embassy or NGO pays."
        >
          <div className="flex flex-wrap gap-2">
            {(['none', 'existing', 'new'] as const).map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={orgMode === m ? 'default' : 'outline'}
                onClick={() => setOrgMode(m)}
              >
                {m === 'none' ? 'Individual' : m === 'existing' ? 'Existing org' : 'New org'}
              </Button>
            ))}
          </div>
          {orgMode === 'existing' ? (
            <Field label="Organization" className="mt-4">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
              >
                <option value="">Select…</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {orgMode === 'new' ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Organization name">
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </Field>
              <Field label="Type">
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                >
                  {ORG_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ) : null}
          <Field label="Job title" className="mt-4">
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </Field>
        </Section>

        <Section
          letter="D"
          title="Locale & scheduling"
          description="Session times render in this timezone."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Timezone">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Country (ISO)">
              <Input
                maxLength={2}
                placeholder="ET"
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
              />
            </Field>
          </div>
        </Section>

        <Section
          letter="E"
          title="Access grant"
          description="What the student can open. Unit scope is how paid parts work."
        >
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={grantAccess} onCheckedChange={(v) => setGrantAccess(Boolean(v))} />
            Grant content access now
          </label>
          {grantAccess ? (
            <div className="mt-4 space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={scope === 'level' ? 'default' : 'outline'}
                  onClick={() => setScope('level')}
                >
                  Full level
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={scope === 'unit' ? 'default' : 'outline'}
                  onClick={() => setScope('unit')}
                >
                  Specific units
                </Button>
              </div>
              {scope === 'level' ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {LEVEL_OPTIONS.map((l) => (
                    <label
                      key={l.id}
                      className="flex items-center gap-3 rounded-lg border border-cream-300 bg-cream-100 px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={levelIds.includes(l.id)}
                        onCheckedChange={() => toggleLevel(l.id)}
                      />
                      <AmharicText size="md">{l.fidel}</AmharicText>
                      <span>{l.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {units.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-3 rounded-lg border border-cream-300 bg-cream-100 px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={unitIds.includes(u.id)}
                        onCheckedChange={() => toggleUnit(u.id)}
                      />
                      <span>
                        {u.level_id} · {u.title}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Access source">
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={accessSource}
                    onChange={(e) => {
                      setAccessSource(e.target.value)
                      if (e.target.value === 'purchase') setIncludePayment(true)
                    }}
                  >
                    <option value="purchase">Paid</option>
                    <option value="trial">Trial</option>
                    <option value="promo">Scholarship / Promo</option>
                    <option value="admin_grant">Internal / Staff</option>
                  </select>
                </Field>
                <Field label="Expires on">
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </Field>
                <Field label="Session credits">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={sessionCredits}
                    onChange={(e) => setSessionCredits(Number(e.target.value))}
                  />
                </Field>
                <Field label="Grant note" required>
                  <Input
                    required={grantAccess}
                    value={accessNote}
                    onChange={(e) => setAccessNote(e.target.value)}
                    placeholder="Why does this student have this access?"
                  />
                </Field>
              </div>
            </div>
          ) : null}
        </Section>

        <Section
          letter="F"
          title="Payment record"
          description="Offline bookkeeping — no gateway is called."
        >
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={includePayment || accessSource === 'purchase'}
              onCheckedChange={(v) => setIncludePayment(Boolean(v))}
            />
            Record offline payment
          </label>
          {includePayment || accessSource === 'purchase' ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Amount">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </Field>
              <Field label="Currency">
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {['ETB', 'USD', 'EUR', 'GBP'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Method">
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                >
                  {PAYMENT_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partially paid</option>
                </select>
              </Field>
              <Field label="Reference">
                <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} />
              </Field>
            </div>
          ) : null}
        </Section>

        <Section
          letter="G"
          title="Temari assignment"
          description="Assign a teacher for live bookings. Leave blank for self-paced only."
        >
          {teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No teachers yet. Create a temari first, or leave blank for self-paced.
            </p>
          ) : (
            <div className="space-y-2">
              {teachers.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border border-cream-300 bg-cream-100 px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={teacherIds.includes(t.id)}
                    onCheckedChange={() => toggleTeacher(t.id)}
                  />
                  <span className="flex-1">{t.full_name}</span>
                  {teacherIds.includes(t.id) ? (
                    <button
                      type="button"
                      className={`text-xs ${primaryTeacherId === t.id ? 'font-semibold text-green-700' : 'text-muted-foreground'}`}
                      onClick={() => setPrimaryTeacherId(t.id)}
                    >
                      {primaryTeacherId === t.id ? 'Primary' : 'Make primary'}
                    </button>
                  ) : null}
                </label>
              ))}
            </div>
          )}
        </Section>

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-500"
          >
            <p className="font-medium">Could not create student</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 pb-10">
          <Button type="submit" disabled={pending}>
            {pending ? 'Creating…' : 'Create student'}
          </Button>
          <Button asChild type="button" variant="outline" disabled={pending}>
            <Link href={'/admin/people' as '/'}>Cancel</Link>
          </Button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-card">
          <div className="border-b border-cream-300 bg-green-700 px-5 py-4">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-gold-400 uppercase">
              Summary
            </p>
            <h2 className="mt-1 font-display text-lg text-cream-50">On submit</h2>
          </div>
          <ul className="space-y-3 p-5 text-sm text-muted-foreground">
            {summary.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          {!grantAccess ? (
            <div className="border-t border-warning-500/30 bg-warning-50 px-5 py-3 text-xs text-warning-500">
              Warning: this student will have no content access until you grant entitlements.
            </div>
          ) : null}
        </div>
      </aside>
    </form>
  )
}

function Section({
  title,
  description,
  children,
  letter,
}: {
  title: string
  description?: string
  children: React.ReactNode
  letter: string
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-card">
      <div className="flex items-start gap-3 border-b border-cream-300 bg-cream-100/60 px-5 py-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-700 font-display text-sm text-gold-400">
          {letter}
        </span>
        <div>
          <h2 className="font-display text-lg tracking-tight text-green-700">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function Field({
  label,
  children,
  required,
  className,
  hint,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
  className?: string
  hint?: string
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm font-medium text-green-800">
        {label}
        {required ? <span className="text-danger-500"> *</span> : null}
      </Label>
      {children}
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
