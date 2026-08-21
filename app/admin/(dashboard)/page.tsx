import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusDot } from "@/components/status-badge";
import { createClient } from "@/lib/supabase/server";
import { AVAILABILITY_LABEL, STAGE_LABEL, type AvailabilityStatus } from "@/lib/types";

const STATUS_ORDER: AvailabilityStatus[] = ["available", "in_process", "placed", "paused", "stale"];

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ data: workers }, { data: jobs }, { data: applications }] = await Promise.all([
    supabase.from("worker_profiles").select("id, availability_status"),
    supabase.from("jobs").select("id, status"),
    supabase
      .from("applications")
      .select("id, stage, submitted_at, worker_profiles(name), jobs(title)")
      .order("submitted_at", { ascending: false })
      .limit(6),
  ]);

  const counts = STATUS_ORDER.map((status) => ({
    status,
    count: (workers ?? []).filter((w) => w.availability_status === status).length,
  }));
  const openJobs = (jobs ?? []).filter((j) => j.status === "open").length;

  return (
    <div>
      <h1 className="text-2xl font-bold">ພາບລວມ</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {counts.map(({ status, count }) => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <StatusDot status={status} />
                <p className="text-sm text-muted-foreground">{AVAILABILITY_LABEL[status]}</p>
              </div>
              <p className="mt-2 text-2xl font-extrabold">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">ໃບສະໝັກຫຼ້າສຸດ</h2>
              <Link href="/admin/applications" className="text-sm text-emerald-700 hover:underline">
                ເບິ່ງທັງໝົດ →
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {(applications ?? []).map((a) => (
                <div key={a.id} className="flex items-center justify-between border-b pb-2 text-sm">
                  <div>
                    <p className="font-medium">{a.worker_profiles?.name}</p>
                    <p className="text-xs text-muted-foreground">{a.jobs?.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{STAGE_LABEL[a.stage]}</span>
                </div>
              ))}
              {(applications ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">ຍັງບໍ່ມີໃບສະໝັກ</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">ຕຳແໜ່ງງານເປີດຮັບ</h2>
              <Link href="/admin/jobs" className="text-sm text-emerald-700 hover:underline">
                ຈັດການ →
              </Link>
            </div>
            <p className="mt-2 text-3xl font-extrabold text-emerald-700">{openJobs}</p>
            <p className="text-sm text-muted-foreground">ຕຳແໜ່ງ ຈາກ {(jobs ?? []).length} ຕຳແໜ່ງທັງໝົດ</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
