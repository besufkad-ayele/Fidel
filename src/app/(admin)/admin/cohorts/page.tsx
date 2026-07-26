import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { SectionCard } from '@/components/admin/section-card'
import { ConfirmForm } from '@/components/admin/confirm-form'
import { createAdminDb } from '@/lib/admin/db'
import { createCohortFormAction } from './actions'
import {
  updateCohortAction,
  deleteCohortAction,
} from '@/app/(admin)/admin/manage-actions'
import { LEVEL_OPTIONS, formatDate } from '@/lib/admin/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export const metadata: Metadata = { title: 'Cohorts' }

export default async function CohortsPage() {
  const db = await createAdminDb()
  const [{ data: cohorts }, { data: orgs }] = await Promise.all([
    db
      .from('cohorts')
      .select('id, name, organization_id, level_id, starts_on, ends_on, notes, created_at')
      .order('created_at', { ascending: false }),
    db.from('organizations').select('id, name').order('name'),
  ])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="People & access"
        title="Cohorts"
        description="Create, update, and delete student groups for bulk grants."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <SectionCard title="Create cohort">
          <form action={createCohortFormAction} className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="organizationId">Organization</Label>
              <select
                id="organizationId"
                name="organizationId"
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">None</option>
                {(orgs ?? []).map((o: { id: string; name: string }) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="levelId">Focus level</Label>
              <select
                id="levelId"
                name="levelId"
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">None</option>
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full">
              Create cohort
            </Button>
          </form>
        </SectionCard>

        <div className="space-y-4">
          {(cohorts ?? []).length === 0 ? (
            <EmptyState
              title="No cohorts yet"
              description="Create a cohort to group embassy or NGO students for bulk access grants."
            />
          ) : (
            (cohorts ?? []).map(
              (c: {
                id: string
                name: string
                organization_id: string | null
                level_id: string | null
                starts_on: string | null
                ends_on: string | null
                notes: string | null
              }) => (
                <SectionCard
                  key={c.id}
                  title={c.name}
                  description={`${formatDate(c.starts_on)} – ${formatDate(c.ends_on)}`}
                >
                  <form action={updateCohortAction} className="grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="id" value={c.id} />
                    <div className="sm:col-span-2">
                      <Label>Name</Label>
                      <Input name="name" className="mt-1.5" defaultValue={c.name} required />
                    </div>
                    <div>
                      <Label>Organization</Label>
                      <select
                        name="organizationId"
                        defaultValue={c.organization_id ?? ''}
                        className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">None</option>
                        {(orgs ?? []).map((o: { id: string; name: string }) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Level</Label>
                      <select
                        name="levelId"
                        defaultValue={c.level_id ?? ''}
                        className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">None</option>
                        {LEVEL_OPTIONS.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Starts</Label>
                      <Input
                        name="startsOn"
                        type="date"
                        className="mt-1.5"
                        defaultValue={c.starts_on ?? ''}
                      />
                    </div>
                    <div>
                      <Label>Ends</Label>
                      <Input
                        name="endsOn"
                        type="date"
                        className="mt-1.5"
                        defaultValue={c.ends_on ?? ''}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Notes</Label>
                      <Textarea name="notes" className="mt-1.5" rows={2} defaultValue={c.notes ?? ''} />
                    </div>
                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                      <Button type="submit" size="sm">
                        Save
                      </Button>
                    </div>
                  </form>
                  <div className="mt-3 border-t border-cream-300 pt-3">
                    <ConfirmForm
                      action={deleteCohortAction.bind(null, c.id)}
                      message={`Delete cohort "${c.name}"? Students stay; only the cohort link is cleared.`}
                      label="Delete cohort"
                    />
                  </div>
                </SectionCard>
              ),
            )
          )}
        </div>
      </div>
    </div>
  )
}
