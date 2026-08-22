-- Job DD — records the interview date/time when staff schedule one, so it
-- shows up on the application later (used by the new /admin/applicants flow).
--
-- HOW TO USE: paste into the Supabase SQL Editor (New query) and Run.

alter table applications add column if not exists interview_at timestamptz;
