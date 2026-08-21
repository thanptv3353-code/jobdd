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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addJob } from "@/lib/actions";
import { COUNTRY_LABEL, COUNTRY_LIST, type Country } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];

export function AdminJobsManager({ jobs, members }: { jobs: Job[]; members: Member[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [country, setCountry] = useState<Country>("domestic");
  const [category, setCategory] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [quota, setQuota] = useState("10");
  const [description, setDescription] = useState("");

  function handleCreate() {
    startTransition(async () => {
      await addJob({
        memberId,
        title,
        country,
        category,
        salaryRange,
        description,
        quota: Number(quota) || 1,
      });
      setTitle("");
      setCategory("");
      setSalaryRange("");
      setDescription("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ຕຳແໜ່ງງານ</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">+ ເພີ່ມຕຳແໜ່ງງານ</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ເພີ່ມຕຳແໜ່ງງານໃໝ່</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>ຊື່ຕຳແໜ່ງ</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>ບໍລິສັດສະມາຊິກ</Label>
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>ປະເທດ</Label>
                <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_LIST.map((c) => (
                      <SelectItem key={c} value={c}>
                        {COUNTRY_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>ໝວດໝູ່</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>ຈຳນວນຮັບ</Label>
                  <Input type="number" value={quota} onChange={(e) => setQuota(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>ຊ່ວງເງິນເດືອນ</Label>
                <Input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>ລາຍລະອຽດ</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={!title || !memberId || isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                ບັນທຶກ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">ຕຳແໜ່ງ</th>
              <th className="px-4 py-2.5 font-medium">ບໍລິສັດ</th>
              <th className="px-4 py-2.5 font-medium">ປະເທດ</th>
              <th className="px-4 py-2.5 font-medium">ຈຳນວນຮັບ</th>
              <th className="px-4 py-2.5 font-medium">ສະຖານະ</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const member = members.find((m) => m.id === j.member_id);
              return (
                <tr key={j.id} className="border-t">
                  <td className="px-4 py-2.5 font-medium">{j.title}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{member?.name}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary">{COUNTRY_LABEL[j.country]}</Badge>
                  </td>
                  <td className="px-4 py-2.5">{j.quota}</td>
                  <td className="px-4 py-2.5">
                    {j.status === "open" ? (
                      <Badge className="bg-emerald-600 text-white">ເປີດຮັບ</Badge>
                    ) : (
                      <Badge variant="outline">ປິດແລ້ວ</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
