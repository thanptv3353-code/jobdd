-- Job DD — fixes 0014, which created RLS policies for job_categories and
-- job_category_items but never granted the table-level privileges those
-- policies filter. RLS narrows what a role may already touch; without a
-- GRANT the role is refused before any policy is consulted, so the tables
-- read as "permission denied" for everyone including staff.
--
-- Matches the grant pattern the earlier tables use in 0001_init.sql.
--
-- HOW TO USE: paste into the Supabase SQL Editor (New query) and Run.
-- Safe to re-run (idempotent).

grant select on job_categories, job_category_items to anon, authenticated;
grant insert, update, delete on job_categories, job_category_items to authenticated;
