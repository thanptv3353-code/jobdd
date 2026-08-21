"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { addContactLog, setWorkerStatus } from "@/lib/actions";
import { calculateAge } from "@/lib/eligibility";
import { AVAILABILITY_LABEL, COUNTRY_LABEL, STAGE_LABEL, type AvailabilityStatus, type Country } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";

type Worker = Database["public"]["Tables"]["worker_profiles"]["Row"];
type Placement = Database["public"]["Tables"]["placements"]["Row"];
type ContactLog = Database["public"]["Tables"]["contact_logs"]["Row"];
type Application = Database["public"]["Tables"]["applications"]["Row"] & {
  jobs: { title: string } | null;
};

const STATUS_OPTIONS: AvailabilityStatus[] = ["available", "in_process", "placed", "paused", "stale"];

export function AdminWorkerDetail({
  worker,
  applications,
  placements,
  contactLogs,
}: {
  worker: Worker;
  applications: Application[];
  placements: Placement[];
  contactLogs: ContactLog[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  const activePlacement = placements[0];

  function handleAddLog(result: string) {
    startTransition(async () => {
      await addContactLog({
        workerId: worker.id,
        staffName: "ພະນັກງານ (demo)",
        channel: "phone",
        result,
        note: note || undefined,
      });
      setNote("");
      router.refresh();
    });
  }

  function handleStatusChange(status: AvailabilityStatus) {
    startTransition(async () => {
      await setWorkerStatus(worker.id, status);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      {worker.availability_status === "placed" && activePlacement && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          ⛔ ຄົນນີ້ໄດ້ວຽກແລ້ວ — {activePlacement.company_name} ຢູ່{COUNTRY_LABEL[activePlacement.country as Country]}
          {" "}ຕັ້ງແຕ່ {activePlacement.start_date}
          {activePlacement.contract_end_date && ` ສັນຍາໝົດ ${activePlacement.contract_end_date}`}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{worker.name}</h1>
          <p className="text-sm text-muted-foreground">
            {worker.phone} · {calculateAge(worker.dob)} ປີ · {worker.province}
          </p>
        </div>
        <StatusBadge status={worker.availability_status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {worker.preferred_countries.map((c) => (
          <Badge key={c} variant="secondary">
            {COUNTRY_LABEL[c as Country]}
          </Badge>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <p className="mb-2 text-sm font-medium">ປ່ຽນສະຖານະດ້ວຍມື</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <Button
                key={s}
                size="sm"
                disabled={isPending}
                variant={worker.availability_status === s ? "default" : "outline"}
                className={worker.availability_status === s ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                onClick={() => handleStatusChange(s)}
              >
                {AVAILABILITY_LABEL[s]}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            ອັບເດດຫຼ້າສຸດ: {worker.status_updated_at?.slice(0, 10)} ໂດຍ {worker.status_updated_by} ·
            ຢືນຢັນຄັ້ງລ່າສຸດ: {worker.last_confirmed_at?.slice(0, 10)}
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="pt-6">
          <h2 className="font-semibold">ໃບສະໝັກ</h2>
          <div className="mt-3 space-y-2">
            {applications.length === 0 && (
              <p className="text-sm text-muted-foreground">ຍັງບໍ່ມີໃບສະໝັກ</p>
            )}
            {applications.map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b pb-2 text-sm">
                <div>
                  <p className="font-medium">{a.jobs?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {COUNTRY_LABEL[a.country as Country]} · {a.submitted_at}
                  </p>
                </div>
                <Badge variant="secondary">{STAGE_LABEL[a.stage]}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="pt-6">
          <h2 className="font-semibold">ບັນທຶກການຕິດຕໍ່</h2>
          <div className="mt-3 flex gap-2">
            <Input
              placeholder="ໝາຍເຫດການໂທ (ຖ້າມີ)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button variant="outline" disabled={isPending} onClick={() => handleAddLog("ຢືນຢັນຍັງຫາວຽກຢູ່")}>
              ຍັງຫາຢູ່
            </Button>
            <Button variant="outline" disabled={isPending} onClick={() => handleAddLog("ບໍ່ຕອບກັບ")}>
              ບໍ່ຕອບກັບ
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {contactLogs.length === 0 && (
              <p className="text-sm text-muted-foreground">ຍັງບໍ່ມີການຕິດຕໍ່</p>
            )}
            {contactLogs.map((c) => (
              <div key={c.id} className="border-b pb-2 text-sm">
                <p>
                  <span className="font-medium">{c.staff_name}</span> · {c.contacted_at} — {c.result}
                </p>
                {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
