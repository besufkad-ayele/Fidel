-- Homework assignments: draft/publish + block content (same studio as unit parts).

alter table public.homework_assignments
  add column if not exists status publish_status not null default 'draft';

alter table public.homework_assignments
  add column if not exists content jsonb not null default '{}'::jsonb;

create index if not exists homework_assignments_status_idx
  on public.homework_assignments (status);
