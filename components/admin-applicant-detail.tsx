"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { useCountries } from "@/components/countries-provider";
import { calculateAge, docLabel } from "@/lib/eligibility";
import { getWorkerFileUrl, scheduleInterview, updateApplicationStage } from "@/lib/actions";
import { STAGE_LABEL, type ApplicationStage } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";

type Application = Database["public"]["Tables"]["applications"]["Row"];
type Worker = Database["public"]["Tables"]["worker_profiles"]["Row"];
type WorkerFile = Database["public"]["Tables"]["worker_files"]["Row"];

function buildWhatsappLink(phone: string, message: string) {
  const digits = phone.replace(/[^0-9]/g, "").replace(/^0/, "");
  return `https://wa.me/856${digits}?text=${encodeURIComponent(message)}`;
}

export function AdminApplicantDetail({
  application,
  worker,
  jobTitle,
  files,
  orgName,
}: {
  application: Application;
  worker: Worker;
  jobTitle: string;
  files: WorkerFile[];
  orgName: string;
}) {
  const router = useRouter();
  const { label } = useCountries();
  const [isPending, startTransition] = useTransition();
  const [schedulingOpen, setSchedulingOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  function handleMarkScreening() {
    startTransition(async () => {
      await updateApplicationStage(application.id, "screening");
      router.refresh();
    });
  }

  function handleReject() {
    if (!confirm("ປະຕິເສດໃບສະໝັກນີ້?")) return;
    startTransition(async () => {
      await updateApplicationStage(application.id, "rejected");
      router.refresh();
    });
  }

  function handleConfirmInterview() {
    if (!date || !time) return;
    startTransition(async () => {
      const interviewAt = new Date(`${date}T${time}`).toISOString();
      await scheduleInterview(application.id, interviewAt);

      const dateLabel = new Date(`${date}T${time}`).toLocaleDateString("lo-LA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const message = `ສະບາຍດີ ${worker.name}, ທ່ານໄດ້ຮັບການນັດໝາຍສຳພາດງານສຳລັບຕຳແໜ່ງ "${jobTitle}" ວັນທີ ${dateLabel} ເວລາ ${time} ນາລິກາ. ກະລຸນາກຽມຕົວມາຕາມນັດ. ຂອບໃຈ, ${orgName}`;
      window.open(buildWhatsappLink(worker.phone, message), "_blank");

      setSchedulingOpen(false);
      router.refresh();
    });
  }

  async function handleViewFile(file: WorkerFile) {
    const url = await getWorkerFileUrl(file.file_path);
    window.open(url, "_blank");
  }

  const stageOrder: ApplicationStage[] = ["received", "screening", "interview", "offer", "contract_signed"];
  const isDone = (stage: ApplicationStage) =>
    application.stage !== "rejected" && stageOrder.indexOf(application.stage) >= stageOrder.indexOf(stage);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/applicants" className="text-sm text-muted-foreground hover:underline">
        ← ກັບຄືນໄປລາຍຊື່ຜູ້ສະໝັກ
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{worker.name}</h1>
          <p className="text-sm text-muted-foreground">
            {worker.phone} · {calculateAge(worker.dob)} ປີ · ບ້ານ{worker.cur_village} ເມືອງ{worker.cur_district} ແຂວງ
            {worker.cur_province}
          </p>
        </div>
        <StatusBadge status={worker.availability_status} />
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-2 pt-6 text-sm">
          <Row label="ຕຳແໜ່ງ" value={jobTitle} />
          <Row label="ປະເທດ" value={label(application.country)} />
          <Row label="ສົ່ງໃບສະໝັກເມື່ອ" value={application.submitted_at} />
          {application.interview_at && (
            <Row
              label="ນັດສຳພາດ"
              value={new Date(application.interview_at).toLocaleString("lo-LA")}
            />
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="pt-6">
          <p className="mb-2 text-sm font-medium">ຄວາມຄືບໜ້າ</p>
          <div className="flex flex-wrap gap-2">
            {stageOrder.map((s) => (
              <Badge
                key={s}
                variant={application.stage === s ? "default" : "outline"}
                className={
                  application.stage === s
                    ? "bg-emerald-600 text-white"
                    : isDone(s)
                      ? "border-emerald-300 text-emerald-700"
                      : ""
                }
              >
                {STAGE_LABEL[s]}
              </Badge>
            ))}
            {application.stage === "rejected" && <Badge variant="destructive">ປະຕິເສດ/ປິດ</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="pt-6">
          <h2 className="font-semibold">ໄຟລ໌/ຮູບທີ່ອັບໂຫຼດ</h2>
          <div className="mt-3 space-y-2">
            {files.length === 0 && <p className="text-sm text-muted-foreground">ຍັງບໍ່ມີໄຟລ໌</p>}
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between border-b pb-2 text-sm">
                <div>
                  <p className="font-medium">{f.description || docLabel(f.doc_type)}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.file_name} · {f.uploaded_at?.slice(0, 10)}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleViewFile(f)}>
                  ເບິ່ງ
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm font-medium">ຂັ້ນຕອນຕໍ່ໄປ</p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={isPending || application.stage !== "received"}
              onClick={handleMarkScreening}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              ✅ ກວດເອກະສານແລ້ວ
            </Button>
            <Button
              disabled={isPending || application.stage === "rejected"}
              variant={application.stage === "interview" ? "outline" : "default"}
              onClick={() => setSchedulingOpen(true)}
              className={application.stage === "interview" ? "" : "bg-emerald-600 hover:bg-emerald-700"}
            >
              📅 {application.stage === "interview" ? "ປ່ຽນເວລານັດສຳພາດ" : "ນັດສຳພາດ"}
            </Button>
            <Button
              variant="outline"
              disabled={isPending || application.stage === "rejected"}
              className="text-red-600 hover:bg-red-50"
              onClick={handleReject}
            >
              ປະຕິເສດ
            </Button>
          </div>

          {schedulingOpen && (
            <div className="space-y-3 rounded-md border p-3">
              <p className="text-sm text-muted-foreground">
                ເລືອກວັນ ແລະ ເວລານັດສຳພາດ — ລະບົບຈະເປີດ WhatsApp ພ້ອມຂໍ້ຄວາມແຈ້ງເຕືອນໃຫ້ອັດຕະໂນມັດ
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>ວັນທີ</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>ເວລາ</Label>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={!date || !time || isPending}
                  onClick={handleConfirmInterview}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  ຢືນຢັນ ແລະ ເປີດ WhatsApp
                </Button>
                <Button variant="outline" onClick={() => setSchedulingOpen(false)}>
                  ຍົກເລີກ
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
