import { AdminWorkersBrowser } from "@/components/admin-workers-browser";
import { createClient } from "@/lib/supabase/server";

export default async function AdminWorkersPage() {
  const supabase = await createClient();
  const { data: workers } = await supabase
    .from("worker_profiles")
    .select("*")
    .order("status_updated_at", { ascending: false });

  return <AdminWorkersBrowser workers={workers ?? []} />;
}
