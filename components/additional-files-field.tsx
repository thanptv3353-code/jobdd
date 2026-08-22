"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UploadedFileInfo } from "@/components/file-upload-field";

export interface PendingFile extends UploadedFileInfo {
  docType: string;
  description?: string;
}

interface Row {
  key: string;
  description: string;
  status: "idle" | "uploading" | "done" | "error";
  fileName: string | null;
}

export function AdditionalFilesField({
  workerId,
  onFileUploaded,
}: {
  workerId: string;
  onFileUploaded: (file: PendingFile) => void;
}) {
  const [rows, setRows] = useState<Row[]>([{ key: crypto.randomUUID(), description: "", status: "idle", fileName: null }]);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((cur) => cur.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function handleFile(row: Row, file: File) {
    updateRow(row.key, { status: "uploading" });
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${workerId}/additional-${Date.now()}-${safeName}`;

      const { error } = await supabase.storage
        .from("worker-uploads")
        .upload(path, file, { contentType: file.type });
      if (error) throw error;

      updateRow(row.key, { status: "done", fileName: file.name });
      onFileUploaded({
        docType: "additional",
        description: row.description || file.name,
        path,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
    } catch {
      updateRow(row.key, { status: "error" });
    }
  }

  function addRow() {
    setRows((cur) => [...cur, { key: crypto.randomUUID(), description: "", status: "idle", fileName: null }]);
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <Input
            value={row.description}
            onChange={(e) => updateRow(row.key, { description: e.target.value })}
            placeholder="ຊື່ເອກະສານ ເຊັ່ນ: ຊີວະປະຫວັດ (CV)"
            className="flex-1"
          />
          <label>
            <Button type="button" size="sm" variant="outline" className="pointer-events-none" asChild>
              <span>{row.status === "done" ? "ປ່ຽນໄຟລ໌" : "ເລືອກໄຟລ໌"}</span>
            </Button>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(row, file);
              }}
            />
          </label>
          {row.status === "uploading" && <span className="text-xs text-muted-foreground">ກຳລັງອັບໂຫຼດ...</span>}
          {row.status === "done" && <span className="text-xs text-emerald-600">✅</span>}
          {row.status === "error" && <span className="text-xs text-red-600">ຜິດພາດ</span>}
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={addRow}>
        + ເພີ່ມເອກະສານອີກ
      </Button>
    </div>
  );
}
