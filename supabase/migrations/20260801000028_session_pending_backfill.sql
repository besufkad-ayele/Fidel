-- Backfill: scheduled rows without a Meet link were awaiting teacher confirmation.
UPDATE public.sessions
SET status = 'pending',
    updated_at = now()
WHERE status = 'scheduled'
  AND (meet_link IS NULL OR btrim(meet_link) = '');

CREATE INDEX IF NOT EXISTS sessions_pending_idx
  ON public.sessions (teacher_id, scheduled_at)
  WHERE status = 'pending';
