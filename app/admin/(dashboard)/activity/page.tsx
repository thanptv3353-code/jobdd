import { AdminActivity } from "@/components/admin-activity";
import { createClient } from "@/lib/supabase/server";

export default async function AdminActivityPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("application_events")
    .select("*, applications(worker_id, jobs(title, member_id), worker_profiles(name, phone))")
    .order("created_at", { ascending: false })
    .limit(500);

  const { data: members } = await supabase.from("members").select("id, name");

  return <AdminActivity events={events ?? []} members={members ?? []} />;
}
