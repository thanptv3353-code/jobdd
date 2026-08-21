"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteApplication, updateApplication } from "@/lib/actions";
import { docLabel } from "@/lib/eligibility";
import { STAGE_LABEL, STAGE_ORDER, type ApplicationStage } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";

type Application = Pick<
  Database["public"]["Tables"]["applications"]["Row"],
  "id" | "stage" | "documents"
>;

export function ApplicationEditDialog({
  application,
  open,
  onOpenChange,
}: {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ແກ້ໄຂໃບສະໝັກ</DialogTitle>
        </DialogHeader>
        {application && (
          <ApplicationEditForm
            key={application.id}
            application={application}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ApplicationEditForm({
  application,
  onDone,
}: {
  application: Application;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [stage, setStage] = useState<ApplicationStage>(application.stage);
  const [documents, setDocuments] = useState<Record<string, boolean>>(application.documents ?? {});

  function handleSave() {
    startTransition(async () => {
      await updateApplication(application.id, { stage, documents });
      router.refresh();
      onDone();
    });
  }

  function handleDelete() {
    if (!confirm("ລຶບໃບສະໝັກນີ້ຖາວອນ?")) return;
    startTransition(async () => {
      await deleteApplication(application.id);
      router.refresh();
      onDone();
    });
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">ຂັ້ນຕອນ</label>
          <Select value={stage} onValueChange={(v) => setStage(v as ApplicationStage)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STAGE_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">ເອກະສານ</label>
          <div className="space-y-1.5">
            {Object.keys(documents).length === 0 && (
              <p className="text-xs text-muted-foreground">ບໍ່ມີຂໍ້ມູນເອກະສານ</p>
            )}
            {Object.entries(documents).map(([docType, has]) => (
              <label key={docType} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>{docLabel(docType)}</span>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={has}
                  onChange={(e) => setDocuments((d) => ({ ...d, [docType]: e.target.checked }))}
                />
              </label>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter className="justify-between sm:justify-between">
        <Button variant="outline" className="text-red-600 hover:bg-red-50" disabled={isPending} onClick={handleDelete}>
          ລຶບໃບສະໝັກ
        </Button>
        <Button onClick={handleSave} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
          ບັນທຶກ
        </Button>
      </DialogFooter>
    </>
  );
}
