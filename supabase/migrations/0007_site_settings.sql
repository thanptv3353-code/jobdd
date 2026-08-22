-- Job DD — a single editable "site settings" row: the association's full
-- name (Lao/English/abbreviation), contact phone/hotline, and social links
-- (Facebook/TikTok/YouTube), editable by staff at /admin/settings and shown
-- in the public site header/footer.
--
-- HOW TO USE: paste this whole file into the Supabase SQL Editor (New query) and Run.
-- Safe to re-run (idempotent), same as the earlier migrations.

create table if not exists site_settings (
  id boolean primary key default true check (id),
  org_name_lo text not null default '',
  org_name_en text not null default '',
  org_abbreviation text not null default '',
  phone text not null default '',
  hotline text not null default '',
  facebook_url text,
  tiktok_url text,
  youtube_url text,
  updated_at timestamptz not null default now()
);

insert into site_settings (id, org_name_lo, org_name_en, org_abbreviation, phone, hotline)
values (
  true,
  'ສະມາຄົມທຸລະກິດບໍລິການຈັດຫາງານລາວ',
  'Lao Employment Business Association',
  'LEBA',
  '020 28868688',
  '1505'
)
on conflict (id) do nothing;

grant usage on schema public to anon, authenticated;
grant select on site_settings to anon, authenticated;
grant update on site_settings to authenticated;

alter table site_settings enable row level security;
drop policy if exists "public read site_settings" on site_settings;
create policy "public read site_settings" on site_settings for select using (true);
drop policy if exists "staff update site_settings" on site_settings;
create policy "staff update site_settings" on site_settings for update using (is_staff()) with check (is_staff());
