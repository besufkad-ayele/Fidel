'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { uploadHomeworkSubmissionFile } from '@/lib/media/upload-homework-submission'

export type SubmitHomeworkResult = { ok: true } | { ok: false; error: string }

function asFile(value: FormDataEntryValue | null): File | null {
  if (!value || typeof value === 'string') return null
  if (!(value instanceof File)) return null
  if (value.size <= 0) return null
  return value
}

function asFiles(formData: FormData, key: string): File[] {
  return formData
    .getAll(key)
    .map((v) => asFile(v))
    .filter((f): f is File => Boolean(f))
}

export async function submitHomeworkAction(formData: FormData): Promise<SubmitHomeworkResult> {
  const { user } = await requireRole('student')
  const assignmentId = String(formData.get('assignmentId') ?? '').trim()
  if (!assignmentId) return { ok: false, error: 'Missing assignment.' }

  const text = String(formData.get('text') ?? '').trim()
  const driveLink = String(formData.get('driveLink') ?? '').trim()

  const supabase = await createClient()
  const { data: assignment, error: assignmentError } = await supabase
    .from('homework_assignments')
    .select(
      'id, status, allow_text, allow_audio, allow_video, allow_files, student_id, is_unit_default',
    )
    .eq('id', assignmentId)
    .eq('status', 'published')
    .maybeSingle()

  if (assignmentError) return { ok: false, error: assignmentError.message }
  if (!assignment) return { ok: false, error: 'Assignment not found.' }
  if (
    assignment.student_id &&
    assignment.student_id !== user.id &&
    !assignment.is_unit_default
  ) {
    return { ok: false, error: 'You cannot submit this assignment.' }
  }

  const image = asFile(formData.get('image'))
  const pdfs = asFiles(formData, 'pdf')
  const audio = asFile(formData.get('audio'))
  const video = asFile(formData.get('video'))

  const hasWriting = Boolean(text) || Boolean(driveLink) || Boolean(image) || pdfs.length > 0
  const hasAudio = Boolean(audio)
  const hasVideo = Boolean(video)

  if (!hasWriting && !hasAudio && !hasVideo) {
    return { ok: false, error: 'Add at least one answer before submitting.' }
  }

  const textParts = [text, driveLink ? `Drive: ${driveLink}` : ''].filter(Boolean)
  const textResponse = textParts.length > 0 ? textParts.join('\n\n') : null

  const filePaths: string[] = []
  let audioPath: string | null = null
  let videoPath: string | null = null

  try {
    if (image) {
      filePaths.push(
        await uploadHomeworkSubmissionFile(image, {
          studentId: user.id,
          assignmentId,
          kind: 'image',
        }),
      )
    }
    for (const pdf of pdfs) {
      filePaths.push(
        await uploadHomeworkSubmissionFile(pdf, {
          studentId: user.id,
          assignmentId,
          kind: 'pdf',
        }),
      )
    }
    if (audio) {
      if (!assignment.allow_audio) return { ok: false, error: 'Audio is not allowed for this assignment.' }
      audioPath = await uploadHomeworkSubmissionFile(audio, {
        studentId: user.id,
        assignmentId,
        kind: 'audio',
      })
    }
    if (video) {
      if (!assignment.allow_video) return { ok: false, error: 'Video is not allowed for this assignment.' }
      videoPath = await uploadHomeworkSubmissionFile(video, {
        studentId: user.id,
        assignmentId,
        kind: 'video',
      })
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Upload failed.' }
  }

  const { data: prior } = await supabase
    .from('homework_submissions')
    .select('attempt_no')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .order('attempt_no', { ascending: false })
    .limit(1)
    .maybeSingle()

  const attemptNo = (prior?.attempt_no ?? 0) + 1

  const { error: insertError } = await supabase.from('homework_submissions').insert({
    assignment_id: assignmentId,
    student_id: user.id,
    attempt_no: attemptNo,
    text_response: textResponse,
    file_paths: filePaths,
    audio_path: audioPath,
    video_path: videoPath,
  })

  if (insertError) return { ok: false, error: insertError.message }

  revalidatePath('/homework')
  revalidatePath(`/homework/${assignmentId}`)
  revalidatePath('/dashboard')
  return { ok: true }
}
