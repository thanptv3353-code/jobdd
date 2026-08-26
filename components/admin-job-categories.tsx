"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addJobCategory,
  addJobCategoryItem,
  deleteJobCategory,
  deleteJobCategoryItem,
  swapJobCategoryOrder,
  updateCountryContext,
  updateJobCategory,
  updateJobCategoryItem,
} from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type Country = Database["public"]["Tables"]["countries"]["Row"];
type Category = Database["public"]["Tables"]["job_categories"]["Row"];
type Item = Database["public"]["Tables"]["job_category_items"]["Row"];

export function AdminJobCategories({
  countries,
  categories,
  items,
}: {
  countries: Country[];
  categories: Category[];
  items: Item[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState(countries[0]?.code ?? "");
  const [editingContext, setEditingContext] = useState(false);

  const country = countries.find((c) => c.code === active);
  const cats = categories.filter((c) => c.country === active);
  const itemsFor = (categoryId: string) => items.filter((i) => i.category_id === categoryId);
  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  if (!country) return <p className="text-muted-foreground">ຍັງບໍ່ມີປະເທດປາຍທາງ</p>;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">ປະເພດວຽກ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ອາຊີບທີ່ຄົນລາວມີສິດເຮັດໄດ້ຕາມກົດໝາຍ ຕ່າງກັນຕາມແຕ່ລະປະເທດ
        </p>
      </div>

      {/* country tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {countries.map((c) => {
          const n = categories
            .filter((x) => x.country === c.code)
            .reduce((a, x) => a + itemsFor(x.id).length, 0);
          const on = c.code === active;
          return (
            <button
              key={c.code}
              onClick={() => setActive(c.code)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                on ? "border-transparent text-white" : "hover:bg-muted"
              )}
              style={on ? { backgroundColor: c.accent_color } : { color: c.accent_color }}
            >
              {c.label}
              <span className="text-xs opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      {/* corridor context */}
      <div
        className="mt-4 rounded-lg border bg-white p-4"
        style={{ borderLeft: `5px solid ${country.accent_color}` }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">{country.label}</h2>
          {country.route && (
            <span
              className="rounded border px-2 py-0.5 text-xs font-bold"
              style={{ borderColor: country.accent_color, color: country.accent_color }}
            >
              {country.route}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="ml-auto h-7 text-xs"
            onClick={() => setEditingContext(true)}
          >
            ແກ້ໄຂ
          </Button>
        </div>
        {country.note && <p className="mt-2 text-sm text-muted-foreground">{country.note}</p>}
      </div>

      {/* categories */}
      <div className="mt-4 space-y-3">
        {cats.map((ct, k) => (
          <div
            key={ct.id}
            className={cn("rounded-lg border bg-white", !ct.is_open && "bg-muted/40")}
          >
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
              <span
                className="grid size-6 shrink-0 place-items-center rounded text-xs font-bold text-white"
                style={{ backgroundColor: country.accent_color }}
              >
                {k + 1}
              </span>
              <EditableText
                value={ct.name}
                className="min-w-32 flex-1 font-bold"
                onSave={(name) => run(() => updateJobCategory(ct.id, { name }))}
              />
              <EditableText
                value={ct.code || "—"}
                className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                onSave={(code) => run(() => updateJobCategory(ct.id, { code: code === "—" ? "" : code }))}
              />
              <button
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  ct.is_open ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                )}
                disabled={isPending}
                onClick={() => run(() => updateJobCategory(ct.id, { isOpen: !ct.is_open }))}
              >
                {ct.is_open ? "● ເປີດຮັບ" : "○ ປິດຮັບ"}
              </button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                disabled={isPending || k === 0}
                onClick={() =>
                  run(() =>
                    swapJobCategoryOrder(
                      { id: ct.id, sortOrder: ct.sort_order },
                      { id: cats[k - 1].id, sortOrder: cats[k - 1].sort_order }
                    )
                  )
                }
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                disabled={isPending || k === cats.length - 1}
                onClick={() =>
                  run(() =>
                    swapJobCategoryOrder(
                      { id: ct.id, sortOrder: ct.sort_order },
                      { id: cats[k + 1].id, sortOrder: cats[k + 1].sort_order }
                    )
                  )
                }
              >
                ↓
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-red-600 hover:bg-red-50"
                disabled={isPending}
                onClick={() => {
                  if (!confirm(`ລຶບໝວດ "${ct.name}" ພ້ອມວຽກຍ່ອຍທັງໝົດ?`)) return;
                  run(() => deleteJobCategory(ct.id));
                }}
              >
                ລຶບ
              </Button>
            </div>

            <div className={cn("flex flex-wrap gap-1.5 p-3", !ct.is_open && "opacity-50")}>
              {itemsFor(ct.id).map((j) => (
                <span
                  key={j.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-1.5 text-sm",
                    j.needs_review ? "border-amber-300 bg-amber-50 text-amber-800" : "bg-muted"
                  )}
                >
                  <EditableText
                    value={j.name}
                    onSave={(name) => run(() => updateJobCategoryItem(j.id, { name }))}
                  />
                  <button
                    title="ໝາຍວ່າຕ້ອງກວດເງື່ອນໄຂ"
                    className="px-1 text-muted-foreground hover:text-amber-700"
                    disabled={isPending}
                    onClick={() => run(() => updateJobCategoryItem(j.id, { needsReview: !j.needs_review }))}
                  >
                    ⚑
                  </button>
                  <button
                    title="ລຶບ"
                    className="px-1 text-muted-foreground hover:text-red-600"
                    disabled={isPending}
                    onClick={() => run(() => deleteJobCategoryItem(j.id))}
                  >
                    ×
                  </button>
                </span>
              ))}
              <AddInline
                label="+ ວຽກຍ່ອຍ"
                placeholder="ຊື່ວຽກຍ່ອຍ"
                onAdd={(name) => run(() => addJobCategoryItem(ct.id, name))}
              />
            </div>
          </div>
        ))}

        <AddInline
          label="+ ເພີ່ມໝວດວຽກໃຫຍ່"
          placeholder="ຊື່ໝວດວຽກ"
          block
          onAdd={(name) => run(() => addJobCategory(active, name))}
        />
      </div>

      <CountryContextDialog
        country={country}
        open={editingContext}
        onClose={() => setEditingContext(false)}
        onSave={(v) => run(() => updateCountryContext(country.code, v))}
      />
    </div>
  );
}

/** Click-to-edit text: saves on blur or Enter, reverts on Escape. */
function EditableText({
  value,
  className,
  onSave,
}: {
  value: string;
  className?: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <span
        className={cn("cursor-text rounded hover:bg-muted", className)}
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        {value}
      </span>
    );
  }

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== value) onSave(next);
  };

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className={cn("min-w-24 rounded border px-1 outline-emerald-600", className)}
    />
  );
}

function AddInline({
  label,
  placeholder,
  block,
  onAdd,
}: {
  label: string;
  placeholder: string;
  block?: boolean;
  onAdd: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => {
          setDraft("");
          setOpen(true);
        }}
        className={cn(
          "rounded-full border border-dashed px-3 py-1 text-sm text-muted-foreground hover:border-emerald-600 hover:text-emerald-700",
          block && "w-full rounded-lg py-3 font-semibold"
        )}
      >
        {label}
      </button>
    );
  }

  const commit = () => {
    setOpen(false);
    if (draft.trim()) onAdd(draft.trim());
  };

  return (
    <input
      autoFocus
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setOpen(false);
      }}
      className={cn(
        "rounded-full border px-3 py-1 text-sm outline-emerald-600",
        block && "w-full rounded-lg py-2.5"
      )}
    />
  );
}

function CountryContextDialog({
  country,
  open,
  onClose,
  onSave,
}: {
  country: Country;
  open: boolean;
  onClose: () => void;
  onSave: (v: { route: string; note: string; accentColor: string }) => void;
}) {
  const [route, setRoute] = useState(country.route ?? "");
  const [note, setNote] = useState(country.note ?? "");
  const [accentColor, setAccentColor] = useState(country.accent_color);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) {
          setRoute(country.route ?? "");
          setNote(country.note ?? "");
          setAccentColor(country.accent_color);
        } else {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ເສັ້ນທາງ — {country.label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>ຊື່ເສັ້ນທາງ</Label>
            <Input
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="ເຊັ່ນ MOU, SSW ທັກສະສະເພາະ"
            />
          </div>
          <div className="space-y-1.5">
            <Label>ໝາຍເຫດ / ເງື່ອນໄຂທາງກົດໝາຍ</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={6} />
          </div>
          <div className="space-y-1.5">
            <Label>ສີປະຈຳປະເທດ</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-9 w-14 rounded border"
              />
              <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              onSave({ route, note, accentColor });
              onClose();
            }}
          >
            ບັນທຶກ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
