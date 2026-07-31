-- Teacher weekly availability + time-off for live session booking.
-- Times are wall-clock in the teacher's timezone (stored on each row).

create table if not exists public.teacher_availability (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Africa/Addis_Ababa',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists teacher_availability_teacher_weekday_idx
  on public.teacher_availability (teacher_id, weekday)
  where is_active;

create table if not exists public.teacher_time_off (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists teacher_time_off_teacher_starts_idx
  on public.teacher_time_off (teacher_id, starts_at);

alter table public.teacher_availability enable row level security;
alter table public.teacher_time_off enable row level security;

-- Readable by any signed-in user so students can see open slots.
drop policy if exists availability_select on public.teacher_availability;
create policy availability_select on public.teacher_availability for select
  using (auth.role() = 'authenticated');

drop policy if exists availability_own_write on public.teacher_availability;
create policy availability_own_write on public.teacher_availability for all
  using (teacher_id = auth.uid() or fidel.is_admin())
  with check (teacher_id = auth.uid() or fidel.is_admin());

drop policy if exists time_off_select on public.teacher_time_off;
create policy time_off_select on public.teacher_time_off for select
  using (auth.role() = 'authenticated');

drop policy if exists time_off_own_write on public.teacher_time_off;
create policy time_off_own_write on public.teacher_time_off for all
  using (teacher_id = auth.uid() or fidel.is_admin())
  with check (teacher_id = auth.uid() or fidel.is_admin());
