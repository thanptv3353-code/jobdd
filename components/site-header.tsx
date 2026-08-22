"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/jobs", label: "ຫາງານ" },
  { href: "/members", label: "ບໍລິສັດສະມາຊິກ" },
  { href: "/about", label: "ກ່ຽວກັບພວກເຮົາ" },
  { href: "/dashboard", label: "ໃບສະໝັກຂອງຂ້ອຍ" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/leba-logo.jpg" alt="LEBA" width={32} height={32} className="rounded-full" />
          <span className="text-lg font-bold tracking-tight">Job DD</span>
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
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">ຫ້ອງພະນັກງານ</Link>
          </Button>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/register">ລົງທະບຽນ</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
