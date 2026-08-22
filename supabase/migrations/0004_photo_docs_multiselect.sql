-- Job DD — profile photo at the top of registration, a repeatable "extra
-- documents" attachment area (e.g. CV), and a multi-select custom field type.
--
-- HOW TO USE: paste this whole file into the Supabase SQL Editor (New query) and Run.
-- Safe to re-run (idempotent), same as 0001/0002/0003.

alter table worker_files add column if not exists description text;

alter table form_fields drop constraint if exists form_fields_field_type_check;
alter table form_fields add constraint form_fields_field_type_check
  check (field_type in ('text', 'textarea', 'number', 'date', 'select', 'multiselect', 'checkbox'));
