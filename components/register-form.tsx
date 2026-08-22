"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DynamicField, type CustomFieldValue } from "@/components/dynamic-field";
import { FileUploadField, type UploadedFileInfo } from "@/components/file-upload-field";
import { AdditionalFilesField, type PendingFile } from "@/components/additional-files-field";
import { AddressGroup } from "@/components/address-group";
import { useCountries } from "@/components/countries-provider";
import { recordWorkerFile, registerWorker } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type FormField = Database["public"]["Tables"]["form_fields"]["Row"];

function Req({ required }: { required: boolean }) {
  return required ? <span className="text-red-500"> *</span> : null;
}

export function RegisterForm({ fields }: { fields: FormField[] }) {
  const router = useRouter();
  const { countries, label } = useCountries();
  const [isPending, startTransition] = useTransition();
  const [workerId] = useState(() => crypto.randomUUID());

  const builtin = useMemo(() => {
    const map = new Map(fields.filter((f) => f.is_builtin).map((f) => [f.field_key, f]));
    return {
      get: (key: string) => map.get(key),
      label: (key: string, fallback: string) => map.get(key)?.label ?? fallback,
      required: (key: string) => map.get(key)?.required ?? false,
    };
  }, [fields]);
  const customFields = useMemo(() => fields.filter((f) => !f.is_builtin), [fields]);

  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [permVillage, setPermVillage] = useState("");
  const [permDistrict, setPermDistrict] = useState("");
  const [permProvince, setPermProvince] = useState("");
  const [curVillage, setCurVillage] = useState("");
  const [curDistrict, setCurDistrict] = useState("");
  const [curProvince, setCurProvince] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, CustomFieldValue>>({});
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCountry(c: string) {
    setSelectedCountries((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  }

  function addPendingFile(docType: string) {
    return (info: UploadedFileInfo) => setPendingFiles((cur) => [...cur, { docType, ...info }]);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await registerWorker({
          id: workerId,
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
          customFields: customValues,
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
        setDone(true);
      } catch {
        setError("ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ");
      }
    });
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          🎉
        </div>
        <h1 className="text-2xl font-bold">ລົງທະບຽນສຳເລັດແລ້ວ</h1>
        <p className="mt-2 text-muted-foreground">
          ພວກເຮົາຈະແຈ້ງເຕືອນທ່ານທັນທີເມື່ອມີວຽກໃໝ່ໃນປະເທດທີ່ທ່ານສົນໃຈ
        </p>
        <Button className="mt-6" onClick={() => router.push("/jobs")}>
          ໄປເບິ່ງຕຳແໜ່ງງານ
        </Button>
      </div>
    );
  }

  const photoOk = !builtin.required("_photo") || pendingFiles.some((f) => f.docType === "photo");
  const idCardOk = !builtin.required("_id_card") || pendingFiles.some((f) => f.docType === "id_card");
  const permAddrOk =
    !builtin.required("_perm_address") || (permVillage.trim() && permDistrict.trim() && permProvince.trim());
  const curAddrOk =
    !builtin.required("_cur_address") || (curVillage.trim() && curDistrict.trim() && curProvince.trim());
  const valid =
    (!builtin.required("_name") || name.trim()) &&
    (!builtin.required("_phone") || phone.trim()) &&
    (!builtin.required("_dob") || dob) &&
    (!builtin.required("_countries") || selectedCountries.length > 0) &&
    photoOk &&
    idCardOk &&
    permAddrOk &&
    curAddrOk;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold">ລົງທະບຽນຜູ້ຫາງານ</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ສ້າງໂປຣໄຟລ໌ຄັ້ງດຽວ ໃຊ້ສະໝັກໄດ້ຫຼາຍວຽກ ແລະ ຮັບແຈ້ງເຕືອນວຽກໃໝ່
      </p>

      <Card className="mt-6">
        <CardContent className="space-y-4 pt-6">
          <FileUploadField
            workerId={workerId}
            docType="photo"
            label={builtin.label("_photo", "ຮູບຖ່າຍ 3x4")}
            required={builtin.required("_photo")}
            note={builtin.required("_photo") ? undefined : "ບໍ່ບັງຄັບ"}
            deferRecord
            onUploaded={addPendingFile("photo")}
          />

          <div className="space-y-1.5">
            <Label>
              {builtin.label("_name", "ຊື່ ແລະ ນາມສະກຸນ")}
              <Req required={builtin.required("_name")} />
            </Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ທ້າວ/ນາງ ..." />
          </div>

          <div className="space-y-1.5">
            <Label>
              {builtin.label("_gender", "ເພດ")}
              <Req required={builtin.required("_gender")} />
            </Label>
            <div className="flex gap-2">
              <GenderChip active={gender === "male"} onClick={() => setGender("male")}>
                ຊາຍ
              </GenderChip>
              <GenderChip active={gender === "female"} onClick={() => setGender("female")}>
                ຍິງ
              </GenderChip>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              {builtin.label("_phone", "ເບີໂທລະສັບ")}
              <Req required={builtin.required("_phone")} />
            </Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="020 ..." />
          </div>

          <div className="space-y-1.5">
            <Label>
              {builtin.label("_dob", "ວັນເດືອນປີເກີດ")}
              <Req required={builtin.required("_dob")} />
            </Label>
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>

          <AddressGroup
            title={builtin.label("_perm_address", "ທີ່ຢູ່ຕາມສຳມະໂນຄົວ")}
            village={permVillage}
            district={permDistrict}
            province={permProvince}
            onVillage={setPermVillage}
            onDistrict={setPermDistrict}
            onProvince={setPermProvince}
          />
          <AddressGroup
            title={builtin.label("_cur_address", "ທີ່ຢູ່ປັດຈຸບັນ")}
            village={curVillage}
            district={curDistrict}
            province={curProvince}
            onVillage={setCurVillage}
            onDistrict={setCurDistrict}
            onProvince={setCurProvince}
          />

          <div className="space-y-1.5">
            <Label>
              {builtin.label("_countries", "ສົນໃຈໄປປະເທດໃດແດ່? (ເລືອກໄດ້ຫຼາຍອັນ)")}
              <Req required={builtin.required("_countries")} />
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {countries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => toggleCountry(c.code)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    selectedCountries.includes(c.code)
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "hover:bg-muted"
                  )}
                >
                  {selectedCountries.includes(c.code) ? "☑" : "☐"} {label(c.code)}
                </button>
              ))}
            </div>
          </div>

          {customFields.map((f) => (
            <DynamicField
              key={f.id}
              field={f}
              value={customValues[f.field_key]}
              onChange={(v) => setCustomValues((cur) => ({ ...cur, [f.field_key]: v }))}
            />
          ))}

          <FileUploadField
            workerId={workerId}
            docType="id_card"
            label={builtin.label("_id_card", "ບັດປະຈຳຕົວ / ສຳມະໂນຄົວ")}
            required={builtin.required("_id_card")}
            note={builtin.required("_id_card") ? undefined : "ບໍ່ບັງຄັບ"}
            deferRecord
            onUploaded={addPendingFile("id_card")}
          />

          <div className="space-y-1.5">
            <Label>{builtin.label("_additional_docs", "ເອກະສານເພີ່ມເຕີມ (ບໍ່ບັງຄັບ) — ເຊັ່ນ ຊີວະປະຫວັດ (CV)")}</Label>
            <AdditionalFilesField
              workerId={workerId}
              onFileUploaded={(f) => setPendingFiles((cur) => [...cur, f])}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={!valid || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "ກຳລັງລົງທະບຽນ..." : "ລົງທະບຽນ"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function GenderChip({
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
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
        active ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}
