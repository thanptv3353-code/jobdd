"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutMember } from "@/lib/actions";

const NAV = [
  { href: "/member", label: "ພາບລວມ", icon: "📊" },
  { href: "/member/jobs", label: "ປະກາດຮັບສະໝັກ", icon: "💼" },
  { href: "/member/applicants", label: "ຜູ້ສະໝັກ", icon: "📋" },
];

export function MemberSidebar({
  companyName,
  userEmail,
}: {
  companyName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOutMember();
    router.push("/member/login");
    router.refresh();
  }

  const content = (
    <>
      <Link href="/" className="mb-6 flex items-center gap-2 px-2" onClick={() => setMobileOpen(false)}>
        <Image src="/jobdd-logo.png" alt="Job DD" width={32} height={32} className="rounded-lg" />
        <span className="min-w-0 truncate text-sm font-bold">{companyName}</span>
      </Link>
      <nav className="space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href ? "bg-emerald-600 text-white" : "hover:bg-muted"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
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
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white p-3 md:hidden">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Image src="/jobdd-logo.png" alt="Job DD" width={28} height={28} className="rounded-lg" />
          <span className="truncate text-sm font-bold">{companyName}</span>
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

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col overflow-y-auto bg-white p-4 shadow-xl">
            {content}
          </aside>
        </div>
      )}

      <aside className="hidden w-56 shrink-0 flex-col border-r bg-muted/20 p-4 md:flex">
        {content}
      </aside>
    </>
  );
}
