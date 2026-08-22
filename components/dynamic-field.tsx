"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/supabase/database.types";

type FormField = Database["public"]["Tables"]["form_fields"]["Row"];
export type CustomFieldValue = string | number | boolean | string[];

export function DynamicField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: CustomFieldValue | undefined;
  onChange: (value: CustomFieldValue) => void;
}) {
  const label = (
    <Label>
      {field.label} {field.required && <span className="text-red-500">*</span>}
    </Label>
  );

  if (field.field_type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];
    function toggle(opt: string) {
      onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt]);
    }
    return (
      <div className="space-y-1.5">
        {label}
        <div className="grid grid-cols-2 gap-2">
          {field.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
              {opt}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.field_type === "checkbox") {
    return (
      <label className="flex items-center justify-between rounded-md border px-3 py-2.5 text-sm">
        <span>
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </span>
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
    );
  }

  if (field.field_type === "select") {
    return (
      <div className="space-y-1.5">
        {label}
        <Select value={(value as string) ?? ""} onValueChange={(v) => onChange(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="ເລືອກ..." />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.field_type === "textarea") {
    return (
      <div className="space-y-1.5">
        {label}
        <Textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {label}
      <Input
        type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(field.field_type === "number" ? Number(e.target.value) : e.target.value)}
      />
    </div>
  );
}
