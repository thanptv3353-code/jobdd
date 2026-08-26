"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type Country = Database["public"]["Tables"]["countries"]["Row"];
type Category = Database["public"]["Tables"]["job_categories"]["Row"];
type Item = Database["public"]["Tables"]["job_category_items"]["Row"];

export function PublicJobCategories({
  countries,
  categories,
  items,
  openCounts,
}: {
  countries: Country[];
  categories: Category[];
  items: Item[];
  openCounts: Record<string, number>;
}) {
  const [active, setActive] = useState(countries[0]?.code ?? "");
  const [expanded, setExpanded] = useState<string | null>(null);

  const country = countries.find((c) => c.code === active);
  const cats = categories.filter((c) => c.country === active);
  const itemsFor = (categoryId: string) => items.filter((i) => i.category_id === categoryId);

  if (!country) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted-foreground">
        ຍັງບໍ່ມີຂໍ້ມູນປະເພດວຽກ
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">ປະເພດວຽກ</h1>
      <p className="mt-1 text-muted-foreground">
        ອາຊີບທີ່ຄົນລາວມີສິດເຮັດໄດ້ຕາມກົດໝາຍ ຕ່າງກັນຕາມແຕ່ລະປະເທດປາຍທາງ
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {countries.map((c) => {
          const n = categories
            .filter((x) => x.country === c.code)
            .reduce((a, x) => a + itemsFor(x.id).length, 0);
          const on = c.code === active;
          return (
            <button
              key={c.code}
              onClick={() => {
                setActive(c.code);
                setExpanded(null);
              }}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                on ? "border-transparent text-white" : "hover:bg-muted"
              )}
              style={on ? { backgroundColor: c.accent_color } : { color: c.accent_color }}
            >
              {c.label}
              <span className="text-xs opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      {(country.route || country.note) && (
        <div
          className="mt-5 rounded-lg border bg-white p-4"
          style={{ borderLeft: `5px solid ${country.accent_color}` }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">{country.label}</h2>
            {country.route && (
              <span
                className="rounded border px-2 py-0.5 text-xs font-bold"
                style={{ borderColor: country.accent_color, color: country.accent_color }}
              >
                {country.route}
              </span>
            )}
          </div>
          {country.note && <p className="mt-2 text-sm text-muted-foreground">{country.note}</p>}
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((ct, k) => {
          const catItems = itemsFor(ct.id);
          const isOpen = expanded === ct.id;
          const vacancies = openCounts[`${active}/${ct.name}`] ?? 0;
          return (
            <div
              key={ct.id}
              className={cn(
                "rounded-lg border bg-white transition-colors",
                isOpen && "col-span-full"
              )}
            >
              <button
                aria-expanded={isOpen}
                onClick={() => setExpanded(isOpen ? null : ct.id)}
                className={cn(
                  "flex w-full items-center gap-2 p-3 text-left",
                  isOpen && "border-b"
                )}
              >
                <span
                  className="grid size-6 shrink-0 place-items-center rounded text-xs font-bold text-white"
                  style={{ backgroundColor: country.accent_color }}
                >
                  {k + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{ct.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {catItems.length} ວຽກຍ່ອຍ
                    {ct.code && ` · ${ct.code}`}
                  </span>
                </span>
                {vacancies > 0 && (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {vacancies} ຮັບສະໝັກ
                  </span>
                )}
                <span className="shrink-0 text-muted-foreground">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div className="p-3">
                  <ul className="divide-y rounded-md border">
                    {catItems.map((j, n) => (
                      <li
                        key={j.id}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-sm",
                          j.needs_review && "bg-amber-50 text-amber-800"
                        )}
                      >
                        <span className="w-6 shrink-0 text-xs tabular-nums text-muted-foreground">
                          {n + 1}.
                        </span>
                        <span className="min-w-0 flex-1">{j.name}</span>
                        {j.needs_review && (
                          <span
                            className="shrink-0 text-xs"
                            title="ຕ້ອງກວດເງື່ອນໄຂກັບເຈົ້າໜ້າທີ່ກ່ອນສະໝັກ"
                          >
                            ⚑ ກວດເງື່ອນໄຂກ່ອນ
                          </span>
                        )}
                      </li>
                    ))}
                    {catItems.length === 0 && (
                      <li className="px-3 py-4 text-center text-sm text-muted-foreground">
                        ຍັງບໍ່ມີວຽກຍ່ອຍ
                      </li>
                    )}
                  </ul>

                  <Link
                    href={`/jobs?country=${active}`}
                    className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline"
                  >
                    ເບິ່ງຕຳແໜ່ງທີ່ເປີດຮັບໃນ{country.label} →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
        {cats.length === 0 && (
          <p className="col-span-full py-10 text-center text-muted-foreground">
            ຍັງບໍ່ມີປະເພດວຽກທີ່ເປີດຮັບສຳລັບ{country.label}
          </p>
        )}
      </div>

      <div className="mt-8 rounded-lg border bg-emerald-50 p-4 text-sm">
        <p className="font-semibold text-emerald-900">ສົນໃຈໄປເຮັດວຽກຕ່າງປະເທດ?</p>
        <p className="mt-1 text-emerald-800">
          ລົງທະບຽນຄັ້ງດຽວ ໃຊ້ສະໝັກໄດ້ຫຼາຍວຽກ ແລະ ຮັບແຈ້ງເຕືອນເມື່ອມີວຽກໃໝ່
        </p>
        <Link
          href="/register"
          className="mt-3 inline-block rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
        >
          ລົງທະບຽນຜູ້ຫາວຽກ
        </Link>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        ນະໂຍບາຍວີຊາ ແລະ ບັນຊີອາຊີບປ່ຽນທຸກປີ — ກວດຢືນຢັນກັບເຈົ້າໜ້າທີ່ກ່ອນສະໝັກທຸກຄັ້ງ
      </p>
    </div>
  );
}
