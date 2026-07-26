-- Minimal RLS for identity tables so auth shells can load safely.

create or replace function fidel.auth_role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb #>> '{app_metadata,role}', ''),
    'anon'
  );
$$;

create or replace function fidel.is_admin()
returns boolean
language sql
stable
as $$
  select fidel.auth_role() = 'admin';
$$;

create or replace function fidel.is_teacher()
returns boolean
language sql
stable
as $$
  select fidel.auth_role() = 'teacher';
$$;

create or replace function fidel.is_teacher_of(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from student_teacher_assignments
    where teacher_id = auth.uid() and student_id = p_student
  );
$$;

alter table profiles enable row level security;
alter table student_profiles enable row level security;
alter table student_internal_notes enable row level security;
alter table teacher_profiles enable row level security;
alter table student_teacher_assignments enable row level security;

create policy profiles_select_self on profiles for select
  using (id = auth.uid() or fidel.is_admin() or fidel.is_teacher_of(id));

create policy profiles_update_self on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_admin_all on profiles for all
  using (fidel.is_admin())
  with check (fidel.is_admin());

create policy student_profiles_rw on student_profiles for all
  using (user_id = auth.uid() or fidel.is_admin() or fidel.is_teacher_of(user_id))
  with check (user_id = auth.uid() or fidel.is_admin());

create policy internal_notes_admin on student_internal_notes for all
  using (fidel.is_admin())
  with check (fidel.is_admin());

create policy teacher_profiles_select on teacher_profiles for select
  using (auth.role() = 'authenticated');

create policy teacher_profiles_update_self on teacher_profiles for update
  using (user_id = auth.uid() or fidel.is_admin())
  with check (user_id = auth.uid() or fidel.is_admin());

create policy sta_select on student_teacher_assignments for select
  using (student_id = auth.uid() or teacher_id = auth.uid() or fidel.is_admin());

create policy sta_admin_write on student_teacher_assignments for all
  using (fidel.is_admin())
  with check (fidel.is_admin());
