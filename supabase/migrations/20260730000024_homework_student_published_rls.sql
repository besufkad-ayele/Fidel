-- Students may only read published homework (unit defaults or their own rows).
-- Staff retain full visibility for drafting/review.

drop policy if exists hw_assignments_visible on homework_assignments;
create policy hw_assignments_visible on homework_assignments for select
  using (
    fidel.is_staff()
    or (
      status = 'published'
      and (student_id = auth.uid() or is_unit_default)
    )
  );
