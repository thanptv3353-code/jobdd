"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  ApplicationStage,
  AvailabilityStatus,
  Country,
} from "@/lib/supabase/database.types";

// ---------- Public / worker actions (no auth — RLS grants anon insert) ----------
//
// These insert without .select(): anon only has INSERT (not SELECT) on
// worker_profiles/applications by design (worker data is private, readable
// only via the phone-scoped get_my_status RPC or by staff). Postgres'
// INSERT ... RETURNING needs SELECT privilege too, so the id is generated
// here instead of read back from the database.

export interface AddressInput {
  permVillage: string;
  permDistrict: string;
  permProvince: string;
  curVillage: string;
  curDistrict: string;
  curProvince: string;
}

export async function registerWorker(
  input: {
    id?: string;
    name: string;
    gender: "male" | "female";
    phone: string;
    dob: string;
    preferredCountries: Country[];
    customFields?: Record<string, string | number | boolean | string[]>;
  } & AddressInput
) {
  const supabase = await createClient();
  const id = input.id ?? randomUUID();
  const { error } = await supabase
    .from("worker_profiles")
    .upsert(
      {
        id,
        name: input.name,
        gender: input.gender,
        phone: input.phone,
        dob: input.dob,
        perm_village: input.permVillage,
        perm_district: input.permDistrict,
        perm_province: input.permProvince,
        cur_village: input.curVillage,
        cur_district: input.curDistrict,
        cur_province: input.curProvince,
        preferred_countries: input.preferredCountries,
        custom_fields: input.customFields ?? {},
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
  if (error) throw error;
  return { id };
}

export async function recordWorkerFile(input: {
  workerId: string;
  docType: string;
  filePath: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  description?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("worker_files").insert({
    worker_id: input.workerId,
    doc_type: input.docType,
    file_path: input.filePath,
    file_name: input.fileName,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    description: input.description ?? null,
  });
  if (error) throw error;
}

export async function submitApplication(input: {
  workerId: string;
  jobId: string;
  country: Country;
  documents: Record<string, boolean>;
}) {
  const supabase = await createClient();
  const id = randomUUID();
  const { error } = await supabase.from("applications").insert({
    id,
    worker_id: input.workerId,
    job_id: input.jobId,
    country: input.country,
    documents: input.documents,
  });
  if (error) throw error;
  return { id };
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

export async function updateWorkerProfile(
  workerId: string,
  input: {
    name: string;
    gender: "male" | "female";
    phone: string;
    dob: string;
    preferredCountries: Country[];
  } & AddressInput
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("worker_profiles")
    .update({
      name: input.name,
      gender: input.gender,
      phone: input.phone,
      dob: input.dob,
      perm_village: input.permVillage,
      perm_district: input.permDistrict,
      perm_province: input.permProvince,
      cur_village: input.curVillage,
      cur_district: input.curDistrict,
      cur_province: input.curProvince,
      preferred_countries: input.preferredCountries,
    })
    .eq("id", workerId);
  if (error) throw error;
  revalidatePath(`/admin/workers/${workerId}`);
  revalidatePath("/admin/workers");
}

export async function deleteWorker(workerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("worker_profiles").delete().eq("id", workerId);
  if (error) throw error;
  revalidatePath("/admin/workers");
}

export async function getWorkerFileUrl(filePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("worker-uploads")
    .createSignedUrl(filePath, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteWorkerFile(fileId: string, filePath: string, workerId: string) {
  const supabase = await createClient();
  const { error: storageError } = await supabase.storage.from("worker-uploads").remove([filePath]);
  if (storageError) throw storageError;
  const { error } = await supabase.from("worker_files").delete().eq("id", fileId);
  if (error) throw error;
  revalidatePath(`/admin/workers/${workerId}`);
}

// ---------- Form builder (staff) ----------

type FormFieldInput = {
  fieldKey: string;
  label: string;
  fieldType: "text" | "textarea" | "number" | "date" | "select" | "multiselect" | "checkbox";
  options: string[];
  required: boolean;
  sortOrder: number;
};

export async function addFormField(input: FormFieldInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("form_fields").insert({
    field_key: input.fieldKey,
    label: input.label,
    field_type: input.fieldType,
    options: input.options,
    required: input.required,
    sort_order: input.sortOrder,
  });
  if (error) throw error;
  revalidatePath("/admin/form-builder");
  revalidatePath("/register");
}

export async function updateFormField(id: string, input: FormFieldInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("form_fields")
    .update({
      field_key: input.fieldKey,
      label: input.label,
      field_type: input.fieldType,
      options: input.options,
      required: input.required,
      sort_order: input.sortOrder,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/form-builder");
  revalidatePath("/register");
}

export async function updateBuiltinFormField(
  id: string,
  input: { label: string; required: boolean; sortOrder: number }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("form_fields")
    .update({ label: input.label, required: input.required, sort_order: input.sortOrder })
    .eq("id", id)
    .eq("is_builtin", true);
  if (error) throw error;
  revalidatePath("/admin/form-builder");
  revalidatePath("/register");
}

export async function deleteFormField(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("form_fields")
    .delete()
    .eq("id", id)
    .eq("is_builtin", false);
  if (error) throw error;
  revalidatePath("/admin/form-builder");
  revalidatePath("/register");
}

export async function updateApplication(
  applicationId: string,
  input: { stage: ApplicationStage; documents: Record<string, boolean> }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({ stage: input.stage, documents: input.documents })
    .eq("id", applicationId);
  if (error) throw error;
  revalidatePath("/admin/applications");
  revalidatePath("/admin/workers");
  revalidatePath("/admin");
}

export async function deleteApplication(applicationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("applications").delete().eq("id", applicationId);
  if (error) throw error;
  revalidatePath("/admin/applications");
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

export async function updateContactLog(
  id: string,
  workerId: string,
  input: { result: string; note?: string; channel: "phone" | "whatsapp" | "sms" | "in_person" }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_logs")
    .update({ result: input.result, note: input.note ?? null, channel: input.channel })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(`/admin/workers/${workerId}`);
}

export async function deleteContactLog(id: string, workerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contact_logs").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(`/admin/workers/${workerId}`);
}

type JobInput = {
  memberId: string;
  title: string;
  country: Country;
  category: string;
  salaryRange: string;
  description: string;
  quota: number;
  status?: "open" | "closed";
};

export async function addJob(input: JobInput) {
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

export async function updateJob(jobId: string, input: JobInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({
      member_id: input.memberId,
      title: input.title,
      country: input.country,
      category: input.category,
      salary_range: input.salaryRange,
      description: input.description,
      quota: input.quota,
      status: input.status,
    })
    .eq("id", jobId);
  if (error) throw error;
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
}

export async function deleteJob(jobId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").delete().eq("id", jobId);
  if (error) throw error;
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
}

type MemberInput = {
  name: string;
  description: string;
  establishedYear: number;
  countryFocus: Country[];
};

export async function addMember(input: MemberInput) {
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

export async function updateMember(memberId: string, input: MemberInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({
      name: input.name,
      description: input.description,
      established_year: input.establishedYear,
      country_focus: input.countryFocus,
    })
    .eq("id", memberId);
  if (error) throw error;
  revalidatePath("/admin/members");
  revalidatePath("/members");
}

export async function deleteMember(memberId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("members").delete().eq("id", memberId);
  if (error) throw error;
  revalidatePath("/admin/members");
  revalidatePath("/members");
}

// ---------- Countries + per-country document requirements (staff) ----------

type CountryInput = {
  code: string;
  label: string;
  minAge: number;
  maxAge: number;
  sortOrder: number;
};

export async function addCountry(input: CountryInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("countries").insert({
    code: input.code,
    label: input.label,
    min_age: input.minAge,
    max_age: input.maxAge,
    sort_order: input.sortOrder,
  });
  if (error) throw error;
  revalidatePath("/admin/countries");
  revalidatePath("/jobs");
  revalidatePath("/register");
}

export async function updateCountry(code: string, input: CountryInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("countries")
    .update({
      label: input.label,
      min_age: input.minAge,
      max_age: input.maxAge,
      sort_order: input.sortOrder,
    })
    .eq("code", code);
  if (error) throw error;
  revalidatePath("/admin/countries");
  revalidatePath("/jobs");
  revalidatePath("/register");
}

export async function deleteCountry(code: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("countries").delete().eq("code", code);
  if (error) throw error;
  revalidatePath("/admin/countries");
  revalidatePath("/jobs");
  revalidatePath("/register");
}

type CountryRequirementInput = {
  country: string;
  docType: string;
  required: boolean;
  note?: string;
};

export async function addCountryRequirement(input: CountryRequirementInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("country_requirements").insert({
    country: input.country,
    doc_type: input.docType,
    required: input.required,
    note: input.note ?? null,
  });
  if (error) throw error;
  revalidatePath("/admin/countries");
}

export async function updateCountryRequirement(id: string, input: CountryRequirementInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("country_requirements")
    .update({
      doc_type: input.docType,
      required: input.required,
      note: input.note ?? null,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/countries");
}

export async function deleteCountryRequirement(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("country_requirements").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/countries");
}

// ---------- Site settings (staff) ----------

export async function updateSiteSettings(input: {
  orgNameLo: string;
  orgNameEn: string;
  orgAbbreviation: string;
  phone: string;
  hotline: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      org_name_lo: input.orgNameLo,
      org_name_en: input.orgNameEn,
      org_abbreviation: input.orgAbbreviation,
      phone: input.phone,
      hotline: input.hotline,
      facebook_url: input.facebookUrl || null,
      tiktok_url: input.tiktokUrl || null,
      youtube_url: input.youtubeUrl || null,
    })
    .eq("id", true);
  if (error) throw error;
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
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
