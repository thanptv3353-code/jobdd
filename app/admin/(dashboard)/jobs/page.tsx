import { AdminJobsManager } from "@/components/admin-jobs-manager";
import { createClient } from "@/lib/supabase/server";

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const [{ data: jobs }, { data: members }] = await Promise.all([
    supabase.from("jobs").select("*").order("posted_at", { ascending: false }),
    supabase.from("members").select("*"),
  ]);

  return <AdminJobsManager jobs={jobs ?? []} members={members ?? []} />;
}
