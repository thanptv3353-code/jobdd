"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { useCountries } from "@/components/countries-provider";
import { getMyStatus, setMyStatus } from "@/lib/actions";
import { STAGE_LABEL, type AvailabilityStatus } from "@/lib/types";

interface MyApplication {
  id: string;
  stage: string;
  country: string;
  submitted_at: string;
  job_title: string;
}

interface MyStatus {
  worker: {
    id: string;
    name: string;
    availability_status: AvailabilityStatus;
    status_updated_at: string;
    status_updated_by: string;
  };
  applications: MyApplication[];
}

export default function DashboardPage() {
  const { label } = useCountries();
  const [isPending, startTransition] = useTransition();
  const [phone, setPhone] = useState("");
  const [data, setData] = useState<MyStatus | null>(null);
  const [notFound, setNotFound] = useState(false);

  function handleLookup() {
    setNotFound(false);
    startTransition(async () => {
      const result = (await getMyStatus(phone)) as MyStatus | null;
      if (!result) {
        setData(null);
        setNotFound(true);
      } else {
        setData(result);
      }
    });
  }

  function handleStatusUpdate(status: AvailabilityStatus) {
    startTransition(async () => {
      await setMyStatus(phone, status);
      handleLookup();
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">ກວດສະຖານະໃບສະໝັກຂອງຂ້ອຍ</h1>
      <p className="mt-1 text-sm text-muted-foreground">ໃສ່ເບີໂທທີ່ໃຊ້ຕອນສະໝັກ ຫຼື ລົງທະບຽນ</p>

      <div className="mt-4 flex gap-2">
        <div className="flex-1 space-y-1.5">
          <Label>ເບີໂທລະສັບ</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="020 ..." />
        </div>
        <Button
          className="mt-6 bg-emerald-600 hover:bg-emerald-700"
          disabled={!phone.trim() || isPending}
          onClick={handleLookup}
        >
          {isPending ? "ກຳລັງຄົ້ນຫາ..." : "ກວດສະຖານະ"}
        </Button>
      </div>

      {notFound && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          ບໍ່ພົບຂໍ້ມູນສຳລັບເບີໂທນີ້ — ກະລຸນາກວດເບີໂທ ຫຼື ລົງທະບຽນໃໝ່
        </p>
      )}

      {data && (
        <div className="mt-6 space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">{data.worker.name}</p>
                <StatusBadge status={data.worker.availability_status} />
              </div>
              <p className="text-xs text-muted-foreground">
                ອັບເດດຄັ້ງລ່າສຸດ: {data.worker.status_updated_at?.slice(0, 10)} ໂດຍ{" "}
                {data.worker.status_updated_by}
              </p>
              <div className="flex flex-wrap gap-2 border-t pt-3">
                {data.worker.availability_status !== "placed" ? (
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isPending}
                    onClick={() => handleStatusUpdate("placed")}
                  >
                    ຂ້ອຍໄດ້ວຽກແລ້ວ 🎉
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleStatusUpdate("available")}>
                    ຂ້ອຍກັບມາຫາວຽກອີກ
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {data.applications.length === 0 && (
              <p className="py-6 text-center text-muted-foreground">ຍັງບໍ່ມີໃບສະໝັກ</p>
            )}
            {data.applications.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div>
                    <p className="font-semibold">{a.job_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {label(a.country)} · ສົ່ງເມື່ອ {a.submitted_at}
                    </p>
                  </div>
                  <Badge
                    variant={a.stage === "rejected" ? "destructive" : "secondary"}
                    className={a.stage === "contract_signed" ? "bg-emerald-600 text-white" : ""}
                  >
                    {STAGE_LABEL[a.stage as keyof typeof STAGE_LABEL]}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
