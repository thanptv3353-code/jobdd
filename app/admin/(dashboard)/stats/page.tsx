import { AdminStats } from "@/components/admin-stats";
import { createClient } from "@/lib/supabase/server";

export default async function AdminStatsPage() {
  const supabase = await createClient();
  const [{ data: stats, error }, { data: countries }] = await Promise.all([
    supabase.rpc("get_applicant_stats"),
    supabase.from("countries").select("code, label"),
  ]);

  if (error || !stats) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-lg font-semibold">ໂຫຼດສະຖິຕິບໍ່ໄດ້</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message ?? "ອາດຍັງບໍ່ໄດ້ລັນ migration 0015_applicant_stats.sql"}
        </p>
      </div>
    );
  }

  return <AdminStats stats={stats} countries={countries ?? []} />;
}
