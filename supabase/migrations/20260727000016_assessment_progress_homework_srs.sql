-- Assessment, progress, homework, and simple vocabulary SRS ratings.
-- Applied to remote as assessment_progress_homework_srs.

create table if not exists exercises (
  id           uuid primary key default gen_random_uuid(),
  unit_id      text not null references units(id) on delete cascade,
  type         exercise_type not null,
  prompt       text not null,
  instructions text,
  payload      jsonb not null default '{}'::jsonb,
  answer_key   jsonb,
  points       int not null default 1,
  sort_order   int not null default 0,
  status       publish_status not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists exercises_unit_sort_idx on exercises (unit_id, sort_order);

create table if not exists exercise_attempts (
  id            uuid primary key default gen_random_uuid(),
  exercise_id   uuid not null references exercises(id) on delete cascade,
  student_id    uuid not null references profiles(id) on delete cascade,
  response      jsonb not null,
  is_correct    boolean,
  points_earned int not null default 0,
  attempt_no    int not null default 1,
  created_at    timestamptz not null default now()
);
create index if not exists exercise_attempts_student_idx on exercise_attempts (student_id, exercise_id);

create table if not exists quizzes (
  id                 uuid primary key default gen_random_uuid(),
  unit_id            text references units(id) on delete cascade,
  level_id           text references levels(id) on delete cascade,
  is_level_exam      boolean not null default false,
  title              text not null,
  passing_score      int not null default 70,
  time_limit_minutes int,
  max_attempts       int,
  status             publish_status not null default 'draft',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (
    (is_level_exam and level_id is not null and unit_id is null) or
    (not is_level_exam and unit_id is not null)
  )
);
create unique index if not exists quizzes_one_per_unit on quizzes (unit_id) where not is_level_exam;
create unique index if not exists quizzes_one_exam_per_level on quizzes (level_id) where is_level_exam;

create table if not exists quiz_questions (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid not null references quizzes(id) on delete cascade,
  type           question_type not null,
  prompt         text not null,
  options        jsonb,
  correct_answer jsonb not null,
  explanation    text,
  points         int not null default 1,
  sort_order     int not null default 0
);
create index if not exists quiz_questions_quiz_sort_idx on quiz_questions (quiz_id, sort_order);

create table if not exists quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references quizzes(id) on delete cascade,
  student_id   uuid not null references profiles(id) on delete cascade,
  attempt_no   int not null default 1,
  score        int not null,
  max_score    int not null,
  percentage   numeric(5,2) generated always as
                 (case when max_score = 0 then 0 else round(score::numeric * 100 / max_score, 2) end) stored,
  passed       boolean not null default false,
  answers      jsonb not null default '{}'::jsonb,
  started_at   timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  unique (quiz_id, student_id, attempt_no)
);
create index if not exists quiz_attempts_student_idx on quiz_attempts (student_id, quiz_id);

create or replace view public.quiz_questions_student
with (security_invoker = true) as
  select id, quiz_id, type, prompt, options, points, sort_order
  from quiz_questions;

create table if not exists part_progress (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references profiles(id) on delete cascade,
  unit_id         text not null references units(id) on delete cascade,
  part            lesson_part not null,
  status          part_status not null default 'not_started',
  progress_pct    int not null default 0 check (progress_pct between 0 and 100),
  nudge_dismissed boolean not null default false,
  first_viewed_at timestamptz,
  completed_at    timestamptz,
  updated_at      timestamptz not null default now(),
  unique (student_id, unit_id, part)
);
create index if not exists part_progress_student_unit_idx on part_progress (student_id, unit_id);

create table if not exists student_unit_progress (
  id                   uuid primary key default gen_random_uuid(),
  student_id           uuid not null references profiles(id) on delete cascade,
  unit_id              text not null references units(id) on delete cascade,
  self_paced_status    self_paced_status not null default 'not_started',
  live_status          live_status not null default 'not_booked',
  best_quiz_percentage numeric(5,2),
  started_at           timestamptz,
  completed_at         timestamptz,
  updated_at           timestamptz not null default now(),
  unique (student_id, unit_id)
);
create index if not exists student_unit_progress_student_idx on student_unit_progress (student_id);

create table if not exists unit_unlocks (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  unit_id    text not null references units(id) on delete cascade,
  granted_by uuid not null references profiles(id),
  reason     text not null,
  created_at timestamptz not null default now(),
  unique (student_id, unit_id)
);
create index if not exists unit_unlocks_student_idx on unit_unlocks (student_id);

create or replace function fidel.rollup_unit_progress()
returns trigger language plpgsql as $$
declare
  practice_done boolean;
  any_started   boolean;
begin
  select
    bool_or(part = 'practice' and status = 'completed'),
    bool_or(status <> 'not_started')
  into practice_done, any_started
  from part_progress
  where student_id = new.student_id and unit_id = new.unit_id;

  insert into student_unit_progress (student_id, unit_id, self_paced_status, started_at, completed_at)
  values (
    new.student_id, new.unit_id,
    case when practice_done then 'completed'
         when any_started   then 'in_progress'
         else 'not_started' end,
    now(),
    case when practice_done then now() end
  )
  on conflict (student_id, unit_id) do update set
    self_paced_status = excluded.self_paced_status,
    completed_at      = coalesce(student_unit_progress.completed_at, excluded.completed_at),
    updated_at        = now();

  return new;
end $$;

drop trigger if exists part_progress_rollup on part_progress;
create trigger part_progress_rollup
  after insert or update on part_progress
  for each row execute function fidel.rollup_unit_progress();

create table if not exists homework_assignments (
  id              uuid primary key default gen_random_uuid(),
  unit_id         text references units(id) on delete cascade,
  session_id      uuid,
  student_id      uuid references profiles(id) on delete cascade,
  assigned_by     uuid references profiles(id),
  title           text not null,
  instructions    text not null,
  is_unit_default boolean not null default false,
  due_at          timestamptz,
  allow_text      boolean not null default true,
  allow_audio     boolean not null default true,
  allow_video     boolean not null default false,
  allow_files     boolean not null default false,
  max_audio_seconds int,
  max_video_seconds int,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check ((is_unit_default and student_id is null) or (not is_unit_default and student_id is not null))
);
create index if not exists homework_assignments_student_idx on homework_assignments (student_id);
create index if not exists homework_assignments_unit_idx on homework_assignments (unit_id);

create table if not exists homework_submissions (
  id             uuid primary key default gen_random_uuid(),
  assignment_id  uuid not null references homework_assignments(id) on delete cascade,
  student_id     uuid not null references profiles(id) on delete cascade,
  attempt_no     int not null default 1,
  text_response  text,
  file_paths     text[] not null default '{}',
  audio_path     text,
  video_path     text,
  status         homework_status not null default 'submitted',
  reviewed_by    uuid references profiles(id),
  feedback       text,
  grade          int check (grade between 0 and 100),
  submitted_at   timestamptz not null default now(),
  reviewed_at    timestamptz,
  unique (assignment_id, attempt_no)
);
create index if not exists homework_submissions_student_status_idx on homework_submissions (student_id, status);

create table if not exists vocabulary_reviews (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references profiles(id) on delete cascade,
  vocabulary_id    uuid not null references vocabulary_items(id) on delete cascade,
  box              int not null default 1 check (box between 1 and 5),
  ease             numeric(4,2) not null default 2.5,
  interval_days    int not null default 0,
  repetitions      int not null default 0,
  last_rating      int check (last_rating between 1 and 3),
  last_reviewed_at timestamptz,
  next_review_at   timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (student_id, vocabulary_id)
);
create index if not exists vocabulary_reviews_due_idx
  on vocabulary_reviews (student_id, next_review_at);

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'vocabulary_items' and column_name = 'difficulty_weight'
  ) then
    alter table vocabulary_items
      add column difficulty_weight int not null default 1
      check (difficulty_weight between 1 and 5);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'unit_vocabulary' and column_name = 'is_core'
  ) then
    alter table unit_vocabulary
      add column is_core boolean not null default true;
  end if;
end $$;

alter table exercises enable row level security;
alter table exercise_attempts enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;
alter table part_progress enable row level security;
alter table student_unit_progress enable row level security;
alter table unit_unlocks enable row level security;
alter table homework_assignments enable row level security;
alter table homework_submissions enable row level security;
alter table vocabulary_reviews enable row level security;

create or replace function fidel.is_staff()
returns boolean language sql stable as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'teacher'),
    false
  );
$$;

drop policy if exists exercises_staff_all on exercises;
create policy exercises_staff_all on exercises for all using (fidel.is_staff()) with check (fidel.is_staff());
drop policy if exists exercises_student_read on exercises;
create policy exercises_student_read on exercises for select using (status = 'published');

drop policy if exists quizzes_staff_all on quizzes;
create policy quizzes_staff_all on quizzes for all using (fidel.is_staff()) with check (fidel.is_staff());
drop policy if exists quizzes_student_read on quizzes;
create policy quizzes_student_read on quizzes for select using (status = 'published');

drop policy if exists quiz_questions_staff_all on quiz_questions;
create policy quiz_questions_staff_all on quiz_questions for all using (fidel.is_staff()) with check (fidel.is_staff());

drop policy if exists quiz_attempts_own on quiz_attempts;
create policy quiz_attempts_own on quiz_attempts for all
  using (student_id = auth.uid() or fidel.is_staff())
  with check (student_id = auth.uid() or fidel.is_staff());

drop policy if exists exercise_attempts_own on exercise_attempts;
create policy exercise_attempts_own on exercise_attempts for all
  using (student_id = auth.uid() or fidel.is_staff())
  with check (student_id = auth.uid() or fidel.is_staff());

drop policy if exists part_progress_own on part_progress;
create policy part_progress_own on part_progress for all
  using (student_id = auth.uid() or fidel.is_staff())
  with check (student_id = auth.uid() or fidel.is_staff());

drop policy if exists student_unit_progress_own on student_unit_progress;
create policy student_unit_progress_own on student_unit_progress for all
  using (student_id = auth.uid() or fidel.is_staff())
  with check (student_id = auth.uid() or fidel.is_staff());

drop policy if exists unit_unlocks_staff on unit_unlocks;
create policy unit_unlocks_staff on unit_unlocks for all using (fidel.is_staff()) with check (fidel.is_staff());
drop policy if exists unit_unlocks_student_read on unit_unlocks;
create policy unit_unlocks_student_read on unit_unlocks for select using (student_id = auth.uid());

drop policy if exists hw_assignments_visible on homework_assignments;
create policy hw_assignments_visible on homework_assignments for select
  using (fidel.is_staff() or student_id = auth.uid() or is_unit_default);
drop policy if exists hw_assignments_staff_write on homework_assignments;
create policy hw_assignments_staff_write on homework_assignments for all
  using (fidel.is_staff()) with check (fidel.is_staff());

drop policy if exists hw_submissions_select on homework_submissions;
create policy hw_submissions_select on homework_submissions for select
  using (student_id = auth.uid() or fidel.is_staff());
drop policy if exists hw_submissions_insert_own on homework_submissions;
create policy hw_submissions_insert_own on homework_submissions for insert
  with check (student_id = auth.uid());
drop policy if exists hw_submissions_teacher_review on homework_submissions;
create policy hw_submissions_teacher_review on homework_submissions for update
  using (fidel.is_staff()) with check (fidel.is_staff());

drop policy if exists vocab_reviews_own on vocabulary_reviews;
create policy vocab_reviews_own on vocabulary_reviews for all
  using (student_id = auth.uid() or fidel.is_staff())
  with check (student_id = auth.uid() or fidel.is_staff());
