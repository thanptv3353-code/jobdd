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
import { addStaffMember, removeStaffMember } from "@/lib/actions";
import type { Database } from "@/lib/supabase/database.types";

type Staff = Database["public"]["Tables"]["staff"]["Row"];

const ROLE_LABEL: Record<Staff["role"], string> = {
  super_admin: "Super Admin",
  staff: "ພະນັກງານ",
};

export function AdminStaffManager({ staff, currentStaffId }: { staff: Staff[]; currentStaffId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);

  function handleRemove(member: Staff) {
    if (!confirm(`ລຶບສິດເຂົ້າໃຊ້ admin ຂອງ "${member.name || member.email}" ຖາວອນ?`)) return;
    startTransition(async () => {
      const { error } = await removeStaffMember(member.id);
      if (error) {
        alert(error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ພະນັກງານ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ຈັດການບັນຊີ admin — ໃຜເປັນ super admin ຫຼື ພະນັກງານທົ່ວໄປ
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">+ ເພີ່ມພະນັກງານ</Button>
          </DialogTrigger>
          <DialogContent>
            <AddStaffForm onDone={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">ຊື່</th>
              <th className="px-4 py-2.5 font-medium">ອີເມວ</th>
              <th className="px-4 py-2.5 font-medium">ສິດ</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-2.5 font-medium">
                  {s.name || "—"} {s.id === currentStaffId && <span className="text-xs text-muted-foreground">(ທ່ານ)</span>}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{s.email || "—"}</td>
                <td className="px-4 py-2.5">
                  <Badge variant={s.role === "super_admin" ? "default" : "secondary"}>
                    {ROLE_LABEL[s.role]}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {s.id !== currentStaffId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-red-600 hover:bg-red-50"
                      disabled={isPending}
                      onClick={() => handleRemove(s)}
                    >
                      ລຶບ
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  ຍັງບໍ່ມີພະນັກງານ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddStaffForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Staff["role"]>("staff");
  const [error, setError] = useState("");

  function handleSave() {
    setError("");
    startTransition(async () => {
      const { error } = await addStaffMember({ email, name, role });
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
        <DialogTitle>ເພີ່ມພະນັກງານ</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          ຄົນນັ້ນຕ້ອງສະໝັກບັນຊີຜ່ານໜ້າ <code>/admin/login</code> (ກົດ &quot;ສະໝັກທີ່ນີ້&quot;) ກ່ອນ
          ຈຶ່ງເພີ່ມສິດເຂົ້າໃຊ້ໄດ້
        </p>
        <div className="space-y-1.5">
          <Label>ອີເມວ</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" />
        </div>
        <div className="space-y-1.5">
          <Label>ຊື່</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ຊື່ ແລະ ນາມສະກຸນ" />
        </div>
        <div className="space-y-1.5">
          <Label>ສິດ</Label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Staff["role"])}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="staff">ພະນັກງານ</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={!email || !name || isPending} className="bg-emerald-600 hover:bg-emerald-700">
          ເພີ່ມ
        </Button>
      </DialogFooter>
    </>
  );
}
