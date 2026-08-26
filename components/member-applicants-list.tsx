"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { calculateAge } from "@/lib/eligibility";
import { STAGE_LABEL, STAGE_ORDER, type ApplicationStage } from "@/lib/types";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  stage: ApplicationStage;
  country: string;
  worker_id: string;
  submitted_at: string;
  interview_at: string | null;
  worker_profiles: { name: string; phone: string; dob: string; cur_province: string } | null;
  jobs: { title: string } | null;
};

export function MemberApplicantsList({ applications }: { applications: Row[] }) {
  const [stage, setStage] = useState<ApplicationStage | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      applications.filter((a) => {
        if (stage !== "all" && a.stage !== stage) return false;
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          (a.worker_profiles?.name ?? "").toLowerCase().includes(q) ||
          (a.worker_profiles?.phone ?? "").includes(query) ||
          (a.jobs?.title ?? "").toLowerCase().includes(q)
        );
      }),
    [applications, stage, query]
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">ຜູ້ສະໝັກ</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} ຄົນ</p>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          placeholder="ຄົ້ນຫາຊື່, ເບີໂທ ຫຼື ຕຳແໜ່ງ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {(["all", ...STAGE_ORDER] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium",
                stage === s ? "border-emerald-600 bg-emerald-600 text-white" : "hover:bg-muted"
              )}
            >
              {s === "all" ? "ທັງໝົດ" : STAGE_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">ຊື່</th>
              <th className="px-4 py-2.5 font-medium">ອາຍຸ</th>
              <th className="px-4 py-2.5 font-medium">ແຂວງ</th>
              <th className="px-4 py-2.5 font-medium">ສະໝັກຕຳແໜ່ງ</th>
              <th className="px-4 py-2.5 font-medium">ຂັ້ນຕອນ</th>
              <th className="px-4 py-2.5 font-medium">ນັດສຳພາດ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-t hover:bg-muted/40">
                <td className="px-4 py-2.5">
                  <Link href={`/member/applicants/${a.id}`} className="font-medium hover:underline">
                    {a.worker_profiles?.name ?? "—"}
                  </Link>
                  <p className="text-xs text-muted-foreground">{a.worker_profiles?.phone}</p>
                </td>
                <td className="px-4 py-2.5">
                  {a.worker_profiles?.dob ? calculateAge(a.worker_profiles.dob) : "—"}
                </td>
                <td className="px-4 py-2.5">{a.worker_profiles?.cur_province ?? "—"}</td>
                <td className="px-4 py-2.5">{a.jobs?.title ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="secondary">{STAGE_LABEL[a.stage]}</Badge>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {a.interview_at ? new Date(a.interview_at).toLocaleString("lo-LA") : "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  ບໍ່ພົບຜູ້ສະໝັກ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
