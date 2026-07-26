'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { grantEntitlementAction } from '@/app/(admin)/admin/actions'
import { LEVEL_OPTIONS } from '@/lib/admin/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AmharicText } from '@/components/shared/amharic-text'

type Student = { id: string; full_name: string; email: string }
type Unit = { id: string; title: string; level_id: string }

export function GrantForm({ students, units }: { students: Student[]; units: Unit[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [studentId, setStudentId] = useState('')
  const [scope, setScope] = useState<'level' | 'unit'>('level')
  const [levelIds, setLevelIds] = useState<string[]>(['ha'])
  const [unitIds, setUnitIds] = useState<string[]>([])
  const [source, setSource] = useState('admin_grant')
  const [note, setNote] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [sessionCredits, setSessionCredits] = useState(0)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await grantEntitlementAction({
        studentId,
        scope,
        levelIds,
        unitIds,
        source,
        note,
        sessionCredits,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      })
      if (!result.ok) {
        setError(result.error ?? 'Failed')
        return
      }
      setNote('')
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label>Student</Label>
        <select
          className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        >
          <option value="">Select…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name || s.email}
            </option>
          ))}
        </select>
      </div>
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
        <div className="space-y-2">
          {LEVEL_OPTIONS.map((l) => (
            <label key={l.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={levelIds.includes(l.id)}
                onCheckedChange={() =>
                  setLevelIds((prev) =>
                    prev.includes(l.id) ? prev.filter((x) => x !== l.id) : [...prev, l.id],
                  )
                }
              />
              <AmharicText size="sm">{l.fidel}</AmharicText>
              {l.label}
            </label>
          ))}
        </div>
      ) : (
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {units.map((u) => (
            <label key={u.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={unitIds.includes(u.id)}
                onCheckedChange={() =>
                  setUnitIds((prev) =>
                    prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id],
                  )
                }
              />
              {u.level_id} · {u.title}
            </label>
          ))}
        </div>
      )}
      <div>
        <Label>Source</Label>
        <select
          className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="purchase">Paid</option>
          <option value="trial">Trial</option>
          <option value="promo">Promo</option>
          <option value="admin_grant">Admin grant</option>
          <option value="staff">Staff</option>
        </select>
      </div>
      <div>
        <Label>Expires</Label>
        <Input
          type="date"
          className="mt-1.5"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>
      <div>
        <Label>Session credits</Label>
        <Input
          type="number"
          min={0}
          className="mt-1.5"
          value={sessionCredits}
          onChange={(e) => setSessionCredits(Number(e.target.value))}
        />
      </div>
      <div>
        <Label>Note (required)</Label>
        <Input className="mt-1.5" value={note} onChange={(e) => setNote(e.target.value)} required />
      </div>
      {error ? <p className="text-sm text-danger-500">{error}</p> : null}
      <Button type="submit" disabled={pending || !studentId} className="w-full">
        {pending ? 'Granting…' : 'Grant access'}
      </Button>
    </form>
  )
}
