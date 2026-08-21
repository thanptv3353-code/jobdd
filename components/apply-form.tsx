"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { registerWorker, submitApplication } from "@/lib/actions";
import { checkEligibility, docLabel } from "@/lib/eligibility";
import { COUNTRY_LABEL } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";

type Job = Database["public"]["Tables"]["jobs"]["Row"] & {
  members: Database["public"]["Tables"]["members"]["Row"] | null;
};
type Requirement = Database["public"]["Tables"]["country_requirements"]["Row"];

const STEPS = ["ຂໍ້ມູນສ່ວນຕົວ", "ເອກະສານ", "ກວດສອບ ແລະ ສົ່ງ"];

export function ApplyForm({ job, requirements }: { job: Job; requirements: Requirement[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [province, setProvince] = useState("");
  const [documents, setDocuments] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eligibility = useMemo(() => checkEligibility(job.country, dob, requirements), [job.country, dob, requirements]);
  const missingDocs = requirements.filter((r) => r.required && !documents[r.doc_type]);

  const canGoStep1 = name.trim() && phone.trim() && dob && eligibility.eligible;

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        const worker = await registerWorker({
          name,
          gender: "male",
          phone,
          dob,
          province,
          preferredCountries: [job.country],
        });
        await submitApplication({
          workerId: worker.id,
          jobId: job.id,
          country: job.country,
          documents,
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
      <p className="text-sm text-muted-foreground">ສະໝັກ · {COUNTRY_LABEL[job.country]}</p>
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
              <Field label="ຊື່ ແລະ ນາມສະກຸນ">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ທ້າວ/ນາງ ..." />
              </Field>
              <Field label="ເບີໂທລະສັບ">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="020 ..." />
              </Field>
              <Field label="ວັນເດືອນປີເກີດ">
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </Field>
              <Field label="ແຂວງ">
                <Input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="ວຽງຈັນ" />
              </Field>

              {dob && !eligibility.eligible && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  ⛔ ບໍ່ສາມາດສະໝັກໄດ້: {eligibility.reasons.join(", ")}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                ໝາຍໃສ່ຊ່ອງເອກະສານທີ່ທ່ານມີພ້ອມແລ້ວ — ຖ້າຍັງບໍ່ຄົບ ສາມາດສະໝັກກ່ອນ ແລ້ວນຳມາຍື່ນເພີ່ມພາຍຫຼັງໄດ້
              </p>
              {requirements.map((r) => (
                <label
                  key={r.doc_type}
                  className="flex items-center justify-between rounded-md border px-3 py-2.5 text-sm"
                >
                  <span>
                    {docLabel(r.doc_type)} {r.required && <span className="text-red-500">*</span>}
                    {r.note && <span className="ml-1 text-xs text-muted-foreground">({r.note})</span>}
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!!documents[r.doc_type]}
                    onChange={(e) =>
                      setDocuments((d) => ({ ...d, [r.doc_type]: e.target.checked }))
                    }
                  />
                </label>
              ))}
              {missingDocs.length > 0 && (
                <p className="text-xs text-amber-700">
                  ⚠ ຍັງຂາດ {missingDocs.length} ເອກະສານ — ສາມາດສະໝັກກ່ອນໄດ້ ພະນັກງານຈະແຈ້ງໃຫ້ນຳມາເພີ່ມ
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 text-sm">
              <Row label="ຊື່" value={name} />
              <Row label="ເບີໂທ" value={phone} />
              <Row label="ວັນເກີດ" value={dob} />
              <Row label="ແຂວງ" value={province} />
              <Row label="ຕຳແໜ່ງ" value={job.title} />
              <Row label="ປະເທດ" value={COUNTRY_LABEL[job.country]} />
              <Row
                label="ເອກະສານພ້ອມ"
                value={`${Object.values(documents).filter(Boolean).length}/${requirements.length}`}
              />
              {error && <p className="text-red-600">{error}</p>}
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              ກັບຄືນ
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && !canGoStep1}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                ຕໍ່ໄປ
              </Button>
            ) : (
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
