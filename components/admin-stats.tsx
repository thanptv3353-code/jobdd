"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AVAILABILITY_LABEL, STAGE_LABEL, type AvailabilityStatus } from "@/lib/types";
import type { ApplicantStats, DistrictBucket, StatBucket } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

const GENDER_LABEL: Record<string, string> = { male: "ຊາຍ", female: "ຍິງ" };

export function AdminStats({
  stats,
  countries,
}: {
  stats: ApplicantStats;
  countries: { code: string; label: string }[];
}) {
  const countryLabel = (c: string) => countries.find((x) => x.code === c)?.label ?? c;

  return (
    <div>
      <h1 className="text-2xl font-bold">ສະຖິຕິຜູ້ສະໝັກ</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ນັບຈາກໂປຣໄຟລ໌ຜູ້ຫາວຽກທັງໝົດ — ໃຊ້ທີ່ຢູ່ປັດຈຸບັນເປັນຫຼັກ
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Stat label="ຜູ້ຫາວຽກທັງໝົດ" value={stats.total_workers} />
        <Stat label="ໃບສະໝັກທັງໝົດ" value={stats.total_applications} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Chart title="ເພດ" data={stats.by_gender} label={(k) => GENDER_LABEL[k] ?? k} />
        <Chart title="ຊ່ວງອາຍຸ" data={stats.by_age_band} />
        <Chart
          title="ສະຖານະຄວາມພ້ອມ"
          data={stats.by_availability}
          label={(k) => AVAILABILITY_LABEL[k as AvailabilityStatus] ?? k}
        />
        <Chart title="ປະເທດທີ່ສົນໃຈ" data={stats.by_country_interest} label={countryLabel} />
        <Chart title="ປະເພດວຽກທີ່ສົນໃຈ" data={stats.by_category_interest ?? []} />
        <Chart
          title="ຂັ້ນຕອນໃບສະໝັກ"
          data={stats.by_stage}
          label={(k) => STAGE_LABEL[k as keyof typeof STAGE_LABEL] ?? k}
        />
        <Chart title="ແຂວງ (ທີ່ຢູ່ປັດຈຸບັນ)" data={stats.by_province} />
      </div>

      <DistrictTable districts={stats.by_district} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold text-emerald-700">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

function Chart({
  title,
  data,
  label = (k) => k,
}: {
  title: string;
  data: StatBucket[];
  label?: (key: string) => string;
}) {
  const total = data.reduce((a, b) => a + b.count, 0);
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">{title}</h2>
          <span className="text-xs text-muted-foreground">{total} ຄົນ</span>
        </div>
        {data.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">ຍັງບໍ່ມີຂໍ້ມູນ</p>
        ) : (
          <div className="mt-3 space-y-2">
            {data.map((d) => (
              <div key={d.key} className="grid grid-cols-[7rem_1fr_4.5rem] items-center gap-2">
                <span className="truncate text-sm" title={label(d.key)}>
                  {label(d.key)}
                </span>
                <div className="h-4 overflow-hidden rounded bg-muted">
                  <div
                    className="h-full rounded bg-emerald-600"
                    style={{ width: `${(d.count / max) * 100}%` }}
                  />
                </div>
                <span className="text-right text-sm tabular-nums text-muted-foreground">
                  {d.count}
                  <span className="ml-1 text-xs">
                    ({total ? Math.round((d.count / total) * 100) : 0}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Districts are long-tailed, so collapse to the top 15 with a toggle. */
function DistrictTable({ districts }: { districts: DistrictBucket[] }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? districts : districts.slice(0, 15);

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">ເມືອງ (ທີ່ຢູ່ປັດຈຸບັນ)</h2>
          <span className="text-xs text-muted-foreground">{districts.length} ເມືອງ</span>
        </div>
        {districts.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">ຍັງບໍ່ມີຂໍ້ມູນ</p>
        ) : (
          <>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">ເມືອງ</th>
                    <th className="px-3 py-2 font-medium">ແຂວງ</th>
                    <th className="px-3 py-2 text-right font-medium">ຈຳນວນ</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((d) => (
                    <tr key={`${d.province}/${d.key}`} className="border-t">
                      <td className="px-3 py-2">{d.key}</td>
                      <td className="px-3 py-2 text-muted-foreground">{d.province ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {districts.length > 15 && (
              <button
                className={cn("mt-3 text-sm font-medium text-emerald-700 hover:underline")}
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? "ສະແດງໜ້ອຍລົງ" : `ສະແດງທັງໝົດ ${districts.length} ເມືອງ`}
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
