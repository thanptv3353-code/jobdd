"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { STAGE_LABEL, type ApplicationStage } from "@/lib/types";
import { cn } from "@/lib/utils";

type Event = {
  id: string;
  application_id: string;
  staff_name: string;
  action: string;
  detail: string | null;
  actor_type: "staff" | "member";
  member_id: string | null;
  created_at: string;
  applications: {
    worker_id: string;
    jobs: { title: string; member_id: string } | null;
    worker_profiles: { name: string; phone: string } | null;
  } | null;
};

type Filter = "all" | "member" | "staff" | "interview" | "hired";

const FILTER_LABEL: Record<Filter, string> = {
  all: "ທັງໝົດ",
  member: "ໂດຍບໍລິສັດ",
  staff: "ໂດຍພະນັກງານ",
  interview: "ນັດສຳພາດ",
  hired: "ຮັບເຂົ້າເຮັດວຽກ",
};

export function AdminActivity({
  events,
  members,
}: {
  events: Event[];
  members: { id: string; name: string }[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const memberName = (id: string | null) =>
    id ? (members.find((m) => m.id === id)?.name ?? "—") : null;

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        if (filter === "member" && e.actor_type !== "member") return false;
        if (filter === "staff" && e.actor_type !== "staff") return false;
        if (filter === "interview" && e.action !== "interview") return false;
        if (filter === "hired" && e.action !== "contract_signed") return false;
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          e.staff_name.toLowerCase().includes(q) ||
          (e.applications?.worker_profiles?.name ?? "").toLowerCase().includes(q) ||
          (e.applications?.jobs?.title ?? "").toLowerCase().includes(q) ||
          (memberName(e.applications?.jobs?.member_id ?? null) ?? "").toLowerCase().includes(q)
        );
      }),
    // memberName is derived from `members`, which is stable for a given render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, members, filter, query]
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">ການເຄື່ອນໄຫວ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ບໍລິສັດໃດສຳພາດ ແລະ ຮັບຜູ້ສະໝັກຄົນໃດ — ລວມທັງທີ່ພະນັກງານ Job DD ດຳເນີນການເອງ
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} ລາຍການ</p>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          placeholder="ຄົ້ນຫາຊື່ຜູ້ສະໝັກ, ບໍລິສັດ ຫຼື ຕຳແໜ່ງ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FILTER_LABEL) as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium",
                filter === f ? "border-emerald-600 bg-emerald-600 text-white" : "hover:bg-muted"
              )}
            >
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">ເວລາ</th>
              <th className="px-4 py-2.5 font-medium">ຜູ້ດຳເນີນການ</th>
              <th className="px-4 py-2.5 font-medium">ຜູ້ສະໝັກ</th>
              <th className="px-4 py-2.5 font-medium">ຕຳແໜ່ງ / ບໍລິສັດ</th>
              <th className="px-4 py-2.5 font-medium">ການດຳເນີນການ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const company = memberName(e.applications?.jobs?.member_id ?? null);
              return (
                <tr key={e.id} className="border-t hover:bg-muted/40">
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("lo-LA")}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{e.staff_name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "ml-2",
                        e.actor_type === "member"
                          ? "border-sky-200 bg-sky-50 text-sky-800"
                          : "border-zinc-200 text-muted-foreground"
                      )}
                    >
                      {e.actor_type === "member" ? "ບໍລິສັດ" : "ພະນັກງານ"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/applicants/${e.application_id}`}
                      className="font-medium hover:underline"
                    >
                      {e.applications?.worker_profiles?.name ?? "—"}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {e.applications?.worker_profiles?.phone}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    {e.applications?.jobs?.title ?? "—"}
                    {company && <p className="text-xs text-muted-foreground">{company}</p>}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      className={cn(
                        e.action === "contract_signed" && "bg-emerald-600 text-white",
                        e.action === "rejected" && "bg-red-100 text-red-800",
                        e.action === "interview" && "bg-amber-100 text-amber-800"
                      )}
                      variant={
                        ["contract_signed", "rejected", "interview"].includes(e.action)
                          ? "default"
                          : "secondary"
                      }
                    >
                      {STAGE_LABEL[e.action as ApplicationStage] ?? e.action}
                    </Badge>
                    {e.detail && <p className="mt-0.5 text-xs text-muted-foreground">{e.detail}</p>}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  ບໍ່ພົບການເຄື່ອນໄຫວ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
