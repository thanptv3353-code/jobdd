import { createClient } from "@/lib/supabase/server";
import type { Country } from "@/lib/supabase/database.types";

export async function getOpenJobs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, members(*)")
    .eq("status", "open")
    .order("posted_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getJob(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, members(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMembers() {
  const supabase = await createClient();
  const { data: members, error } = await supabase.from("members").select("*").order("sort_order").order("name");
  if (error) throw error;

  const { data: jobs } = await supabase.from("jobs").select("id, member_id").eq("status", "open");
  const openCountByMember = new Map<string, number>();
  for (const j of jobs ?? []) {
    openCountByMember.set(j.member_id, (openCountByMember.get(j.member_id) ?? 0) + 1);
  }

  return (members ?? []).map((m) => ({ ...m, openJobCount: openCountByMember.get(m.id) ?? 0 }));
}

export async function getCountryRequirements(country: Country) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("country_requirements")
    .select("*")
    .eq("country", country);
  if (error) throw error;
  return data ?? [];
}

export async function getHomeStats() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_stats");
  if (error) throw error;
  return data ?? { available_workers: 0, open_jobs: 0, members: 0 };
}

export async function getCountries() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("countries")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSiteSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_settings").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function getFormFields() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("form_fields")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
