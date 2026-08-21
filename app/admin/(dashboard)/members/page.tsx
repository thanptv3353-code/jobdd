import { AdminMembersManager } from "@/components/admin-members-manager";
import { createClient } from "@/lib/supabase/server";

export default async function AdminMembersPage() {
  const supabase = await createClient();
  const [{ data: members }, { data: jobs }] = await Promise.all([
    supabase.from("members").select("*"),
    supabase.from("jobs").select("id, member_id, status"),
  ]);

  return <AdminMembersManager members={members ?? []} jobs={jobs ?? []} />;
}
