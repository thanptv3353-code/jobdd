"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { ApplicationEditDialog } from "@/components/application-edit-dialog";
import { AddressGroup } from "@/components/address-group";
import { useCountries } from "@/components/countries-provider";
import { docLabel } from "@/lib/eligibility";
import {
  addContactLog,
  deleteContactLog,
  deleteWorker,
  deleteWorkerFile,
  getWorkerFileUrl,
  setWorkerStatus,
  submitApplication,
  updateContactLog,
  updateWorkerProfile,
} from "@/lib/actions";
import { calculateAge } from "@/lib/eligibility";
import {
  AVAILABILITY_LABEL,
  STAGE_LABEL,
  type AvailabilityStatus,
  type Country,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type Worker = Database["public"]["Tables"]["worker_profiles"]["Row"];
type Placement = Database["public"]["Tables"]["placements"]["Row"];
type ContactLog = Database["public"]["Tables"]["contact_logs"]["Row"];
type WorkerFile = Database["public"]["Tables"]["worker_files"]["Row"];
type Application = Database["public"]["Tables"]["applications"]["Row"] & {
  jobs: { title: string } | null;
};
type OpenJob = { id: string; title: string; country: string };

const STATUS_OPTIONS: AvailabilityStatus[] = ["available", "in_process", "placed", "paused", "stale"];

export function AdminWorkerDetail({
  worker,
  applications,
  placements,
  contactLogs,
  files,
  formFields,
  openJobs,
}: {
  worker: Worker;
  applications: Application[];
  placements: Placement[];
  contactLogs: ContactLog[];
  files: WorkerFile[];
  formFields: { field_key: string; label: string }[];
  openJobs: OpenJob[];
}) {
  const router = useRouter();
  const { label } = useCountries();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [applyJobId, setApplyJobId] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [editingLog, setEditingLog] = useState<ContactLog | null>(null);

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

  function handleDeleteWorker() {
    if (!confirm(`ລຶບຂໍ້ມູນ "${worker.name}" ຖາວອນ? ໃບສະໝັກ, ປະຫວັດການຈ້າງງານ, ແລະ ບັນທຶກການຕິດຕໍ່ທັງໝົດຈະຖືກລຶບນຳ.`))
      return;
    startTransition(async () => {
      await deleteWorker(worker.id);
      router.push("/admin/workers");
      router.refresh();
    });
  }

  function handleDeleteLog(log: ContactLog) {
    if (!confirm("ລຶບບັນທຶກການຕິດຕໍ່ນີ້?")) return;
    startTransition(async () => {
      await deleteContactLog(log.id, worker.id);
      router.refresh();
    });
  }

  async function handleViewFile(file: WorkerFile) {
    const url = await getWorkerFileUrl(file.file_path);
    window.open(url, "_blank");
  }

  function handleDeleteFile(file: WorkerFile) {
    if (!confirm(`ລຶບໄຟລ໌ "${file.file_name}" ຖາວອນ?`)) return;
    startTransition(async () => {
      await deleteWorkerFile(file.id, file.file_path, worker.id);
      router.refresh();
    });
  }

  function handleApplyOnBehalf() {
    const job = openJobs.find((j) => j.id === applyJobId);
    if (!job) return;
    startTransition(async () => {
      await submitApplication({
        workerId: worker.id,
        jobId: job.id,
        country: job.country,
        documents: {},
      });
      setApplyJobId("");
      router.refresh();
    });
  }

  const customFieldEntries = Object.entries(worker.custom_fields ?? {});

  return (
    <div className="mx-auto max-w-3xl">
      {worker.availability_status === "placed" && activePlacement && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          ⛔ ຄົນນີ້ໄດ້ວຽກແລ້ວ — {activePlacement.company_name} ຢູ່{label(activePlacement.country)}
          {" "}ຕັ້ງແຕ່ {activePlacement.start_date}
          {activePlacement.contract_end_date && ` ສັນຍາໝົດ ${activePlacement.contract_end_date}`}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{worker.name}</h1>
          <p className="text-sm text-muted-foreground">
            {worker.phone} · {calculateAge(worker.dob)} ປີ · ບ້ານ{worker.cur_village} ເມືອງ{worker.cur_district}{" "}
            ແຂວງ{worker.cur_province}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={worker.availability_status} />
          <Button size="sm" variant="outline" onClick={() => setEditingProfile(true)}>
            ແກ້ໄຂໂປຣໄຟລ໌
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {worker.preferred_countries.map((c) => (
          <Badge key={c} variant="secondary">
            {label(c)}
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
                    {label(a.country)} · {a.submitted_at}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{STAGE_LABEL[a.stage]}</Badge>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingApplication(a)}>
                    ແກ້ໄຂ
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-end gap-2 border-t pt-4">
            <div className="flex-1 space-y-1.5">
              <Label>ສະໝັກວຽກໃຫ້ຄົນນີ້ (ພະນັກງານຊ່ວຍສະໝັກແທນ)</Label>
              <Select value={applyJobId} onValueChange={setApplyJobId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ເລືອກຕຳແໜ່ງງານ..." />
                </SelectTrigger>
                <SelectContent>
                  {openJobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title} — {label(j.country)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              disabled={!applyJobId || isPending}
              onClick={handleApplyOnBehalf}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              ສະໝັກໃຫ້
            </Button>
          </div>
        </CardContent>
      </Card>

      {customFieldEntries.length > 0 && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <h2 className="font-semibold">ຂໍ້ມູນເພີ່ມເຕີມ</h2>
            <div className="mt-3 space-y-2 text-sm">
              {customFieldEntries.map(([key, value]) => (
                <div key={key} className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">
                    {formFields.find((f) => f.field_key === key)?.label ?? key}
                  </span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card id="files" className="mt-4 scroll-mt-6">
        <CardContent className="pt-6">
          <h2 className="font-semibold">ໄຟລ໌/ຮູບທີ່ອັບໂຫຼດ</h2>
          <div className="mt-3 space-y-2">
            {files.length === 0 && <p className="text-sm text-muted-foreground">ຍັງບໍ່ມີໄຟລ໌</p>}
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between border-b pb-2 text-sm">
                <div>
                  <p className="font-medium">{docLabel(f.doc_type)}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.file_name} · {f.uploaded_at?.slice(0, 10)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleViewFile(f)}>
                    ເບິ່ງ
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteFile(f)}
                  >
                    ລຶບ
                  </Button>
                </div>
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
              <div key={c.id} className="flex items-center justify-between border-b pb-2 text-sm">
                <div>
                  <p>
                    <span className="font-medium">{c.staff_name}</span> · {c.contacted_at} — {c.result}
                  </p>
                  {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingLog(c)}>
                    ແກ້ໄຂ
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteLog(c)}
                  >
                    ລຶບ
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 border-red-200">
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="text-sm font-medium text-red-800">ລຶບຂໍ້ມູນຜູ້ຫາງານນີ້</p>
            <p className="text-xs text-muted-foreground">ລຶບຖາວອນ ບໍ່ສາມາດກູ້ຄືນໄດ້</p>
          </div>
          <Button variant="outline" className="text-red-600 hover:bg-red-50" disabled={isPending} onClick={handleDeleteWorker}>
            ລຶບຜູ້ຫາງານ
          </Button>
        </CardContent>
      </Card>

      <ProfileEditDialog worker={worker} open={editingProfile} onOpenChange={setEditingProfile} />
      <ApplicationEditDialog
        application={editingApplication}
        open={!!editingApplication}
        onOpenChange={(open) => !open && setEditingApplication(null)}
      />
      <ContactLogEditDialog
        log={editingLog}
        workerId={worker.id}
        open={!!editingLog}
        onOpenChange={(open) => !open && setEditingLog(null)}
      />
    </div>
  );
}

function ProfileEditDialog({
  worker,
  open,
  onOpenChange,
}: {
  worker: Worker;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { countries, label } = useCountries();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(worker.name);
  const [gender, setGender] = useState<"male" | "female">(worker.gender);
  const [phone, setPhone] = useState(worker.phone);
  const [dob, setDob] = useState(worker.dob);
  const [permVillage, setPermVillage] = useState(worker.perm_village);
  const [permDistrict, setPermDistrict] = useState(worker.perm_district);
  const [permProvince, setPermProvince] = useState(worker.perm_province);
  const [curVillage, setCurVillage] = useState(worker.cur_village);
  const [curDistrict, setCurDistrict] = useState(worker.cur_district);
  const [curProvince, setCurProvince] = useState(worker.cur_province);
  const [selectedCountries, setSelectedCountries] = useState<Country[]>(
    worker.preferred_countries as Country[]
  );

  function toggle(c: Country) {
    setSelectedCountries((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  }

  function handleSave() {
    startTransition(async () => {
      await updateWorkerProfile(worker.id, {
        name,
        gender,
        phone,
        dob,
        permVillage,
        permDistrict,
        permProvince,
        curVillage,
        curDistrict,
        curProvince,
        preferredCountries: selectedCountries,
      });
      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ແກ້ໄຂໂປຣໄຟລ໌</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>ຊື່ ແລະ ນາມສະກຸນ</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGender("male")}
              className={cn("rounded-md border px-3 py-2 text-sm", gender === "male" ? "border-emerald-600 bg-emerald-50" : "")}
            >
              ຊາຍ
            </button>
            <button
              type="button"
              onClick={() => setGender("female")}
              className={cn("rounded-md border px-3 py-2 text-sm", gender === "female" ? "border-emerald-600 bg-emerald-50" : "")}
            >
              ຍິງ
            </button>
          </div>
          <div className="space-y-1.5">
            <Label>ເບີໂທລະສັບ</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>ວັນເດືອນປີເກີດ</Label>
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <AddressGroup
            title="ທີ່ຢູ່ຕາມສຳມະໂນຄົວ"
            village={permVillage}
            district={permDistrict}
            province={permProvince}
            onVillage={setPermVillage}
            onDistrict={setPermDistrict}
            onProvince={setPermProvince}
          />
          <AddressGroup
            title="ທີ່ຢູ່ປັດຈຸບັນ"
            village={curVillage}
            district={curDistrict}
            province={curProvince}
            onVillage={setCurVillage}
            onDistrict={setCurDistrict}
            onProvince={setCurProvince}
          />
          <div className="space-y-1.5">
            <Label>ສົນໃຈໄປປະເທດໃດແດ່</Label>
            <div className="grid grid-cols-2 gap-2">
              {countries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => toggle(c.code)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm",
                    selectedCountries.includes(c.code) ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "hover:bg-muted"
                  )}
                >
                  {selectedCountries.includes(c.code) ? "☑" : "☐"} {label(c.code)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
            ບັນທຶກ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContactLogEditDialog({
  log,
  workerId,
  open,
  onOpenChange,
}: {
  log: ContactLog | null;
  workerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ແກ້ໄຂບັນທຶກການຕິດຕໍ່</DialogTitle>
        </DialogHeader>
        {log && (
          <ContactLogEditForm
            key={log.id}
            log={log}
            workerId={workerId}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ContactLogEditForm({
  log,
  workerId,
  onDone,
}: {
  log: ContactLog;
  workerId: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState(log.result);
  const [noteText, setNoteText] = useState(log.note ?? "");

  function handleSave() {
    startTransition(async () => {
      await updateContactLog(log.id, workerId, { result, note: noteText, channel: log.channel });
      router.refresh();
      onDone();
    });
  }

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>ຜົນການຕິດຕໍ່</Label>
          <Input value={result} onChange={(e) => setResult(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>ໝາຍເຫດ</Label>
          <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
          ບັນທຶກ
        </Button>
      </DialogFooter>
    </>
  );
}
