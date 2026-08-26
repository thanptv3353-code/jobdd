-- Job DD — member portal: lets a licensed recruitment company sign in, post
-- its own vacancies, review the people who applied to them, and schedule
-- interviews — without a Job DD staff member relaying every step.
--
-- Access is deliberately narrow: a company sees only applications made to
-- its own jobs, and only the applicant details it needs to decide. Every
-- stage change is written to application_events tagged with the company, so
-- admin can always answer "which company interviewed or hired whom".
--
-- HOW TO USE: paste this whole file into the Supabase SQL Editor (New query)
-- and Run. Safe to re-run (idempotent).

-- ============================================================
-- Company logins
-- ============================================================

create table if not exists member_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  name text not null default '',
  email text,
  created_at timestamptz not null default now()
);
create index if not exists member_users_member_idx on member_users (member_id);

-- Which company (if any) the caller belongs to. Security definer so RLS on
-- member_users cannot recurse into the policies that call this.
create or replace function my_member_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select member_id from member_users where user_id = auth.uid();
$$;

create or replace function is_member_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from member_users where user_id = auth.uid());
$$;

grant execute on function my_member_id() to authenticated;
grant execute on function is_member_user() to authenticated;

alter table member_users enable row level security;

drop policy if exists "member reads own account" on member_users;
create policy "member reads own account" on member_users for select
  using (user_id = auth.uid());

drop policy if exists "staff all member_users" on member_users;
create policy "staff all member_users" on member_users for all
  using (is_staff()) with check (is_staff());

-- Grants portal access to a company. Mirrors add_staff_by_email: the person
-- signs up at /member/login first, then staff links that account to a member.
create or replace function add_member_user_by_email(p_email text, p_member_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not is_staff() then
    raise exception 'ຕ້ອງເປັນພະນັກງານ Job DD ເທົ່ານັ້ນຈຶ່ງເພີ່ມບັນຊີບໍລິສັດໄດ້';
  end if;

  select id into v_user_id from auth.users where email = p_email;
  if v_user_id is null then
    raise exception 'ຍັງບໍ່ພົບບັນຊີອີເມວນີ້ — ໃຫ້ບໍລິສັດສະໝັກບັນຊີຜ່ານໜ້າ /member/login ກ່ອນ (ກົດ "ສະໝັກທີ່ນີ້")';
  end if;

  if exists (select 1 from staff where user_id = v_user_id) then
    raise exception 'ອີເມວນີ້ເປັນບັນຊີພະນັກງານ Job DD ຢູ່ແລ້ວ ໃຊ້ເປັນບັນຊີບໍລິສັດບໍ່ໄດ້';
  end if;

  insert into member_users (user_id, member_id, name, email)
  values (v_user_id, p_member_id, p_name, p_email)
  on conflict (user_id) do update
    set member_id = excluded.member_id, name = excluded.name, email = excluded.email;
end;
$$;

grant execute on function add_member_user_by_email(text, uuid, text) to authenticated;

create or replace function remove_member_user(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_staff() then
    raise exception 'ຕ້ອງເປັນພະນັກງານ Job DD ເທົ່ານັ້ນຈຶ່ງລຶບບັນຊີບໍລິສັດໄດ້';
  end if;
  delete from member_users where id = p_id;
end;
$$;

grant execute on function remove_member_user(uuid) to authenticated;

-- ============================================================
-- Attribution on the activity log
-- ============================================================

alter table application_events add column if not exists actor_type text not null default 'staff';
alter table application_events drop constraint if exists application_events_actor_type_check;
alter table application_events add constraint application_events_actor_type_check
  check (actor_type in ('staff', 'member'));
alter table application_events add column if not exists member_id uuid references members(id) on delete set null;
create index if not exists application_events_member_idx on application_events (member_id);

-- ============================================================
-- What a company may see and do
-- ============================================================

-- Its own vacancies.
drop policy if exists "member writes own jobs" on jobs;
create policy "member writes own jobs" on jobs for insert
  with check (member_id = my_member_id());

drop policy if exists "member updates own jobs" on jobs;
create policy "member updates own jobs" on jobs for update
  using (member_id = my_member_id()) with check (member_id = my_member_id());

drop policy if exists "member deletes own jobs" on jobs;
create policy "member deletes own jobs" on jobs for delete
  using (member_id = my_member_id());

-- Applications made to its own vacancies.
drop policy if exists "member reads own applications" on applications;
create policy "member reads own applications" on applications for select
  using (exists (select 1 from jobs j where j.id = applications.job_id and j.member_id = my_member_id()));

drop policy if exists "member updates own applications" on applications;
create policy "member updates own applications" on applications for update
  using (exists (select 1 from jobs j where j.id = applications.job_id and j.member_id = my_member_id()))
  with check (exists (select 1 from jobs j where j.id = applications.job_id and j.member_id = my_member_id()));

-- Only the profiles of people who actually applied to its vacancies.
drop policy if exists "member reads own applicants" on worker_profiles;
create policy "member reads own applicants" on worker_profiles for select
  using (exists (
    select 1 from applications a
    join jobs j on j.id = a.job_id
    where a.worker_id = worker_profiles.id and j.member_id = my_member_id()
  ));

-- …and their submitted documents, so a CV can be reviewed before interview.
drop policy if exists "member reads own applicant files" on worker_files;
create policy "member reads own applicant files" on worker_files for select
  using (exists (
    select 1 from applications a
    join jobs j on j.id = a.job_id
    where a.worker_id = worker_files.worker_id and j.member_id = my_member_id()
  ));

-- Its own audit trail. Admin still sees everything via the staff policy.
drop policy if exists "member reads own application_events" on application_events;
create policy "member reads own application_events" on application_events for select
  using (exists (
    select 1 from applications a
    join jobs j on j.id = a.job_id
    where a.id = application_events.application_id and j.member_id = my_member_id()
  ));

drop policy if exists "member writes own application_events" on application_events;
create policy "member writes own application_events" on application_events for insert
  with check (
    actor_type = 'member'
    and member_id = my_member_id()
    and exists (
      select 1 from applications a
      join jobs j on j.id = a.job_id
      where a.id = application_events.application_id and j.member_id = my_member_id()
    )
  );

grant select, insert, update, delete on jobs to authenticated;
grant select, update on applications to authenticated;
grant select on worker_profiles to authenticated;
grant select on worker_files to authenticated;
grant select, insert on member_users to authenticated;
