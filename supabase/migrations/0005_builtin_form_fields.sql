-- Job DD — let staff edit the label/required-ness of the built-in
-- registration fields (photo, name, phone, dob, addresses, countries, ...)
-- from the same /admin/form-builder page used for custom fields, instead of
-- those being hard-coded strings in the React component.
--
-- HOW TO USE: paste this whole file into the Supabase SQL Editor (New query) and Run.
-- Safe to re-run (idempotent), same as the earlier migrations.

alter table form_fields add column if not exists is_builtin boolean not null default false;

insert into form_fields (field_key, label, field_type, required, sort_order, is_builtin)
values
  ('_photo', 'ຮູບຖ່າຍ 3x4', 'text', false, -100, true),
  ('_name', 'ຊື່ ແລະ ນາມສະກຸນ', 'text', true, -90, true),
  ('_gender', 'ເພດ', 'text', true, -80, true),
  ('_phone', 'ເບີໂທລະສັບ', 'text', true, -70, true),
  ('_dob', 'ວັນເດືອນປີເກີດ', 'text', true, -60, true),
  ('_perm_address', 'ທີ່ຢູ່ຕາມສຳມະໂນຄົວ', 'text', false, -50, true),
  ('_cur_address', 'ທີ່ຢູ່ປັດຈຸບັນ', 'text', false, -40, true),
  ('_countries', 'ສົນໃຈໄປປະເທດໃດແດ່? (ເລືອກໄດ້ຫຼາຍອັນ)', 'text', true, -30, true),
  ('_id_card', 'ບັດປະຈຳຕົວ / ສຳມະໂນຄົວ', 'text', false, -20, true),
  ('_additional_docs', 'ເອກະສານເພີ່ມເຕີມ (ບໍ່ບັງຄັບ) — ເຊັ່ນ ຊີວະປະຫວັດ (CV)', 'text', false, -10, true)
on conflict (field_key) do nothing;
