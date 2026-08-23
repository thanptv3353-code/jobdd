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
import { useCountries } from "@/components/countries-provider";
import { addJob, deleteJob, updateJob } from "@/lib/actions";
import type { Country } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];

export function AdminJobsManager({ jobs, members }: { jobs: Job[]; members: Member[] }) {
  const router = useRouter();
  const { label } = useCountries();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  function handleDelete(job: Job) {
    if (!confirm(`ລຶບຕຳແໜ່ງງານ "${job.title}" ຖາວອນ?`)) return;
    startTransition(async () => {
      await deleteJob(job.id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ຕຳແໜ່ງງານ</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">+ ເພີ່ມຕຳແໜ່ງງານ</Button>
          </DialogTrigger>
          <DialogContent>
            <JobForm members={members} onDone={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">ຕຳແໜ່ງ</th>
              <th className="px-4 py-2.5 font-medium">ບໍລິສັດ</th>
              <th className="px-4 py-2.5 font-medium">ປະເທດ</th>
              <th className="px-4 py-2.5 font-medium">ຈຳນວນຮັບ</th>
              <th className="px-4 py-2.5 font-medium">ສະຖານະ</th>
              <th className="px-4 py-2.5 font-medium"></th>
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
                    <Badge variant="secondary">{label(j.country)}</Badge>
                  </td>
                  <td className="px-4 py-2.5">{j.quota}</td>
                  <td className="px-4 py-2.5">
                    {j.status === "open" ? (
                      <Badge className="bg-emerald-600 text-white">ເປີດຮັບ</Badge>
                    ) : (
                      <Badge variant="outline">ປິດແລ້ວ</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingJob(j)}>
                        ແກ້ໄຂ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-red-600 hover:bg-red-50"
                        disabled={isPending}
                        onClick={() => handleDelete(j)}
                      >
                        ລຶບ
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent>
          {editingJob && (
            <JobForm members={members} job={editingJob} onDone={() => setEditingJob(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JobForm({ members, job, onDone }: { members: Member[]; job?: Job; onDone: () => void }) {
  const router = useRouter();
  const { countries, label } = useCountries();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(job?.title ?? "");
  const [memberId, setMemberId] = useState(job?.member_id ?? members[0]?.id ?? "");
  const [country, setCountry] = useState<Country>(job?.country ?? countries[0]?.code ?? "");
  const [category, setCategory] = useState(job?.category ?? "");
  const [salaryRange, setSalaryRange] = useState(job?.salary_range ?? "");
  const [quota, setQuota] = useState(String(job?.quota ?? 10));
  const [description, setDescription] = useState(job?.description ?? "");
  const [status, setStatus] = useState<"open" | "closed">(job?.status ?? "open");

  function handleSave() {
    startTransition(async () => {
      const payload = {
        memberId,
        title,
        country,
        category,
        salaryRange,
        description,
        quota: Number(quota) || 1,
        status,
      };
      if (job) {
        await updateJob(job.id, payload);
      } else {
        await addJob(payload);
      }
      router.refresh();
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{job ? "ແກ້ໄຂຕຳແໜ່ງງານ" : "ເພີ່ມຕຳແໜ່ງງານໃໝ່"}</DialogTitle>
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>ປະເທດ</Label>
            <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {label(c.code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {job && (
            <div className="space-y-1.5">
              <Label>ສະຖານະ</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "open" | "closed")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">ເປີດຮັບ</SelectItem>
                  <SelectItem value="closed">ປິດແລ້ວ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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
          onClick={handleSave}
          disabled={!title || !memberId || isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          ບັນທຶກ
        </Button>
      </DialogFooter>
    </>
  );
}
