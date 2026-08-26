"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { addMemberJob, deleteMemberJob, updateMemberJob } from "@/lib/actions";
import type { Database } from "@/lib/supabase/database.types";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type Country = Database["public"]["Tables"]["countries"]["Row"];
type Category = Database["public"]["Tables"]["job_categories"]["Row"];

export function MemberJobsManager({
  jobs,
  countries,
  categories,
  applicantCounts,
}: {
  jobs: Job[];
  countries: Country[];
  categories: Category[];
  applicantCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);

  const label = (code: string) => countries.find((c) => c.code === code)?.label ?? code;

  function handleDelete(job: Job) {
    const n = applicantCounts[job.id] ?? 0;
    const warning = n > 0 ? `\n\n⚠️ ມີຜູ້ສະໝັກ ${n} ຄົນ — ໃບສະໝັກຈະຖືກລຶບນຳ` : "";
    if (!confirm(`ລຶບປະກາດ "${job.title}" ຖາວອນ?${warning}`)) return;
    startTransition(async () => {
      const { error } = await deleteMemberJob(job.id);
      if (error) alert(error);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">ປະກາດຮັບສະໝັກ</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">+ ລົງປະກາດໃໝ່</Button>
          </DialogTrigger>
          <DialogContent>
            <JobForm
              countries={countries}
              categories={categories}
              onDone={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {jobs.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          ຍັງບໍ່ມີປະກາດ — ກົດ &ldquo;ລົງປະກາດໃໝ່&rdquo; ເພື່ອເລີ່ມ
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">ຕຳແໜ່ງ</th>
                <th className="px-4 py-2.5 font-medium">ປະເທດ</th>
                <th className="px-4 py-2.5 font-medium">ຮັບ</th>
                <th className="px-4 py-2.5 font-medium">ຜູ້ສະໝັກ</th>
                <th className="px-4 py-2.5 font-medium">ສະຖານະ</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t">
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{j.title}</p>
                    {j.category && (
                      <p className="text-xs text-muted-foreground">{j.category}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary">{label(j.country)}</Badge>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{j.quota}</td>
                  <td className="px-4 py-2.5 tabular-nums">{applicantCounts[j.id] ?? 0}</td>
                  <td className="px-4 py-2.5">
                    {j.status === "open" ? (
                      <Badge className="bg-emerald-600 text-white">ເປີດຮັບ</Badge>
                    ) : (
                      <Badge variant="outline">ປິດແລ້ວ</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setEditing(j)}
                      >
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing && (
            <JobForm
              job={editing}
              countries={countries}
              categories={categories}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JobForm({
  job,
  countries,
  categories,
  onDone,
}: {
  job?: Job;
  countries: Country[];
  categories: Category[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(job?.title ?? "");
  const [country, setCountry] = useState(job?.country ?? countries[0]?.code ?? "");
  const [category, setCategory] = useState(job?.category ?? "");
  const [salaryRange, setSalaryRange] = useState(job?.salary_range ?? "");
  const [quota, setQuota] = useState(String(job?.quota ?? 10));
  const [description, setDescription] = useState(job?.description ?? "");
  const [status, setStatus] = useState<"open" | "closed">(job?.status ?? "open");

  // Only the categories the association has marked open for this destination.
  const catsForCountry = categories.filter((c) => c.country === country);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const payload = {
        title,
        country,
        category,
        salaryRange,
        description,
        quota: Number(quota) || 1,
        status,
      };
      const { error } = job ? await updateMemberJob(job.id, payload) : await addMemberJob(payload);
      if (error) {
        setError(error);
        return;
      }
      router.refresh();
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{job ? "ແກ້ໄຂປະກາດ" : "ລົງປະກາດຮັບສະໝັກໃໝ່"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>ຊື່ຕຳແໜ່ງ</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>ປະເທດ</Label>
            <Select
              value={country}
              onValueChange={(v) => {
                setCountry(v);
                setCategory("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        </div>
        <div className="space-y-1.5">
          <Label>ໝວດວຽກ</Label>
          {catsForCountry.length > 0 ? (
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="ເລືອກໝວດວຽກ" />
              </SelectTrigger>
              <SelectContent>
                {catsForCountry.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                    {c.code && ` (${c.code})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          )}
          <p className="text-xs text-muted-foreground">
            ສະເພາະໝວດທີ່ສະມາຄົມເປີດໃຫ້ສຳລັບປະເທດນີ້
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>ຈຳນວນຮັບ</Label>
            <Input type="number" value={quota} onChange={(e) => setQuota(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>ຊ່ວງເງິນເດືອນ</Label>
            <Input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>ລາຍລະອຽດ</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <DialogFooter>
        <Button
          onClick={handleSave}
          disabled={!title || !country || isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          ບັນທຶກ
        </Button>
      </DialogFooter>
    </>
  );
}
