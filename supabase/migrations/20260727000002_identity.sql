-- Identity: profiles, student/teacher profiles, assignments, auth hooks.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'student',
  admin_title admin_title,
  full_name text not null default '',
  avatar_url text,
  email text not null,
  phone text,
  timezone text not null default 'Africa/Addis_Ababa',
  locale text not null default 'en',
  welcome_seen_at timestamptz,
  invited_at timestamptz,
  activated_at timestamptz,
  is_active boolean not null default true,
  suspended_reason text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (admin_title is null or role = 'admin')
);

create index profiles_role_active_idx on profiles (role) where is_active;
create index profiles_created_by_idx on profiles (created_by);

create trigger profiles_touch_updated_at
  before update on profiles
  for each row execute function fidel.touch_updated_at();

create table student_profiles (
  user_id uuid primary key references profiles (id) on delete cascade,
  preferred_name text,
  persona persona not null default 'other',
  study_intent study_intent not null default 'steady',
  learning_goal text,
  prior_experience prior_experience not null default 'none',
  native_language text,
  other_languages text[] not null default '{}',
  country text,
  organization_id uuid,
  cohort_id uuid,
  job_title text,
  department text,
  preferred_days int[] not null default '{}',
  preferred_times text[] not null default '{}',
  starting_level_id text not null default 'ha',
  placement_level_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger student_profiles_touch_updated_at
  before update on student_profiles
  for each row execute function fidel.touch_updated_at();

create table student_internal_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  author_id uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index student_internal_notes_student_idx
  on student_internal_notes (student_id, created_at desc);

create table teacher_profiles (
  user_id uuid primary key references profiles (id) on delete cascade,
  headline text,
  bio text,
  years_experience int check (years_experience >= 0),
  languages_spoken text[] not null default '{}',
  hourly_rate_cents int,
  is_accepting_students boolean not null default true,
  google_refresh_token text,
  google_calendar_id text,
  google_connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger teacher_profiles_touch_updated_at
  before update on teacher_profiles
  for each row execute function fidel.touch_updated_at();

create table student_teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles (id) on delete cascade,
  teacher_id uuid not null references profiles (id) on delete cascade,
  is_primary boolean not null default false,
  assigned_by uuid references profiles (id),
  assigned_at timestamptz not null default now(),
  unique (student_id, teacher_id)
);

create index student_teacher_assignments_teacher_idx on student_teacher_assignments (teacher_id);
create index student_teacher_assignments_student_idx on student_teacher_assignments (student_id);

create or replace function fidel.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  insert into public.student_profiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function fidel.handle_new_user();

create or replace function fidel.guard_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') <> 'service_role'
     and coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') <> 'service_role' then
    raise exception 'role changes must go through admin tooling';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on profiles
  for each row execute function fidel.guard_role_change();

create or replace function fidel.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  user_role text;
begin
  select role::text into user_role from public.profiles where id = (event ->> 'user_id')::uuid;
  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(coalesce(user_role, 'student')));
  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant execute on function fidel.custom_access_token_hook to supabase_auth_admin;
grant usage on schema fidel to supabase_auth_admin;
grant select on table public.profiles to supabase_auth_admin;
revoke execute on function fidel.custom_access_token_hook from authenticated, anon, public;
