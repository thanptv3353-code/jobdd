-- Job DD — lets staff edit the WhatsApp interview-scheduling message template
-- from /admin/settings instead of it being hard-coded.
--
-- HOW TO USE: paste this whole file into the Supabase SQL Editor (New query) and Run.
-- Safe to re-run (idempotent).

alter table site_settings add column if not exists interview_message_template text
  not null default 'ສະບາຍດີ {ຊື່}, ທ່ານໄດ້ຮັບການນັດໝາຍສຳພາດງານສຳລັບຕຳແໜ່ງ "{ຕຳແໜ່ງ}" ວັນທີ {ວັນທີ} ເວລາ {ເວລາ} ນາລິກາ. ກະລຸນາກຽມຕົວມາຕາມນັດ. ຂອບໃຈ, {ອົງກອນ}';
