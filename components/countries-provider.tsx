"use client";

import { createContext, useContext, useMemo } from "react";
import type { Database } from "@/lib/supabase/database.types";

type CountryRow = Database["public"]["Tables"]["countries"]["Row"];

interface CountriesContextValue {
  countries: CountryRow[];
  label: (code: string) => string;
  get: (code: string) => CountryRow | undefined;
}

const CountriesContext = createContext<CountriesContextValue | null>(null);

export function CountriesProvider({
  countries,
  children,
}: {
  countries: CountryRow[];
  children: React.ReactNode;
}) {
  const value = useMemo<CountriesContextValue>(() => {
    const byCode = new Map(countries.map((c) => [c.code, c]));
    return {
      countries,
      label: (code: string) => byCode.get(code)?.label ?? code,
      get: (code: string) => byCode.get(code),
    };
  }, [countries]);

  return <CountriesContext.Provider value={value}>{children}</CountriesContext.Provider>;
}

export function useCountries() {
  const ctx = useContext(CountriesContext);
  if (!ctx) throw new Error("useCountries must be used within a CountriesProvider");
  return ctx;
}
