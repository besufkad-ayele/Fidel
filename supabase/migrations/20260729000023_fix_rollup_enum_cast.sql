-- Fix enum assignment in progress rollup trigger.
-- Without explicit casts, some Postgres setups infer text and fail:
-- "column self_paced_status is of type self_paced_status but expression is of type text"

create or replace function fidel.rollup_unit_progress()
returns trigger language plpgsql as $$
declare
  practice_done boolean;
  any_started   boolean;
begin
  select
    coalesce(bool_or(part = 'practice' and status = 'completed'), false),
    coalesce(bool_or(status <> 'not_started'), false)
  into practice_done, any_started
  from part_progress
  where student_id = new.student_id and unit_id = new.unit_id;

  insert into student_unit_progress (
    student_id, unit_id, self_paced_status, practice_passed, started_at, completed_at
  )
  values (
    new.student_id, new.unit_id,
    case when practice_done then 'completed'::self_paced_status
         when any_started then 'in_progress'::self_paced_status
         else 'not_started'::self_paced_status end,
    practice_done,
    now(),
    case when practice_done then now() else null end
  )
  on conflict (student_id, unit_id) do update set
    self_paced_status = excluded.self_paced_status,
    practice_passed = excluded.practice_passed,
    completed_at = case
      when excluded.practice_passed
        then coalesce(student_unit_progress.completed_at, excluded.completed_at)
      else student_unit_progress.completed_at
    end,
    updated_at = now();

  return new;
end $$;
