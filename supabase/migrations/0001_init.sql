-- Job DD — initial schema, RLS policies, status-automation triggers, and demo seed data.
--
-- HOW TO USE:
-- 1. Open your Supabase project → SQL Editor → New query.
-- 2. Paste this whole file and click Run.
-- 3. Go to the deployed site's /admin/login and sign up a staff account (email + password).
-- 4. Back in the SQL Editor, run this (replace the email) to grant that account staff access:
--
--      insert into staff (user_id, name)
--      select id, 'ຊື່ຂອງທ່ານ' from auth.users where email = 'you@example.com';
--
-- Safe to re-run: every statement is idempotent (drop-if-exists / create-or-replace / on conflict).

-- ============================================================
-- Enums
-- ============================================================

do $$ begin
  create type country as enum ('domestic', 'thailand', 'korea', 'japan');
exception when duplicate_object then null; end $$;

do $$ begin
  create type availability_status as enum ('available', 'in_process', 'placed', 'paused', 'stale');
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_stage as enum ('received', 'screening', 'interview', 'offer', 'contract_signed', 'rejected');
exception when duplicate_object then null; end $$;

-- ============================================================
-- Tables
-- ============================================================

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  country_focus country[] not null default '{}',
  established_year int,
  created_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  title text not null,
  country country not null,
  category text not null default '',
  salary_range text not null default '',
  description text not null default '',
  requirements text[] not null default '{}',
  quota int not null default 1,
  posted_at date not null default current_date,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists worker_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gender text not null default 'male' check (gender in ('male', 'female')),
  phone text not null,
  dob date not null,
  province text not null default '',
  preferred_countries country[] not null default '{}',
  availability_status availability_status not null default 'available',
  status_updated_at timestamptz not null default now(),
  status_updated_by text not null default 'ລົງທະບຽນເອງ',
  last_confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists worker_profiles_phone_idx on worker_profiles (phone);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references worker_profiles(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  country country not null,
  stage application_stage not null default 'received',
  documents jsonb not null default '{}',
  submitted_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists applications_worker_idx on applications (worker_id);

create table if not exists placements (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references worker_profiles(id) on delete cascade,
  country country not null,
  company_name text not null default '',
  position text not null default '',
  start_date date,
  contract_end_date date,
  source text not null default 'jobdd' check (source in ('jobdd', 'outside')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists contact_logs (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references worker_profiles(id) on delete cascade,
  staff_name text not null,
  contacted_at date not null default current_date,
  channel text not null default 'phone' check (channel in ('phone', 'whatsapp', 'sms', 'in_person')),
  result text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists country_requirements (
  id uuid primary key default gen_random_uuid(),
  country country not null,
  doc_type text not null,
  required boolean not null default true,
  min_age int not null default 18,
  max_age int not null default 60,
  note text,
  unique (country, doc_type)
);

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default '',
  created_at timestamptz not null default now()
);

-- ============================================================
-- Helper: is_staff() — security definer so it can read `staff`
-- regardless of the caller's own RLS visibility into that table.
-- ============================================================

create or replace function is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from staff where user_id = auth.uid());
$$;

-- ============================================================
-- Status-automation triggers
-- ============================================================

create or replace function handle_application_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update worker_profiles
  set availability_status = 'in_process',
      status_updated_at = now(),
      status_updated_by = 'ລະບົບ',
      last_confirmed_at = now()
  where id = new.worker_id and availability_status = 'available';
  return new;
end;
$$;

drop trigger if exists trg_application_insert on applications;
create trigger trg_application_insert
  after insert on applications
  for each row execute function handle_application_insert();

create or replace function handle_application_stage_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stage is distinct from old.stage then
    if new.stage in ('screening', 'interview', 'offer') then
      update worker_profiles
      set availability_status = 'in_process',
          status_updated_at = now(),
          status_updated_by = 'ລະບົບ',
          last_confirmed_at = now()
      where id = new.worker_id and availability_status <> 'placed';

    elsif new.stage = 'contract_signed' then
      update applications
      set stage = 'rejected'
      where worker_id = new.worker_id and id <> new.id and stage <> 'rejected';

      insert into placements (worker_id, country, company_name, position, start_date, source)
      select new.worker_id, new.country, m.name, j.title, current_date, 'jobdd'
      from jobs j
      join members m on m.id = j.member_id
      where j.id = new.job_id;

      update worker_profiles
      set availability_status = 'placed',
          status_updated_at = now(),
          status_updated_by = 'ລະບົບ',
          last_confirmed_at = now()
      where id = new.worker_id;

    elsif new.stage = 'rejected' then
      if not exists (
        select 1 from applications
        where worker_id = new.worker_id and id <> new.id and stage <> 'rejected'
      ) then
        update worker_profiles
        set availability_status = 'available',
            status_updated_at = now(),
            status_updated_by = 'ລະບົບ',
            last_confirmed_at = now()
        where id = new.worker_id and availability_status <> 'placed';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_application_stage_change on applications;
create trigger trg_application_stage_change
  after update of stage on applications
  for each row execute function handle_application_stage_change();

-- ============================================================
-- Public RPCs for the no-login worker dashboard (phone lookup)
-- ============================================================

create or replace function get_my_status(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_worker worker_profiles;
  v_apps jsonb;
begin
  select * into v_worker from worker_profiles where phone = p_phone order by created_at desc limit 1;
  if v_worker.id is null then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id,
    'stage', a.stage,
    'country', a.country,
    'submitted_at', a.submitted_at,
    'job_title', j.title
  ) order by a.submitted_at desc), '[]'::jsonb)
  into v_apps
  from applications a
  join jobs j on j.id = a.job_id
  where a.worker_id = v_worker.id;

  return jsonb_build_object('worker', to_jsonb(v_worker), 'applications', v_apps);
end;
$$;

create or replace function set_my_status(p_phone text, p_status availability_status)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select id into v_id from worker_profiles where phone = p_phone order by created_at desc limit 1;
  if v_id is null then
    return false;
  end if;

  update worker_profiles
  set availability_status = p_status,
      status_updated_at = now(),
      status_updated_by = 'ຜູ້ໃຊ້ (ລາຍງານເອງ)',
      last_confirmed_at = now()
  where id = v_id;

  return true;
end;
$$;

grant execute on function get_my_status(text) to anon, authenticated;
grant execute on function set_my_status(text, availability_status) to anon, authenticated;

-- Aggregate-only public stats for the landing page — avoids granting anon
-- direct SELECT on worker_profiles just to show a headline count.
create or replace function get_public_stats()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'available_workers', (select count(*) from worker_profiles where availability_status = 'available'),
    'open_jobs', (select count(*) from jobs where status = 'open'),
    'members', (select count(*) from members)
  );
$$;

grant execute on function get_public_stats() to anon, authenticated;

-- ============================================================
-- Table-level grants — Postgres checks these BEFORE row level
-- security policies even run, so RLS alone is not enough.
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select on members, jobs, country_requirements to anon;
grant select on members, jobs, country_requirements, worker_profiles, applications, placements, contact_logs, staff to authenticated;

grant insert on worker_profiles, applications to anon;
grant insert on members, jobs, worker_profiles, applications, placements, contact_logs to authenticated;

grant update on members, jobs, worker_profiles, applications to authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table members enable row level security;
drop policy if exists "public read members" on members;
create policy "public read members" on members for select using (true);
drop policy if exists "staff write members" on members;
create policy "staff write members" on members for insert with check (is_staff());
drop policy if exists "staff update members" on members;
create policy "staff update members" on members for update using (is_staff());

alter table jobs enable row level security;
drop policy if exists "public read jobs" on jobs;
create policy "public read jobs" on jobs for select using (true);
drop policy if exists "staff write jobs" on jobs;
create policy "staff write jobs" on jobs for insert with check (is_staff());
drop policy if exists "staff update jobs" on jobs;
create policy "staff update jobs" on jobs for update using (is_staff());

alter table country_requirements enable row level security;
drop policy if exists "public read country_requirements" on country_requirements;
create policy "public read country_requirements" on country_requirements for select using (true);
drop policy if exists "staff write country_requirements" on country_requirements;
create policy "staff write country_requirements" on country_requirements for all using (is_staff()) with check (is_staff());

alter table worker_profiles enable row level security;
drop policy if exists "anon insert worker_profiles" on worker_profiles;
create policy "anon insert worker_profiles" on worker_profiles for insert with check (true);
drop policy if exists "staff select worker_profiles" on worker_profiles;
create policy "staff select worker_profiles" on worker_profiles for select using (is_staff());
drop policy if exists "staff update worker_profiles" on worker_profiles;
create policy "staff update worker_profiles" on worker_profiles for update using (is_staff());

alter table applications enable row level security;
drop policy if exists "anon insert applications" on applications;
create policy "anon insert applications" on applications for insert with check (true);
drop policy if exists "staff select applications" on applications;
create policy "staff select applications" on applications for select using (is_staff());
drop policy if exists "staff update applications" on applications;
create policy "staff update applications" on applications for update using (is_staff());

alter table placements enable row level security;
drop policy if exists "staff all placements" on placements;
create policy "staff all placements" on placements for all using (is_staff()) with check (is_staff());

alter table contact_logs enable row level security;
drop policy if exists "staff all contact_logs" on contact_logs;
create policy "staff all contact_logs" on contact_logs for all using (is_staff()) with check (is_staff());

alter table staff enable row level security;
drop policy if exists "staff read own" on staff;
create policy "staff read own" on staff for select using (auth.uid() = user_id);
-- No insert/update policy on `staff` on purpose — new staff accounts are
-- only granted access by pasting the SQL snippet in the header comment above.

-- ============================================================
-- Seed data — mirrors lib/mock-data.ts so the real DB starts
-- with the same demo content the prototype used.
-- ============================================================

insert into members (id, name, description, country_focus, established_year) values
  ('11111111-1111-1111-1111-000000000001', 'ບໍລິສັດ ວຽງຈັນ ພັດທະນາແຮງງານ ຈຳກັດ', 'ຊ່ຽວຊານສົ່ງແຮງງານໄປເກົາຫຼີ ແລະ ຢີ່ປຸ່ນ ມາແລ້ວກວ່າ 12 ປີ', '{korea,japan}', 2013),
  ('11111111-1111-1111-1111-000000000002', 'ບໍລິສັດ ລາວ-ໄທ ຈັດຫາງານ', 'ຄູ່ຮ່ວມງານທາງການກັບກະຊວງແຮງງານໄທ ສຳລັບແຮງງານຂ້າມແດນ', '{thailand}', 2009),
  ('11111111-1111-1111-1111-000000000003', 'ສູນຈັດຫາງານພາຍໃນ ນະຄອນຫຼວງວຽງຈັນ', 'ເຊື່ອມຕໍ່ແຮງງານກັບໂຮງງານ ແລະ ທຸລະກິດພາຍໃນປະເທດ', '{domestic}', 2018),
  ('11111111-1111-1111-1111-000000000004', 'ບໍລິສັດ ອິນເຕີເນຊັນນວນ ຮິວແມນ ຣີຊອດ', 'ຝຶກອົບຮົມ ແລະ ສົ່ງແຮງງານທັກສະສູງໄປຢີ່ປຸ່ນ ໂຄງການ SSW', '{japan}', 2016),
  ('11111111-1111-1111-1111-000000000005', 'ບໍລິສັດ ຈຳປາ ຈັດຫາງານສາກົນ', 'ຄົບວົງຈອນ ພາຍໃນ, ໄທ, ເກົາຫຼີ — ຮັບອົບຮົມພາສາກ່ອນອອກເດີນທາງ', '{domestic,thailand,korea}', 2011)
on conflict (id) do nothing;

insert into jobs (id, member_id, title, country, category, salary_range, description, requirements, quota, posted_at, status) values
  ('22222222-2222-2222-2222-000000000001', '11111111-1111-1111-1111-000000000001', 'ພະນັກງານປະກອບຊິ້ນສ່ວນເອເລັກໂຕຣນິກ', 'korea', 'ໂຮງງານອຸດສາຫະກຳ', '1,900,000 – 2,300,000 ວອນ/ເດືອນ', 'ຮັບສະໝັກພະນັກງານປະກອບຊິ້ນສ່ວນເອເລັກໂຕຣນິກ ປະຈຳໂຮງງານໃນແຂວງກຽງກີ ສາທາລະນະລັດເກົາຫຼີ ພາຍໃຕ້ໂຄງການ EPS.', array['ອາຍຸ 18–39 ປີ','ຜ່ານ EPS-TOPIK','ສຸຂະພາບແຂງແຮງ ບໍ່ຕາບອດສີ','ບໍ່ມີປະຫວັດອາຊະຍາກຳ'], 20, '2026-07-20', 'open'),
  ('22222222-2222-2222-2222-000000000002', '11111111-1111-1111-1111-000000000001', 'ຜູ້ຊ່ວຍຝຶກງານດ້ານກະສິກຳ (SSW)', 'japan', 'ກະສິກຳ', '170,000 – 200,000 ເຢນ/ເດືອນ', 'ໂຄງການທັກສະສະເພາະ (SSW) ດ້ານກະສິກຳ ປະຈຳແຂວງອິບາຣະກິ ປະເທດຢີ່ປຸ່ນ ມີການຝຶກອົບຮົມພາສາກ່ອນອອກເດີນທາງ.', array['ອາຍຸ 18–35 ປີ','ຜ່ານ JFT-Basic ຫຼື JLPT N4','ມີໃບຢັ້ງຢືນທັກສະ SSW','ສຸຂະພາບແຂງແຮງ'], 15, '2026-08-01', 'open'),
  ('22222222-2222-2222-2222-000000000003', '11111111-1111-1111-1111-000000000002', 'ພະນັກງານໂຮງງານອາຫານທະເລ', 'thailand', 'ໂຮງງານອາຫານ', '12,000 – 15,000 ບາດ/ເດືອນ', 'ຮັບແຮງງານປະຈຳໂຮງງານແປຮູບອາຫານທະເລ ຈັງຫວັດສະໝຸດສາຄອນ ປະເທດໄທ ມີບ້ານພັກໃຫ້ຟຣີ.', array['ອາຍຸ 18 ປີຂຶ້ນໄປ','ສຸຂະພາບແຂງແຮງ','ບໍ່ມີປະຫວັດອາຊະຍາກຳ'], 30, '2026-08-05', 'open'),
  ('22222222-2222-2222-2222-000000000004', '11111111-1111-1111-1111-000000000002', 'ພະນັກງານກໍ່ສ້າງ', 'thailand', 'ກໍ່ສ້າງ', '13,000 – 16,000 ບາດ/ເດືອນ', 'ໂຄງການກໍ່ສ້າງອາຄານສູງ ກຸງເທບມະຫານະຄອນ ຕ້ອງການແຮງງານກໍ່ສ້າງດ່ວນ.', array['ອາຍຸ 20–45 ປີ','ມີປະສົບການກໍ່ສ້າງຈະພິຈາລະນາພິເສດ'], 25, '2026-07-28', 'open'),
  ('22222222-2222-2222-2222-000000000005', '11111111-1111-1111-1111-000000000003', 'ພະນັກງານຂາຍ ຫ້າງສັບພະສິນຄ້າ', 'domestic', 'ບໍລິການ', '2,200,000 – 2,800,000 ກີບ/ເດືອນ', 'ຮັບພະນັກງານຂາຍປະຈຳຫ້າງສັບພະສິນຄ້າ ໃນນະຄອນຫຼວງວຽງຈັນ ຫຼາຍຕຳແໜ່ງ.', array['ອາຍຸ 18–35 ປີ','ບຸກຄະລິກດີ ໃຈເຢັນ','ຈົບຊັ້ນມັດທະຍົມສຶກສາຕອນປາຍ'], 10, '2026-08-10', 'open'),
  ('22222222-2222-2222-2222-000000000006', '11111111-1111-1111-1111-000000000004', 'ຊ່າງເຊື່ອມໂລຫະ (SSW)', 'japan', 'ອຸດສາຫະກຳ', '190,000 – 230,000 ເຢນ/ເດືອນ', 'ຮັບຊ່າງເຊື່ອມມີປະສົບການ ໄປເຮັດວຽກໂຮງງານໂລຫະ ແຂວງໄອຈິ ປະເທດຢີ່ປຸ່ນ.', array['ອາຍຸ 20–40 ປີ','ຜ່ານ JFT-Basic ຫຼື JLPT N4','ມີໃບຢັ້ງຢືນທັກສະການເຊື່ອມ'], 8, '2026-08-12', 'open'),
  ('22222222-2222-2222-2222-000000000007', '11111111-1111-1111-1111-000000000005', 'ພະນັກງານໂຮງແຮມ', 'domestic', 'ບໍລິການ', '2,000,000 – 2,500,000 ກີບ/ເດືອນ', 'ໂຮງແຮມ 4 ດາວ ໃນນະຄອນຫຼວງວຽງຈັນ ຕ້ອງການພະນັກງານຫຼາຍຕຳແໜ່ງ.', array['ອາຍຸ 18–30 ປີ','ພາສາອັງກິດພື້ນຖານ'], 12, '2026-08-14', 'open'),
  ('22222222-2222-2222-2222-000000000008', '11111111-1111-1111-1111-000000000005', 'ພະນັກງານໂຮງງານແປຮູບຢາງພາລາ', 'korea', 'ໂຮງງານອຸດສາຫະກຳ', '1,950,000 – 2,200,000 ວອນ/ເດືອນ', 'ໂຮງງານແປຮູບຢາງອຸດສາຫະກຳ ແຂວງຊົນນະບຸລີ ສາທາລະນະລັດເກົາຫຼີ.', array['ອາຍຸ 18–39 ປີ','ຜ່ານ EPS-TOPIK','ສຸຂະພາບແຂງແຮງ'], 18, '2026-06-30', 'open')
on conflict (id) do nothing;

insert into worker_profiles (id, name, gender, phone, dob, province, preferred_countries, availability_status, status_updated_at, status_updated_by, last_confirmed_at) values
  ('33333333-3333-3333-3333-000000000001', 'ທ້າວ ສົມພອນ ວົງສະຫວັນ', 'male', '020 5551 0234', '2000-03-14', 'ວຽງຈັນ', '{korea,japan}', 'available', '2026-08-18', 'ລະບົບ', '2026-08-18'),
  ('33333333-3333-3333-3333-000000000002', 'ນາງ ສີວິໄລ ພົມມະຈັກ', 'female', '020 5552 1145', '1998-11-02', 'ສະຫວັນນະເຂດ', '{thailand}', 'in_process', '2026-08-10', 'ລະບົບ', '2026-08-10'),
  ('33333333-3333-3333-3333-000000000003', 'ທ້າວ ບຸນມີ ແກ້ວມະນີ', 'male', '020 5553 8821', '1995-06-21', 'ຈຳປາສັກ', '{korea}', 'placed', '2026-05-02', 'ລະບົບ', '2026-05-02'),
  ('33333333-3333-3333-3333-000000000004', 'ນາງ ຄຳແພງ ສຸລິຍະວົງ', 'female', '020 5554 4432', '2002-01-09', 'ຫຼວງພະບາງ', '{domestic,thailand}', 'available', '2026-08-15', 'ລະບົບ', '2026-08-15'),
  ('33333333-3333-3333-3333-000000000005', 'ທ້າວ ພຸດທະສອນ ອິນທະວົງ', 'male', '020 5555 7710', '1990-09-30', 'ວຽງຈັນ', '{japan}', 'paused', '2026-07-01', 'ພະນັກງານ ນ. ອຳມະລິນ', '2026-07-01'),
  ('33333333-3333-3333-3333-000000000006', 'ນາງ ວັນນະລີ ແສງອາລຸນ', 'female', '020 5556 9098', '1999-04-17', 'ບໍລິຄຳໄຊ', '{korea,thailand}', 'stale', '2026-05-20', 'ລະບົບ', '2026-05-20'),
  ('33333333-3333-3333-3333-000000000007', 'ທ້າວ ອຸດົມ ຈັນທະລາດ', 'male', '020 5557 3345', '1997-12-25', 'ຄຳມ່ວນ', '{thailand,domestic}', 'available', '2026-08-19', 'ລະບົບ', '2026-08-19'),
  ('33333333-3333-3333-3333-000000000008', 'ນາງ ນິດຕະຍາ ບົວທອງ', 'female', '020 5558 6620', '2001-08-08', 'ຄາຍສອນ', '{japan,korea}', 'available', '2026-08-17', 'ລະບົບ', '2026-08-17')
on conflict (id) do nothing;

insert into applications (id, worker_id, job_id, country, stage, documents, submitted_at) values
  ('44444444-4444-4444-4444-000000000001', '33333333-3333-3333-3333-000000000001', '22222222-2222-2222-2222-000000000001', 'korea', 'screening', '{"id_card":true,"passport":true,"language_cert":true,"health_check":false,"criminal_record":true}', '2026-08-05'),
  ('44444444-4444-4444-4444-000000000002', '33333333-3333-3333-3333-000000000002', '22222222-2222-2222-2222-000000000003', 'thailand', 'interview', '{"id_card":true,"passport":true,"health_check":true,"criminal_record":false}', '2026-08-01'),
  ('44444444-4444-4444-4444-000000000003', '33333333-3333-3333-3333-000000000003', '22222222-2222-2222-2222-000000000001', 'korea', 'contract_signed', '{"id_card":true,"passport":true,"language_cert":true,"health_check":true,"criminal_record":true}', '2026-04-10'),
  ('44444444-4444-4444-4444-000000000004', '33333333-3333-3333-3333-000000000004', '22222222-2222-2222-2222-000000000005', 'domestic', 'received', '{"id_card":true}', '2026-08-16'),
  ('44444444-4444-4444-4444-000000000005', '33333333-3333-3333-3333-000000000007', '22222222-2222-2222-2222-000000000004', 'thailand', 'offer', '{"id_card":true,"passport":true,"health_check":true,"criminal_record":true}', '2026-07-30'),
  ('44444444-4444-4444-4444-000000000006', '33333333-3333-3333-3333-000000000008', '22222222-2222-2222-2222-000000000002', 'japan', 'screening', '{"id_card":true,"passport":true,"language_cert":false,"health_check":false,"criminal_record":false,"skill_cert":false}', '2026-08-12')
on conflict (id) do nothing;

-- Note: worker w3 / application #3 above is seeded already at contract_signed,
-- so the trigger won't retroactively create its placement/contact log — insert those directly.
insert into placements (id, worker_id, country, company_name, position, start_date, contract_end_date, source) values
  ('55555555-5555-5555-5555-000000000001', '33333333-3333-3333-3333-000000000003', 'korea', 'ບໍລິສັດ ຄິມ ອີເລັກໂຕຣນິກ', 'ພະນັກງານປະກອບຊິ້ນສ່ວນ', '2026-05-02', '2029-05-02', 'jobdd')
on conflict (id) do nothing;

insert into contact_logs (id, worker_id, staff_name, contacted_at, channel, result, note) values
  ('66666666-6666-6666-6666-000000000001', '33333333-3333-3333-3333-000000000001', 'ນ. ອຳມະລິນ', '2026-08-18', 'phone', 'ຢືນຢັນຍັງຫາວຽກຢູ່', null),
  ('66666666-6666-6666-6666-000000000002', '33333333-3333-3333-3333-000000000003', 'ນ. ອຳມະລິນ', '2026-05-02', 'phone', 'ແຈ້ງເຊັນສັນຍາແລ້ວ', 'ອອກເດີນທາງ 02/05/2026'),
  ('66666666-6666-6666-6666-000000000003', '33333333-3333-3333-3333-000000000006', 'ທ້າວ ວິໄລພອນ', '2026-05-20', 'whatsapp', 'ບໍ່ຕອບກັບ', null)
on conflict (id) do nothing;

insert into country_requirements (country, doc_type, required, min_age, max_age, note) values
  ('domestic', 'id_card', true, 18, 60, null),
  ('domestic', 'criminal_record', false, 18, 60, 'ບາງບ່ອນຮ້ອງຂໍ'),
  ('thailand', 'id_card', true, 18, 60, null),
  ('thailand', 'passport', true, 18, 60, null),
  ('thailand', 'health_check', true, 18, 60, null),
  ('thailand', 'criminal_record', true, 18, 60, null),
  ('korea', 'id_card', true, 18, 39, null),
  ('korea', 'passport', true, 18, 39, null),
  ('korea', 'language_cert', true, 18, 39, 'EPS-TOPIK'),
  ('korea', 'health_check', true, 18, 39, 'ລວມກວດຕາບອດສີ'),
  ('korea', 'criminal_record', true, 18, 39, null),
  ('japan', 'id_card', true, 18, 60, null),
  ('japan', 'passport', true, 18, 60, null),
  ('japan', 'language_cert', true, 18, 60, 'JFT-Basic ຫຼື JLPT N4'),
  ('japan', 'health_check', true, 18, 60, null),
  ('japan', 'criminal_record', true, 18, 60, null),
  ('japan', 'skill_cert', true, 18, 60, 'SSW / ຝຶກງານ')
on conflict (country, doc_type) do nothing;
