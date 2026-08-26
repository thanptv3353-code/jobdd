-- Job DD — per-country job categories.
--
-- Which occupations a Lao worker may legally take differs by corridor (Lao
-- labour law at home, the MOU occupation list for Thailand, E-8 seasonal for
-- Korea, SSW sectors for Japan). Staff need to keep those lists current
-- themselves, so they live in the database rather than in code.
--
-- Seeded from the reviewed category sheet: 35 categories, 146 occupations.
--
-- HOW TO USE: paste into the Supabase SQL Editor (New query) and Run.
-- Safe to re-run (idempotent).

-- Corridor context shown above each country's category list.
alter table countries add column if not exists route text;
alter table countries add column if not exists note text;
alter table countries add column if not exists accent_color text not null default '#475569';

create table if not exists job_categories (
  id uuid primary key default gen_random_uuid(),
  country text not null references countries(code) on delete cascade,
  name text not null,
  code text not null default '',
  is_open boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (country, name)
);
create index if not exists job_categories_country_idx on job_categories (country, sort_order);

create table if not exists job_category_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references job_categories(id) on delete cascade,
  name text not null,
  needs_review boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (category_id, name)
);
create index if not exists job_category_items_cat_idx on job_category_items (category_id, sort_order);

alter table job_categories enable row level security;
alter table job_category_items enable row level security;

drop policy if exists "public read job_categories" on job_categories;
create policy "public read job_categories" on job_categories for select using (true);
drop policy if exists "staff write job_categories" on job_categories;
create policy "staff write job_categories" on job_categories for all using (is_staff()) with check (is_staff());

drop policy if exists "public read job_category_items" on job_category_items;
create policy "public read job_category_items" on job_category_items for select using (true);
drop policy if exists "staff write job_category_items" on job_category_items;
create policy "staff write job_category_items" on job_category_items for all using (is_staff()) with check (is_staff());


-- ---------- corridor context ----------
update countries set route = 'ກົດໝາຍແຮງງານລາວ', note = 'ບໍ່ຕ້ອງມີວີຊາ. ນາຍຈ້າງລົງປະກາດຜ່ານ Job DD ໄດ້ໂດຍກົງ ແຕ່ຄວນຢືນຢັນວ່າເປັນນິຕິບຸກຄົນທີ່ຈົດທະບຽນຖືກຕ້ອງ.', accent_color = '#0F6E5C' where code = 'domestic';
update countries set route = 'MOU', note = 'ເຂົ້າຜ່ານ MOU ລາວ–ໄທ ຫຼື ບັດຜ່ານແດນ. ພາຍໃຕ້ MOU ແຮງງານຕ່າງດ້າວອະນຸຍາດເຮັດໄດ້ໃນຂອບເຂດ "ກຳມະກອນ" ແລະ "ຂາຍໜ້າຮ້ານ" ເປັນຫຼັກ — ກວດບັນຊີອາຊີບປັດຈຸບັນກັບ ກົມການຈັດຫາງານ ກະຊວງແຮງງານໄທ ກ່ອນລົງປະກາດທຸກຄັ້ງ.', accent_color = '#2F4B99' where code = 'thailand';
update countries set route = 'E-8 ແຮງງານຕາມລະດູການ', note = '⚠ E-8 ດຳເນີນຜ່ານ MOU ລະຫວ່າງອົງການປົກຄອງທ້ອງຖິ່ນເກົາຫຼີ ກັບ ອົງການປົກຄອງທ້ອງຖິ່ນລາວ ເທົ່ານັ້ນ — ນາຍໜ້າເອກະຊົນຮັບສະໝັກ ຫຼື ເກັບຄ່າທຳນຽມບໍ່ໄດ້. ບົດບາດຂອງ Job DD ຄື: ເຜີຍແຜ່ປະກາດທາງການ, ຊ່ວຍກຽມເອກະສານ ແລະ ເກັບລາຍຊື່ຜູ້ສົນໃຈໃຫ້ອົງການປົກຄອງທ້ອງຖິ່ນຄັດເລືອກ. ຢູ່ໄດ້ 5–8 ເດືອນຕໍ່ຄັ້ງ, ບໍ່ຕ້ອງມີຄະແນນ TOPIK. (E-9 ຕັດອອກແລ້ວ ຍ້ອນເປັນຊ່ອງທາງລັດຕໍ່ລັດຜ່ານ HRD Korea ບໍ່ແມ່ນເອກະຊົນ.)', accent_color = '#B3382C' where code = 'korea';
update countries set route = 'SSW ທັກສະສະເພາະ', note = 'ລາວເຊັນ MOC ກັບຢີ່ປຸ່ນວັນທີ 28 ກໍລະກົດ 2022 ຈຶ່ງສົ່ງແຮງງານ SSW ໄດ້ຄົບທຸກຂະແໜງ. ຕ້ອງຜ່ານ: ສອບເສັງທັກສະຂອງຂະແໜງນັ້ນ + ພາສາຢີ່ປຸ່ນລະດັບ JLPT N4 ຫຼື JFT-Basic, ອາຍຸ 18 ປີຂຶ້ນໄປ. ອົງການສົ່ງອອກແຮງງານຕ້ອງໄດ້ຮັບການຮັບຮອງຈາກລັດຖະບານລາວ.', accent_color = '#7A4C9E' where code = 'japan';

-- ---------- categories ----------
insert into job_categories (country, name, code, is_open, sort_order) values
  ('domestic', 'ໂຮງງານ ແລະ ຜະລິດ', '', true, 1),
  ('domestic', 'ກໍ່ສ້າງ', '', true, 2),
  ('domestic', 'ບໍລິການ ແລະ ທ່ອງທ່ຽວ', '', true, 3),
  ('domestic', 'ບໍ່ແຮ່ ແລະ ພະລັງງານ', '', true, 4),
  ('domestic', 'ກະສິກຳ ແລະ ລ້ຽງສັດ', '', true, 5),
  ('domestic', 'ຂົນສົ່ງ ແລະ ສາງ', '', true, 6),
  ('domestic', 'ສຳນັກງານ ແລະ ວິຊາຊີບ', '', true, 7),
  ('domestic', 'ຮັກສາຄວາມປອດໄພ ແລະ ແມ່ບ້ານ', '', true, 8),
  ('thailand', 'ກໍ່ສ້າງ', '', true, 1),
  ('thailand', 'ໂຮງງານ', '', true, 2),
  ('thailand', 'ກະສິກຳ ແລະ ລ້ຽງສັດ', '', true, 3),
  ('thailand', 'ປະມົງ', '', true, 4),
  ('thailand', 'ບໍລິການ ແລະ ອາຫານ', '', true, 5),
  ('thailand', 'ຮັບໃຊ້ໃນເຮືອນ', '', true, 6),
  ('thailand', 'ຂາຍໜ້າຮ້ານ', '', true, 7),
  ('thailand', 'ຂົນສົ່ງ ແລະ ສາງ', '', true, 8),
  ('korea', 'ກະສິກຳ', '농업', true, 1),
  ('korea', 'ປະມົງ', '어업', true, 2),
  ('korea', 'ລ້ຽງສັດ', '축산업', true, 3),
  ('japan', 'ດູແລຜູ້ສູງອາຍຸ', '介護', true, 1),
  ('japan', 'ທຳຄວາມສະອາດອາຄານ', 'ビルクリーニング', true, 2),
  ('japan', 'ຜະລິດຜະລິດຕະພັນອຸດສາຫະກຳ', '工業製品製造', true, 3),
  ('japan', 'ກໍ່ສ້າງ', '建設', true, 4),
  ('japan', 'ຕໍ່ເຮືອ ແລະ ເຄື່ອງຈັກເຮືອ', '造船・舶用', true, 5),
  ('japan', 'ສ້ອມແປງລົດ', '自動車整備', true, 6),
  ('japan', 'ການບິນ', '航空', true, 7),
  ('japan', 'ທີ່ພັກ ແລະ ໂຮງແຮມ', '宿泊', true, 8),
  ('japan', 'ກະສິກຳ', '農業', true, 9),
  ('japan', 'ປະມົງ ແລະ ລ້ຽງສັດນ້ຳ', '漁業', true, 10),
  ('japan', 'ຜະລິດອາຫານ ແລະ ເຄື່ອງດື່ມ', '飲食料品製造', true, 11),
  ('japan', 'ບໍລິການອາຫານ', '外食', false, 12),
  ('japan', 'ຂົນສົ່ງທາງລົດ', '自動車運送', true, 13),
  ('japan', 'ລົດໄຟ', '鉄道', true, 14),
  ('japan', 'ປ່າໄມ້', '林業', true, 15),
  ('japan', 'ອຸດສາຫະກຳໄມ້', '木材産業', true, 16)
on conflict (country, name) do update set
  code = excluded.code, is_open = excluded.is_open, sort_order = excluded.sort_order;

-- ---------- occupations within each category ----------
insert into job_category_items (category_id, name, needs_review, sort_order)
  select id, 'ຕັດຫຍິບເສື້ອຜ້າ', false, 1 from job_categories where country = 'domestic' and name = 'ໂຮງງານ ແລະ ຜະລິດ'
  union all
  select id, 'ປະກອບອີເລັກໂທຣນິກ (SEZ)', false, 2 from job_categories where country = 'domestic' and name = 'ໂຮງງານ ແລະ ຜະລິດ'
  union all
  select id, 'ປຸງແຕ່ງອາຫານ', false, 3 from job_categories where country = 'domestic' and name = 'ໂຮງງານ ແລະ ຜະລິດ'
  union all
  select id, 'ໂຮງງານໄມ້ ແລະ ເຟີນິເຈີ', false, 4 from job_categories where country = 'domestic' and name = 'ໂຮງງານ ແລະ ຜະລິດ'
  union all
  select id, 'ຊີມັງ', false, 5 from job_categories where country = 'domestic' and name = 'ໂຮງງານ ແລະ ຜະລິດ'
  union all
  select id, 'ບັນຈຸຫີບຫໍ່', false, 6 from job_categories where country = 'domestic' and name = 'ໂຮງງານ ແລະ ຜະລິດ'
  union all
  select id, 'ກຳມະກອນທົ່ວໄປ', false, 1 from job_categories where country = 'domestic' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຊ່າງປູນ', false, 2 from job_categories where country = 'domestic' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຊ່າງເຫຼັກ', false, 3 from job_categories where country = 'domestic' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຊ່າງໄມ້', false, 4 from job_categories where country = 'domestic' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຊ່າງໄຟ', false, 5 from job_categories where country = 'domestic' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຊ່າງປະປາ', false, 6 from job_categories where country = 'domestic' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຊ່າງເຊື່ອມ', false, 7 from job_categories where country = 'domestic' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຂັບເຄື່ອງຈັກໜັກ', false, 8 from job_categories where country = 'domestic' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຫົວໜ້າຄຸມງານ', false, 9 from job_categories where country = 'domestic' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ພະນັກງານໂຮງແຮມ', false, 1 from job_categories where country = 'domestic' and name = 'ບໍລິການ ແລະ ທ່ອງທ່ຽວ'
  union all
  select id, 'ແມ່ບ້ານໂຮງແຮມ', false, 2 from job_categories where country = 'domestic' and name = 'ບໍລິການ ແລະ ທ່ອງທ່ຽວ'
  union all
  select id, 'ພະນັກງານເສີບ', false, 3 from job_categories where country = 'domestic' and name = 'ບໍລິການ ແລະ ທ່ອງທ່ຽວ'
  union all
  select id, 'ພໍ່ຄົວ ແລະ ຜູ້ຊ່ວຍພໍ່ຄົວ', false, 4 from job_categories where country = 'domestic' and name = 'ບໍລິການ ແລະ ທ່ອງທ່ຽວ'
  union all
  select id, 'ບາຣິສຕາ', false, 5 from job_categories where country = 'domestic' and name = 'ບໍລິການ ແລະ ທ່ອງທ່ຽວ'
  union all
  select id, 'ຮ້ານສະດວກຊື້', false, 6 from job_categories where country = 'domestic' and name = 'ບໍລິການ ແລະ ທ່ອງທ່ຽວ'
  union all
  select id, 'ພະນັກງານຂາຍ', false, 7 from job_categories where country = 'domestic' and name = 'ບໍລິການ ແລະ ທ່ອງທ່ຽວ'
  union all
  select id, 'ພະນັກງານຕ້ອນຮັບ', false, 8 from job_categories where country = 'domestic' and name = 'ບໍລິການ ແລະ ທ່ອງທ່ຽວ'
  union all
  select id, 'ໄກ້ນຳທ່ຽວ', false, 9 from job_categories where country = 'domestic' and name = 'ບໍລິການ ແລະ ທ່ອງທ່ຽວ'
  union all
  select id, 'ຄົນງານບໍ່ແຮ່', false, 1 from job_categories where country = 'domestic' and name = 'ບໍ່ແຮ່ ແລະ ພະລັງງານ'
  union all
  select id, 'ຊ່າງເຄື່ອງຈັກ', false, 2 from job_categories where country = 'domestic' and name = 'ບໍ່ແຮ່ ແລະ ພະລັງງານ'
  union all
  select id, 'ຊ່າງໄຟຟ້າ', false, 3 from job_categories where country = 'domestic' and name = 'ບໍ່ແຮ່ ແລະ ພະລັງງານ'
  union all
  select id, 'ພະນັກງານເຂື່ອນໄຟຟ້າ', false, 4 from job_categories where country = 'domestic' and name = 'ບໍ່ແຮ່ ແລະ ພະລັງງານ'
  union all
  select id, 'ຮັກສາຄວາມປອດໄພໜ້າງານ', false, 5 from job_categories where country = 'domestic' and name = 'ບໍ່ແຮ່ ແລະ ພະລັງງານ'
  union all
  select id, 'ສວນຢາງພາລາ', false, 1 from job_categories where country = 'domestic' and name = 'ກະສິກຳ ແລະ ລ້ຽງສັດ'
  union all
  select id, 'ສວນກ້ວຍ ແລະ ໝາກໄມ້', false, 2 from job_categories where country = 'domestic' and name = 'ກະສິກຳ ແລະ ລ້ຽງສັດ'
  union all
  select id, 'ປູກຝັງທົ່ວໄປ', false, 3 from job_categories where country = 'domestic' and name = 'ກະສິກຳ ແລະ ລ້ຽງສັດ'
  union all
  select id, 'ລ້ຽງສັດ', false, 4 from job_categories where country = 'domestic' and name = 'ກະສິກຳ ແລະ ລ້ຽງສັດ'
  union all
  select id, 'ປະມົງນ້ຳຈືດ', false, 5 from job_categories where country = 'domestic' and name = 'ກະສິກຳ ແລະ ລ້ຽງສັດ'
  union all
  select id, 'ຂັບລົດບັນທຸກ', false, 1 from job_categories where country = 'domestic' and name = 'ຂົນສົ່ງ ແລະ ສາງ'
  union all
  select id, 'ຂັບລົດຮັບສົ່ງ', false, 2 from job_categories where country = 'domestic' and name = 'ຂົນສົ່ງ ແລະ ສາງ'
  union all
  select id, 'ພະນັກງານສາງ', false, 3 from job_categories where country = 'domestic' and name = 'ຂົນສົ່ງ ແລະ ສາງ'
  union all
  select id, 'ພະນັກງານສົ່ງເຄື່ອງ', false, 4 from job_categories where country = 'domestic' and name = 'ຂົນສົ່ງ ແລະ ສາງ'
  union all
  select id, 'ພິທີການສາລະບານ', false, 5 from job_categories where country = 'domestic' and name = 'ຂົນສົ່ງ ແລະ ສາງ'
  union all
  select id, 'ບັນຊີ', false, 1 from job_categories where country = 'domestic' and name = 'ສຳນັກງານ ແລະ ວິຊາຊີບ'
  union all
  select id, 'ທຸລະການ', false, 2 from job_categories where country = 'domestic' and name = 'ສຳນັກງານ ແລະ ວິຊາຊີບ'
  union all
  select id, 'ຝ່າຍບຸກຄົນ', false, 3 from job_categories where country = 'domestic' and name = 'ສຳນັກງານ ແລະ ວິຊາຊີບ'
  union all
  select id, 'ການຕະຫຼາດ', false, 4 from job_categories where country = 'domestic' and name = 'ສຳນັກງານ ແລະ ວິຊາຊີບ'
  union all
  select id, 'ນາຍພາສາ ລາວ-ເກົາຫຼີ', false, 5 from job_categories where country = 'domestic' and name = 'ສຳນັກງານ ແລະ ວິຊາຊີບ'
  union all
  select id, 'ໄອທີ', false, 6 from job_categories where country = 'domestic' and name = 'ສຳນັກງານ ແລະ ວິຊາຊີບ'
  union all
  select id, 'ຄູສອນ', false, 7 from job_categories where country = 'domestic' and name = 'ສຳນັກງານ ແລະ ວິຊາຊີບ'
  union all
  select id, 'ຍາມ', false, 1 from job_categories where country = 'domestic' and name = 'ຮັກສາຄວາມປອດໄພ ແລະ ແມ່ບ້ານ'
  union all
  select id, 'ພະນັກງານທຳຄວາມສະອາດ', false, 2 from job_categories where country = 'domestic' and name = 'ຮັກສາຄວາມປອດໄພ ແລະ ແມ່ບ້ານ'
  union all
  select id, 'ຄົນສວນ', false, 3 from job_categories where country = 'domestic' and name = 'ຮັກສາຄວາມປອດໄພ ແລະ ແມ່ບ້ານ'
  union all
  select id, 'ຄົນຊ່ວຍວຽກເຮືອນ', false, 4 from job_categories where country = 'domestic' and name = 'ຮັກສາຄວາມປອດໄພ ແລະ ແມ່ບ້ານ'
  union all
  select id, 'ກຳມະກອນ', false, 1 from job_categories where country = 'thailand' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຊ່າງປູນ', false, 2 from job_categories where country = 'thailand' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຊ່າງເຫຼັກ', false, 3 from job_categories where country = 'thailand' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຊ່າງໄມ້', false, 4 from job_categories where country = 'thailand' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຜູ້ຊ່ວຍຊ່າງ', false, 5 from job_categories where country = 'thailand' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຂົນວັດສະດຸ', false, 6 from job_categories where country = 'thailand' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ອາຫານກະປ໋ອງ', false, 1 from job_categories where country = 'thailand' and name = 'ໂຮງງານ'
  union all
  select id, 'ອາຫານທະເລແຊ່ແຂງ', false, 2 from job_categories where country = 'thailand' and name = 'ໂຮງງານ'
  union all
  select id, 'ຕັດຫຍິບ', false, 3 from job_categories where country = 'thailand' and name = 'ໂຮງງານ'
  union all
  select id, 'ຢາງພາລາ', false, 4 from job_categories where country = 'thailand' and name = 'ໂຮງງານ'
  union all
  select id, 'ພລາສຕິກ', false, 5 from job_categories where country = 'thailand' and name = 'ໂຮງງານ'
  union all
  select id, 'ອີເລັກໂທຣນິກ', false, 6 from job_categories where country = 'thailand' and name = 'ໂຮງງານ'
  union all
  select id, 'ຊິ້ນສ່ວນລົດ', false, 7 from job_categories where country = 'thailand' and name = 'ໂຮງງານ'
  union all
  select id, 'ບັນຈຸຫີບຫໍ່', false, 8 from job_categories where country = 'thailand' and name = 'ໂຮງງານ'
  union all
  select id, 'ສວນຜັກ ແລະ ໝາກໄມ້', false, 1 from job_categories where country = 'thailand' and name = 'ກະສິກຳ ແລະ ລ້ຽງສັດ'
  union all
  select id, 'ໄຮ່ອ້ອຍ', false, 2 from job_categories where country = 'thailand' and name = 'ກະສິກຳ ແລະ ລ້ຽງສັດ'
  union all
  select id, 'ສວນຢາງ', false, 3 from job_categories where country = 'thailand' and name = 'ກະສິກຳ ແລະ ລ້ຽງສັດ'
  union all
  select id, 'ຟາມໄກ່ ແລະ ໝູ', false, 4 from job_categories where country = 'thailand' and name = 'ກະສິກຳ ແລະ ລ້ຽງສັດ'
  union all
  select id, 'ບໍ່ກຸ້ງ ແລະ ບໍ່ປາ', false, 5 from job_categories where country = 'thailand' and name = 'ກະສິກຳ ແລະ ລ້ຽງສັດ'
  union all
  select id, 'ລູກເຮືອປະມົງ', false, 1 from job_categories where country = 'thailand' and name = 'ປະມົງ'
  union all
  select id, 'ແປຮູບອາຫານທະເລ', false, 2 from job_categories where country = 'thailand' and name = 'ປະມົງ'
  union all
  select id, 'ທ່າເຮືອປະມົງ', false, 3 from job_categories where country = 'thailand' and name = 'ປະມົງ'
  union all
  select id, 'ຮ້ານອາຫານ', false, 1 from job_categories where country = 'thailand' and name = 'ບໍລິການ ແລະ ອາຫານ'
  union all
  select id, 'ຜູ້ຊ່ວຍພໍ່ຄົວ', false, 2 from job_categories where country = 'thailand' and name = 'ບໍລິການ ແລະ ອາຫານ'
  union all
  select id, 'ລ້າງຖ້ວຍ', false, 3 from job_categories where country = 'thailand' and name = 'ບໍລິການ ແລະ ອາຫານ'
  union all
  select id, 'ໂຮງແຮມ', false, 4 from job_categories where country = 'thailand' and name = 'ບໍລິການ ແລະ ອາຫານ'
  union all
  select id, 'ແມ່ບ້ານ', false, 5 from job_categories where country = 'thailand' and name = 'ບໍລິການ ແລະ ອາຫານ'
  union all
  select id, 'ນວດ ແລະ ສະປາ', false, 6 from job_categories where country = 'thailand' and name = 'ບໍລິການ ແລະ ອາຫານ'
  union all
  select id, 'ຮ້ານກາເຟ', false, 7 from job_categories where country = 'thailand' and name = 'ບໍລິການ ແລະ ອາຫານ'
  union all
  select id, 'ຄົນຊ່ວຍວຽກເຮືອນ', false, 1 from job_categories where country = 'thailand' and name = 'ຮັບໃຊ້ໃນເຮືອນ'
  union all
  select id, 'ລ້ຽງເດັກ', false, 2 from job_categories where country = 'thailand' and name = 'ຮັບໃຊ້ໃນເຮືອນ'
  union all
  select id, 'ເບິ່ງແຍງຜູ້ສູງອາຍຸ', false, 3 from job_categories where country = 'thailand' and name = 'ຮັບໃຊ້ໃນເຮືອນ'
  union all
  select id, 'ພະນັກງານຂາຍໃນຕະຫຼາດ', false, 1 from job_categories where country = 'thailand' and name = 'ຂາຍໜ້າຮ້ານ'
  union all
  select id, 'ຮ້ານຄ້າ', false, 2 from job_categories where country = 'thailand' and name = 'ຂາຍໜ້າຮ້ານ'
  union all
  select id, 'ພະນັກງານສາງ', true, 1 from job_categories where country = 'thailand' and name = 'ຂົນສົ່ງ ແລະ ສາງ'
  union all
  select id, 'ຍົກເຄື່ອງ', true, 2 from job_categories where country = 'thailand' and name = 'ຂົນສົ່ງ ແລະ ສາງ'
  union all
  select id, 'ຂັບລົດຍົກ', true, 3 from job_categories where country = 'thailand' and name = 'ຂົນສົ່ງ ແລະ ສາງ'
  union all
  select id, 'ປູກຜັກເຮືອນແກ້ວ', false, 1 from job_categories where country = 'korea' and name = 'ກະສິກຳ'
  union all
  select id, 'ເກັບໝາກໄມ້ (ແອັບເປິ້ນ, ສະຕໍເບີຣີ, ໝາກໂມ)', false, 2 from job_categories where country = 'korea' and name = 'ກະສິກຳ'
  union all
  select id, 'ປູກພືດໄຮ່ນາ', false, 3 from job_categories where country = 'korea' and name = 'ກະສິກຳ'
  union all
  select id, 'ແປຮູບຂັ້ນຕົ້ນໃນຟາມ', false, 4 from job_categories where country = 'korea' and name = 'ກະສິກຳ'
  union all
  select id, 'ເຮືອປະມົງຊາຍຝັ່ງ', false, 1 from job_categories where country = 'korea' and name = 'ປະມົງ'
  union all
  select id, 'ລ້ຽງສັດນ້ຳ', false, 2 from job_categories where country = 'korea' and name = 'ປະມົງ'
  union all
  select id, 'ແປຮູບປາຂັ້ນຕົ້ນ', false, 3 from job_categories where country = 'korea' and name = 'ປະມົງ'
  union all
  select id, 'ຟາມໄກ່', false, 1 from job_categories where country = 'korea' and name = 'ລ້ຽງສັດ'
  union all
  select id, 'ຟາມໝູ', false, 2 from job_categories where country = 'korea' and name = 'ລ້ຽງສັດ'
  union all
  select id, 'ຟາມງົວ', false, 3 from job_categories where country = 'korea' and name = 'ລ້ຽງສັດ'
  union all
  select id, 'ຊ່ວຍອາບນ້ຳ ແລະ ກິນເຂົ້າ', false, 1 from job_categories where country = 'japan' and name = 'ດູແລຜູ້ສູງອາຍຸ'
  union all
  select id, 'ຟື້ນຟູຮ່າງກາຍ', false, 2 from job_categories where country = 'japan' and name = 'ດູແລຜູ້ສູງອາຍຸ'
  union all
  select id, 'ບ້ານພັກຄົນຊະລາ', false, 3 from job_categories where country = 'japan' and name = 'ດູແລຜູ້ສູງອາຍຸ'
  union all
  select id, 'ອາຄານສຳນັກງານ', false, 1 from job_categories where country = 'japan' and name = 'ທຳຄວາມສະອາດອາຄານ'
  union all
  select id, 'ໂຮງແຮມ', false, 2 from job_categories where country = 'japan' and name = 'ທຳຄວາມສະອາດອາຄານ'
  union all
  select id, 'ໂຮງໝໍ', false, 3 from job_categories where country = 'japan' and name = 'ທຳຄວາມສະອາດອາຄານ'
  union all
  select id, 'ກຶງໂລຫະ', false, 1 from job_categories where country = 'japan' and name = 'ຜະລິດຜະລິດຕະພັນອຸດສາຫະກຳ'
  union all
  select id, 'ປັ໊ມໂລຫະ', false, 2 from job_categories where country = 'japan' and name = 'ຜະລິດຜະລິດຕະພັນອຸດສາຫະກຳ'
  union all
  select id, 'ປະກອບໃນໂຮງງານ', false, 3 from job_categories where country = 'japan' and name = 'ຜະລິດຜະລິດຕະພັນອຸດສາຫະກຳ'
  union all
  select id, 'ເຊື່ອມ', false, 4 from job_categories where country = 'japan' and name = 'ຜະລິດຜະລິດຕະພັນອຸດສາຫະກຳ'
  union all
  select id, 'ອີເລັກໂທຣນິກ', false, 5 from job_categories where country = 'japan' and name = 'ຜະລິດຜະລິດຕະພັນອຸດສາຫະກຳ'
  union all
  select id, 'ຄອນກຣີດ', false, 1 from job_categories where country = 'japan' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ນັ່ງຮ້ານ', false, 2 from job_categories where country = 'japan' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຊ່າງໄມ້', false, 3 from job_categories where country = 'japan' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຂຸດດິນ', false, 4 from job_categories where country = 'japan' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ຕົກແຕ່ງພາຍໃນ', false, 5 from job_categories where country = 'japan' and name = 'ກໍ່ສ້າງ'
  union all
  select id, 'ເຊື່ອມ', false, 1 from job_categories where country = 'japan' and name = 'ຕໍ່ເຮືອ ແລະ ເຄື່ອງຈັກເຮືອ'
  union all
  select id, 'ທາສີ', false, 2 from job_categories where country = 'japan' and name = 'ຕໍ່ເຮືອ ແລະ ເຄື່ອງຈັກເຮືອ'
  union all
  select id, 'ປະກອບ', false, 3 from job_categories where country = 'japan' and name = 'ຕໍ່ເຮືອ ແລະ ເຄື່ອງຈັກເຮືອ'
  union all
  select id, 'ຊ່າງກົນຈັກ', false, 4 from job_categories where country = 'japan' and name = 'ຕໍ່ເຮືອ ແລະ ເຄື່ອງຈັກເຮືອ'
  union all
  select id, 'ບຳລຸງຮັກສາ', false, 1 from job_categories where country = 'japan' and name = 'ສ້ອມແປງລົດ'
  union all
  select id, 'ກວດສະພາບ', false, 2 from job_categories where country = 'japan' and name = 'ສ້ອມແປງລົດ'
  union all
  select id, 'ສ້ອມແປງ', false, 3 from job_categories where country = 'japan' and name = 'ສ້ອມແປງລົດ'
  union all
  select id, 'ບໍລິການພື້ນດິນ', false, 1 from job_categories where country = 'japan' and name = 'ການບິນ'
  union all
  select id, 'ຂົນກະເປົາ', false, 2 from job_categories where country = 'japan' and name = 'ການບິນ'
  union all
  select id, 'ບຳລຸງຮັກສາເຮືອບິນ', false, 3 from job_categories where country = 'japan' and name = 'ການບິນ'
  union all
  select id, 'ຕ້ອນຮັບ', false, 1 from job_categories where country = 'japan' and name = 'ທີ່ພັກ ແລະ ໂຮງແຮມ'
  union all
  select id, 'ແມ່ບ້ານ', false, 2 from job_categories where country = 'japan' and name = 'ທີ່ພັກ ແລະ ໂຮງແຮມ'
  union all
  select id, 'ບໍລິການແຂກ', false, 3 from job_categories where country = 'japan' and name = 'ທີ່ພັກ ແລະ ໂຮງແຮມ'
  union all
  select id, 'ປູກຜັກເຮືອນແກ້ວ', false, 1 from job_categories where country = 'japan' and name = 'ກະສິກຳ'
  union all
  select id, 'ສວນໝາກໄມ້', false, 2 from job_categories where country = 'japan' and name = 'ກະສິກຳ'
  union all
  select id, 'ລ້ຽງສັດ', false, 3 from job_categories where country = 'japan' and name = 'ກະສິກຳ'
  union all
  select id, 'ເຮືອປະມົງ', false, 1 from job_categories where country = 'japan' and name = 'ປະມົງ ແລະ ລ້ຽງສັດນ້ຳ'
  union all
  select id, 'ຟາມຫອຍ ແລະ ປາ', false, 2 from job_categories where country = 'japan' and name = 'ປະມົງ ແລະ ລ້ຽງສັດນ້ຳ'
  union all
  select id, 'ໂຮງງານອາຫານ', false, 1 from job_categories where country = 'japan' and name = 'ຜະລິດອາຫານ ແລະ ເຄື່ອງດື່ມ'
  union all
  select id, 'ເບເກີຣີ', false, 2 from job_categories where country = 'japan' and name = 'ຜະລິດອາຫານ ແລະ ເຄື່ອງດື່ມ'
  union all
  select id, 'ບັນຈຸຫີບຫໍ່', false, 3 from job_categories where country = 'japan' and name = 'ຜະລິດອາຫານ ແລະ ເຄື່ອງດື່ມ'
  union all
  select id, 'ຮ້ານອາຫານ', false, 1 from job_categories where country = 'japan' and name = 'ບໍລິການອາຫານ'
  union all
  select id, 'ຄົວ', false, 2 from job_categories where country = 'japan' and name = 'ບໍລິການອາຫານ'
  union all
  select id, 'ບໍລິການລູກຄ້າ', false, 3 from job_categories where country = 'japan' and name = 'ບໍລິການອາຫານ'
  union all
  select id, 'ຂັບລົດເມ', false, 1 from job_categories where country = 'japan' and name = 'ຂົນສົ່ງທາງລົດ'
  union all
  select id, 'ຂັບແທັກຊີ', false, 2 from job_categories where country = 'japan' and name = 'ຂົນສົ່ງທາງລົດ'
  union all
  select id, 'ຂັບລົດບັນທຸກ', false, 3 from job_categories where country = 'japan' and name = 'ຂົນສົ່ງທາງລົດ'
  union all
  select id, 'ບຳລຸງຮັກສາ', false, 1 from job_categories where country = 'japan' and name = 'ລົດໄຟ'
  union all
  select id, 'ພະນັກງານສະຖານີ', false, 2 from job_categories where country = 'japan' and name = 'ລົດໄຟ'
  union all
  select id, 'ປູກປ່າ', false, 1 from job_categories where country = 'japan' and name = 'ປ່າໄມ້'
  union all
  select id, 'ຕັດໄມ້', false, 2 from job_categories where country = 'japan' and name = 'ປ່າໄມ້'
  union all
  select id, 'ໂຮງເລື່ອຍ', false, 1 from job_categories where country = 'japan' and name = 'ອຸດສາຫະກຳໄມ້'
  union all
  select id, 'ແປຮູບໄມ້', false, 2 from job_categories where country = 'japan' and name = 'ອຸດສາຫະກຳໄມ້'
on conflict (category_id, name) do update set
  needs_review = excluded.needs_review, sort_order = excluded.sort_order;
