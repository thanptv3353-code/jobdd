-- Job DD — two related gaps left by the LEBA import.
--
-- 1. Every one of the 48 imported companies came in with an empty
--    country_focus, so their cards showed no destination badges at all. The
--    directory's closing note does settle one thing for all of them: entries
--    1–43 place workers domestically AND abroad, 44–48 domestically only. So
--    'domestic' is certain for all 48 and is set here. Which foreign
--    destinations each of 1–43 actually serves is NOT in the document —
--    staff add those per company in /admin/members as they confirm them.
--
-- 2. Job seekers can say which countries interest them but not which kind of
--    work, so staff cannot match a welder to welding vacancies. Registration
--    now records the categories they pick, by id so a later rename does not
--    orphan the choice.
--
-- HOW TO USE: paste into the Supabase SQL Editor (New query) and Run.
-- Safe to re-run (idempotent).

-- 0) 0003_dynamic_countries_addresses.sql converted every country column to
--    plain text so staff could add destinations from /admin/countries — but
--    it missed members.country_focus, which is still the frozen `country`
--    enum. Assigning a newly added destination to a company therefore fails.
--    Finish that conversion here; it also lets the update below run.
alter table members alter column country_focus type text[] using country_focus::text[];

-- 1) Domestic placement is licensed for all 48; do not overwrite any
--    destination staff have already filled in by hand.
update members
set country_focus = array['domestic']
where sort_order between 1 and 48
  and country_focus = '{}';

-- 2) Preferred kinds of work, alongside the existing preferred_countries.
alter table worker_profiles add column if not exists preferred_categories uuid[] not null default '{}';
create index if not exists worker_profiles_preferred_categories_idx
  on worker_profiles using gin (preferred_categories);

-- 3) Surface those picks in the stats page, resolved to category names so the
--    chart stays readable after a rename. Replaces the 0015 definition.
create or replace function get_applicant_stats()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with w as (select * from worker_profiles)
  select jsonb_build_object(
    'total_workers', (select count(*) from w),
    'total_applications', (select count(*) from applications),
    'by_gender', (
      select coalesce(jsonb_agg(jsonb_build_object('key', gender, 'count', n) order by n desc), '[]'::jsonb)
      from (select gender::text as gender, count(*) n from w group by 1) t
    ),
    'by_age_band', (
      select coalesce(jsonb_agg(jsonb_build_object('key', band, 'count', n) order by lo), '[]'::jsonb)
      from (
        select age_band(dob) as band, count(*) n,
               min(coalesce(extract(year from age(dob)), 999)) lo
        from w group by 1
      ) t
    ),
    'by_province', (
      select coalesce(jsonb_agg(jsonb_build_object('key', p, 'count', n) order by n desc), '[]'::jsonb)
      from (select nullif(trim(cur_province), '') as p, count(*) n from w group by 1) t
      where p is not null
    ),
    'by_district', (
      select coalesce(jsonb_agg(jsonb_build_object('key', d, 'province', p, 'count', n) order by n desc), '[]'::jsonb)
      from (
        select nullif(trim(cur_district), '') as d, nullif(trim(cur_province), '') as p, count(*) n
        from w group by 1, 2
      ) t where d is not null
    ),
    'by_availability', (
      select coalesce(jsonb_agg(jsonb_build_object('key', availability_status, 'count', n) order by n desc), '[]'::jsonb)
      from (select availability_status::text, count(*) n from w group by 1) t
    ),
    'by_country_interest', (
      select coalesce(jsonb_agg(jsonb_build_object('key', c, 'count', n) order by n desc), '[]'::jsonb)
      from (select unnest(preferred_countries) as c, count(*) n from w group by 1) t
    ),
    'by_category_interest', (
      select coalesce(jsonb_agg(jsonb_build_object('key', name, 'count', n) order by n desc), '[]'::jsonb)
      from (
        select jc.name, count(*) n
        from w, unnest(w.preferred_categories) as cat_id
        join job_categories jc on jc.id = cat_id
        group by 1
      ) t
    ),
    'by_stage', (
      select coalesce(jsonb_agg(jsonb_build_object('key', stage, 'count', n) order by n desc), '[]'::jsonb)
      from (select stage::text as stage, count(*) n from applications group by 1) t
    )
  )
  where is_staff();
$$;

revoke all on function get_applicant_stats() from public, anon;
grant execute on function get_applicant_stats() to authenticated;
