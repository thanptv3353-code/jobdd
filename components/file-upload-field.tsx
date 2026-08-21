"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordWorkerFile } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export function FileUploadField({
  workerId,
  docType,
  label,
  required,
  note,
  onUploaded,
}: {
  workerId: string;
  docType: string;
  label: string;
  required?: boolean;
  note?: string;
  onUploaded?: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${workerId}/${docType}-${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("worker-uploads")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      await recordWorkerFile({
        workerId,
        docType,
        filePath: path,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });

      setFileName(file.name);
      setStatus("done");
      onUploaded?.();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-md border px-3 py-2.5 text-sm">
      <div className="flex items-center justify-between">
        <span>
          {label} {required && <span className="text-red-500">*</span>}
          {note && <span className="ml-1 text-xs text-muted-foreground">({note})</span>}
        </span>
        <label>
          <Button type="button" size="sm" variant="outline" className="pointer-events-none" asChild>
            <span>{status === "done" ? "ປ່ຽນໄຟລ໌" : "ເລືອກໄຟລ໌"}</span>
          </Button>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFile}
          />
        </label>
      </div>
      {status === "uploading" && <p className="mt-1 text-xs text-muted-foreground">ກຳລັງອັບໂຫຼດ...</p>}
      {status === "done" && <p className="mt-1 truncate text-xs text-emerald-600">✅ {fileName}</p>}
      {status === "error" && <p className="mt-1 text-xs text-red-600">ອັບໂຫຼດບໍ່ສຳເລັດ ລອງໃໝ່</p>}
    </div>
  );
}
