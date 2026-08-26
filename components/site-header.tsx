"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/jobs", label: "ຫາວຽກ" },
  { href: "/job-categories", label: "ປະເພດວຽກ" },
  { href: "/members", label: "ບໍລິສັດສະມາຊິກ" },
  { href: "/about", label: "ກ່ຽວກັບພວກເຮົາ" },
  { href: "/dashboard", label: "ໃບສະໝັກຂອງຂ້ອຍ" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <Image src="/jobdd-logo.png" alt="Job DD" width={44} height={44} className="rounded-xl" />
          <span className="text-lg font-bold text-emerald-700">Job DD</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                pathname === item.href ? "text-emerald-700" : "text-foreground/80"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">ຫ້ອງພະນັກງານ</Link>
            </Button>
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/register">ລົງທະບຽນ</Link>
            </Button>
          </div>
          <button
            type="button"
            aria-label="ເປີດເມນູ"
            className="rounded-md p-2 hover:bg-muted md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t bg-white px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "block rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted",
                pathname === item.href ? "text-emerald-700" : "text-foreground/80"
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-1 flex flex-col gap-2 border-t pt-2">
            <Button asChild variant="ghost" size="sm" className="justify-start" onClick={() => setMenuOpen(false)}>
              <Link href="/admin">ຫ້ອງພະນັກງານ</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setMenuOpen(false)}
            >
              <Link href="/register">ລົງທະບຽນ</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
