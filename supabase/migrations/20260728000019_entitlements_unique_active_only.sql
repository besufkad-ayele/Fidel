-- Allow re-granting the same level/unit after revoke.
-- Previously unique indexes covered revoked rows too, so insert failed.

drop index if exists entitlements_one_per_level;
drop index if exists entitlements_one_per_unit;

create unique index entitlements_one_per_level
  on public.entitlements (student_id, level_id)
  where scope = 'level'::entitlement_scope and status = 'active'::entitlement_status;

create unique index entitlements_one_per_unit
  on public.entitlements (student_id, unit_id)
  where scope = 'unit'::entitlement_scope and status = 'active'::entitlement_status;
