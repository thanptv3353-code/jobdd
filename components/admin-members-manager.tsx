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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCountries } from "@/components/countries-provider";
import { addMember, deleteMember, updateMember } from "@/lib/actions";
import type { Country } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Job = Pick<Database["public"]["Tables"]["jobs"]["Row"], "id" | "member_id" | "status">;

export function AdminMembersManager({ members, jobs }: { members: Member[]; jobs: Job[] }) {
  const router = useRouter();
  const { label } = useCountries();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  function handleDelete(member: Member) {
    if (!confirm(`ລຶບບໍລິສັດ "${member.name}" ຖາວອນ? (ຕຳແໜ່ງງານທີ່ກ່ຽວຂ້ອງຈະຖືກລຶບນຳ)`)) return;
    startTransition(async () => {
      await deleteMember(member.id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ບໍລິສັດສະມາຊິກ</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">+ ເພີ່ມສະມາຊິກ</Button>
          </DialogTrigger>
          <DialogContent>
            <MemberForm onDone={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {members.map((m) => {
          const count = jobs.filter((j) => j.member_id === m.id && j.status === "open").length;
          return (
            <Card key={m.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <p className="font-semibold">{m.name}</p>
                  <span className="text-xs text-muted-foreground">{m.established_year}</span>
                </div>
                {(m.contact_person || m.contact_phone) && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {m.contact_person}
                    {m.contact_person && m.contact_phone && " · "}
                    {m.contact_phone}
                  </p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.country_focus.map((c) => (
                    <Badge key={c} variant="secondary">
                      {label(c)}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-emerald-700">{count} ຕຳແໜ່ງເປີດຮັບ</p>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingMember(m)}>
                      ແກ້ໄຂ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-red-600 hover:bg-red-50"
                      disabled={isPending}
                      onClick={() => handleDelete(m)}
                    >
                      ລຶບ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          {editingMember && (
            <MemberForm member={editingMember} onDone={() => setEditingMember(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MemberForm({ member, onDone }: { member?: Member; onDone: () => void }) {
  const router = useRouter();
  const { countries, label } = useCountries();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(member?.name ?? "");
  const [description, setDescription] = useState(member?.description ?? "");
  const [year, setYear] = useState(String(member?.established_year ?? new Date().getFullYear()));
  const [selectedCountries, setSelectedCountries] = useState<Country[]>(member?.country_focus ?? []);
  const [contactPerson, setContactPerson] = useState(member?.contact_person ?? "");
  const [contactPhone, setContactPhone] = useState(member?.contact_phone ?? "");

  function toggle(c: Country) {
    setSelectedCountries((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  }

  function handleSave() {
    startTransition(async () => {
      const payload = {
        name,
        description,
        establishedYear: Number(year) || new Date().getFullYear(),
        countryFocus: selectedCountries,
        contactPerson,
        contactPhone,
      };
      if (member) {
        await updateMember(member.id, payload);
      } else {
        await addMember(payload);
      }
      router.refresh();
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{member ? "ແກ້ໄຂບໍລິສັດສະມາຊິກ" : "ເພີ່ມບໍລິສັດສະມາຊິກ"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>ຊື່ບໍລິສັດ</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>ຜູ້ປະສານງານ</Label>
            <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>ເບີໂທຜູ້ປະສານງານ</Label>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>ລາຍລະອຽດ</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>ປີສ້າງຕັ້ງ</Label>
          <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>ຊ່ຽວຊານປະເທດ</Label>
          <div className="grid grid-cols-2 gap-2">
            {countries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => toggle(c.code)}
                className={cn(
                  "rounded-md border px-3 py-2 text-sm",
                  selectedCountries.includes(c.code)
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "hover:bg-muted"
                )}
              >
                {selectedCountries.includes(c.code) ? "☑" : "☐"} {label(c.code)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={!name || isPending} className="bg-emerald-600 hover:bg-emerald-700">
          ບັນທຶກ
        </Button>
      </DialogFooter>
    </>
  );
}
