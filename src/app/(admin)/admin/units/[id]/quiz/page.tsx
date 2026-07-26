import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { EmptyState } from '@/components/admin/empty-state'
import { SectionCard } from '@/components/admin/section-card'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: 'Quiz editor' }

export default async function QuizEditorPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Unit quiz"
        description={`Question editor for ${id}. Answer keys and explanations attach per question.`}
        actions={[{ label: 'Back to unit', href: `/admin/units/${id}`, variant: 'outline' }]}
      />
      <SectionCard title="Questions">
        <EmptyState
          title="Quiz schema next"
          description="Multiple choice, true/false, fill blank, matching, and short answer editors will land with the quizzes migration."
        />
      </SectionCard>
    </div>
  )
}
