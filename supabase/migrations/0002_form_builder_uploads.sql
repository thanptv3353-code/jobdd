-- Job DD — custom registration fields (form builder) + worker file uploads.
--
-- HOW TO USE: paste this whole file into the Supabase SQL Editor and Run.
-- Safe to re-run (idempotent), same as 0001_init.sql.

-- ============================================================
-- form_fields — staff-defined extra fields on the /register form
-- ============================================================

create table if not exists form_fields (
  id uuid primary key default gen_random_uuid(),
  field_key text not null unique,
  label text not null,
  field_type text not null default 'text' check (field_type in ('text', 'textarea', 'number', 'date', 'select', 'checkbox')),
  options text[] not null default '{}',
  required boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table worker_profiles add column if not exists custom_fields jsonb not null default '{}';

-- ============================================================
-- worker_files — documents/photos workers upload themselves
-- ============================================================

create table if not exists worker_files (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references worker_profiles(id) on delete cascade,
  doc_type text not null,
  file_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_at timestamptz not null default now()
);
create index if not exists worker_files_worker_idx on worker_files (worker_id);

-- ============================================================
-- Storage bucket for worker uploads (private — signed URLs only)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('worker-uploads', 'worker-uploads', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anon upload worker files" on storage.objects;
create policy "anon upload worker files" on storage.objects
  for insert
  with check (bucket_id = 'worker-uploads');

drop policy if exists "staff read worker files" on storage.objects;
create policy "staff read worker files" on storage.objects
  for select
  using (bucket_id = 'worker-uploads' and is_staff());

drop policy if exists "staff delete worker files" on storage.objects;
create policy "staff delete worker files" on storage.objects
  for delete
  using (bucket_id = 'worker-uploads' and is_staff());

-- ============================================================
-- Table-level grants (see note in 0001_init.sql — RLS alone isn't enough)
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select on form_fields to anon, authenticated;
grant insert, update, delete on form_fields to authenticated;

grant insert on worker_files to anon;
grant select, delete on worker_files to authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table form_fields enable row level security;
drop policy if exists "public read form_fields" on form_fields;
create policy "public read form_fields" on form_fields for select using (true);
drop policy if exists "staff write form_fields" on form_fields;
create policy "staff write form_fields" on form_fields for all using (is_staff()) with check (is_staff());

alter table worker_files enable row level security;
drop policy if exists "anon insert worker_files" on worker_files;
create policy "anon insert worker_files" on worker_files for insert with check (true);
drop policy if exists "staff select worker_files" on worker_files;
create policy "staff select worker_files" on worker_files for select using (is_staff());
drop policy if exists "staff delete worker_files" on worker_files;
create policy "staff delete worker_files" on worker_files for delete using (is_staff());
