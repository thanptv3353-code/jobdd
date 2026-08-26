-- Job DD — the 18 provinces and 148 districts of Laos.
--
-- Applicants typed their address by hand, so the same district arrived spelt
-- several ways and the statistics page could not group by place reliably.
-- Registration now offers a province, then the districts inside it.
--
-- Villages stay free text on purpose: Laos has roughly 8,500 of them and no
-- public list covers them, so a dropdown would exclude most applicants.
--
-- Names are stored without their "ແຂວງ" / "ເມືອງ" prefix because the form
-- label already supplies it — Vientiane Capital keeps its full name, which is
-- not a "ແຂວງ". Existing free-text addresses are left untouched.
--
-- Source: lo.wikipedia.org "ເມືອງ ແລະ ເທສະບານໃນລາວ".
--
-- HOW TO USE: paste into the Supabase SQL Editor (New query) and Run.
-- Safe to re-run (idempotent).

create table if not exists provinces (
  code text primary key,
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists districts (
  code text primary key,
  province_code text not null references provinces(code) on delete cascade,
  name text not null,
  name_en text not null default '',
  sort_order int not null default 0,
  unique (province_code, name)
);
create index if not exists districts_province_idx on districts (province_code, sort_order);

alter table provinces enable row level security;
alter table districts enable row level security;

drop policy if exists "public read provinces" on provinces;
create policy "public read provinces" on provinces for select using (true);
drop policy if exists "staff write provinces" on provinces;
create policy "staff write provinces" on provinces for all using (is_staff()) with check (is_staff());

drop policy if exists "public read districts" on districts;
create policy "public read districts" on districts for select using (true);
drop policy if exists "staff write districts" on districts;
create policy "staff write districts" on districts for all using (is_staff()) with check (is_staff());

-- RLS filters rows a role may already reach; without these grants the tables
-- are refused outright (the mistake 0014 made and 0017 had to repair).
grant select on provinces, districts to anon, authenticated;
grant insert, update, delete on provinces, districts to authenticated;

insert into provinces (code, name, sort_order) values

  ('1', 'ນະຄອນຫຼວງວຽງຈັນ', 1),
  ('2', 'ຜົ້ງສາລີ', 2),
  ('3', 'ຫຼວງນໍ້າທາ', 3),
  ('4', 'ອຸດົມໄຊ', 4),
  ('5', 'ບໍ່ແກ້ວ', 5),
  ('6', 'ຫຼວງພະບາງ', 6),
  ('7', 'ຫົວພັນ', 7),
  ('8', 'ໄຊຍະບູລີ', 8),
  ('9', 'ຊຽງຂວາງ', 9),
  ('10', 'ວຽງຈັນ', 10),
  ('11', 'ບໍລິຄຳໄຊ', 11),
  ('12', 'ຄຳມ່ວນ', 12),
  ('13', 'ສະຫວັນນະເຂດ', 13),
  ('14', 'ສາລະວັນ', 14),
  ('15', 'ເຊກອງ', 15),
  ('16', 'ຈຳປາສັກ', 16),
  ('17', 'ອັດຕະປື', 17),
  ('18', 'ໄຊສົມບູນ', 18)
on conflict (code) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into districts (code, province_code, name, name_en, sort_order) values
  ('1-01', '1', 'ຈັນທະບູລີ', 'Chanthabuly', 1),
  ('1-02', '1', 'ສີໂຄດຕະບອງ', 'Sikhottabong', 2),
  ('1-03', '1', 'ໄຊເສດຖາ', 'Xaysetha', 3),
  ('1-04', '1', 'ສີສັດຕະນາກ', 'Sisattanak', 4),
  ('1-05', '1', 'ນາຊາຍທອງ', 'Naxaithong', 5),
  ('1-06', '1', 'ໄຊທານີ', 'Xaythany', 6),
  ('1-07', '1', 'ຫາດຊາຍຟອງ', 'Hadxayfong', 7),
  ('1-08', '1', 'ສັງທອງ', 'Sangthong', 8),
  ('1-09', '1', 'ປາກງື່ມ', 'Parkngum', 9),
  ('2-01', '2', 'ຜົ້ງສາລີ', 'Phongsaly', 1),
  ('2-02', '2', 'ໃໝ່', 'May', 2),
  ('2-03', '2', 'ຂວາ', 'Khoua', 3),
  ('2-04', '2', 'ສຳພັນ', 'Samphanh', 4),
  ('2-05', '2', 'ບຸນເໜືອ', 'Boun Neua', 5),
  ('2-06', '2', 'ຍອດອູ', 'Yot Ou', 6),
  ('2-07', '2', 'ບຸນໃຕ້', 'Boun Tay', 7),
  ('3-01', '3', 'ຫຼວງນໍ້າທາ', 'Namtha', 1),
  ('3-02', '3', 'ສີງ', 'Sing', 2),
  ('3-03', '3', 'ລອງ', 'Long', 3),
  ('3-04', '3', 'ວຽງພູຄາ', 'Viengphoukha', 4),
  ('3-05', '3', 'ນາແລ', 'Na Le', 5),
  ('4-01', '4', 'ໄຊ', 'Xay', 1),
  ('4-02', '4', 'ຫຼາ', 'La', 2),
  ('4-03', '4', 'ນາໝໍ້', 'Na Mo', 3),
  ('4-04', '4', 'ງາ', 'Nga', 4),
  ('4-05', '4', 'ແບ່ງ', 'Beng', 5),
  ('4-06', '4', 'ຮຸນ', 'Houne', 6),
  ('4-07', '4', 'ປາກແບ່ງ', 'Pak Beng', 7),
  ('5-01', '5', 'ຫ້ວຍຊາຍ', 'Houayxay', 1),
  ('5-02', '5', 'ຕົ້ນເຜິ້ງ', 'Ton Pheung', 2),
  ('5-03', '5', 'ເມິງ', 'Meung', 3),
  ('5-04', '5', 'ຜາອຸດົມ', 'Pha Oudom', 4),
  ('5-05', '5', 'ປາກທາ', 'Pak Tha', 5),
  ('6-01', '6', 'ຫຼວງພະບາງ', 'Luang Prabang', 1),
  ('6-02', '6', 'ຊຽງເງິນ', 'Xiengngeun', 2),
  ('6-03', '6', 'ນານ', 'Nane', 3),
  ('6-04', '6', 'ປາກອູ', 'Pak Ou', 4),
  ('6-05', '6', 'ນ້ຳບາກ', 'Nam Bak', 5),
  ('6-06', '6', 'ງອຍ', 'Ngoy', 6),
  ('6-07', '6', 'ປາກແຊງ', 'Pak Seng', 7),
  ('6-08', '6', 'ໂພນໄຊ', 'Phonxay', 8),
  ('6-09', '6', 'ຈອມເພັດ', 'Chomphet', 9),
  ('6-10', '6', 'ວຽງຄຳ', 'Viengkham', 10),
  ('6-11', '6', 'ພູຄູນ', 'Phoukhoune', 11),
  ('6-12', '6', 'ໂພນທອງ', 'Phonthong', 12),
  ('7-01', '7', 'ຊຳເໜືອ', 'Xam Neua', 1),
  ('7-02', '7', 'ຊຽງຄໍ້', 'Xiengkho', 2),
  ('7-03', '7', 'ວຽງທອງ', 'Hiam', 3),
  ('7-04', '7', 'ວຽງໄຊ', 'Viengxay', 4),
  ('7-05', '7', 'ຫົວເມືອງ', 'Houameuang', 5),
  ('7-06', '7', 'ຊຳໃຕ້', 'Samtay', 6),
  ('7-07', '7', 'ສົບເບົາ', 'Sop Bao', 7),
  ('7-08', '7', 'ແອດ', 'Et', 8),
  ('7-09', '7', 'ກອັນ', 'Kone', 9),
  ('7-10', '7', 'ຊ່ອນ', 'Xon', 10),
  ('8-01', '8', 'ໄຊຍະບູລີ', 'Sainyabuli', 1),
  ('8-02', '8', 'ຄອບ', 'Khop', 2),
  ('8-03', '8', 'ຫົງສາ', 'Hongsa', 3),
  ('8-04', '8', 'ເງິນ', 'Ngeun', 4),
  ('8-05', '8', 'ຊຽງຮ່ອນ', 'Xienghone', 5),
  ('8-06', '8', 'ພຽງ', 'Phiang', 6),
  ('8-07', '8', 'ປາກລາຍ', 'Parklai', 7),
  ('8-08', '8', 'ແກ່ນທ້າວ', 'Kenethao', 8),
  ('8-09', '8', 'ບໍ່ແຕນ', 'Botene', 9),
  ('8-10', '8', 'ທົ່ງມີໄຊ', 'Thongmyxay', 10),
  ('8-11', '8', 'ໄຊສະຖານ', 'Xaisathan', 11),
  ('9-01', '9', 'ແປກ', 'Pek', 1),
  ('9-02', '9', 'ຄຳ', 'Kham', 2),
  ('9-03', '9', 'ໜອງແຮດ', 'Nong Het', 3),
  ('9-04', '9', 'ຄູນ', 'Khoune', 4),
  ('9-05', '9', 'ໝອກໃໝ່', 'Mok May', 5),
  ('9-06', '9', 'ພູກູດ', 'Phou Kout', 6),
  ('9-07', '9', 'ຜາໄຊ', 'Phaxay', 7),
  ('10-01', '10', 'ໂພນໂຮງ', 'Phonhong', 1),
  ('10-02', '10', 'ທຸລະຄົມ', 'Thoulakhom', 2),
  ('10-03', '10', 'ແກ້ວອຸດົມ', 'Keo Oudom', 3),
  ('10-04', '10', 'ກາສີ', 'Kasy', 4),
  ('10-05', '10', 'ວັງວຽງ', 'Vangvieng', 5),
  ('10-06', '10', 'ເຟືອງ', 'Feuang', 6),
  ('10-07', '10', 'ຊະນະຄາມ', 'Xanakharm', 7),
  ('10-08', '10', 'ແມດ', 'Mad', 8),
  ('10-09', '10', 'ວຽງຄໍາ', 'Viengkham', 9),
  ('10-10', '10', 'ຫີນເຫີບ', 'Hinhurp', 10),
  ('10-11', '10', 'ໝື່ນ', 'Meun', 11),
  ('11-01', '11', 'ປາກຊັນ', 'Pakxan', 1),
  ('11-02', '11', 'ທ່າພະບາດ', 'Thaphabat', 2),
  ('11-03', '11', 'ປາກກະດິງ', 'Pakkading', 3),
  ('11-04', '11', 'ບໍລິຄັນ', 'Borikhane', 4),
  ('11-05', '11', 'ຄຳເກີດ', 'Khamkeut', 5),
  ('11-06', '11', 'ວຽງທອງ', 'Viengthong', 6),
  ('11-07', '11', 'ໄຊຈຳພອນ', 'Xaichamphon', 7),
  ('12-01', '12', 'ທ່າແຂກ', 'Thakhek', 1),
  ('12-02', '12', 'ມະຫາໄຊ', 'Mahaxay', 2),
  ('12-03', '12', 'ໜອງບົກ', 'Nong Bok', 3),
  ('12-04', '12', 'ຫີນບູນ', 'Hineboune', 4),
  ('12-05', '12', 'ຍົມມະລາດ', 'Yommalath', 5),
  ('12-06', '12', 'ບົວລະພາ', 'Boualapha', 6),
  ('12-07', '12', 'ນາກາຍ', 'Nakai', 7),
  ('12-08', '12', 'ເຊບັ້ງໄຟ', 'Sebangphay', 8),
  ('12-09', '12', 'ໄຊບົວທອງ', 'Xaibouathong', 9),
  ('12-10', '12', 'ຄູນຄຳ', 'Kounkham', 10),
  ('13-01', '13', 'ໄກສອນ ພົມວິຫານ', 'Kaysone Phomvihane', 1),
  ('13-02', '13', 'ອຸທຸມພອນ', 'Outhoumphone', 2),
  ('13-03', '13', 'ອາດສະພັງທອງ', 'Atsaphangthong', 3),
  ('13-04', '13', 'ພີນ', 'Phine', 4),
  ('13-05', '13', 'ເຊໂປນ', 'Seponh', 5),
  ('13-06', '13', 'ນອງ', 'Nong', 6),
  ('13-07', '13', 'ທ່າປາງທອງ', 'Thapangthong', 7),
  ('13-08', '13', 'ສອງຄອນ', 'Songkhone', 8),
  ('13-09', '13', 'ຈຳພອນ', 'Champhone', 9),
  ('13-10', '13', 'ຊົນນະບູລີ', 'Xonaboury', 10),
  ('13-11', '13', 'ໄຊບູລີ', 'Xayboury', 11),
  ('13-12', '13', 'ວີລະບຸລີ', 'Viraboury', 12),
  ('13-13', '13', 'ອາດສະພອນ', 'Assaphone', 13),
  ('13-14', '13', 'ໄຊພູທອງ', 'Xonboury', 14),
  ('13-15', '13', 'ພະລານໄຊ', 'Thaphalanxay', 15),
  ('14-01', '14', 'ສາລະວັນ', 'Saravane', 1),
  ('14-02', '14', 'ຕະໂອ້ຍ', 'Ta Oy', 2),
  ('14-03', '14', 'ຕຸ້ມລານ', 'Toumlane', 3),
  ('14-04', '14', 'ລະຄອນເພັງ', 'Lakhonepheng', 4),
  ('14-05', '14', 'ວາປີ', 'Vapy', 5),
  ('14-06', '14', 'ຄົງເຊໂດນ', 'Khongsedone', 6),
  ('14-07', '14', 'ເລົ່າງາມ', 'Lao Ngam', 7),
  ('14-08', '14', 'ສະມ້ວຍ', 'Sa Mouay', 8),
  ('15-01', '15', 'ລະມາມ', 'La Mam', 1),
  ('15-02', '15', 'ກະເລິມ', 'Kaleum', 2),
  ('15-03', '15', 'ດາກຈຶງ', 'Dak Cheung', 3),
  ('15-04', '15', 'ທ່າແຕງ', 'Tha Teng', 4),
  ('16-01', '16', 'ປາກເຊ', 'Pakse', 1),
  ('16-02', '16', 'ຊະນະສົມບູນ', 'Sanasomboun', 2),
  ('16-03', '16', 'ບາຈຽງຈະເລີນສຸກ', 'Batiengchaleunsouk', 3),
  ('16-04', '16', 'ປາກຊ່ອງ', 'Paksong', 4),
  ('16-05', '16', 'ປະທຸມພອນ', 'Pathouphone', 5),
  ('16-06', '16', 'ໂພນທອງ', 'Phonthong', 6),
  ('16-07', '16', 'ຈຳປາສັກ', 'Champassack', 7),
  ('16-08', '16', 'ສຸຂຸມາ', 'Soukhoumma', 8),
  ('16-09', '16', 'ມູນລະປະໂມກ', 'Mounlapamok', 9),
  ('16-10', '16', 'ໂຂງ', 'Khong', 10),
  ('17-01', '17', 'ໄຊເຊດຖາ', 'Saysetha', 1),
  ('17-02', '17', 'ສາມັກຄີໄຊ', 'Samakkhixay', 2),
  ('17-03', '17', 'ສະໜາມໄຊ', 'Sanamxay', 3),
  ('17-04', '17', 'ສານໄຊ', 'Sanxay', 4),
  ('17-05', '17', 'ພູວົງ', 'Phouvong', 5),
  ('18-01', '18', 'ອະນຸວົງ', 'Anouvong', 1),
  ('18-02', '18', 'ລ້ອງແຈ້ງ', 'Longchaeng', 2),
  ('18-03', '18', 'ລ້ອງຊານ', 'Longxan', 3),
  ('18-04', '18', 'ເມືອງຮົ່ມ', 'Hom', 4),
  ('18-05', '18', 'ທ່າໂທມ', 'Thathom', 5)
on conflict (code) do update set
  province_code = excluded.province_code, name = excluded.name,
  name_en = excluded.name_en, sort_order = excluded.sort_order;
