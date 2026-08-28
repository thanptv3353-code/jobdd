-- Job DD — fixes 0016, which broke public registration.
--
-- The member-portal policies added there check "did this person apply to one
-- of my jobs?" by querying `applications` inside the policy's USING clause.
-- A policy body runs with the CALLER's privileges, and anon has INSERT but no
-- SELECT on `applications` — so an anonymous visitor upserting into
-- worker_profiles (which evaluates the table's SELECT policies to resolve
-- ON CONFLICT) was refused with:
--
--   42501  permission denied for table applications
--
-- Registration failed for everyone, with no clue why.
--
-- Granting anon SELECT on `applications` would fix the error and expose every
-- applicant's record to the public, so instead the lookup moves into
-- security-definer functions. Those run as their owner, so the policy no
-- longer requires the caller to hold privileges on the tables it consults —
-- and the answer it gives is unchanged.
--
-- HOW TO USE: paste into the Supabase SQL Editor (New query) and Run.
-- Safe to re-run (idempotent).

-- Did this worker apply to a vacancy belonging to the caller's company?
create or replace function is_my_applicant(p_worker_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from applications a
    join jobs j on j.id = a.job_id
    where a.worker_id = p_worker_id and j.member_id = my_member_id()
  );
$$;

-- Does this application belong to a vacancy of the caller's company?
create or replace function is_my_application(p_application_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from applications a
    join jobs j on j.id = a.job_id
    where a.id = p_application_id and j.member_id = my_member_id()
  );
$$;

grant execute on function is_my_applicant(uuid) to authenticated;
grant execute on function is_my_application(uuid) to authenticated;

-- Rebuild the policies on top of them. Same access, no privilege leak.
drop policy if exists "member reads own applicants" on worker_profiles;
create policy "member reads own applicants" on worker_profiles for select
  using (is_my_applicant(worker_profiles.id));

drop policy if exists "member reads own applicant files" on worker_files;
create policy "member reads own applicant files" on worker_files for select
  using (is_my_applicant(worker_files.worker_id));

drop policy if exists "member reads own application_events" on application_events;
create policy "member reads own application_events" on application_events for select
  using (is_my_application(application_events.application_id));

drop policy if exists "member writes own application_events" on application_events;
create policy "member writes own application_events" on application_events for insert
  with check (
    actor_type = 'member'
    and member_id = my_member_id()
    and is_my_application(application_events.application_id)
  );
