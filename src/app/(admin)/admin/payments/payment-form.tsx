'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recordPaymentAction } from '@/app/(admin)/admin/actions'
import { PAYMENT_PROVIDERS } from '@/lib/admin/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Student = { id: string; full_name: string; email: string }
type Org = { id: string; name: string }

export function PaymentForm({ students, organizations }: { students: Student[]; organizations: Org[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await recordPaymentAction({
        studentId: String(fd.get('studentId')),
        organizationId: String(fd.get('organizationId') ?? '') || undefined,
        amount: Number(fd.get('amount')),
        currency: String(fd.get('currency')),
        provider: String(fd.get('provider')),
        status: String(fd.get('status')),
        reference: String(fd.get('reference') ?? '') || undefined,
        note: String(fd.get('note') ?? '') || undefined,
        paidAt: fd.get('paidAt') ? new Date(String(fd.get('paidAt'))) : new Date(),
      })
      if (!result.ok) {
        setError(result.error ?? 'Failed')
        return
      }
      e.currentTarget.reset()
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label>Student</Label>
        <select
          name="studentId"
          required
          className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Select…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name || s.email}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Organization</Label>
        <select
          name="organizationId"
          className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">None</option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Amount</Label>
          <Input name="amount" type="number" step="0.01" min="0" className="mt-1.5" required />
        </div>
        <div>
          <Label>Currency</Label>
          <select
            name="currency"
            defaultValue="ETB"
            className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {['ETB', 'USD', 'EUR', 'GBP'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label>Method</Label>
        <select
          name="provider"
          className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {PAYMENT_PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Status</Label>
        <select
          name="status"
          defaultValue="paid"
          className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
        </select>
      </div>
      <div>
        <Label>Paid date</Label>
        <Input name="paidAt" type="date" className="mt-1.5" />
      </div>
      <div>
        <Label>Reference</Label>
        <Input name="reference" className="mt-1.5" />
      </div>
      <div>
        <Label>Note</Label>
        <Input name="note" className="mt-1.5" />
      </div>
      {error ? <p className="text-sm text-danger-500">{error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Saving…' : 'Record payment'}
      </Button>
    </form>
  )
}
