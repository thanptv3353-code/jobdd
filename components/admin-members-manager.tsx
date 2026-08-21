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
import { addMember } from "@/lib/actions";
import { COUNTRY_LABEL, COUNTRY_LIST, type Country } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Job = Pick<Database["public"]["Tables"]["jobs"]["Row"], "id" | "member_id" | "status">;

export function AdminMembersManager({ members, jobs }: { members: Member[]; jobs: Job[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [countries, setCountries] = useState<Country[]>([]);

  function toggle(c: Country) {
    setCountries((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  }

  function handleCreate() {
    startTransition(async () => {
      await addMember({
        name,
        description,
        establishedYear: Number(year) || new Date().getFullYear(),
        countryFocus: countries,
      });
      setName("");
      setDescription("");
      setCountries([]);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ບໍລິສັດສະມາຊິກ</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">+ ເພີ່ມສະມາຊິກ</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ເພີ່ມບໍລິສັດສະມາຊິກ</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>ຊື່ບໍລິສັດ</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
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
                  {COUNTRY_LIST.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggle(c)}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm",
                        countries.includes(c)
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "hover:bg-muted"
                      )}
                    >
                      {countries.includes(c) ? "☑" : "☐"} {COUNTRY_LABEL[c]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={!name || isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                ບັນທຶກ
              </Button>
            </DialogFooter>
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
                <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.country_focus.map((c) => (
                    <Badge key={c} variant="secondary">
                      {COUNTRY_LABEL[c]}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-sm font-medium text-emerald-700">{count} ຕຳແໜ່ງເປີດຮັບ</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
