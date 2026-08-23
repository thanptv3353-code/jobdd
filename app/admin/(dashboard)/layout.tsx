import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { CountriesProvider } from "@/components/countries-provider";
import { createClient } from "@/lib/supabase/server";
import { getCountries } from "@/lib/queries";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: staff } = await supabase
    .from("staff")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!staff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <div className="max-w-sm text-center">
          <p className="text-lg font-semibold">ບໍ່ມີສິດເຂົ້າໃຊ້ Admin</p>
          <p className="mt-2 text-sm text-muted-foreground">
            ບັນຊີ {user.email} ຍັງບໍ່ຖືກເພີ່ມເຂົ້າຕາຕະລາງ <code>staff</code> — ໃຫ້ super admin ເພີ່ມທ່ານຜ່ານ
            ໜ້າ &quot;ພະນັກງານ&quot; ໃນລະບົບ admin
          </p>
        </div>
      </div>
    );
  }

  const countries = await getCountries();

  return (
    <CountriesProvider countries={countries}>
      <div className="flex min-h-screen flex-1 flex-col md:flex-row">
        <AdminSidebar userEmail={user.email ?? ""} isSuperAdmin={staff.role === "super_admin"} />
        <main className="flex-1 overflow-x-hidden bg-zinc-50 p-4 md:p-6">{children}</main>
      </div>
    </CountriesProvider>
  );
}
