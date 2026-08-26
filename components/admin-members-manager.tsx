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
import { addMember, addMemberAccount, deleteMember, removeMemberAccount, updateMember } from "@/lib/actions";
import type { Country } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type Member = Database["public"]["Tables"]["members"]["Row"];

function isExpired(expiry: string | null) {
  return !!expiry && expiry < new Date().toISOString().slice(0, 10);
}
type Job = Pick<Database["public"]["Tables"]["jobs"]["Row"], "id" | "member_id" | "status">;
type Account = Database["public"]["Tables"]["member_users"]["Row"];

export function AdminMembersManager({
  members,
  jobs,
  accounts,
}: {
  members: Member[];
  jobs: Job[];
  accounts: Account[];
}) {
  const router = useRouter();
  const { label } = useCountries();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [managingAccounts, setManagingAccounts] = useState<Member | null>(null);

  function handleDelete(member: Member) {
    if (!confirm(`ລຶບບໍລິສັດ "${member.name}" ຖາວອນ? (ຕຳແໜ່ງວຽກທີ່ກ່ຽວຂ້ອງຈະຖືກລຶບນຳ)`)) return;
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
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {m.sort_order > 0 && (
                        <span className="text-muted-foreground">{m.sort_order}. </span>
                      )}
                      {m.name}
                    </p>
                    {m.name_en && <p className="text-xs text-muted-foreground">{m.name_en}</p>}
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {m.established_year}
                  </span>
                </div>
                {m.license_no && (
                  <p
                    className={`mt-1 text-xs ${
                      isExpired(m.license_expiry) ? "font-medium text-red-600" : "text-muted-foreground"
                    }`}
                  >
                    ໃບອະນຸຍາດ {m.license_no}
                    {m.license_expiry &&
                      (isExpired(m.license_expiry)
                        ? ` · ໝົດອາຍຸແລ້ວ ${m.license_expiry}`
                        : ` · ໃຊ້ໄດ້ເຖິງ ${m.license_expiry}`)}
                  </p>
                )}
                {m.contact_person && (
                  <p className="mt-0.5 text-xs text-muted-foreground">👤 {m.contact_person}</p>
                )}
                {m.contact_phone && (
                  <p className="mt-0.5 text-xs text-muted-foreground">📞 {m.contact_phone}</p>
                )}
                {m.address && <p className="mt-1 text-xs text-muted-foreground">📍 {m.address}</p>}
                <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.country_focus.map((c) => (
                    <Badge key={c} variant="secondary">
                      {label(c)}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-emerald-700">
                    {count} ຕຳແໜ່ງເປີດຮັບ
                    {accounts.some((a) => a.member_id === m.id) && (
                      <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-800">
                        🔑 {accounts.filter((a) => a.member_id === m.id).length} ບັນຊີ
                      </span>
                    )}
                  </p>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setManagingAccounts(m)}
                    >
                      ບັນຊີເຂົ້າລະບົບ
                    </Button>
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

      <Dialog open={!!managingAccounts} onOpenChange={(open) => !open && setManagingAccounts(null)}>
        <DialogContent>
          {managingAccounts && (
            <AccountsPanel
              member={managingAccounts}
              accounts={accounts.filter((a) => a.member_id === managingAccounts.id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Grant or revoke a company's own login to the member portal. */
function AccountsPanel({ member, accounts }: { member: Member; accounts: Account[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const { error } = await addMemberAccount({ email, memberId: member.id, name });
      if (error) {
        setError(error);
        return;
      }
      setEmail("");
      setName("");
      router.refresh();
    });
  }

  function handleRemove(a: Account) {
    if (!confirm(`ຖອນສິດເຂົ້າລະບົບຂອງ ${a.email}?`)) return;
    startTransition(async () => {
      const { error } = await removeMemberAccount(a.id);
      if (error) alert(error);
      router.refresh();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>ບັນຊີເຂົ້າລະບົບ — {member.name}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">ຍັງບໍ່ມີບັນຊີ</p>
        ) : (
          <ul className="space-y-2">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.email}</p>
                  {a.name && <p className="truncate text-xs text-muted-foreground">{a.name}</p>}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto h-7 text-xs text-red-600 hover:bg-red-50"
                  disabled={isPending}
                  onClick={() => handleRemove(a)}
                >
                  ຖອນສິດ
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">ເພີ່ມບັນຊີ</p>
          <p className="text-xs text-muted-foreground">
            ໃຫ້ບໍລິສັດສະໝັກບັນຊີທີ່ໜ້າ /member/login ກ່ອນ ແລ້ວຈຶ່ງໃສ່ອີເມວນັ້ນຢູ່ນີ້
          </p>
          <div className="space-y-1.5">
            <Label>ອີເມວ</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>ຊື່ຜູ້ໃຊ້ (ບໍ່ບັງຄັບ)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>

      <DialogFooter>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={!email || isPending}
          onClick={handleAdd}
        >
          ເພີ່ມບັນຊີ
        </Button>
      </DialogFooter>
    </>
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
  const [address, setAddress] = useState(member?.address ?? "");
  const [nameEn, setNameEn] = useState(member?.name_en ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [lineId, setLineId] = useState(member?.line_id ?? "");
  const [licenseNo, setLicenseNo] = useState(member?.license_no ?? "");
  const [licenseExpiry, setLicenseExpiry] = useState(member?.license_expiry ?? "");
  const [director, setDirector] = useState(member?.director ?? "");
  const [sortOrder, setSortOrder] = useState(String(member?.sort_order ?? 0));

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
        address,
        nameEn,
        email,
        lineId,
        licenseNo,
        licenseExpiry,
        director,
        sortOrder: Number(sortOrder) || 0,
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
          <Label>ຊື່ບໍລິສັດ (ພາສາລາວ)</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>ຊື່ບໍລິສັດ (ພາສາອັງກິດ)</Label>
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>ໃບອະນຸຍາດເລກທີ</Label>
            <Input value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} placeholder="0000/ຮສສ" />
          </div>
          <div className="space-y-1.5">
            <Label>ໃຊ້ໄດ້ເຖິງ</Label>
            <Input type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>ລຳດັບ</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>ຜູ້ອຳນວຍການ</Label>
          <Input value={director} onChange={(e) => setDirector(e.target.value)} />
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>ອີເມວ</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>ID Line</Label>
            <Input value={lineId} onChange={(e) => setLineId(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>ທີ່ຢູ່</Label>
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="ບ້ານ ..., ເມືອງ ..., ນະຄອນຫຼວງວຽງຈັນ"
            rows={2}
          />
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
