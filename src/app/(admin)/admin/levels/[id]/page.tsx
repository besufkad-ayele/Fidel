import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { StatusBadge } from '@/components/admin/status-badge'
import { SectionCard } from '@/components/admin/section-card'
import { ConfirmForm } from '@/components/admin/confirm-form'
import { AmharicText } from '@/components/shared/amharic-text'
import { createAdminDb } from '@/lib/admin/db'
import {
  updateLevelAction,
  createUnitAction,
  deleteUnitAction,
} from '@/app/(admin)/admin/content-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Level ${id}` }
}

export default async function LevelDetailPage({ params }: Props) {
  const { id } = await params
  const db = await createAdminDb()
  const { data: level } = await db.from('levels').select('*').eq('id', id).maybeSingle()
  if (!level) notFound()

  const { data: units } = await db
    .from('units')
    .select('id, title, slug, sort_order, status, estimated_minutes')
    .eq('level_id', id)
    .order('sort_order')

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Content"
        title={level.title}
        description={level.subtitle || level.description || undefined}
        actions={[{ label: 'All levels', href: '/admin/levels', variant: 'outline' }]}
      />

      <div className="mb-6 flex items-center gap-3">
        <AmharicText size="xl" className="text-gold-600">
          {level.fidel_char}
        </AmharicText>
        <StatusBadge status={level.status} />
        <span className="text-sm text-muted-foreground">CEFR {level.cefr_equivalent}</span>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <SectionCard title="Units" description="Create, open, or delete units in this level.">
          {(units ?? []).length === 0 ? (
            <p className="mb-4 text-sm text-muted-foreground">No units in this level yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Minutes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(units ?? []).map(
                  (
                    u: {
                      id: string
                      title: string
                      status: string
                      estimated_minutes: number
                    },
                    index: number,
                  ) => (
                    <TableRow key={u.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/units/${u.id}` as '/'}
                          className="font-medium text-green-700 hover:underline"
                        >
                          {u.title}
                        </Link>
                      </TableCell>
                      <TableCell>{u.estimated_minutes}</TableCell>
                      <TableCell>
                        <StatusBadge status={u.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/units/${u.id}` as '/'}>Edit</Link>
                          </Button>
                          <ConfirmForm
                            action={deleteUnitAction.bind(null, u.id)}
                            message={`Delete unit "${u.title}" and all of its parts?`}
                            label="Delete"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Add unit">
            <form action={createUnitAction} className="space-y-3">
              <input type="hidden" name="levelId" value={id} />
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" className="mt-1.5" required />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" className="mt-1.5" placeholder="greetings" />
              </div>
              <div>
                <Label htmlFor="estimatedMinutes">Minutes</Label>
                <Input
                  id="estimatedMinutes"
                  name="estimatedMinutes"
                  type="number"
                  min={15}
                  defaultValue={45}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input id="subtitle" name="subtitle" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" className="mt-1.5" rows={3} />
              </div>
              <Button type="submit" className="w-full">
                Create unit
              </Button>
            </form>
          </SectionCard>

          <SectionCard title="Level settings">
            <form action={updateLevelAction} className="space-y-3">
              <input type="hidden" name="id" value={id} />
              <div>
                <Label htmlFor="levelTitle">Title</Label>
                <Input
                  id="levelTitle"
                  name="title"
                  className="mt-1.5"
                  defaultValue={level.title}
                  required
                />
              </div>
              <div>
                <Label htmlFor="levelSubtitle">Subtitle</Label>
                <Input
                  id="levelSubtitle"
                  name="subtitle"
                  className="mt-1.5"
                  defaultValue={level.subtitle ?? ''}
                />
              </div>
              <div>
                <Label htmlFor="cefrEquivalent">CEFR</Label>
                <Input
                  id="cefrEquivalent"
                  name="cefrEquivalent"
                  className="mt-1.5"
                  defaultValue={level.cefr_equivalent}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={level.status}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">In review</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  className="mt-1.5"
                  rows={3}
                  defaultValue={level.description ?? ''}
                />
              </div>
              <div>
                <Label htmlFor="canDoSummary">Can-do summary</Label>
                <Textarea
                  id="canDoSummary"
                  name="canDoSummary"
                  className="mt-1.5"
                  rows={2}
                  defaultValue={level.can_do_summary ?? ''}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isComingSoon"
                  defaultChecked={level.is_coming_soon}
                  className="size-4 rounded border-cream-400"
                />
                Mark as coming soon
              </label>
              <Button type="submit" className="w-full">
                Save level
              </Button>
            </form>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
