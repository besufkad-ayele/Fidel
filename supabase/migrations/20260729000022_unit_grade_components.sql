-- Unit grade components: practice (pass/fail gate) + weighted scores.
-- Homework 40% · Unit quiz 10% · Live assessment 50%.

alter table student_unit_progress
  add column if not exists practice_passed boolean not null default false,
  add column if not exists homework_score numeric(5,2)
    check (homework_score is null or (homework_score >= 0 and homework_score <= 100)),
  add column if not exists live_assessment_score numeric(5,2)
    check (live_assessment_score is null or (live_assessment_score >= 0 and live_assessment_score <= 100)),
  add column if not exists grade_notes text;

comment on column student_unit_progress.practice_passed is
  'Pass/fail gate for unit practice (Part 3). Not part of the weighted percentage.';
comment on column student_unit_progress.homework_score is
  'Homework component 0–100 (40% of unit grade). Admin/teacher entered or synced from submissions.';
comment on column student_unit_progress.best_quiz_percentage is
  'Unit quiz component 0–100 (10% of unit grade).';
comment on column student_unit_progress.live_assessment_score is
  'Live assessment component 0–100 (50% of unit grade).';

-- Keep practice_passed in sync when part_progress practice completes.
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
    case when practice_done then 'completed'
         when any_started   then 'in_progress'
         else 'not_started' end,
    practice_done,
    now(),
    case when practice_done then now() end
  )
  on conflict (student_id, unit_id) do update set
    self_paced_status = excluded.self_paced_status,
    practice_passed   = excluded.practice_passed,
    completed_at      = case
      when excluded.practice_passed
        then coalesce(student_unit_progress.completed_at, excluded.completed_at)
      else student_unit_progress.completed_at
    end,
    updated_at        = now();

  return new;
end $$;
