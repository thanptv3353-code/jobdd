import { redirect } from "next/navigation";
import Link from "next/link";
import { MemberSidebar } from "@/components/member-sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function MemberDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/member/login");

  const { data: account } = await supabase
    .from("member_users")
    .select("id, name, member_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!account) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-lg font-semibold">ບັນຊີນີ້ຍັງບໍ່ໄດ້ຜູກກັບບໍລິສັດ</p>
        <p className="mt-2 text-sm text-muted-foreground">
          ກະລຸນາແຈ້ງ Job DD ເພື່ອຜູກອີເມວ {user.email} ກັບບໍລິສັດຂອງທ່ານ
        </p>
        <Link href="/" className="mt-6 inline-block text-sm text-emerald-700 hover:underline">
          ກັບໜ້າຫຼັກ
        </Link>
      </div>
    );
  }

  const { data: company } = await supabase
    .from("members")
    .select("name")
    .eq("id", account.member_id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MemberSidebar companyName={company?.name ?? "ບໍລິສັດ"} userEmail={user.email ?? ""} />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
