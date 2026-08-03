import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { getHomeworkSubmissionForReview } from '@/lib/data/homework-review'
import { HomeworkReviewDetail } from '@/components/features/homework/homework-review-detail'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: `Assess homework · ${id.slice(0, 8)}` }
}

export default async function TeachHomeworkDetailPage({ params }: Props) {
  const { user } = await requireRole('teacher')
  const { id } = await params
  const detail = await getHomeworkSubmissionForReview(id, {
    role: 'teacher',
    userId: user.id,
  })
  if (!detail) notFound()

  return (
    <HomeworkReviewDetail
      detail={detail}
      backHref="/teach/homework"
      backLabel="Back to queue"
    />
  )
}
