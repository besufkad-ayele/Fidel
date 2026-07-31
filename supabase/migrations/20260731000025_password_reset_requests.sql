-- Password reset requests: learners ask via /forgot-password; admins fulfill from Notifications.
-- Does not send Supabase recovery emails automatically.

create type password_reset_request_status as enum (
  'pending',
  'fulfilled',
  'dismissed'
);

create table if not exists password_reset_requests (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  email        text not null,
  status       password_reset_request_status not null default 'pending',
  note         text,
  resolved_by  uuid references profiles(id) on delete set null,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists password_reset_requests_status_created_idx
  on password_reset_requests (status, created_at desc);

create index if not exists password_reset_requests_profile_idx
  on password_reset_requests (profile_id, created_at desc);

-- At most one open request per profile.
create unique index if not exists password_reset_requests_one_pending_per_profile
  on password_reset_requests (profile_id)
  where status = 'pending';

alter table password_reset_requests enable row level security;

drop policy if exists password_reset_requests_admin_all on password_reset_requests;
create policy password_reset_requests_admin_all on password_reset_requests
  for all
  using (fidel.is_staff())
  with check (fidel.is_staff());

-- Service role / forgot-password insert bypasses RLS; students never read this table.
