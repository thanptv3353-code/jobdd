import { AdminMembersManager } from "@/components/admin-members-manager";
import { createClient } from "@/lib/supabase/server";

export default async function AdminMembersPage() {
  const supabase = await createClient();
  const [{ data: members }, { data: jobs }, { data: accounts }] = await Promise.all([
    supabase.from("members").select("*").order("sort_order").order("name"),
    supabase.from("jobs").select("id, member_id, status"),
    supabase.from("member_users").select("*"),
  ]);

  return (
    <AdminMembersManager members={members ?? []} jobs={jobs ?? []} accounts={accounts ?? []} />
  );
}
