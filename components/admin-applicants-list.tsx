"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useCountries } from "@/components/countries-provider";
import { STAGE_LABEL, type ApplicationStage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AppRow {
  id: string;
  stage: ApplicationStage;
  country: string;
  worker_id: string;
  submitted_at: string;
  interview_at: string | null;
  worker_profiles: { name: string; phone: string } | null;
  jobs: { title: string } | null;
}

export function AdminApplicantsList({
  applications,
  photoUrls,
}: {
  applications: AppRow[];
  photoUrls: Record<string, string>;
}) {
  const { countries, label } = useCountries();
  const [country, setCountry] = useState<string>("all");

  const filtered = useMemo(
    () => (country === "all" ? applications : applications.filter((a) => a.country === country)),
    [applications, country]
  );

  const countOf = (code: string | "all") =>
    code === "all" ? applications.length : applications.filter((a) => a.country === code).length;

  return (
    <div>
      <h1 className="text-2xl font-bold">ລາຍຊື່ຜູ້ສະໝັກ</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ແຍກຕາມປະເທດທີ່ຜູ້ສະໝັກເລືອກ — ກົດຊື່ເພື່ອເບິ່ງລາຍລະອຽດ, ກວດເອກະສານ, ແລະ ນັດສຳພາດ
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip active={country === "all"} onClick={() => setCountry("all")}>
          ທັງໝົດ ({countOf("all")})
        </FilterChip>
        {countries.map((c) => (
          <FilterChip key={c.code} active={country === c.code} onClick={() => setCountry(c.code)}>
            {label(c.code)} ({countOf(c.code)})
          </FilterChip>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium"></th>
              <th className="px-4 py-2.5 font-medium">ຊື່</th>
              <th className="px-4 py-2.5 font-medium">ຕຳແໜ່ງ</th>
              <th className="px-4 py-2.5 font-medium">ປະເທດ</th>
              <th className="px-4 py-2.5 font-medium">ຂັ້ນຕອນ</th>
              <th className="px-4 py-2.5 font-medium">ສົ່ງເມື່ອ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-t hover:bg-muted/40">
                <td className="px-4 py-2.5">
                  {photoUrls[a.worker_id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrls[a.worker_id]} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground">
                      ບໍ່ມີ
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/applicants/${a.id}`} className="font-medium hover:underline">
                    {a.worker_profiles?.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{a.worker_profiles?.phone}</p>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{a.jobs?.title}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="secondary">{label(a.country)}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Badge
                    variant={a.stage === "rejected" ? "destructive" : "secondary"}
                    className={a.stage === "contract_signed" ? "bg-emerald-600 text-white" : ""}
                  >
                    {STAGE_LABEL[a.stage]}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{a.submitted_at}</td>
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

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium",
        active ? "border-emerald-600 bg-emerald-600 text-white" : "hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}
