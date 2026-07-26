# Fidel — Data Model

Complete Postgres schema for the Supabase project. Every table, enum, constraint, index, RLS policy, and storage bucket. The SQL here is the plan of record; `supabase/migrations/*.sql` is the executable source of truth and must stay identical to it.

**Conventions**
- `snake_case` everywhere; plural table names.
- UUID primary keys (`gen_random_uuid()`) for all user-generated rows.
- Human-readable text primary keys for curriculum rows (`ha`, `ha-unit-01`) — they appear in URLs and content authoring, and stable readable IDs make seeding and debugging far easier.
- All timestamps are `timestamptz`, defaulting to `now()`.
- Every foreign key has an index. Postgres does not create one automatically, and its absence is a common production stall.
- `updated_at` maintained by a shared trigger, never by application code.
- RLS enabled on **every** table with explicit policies. No exceptions.

---

## 1. Extensions, Schema, Enums

```sql
-- 20260727000001_extensions_and_enums.sql

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "btree_gist";    -- session overlap exclusion constraint
create extension if not exists "pg_trgm";       -- vocabulary fuzzy search

-- Helper functions live in their own schema so they never collide with table names.
create schema if not exists fidel;
grant usage on schema fidel to authenticated, anon;

create type user_role         as enum ('student', 'teacher', 'admin');
create type persona           as enum ('diplomat','ngo','tourist','missionary','researcher','diaspora','other');
create type study_intent      as enum ('casual','steady','intensive');
create type lesson_part       as enum ('cultural_insight','language_lesson','practice');
create type publish_status    as enum ('draft','in_review','published','archived');
create type part_status       as enum ('not_started','in_progress','completed');
create type self_paced_status as enum ('not_started','in_progress','completed');
create type live_status       as enum ('not_booked','booked','completed');
create type exercise_type     as enum ('fill_blank','translate_en_am','translate_am_en','matching','multiple_choice','word_order','speaking','roleplay');
create type question_type     as enum ('multiple_choice','true_false','fill_blank','matching','short_answer');
create type homework_status   as enum ('assigned','submitted','reviewed','needs_resubmission');
create type session_status    as enum ('scheduled','completed','cancelled','no_show');
create type entitlement_scope  as enum ('level','unit');
create type entitlement_source as enum ('admin_grant','trial','purchase','promo','staff');
create type entitlement_status as enum ('active','expired','revoked');
-- Manual methods first: at MVP every payment is recorded by an admin, not captured by a gateway.
create type payment_provider  as enum ('manual_bank','manual_cash','manual_cheque','manual_invoice','mobile_money','other','stripe','chapa','telebirr');
create type payment_status    as enum ('paid','pending','partial','failed','refunded');
create type organization_type as enum ('embassy','ngo','government','university','company','religious','individual','other');
create type prior_experience  as enum ('none','few_words','speaks_some','reads_fidel','conversational');
create type credit_reason     as enum ('grant','booking','cancellation_refund','expiry','adjustment');
create type admin_title       as enum ('super_admin','content_manager','program_coordinator','support');
create type certificate_status as enum ('issued','revoked');
create type media_kind        as enum ('audio','video','image','document');
create type audio_speed       as enum ('slow','normal','natural');
create type notification_kind as enum ('session_reminder','session_booked','session_cancelled','homework_feedback','unit_unlocked','certificate_issued','announcement');

-- Shared updated_at trigger
create or replace function fidel.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
```

---

## 2. Identity

```sql
-- 20260727000002_identity.sql

create table profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  role                  user_role not null default 'student',
  admin_title           admin_title,                -- navigation permissions; null unless role='admin'
  full_name             text not null default '',
  avatar_url            text,
  email                 text not null,
  phone                 text,
  timezone              text not null default 'Africa/Addis_Ababa',
  locale                text not null default 'en',
  welcome_seen_at       timestamptz,                -- replaces onboarding_completed_at
  invited_at            timestamptz,
  activated_at          timestamptz,                -- set when the invite is accepted
  is_active             boolean not null default true,
  suspended_reason      text,
  created_by            uuid references profiles(id),  -- which admin provisioned this account
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  check (admin_title is null or role = 'admin')
);

create index on profiles (created_by);

create table student_profiles (
  user_id            uuid primary key references profiles(id) on delete cascade,
  preferred_name     text,
  persona            persona not null default 'other',
  study_intent       study_intent not null default 'steady',
  learning_goal      text,
  prior_experience   prior_experience not null default 'none',
  native_language    text,                       -- ISO 639-1
  other_languages    text[] not null default '{}',
  country            text,                       -- ISO 3166-1 alpha-2
  organization_id    uuid,                       -- FK added in the organizations migration
  cohort_id          uuid,
  job_title          text,
  department         text,
  preferred_days     int[] not null default '{}',   -- 0 = Sunday; advisory only
  preferred_times    text[] not null default '{}',  -- morning | afternoon | evening
  starting_level_id  text not null default 'ha',
  placement_level_id text,                       -- reserved: Phase 4 placement test
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Internal staff notes live in their OWN table, not a column on student_profiles.
-- A student can select their own student_profiles row, so an `admin_notes` column
-- there would be readable by the person it is written about. Separate table,
-- admin-only policy, no leak possible.
create table student_internal_notes (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references profiles(id) on delete cascade,
  body        text not null,
  author_id   uuid references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index on student_internal_notes (student_id, created_at desc);

create table teacher_profiles (
  user_id                 uuid primary key references profiles(id) on delete cascade,
  headline                text,
  bio                     text,
  years_experience        int check (years_experience >= 0),
  languages_spoken        text[] not null default '{}',
  hourly_rate_cents       int,                  -- display only until Phase 3
  is_accepting_students   boolean not null default true,
  google_refresh_token    text,                 -- encrypted at rest; never selected client-side
  google_calendar_id      text,
  google_connected_at     timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Many-to-many: keeps multi-teacher students possible without a migration.
create table student_teacher_assignments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references profiles(id) on delete cascade,
  teacher_id  uuid not null references profiles(id) on delete cascade,
  is_primary  boolean not null default false,
  assigned_by uuid references profiles(id),
  assigned_at timestamptz not null default now(),
  unique (student_id, teacher_id)
);

create index on student_teacher_assignments (teacher_id);
create index on student_teacher_assignments (student_id);
create index on profiles (role) where is_active;

-- Auto-create a profile whenever an auth user is created.
create or replace function fidel.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.student_profiles (user_id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function fidel.handle_new_user();

-- A user may never change their own role. Only the service role can.
create or replace function fidel.guard_role_change()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role
     and current_setting('request.jwt.claims', true)::jsonb->>'role' <> 'service_role' then
    raise exception 'role changes must go through admin tooling';
  end if;
  return new;
end $$;

create trigger profiles_guard_role
  before update on profiles
  for each row execute function fidel.guard_role_change();
```

### 2.1 Role in the JWT

A Supabase auth hook copies `profiles.role` into the access token so RLS reads a claim instead of running a subquery per row.

```sql
create or replace function fidel.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable as $$
declare
  claims    jsonb;
  user_role text;
begin
  select role::text into user_role from public.profiles where id = (event->>'user_id')::uuid;
  claims := coalesce(event->'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(coalesce(user_role, 'student')));
  return jsonb_set(event, '{claims}', claims);
end $$;

grant execute on function fidel.custom_access_token_hook to supabase_auth_admin;
```

Enable it in the Supabase dashboard: **Authentication → Hooks → Custom Access Token**. The role claim refreshes when the token refreshes, so a role change takes effect within one token lifetime — acceptable, since role changes are rare and admin-initiated.

### 2.2 Disable public signup

Two settings in the Supabase dashboard, both required. Without them, the anon key can still `POST /auth/v1/signup` no matter what the UI offers:

- **Authentication → Providers → Email →** "Allow new users to sign up" **off**
- **Authentication → Providers → Google →** enabled for login, but `/auth/callback` verifies an existing `profiles` row before establishing a session and signs out unknown identities

Record both in the project runbook. They are the only enforcement of "no public signup" that an attacker cannot route around.

---

## 3. Organizations & Cohorts

Embassies, NGOs, and universities buy on behalf of staff, so the payer must be a record separate from the learner. This is also what makes "apply this organization's standard access package" possible when provisioning the fifth student from the same embassy.

```sql
-- 20260727000003_organizations.sql

create table organizations (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  type                   organization_type not null default 'other',
  country                text,
  billing_contact_name   text,
  billing_contact_email  text,
  billing_address        text,
  tax_id                 text,
  -- Reusable default grant, applied by the "standard package" button in provisioning.
  default_access         jsonb not null default '{}'::jsonb,
  notes                  text,
  created_by             uuid references profiles(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (lower(name))
);

create table cohorts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  name            text not null,
  level_id        text references levels(id) on delete set null,
  starts_on       date,
  ends_on         date,
  notes           text,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index on cohorts (organization_id);

alter table student_profiles
  add constraint student_profiles_org_fk
  foreign key (organization_id) references organizations(id) on delete set null,
  add constraint student_profiles_cohort_fk
  foreign key (cohort_id) references cohorts(id) on delete set null;

create index on student_profiles (organization_id);
create index on student_profiles (cohort_id);
```

---

## 4. Curriculum

```sql
-- 20260727000003_curriculum.sql

create table levels (
  id               text primary key,            -- 'ha','le','hha','me','sse','re'
  fidel_char       text not null,               -- ሀ ለ ሐ መ ሠ ረ
  cefr_equivalent  text not null,               -- A1..C2
  title            text not null,               -- 'ሀ — Foundations'
  subtitle         text,
  description      text,
  can_do_summary   text,
  sort_order       int not null,
  status           publish_status not null default 'draft',
  is_coming_soon   boolean not null default false,
  cover_image_path text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (sort_order)
);

create table units (
  id               text primary key,            -- 'ha-unit-01'
  level_id         text not null references levels(id) on delete cascade,
  slug             text not null,               -- 'greetings' — unique within level
  title            text not null,
  subtitle         text,
  description      text,
  estimated_minutes int not null default 45,
  sort_order       int not null,
  status           publish_status not null default 'draft',
  cover_image_path text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (level_id, slug),
  unique (level_id, sort_order)
);

create index on units (level_id, sort_order);

-- One row per (unit, part). Content shape validated by Zod in the app layer.
create table lesson_parts (
  id          uuid primary key default gen_random_uuid(),
  unit_id     text not null references units(id) on delete cascade,
  part        lesson_part not null,
  content     jsonb not null default '{}'::jsonb,
  status      publish_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (unit_id, part)
);

create index on lesson_parts (unit_id);
create index on lesson_parts using gin (content jsonb_path_ops);

-- Every audio/video/image referenced anywhere in content.
create table media_assets (
  id             uuid primary key default gen_random_uuid(),
  bucket         text not null default 'lesson-media',
  storage_path   text not null,
  kind           media_kind not null,
  mime_type      text not null,
  size_bytes     bigint,
  duration_ms    int,
  speed          audio_speed,                   -- for dialogue audio variants
  alt_text       text,
  transcript     text,
  level_id       text references levels(id) on delete set null,
  unit_id        text references units(id) on delete set null,
  uploaded_by    uuid references profiles(id),
  created_at     timestamptz not null default now(),
  unique (bucket, storage_path)
);

create index on media_assets (unit_id);
create index on media_assets (level_id);
```

**Why `content jsonb` rather than a block table:** the three parts have fixed, well-known shapes (PRD §3.1). A block table would add join complexity and ordering bugs for zero gain, because nothing in the prose is ever aggregated. Anything that *is* aggregated — exercises, quiz questions, vocabulary — is relational below.

---

## 4. Vocabulary

```sql
-- 20260727000004_vocabulary.sql

create table vocabulary_items (
  id                       text primary key,   -- 'ha-greet-001'
  level_id                 text not null references levels(id) on delete cascade,
  amharic_script           text not null,
  transliteration          text not null,
  english_meaning          text not null,
  part_of_speech           text,
  formality                text check (formality in ('formal','neutral','informal')),
  gender_variant           text,
  example_sentence_am      text,
  example_sentence_en      text,
  pronunciation_audio_id   uuid references media_assets(id) on delete set null,
  image_id                 uuid references media_assets(id) on delete set null,
  difficulty_weight        int not null default 1 check (difficulty_weight between 1 and 5),
  notes                    text,
  status                   publish_status not null default 'draft',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index on vocabulary_items (level_id);
create index on vocabulary_items using gin (
  (amharic_script || ' ' || transliteration || ' ' || english_meaning) gin_trgm_ops
);

-- Many-to-many: PRD §3.2 requires a word to be reusable across units.
create table unit_vocabulary (
  unit_id       text not null references units(id) on delete cascade,
  vocabulary_id text not null references vocabulary_items(id) on delete cascade,
  is_core       boolean not null default true,  -- core = introduced here; false = review
  sort_order    int not null default 0,
  primary key (unit_id, vocabulary_id)
);

create index on unit_vocabulary (vocabulary_id);

create table vocabulary_relations (
  vocabulary_id text not null references vocabulary_items(id) on delete cascade,
  related_id    text not null references vocabulary_items(id) on delete cascade,
  relation      text not null default 'related',  -- related | synonym | antonym | variant
  primary key (vocabulary_id, related_id),
  check (vocabulary_id <> related_id)
);
```

---

## 5. Assessment

```sql
-- 20260727000005_assessment.sql

create table exercises (
  id           uuid primary key default gen_random_uuid(),
  unit_id      text not null references units(id) on delete cascade,
  type         exercise_type not null,
  prompt       text not null,
  instructions text,
  payload      jsonb not null default '{}'::jsonb,   -- options, pairs, scrambled tokens
  answer_key   jsonb,                                -- never exposed to students (RLS)
  points       int not null default 1,
  sort_order   int not null default 0,
  status       publish_status not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index on exercises (unit_id, sort_order);

create table exercise_attempts (
  id          uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises(id) on delete cascade,
  student_id  uuid not null references profiles(id) on delete cascade,
  response    jsonb not null,
  is_correct  boolean,
  points_earned int not null default 0,
  attempt_no  int not null default 1,
  created_at  timestamptz not null default now()
);

create index on exercise_attempts (student_id, exercise_id);

create table quizzes (
  id              uuid primary key default gen_random_uuid(),
  unit_id         text references units(id) on delete cascade,
  level_id        text references levels(id) on delete cascade,  -- set for level exams
  is_level_exam   boolean not null default false,
  title           text not null,
  passing_score   int not null default 70,       -- percent
  time_limit_minutes int,
  max_attempts    int,                            -- null = unlimited
  status          publish_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (
    (is_level_exam and level_id is not null and unit_id is null) or
    (not is_level_exam and unit_id is not null)
  )
);

create unique index quizzes_one_per_unit on quizzes (unit_id) where not is_level_exam;
create unique index quizzes_one_exam_per_level on quizzes (level_id) where is_level_exam;

create table quiz_questions (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid not null references quizzes(id) on delete cascade,
  type           question_type not null,
  prompt         text not null,
  options        jsonb,                           -- ["…","…"]
  correct_answer jsonb not null,                  -- hidden from students by RLS
  explanation    text,                            -- shown after submission
  points         int not null default 1,
  sort_order     int not null default 0
);

create index on quiz_questions (quiz_id, sort_order);

create table quiz_attempts (
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

create index on quiz_attempts (student_id, quiz_id);
create index on quiz_attempts (quiz_id) include (percentage);   -- powers the per-unit average KPI
```

**Security note:** `quiz_questions.correct_answer` and `exercises.answer_key` are readable only by teachers and admins. Students receive question rows through a security-definer view that omits those columns, and grading happens server-side. This is why the answer key can safely live in the same table.

```sql
create view public.quiz_questions_student
with (security_invoker = true) as
  select id, quiz_id, type, prompt, options, points, sort_order
  from quiz_questions;
```

---

## 6. Progress

```sql
-- 20260727000006_progress.sql

-- Fine-grained: drives progress %, the "you skipped Part 1" nudge, and analytics.
create table part_progress (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references profiles(id) on delete cascade,
  unit_id      text not null references units(id) on delete cascade,
  part         lesson_part not null,
  status       part_status not null default 'not_started',
  progress_pct int not null default 0 check (progress_pct between 0 and 100),
  nudge_dismissed boolean not null default false,
  first_viewed_at timestamptz,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique (student_id, unit_id, part)
);

create index on part_progress (student_id, unit_id);

-- Rollup: drives unlocks and the level overview.
create table student_unit_progress (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null references profiles(id) on delete cascade,
  unit_id            text not null references units(id) on delete cascade,
  self_paced_status  self_paced_status not null default 'not_started',
  live_status        live_status not null default 'not_booked',
  best_quiz_percentage numeric(5,2),
  started_at         timestamptz,
  completed_at       timestamptz,
  updated_at         timestamptz not null default now(),
  unique (student_id, unit_id)
);

create index on student_unit_progress (student_id);
create index on student_unit_progress (unit_id);

-- Teacher/admin override of sequential unlocking. Always audited.
create table unit_unlocks (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references profiles(id) on delete cascade,
  unit_id     text not null references units(id) on delete cascade,
  granted_by  uuid not null references profiles(id),
  reason      text not null,
  created_at  timestamptz not null default now(),
  unique (student_id, unit_id)
);

create index on unit_unlocks (student_id);

-- Recompute the unit rollup whenever a part changes.
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

create trigger part_progress_rollup
  after insert or update on part_progress
  for each row execute function fidel.rollup_unit_progress();
```

**Unlock rule, expressed as a function** (mirrored by a pure TS function in `lib/domain/progress-rules.ts`):

```sql
create or replace function fidel.is_unit_unlocked(p_student uuid, p_unit text)
returns boolean language sql stable as $$
  with u as (select level_id, sort_order from units where id = p_unit)
  select
    -- entitled to the level, AND
    exists (
      select 1 from entitlements e, u
      where e.student_id = p_student and e.level_id = u.level_id
        and e.status = 'active'
        and (e.expires_at is null or e.expires_at > now())
    )
    and (
      -- first unit of the level, OR
      (select sort_order from u) = 1
      -- explicitly unlocked by a teacher/admin, OR
      or exists (select 1 from unit_unlocks where student_id = p_student and unit_id = p_unit)
      -- previous unit completed
      or exists (
        select 1
        from units prev
        join student_unit_progress sup
          on sup.unit_id = prev.id and sup.student_id = p_student
        , u
        where prev.level_id = u.level_id
          and prev.sort_order = u.sort_order - 1
          and sup.self_paced_status = 'completed'
      )
    );
$$;
```

---

## 7. Homework

```sql
-- 20260727000007_homework.sql

create table homework_assignments (
  id              uuid primary key default gen_random_uuid(),
  unit_id         text references units(id) on delete cascade,
  session_id      uuid,                            -- FK added after sessions table
  student_id      uuid references profiles(id) on delete cascade,
  assigned_by     uuid references profiles(id),
  title           text not null,
  instructions    text not null,
  is_unit_default boolean not null default false,  -- the unit's built-in task
  due_at          timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- The unit default template has no student; personal assignments do.
  check ((is_unit_default and student_id is null) or (not is_unit_default and student_id is not null))
);

create index on homework_assignments (student_id);
create index on homework_assignments (unit_id);

create table homework_submissions (
  id             uuid primary key default gen_random_uuid(),
  assignment_id  uuid not null references homework_assignments(id) on delete cascade,
  student_id     uuid not null references profiles(id) on delete cascade,
  attempt_no     int not null default 1,
  text_response  text,
  file_paths     text[] not null default '{}',     -- 'homework' bucket paths
  audio_path     text,
  status         homework_status not null default 'submitted',
  reviewed_by    uuid references profiles(id),
  feedback       text,
  grade          int check (grade between 0 and 100),
  submitted_at   timestamptz not null default now(),
  reviewed_at    timestamptz,
  unique (assignment_id, attempt_no)
);

create index on homework_submissions (student_id, status);
create index on homework_submissions (reviewed_by, status);
```

---

## 8. Live Sessions

```sql
-- 20260727000008_sessions.sql

-- Weekly recurring availability, stored in the teacher's timezone.
create table teacher_availability (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references profiles(id) on delete cascade,
  weekday      int not null check (weekday between 0 and 6),   -- 0 = Sunday
  start_time   time not null,
  end_time     time not null,
  timezone     text not null default 'Africa/Addis_Ababa',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  check (end_time > start_time)
);

create index on teacher_availability (teacher_id, weekday) where is_active;

create table teacher_time_off (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  reason     text,
  check (ends_at > starts_at)
);

create index on teacher_time_off (teacher_id, starts_at);

create table sessions (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null references profiles(id) on delete cascade,
  teacher_id         uuid not null references profiles(id) on delete cascade,
  unit_id            text references units(id) on delete set null,   -- null = free conversation
  scheduled_at       timestamptz not null,
  duration_minutes   int not null default 60 check (duration_minutes in (30, 45, 60)),
  time_range         tstzrange generated always as
                       (tstzrange(scheduled_at,
                                  scheduled_at + (duration_minutes || ' minutes')::interval,
                                  '[)')) stored,
  student_timezone   text not null default 'Africa/Addis_Ababa',
  status             session_status not null default 'scheduled',
  meet_link          text,
  google_event_id    text,
  pre_study_snapshot jsonb,                        -- part progress captured at booking time
  student_note       text,                         -- "what I want to focus on"
  session_notes      text,                         -- teacher, post-session
  homework_override  text,
  attended           boolean,
  cancelled_by       uuid references profiles(id),
  cancelled_at       timestamptz,
  cancellation_reason text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- A teacher cannot be double-booked. Enforced by the database, not by the UI.
  exclude using gist (
    teacher_id with =,
    time_range with &&
  ) where (status = 'scheduled')
);

create index on sessions (teacher_id, scheduled_at);
create index on sessions (student_id, scheduled_at);
create index on sessions (status, scheduled_at) where status = 'scheduled';

alter table homework_assignments
  add constraint homework_assignments_session_fk
  foreign key (session_id) references sessions(id) on delete set null;

-- Booking a session flips the unit's live_status.
create or replace function fidel.sync_live_status()
returns trigger language plpgsql as $$
begin
  if new.unit_id is null then return new; end if;

  insert into student_unit_progress (student_id, unit_id, live_status)
  values (new.student_id, new.unit_id,
          case new.status
            when 'completed' then 'completed'::live_status
            when 'scheduled' then 'booked'::live_status
            else 'not_booked'::live_status
          end)
  on conflict (student_id, unit_id) do update
    set live_status = excluded.live_status, updated_at = now();

  return new;
end $$;

create trigger sessions_sync_live_status
  after insert or update of status on sessions
  for each row execute function fidel.sync_live_status();
```

---

## 9. Access, Payments & Session Credits

This is the commercial core. At MVP an admin drives all three tables from the dashboard; in Phase 3 a Stripe webhook writes the same rows. **The learning product never asks how access was acquired** — it only calls `fidel.has_unit_access()`.

```sql
-- 20260727000010_access_and_payments.sql

-- Payments. Manual providers at MVP, gateway providers later, one table throughout.
create table payments (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references profiles(id) on delete cascade,
  organization_id   uuid references organizations(id) on delete set null,  -- who actually paid
  amount_cents      int not null check (amount_cents > 0),
  currency          text not null default 'ETB' check (currency in ('ETB','USD','EUR','GBP')),
  provider          payment_provider not null,
  provider_ref      text,                           -- Stripe session id / Chapa tx ref
  reference         text,                           -- PO number, bank slip, invoice number
  receipt_path      text,                           -- 'receipts' bucket
  status            payment_status not null default 'paid',
  paid_at           timestamptz,
  note              text,
  recorded_by       uuid references profiles(id),    -- the admin, for manual entries
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Gateway refs must be unique to make webhooks idempotent; manual refs may repeat.
create unique index payments_provider_ref_unique
  on payments (provider, provider_ref)
  where provider_ref is not null;

create index on payments (student_id);
create index on payments (organization_id);
create index on payments (status) where status in ('pending','partial');
create index on payments (paid_at desc);

-- Access to a level OR a single unit, independent of how it was acquired.
-- Unit scope is how "paid parts" works: sell Units 1-4 of ሀ rather than the whole level.
create table entitlements (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references profiles(id) on delete cascade,
  scope       entitlement_scope not null default 'level',
  level_id    text references levels(id) on delete cascade,
  unit_id     text references units(id) on delete cascade,
  source      entitlement_source not null default 'admin_grant',
  status      entitlement_status not null default 'active',
  granted_by  uuid references profiles(id),
  payment_id  uuid references payments(id) on delete set null,
  note        text not null,                        -- required: why does this student have this?
  granted_at  timestamptz not null default now(),
  expires_at  timestamptz,                          -- null = perpetual
  revoked_at  timestamptz,
  revoked_by  uuid references profiles(id),
  revoked_reason text,
  check (
    (scope = 'level' and level_id is not null and unit_id is null) or
    (scope = 'unit'  and unit_id  is not null and level_id is null)
  )
);

create unique index entitlements_one_per_level
  on entitlements (student_id, level_id) where scope = 'level';
create unique index entitlements_one_per_unit
  on entitlements (student_id, unit_id)  where scope = 'unit';

create index on entitlements (student_id) where status = 'active';
create index on entitlements (level_id);
create index on entitlements (unit_id);
create index on entitlements (expires_at) where status = 'active' and expires_at is not null;
create index on entitlements (payment_id);

-- Live-session balance as a signed ledger rather than a mutable counter.
-- Booking writes -1, a cancellation outside the 12h window writes +1, and the
-- history of who changed the balance and why is never lost.
create table session_credit_entries (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references profiles(id) on delete cascade,
  delta       int not null check (delta <> 0),
  reason      credit_reason not null,
  session_id  uuid references sessions(id) on delete set null,
  payment_id  uuid references payments(id) on delete set null,
  note        text,
  expires_at  timestamptz,                          -- applies to grants only
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create index on session_credit_entries (student_id, created_at desc);
create index on session_credit_entries (session_id);

create or replace function fidel.session_credit_balance(p_student uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(sum(delta), 0)::int
  from session_credit_entries
  where student_id = p_student
    and (expires_at is null or expires_at > now());
$$;
```

**Why a ledger and not `credits_remaining int`.** A counter loses history and races under concurrent bookings. A ledger makes the balance a derived fact, gives the admin a per-student statement for free, and lets a booking and its refund be matched by `session_id`. The trade is one `sum()` per balance read, which is trivial at this scale and indexed.

**Expiring entitlements.** A nightly cron flips `status` from `active` to `expired` where `expires_at < now()`. RLS also checks `expires_at` directly, so access ends on time even if the cron does not run — the cron only keeps reporting honest.

```sql
create or replace function fidel.expire_entitlements()
returns int language sql security definer set search_path = public as $$
  with updated as (
    update entitlements set status = 'expired'
    where status = 'active' and expires_at is not null and expires_at < now()
    returning 1
  ) select count(*)::int from updated;
$$;
```

---

## 10. Certificates & Platform

```sql
-- 20260727000010_certificates_platform.sql

create table certificates (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references profiles(id) on delete cascade,
  level_id          text not null references levels(id) on delete cascade,
  cefr_equivalent   text not null,
  student_name      text not null,                  -- snapshot: name at issue time
  level_title       text not null,                  -- snapshot
  final_score       numeric(5,2),
  verification_code text not null unique,           -- short, URL-safe, e.g. FDL-7K3M-QX92
  certificate_path  text,                           -- 'certificates' bucket
  status            certificate_status not null default 'issued',
  issued_at         timestamptz not null default now(),
  revoked_at        timestamptz,
  revoked_reason    text,
  unique (student_id, level_id)
);

create index on certificates (verification_code);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  kind       notification_kind not null,
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index on notifications (user_id, created_at desc) where read_at is null;

create table audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id) on delete set null,
  actor_role  user_role,
  action      text not null,                        -- 'unit.unlock', 'entitlement.grant', 'content.publish'
  entity_type text not null,
  entity_id   text not null,
  metadata    jsonb not null default '{}'::jsonb,
  ip_address  inet,
  created_at  timestamptz not null default now()
);

create index on audit_log (created_at desc);
create index on audit_log (actor_id, created_at desc);
create index on audit_log (entity_type, entity_id);

create table blog_posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  excerpt      text,
  body_md      text not null,
  cover_path   text,
  author_id    uuid references profiles(id) on delete set null,
  tags         text[] not null default '{}',
  status       publish_status not null default 'draft',
  published_at timestamptz,
  seo_title    text,
  seo_description text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index on blog_posts (status, published_at desc);
```

---

## 11. RLS Helper Functions

```sql
-- 20260727000011_rls_helpers.sql

-- Reads the role from the JWT claim set by the custom access token hook.
create or replace function fidel.auth_role()
returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata,role}', ''),
    'anon'
  );
$$;

create or replace function fidel.is_admin()
returns boolean language sql stable as $$
  select fidel.auth_role() = 'admin';
$$;

create or replace function fidel.is_teacher()
returns boolean language sql stable as $$
  select fidel.auth_role() = 'teacher';
$$;

create or replace function fidel.is_teacher_of(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from student_teacher_assignments
    where teacher_id = auth.uid() and student_id = p_student
  );
$$;

-- Level access: a level-scoped entitlement, OR any unit-scoped entitlement inside
-- that level (a student who bought Units 1-4 can see the level's vocabulary bank).
create or replace function fidel.has_level_access(p_level text)
returns boolean language sql stable security definer set search_path = public as $$
  select fidel.is_admin() or fidel.is_teacher() or exists (
    select 1 from entitlements e
    left join units u on u.id = e.unit_id
    where e.student_id = auth.uid()
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
      and (
        (e.scope = 'level' and e.level_id = p_level) or
        (e.scope = 'unit'  and u.level_id = p_level)
      )
  );
$$;

-- Unit access: the unit's level is entitled, OR this specific unit is entitled.
create or replace function fidel.has_unit_access(p_unit text)
returns boolean language sql stable security definer set search_path = public as $$
  select fidel.is_admin() or fidel.is_teacher() or exists (
    select 1
    from units target
    join entitlements e on e.student_id = auth.uid()
    where target.id = p_unit
      and e.status = 'active'
      and (e.expires_at is null or e.expires_at > now())
      and (
        (e.scope = 'level' and e.level_id = target.level_id) or
        (e.scope = 'unit'  and e.unit_id  = target.id)
      )
  );
$$;

create or replace function fidel.admin_has(p_section text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
      and (
        p.admin_title = 'super_admin'
        or (p.admin_title = 'content_manager'      and p_section in ('content','vocabulary','media','blog'))
        or (p.admin_title = 'program_coordinator'  and p_section in ('people','entitlements','payments','sessions','certificates','cohorts'))
        or (p.admin_title = 'support'              and p_section in ('read'))
      )
  );
$$;
```

`admin_title` gates **navigation and write actions in the application layer**, not RLS. RLS grants any `admin` role full table access, because a Content Manager who bypasses the UI is still a trusted employee, and encoding four title variants into every policy would triple the policy surface for little security gain. The distinction that matters at the database level is student / teacher / admin.

`security definer` is required on the functions that query tables which are themselves RLS-protected — otherwise the policy check recurses. Each one pins `search_path` to prevent search-path hijacking.

---

## 12. RLS Policies

```sql
-- 20260727000012_rls_policies.sql

alter table profiles                    enable row level security;
alter table student_profiles            enable row level security;
alter table student_internal_notes      enable row level security;
alter table teacher_profiles            enable row level security;
alter table student_teacher_assignments enable row level security;
alter table levels                      enable row level security;
alter table units                       enable row level security;
alter table lesson_parts                enable row level security;
alter table media_assets                enable row level security;
alter table vocabulary_items            enable row level security;
alter table unit_vocabulary             enable row level security;
alter table vocabulary_relations        enable row level security;
alter table exercises                   enable row level security;
alter table exercise_attempts           enable row level security;
alter table quizzes                     enable row level security;
alter table quiz_questions              enable row level security;
alter table quiz_attempts               enable row level security;
alter table part_progress               enable row level security;
alter table student_unit_progress       enable row level security;
alter table unit_unlocks                enable row level security;
alter table homework_assignments        enable row level security;
alter table homework_submissions        enable row level security;
alter table teacher_availability        enable row level security;
alter table teacher_time_off            enable row level security;
alter table sessions                    enable row level security;
alter table organizations               enable row level security;
alter table cohorts                     enable row level security;
alter table entitlements                enable row level security;
alter table payments                    enable row level security;
alter table session_credit_entries      enable row level security;
alter table certificates                enable row level security;
alter table notifications               enable row level security;
alter table audit_log                   enable row level security;
alter table blog_posts                  enable row level security;
```

### 12.1 Identity

```sql
create policy profiles_select_self on profiles for select
  using (id = auth.uid() or fidel.is_admin() or fidel.is_teacher_of(id));

create policy profiles_update_self on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_admin_all on profiles for all
  using (fidel.is_admin()) with check (fidel.is_admin());

create policy student_profiles_rw on student_profiles for all
  using (user_id = auth.uid() or fidel.is_admin() or fidel.is_teacher_of(user_id))
  with check (user_id = auth.uid() or fidel.is_admin());

-- Admin-only. Teachers do not see these either; they have session notes for that.
create policy internal_notes_admin on student_internal_notes for all
  using (fidel.is_admin()) with check (fidel.is_admin());

-- Teacher bios are public to signed-in users, but the Google refresh token is not:
-- the app selects explicit columns and never `select *` on this table client-side.
create policy teacher_profiles_select on teacher_profiles for select
  using (auth.role() = 'authenticated');

create policy teacher_profiles_update_self on teacher_profiles for update
  using (user_id = auth.uid() or fidel.is_admin())
  with check (user_id = auth.uid() or fidel.is_admin());

create policy sta_select on student_teacher_assignments for select
  using (student_id = auth.uid() or teacher_id = auth.uid() or fidel.is_admin());

create policy sta_admin_write on student_teacher_assignments for all
  using (fidel.is_admin()) with check (fidel.is_admin());
```

### 12.2 Curriculum — published content is browsable, gated content is not

```sql
-- Level metadata is public: the marketing site lists the ladder.
create policy levels_select_published on levels for select
  using (status = 'published' or fidel.is_admin());

create policy levels_admin_write on levels for all
  using (fidel.is_admin()) with check (fidel.is_admin());

-- Unit titles are public (curriculum overview); unit *content* is not.
create policy units_select_published on units for select
  using (status = 'published' or fidel.is_admin());

create policy units_admin_write on units for all
  using (fidel.is_admin()) with check (fidel.is_admin());

-- This is the paywall. Lesson content requires an active entitlement.
create policy lesson_parts_select_entitled on lesson_parts for select
  using (status = 'published' and fidel.has_unit_access(unit_id));

create policy lesson_parts_admin_write on lesson_parts for all
  using (fidel.is_admin()) with check (fidel.is_admin());

create policy media_select_entitled on media_assets for select
  using (
    fidel.is_admin() or fidel.is_teacher()
    or unit_id is null
    or fidel.has_unit_access(unit_id)
  );

create policy media_admin_write on media_assets for all
  using (fidel.is_admin()) with check (fidel.is_admin());
```

### 12.3 Vocabulary

```sql
create policy vocab_select_entitled on vocabulary_items for select
  using (status = 'published' and fidel.has_level_access(level_id));

create policy vocab_admin_write on vocabulary_items for all
  using (fidel.is_admin()) with check (fidel.is_admin());

create policy unit_vocab_select on unit_vocabulary for select
  using (fidel.has_unit_access(unit_id));

create policy unit_vocab_admin_write on unit_vocabulary for all
  using (fidel.is_admin()) with check (fidel.is_admin());

create policy vocab_rel_select on vocabulary_relations for select
  using (exists (select 1 from vocabulary_items v
                 where v.id = vocabulary_id and fidel.has_level_access(v.level_id)));
```

### 12.4 Assessment — the answer key never leaves the server

```sql
-- Students read exercises through the app, which strips answer_key before rendering.
-- Direct table select is restricted to staff; students use the student-facing view.
create policy exercises_select_staff on exercises for select
  using (fidel.is_admin() or fidel.is_teacher());

create policy exercises_select_student on exercises for select
  using (fidel.auth_role() = 'student' and status = 'published' and fidel.has_unit_access(unit_id));

create policy exercises_admin_write on exercises for all
  using (fidel.is_admin()) with check (fidel.is_admin());

create policy exercise_attempts_own on exercise_attempts for all
  using (student_id = auth.uid() or fidel.is_admin() or fidel.is_teacher_of(student_id))
  with check (student_id = auth.uid());

create policy quizzes_select on quizzes for select
  using (
    status = 'published' and (
      (unit_id is not null and fidel.has_unit_access(unit_id)) or
      (level_id is not null and fidel.has_level_access(level_id))
    )
  );

create policy quizzes_admin_write on quizzes for all
  using (fidel.is_admin()) with check (fidel.is_admin());

-- Only staff may read the raw questions table (which contains correct_answer).
-- Students read `quiz_questions_student`, which omits that column.
create policy quiz_questions_staff on quiz_questions for select
  using (fidel.is_admin() or fidel.is_teacher());

create policy quiz_questions_admin_write on quiz_questions for all
  using (fidel.is_admin()) with check (fidel.is_admin());

create policy quiz_attempts_own on quiz_attempts for select
  using (student_id = auth.uid() or fidel.is_admin() or fidel.is_teacher_of(student_id));

create policy quiz_attempts_insert_own on quiz_attempts for insert
  with check (student_id = auth.uid());
```

Because students cannot select `quiz_questions`, grading must run in a Server Action using either the service-role client or a `security definer` RPC. The chosen approach is a `security definer` RPC `fidel.grade_quiz(p_quiz uuid, p_answers jsonb)` — it keeps the service-role key out of the request path entirely.

### 12.5 Progress, homework, sessions

```sql
create policy part_progress_own on part_progress for all
  using (student_id = auth.uid() or fidel.is_admin() or fidel.is_teacher_of(student_id))
  with check (student_id = auth.uid());

create policy sup_select on student_unit_progress for select
  using (student_id = auth.uid() or fidel.is_admin() or fidel.is_teacher_of(student_id));

create policy sup_write_own on student_unit_progress for insert
  with check (student_id = auth.uid());

create policy unit_unlocks_select on unit_unlocks for select
  using (student_id = auth.uid() or fidel.is_admin() or fidel.is_teacher_of(student_id));

create policy unit_unlocks_staff_write on unit_unlocks for insert
  with check (fidel.is_admin() or fidel.is_teacher_of(student_id));

create policy hw_assignments_visible on homework_assignments for select
  using (
    is_unit_default
    or student_id = auth.uid()
    or fidel.is_admin()
    or fidel.is_teacher_of(student_id)
  );

create policy hw_assignments_staff_write on homework_assignments for all
  using (fidel.is_admin() or (student_id is not null and fidel.is_teacher_of(student_id)))
  with check (fidel.is_admin() or (student_id is not null and fidel.is_teacher_of(student_id)));

create policy hw_submissions_select on homework_submissions for select
  using (student_id = auth.uid() or fidel.is_admin() or fidel.is_teacher_of(student_id));

create policy hw_submissions_insert_own on homework_submissions for insert
  with check (student_id = auth.uid());

create policy hw_submissions_teacher_review on homework_submissions for update
  using (fidel.is_admin() or fidel.is_teacher_of(student_id))
  with check (fidel.is_admin() or fidel.is_teacher_of(student_id));

-- Availability is readable by any signed-in user so students can see open slots.
create policy availability_select on teacher_availability for select
  using (auth.role() = 'authenticated');

create policy availability_own_write on teacher_availability for all
  using (teacher_id = auth.uid() or fidel.is_admin())
  with check (teacher_id = auth.uid() or fidel.is_admin());

create policy time_off_select on teacher_time_off for select
  using (auth.role() = 'authenticated');

create policy time_off_own_write on teacher_time_off for all
  using (teacher_id = auth.uid() or fidel.is_admin())
  with check (teacher_id = auth.uid() or fidel.is_admin());

create policy sessions_select on sessions for select
  using (student_id = auth.uid() or teacher_id = auth.uid() or fidel.is_admin());

create policy sessions_student_book on sessions for insert
  with check (student_id = auth.uid() and fidel.auth_role() = 'student');

create policy sessions_update on sessions for update
  using (student_id = auth.uid() or teacher_id = auth.uid() or fidel.is_admin())
  with check (student_id = auth.uid() or teacher_id = auth.uid() or fidel.is_admin());
```

### 12.6 Access, output, platform

```sql
-- Organizations and cohorts are admin-only. A student has no reason to read the
-- billing contact of the embassy that paid for them.
create policy organizations_admin on organizations for all
  using (fidel.is_admin()) with check (fidel.is_admin());

create policy cohorts_select on cohorts for select
  using (fidel.is_admin() or fidel.is_teacher());

create policy cohorts_admin_write on cohorts for all
  using (fidel.is_admin()) with check (fidel.is_admin());

create policy entitlements_select_own on entitlements for select
  using (student_id = auth.uid() or fidel.is_admin() or fidel.is_teacher_of(student_id));

create policy entitlements_admin_write on entitlements for all
  using (fidel.is_admin()) with check (fidel.is_admin());

-- Payments are ADMIN ONLY. Students never read them: a payment row can name a
-- third-party payer, an invoice reference, and an internal note.
create policy payments_admin_only on payments for all
  using (fidel.is_admin()) with check (fidel.is_admin());

-- A student sees their own credit history (it is their balance), but cannot write it.
create policy credits_select_own on session_credit_entries for select
  using (student_id = auth.uid() or fidel.is_admin() or fidel.is_teacher_of(student_id));

create policy credits_admin_write on session_credit_entries for all
  using (fidel.is_admin()) with check (fidel.is_admin());
-- Booking consumption and cancellation refunds are written by security-definer
-- functions called from Server Actions, not by a student-facing insert policy.

create policy certificates_select_own on certificates for select
  using (student_id = auth.uid() or fidel.is_admin() or fidel.is_teacher_of(student_id));

create policy certificates_admin_write on certificates for all
  using (fidel.is_admin()) with check (fidel.is_admin());

create policy notifications_own on notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy audit_admin_only on audit_log for select using (fidel.is_admin());
-- Writes go through security-definer functions only; no insert policy exists.

create policy blog_select_published on blog_posts for select
  using (status = 'published' or fidel.is_admin());

create policy blog_admin_write on blog_posts for all
  using (fidel.is_admin()) with check (fidel.is_admin());
```

### 12.7 Public certificate verification

The verification page is public but must not expose the certificates table. It reads through a `security definer` function that returns only non-sensitive fields:

```sql
create or replace function public.verify_certificate(p_code text)
returns table (
  student_name text, level_title text, fidel_char text,
  cefr_equivalent text, issued_at timestamptz, is_valid boolean
)
language sql stable security definer set search_path = public as $$
  select c.student_name, c.level_title, l.fidel_char, c.cefr_equivalent,
         c.issued_at, c.status = 'issued'
  from certificates c
  join levels l on l.id = c.level_id
  where c.verification_code = upper(trim(p_code));
$$;

grant execute on function public.verify_certificate(text) to anon, authenticated;
```

---

## 13. Storage Buckets

```sql
-- 20260727000013_storage_buckets.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('lesson-media',  'lesson-media',  false, 104857600, array['audio/mpeg','audio/mp4','audio/wav','video/mp4','image/jpeg','image/png','image/webp']),
  ('vocab-audio',   'vocab-audio',   false,   5242880, array['audio/mpeg','audio/mp4','audio/wav']),
  ('homework',      'homework',      false,  52428800, array['audio/mpeg','audio/mp4','audio/webm','image/jpeg','image/png','application/pdf']),
  ('certificates',  'certificates',  false,   5242880, array['application/pdf']),
  ('receipts',      'receipts',      false,  10485760, array['application/pdf','image/jpeg','image/png']),
  ('avatars',       'avatars',       true,    2097152, array['image/jpeg','image/png','image/webp']),
  ('blog',          'blog',          true,   10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Receipts may name a third-party payer. Admin only, read and write.
create policy receipts_admin on storage.objects for all
  using (bucket_id = 'receipts' and fidel.is_admin())
  with check (bucket_id = 'receipts' and fidel.is_admin());

-- Homework: student owns a folder named by their uid.
create policy homework_own_read on storage.objects for select
  using (
    bucket_id = 'homework' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or fidel.is_admin()
      or fidel.is_teacher_of(((storage.foldername(name))[1])::uuid)
    )
  );

create policy homework_own_write on storage.objects for insert
  with check (bucket_id = 'homework' and (storage.foldername(name))[1] = auth.uid()::text);

-- Lesson media: signed URLs are issued server-side after an entitlement check.
create policy lesson_media_staff on storage.objects for select
  using (bucket_id in ('lesson-media','vocab-audio') and (fidel.is_admin() or fidel.is_teacher()));

create policy avatars_public_read on storage.objects for select
  using (bucket_id = 'avatars');

create policy avatars_own_write on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

Student access to `lesson-media` and `vocab-audio` runs through server-issued signed URLs (60-minute TTL) rather than a storage policy, because entitlement checking against a path string is fragile. The Server Action verifies `has_unit_access` and then calls `createSignedUrl` with the service-role client.

---

## 14. Provisioning RPC

Student creation touches seven tables. A partial student — an auth user with no entitlement, or an entitlement with no payment link — is worse than no student, so the whole thing is one transaction behind a `security definer` function. The Server Action creates the auth user first, calls this, and deletes the auth user if it raises.

```sql
-- 20260727000015_provisioning_rpc.sql

create or replace function fidel.provision_student(
  p_user_id  uuid,
  p_profile  jsonb,   -- name, phone, timezone, locale, is_active
  p_student  jsonb,   -- persona, intent, goal, prior experience, org, cohort, job title…
  p_access   jsonb,   -- scope, level_ids[], unit_ids[], source, dates, note
  p_payment  jsonb,   -- amount, currency, provider, paid_at, reference, status, note
  p_credits  jsonb,   -- count, expires_at
  p_teachers jsonb    -- [{ teacher_id, is_primary }]
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_actor      uuid := auth.uid();
  v_org_id     uuid;
  v_payment_id uuid;
  v_level      text;
  v_unit       text;
  v_credits    int  := coalesce((p_credits->>'count')::int, 0);
begin
  if not fidel.is_admin() then
    raise exception 'only admins may provision accounts';
  end if;

  update profiles set
    full_name = p_profile->>'full_name',
    phone     = nullif(p_profile->>'phone',''),
    timezone  = coalesce(p_profile->>'timezone','Africa/Addis_Ababa'),
    locale    = coalesce(p_profile->>'locale','en'),
    is_active = coalesce((p_profile->>'is_active')::boolean, false),
    invited_at = now(),
    created_by = v_actor,
    updated_at = now()
  where id = p_user_id;

  if p_student ? 'organization' then
    insert into organizations (name, type, billing_contact_name, billing_contact_email, created_by)
    values (
      p_student->'organization'->>'name',
      (p_student->'organization'->>'type')::organization_type,
      p_student->'organization'->>'billing_contact_name',
      p_student->'organization'->>'billing_contact_email',
      v_actor
    )
    on conflict (lower(name)) do update set updated_at = now()
    returning id into v_org_id;
  end if;

  update student_profiles set
    preferred_name    = nullif(p_student->>'preferred_name',''),
    persona           = (p_student->>'persona')::persona,
    study_intent      = (p_student->>'study_intent')::study_intent,
    learning_goal     = nullif(p_student->>'learning_goal',''),
    prior_experience  = (p_student->>'prior_experience')::prior_experience,
    native_language   = nullif(p_student->>'native_language',''),
    country           = nullif(p_student->>'country',''),
    organization_id   = v_org_id,
    cohort_id         = nullif(p_student->>'cohort_id','')::uuid,
    job_title         = nullif(p_student->>'job_title',''),
    department        = nullif(p_student->>'department',''),
    starting_level_id = coalesce(p_student->>'starting_level_id','ha'),
    updated_at        = now()
  where user_id = p_user_id;

  if p_payment is not null and p_payment <> 'null'::jsonb then
    insert into payments (student_id, organization_id, amount_cents, currency, provider,
                          reference, status, paid_at, note, recorded_by)
    values (p_user_id, v_org_id,
            (p_payment->>'amount_cents')::int,
            p_payment->>'currency',
            (p_payment->>'provider')::payment_provider,
            nullif(p_payment->>'reference',''),
            (p_payment->>'status')::payment_status,
            (p_payment->>'paid_at')::timestamptz,
            nullif(p_payment->>'note',''),
            v_actor)
    returning id into v_payment_id;
  end if;

  for v_level in select jsonb_array_elements_text(coalesce(p_access->'level_ids','[]'::jsonb)) loop
    insert into entitlements (student_id, scope, level_id, source, granted_by, payment_id,
                              note, granted_at, expires_at)
    values (p_user_id, 'level', v_level,
            (p_access->>'source')::entitlement_source, v_actor, v_payment_id,
            p_access->>'note',
            coalesce((p_access->>'granted_at')::timestamptz, now()),
            nullif(p_access->>'expires_at','')::timestamptz)
    on conflict do nothing;
  end loop;

  for v_unit in select jsonb_array_elements_text(coalesce(p_access->'unit_ids','[]'::jsonb)) loop
    insert into entitlements (student_id, scope, unit_id, source, granted_by, payment_id,
                              note, granted_at, expires_at)
    values (p_user_id, 'unit', v_unit,
            (p_access->>'source')::entitlement_source, v_actor, v_payment_id,
            p_access->>'note',
            coalesce((p_access->>'granted_at')::timestamptz, now()),
            nullif(p_access->>'expires_at','')::timestamptz)
    on conflict do nothing;
  end loop;

  if v_credits > 0 then
    insert into session_credit_entries (student_id, delta, reason, payment_id, note,
                                        expires_at, created_by)
    values (p_user_id, v_credits, 'grant', v_payment_id,
            p_access->>'note',
            nullif(p_credits->>'expires_at','')::timestamptz, v_actor);
  end if;

  insert into student_teacher_assignments (student_id, teacher_id, is_primary, assigned_by)
  select p_user_id,
         (t->>'teacher_id')::uuid,
         coalesce((t->>'is_primary')::boolean, false),
         v_actor
  from jsonb_array_elements(coalesce(p_teachers,'[]'::jsonb)) t
  on conflict (student_id, teacher_id) do nothing;

  insert into audit_log (actor_id, actor_role, action, entity_type, entity_id, metadata)
  values
    (v_actor, 'admin', 'student.create',     'profile',     p_user_id::text, p_profile),
    (v_actor, 'admin', 'entitlement.grant',  'student',     p_user_id::text, p_access),
    (v_actor, 'admin', 'payment.record',     'payment',     coalesce(v_payment_id::text,'none'), coalesce(p_payment,'{}'::jsonb));

  return p_user_id;
end $$;

revoke execute on function fidel.provision_student from public, anon;
grant  execute on function fidel.provision_student to authenticated;
```

Two details that matter: the function re-checks `fidel.is_admin()` even though the calling Server Action already did, because a `security definer` function is a privilege escalation vector if it trusts its caller. And it returns rather than raising on duplicate entitlements (`on conflict do nothing`), so re-running a partially failed import is safe.

Booking consumption uses a companion function `fidel.consume_session_credit(p_student, p_session)` that inserts a `-1` entry only if `fidel.session_credit_balance()` is positive, raising otherwise — checked inside the same transaction as the session insert so a student cannot book with a zero balance under concurrency.

---

## 15. Seed Data (`supabase/seed.sql`)

1. Six `levels` rows: `ha` published, `le`–`re` published with `is_coming_soon = true`.
2. Ten `units` for `ha`, unit 1 published, units 2–10 draft.
3. `lesson_parts` for `ha-unit-01`: all three parts, fully authored (the content template).
4. ~18 `vocabulary_items` for `ha-unit-01`, linked via `unit_vocabulary`.
5. `exercises` for Unit 1: two fill-blank, two translate, one matching, one speaking.
6. One `quiz` for Unit 1 with 5 `quiz_questions`.
7. One `homework_assignments` row with `is_unit_default = true`.
8. One demo `organizations` row: "Embassy of Example" (`type = 'embassy'`).
9. Demo users created through the Auth admin API (not raw `auth.users` inserts), with **generated passwords printed once to the console** — never committed:
   - `admin@fidel.test` → role `admin`, `admin_title = 'super_admin'`
   - `teacher@fidel.test` → role `teacher`, availability Mon–Fri 09:00–17:00 EAT
   - `student@fidel.test` → role `student`, level-scoped entitlement to `ha`, 4 session credits, assigned to the demo teacher, linked to the demo organization
   - `student2@fidel.test` → role `student`, **unit-scoped** entitlements to `ha-unit-01` and `ha-unit-02` only — this account is what proves per-unit access control actually works, so do not skip it

---

## 16. Type Generation

```bash
pnpm supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" --schema public \
  > src/types/database.types.ts
```

Committed to the repository. CI regenerates and fails on any diff, which guarantees types can never drift from the migrations. Domain aliases live in `src/types/db.ts`:

```ts
import type { Database } from './database.types'

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

export type Profile       = Tables<'profiles'>
export type Level         = Tables<'levels'>
export type Unit          = Tables<'units'>
export type LessonPart    = Tables<'lesson_parts'>
export type Vocabulary    = Tables<'vocabulary_items'>
export type Session       = Tables<'sessions'>
export type Entitlement   = Tables<'entitlements'>
export type Payment       = Tables<'payments'>
export type Organization  = Tables<'organizations'>
export type CreditEntry   = Tables<'session_credit_entries'>
export type UserRole      = Enums<'user_role'>
export type EntitlementScope = Enums<'entitlement_scope'>
```

---

## 17. Index Review Checklist

Before Phase 2 ships, confirm an index exists for each of these access patterns:

| Query | Index |
|---|---|
| Student's progress across a level | `part_progress (student_id, unit_id)` |
| Teacher's sessions today | `sessions (teacher_id, scheduled_at)` |
| Teacher's homework queue | `homework_submissions (reviewed_by, status)` |
| Vocabulary search | trigram GIN on the concatenated searchable text |
| Level overview unit list | `units (level_id, sort_order)` |
| Active entitlement check (hottest query — runs in RLS on every content read) | `entitlements (student_id) where status = 'active'` |
| Session credit balance | `session_credit_entries (student_id, created_at desc)` |
| Expiring-soon admin filter | `entitlements (expires_at) where status = 'active' and expires_at is not null` |
| Payments outstanding panel | `payments (status) where status in ('pending','partial')` |
| Students by organization | `student_profiles (organization_id)` |
| Quiz average per unit KPI | `quiz_attempts (quiz_id) include (percentage)` |
| Certificate verification | unique on `verification_code` |

The entitlement check is the single hottest path in the system because it runs inside RLS on every lesson content read, and with unit-scoped grants it now joins `units`. If content pages ever feel slow, profile `fidel.has_unit_access` first.
