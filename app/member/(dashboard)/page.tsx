import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { STAGE_LABEL, STAGE_ORDER } from "@/lib/types";

export default async function MemberOverviewPage() {
  const supabase = await createClient();

  // RLS already scopes both tables to this company, so no filter is needed here.
  const [{ data: jobs }, { data: applications }] = await Promise.all([
    supabase.from("jobs").select("id, status"),
    supabase.from("applications").select("id, stage, interview_at"),
  ]);

  const openJobs = (jobs ?? []).filter((j) => j.status === "open").length;
  const byStage = new Map<string, number>();
  for (const a of applications ?? []) byStage.set(a.stage, (byStage.get(a.stage) ?? 0) + 1);
  const upcoming = (applications ?? []).filter(
    (a) => a.interview_at && new Date(a.interview_at) >= new Date()
  ).length;

  return (
    <div>
      <h1 className="text-2xl font-bold">ພາບລວມ</h1>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="ປະກາດທີ່ເປີດຮັບ" value={openJobs} href="/member/jobs" />
        <Stat label="ຜູ້ສະໝັກທັງໝົດ" value={(applications ?? []).length} href="/member/applicants" />
        <Stat label="ນັດສຳພາດທີ່ຍັງມາບໍ່ເຖິງ" value={upcoming} href="/member/applicants" />
      </div>

      <Card className="mt-4">
        <CardContent className="pt-6">
          <h2 className="font-semibold">ຜູ້ສະໝັກແຍກຕາມຂັ້ນຕອນ</h2>
          {(applications ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              ຍັງບໍ່ມີຜູ້ສະໝັກ — ລອງ{" "}
              <Link href="/member/jobs" className="text-emerald-700 hover:underline">
                ລົງປະກາດຮັບສະໝັກ
              </Link>{" "}
              ກ່ອນ
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {STAGE_ORDER.map((st) => (
                <div key={st} className="flex items-center justify-between text-sm">
                  <span>{STAGE_LABEL[st]}</span>
                  <span className="font-medium tabular-nums">{byStage.get(st) ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-emerald-600">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold text-emerald-700">{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
