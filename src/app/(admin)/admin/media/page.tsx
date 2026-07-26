import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { SectionCard } from '@/components/admin/section-card'
import { StatusBadge } from '@/components/admin/status-badge'
import { ConfirmForm } from '@/components/admin/confirm-form'
import { createAdminDb } from '@/lib/admin/db'
import {
  createMediaMetaAction,
  deleteMediaAction,
} from '@/app/(admin)/admin/content-actions'
import { LEVEL_OPTIONS, formatDateTime } from '@/lib/admin/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata: Metadata = { title: 'Media' }

export default async function MediaPage() {
  const db = await createAdminDb()
  const [{ data: assets }, { data: units }] = await Promise.all([
    db
      .from('media_assets')
      .select('id, kind, mime_type, storage_path, unit_id, level_id, size_bytes, alt_text, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('units').select('id, title').order('sort_order'),
  ])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Media library"
        description="Register media metadata and remove unused assets."
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-[340px_1fr]">
        <SectionCard title="Register asset">
          <form action={createMediaMetaAction} className="space-y-3">
            <div>
              <Label htmlFor="storagePath">Storage path</Label>
              <Input
                id="storagePath"
                name="storagePath"
                className="mt-1.5 font-mono text-xs"
                placeholder="ha/unit-01/selam-slow.mp3"
                required
              />
            </div>
            <div>
              <Label htmlFor="kind">Kind</Label>
              <select
                id="kind"
                name="kind"
                defaultValue="audio"
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="audio">Audio</option>
                <option value="video">Video</option>
                <option value="image">Image</option>
                <option value="document">Document</option>
              </select>
            </div>
            <div>
              <Label htmlFor="mimeType">MIME type</Label>
              <Input id="mimeType" name="mimeType" className="mt-1.5" defaultValue="audio/mpeg" />
            </div>
            <div>
              <Label htmlFor="levelId">Level</Label>
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
            <div>
              <Label htmlFor="unitId">Unit</Label>
              <select
                id="unitId"
                name="unitId"
                className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">None</option>
                {(units ?? []).map((u: { id: string; title: string }) => (
                  <option key={u.id} value={u.id}>
                    {u.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="altText">Alt / caption</Label>
              <Input id="altText" name="altText" className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full">
              Save metadata
            </Button>
          </form>
        </SectionCard>

        <div>
          {(assets ?? []).length === 0 ? (
            <EmptyState
              title="No media yet"
              description="Register a storage path to track lesson audio, covers, and documents."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kind</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(assets ?? []).map(
                    (a: {
                      id: string
                      kind: string
                      storage_path: string
                      unit_id: string | null
                      created_at: string
                    }) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <StatusBadge status={a.kind} />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{a.storage_path}</TableCell>
                        <TableCell>{a.unit_id ?? '—'}</TableCell>
                        <TableCell>{formatDateTime(a.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <ConfirmForm
                            action={deleteMediaAction.bind(null, a.id)}
                            message={`Delete media metadata for ${a.storage_path}?`}
                            label="Delete"
                          />
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
