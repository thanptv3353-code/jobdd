-- Job DD — worker_files was missing an INSERT grant for the `authenticated`
-- role. Staff testing /register or /apply while logged into /admin in the
-- same browser hit "permission denied for table worker_files" because only
-- `anon` had insert (worker_profiles/applications already covered both roles).
--
-- HOW TO USE: paste into the Supabase SQL Editor (New query) and Run.

grant insert on worker_files to authenticated;
