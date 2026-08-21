"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerWorker } from "@/lib/actions";
import { COUNTRY_LABEL, COUNTRY_LIST, type Country } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [province, setProvince] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCountry(c: Country) {
    setCountries((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await registerWorker({
          name,
          gender,
          phone,
          dob,
          province,
          preferredCountries: countries,
        });
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

  const valid = name.trim() && phone.trim() && dob && countries.length > 0;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold">ລົງທະບຽນຜູ້ຫາງານ</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ສ້າງໂປຣໄຟລ໌ຄັ້ງດຽວ ໃຊ້ສະໝັກໄດ້ຫຼາຍວຽກ ແລະ ຮັບແຈ້ງເຕືອນວຽກໃໝ່
      </p>

      <Card className="mt-6">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1.5">
            <Label>ຊື່ ແລະ ນາມສະກຸນ</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ທ້າວ/ນາງ ..." />
          </div>

          <div className="space-y-1.5">
            <Label>ເພດ</Label>
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
            <Label>ເບີໂທລະສັບ</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="020 ..." />
          </div>

          <div className="space-y-1.5">
            <Label>ວັນເດືອນປີເກີດ</Label>
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>ແຂວງ</Label>
            <Input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="ວຽງຈັນ" />
          </div>

          <div className="space-y-1.5">
            <Label>ສົນໃຈໄປປະເທດໃດແດ່? (ເລືອກໄດ້ຫຼາຍອັນ)</Label>
            <div className="grid grid-cols-2 gap-2">
              {COUNTRY_LIST.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCountry(c)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    countries.includes(c)
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "hover:bg-muted"
                  )}
                >
                  {countries.includes(c) ? "☑" : "☐"} {COUNTRY_LABEL[c]}
                </button>
              ))}
            </div>
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
