'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import {
  activatePersonAction,
  deletePersonAction,
  reactivatePersonAction,
} from '@/app/(admin)/admin/manage-actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PeopleRowActionsProps = {
  id: string
  name: string
  email: string
  status: 'active' | 'pending' | 'suspended'
}

export function PeopleRowActions({ id, name, email, status }: PeopleRowActionsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const expected = (name || email).trim()

  function onActivate() {
    setError(null)
    startTransition(async () => {
      try {
        if (status === 'suspended') {
          await reactivatePersonAction(id)
        } else {
          await activatePersonAction(id)
        }
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Activate failed')
      }
    })
  }

  function onDelete() {
    setError(null)
    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.set('id', id)
        fd.set('confirmName', confirmName)
        await deletePersonAction(fd)
        setDeleteOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed')
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {status === 'pending' || status === 'suspended' ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 border-success-500/40 text-success-500 hover:bg-success-50"
          disabled={pending}
          onClick={onActivate}
        >
          <CheckCircle2 className="size-3.5" />
          {status === 'pending' ? 'Activate' : 'Reactivate'}
        </Button>
      ) : null}

      <Button asChild size="sm" variant="outline" className="h-8">
        <Link href={`/admin/people/${id}/edit` as '/'}>
          <Pencil className="size-3.5" />
          Edit
        </Link>
      </Button>

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 border-danger-500/40 text-danger-500 hover:bg-danger-50"
        disabled={pending}
        onClick={() => {
          setConfirmName('')
          setError(null)
          setDeleteOpen(true)
        }}
      >
        <Trash2 className="size-3.5" />
        Delete
      </Button>

      {error && !deleteOpen ? (
        <p className="basis-full text-right text-[11px] text-danger-500">{error}</p>
      ) : null}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {name || email}?</DialogTitle>
            <DialogDescription>
              This permanently removes the auth account and profile. Type{' '}
              <strong className="text-green-800">{expected}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`confirm-${id}`}>Confirmation</Label>
            <Input
              id={`confirm-${id}`}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={expected}
              autoComplete="off"
            />
            {error ? <p className="text-sm text-danger-500">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending || confirmName !== expected}
              onClick={onDelete}
            >
              {pending ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
