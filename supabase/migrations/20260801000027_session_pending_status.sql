-- Pending bookings wait for teacher approval + Meet link before becoming scheduled.
-- Enum value and data backfill are split: Postgres requires a commit before a new
-- enum label can be used in DML (see companion migration ...28).
ALTER TYPE public.session_status ADD VALUE IF NOT EXISTS 'pending' BEFORE 'scheduled';
