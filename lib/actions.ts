"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  ApplicationStage,
  AvailabilityStatus,
  Country,
} from "@/lib/supabase/database.types";

// ---------- Public / worker actions (no auth — RLS grants anon insert) ----------

export async function registerWorker(input: {
  name: string;
  gender: "male" | "female";
  phone: string;
  dob: string;
  province: string;
  preferredCountries: Country[];
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("worker_profiles")
    .insert({
      name: input.name,
      gender: input.gender,
      phone: input.phone,
      dob: input.dob,
      province: input.province,
      preferred_countries: input.preferredCountries,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function submitApplication(input: {
  workerId: string;
  jobId: string;
  country: Country;
  documents: Record<string, boolean>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .insert({
      worker_id: input.workerId,
      job_id: input.jobId,
      country: input.country,
      documents: input.documents,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMyStatus(phone: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_status", { p_phone: phone });
  if (error) throw error;
  return data;
}

export async function setMyStatus(phone: string, status: AvailabilityStatus) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_my_status", {
    p_phone: phone,
    p_status: status,
  });
  if (error) throw error;
  return data;
}

// ---------- Staff actions (auth required — RLS grants staff-only writes) ----------

export async function updateApplicationStage(applicationId: string, stage: ApplicationStage) {
  const supabase = await createClient();
  const { error } = await supabase.from("applications").update({ stage }).eq("id", applicationId);
  if (error) throw error;
  revalidatePath("/admin/applications");
  revalidatePath("/admin/workers");
  revalidatePath("/admin");
}

export async function setWorkerStatus(workerId: string, status: AvailabilityStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("worker_profiles")
    .update({
      availability_status: status,
      status_updated_at: new Date().toISOString(),
      status_updated_by: "ພະນັກງານ",
    })
    .eq("id", workerId);
  if (error) throw error;
  revalidatePath(`/admin/workers/${workerId}`);
  revalidatePath("/admin/workers");
}

export async function addContactLog(input: {
  workerId: string;
  staffName: string;
  channel: "phone" | "whatsapp" | "sms" | "in_person";
  result: string;
  note?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("contact_logs").insert({
    worker_id: input.workerId,
    staff_name: input.staffName,
    channel: input.channel,
    result: input.result,
    note: input.note ?? null,
  });
  if (error) throw error;
  revalidatePath(`/admin/workers/${input.workerId}`);
}

export async function addJob(input: {
  memberId: string;
  title: string;
  country: Country;
  category: string;
  salaryRange: string;
  description: string;
  quota: number;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").insert({
    member_id: input.memberId,
    title: input.title,
    country: input.country,
    category: input.category,
    salary_range: input.salaryRange,
    description: input.description,
    quota: input.quota,
  });
  if (error) throw error;
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
}

export async function addMember(input: {
  name: string;
  description: string;
  establishedYear: number;
  countryFocus: Country[];
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("members").insert({
    name: input.name,
    description: input.description,
    established_year: input.establishedYear,
    country_focus: input.countryFocus,
  });
  if (error) throw error;
  revalidatePath("/admin/members");
  revalidatePath("/members");
}

// ---------- Auth ----------

export async function signInStaff(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signUpStaff(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signOutStaff() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
