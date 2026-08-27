-- Job DD — line up hand-typed addresses with the official province and
-- district lists, so /admin/stats groups by place instead of by spelling.
--
-- Addresses entered before 0019 were free text: "ຫລວງພະບາງ", "ແຂວງຫຼວງພະບາງ"
-- and "ຫຼວງພະບາງ " all count separately today. This proposes a canonical
-- name for each and lets you apply the ones you agree with.
--
-- ⚠️ RUN THE STEPS IN ORDER AND READ STEP 2 BEFORE RUNNING STEP 3.
--    Step 3 overwrites addresses. Steps 1 and 2 change nothing.
--
-- ============================================================
-- STEP 1 — setup (safe, changes no data)
-- ============================================================

create extension if not exists pg_trgm;

-- Strip the prefix the form label already supplies, and collapse spacing.
-- ນະຄອນຫຼວງວຽງຈັນ is left whole: it is not a ແຂວງ.
create or replace function norm_place(p text)
returns text
language sql
immutable
as $$
  select btrim(regexp_replace(
    regexp_replace(coalesce(p, ''), '^\s*(ແຂວງ|ເມືອງ)\s*', ''),
    '\s+', ' ', 'g'
  ));
$$;

-- Best province match, or null when nothing is close enough to be safe.
create or replace function match_province(p text, min_score real default 0.6)
returns text
language sql
stable
as $$
  select name from provinces
  where similarity(norm_place(p), name) >= min_score
  order by similarity(norm_place(p), name) desc
  limit 1;
$$;

-- Best district match. A district in the province already on the profile
-- wins over an equally similar name elsewhere — several provinces share
-- district names.
create or replace function match_district(d text, prov text, min_score real default 0.6)
returns text
language sql
stable
as $$
  select dd.name
  from districts dd
  join provinces pp on pp.code = dd.province_code
  where similarity(norm_place(d), dd.name) >= min_score
  order by (pp.name is not distinct from prov) desc,
           similarity(norm_place(d), dd.name) desc
  limit 1;
$$;

-- ============================================================
-- STEP 2 — review (read only). Run each query and read the results.
-- ============================================================

-- 2a. Provinces that do not match the official list.
--     `suggested` null means nothing was close enough — fix those by hand.
select
  raw_value,
  uses,
  match_province(raw_value)                                      as suggested,
  round(similarity(norm_place(raw_value),
        coalesce(match_province(raw_value), ''))::numeric, 2)    as score
from (
  select v as raw_value, count(*) as uses
  from worker_profiles w,
       lateral (values (w.cur_province), (w.perm_province)) as t(v)
  where btrim(coalesce(v, '')) <> ''
    and v not in (select name from provinces)
  group by 1
) t
order by suggested is null desc, uses desc;

-- 2b. Districts that do not match the official list.
select
  raw_value,
  province_value,
  uses,
  match_district(raw_value, province_value)                      as suggested,
  round(similarity(norm_place(raw_value),
        coalesce(match_district(raw_value, province_value), ''))::numeric, 2) as score
from (
  select d as raw_value, p as province_value, count(*) as uses
  from worker_profiles w,
       lateral (values (w.cur_district, w.cur_province),
                       (w.perm_district, w.perm_province)) as t(d, p)
  where btrim(coalesce(d, '')) <> ''
    and d not in (select name from districts)
  group by 1, 2
) t
order by suggested is null desc, uses desc;

-- ============================================================
-- STEP 3 — apply (⚠️ CHANGES DATA). Only run once step 2 looks right.
--
-- Rows where the suggestion was null are left exactly as they are.
-- Raise 0.6 toward 1.0 to be stricter; lower it to catch more.
-- Provinces go first so districts can use the corrected province.
-- ============================================================

-- Keep a copy so this can be undone.
create table if not exists worker_address_backup as
select id, perm_village, perm_district, perm_province,
       cur_village, cur_district, cur_province, now() as backed_up_at
from worker_profiles;

update worker_profiles
set cur_province = coalesce(match_province(cur_province, 0.6), cur_province)
where btrim(coalesce(cur_province, '')) <> ''
  and cur_province not in (select name from provinces);

update worker_profiles
set perm_province = coalesce(match_province(perm_province, 0.6), perm_province)
where btrim(coalesce(perm_province, '')) <> ''
  and perm_province not in (select name from provinces);

update worker_profiles
set cur_district = coalesce(match_district(cur_district, cur_province, 0.6), cur_district)
where btrim(coalesce(cur_district, '')) <> ''
  and cur_district not in (select name from districts);

update worker_profiles
set perm_district = coalesce(match_district(perm_district, perm_province, 0.6), perm_district)
where btrim(coalesce(perm_district, '')) <> ''
  and perm_district not in (select name from districts);

-- ============================================================
-- STEP 4 — check what is left, and how to undo
-- ============================================================

-- Anything still off the official lists:
select 'province' as kind, v as value, count(*) as uses
from worker_profiles w, lateral (values (w.cur_province), (w.perm_province)) t(v)
where btrim(coalesce(v, '')) <> '' and v not in (select name from provinces)
group by 1, 2
union all
select 'district', d, count(*)
from worker_profiles w, lateral (values (w.cur_district), (w.perm_district)) t(d)
where btrim(coalesce(d, '')) <> '' and d not in (select name from districts)
group by 1, 2
order by uses desc;

-- To undo step 3:
--   update worker_profiles w set
--     perm_district = b.perm_district, perm_province = b.perm_province,
--     cur_district  = b.cur_district,  cur_province  = b.cur_province
--   from worker_address_backup b where b.id = w.id;
