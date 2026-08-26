"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateAge } from "@/lib/eligibility";
import { memberScheduleInterview, memberSetApplicationStage } from "@/lib/actions";
import { STAGE_LABEL, STAGE_ORDER, type ApplicationStage } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type Worker = Database["public"]["Tables"]["worker_profiles"]["Row"];
type Event = Database["public"]["Tables"]["application_events"]["Row"];
type WorkerFile = {
  id: string;
  doc_type: string;
  file_name: string;
  description: string | null;
  uploaded_at: string;
};
type Application = {
  id: string;
  stage: ApplicationStage;
  country: string;
  submitted_at: string;
  interview_at: string | null;
  jobs: { title: string; country: string } | null;
};

const DOC_LABEL: Record<string, string> = {
  photo: "ຮູບຖ່າຍ",
  id_card: "ບັດປະຈຳຕົວ / ສຳມະໂນຄົວ",
};

export function MemberApplicantDetail({
  application,
  worker,
  files,
  fileUrls,
  events,
}: {
  application: Application;
  worker: Worker;
  files: WorkerFile[];
  fileUrls: Record<string, string>;
  events: Event[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [interviewAt, setInterviewAt] = useState(
    application.interview_at ? application.interview_at.slice(0, 16) : ""
  );

  function run(fn: () => Promise<{ error: string | null }>) {
    setError(null);
    startTransition(async () => {
      const { error } = await fn();
      if (error) {
        setError(error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Link href="/member/applicants" className="text-sm text-emerald-700 hover:underline">
        ← ກັບລາຍຊື່ຜູ້ສະໝັກ
      </Link>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">{worker.name}</h1>
              <p className="text-sm text-muted-foreground">
                {worker.gender === "male" ? "ຊາຍ" : "ຍິງ"} · {calculateAge(worker.dob)} ປີ ·{" "}
                {worker.phone}
              </p>
            </div>
            <Badge variant="secondary">{STAGE_LABEL[application.stage]}</Badge>
          </div>

          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Row label="ສະໝັກຕຳແໜ່ງ" value={application.jobs?.title ?? "—"} />
            <Row label="ວັນທີສະໝັກ" value={application.submitted_at} />
            <Row
              label="ທີ່ຢູ່ປັດຈຸບັນ"
              value={[worker.cur_village, worker.cur_district, worker.cur_province]
                .filter(Boolean)
                .join(", ")}
            />
            <Row
              label="ທີ່ຢູ່ຕາມສຳມະໂນຄົວ"
              value={[worker.perm_village, worker.perm_district, worker.perm_province]
                .filter(Boolean)
                .join(", ")}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="font-semibold">ຂັ້ນຕອນ</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {STAGE_ORDER.map((st) => (
              <button
                key={st}
                disabled={isPending || st === application.stage}
                onClick={() => run(() => memberSetApplicationStage(application.id, st))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium disabled:opacity-100",
                  st === application.stage
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "hover:bg-muted"
                )}
              >
                {STAGE_LABEL[st]}
              </button>
            ))}
          </div>

          <div className="mt-5 border-t pt-4">
            <Label>ນັດສຳພາດ</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Input
                type="datetime-local"
                value={interviewAt}
                onChange={(e) => setInterviewAt(e.target.value)}
                className="max-w-56"
              />
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={!interviewAt || isPending}
                onClick={() =>
                  run(() =>
                    memberScheduleInterview(application.id, new Date(interviewAt).toISOString())
                  )
                }
              >
                ບັນທຶກນັດສຳພາດ
              </Button>
            </div>
            {application.interview_at && (
              <p className="mt-2 text-sm text-muted-foreground">
                ນັດປັດຈຸບັນ: {new Date(application.interview_at).toLocaleString("lo-LA")}
              </p>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="font-semibold">ເອກະສານ</h2>
          {files.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">ຍັງບໍ່ມີເອກະສານ</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {files.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{DOC_LABEL[f.doc_type] ?? f.doc_type}</span>
                  <span className="text-muted-foreground">{f.description || f.file_name}</span>
                  {fileUrls[f.id] && (
                    <a
                      href={fileUrls[f.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-emerald-700 hover:underline"
                    >
                      ເປີດເບິ່ງ
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="font-semibold">ປະຫວັດການດຳເນີນການ</h2>
          {events.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">ຍັງບໍ່ມີ</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{e.staff_name}</span>
                  <span className="text-muted-foreground">
                    {STAGE_LABEL[e.action as ApplicationStage] ?? e.action}
                    {e.detail && ` — ${e.detail}`}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("lo-LA")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}
