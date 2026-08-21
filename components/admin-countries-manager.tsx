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
  addCountry,
  addCountryRequirement,
  deleteCountry,
  deleteCountryRequirement,
  updateCountry,
  updateCountryRequirement,
} from "@/lib/actions";
import { docLabel, DOC_TYPES } from "@/lib/eligibility";
import type { Database } from "@/lib/supabase/database.types";

type CountryRow = Database["public"]["Tables"]["countries"]["Row"];
type Requirement = Database["public"]["Tables"]["country_requirements"]["Row"];

export function AdminCountriesManager({
  countries,
  requirements,
}: {
  countries: CountryRow[];
  requirements: Requirement[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryRow | null>(null);
  const [managingDocs, setManagingDocs] = useState<CountryRow | null>(null);

  function handleDelete(country: CountryRow) {
    if (!confirm(`ລຶບປະເທດ "${country.label}" ຖາວອນ? (ຕຳແໜ່ງງານ/ໃບສະໝັກທີ່ໃຊ້ປະເທດນີ້ອາດຖືກກະທົບ)`))
      return;
    startTransition(async () => {
      await deleteCountry(country.code);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ປະເທດປາຍທາງ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ຈັດການລາຍຊື່ປະເທດ, ຊ່ວງອາຍຸ, ແລະ ເອກະສານທີ່ຕ້ອງການແຕ່ລະປະເທດ
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">+ ເພີ່ມປະເທດ</Button>
          </DialogTrigger>
          <DialogContent>
            <CountryForm nextOrder={countries.length + 1} onDone={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">ລຳດັບ</th>
              <th className="px-4 py-2.5 font-medium">ລະຫັດ</th>
              <th className="px-4 py-2.5 font-medium">ຊື່ປະເທດ</th>
              <th className="px-4 py-2.5 font-medium">ຊ່ວງອາຍຸ</th>
              <th className="px-4 py-2.5 font-medium">ເອກະສານ</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c) => {
              const reqCount = requirements.filter((r) => r.country === c.code).length;
              return (
                <tr key={c.code} className="border-t">
                  <td className="px-4 py-2.5 text-muted-foreground">{c.sort_order}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.code}</td>
                  <td className="px-4 py-2.5 font-medium">{c.label}</td>
                  <td className="px-4 py-2.5">{c.min_age}–{c.max_age} ປີ</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary">{reqCount} ລາຍການ</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setManagingDocs(c)}>
                        ຈັດການເອກະສານ
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingCountry(c)}>
                        ແກ້ໄຂ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-red-600 hover:bg-red-50"
                        disabled={isPending}
                        onClick={() => handleDelete(c)}
                      >
                        ລຶບ
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {countries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  ຍັງບໍ່ມີປະເທດ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editingCountry} onOpenChange={(open) => !open && setEditingCountry(null)}>
        <DialogContent>
          {editingCountry && (
            <CountryForm country={editingCountry} nextOrder={0} onDone={() => setEditingCountry(null)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!managingDocs} onOpenChange={(open) => !open && setManagingDocs(null)}>
        <DialogContent className="max-w-lg">
          {managingDocs && (
            <RequirementsManager
              country={managingDocs}
              requirements={requirements.filter((r) => r.country === managingDocs.code)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CountryForm({
  country,
  nextOrder,
  onDone,
}: {
  country?: CountryRow;
  nextOrder: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState(country?.code ?? "");
  const [label, setLabel] = useState(country?.label ?? "");
  const [minAge, setMinAge] = useState(String(country?.min_age ?? 18));
  const [maxAge, setMaxAge] = useState(String(country?.max_age ?? 60));
  const [sortOrder, setSortOrder] = useState(String(country?.sort_order ?? nextOrder));

  function handleSave() {
    startTransition(async () => {
      const payload = {
        code,
        label,
        minAge: Number(minAge) || 18,
        maxAge: Number(maxAge) || 60,
        sortOrder: Number(sortOrder) || 0,
      };
      if (country) {
        await updateCountry(country.code, payload);
      } else {
        await addCountry(payload);
      }
      router.refresh();
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{country ? "ແກ້ໄຂປະເທດ" : "ເພີ່ມປະເທດໃໝ່"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>ລະຫັດ (code, ພາສາອັງກິດ, ບໍ່ຊ້ຳກັນ)</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="malaysia"
            disabled={!!country}
          />
        </div>
        <div className="space-y-1.5">
          <Label>ຊື່ປະເທດ (ສະແດງໃຫ້ຜູ້ໃຊ້ເຫັນ)</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ມາເລເຊຍ" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>ອາຍຸຕ່ຳສຸດ</Label>
            <Input type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>ອາຍຸສູງສຸດ</Label>
            <Input type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>ລຳດັບ</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={!code || !label || isPending} className="bg-emerald-600 hover:bg-emerald-700">
          ບັນທຶກ
        </Button>
      </DialogFooter>
    </>
  );
}

function RequirementsManager({
  country,
  requirements,
}: {
  country: CountryRow;
  requirements: Requirement[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [docType, setDocType] = useState("");
  const [required, setRequired] = useState(true);
  const [note, setNote] = useState("");

  function handleAdd() {
    if (!docType) return;
    startTransition(async () => {
      await addCountryRequirement({ country: country.code, docType, required, note });
      setDocType("");
      setNote("");
      router.refresh();
    });
  }

  function handleToggleRequired(r: Requirement) {
    startTransition(async () => {
      await updateCountryRequirement(r.id, {
        country: r.country,
        docType: r.doc_type,
        required: !r.required,
        note: r.note ?? undefined,
      });
      router.refresh();
    });
  }

  function handleDelete(r: Requirement) {
    startTransition(async () => {
      await deleteCountryRequirement(r.id);
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>ເອກະສານສຳລັບ {country.label}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        {requirements.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <div>
              <p className="font-medium">{docLabel(r.doc_type)}</p>
              {r.note && <p className="text-xs text-muted-foreground">{r.note}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleRequired(r)}
                className="text-xs text-muted-foreground hover:underline"
              >
                {r.required ? "ບັງຄັບ" : "ບໍ່ບັງຄັບ"}
              </button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-red-600 hover:bg-red-50"
                disabled={isPending}
                onClick={() => handleDelete(r)}
              >
                ລຶບ
              </Button>
            </div>
          </div>
        ))}
        {requirements.length === 0 && (
          <p className="text-sm text-muted-foreground">ຍັງບໍ່ມີເອກະສານກຳນົດໄວ້</p>
        )}

        <div className="flex items-end gap-2 border-t pt-3">
          <div className="flex-1 space-y-1.5">
            <Label>ເພີ່ມເອກະສານ</Label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">ເລືອກເອກະສານ...</option>
              {Object.keys(DOC_TYPES).map((dt) => (
                <option key={dt} value={dt}>
                  {docLabel(dt)}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-1.5 pb-2 text-xs">
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            ບັງຄັບ
          </label>
          <Button size="sm" disabled={!docType || isPending} onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700">
            ເພີ່ມ
          </Button>
        </div>
      </div>
    </>
  );
}
