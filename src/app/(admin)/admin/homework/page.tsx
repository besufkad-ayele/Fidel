import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { SectionCard } from '@/components/admin/section-card'
import { EmptyState } from '@/components/admin/empty-state'
import { ConfirmForm } from '@/components/admin/confirm-form'
import { createAdminDb } from '@/lib/admin/db'
import {
  createHomeworkAssignmentAction,
  deleteHomeworkAssignmentAction,
} from '@/app/(admin)/admin/homework-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export const metadata: Metadata = { title: 'Homework' }

export default async function AdminHomeworkPage() {
  const db = await createAdminDb()
  const [{ data: assignments }, { data: units }] = await Promise.all([
    db
      .from('homework_assignments')
      .select('id, title, instructions, unit_id, is_unit_default, allow_audio, allow_video, max_audio_seconds, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('units').select('id, title, level_id').order('sort_order').limit(100),
  ])

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Homework"
        description="Create unit-default homework templates. Students see these from practice parts and the homework inbox."
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <SectionCard title="New assignment">
          <form action={createHomeworkAssignmentAction} className="space-y-3">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea id="instructions" name="instructions" className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="unitId">Unit (optional template)</Label>
              <select
                id="unitId"
                name="unitId"
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">No unit</option>
                {(units ?? []).map((u: { id: string; title: string; level_id: string }) => (
                  <option key={u.id} value={u.id}>
                    {u.level_id} · {u.title}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isUnitDefault" defaultChecked />
              Unit default template
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="allowAudio" defaultChecked />
              Allow audio
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="allowVideo" />
              Allow video
            </label>
            <div>
              <Label htmlFor="maxAudioSeconds">Max audio seconds</Label>
              <Input
                id="maxAudioSeconds"
                name="maxAudioSeconds"
                type="number"
                defaultValue={60}
                className="mt-1.5"
              />
            </div>
            <Button type="submit" className="w-full">
              Create homework
            </Button>
          </form>
        </SectionCard>

        <div>
          {(assignments ?? []).length === 0 ? (
            <EmptyState
              title="No homework yet"
              description="Create a unit-default template, or add a homework block inside a Practice part."
            />
          ) : (
            <div className="space-y-3">
              {(assignments ?? []).map(
                (a: {
                  id: string
                  title: string
                  instructions: string
                  unit_id: string | null
                  is_unit_default: boolean
                  allow_audio: boolean
                  allow_video: boolean
                  max_audio_seconds: number | null
                }) => (
                <SectionCard
                  key={a.id}
                  title={a.title}
                  description={a.is_unit_default ? 'Unit default' : 'Personal assignment'}
                >
                  <p className="text-sm text-green-800">{a.instructions}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {a.unit_id ?? 'No unit'}
                    {a.allow_audio ? ` · audio ≤ ${a.max_audio_seconds ?? 60}s` : ''}
                    {a.allow_video ? ' · video' : ''}
                  </p>
                  <div className="mt-3">
                    <ConfirmForm
                      action={deleteHomeworkAssignmentAction.bind(null, a.id)}
                      message="Delete this homework assignment?"
                      label="Delete"
                    />
                  </div>
                </SectionCard>
              ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
