import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { SectionCard } from '@/components/admin/section-card'
import { ConfirmForm } from '@/components/admin/confirm-form'
import { createAdminDb } from '@/lib/admin/db'
import {
  updateUnitAction,
  setUnitStatusAction,
  deleteUnitAction,
  setPartStatusAction,
  deletePartAction,
} from '@/app/(admin)/admin/content-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Props = { params: Promise<{ id: string }> }

const PART_META = [
  {
    part: 'cultural_insight',
    slug: 'cultural-insight',
    title: 'Part 1 · Cultural insight',
    description: 'Hook, framing, persona variants, do’s & don’ts.',
  },
  {
    part: 'language_lesson',
    slug: 'language-lesson',
    title: 'Part 2 · Language lesson',
    description: 'Objectives, vocabulary, dialogue, grammar, pronunciation.',
  },
  {
    part: 'practice',
    slug: 'practice',
    title: 'Part 3 · Practice',
    description: 'Exercises, roleplay, homework task, quiz link.',
  },
] as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Unit ${id}` }
}

export default async function UnitDetailPage({ params }: Props) {
  const { id } = await params
  const db = await createAdminDb()
  const { data: unit } = await db.from('units').select('*').eq('id', id).maybeSingle()
  if (!unit) notFound()

  const { data: parts } = await db.from('lesson_parts').select('*').eq('unit_id', id)

  const partMap = new Map<string, { part: string; status: string; id: string }>(
    (parts ?? []).map((p: { part: string; status: string; id: string }) => [p.part, p]),
  )

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={unit.title}
        description={unit.subtitle || unit.description || undefined}
        actions={[
          { label: 'Back to level', href: `/admin/levels/${unit.level_id}`, variant: 'outline' },
          { label: 'Quiz editor', href: `/admin/units/${id}/quiz`, variant: 'outline' },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <StatusBadge status={unit.status} />
        <span className="text-sm text-muted-foreground">{unit.estimated_minutes} min</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {unit.status !== 'published' ? (
            <form action={setUnitStatusAction.bind(null, id, 'published')}>
              <Button type="submit" size="sm">
                Publish unit
              </Button>
            </form>
          ) : (
            <form action={setUnitStatusAction.bind(null, id, 'draft')}>
              <Button type="submit" size="sm" variant="outline">
                Unpublish
              </Button>
            </form>
          )}
          <ConfirmForm
            action={deleteUnitAction.bind(null, id)}
            message={`Delete unit "${unit.title}" and all parts?`}
            label="Delete unit"
          />
        </div>
      </div>

      <SectionCard title="Unit details" className="mb-6">
        <form action={updateUnitAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={id} />
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" className="mt-1.5" defaultValue={unit.title} required />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" className="mt-1.5" defaultValue={unit.slug} required />
          </div>
          <div>
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              className="mt-1.5"
              defaultValue={unit.sort_order}
              required
            />
          </div>
          <div>
            <Label htmlFor="estimatedMinutes">Minutes</Label>
            <Input
              id="estimatedMinutes"
              name="estimatedMinutes"
              type="number"
              className="mt-1.5"
              defaultValue={unit.estimated_minutes}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={unit.status}
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="in_review">In review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input id="subtitle" name="subtitle" className="mt-1.5" defaultValue={unit.subtitle ?? ''} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              className="mt-1.5"
              rows={3}
              defaultValue={unit.description ?? ''}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Save unit</Button>
          </div>
        </form>
      </SectionCard>

      <div className="grid gap-4">
        {PART_META.map((meta) => {
          const row = partMap.get(meta.part)
          return (
            <SectionCard
              key={meta.part}
              title={meta.title}
              description={meta.description}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  {row ? <StatusBadge status={row.status} /> : <StatusBadge status="draft" />}
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/units/${id}/parts/${meta.slug}` as '/'}>Edit</Link>
                  </Button>
                  {row && row.status !== 'published' ? (
                    <form action={setPartStatusAction.bind(null, id, meta.part, 'published')}>
                      <Button type="submit" size="sm">
                        Publish
                      </Button>
                    </form>
                  ) : null}
                  {row && row.status === 'published' ? (
                    <form action={setPartStatusAction.bind(null, id, meta.part, 'draft')}>
                      <Button type="submit" size="sm" variant="ghost">
                        Unpublish
                      </Button>
                    </form>
                  ) : null}
                  {row ? (
                    <ConfirmForm
                      action={deletePartAction.bind(null, id, meta.part)}
                      message={`Delete ${meta.title}?`}
                      label="Delete"
                    />
                  ) : null}
                </div>
              }
            >
              <p className="text-sm text-muted-foreground">
                {row
                  ? 'Part row exists. Open the editor to update content JSON and publish.'
                  : 'Part will be created on first edit or publish.'}
              </p>
            </SectionCard>
          )
        })}
      </div>
    </div>
  )
}
