import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { SectionCard } from '@/components/admin/section-card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Import students' }

export default function ImportStudentsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Import students"
        description="Bulk CSV provisioning: upload → map columns → validate → confirm."
      />
      <SectionCard title="CSV upload" description="Chunked at 25 rows · idempotent on email.">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-cream-400 bg-cream-100 px-6 py-16 text-center">
          <p className="font-display text-xl text-green-700">Drop a CSV here</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Expected columns: full_name, email, persona, organization, level_ids, session_credits.
            Full column mapping ships with Phase 2 polish — use single-student create for now.
          </p>
          <Button className="mt-6" disabled>
            Choose file
          </Button>
        </div>
      </SectionCard>
    </div>
  )
}
