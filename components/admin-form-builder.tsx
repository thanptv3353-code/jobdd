"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addFormField, deleteFormField, updateBuiltinFormField, updateFormField } from "@/lib/actions";
import type { Database } from "@/lib/supabase/database.types";

type FormField = Database["public"]["Tables"]["form_fields"]["Row"];
type FieldType = FormField["field_type"];

const TYPE_LABEL: Record<FieldType, string> = {
  text: "ຂໍ້ຄວາມ",
  textarea: "ຂໍ້ຄວາມຍາວ",
  number: "ຕົວເລກ",
  date: "ວັນທີ",
  select: "ຕົວເລືອກດຽວ (dropdown)",
  multiselect: "ຫຼາຍຕົວເລືອກ (ຕິກໄດ້ຫຼາຍອັນ)",
  checkbox: "ຊ່ອງຕິກ (ແມ່ນ/ບໍ່)",
};

export function AdminFormBuilder({ fields }: { fields: FormField[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  function handleDelete(field: FormField) {
    if (!confirm(`ລຶບຊ່ອງ "${field.label}" ຖາວອນ?`)) return;
    startTransition(async () => {
      await deleteFormField(field.id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ອອກແບບຟອມລົງທະບຽນ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ຄວບຄຸມທຸກຊ່ອງໃນໜ້າ /register — ທັງຊ່ອງພື້ນຖານ (ປ້າຍ &quot;ພື້ນຖານ&quot;) ແລະ ຊ່ອງທີ່ທ່ານເພີ່ມເອງ
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">+ ເພີ່ມຊ່ອງຂໍ້ມູນ</Button>
          </DialogTrigger>
          <DialogContent>
            <FieldForm nextOrder={fields.length} onDone={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">ລຳດັບ</th>
              <th className="px-4 py-2.5 font-medium">ປ້າຍຊື່</th>
              <th className="px-4 py-2.5 font-medium">field_key</th>
              <th className="px-4 py-2.5 font-medium">ປະເພດ</th>
              <th className="px-4 py-2.5 font-medium">ບັງຄັບ</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="px-4 py-2.5 text-muted-foreground">{f.sort_order}</td>
                <td className="px-4 py-2.5 font-medium">{f.label}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{f.field_key}</td>
                <td className="px-4 py-2.5">
                  {f.is_builtin ? (
                    <Badge className="bg-sky-100 text-sky-800 border-sky-200">ພື້ນຖານ</Badge>
                  ) : (
                    <Badge variant="secondary">{TYPE_LABEL[f.field_type]}</Badge>
                  )}
                </td>
                <td className="px-4 py-2.5">{f.required ? "✅" : "–"}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingField(f)}>
                      ແກ້ໄຂ
                    </Button>
                    {!f.is_builtin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-red-600 hover:bg-red-50"
                        disabled={isPending}
                        onClick={() => handleDelete(f)}
                      >
                        ລຶບ
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {fields.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  ຍັງບໍ່ມີຊ່ອງຂໍ້ມູນເພີ່ມເຕີມ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
        <DialogContent>
          {editingField &&
            (editingField.is_builtin ? (
              <BuiltinFieldForm field={editingField} onDone={() => setEditingField(null)} />
            ) : (
              <FieldForm field={editingField} nextOrder={0} onDone={() => setEditingField(null)} />
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BuiltinFieldForm({ field, onDone }: { field: FormField; onDone: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState(field.label);
  const [required, setRequired] = useState(field.required);
  const [sortOrder, setSortOrder] = useState(String(field.sort_order));

  function handleSave() {
    startTransition(async () => {
      await updateBuiltinFormField(field.id, {
        label,
        required,
        sortOrder: Number(sortOrder) || 0,
      });
      router.refresh();
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>ແກ້ໄຂຊ່ອງພື້ນຖານ</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          ນີ້ແມ່ນຊ່ອງພື້ນຖານຂອງລະບົບ — ແກ້ໄຂໄດ້ສະເພາະປ້າຍຊື່, ບັງຄັບ, ແລະ ລຳດັບ (ບໍ່ສາມາດລຶບ ຫຼື ປ່ຽນປະເພດໄດ້)
        </p>
        <div className="space-y-1.5">
          <Label>ປ້າຍຊື່</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>ລຳດັບ</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              ບັງຄັບຕື່ມ
            </label>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={!label || isPending} className="bg-emerald-600 hover:bg-emerald-700">
          ບັນທຶກ
        </Button>
      </DialogFooter>
    </>
  );
}

function FieldForm({
  field,
  nextOrder,
  onDone,
}: {
  field?: FormField;
  nextOrder: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState(field?.label ?? "");
  const [fieldKey, setFieldKey] = useState(field?.field_key ?? "");
  const [fieldType, setFieldType] = useState<FieldType>(field?.field_type ?? "text");
  const [options, setOptions] = useState(field?.options.join(", ") ?? "");
  const [required, setRequired] = useState(field?.required ?? false);
  const [sortOrder, setSortOrder] = useState(String(field?.sort_order ?? nextOrder));

  function handleLabelChange(v: string) {
    setLabel(v);
    if (!field) {
      setFieldKey(
        v
          .toLowerCase()
          .replace(/[^a-z0-9ກ-ໝ\s]/g, "")
          .trim()
          .replace(/\s+/g, "_")
      );
    }
  }

  function handleSave() {
    startTransition(async () => {
      const payload = {
        fieldKey,
        label,
        fieldType,
        options:
          fieldType === "select" || fieldType === "multiselect"
            ? options.split(",").map((o) => o.trim()).filter(Boolean)
            : [],
        required,
        sortOrder: Number(sortOrder) || 0,
      };
      if (field) {
        await updateFormField(field.id, payload);
      } else {
        await addFormField(payload);
      }
      router.refresh();
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{field ? "ແກ້ໄຂຊ່ອງຂໍ້ມູນ" : "ເພີ່ມຊ່ອງຂໍ້ມູນ"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>ປ້າຍຊື່ (ສິ່ງທີ່ຜູ້ຫາງານເຫັນ)</Label>
          <Input value={label} onChange={(e) => handleLabelChange(e.target.value)} placeholder="ເຊັ່ນ: ລະດັບການສຶກສາ" />
        </div>
        <div className="space-y-1.5">
          <Label>field_key (ລະຫັດພາຍໃນ, ບໍ່ຊ້ຳກັນ)</Label>
          <Input value={fieldKey} onChange={(e) => setFieldKey(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>ປະເພດຊ່ອງຂໍ້ມູນ</Label>
          <Select value={fieldType} onValueChange={(v) => setFieldType(v as FieldType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TYPE_LABEL) as FieldType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(fieldType === "select" || fieldType === "multiselect") && (
          <div className="space-y-1.5">
            <Label>ລາຍການເລືອກ (ຄັ່ນດ້ວຍ ,)</Label>
            <Input value={options} onChange={(e) => setOptions(e.target.value)} placeholder="ມ.6, ປວສ, ປະລິນຍາຕີ" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>ລຳດັບ</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              ບັງຄັບຕື່ມ
            </label>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={!label || !fieldKey || isPending} className="bg-emerald-600 hover:bg-emerald-700">
          ບັນທຶກ
        </Button>
      </DialogFooter>
    </>
  );
}
