import { AdminApplicationsBoard } from "@/components/admin-applications-board";
import { createClient } from "@/lib/supabase/server";

export default async function AdminApplicationsPage() {
  const supabase = await createClient();
  const { data: applications } = await supabase
    .from("applications")
    .select("id, stage, country, worker_id, worker_profiles(name), jobs(title)")
    .order("submitted_at", { ascending: false });

  return <AdminApplicationsBoard applications={applications ?? []} />;
}
