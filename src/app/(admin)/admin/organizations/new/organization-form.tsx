'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createOrganizationAction } from '@/app/(admin)/admin/actions'
import { ORG_TYPES } from '@/lib/admin/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function OrganizationForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await createOrganizationAction({
        name: String(fd.get('name') ?? ''),
        type: String(fd.get('type') ?? 'other'),
        country: String(fd.get('country') ?? '') || undefined,
        billingContactName: String(fd.get('billingContactName') ?? '') || undefined,
        billingContactEmail: String(fd.get('billingContactEmail') ?? '') || undefined,
        billingAddress: String(fd.get('billingAddress') ?? '') || undefined,
        taxId: String(fd.get('taxId') ?? '') || undefined,
        notes: String(fd.get('notes') ?? '') || undefined,
      })
      if (!result.ok) {
        setError(result.error ?? 'Failed')
        return
      }
      router.push('/admin/organizations')
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" className="mt-1.5" required />
      </div>
      <div>
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue="embassy"
        >
          {ORG_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="country">Country (ISO)</Label>
        <Input id="country" name="country" className="mt-1.5" maxLength={2} />
      </div>
      <div>
        <Label htmlFor="billingContactName">Billing contact name</Label>
        <Input id="billingContactName" name="billingContactName" className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="billingContactEmail">Billing contact email</Label>
        <Input id="billingContactEmail" name="billingContactEmail" type="email" className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="billingAddress">Billing address</Label>
        <Textarea id="billingAddress" name="billingAddress" className="mt-1.5" rows={2} />
      </div>
      <div>
        <Label htmlFor="taxId">Tax ID</Label>
        <Input id="taxId" name="taxId" className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" className="mt-1.5" rows={3} />
      </div>
      {error ? <p className="text-sm text-danger-500">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Create organization'}
      </Button>
    </form>
  )
}
