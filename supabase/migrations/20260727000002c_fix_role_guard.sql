-- Harden role-change guard and repair orphaned role profiles from
-- provisioning that used the cookie client instead of service_role.

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

insert into public.student_profiles (user_id)
select p.id
from public.profiles p
where p.role = 'student'
  and not exists (
    select 1 from public.student_profiles s where s.user_id = p.id
  )
on conflict (user_id) do nothing;

delete from public.student_profiles sp
where exists (
  select 1 from public.profiles p
  where p.id = sp.user_id and p.role <> 'student'
);
