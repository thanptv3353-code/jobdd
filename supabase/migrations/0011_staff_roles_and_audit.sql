-- Job DD — adds staff roles (super_admin vs staff), lets a super admin
-- grant/revoke staff access from the admin UI instead of hand-editing
-- the `staff` table via SQL, and logs who did what on each application
-- (document review, interview scheduling, rejection) so a super admin
-- can see which staff member handled each applicant.
--
-- HOW TO USE: paste this whole file into the Supabase SQL Editor (New query) and Run.
-- Safe to re-run (idempotent).

alter table staff add column if not exists role text not null default 'staff';
alter table staff drop constraint if exists staff_role_check;
alter table staff add constraint staff_role_check check (role in ('staff', 'super_admin'));
alter table staff add column if not exists email text;

-- Anyone already granted staff access before this migration becomes a
-- super_admin, so nobody is locked out of managing the new role system.
-- Only runs once: if a super_admin already exists (e.g. this migration
-- ran before, or roles were customized since), this is a no-op.
update staff set role = 'super_admin'
where not exists (select 1 from staff where role = 'super_admin');

-- Best-effort backfill of email for existing staff rows.
update staff s set email = u.email from auth.users u where u.id = s.user_id and s.email is null;

-- ============================================================
-- Helper: is_super_admin()
-- ============================================================

create or replace function is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from staff where user_id = auth.uid() and role = 'super_admin');
$$;

grant execute on function is_super_admin() to authenticated;

-- ============================================================
-- Staff management RPCs (super admin only)
-- ============================================================

-- Grants staff access to someone who has already signed up an account
-- via /admin/login. Looks up their auth user by email so a super admin
-- never needs direct SQL/database access to add a teammate.
create or replace function add_staff_by_email(p_email text, p_name text, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not is_super_admin() then
    raise exception 'ຕ້ອງເປັນ super admin ເທົ່ານັ້ນຈຶ່ງເພີ່ມພະນັກງານໄດ້';
  end if;

  if p_role not in ('staff', 'super_admin') then
    raise exception 'ສິດບໍ່ຖືກຕ້ອງ';
  end if;

  select id into v_user_id from auth.users where email = p_email;
  if v_user_id is null then
    raise exception 'ຍັງບໍ່ພົບບັນຊີອີເມວນີ້ — ໃຫ້ພະນັກງານຄົນນັ້ນສະໝັກບັນຊີຜ່ານໜ້າ /admin/login ກ່ອນ (ກົດ "ສະໝັກທີ່ນີ້")';
  end if;

  insert into staff (user_id, name, email, role)
  values (v_user_id, p_name, p_email, p_role)
  on conflict (user_id) do update set name = excluded.name, role = excluded.role, email = excluded.email;
end;
$$;

grant execute on function add_staff_by_email(text, text, text) to authenticated;

-- Removes a staff member's admin access.
create or replace function remove_staff(p_staff_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_super_admin() then
    raise exception 'ຕ້ອງເປັນ super admin ເທົ່ານັ້ນຈຶ່ງລຶບພະນັກງານໄດ້';
  end if;
  if p_staff_id = (select id from staff where user_id = auth.uid()) then
    raise exception 'ບໍ່ສາມາດລຶບບັນຊີຕົນເອງໄດ້';
  end if;
  delete from staff where id = p_staff_id;
end;
$$;

grant execute on function remove_staff(uuid) to authenticated;

-- Super admins can also see every staff row (not just their own).
drop policy if exists "super admin read all staff" on staff;
create policy "super admin read all staff" on staff for select using (is_super_admin());

-- ============================================================
-- Application activity log
-- ============================================================

create table if not exists application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  staff_id uuid references staff(id) on delete set null,
  staff_name text not null,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

alter table application_events enable row level security;
drop policy if exists "staff all application_events" on application_events;
create policy "staff all application_events" on application_events for all
  using (is_staff()) with check (is_staff());

grant select, insert on application_events to authenticated;
