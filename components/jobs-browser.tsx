"use client";

import { useMemo, useState } from "react";
import { JobCard } from "@/components/job-card";
import { useCountries } from "@/components/countries-provider";
import type { Country } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { Database } from "@/lib/supabase/database.types";

type Job = Database["public"]["Tables"]["jobs"]["Row"] & {
  members: Database["public"]["Tables"]["members"]["Row"] | null;
};
type JobCategory = Database["public"]["Tables"]["job_categories"]["Row"];

export function JobsBrowser({
  jobs,
  categories,
  initialCountry,
  initialCategory,
}: {
  jobs: Job[];
  categories: JobCategory[];
  initialCountry?: Country;
  initialCategory?: string;
}) {
  const { countries, label } = useCountries();
  const [country, setCountry] = useState<Country | "all">(initialCountry ?? "all");
  const [category, setCategory] = useState<string>(initialCategory ?? "all");
  const [query, setQuery] = useState("");

  // Only offer categories that some open vacancy actually uses, and that fit
  // the country already chosen — an empty filter chip helps nobody.
  const categoryChips = useMemo(() => {
    const used = new Set(
      jobs
        .filter((j) => country === "all" || j.country === country)
        .map((j) => j.category)
        .filter(Boolean)
    );
    const known = categories
      .filter((c) => (country === "all" || c.country === country) && used.has(c.name))
      .map((c) => c.name);
    // Vacancies may carry a category the association has since retired.
    const extra = [...used].filter((n) => !known.includes(n));
    return [...new Set([...known, ...extra])];
  }, [jobs, categories, country]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (country !== "all" && j.country !== country) return false;
      if (category !== "all" && j.category !== category) return false;
      if (query && !j.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [jobs, country, category, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">ຄົ້ນຫາວຽກ</h1>
      <p className="mt-1 text-muted-foreground">ພົບ {filtered.length} ຕຳແໜ່ງວຽກທີ່ເປີດຮັບ</p>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
        <Input
          placeholder="ຄົ້ນຫາຊື່ຕຳແໜ່ງວຽກ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="md:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={country === "all"}
            onClick={() => {
              setCountry("all");
              setCategory("all");
            }}
          >
            ທັງໝົດ
          </FilterChip>
          {countries.map((c) => (
            <FilterChip
              key={c.code}
              active={country === c.code}
              onClick={() => {
                setCountry(c.code);
                setCategory("all");
              }}
            >
              {label(c.code)}
            </FilterChip>
          ))}
        </div>
      </div>

      {categoryChips.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground">ປະເພດວຽກ</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
              ທຸກປະເພດ
            </FilterChip>
            {categoryChips.map((name) => (
              <FilterChip key={name} active={category === name} onClick={() => setCategory(name)}>
                {name}
              </FilterChip>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-muted-foreground">
            ບໍ່ພົບຕຳແໜ່ງວຽກທີ່ຄົ້ນຫາ
          </p>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "border-emerald-600 bg-emerald-600 text-white" : "hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}
