import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminStaffManager } from "@/components/admin-staff-manager";

export default async function AdminStaffPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The dashboard layout already gates on auth, but while signing out this page
  // can still render for a beat with no user — redirect instead of crashing.
  if (!user) redirect("/admin/login");

  const { data: currentStaff } = await supabase
    .from("staff")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (currentStaff?.role !== "super_admin") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold">ບໍ່ມີສິດເຂົ້າໜ້ານີ້</p>
        <p className="mt-2 text-sm text-muted-foreground">ໜ້ານີ້ສະເພາະ super admin ເທົ່ານັ້ນ</p>
      </div>
    );
  }

  const { data: staffList } = await supabase.from("staff").select("*").order("created_at");

  return <AdminStaffManager staff={staffList ?? []} currentStaffId={currentStaff.id} />;
}
