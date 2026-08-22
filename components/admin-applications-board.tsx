"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplicationEditDialog } from "@/components/application-edit-dialog";
import { useCountries } from "@/components/countries-provider";
import { updateApplicationStage } from "@/lib/actions";
import { STAGE_LABEL, STAGE_ORDER, type ApplicationStage, type Country } from "@/lib/types";

interface AppRow {
  id: string;
  stage: ApplicationStage;
  country: Country;
  worker_id: string;
  documents: Record<string, boolean>;
  worker_profiles: { name: string } | null;
  jobs: { title: string } | null;
}

const BOARD_STAGES: ApplicationStage[] = ["received", "screening", "interview", "offer", "contract_signed"];

function nextStage(stage: ApplicationStage): ApplicationStage | null {
  if (stage === "rejected" || stage === "contract_signed") return null;
  const idx = STAGE_ORDER.indexOf(stage);
  return STAGE_ORDER[idx + 1] ?? null;
}

export function AdminApplicationsBoard({
  applications,
  photoUrls,
}: {
  applications: AppRow[];
  photoUrls: Record<string, string>;
}) {
  const router = useRouter();
  const { label } = useCountries();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingApplication = applications.find((a) => a.id === editingId) ?? null;

  function move(id: string, stage: ApplicationStage) {
    startTransition(async () => {
      await updateApplicationStage(id, stage);
      router.refresh();
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">ໃບສະໝັກ</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ຍ້າຍໃບສະໝັກໄປແຕ່ລະຂັ້ນ — ຖ້າ &quot;ເຊັນສັນຍາແລ້ວ&quot; ຈະປິດໃບສະໝັກອື່ນຂອງຄົນນັ້ນອັດຕະໂນມັດ ແລະ ປ່ຽນສະຖານະເປັນ 🔴
      </p>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {BOARD_STAGES.map((stage) => {
          const items = applications.filter((a) => a.stage === stage);
          return (
            <div key={stage} className="w-72 shrink-0">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{STAGE_LABEL[stage]}</p>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((a) => {
                  const next = nextStage(a.stage);
                  return (
                    <Card key={a.id}>
                      <CardContent className="space-y-2 pt-4 text-sm">
                        <div className="flex items-center gap-2">
                          {photoUrls[a.worker_id] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoUrls[a.worker_id]}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                              ບໍ່ມີຮູບ
                            </div>
                          )}
                          <Link href={`/admin/workers/${a.worker_id}#files`} className="font-medium hover:underline">
                            {a.worker_profiles?.name}
                          </Link>
                        </div>
                        <p className="text-xs text-muted-foreground">{a.jobs?.title}</p>
                        <Badge variant="secondary" className="text-xs">
                          {label(a.country)}
                        </Badge>
                        <Link
                          href={`/admin/workers/${a.worker_id}#files`}
                          className="block text-xs text-emerald-700 hover:underline"
                        >
                          📎 ເບິ່ງໄຟລ໌/ເອກະສານທັງໝົດ →
                        </Link>
                        <div className="flex gap-1.5 pt-1">
                          {next && (
                            <Button
                              size="sm"
                              disabled={isPending}
                              className="h-7 flex-1 bg-emerald-600 text-xs hover:bg-emerald-700"
                              onClick={() => move(a.id, next)}
                            >
                              → {STAGE_LABEL[next]}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            className="h-7 text-xs"
                            onClick={() => move(a.id, "rejected")}
                          >
                            ປະຕິເສດ
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            className="h-7 text-xs"
                            onClick={() => setEditingId(a.id)}
                          >
                            ແກ້ໄຂ
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {items.length === 0 && (
                  <p className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
                    ບໍ່ມີ
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">ປະຕິເສດ/ປິດ</h2>
        <div className="flex flex-wrap gap-2">
          {applications
            .filter((a) => a.stage === "rejected")
            .map((a) => (
              <Badge key={a.id} variant="outline">
                {a.worker_profiles?.name}
              </Badge>
            ))}
        </div>
      </div>

      <ApplicationEditDialog
        application={editingApplication}
        open={!!editingApplication}
        onOpenChange={(open) => !open && setEditingId(null)}
      />
    </div>
  );
}
