-- Job DD — extends member companies with the fields the official LEBA
-- directory carries, so the whole record can be corrected from the admin UI
-- instead of only living in a PDF.
--
-- HOW TO USE: paste this into the Supabase SQL Editor (New query) and Run.
-- Safe to re-run (idempotent). Adds columns only — no data is changed.

alter table members add column if not exists name_en text;
alter table members add column if not exists address text;
alter table members add column if not exists email text;
alter table members add column if not exists line_id text;
alter table members add column if not exists license_no text;
alter table members add column if not exists license_expiry date;
alter table members add column if not exists director text;
alter table members add column if not exists sort_order int not null default 0;

create index if not exists members_sort_order_idx on members (sort_order, name);
