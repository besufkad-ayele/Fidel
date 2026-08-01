-- Allow shared homework templates with student_id null even when not marked
-- is_unit_default. The old check required every non-unit-default row to have a
-- student, which broke Admin → Create & open studio when "Unit default" was off.
--
-- Still forbid unit-default rows that target a specific student.

alter table public.homework_assignments
  drop constraint if exists homework_assignments_check;

alter table public.homework_assignments
  add constraint homework_assignments_check
  check (not is_unit_default or student_id is null);

-- Students may read any published shared template (null student_id) or their own row.
drop policy if exists hw_assignments_visible on homework_assignments;
create policy hw_assignments_visible on homework_assignments for select
  using (
    fidel.is_staff()
    or (
      status = 'published'
      and (student_id = auth.uid() or student_id is null)
    )
  );
