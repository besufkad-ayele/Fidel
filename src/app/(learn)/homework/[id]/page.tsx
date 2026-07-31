import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { BlockRenderer } from '@/components/content/block-renderer'
import { HomeworkSubmission } from '@/components/content/interactive/homework-submission'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth/guards'
import { getPublishedHomeworkForStudent } from '@/lib/data/homework'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const assignment = await getPublishedHomeworkForStudent(id)
  return { title: assignment?.title ? `${assignment.title} · Homework` : 'Homework' }
}

function formatDue(dueAt: string | null) {
  if (!dueAt) return null
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dueAt))
  } catch {
    return null
  }
}

export default async function StudentHomeworkDetailPage({ params }: Props) {
  await requireRole('student')
  const t = await getTranslations('homework')
  const { id } = await params
  const assignment = await getPublishedHomeworkForStudent(id)
  if (!assignment) notFound()

  const due = formatDue(assignment.dueAt)
  const hasPromptBlock = Boolean(
    assignment.content?.blocks.some((b) => b.type === 'homework_prompt'),
  )
  const alreadySubmitted =
    assignment.submissionStatus === 'submitted' ||
    assignment.submissionStatus === 'reviewed' ||
    assignment.submissionStatus === 'needs_resubmission'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-3 border-b border-cream-300 pb-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-green-800">
          <Link href={'/homework' as '/'}>{t('backList')}</Link>
        </Button>
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-gold-700 uppercase">
            {t('eyebrow')}
          </p>
          <h1 className="mt-1 font-display text-3xl text-green-900">{assignment.title}</h1>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {assignment.unitTitle ? (
              <span>
                {assignment.levelId ? `${assignment.levelId.toUpperCase()} · ` : ''}
                {assignment.unitTitle}
              </span>
            ) : null}
            {due ? <span>{t('due', { date: due })}</span> : null}
            {assignment.submissionStatus !== 'pending' ? (
              <span className="font-medium text-green-800">
                {t(`status.${assignment.submissionStatus}`)}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      {assignment.feedback ? (
        <div className="rounded-xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm text-green-900">
          <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">
            {t('feedback')}
          </p>
          <p className="mt-1">{assignment.feedback}</p>
          {assignment.grade != null ? (
            <p className="mt-2 text-xs font-medium text-green-800">
              {t('grade', { value: assignment.grade })}
            </p>
          ) : null}
        </div>
      ) : null}

      {assignment.content ? (
        <div className="rounded-xl border border-cream-300 bg-cream-50 p-6 shadow-card sm:p-8">
          <BlockRenderer
            content={assignment.content}
            vocabulary={assignment.vocabulary}
            mode="student"
            assignmentId={assignment.id}
            alreadySubmitted={alreadySubmitted}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-cream-400 bg-cream-50 p-8 text-center">
          <p className="text-sm text-green-800">{t('noContent')}</p>
          {assignment.instructions ? (
            <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
              {assignment.instructions}
            </p>
          ) : null}
        </div>
      )}

      {!hasPromptBlock ? (
        <HomeworkSubmission
          assignmentId={assignment.id}
          alreadySubmitted={alreadySubmitted}
          mode="student"
          block={{
            id: `fallback-${assignment.id}`,
            type: 'homework_prompt',
            title: assignment.title,
            instructions: assignment.instructions || t('submitFallbackHint'),
            assignmentLink: '',
            assignmentFileUrl: '',
            assignmentFileName: '',
            allowText: assignment.allowText,
            allowAudio: assignment.allowAudio,
            allowVideo: assignment.allowVideo,
            allowDriveLink: assignment.allowText,
            allowImage: assignment.allowText || assignment.allowFiles,
            allowFiles: assignment.allowFiles,
            maxAudioSeconds: assignment.maxAudioSeconds ?? 60,
            maxVideoSeconds: assignment.maxVideoSeconds ?? 90,
            maxImageBytes: 1_048_576,
          }}
        />
      ) : null}
    </div>
  )
}
