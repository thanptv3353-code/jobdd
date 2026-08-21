-- Job DD — destination countries become an admin-editable table instead of a
-- fixed enum, and worker addresses become structured (permanent + current,
-- each ບ້ານ/ເມືອງ/ແຂວງ) instead of a single free-text province field.
--
-- HOW TO USE: paste this whole file into the Supabase SQL Editor (New query) and Run.
-- Safe to re-run (idempotent), same as 0001/0002.

-- ============================================================
-- countries — replaces the fixed `country` enum
-- ============================================================

create table if not exists countries (
  code text primary key,
  label text not null,
  min_age int not null default 18,
  max_age int not null default 60,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into countries (code, label, min_age, max_age, sort_order) values
  ('domestic', 'ພາຍໃນ', 18, 60, 1),
  ('thailand', 'ໄທ', 18, 60, 2),
  ('korea', 'ເກົາຫຼີ', 18, 39, 3),
  ('japan', 'ຢີ່ປຸ່ນ', 18, 60, 4)
on conflict (code) do update set label = excluded.label;

-- Convert every column that used the `country` enum to plain text + FK.
alter table jobs alter column country type text using country::text;
alter table jobs add constraint jobs_country_fkey foreign key (country) references countries(code);

alter table applications alter column country type text using country::text;
alter table applications add constraint applications_country_fkey foreign key (country) references countries(code);

alter table country_requirements alter column country type text using country::text;
alter table country_requirements add constraint country_requirements_country_fkey foreign key (country) references countries(code);

alter table placements alter column country type text using country::text;
alter table placements add constraint placements_country_fkey foreign key (country) references countries(code);

-- Array column — Postgres can't FK individual array elements, so this stays
-- unconstrained text[], same trust level as other free-form fields already
-- in the schema (e.g. jobs.category).
alter table worker_profiles alter column preferred_countries type text[] using preferred_countries::text[];

-- min_age/max_age now live per-country on `countries`, not per-document.
alter table country_requirements drop column if exists min_age;
alter table country_requirements drop column if exists max_age;

-- ============================================================
-- worker_profiles — structured addresses instead of one province field
-- ============================================================

alter table worker_profiles add column if not exists perm_village text not null default '';
alter table worker_profiles add column if not exists perm_district text not null default '';
alter table worker_profiles add column if not exists perm_province text not null default '';
alter table worker_profiles add column if not exists cur_village text not null default '';
alter table worker_profiles add column if not exists cur_district text not null default '';
alter table worker_profiles add column if not exists cur_province text not null default '';

-- Best-effort backfill from the old single field before dropping it.
do $$ begin
  if exists (select 1 from information_schema.columns where table_name = 'worker_profiles' and column_name = 'province') then
    update worker_profiles set perm_province = province, cur_province = province where province is not null and province <> '';
    alter table worker_profiles drop column province;
  end if;
end $$;

-- ============================================================
-- Grants + RLS for countries (same shape as country_requirements)
-- ============================================================

grant usage on schema public to anon, authenticated;
grant select on countries to anon, authenticated;
grant insert, update, delete on countries to authenticated;

alter table countries enable row level security;
drop policy if exists "public read countries" on countries;
create policy "public read countries" on countries for select using (true);
drop policy if exists "staff write countries" on countries;
create policy "staff write countries" on countries for all using (is_staff()) with check (is_staff());
