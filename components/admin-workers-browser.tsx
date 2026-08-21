"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { StatusDot } from "@/components/status-badge";
import { useCountries } from "@/components/countries-provider";
import { calculateAge } from "@/lib/eligibility";
import { AVAILABILITY_LABEL, type AvailabilityStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type Worker = Database["public"]["Tables"]["worker_profiles"]["Row"];

const FILTERS: (AvailabilityStatus | "all")[] = [
  "available",
  "in_process",
  "placed",
  "paused",
  "stale",
  "all",
];

export function AdminWorkersBrowser({ workers }: { workers: Worker[] }) {
  const { label } = useCountries();
  const [filter, setFilter] = useState<AvailabilityStatus | "all">("available");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      if (filter !== "all" && w.availability_status !== filter) return false;
      if (query && !w.name.toLowerCase().includes(query.toLowerCase()) && !w.phone.includes(query))
        return false;
      return true;
    });
  }, [workers, filter, query]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ຜູ້ຫາງານ</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} ຄົນ</p>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          placeholder="ຄົ້ນຫາຊື່ ຫຼື ເບີໂທ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium",
                filter === f ? "border-emerald-600 bg-emerald-600 text-white" : "hover:bg-muted"
              )}
            >
              {f !== "all" && <StatusDot status={f} />}
              {f === "all" ? "ທັງໝົດ" : AVAILABILITY_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium"></th>
              <th className="px-4 py-2.5 font-medium">ຊື່</th>
              <th className="px-4 py-2.5 font-medium">ອາຍຸ</th>
              <th className="px-4 py-2.5 font-medium">ແຂວງປັດຈຸບັນ</th>
              <th className="px-4 py-2.5 font-medium">ສົນໃຈ</th>
              <th className="px-4 py-2.5 font-medium">ອັບເດດລ່າສຸດ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id} className="border-t hover:bg-muted/40">
                <td className="px-4 py-2.5">
                  <StatusDot status={w.availability_status} />
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/workers/${w.id}`} className="font-medium hover:underline">
                    {w.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{w.phone}</p>
                </td>
                <td className="px-4 py-2.5">{calculateAge(w.dob)}</td>
                <td className="px-4 py-2.5">{w.cur_province}</td>
                <td className="px-4 py-2.5">
                  {w.preferred_countries.map((c) => label(c)).join(", ")}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{w.status_updated_at?.slice(0, 10)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  ບໍ່ພົບຜູ້ຫາງານ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
