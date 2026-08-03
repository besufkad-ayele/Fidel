'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { reviewHomeworkSubmissionAction } from '@/lib/actions/homework-review'
import type { HomeworkReviewDetail } from '@/lib/data/homework-review'
import { StatusBadge } from '@/components/admin/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ExternalLink, FileText } from 'lucide-react'

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export function HomeworkReviewDetail({
  detail,
  backHref,
  backLabel,
}: {
  detail: HomeworkReviewDetail
  backHref: string
  backLabel: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState(detail.feedback ?? '')
  const [grade, setGrade] = useState(detail.grade != null ? String(detail.grade) : '')

  function run(outcome: 'approve' | 'resubmit') {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('submissionId', detail.id)
      formData.set('outcome', outcome)
      formData.set('feedback', feedback)
      formData.set('grade', grade)
      const result = await reviewHomeworkSubmissionAction(formData)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(outcome === 'approve' ? 'Submission approved' : 'Resubmission requested')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={detail.status} />
            <span className="text-xs text-muted-foreground">Attempt {detail.attemptNo}</span>
          </div>
          <h1 className="mt-2 font-display text-3xl text-green-900">{detail.assignment.title}</h1>
          <p className="mt-1 text-sm text-green-800">
            {detail.student.fullName}
            <span className="text-muted-foreground"> · {detail.student.email}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted {formatWhen(detail.submittedAt)}
            {detail.reviewedAt ? ` · Reviewed ${formatWhen(detail.reviewedAt)}` : ''}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={backHref as '/'}>{backLabel}</Link>
        </Button>
      </div>

      <section className="rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
        <h2 className="font-display text-lg text-green-800">Assignment</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-green-800">
          {detail.assignment.instructions || 'No instructions provided.'}
        </p>
        {detail.assignment.unitId ? (
          <p className="mt-2 text-xs text-muted-foreground">Unit: {detail.assignment.unitId}</p>
        ) : null}
      </section>

      <section className="space-y-4 rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
        <h2 className="font-display text-lg text-green-800">Student submission</h2>

        {detail.textResponse ? (
          <div>
            <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">Writing</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-green-900">{detail.textResponse}</p>
          </div>
        ) : null}

        {detail.fileUrls.length > 0 ? (
          <div>
            <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">Files</p>
            <ul className="mt-2 space-y-2">
              {detail.fileUrls.map((url, i) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:underline"
                  >
                    {url.match(/\.(png|jpe?g|gif|webp)(\?|$)/i) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={`Upload ${i + 1}`} className="max-h-48 rounded-lg border border-cream-300" />
                    ) : (
                      <>
                        <FileText className="size-4" />
                        Open file {i + 1}
                        <ExternalLink className="size-3.5" />
                      </>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {detail.audioUrl ? (
          <div>
            <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">Audio</p>
            <audio controls src={detail.audioUrl} className="mt-2 w-full max-w-md" />
          </div>
        ) : null}

        {detail.videoUrl ? (
          <div>
            <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">Video</p>
            <video controls src={detail.videoUrl} className="mt-2 max-h-80 w-full max-w-lg rounded-lg bg-green-950" />
          </div>
        ) : null}

        {!detail.textResponse &&
        detail.fileUrls.length === 0 &&
        !detail.audioUrl &&
        !detail.videoUrl ? (
          <p className="text-sm text-muted-foreground">No answer content on this submission.</p>
        ) : null}
      </section>

      <section className="rounded-xl border-2 border-gold-300 bg-gold-50/40 p-5 shadow-card">
        <h2 className="font-display text-lg text-green-900">Assessment</h2>
        <p className="mt-1 text-sm text-green-800">
          Approve with a grade (counts toward the unit homework score), or request a resubmission.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="grade">Grade (0–100)</Label>
            <Input
              id="grade"
              type="number"
              min={0}
              max={100}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="mt-1.5"
              placeholder="e.g. 85"
              disabled={pending}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="feedback">Feedback for student</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="mt-1.5"
              rows={4}
              placeholder="What went well, what to fix…"
              disabled={pending}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" disabled={pending} onClick={() => run('approve')}>
            Approve
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => run('resubmit')}
          >
            Request resubmission
          </Button>
        </div>
      </section>
    </div>
  )
}
