"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileUploadField, type UploadedFileInfo } from "@/components/file-upload-field";
import { AdditionalFilesField, type PendingFile } from "@/components/additional-files-field";
import { AddressGroup } from "@/components/address-group";
import { useCountries } from "@/components/countries-provider";
import { recordWorkerFile, registerWorker, submitApplication } from "@/lib/actions";
import { checkEligibility, docLabel } from "@/lib/eligibility";
import type { Database } from "@/lib/supabase/database.types";

type Job = Database["public"]["Tables"]["jobs"]["Row"] & {
  members: Database["public"]["Tables"]["members"]["Row"] | null;
};
type Requirement = Database["public"]["Tables"]["country_requirements"]["Row"];

const STEPS = ["ຂໍ້ມູນສ່ວນຕົວ", "ເອກະສານ", "ກວດສອບ ແລະ ສົ່ງ"];

export function ApplyForm({ job, requirements }: { job: Job; requirements: Requirement[] }) {
  const router = useRouter();
  const { label, get } = useCountries();
  const [isPending, startTransition] = useTransition();
  const [workerId] = useState(() => crypto.randomUUID());

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [permVillage, setPermVillage] = useState("");
  const [permDistrict, setPermDistrict] = useState("");
  const [permProvince, setPermProvince] = useState("");
  const [curVillage, setCurVillage] = useState("");
  const [curDistrict, setCurDistrict] = useState("");
  const [curProvince, setCurProvince] = useState("");
  const [registered, setRegistered] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addPendingFile(docType: string) {
    return (info: UploadedFileInfo) => setPendingFiles((cur) => [...cur, { docType, ...info }]);
  }

  const country = get(job.country);
  const eligibility = useMemo(() => checkEligibility(dob, country), [dob, country]);
  const missingDocs = requirements.filter((r) => r.required && !uploadedDocs[r.doc_type]);

  const canGoStep1 = name.trim() && phone.trim() && dob && eligibility.eligible;

  function handleNextFromStep0() {
    setError(null);
    startTransition(async () => {
      try {
        await registerWorker({
          id: workerId,
          name,
          gender: "male",
          phone,
          dob,
          permVillage,
          permDistrict,
          permProvince,
          curVillage,
          curDistrict,
          curProvince,
          preferredCountries: [job.country],
        });
        for (const f of pendingFiles) {
          await recordWorkerFile({
            workerId,
            docType: f.docType,
            filePath: f.path,
            fileName: f.fileName,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes,
            description: f.description,
          });
        }
        setRegistered(true);
        setStep(1);
      } catch {
        setError("ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ");
      }
    });
  }

  function handleSubmit() {
    if (!registered) return;
    setError(null);
    startTransition(async () => {
      try {
        await submitApplication({
          workerId,
          jobId: job.id,
          country: job.country,
          documents: uploadedDocs,
        });
        setSubmitted(true);
      } catch {
        setError("ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ");
      }
    });
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✅
        </div>
        <h1 className="text-2xl font-bold">ສົ່ງໃບສະໝັກສຳເລັດແລ້ວ</h1>
        <p className="mt-2 text-muted-foreground">
          ພະນັກງານຈະຕິດຕໍ່ຫາທ່ານພາຍໃນ 3–5 ວັນລັດຖະການ ຜ່ານເບີໂທ {phone}
        </p>
        <Button className="mt-6" onClick={() => router.push("/dashboard")}>
          ເບິ່ງໃບສະໝັກຂອງຂ້ອຍ
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-sm text-muted-foreground">ສະໝັກ · {label(job.country)}</p>
      <h1 className="text-2xl font-bold">{job.title}</h1>

      <div className="mt-6">
        <Progress value={((step + 1) / STEPS.length) * 100} />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={s} className={i === step ? "font-semibold text-foreground" : ""}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          {step === 0 && (
            <div className="space-y-4">
              <FileUploadField
                workerId={workerId}
                docType="photo"
                label="ຮູບຖ່າຍ 3x4"
                note="ບໍ່ບັງຄັບ"
                deferRecord
                onUploaded={addPendingFile("photo")}
              />
              <Field label="ຊື່ ແລະ ນາມສະກຸນ">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ທ້າວ/ນາງ ..." />
              </Field>
              <Field label="ເບີໂທລະສັບ">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="020 ..." />
              </Field>
              <Field label="ວັນເດືອນປີເກີດ">
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </Field>

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

              {dob && !eligibility.eligible && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  ⛔ ບໍ່ສາມາດສະໝັກໄດ້: {eligibility.reasons.join(", ")}
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          )}

          {step === 1 && registered && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                ອັບໂຫຼດຮູບຖ່າຍ/ສະແກນເອກະສານ — ຖ້າຍັງບໍ່ຄົບ ສາມາດສະໝັກກ່ອນ ແລ້ວນຳມາຍື່ນເພີ່ມພາຍຫຼັງໄດ້
              </p>
              {requirements.map((r) => (
                <FileUploadField
                  key={r.doc_type}
                  workerId={workerId}
                  docType={r.doc_type}
                  label={docLabel(r.doc_type)}
                  required={r.required}
                  note={r.note ?? undefined}
                  onUploaded={() => setUploadedDocs((d) => ({ ...d, [r.doc_type]: true }))}
                />
              ))}
              {missingDocs.length > 0 && (
                <p className="text-xs text-amber-700">
                  ⚠ ຍັງຂາດ {missingDocs.length} ເອກະສານ — ສາມາດສະໝັກກ່ອນໄດ້ ພະນັກງານຈະແຈ້ງໃຫ້ນຳມາເພີ່ມ
                </p>
              )}
              <div className="space-y-1.5 pt-2">
                <Label>ເອກະສານເພີ່ມເຕີມ (ບໍ່ບັງຄັບ) — ເຊັ່ນ ຊີວະປະຫວັດ (CV)</Label>
                <AdditionalFilesField
                  workerId={workerId}
                  onFileUploaded={(f) => recordWorkerFile({
                    workerId,
                    docType: f.docType,
                    filePath: f.path,
                    fileName: f.fileName,
                    mimeType: f.mimeType,
                    sizeBytes: f.sizeBytes,
                    description: f.description,
                  })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 text-sm">
              <Row label="ຊື່" value={name} />
              <Row label="ເບີໂທ" value={phone} />
              <Row label="ວັນເກີດ" value={dob} />
              <Row label="ຕຳແໜ່ງ" value={job.title} />
              <Row label="ປະເທດ" value={label(job.country)} />
              <Row
                label="ເອກະສານພ້ອມ"
                value={`${Object.values(uploadedDocs).filter(Boolean).length}/${requirements.length}`}
              />
              {error && <p className="text-red-600">{error}</p>}
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              disabled={step === 0 || isPending}
              onClick={() => setStep((s) => s - 1)}
            >
              ກັບຄືນ
            </Button>
            {step === 0 && (
              <Button onClick={handleNextFromStep0} disabled={!canGoStep1 || isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {isPending ? "ກຳລັງດຳເນີນການ..." : "ຕໍ່ໄປ"}
              </Button>
            )}
            {step === 1 && (
              <Button onClick={() => setStep(2)} className="bg-emerald-600 hover:bg-emerald-700">
                ຕໍ່ໄປ
              </Button>
            )}
            {step === 2 && (
              <Button onClick={handleSubmit} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {isPending ? "ກຳລັງສົ່ງ..." : "ສົ່ງໃບສະໝັກ"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
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
