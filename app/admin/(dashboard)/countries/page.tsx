import { AdminCountriesManager } from "@/components/admin-countries-manager";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCountriesPage() {
  const supabase = await createClient();
  const [{ data: countries }, { data: requirements }] = await Promise.all([
    supabase.from("countries").select("*").order("sort_order", { ascending: true }),
    supabase.from("country_requirements").select("*"),
  ]);

  return <AdminCountriesManager countries={countries ?? []} requirements={requirements ?? []} />;
}
