-- Job DD — aggregate statistics over the registered worker pool.
--
-- Staff need to answer "where are our workers from, how old are they, what
-- split by gender" without paging through every profile. Counting in the
-- database keeps personal data on the server: the page only ever receives
-- the tallies.
--
-- Age bands follow the corridors' own limits — Korea E-8 caps at 39, so the
-- 35–39 / 40–44 boundary is the one staff actually plan around.
--
-- HOW TO USE: paste into the Supabase SQL Editor (New query) and Run.
-- Safe to re-run (idempotent).

create or replace function age_band(p_dob date)
returns text
language sql
immutable
as $$
  select case
    when p_dob is null then 'ບໍ່ລະບຸ'
    when extract(year from age(p_dob)) < 18 then 'ຕ່ຳກວ່າ 18'
    when extract(year from age(p_dob)) < 25 then '18–24'
    when extract(year from age(p_dob)) < 30 then '25–29'
    when extract(year from age(p_dob)) < 35 then '30–34'
    when extract(year from age(p_dob)) < 40 then '35–39'
    when extract(year from age(p_dob)) < 45 then '40–44'
    when extract(year from age(p_dob)) < 50 then '45–49'
    else '50 ຂຶ້ນໄປ'
  end;
$$;

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
      -- Ordered by the band itself, not by size, so the histogram reads left to right.
      select coalesce(jsonb_agg(jsonb_build_object('key', band, 'count', n) order by lo), '[]'::jsonb)
      from (
        select age_band(dob) as band, count(*) n,
               min(coalesce(extract(year from age(dob)), 999)) lo
        from w group by 1
      ) t
    ),
    'by_province', (
      select coalesce(jsonb_agg(jsonb_build_object('key', p, 'count', n) order by n desc), '[]'::jsonb)
      from (
        select nullif(trim(cur_province), '') as p, count(*) n
        from w group by 1
      ) t where p is not null
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
    'by_stage', (
      select coalesce(jsonb_agg(jsonb_build_object('key', stage, 'count', n) order by n desc), '[]'::jsonb)
      from (select stage::text as stage, count(*) n from applications group by 1) t
    )
  )
  where is_staff();
$$;

revoke all on function get_applicant_stats() from public, anon;
grant execute on function get_applicant_stats() to authenticated;
