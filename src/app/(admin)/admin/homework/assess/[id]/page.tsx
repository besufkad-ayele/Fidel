import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { getHomeworkSubmissionForReview } from '@/lib/data/homework-review'
import { HomeworkReviewDetail } from '@/components/features/homework/homework-review-detail'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Assess · ${id.slice(0, 8)}` }
}

export default async function AdminHomeworkAssessDetailPage({ params }: Props) {
  const { user } = await requireRole('admin')
  const { id } = await params
  const detail = await getHomeworkSubmissionForReview(id, {
    role: 'admin',
    userId: user.id,
  })
  if (!detail) notFound()

  return (
    <div className="mx-auto max-w-3xl py-2">
      <HomeworkReviewDetail
        detail={detail}
        backHref="/admin/homework/assess"
        backLabel="Back to assessment queue"
      />
    </div>
  )
}
