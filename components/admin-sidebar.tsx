"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutStaff } from "@/lib/actions";

const NAV = [
  { href: "/admin", label: "ພາບລວມ", icon: "📊" },
  { href: "/admin/workers", label: "ຜູ້ຫາວຽກ", icon: "👥" },
  { href: "/admin/applicants", label: "ລາຍຊື່ຜູ້ສະໝັກ", icon: "📋" },
  { href: "/admin/stats", label: "ສະຖິຕິ", icon: "📈" },
  { href: "/admin/jobs", label: "ຕຳແໜ່ງວຽກ", icon: "💼" },
  { href: "/admin/members", label: "ບໍລິສັດສະມາຊິກ", icon: "🏢" },
  { href: "/admin/countries", label: "ປະເທດປາຍທາງ", icon: "🌏" },
  { href: "/admin/job-categories", label: "ປະເພດວຽກ", icon: "🗂️" },
  { href: "/admin/form-builder", label: "ຟອມລົງທະບຽນ", icon: "🧩" },
  { href: "/admin/settings", label: "ຂໍ້ມູນສະມາຄົມ", icon: "⚙️" },
];

const SUPER_ADMIN_NAV = { href: "/admin/staff", label: "ພະນັກງານ", icon: "🔑" };

export function AdminSidebar({ userEmail, isSuperAdmin }: { userEmail: string; isSuperAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOutStaff();
    router.push("/admin/login");
    router.refresh();
  }

  const nav = isSuperAdmin ? [...NAV, SUPER_ADMIN_NAV] : NAV;

  const sidebarContent = (
    <>
      <Link href="/" className="mb-6 flex items-center gap-2 px-2" onClick={() => setMobileOpen(false)}>
        <Image src="/jobdd-logo.png" alt="Job DD" width={32} height={32} className="rounded-lg" />
        <span className="font-bold">Job DD Admin</span>
      </Link>
      <nav className="space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-emerald-600 text-white" : "hover:bg-muted"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t pt-4">
        <p className="truncate px-2 text-xs text-muted-foreground">{userEmail}</p>
        <button
          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          onClick={handleSignOut}
        >
          ອອກຈາກລະບົບ
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white p-3 md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/jobdd-logo.png" alt="Job DD" width={28} height={28} className="rounded-lg" />
          <span className="text-sm font-bold">Job DD Admin</span>
        </Link>
        <button
          type="button"
          aria-label="ເປີດເມນູ"
          className="rounded-md p-2 hover:bg-muted"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </header>

      {/* Mobile off-canvas drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col overflow-y-auto bg-white p-4 shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-muted/20 p-4 md:flex">
        {sidebarContent}
      </aside>
    </>
  );
}
