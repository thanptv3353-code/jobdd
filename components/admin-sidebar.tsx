"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOutStaff } from "@/lib/actions";

const NAV = [
  { href: "/admin", label: "ພາບລວມ", icon: "📊" },
  { href: "/admin/workers", label: "ຜູ້ຫາງານ", icon: "👥" },
  { href: "/admin/applications", label: "ໃບສະໝັກ", icon: "📄" },
  { href: "/admin/jobs", label: "ຕຳແໜ່ງງານ", icon: "💼" },
  { href: "/admin/members", label: "ບໍລິສັດສະມາຊິກ", icon: "🏢" },
  { href: "/admin/countries", label: "ປະເທດປາຍທາງ", icon: "🌏" },
  { href: "/admin/form-builder", label: "ຟອມລົງທະບຽນ", icon: "🧩" },
];

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r bg-muted/20 p-4">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-xs font-bold text-white">
          DD
        </span>
        <span className="font-bold">Job DD Admin</span>
      </Link>
      <nav className="space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
          onClick={async () => {
            await signOutStaff();
            router.push("/admin/login");
            router.refresh();
          }}
        >
          ອອກຈາກລະບົບ
        </button>
      </div>
    </aside>
  );
}
