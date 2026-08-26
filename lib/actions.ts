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
    preferredCategories?: string[];
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
        preferred_categories: input.preferredCategories ?? [],
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

async function getCurrentStaff(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("staff").select("id, name").eq("user_id", user.id).maybeSingle();
  return data;
}

/**
 * Who is acting: a Job DD staff member, or a signed-in member company.
 * Companies are recorded with their own name so admin can always see which
 * company interviewed or hired an applicant.
 */
async function getCurrentActor(supabase: Awaited<ReturnType<typeof createClient>>) {
  const staff = await getCurrentStaff(supabase);
  if (staff) {
    return { actorType: "staff" as const, staffId: staff.id, name: staff.name, memberId: null };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: mu } = await supabase
    .from("member_users")
    .select("member_id, name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!mu) return null;

  const { data: company } = await supabase
    .from("members")
    .select("name")
    .eq("id", mu.member_id)
    .maybeSingle();

  return {
    actorType: "member" as const,
    staffId: null,
    name: company?.name || mu.name || "ບໍລິສັດສະມາຊິກ",
    memberId: mu.member_id,
  };
}

async function logApplicationEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  applicationId: string,
  action: string,
  detail?: string
) {
  const actor = await getCurrentActor(supabase);
  await supabase.from("application_events").insert({
    application_id: applicationId,
    staff_id: actor?.staffId ?? null,
    staff_name: actor?.name || "ລະບົບ",
    actor_type: actor?.actorType ?? "staff",
    member_id: actor?.memberId ?? null,
    action,
    detail: detail ?? null,
  });
}

export async function updateApplicationStage(applicationId: string, stage: ApplicationStage) {
  const supabase = await createClient();
  const { error } = await supabase.from("applications").update({ stage }).eq("id", applicationId);
  if (error) throw error;
  await logApplicationEvent(supabase, applicationId, stage);
  revalidatePath("/admin/applicants");
  revalidatePath("/admin/workers");
  revalidatePath("/admin");
}

export async function scheduleInterview(applicationId: string, interviewAt: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({ stage: "interview", interview_at: interviewAt })
    .eq("id", applicationId);
  if (error) throw error;
  await logApplicationEvent(
    supabase,
    applicationId,
    "interview",
    new Date(interviewAt).toLocaleString("lo-LA")
  );
  revalidatePath("/admin/applicants");
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
  revalidatePath("/admin/applicants");
  revalidatePath("/admin/workers");
  revalidatePath("/admin");
}

export async function deleteApplication(applicationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("applications").delete().eq("id", applicationId);
  if (error) throw error;
  revalidatePath("/admin/applicants");
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
  contactPerson?: string;
  contactPhone?: string;
  nameEn?: string;
  address?: string;
  email?: string;
  lineId?: string;
  licenseNo?: string;
  licenseExpiry?: string;
  director?: string;
  sortOrder?: number;
};

export async function addMember(input: MemberInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("members").insert({
    name: input.name,
    description: input.description,
    established_year: input.establishedYear,
    country_focus: input.countryFocus,
    contact_person: input.contactPerson || null,
    contact_phone: input.contactPhone || null,
    address: input.address || null,
    name_en: input.nameEn || null,
    email: input.email || null,
    line_id: input.lineId || null,
    license_no: input.licenseNo || null,
    license_expiry: input.licenseExpiry || null,
    director: input.director || null,
    sort_order: input.sortOrder ?? 0,
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
      contact_person: input.contactPerson || null,
      contact_phone: input.contactPhone || null,
      address: input.address || null,
      name_en: input.nameEn || null,
      email: input.email || null,
      line_id: input.lineId || null,
      license_no: input.licenseNo || null,
      license_expiry: input.licenseExpiry || null,
      director: input.director || null,
      sort_order: input.sortOrder ?? 0,
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

// ---------- Per-country job categories (staff) ----------

async function revalidateCategories() {
  revalidatePath("/admin/job-categories");
  revalidatePath("/jobs");
}

export async function updateCountryContext(
  code: string,
  input: { route: string; note: string; accentColor: string }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("countries")
    .update({
      route: input.route || null,
      note: input.note || null,
      accent_color: input.accentColor || "#475569",
    })
    .eq("code", code);
  if (error) throw error;
  await revalidateCategories();
}

export async function addJobCategory(country: string, name: string) {
  const supabase = await createClient();
  // Append to the end of this country's list.
  const { data: last } = await supabase
    .from("job_categories")
    .select("sort_order")
    .eq("country", country)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase
    .from("job_categories")
    .insert({ country, name, sort_order: (last?.sort_order ?? 0) + 1 });
  if (error) return { error: error.message };
  await revalidateCategories();
  return {};
}

export async function updateJobCategory(
  id: string,
  input: { name?: string; code?: string; isOpen?: boolean; sortOrder?: number }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("job_categories")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.code !== undefined && { code: input.code }),
      ...(input.isOpen !== undefined && { is_open: input.isOpen }),
      ...(input.sortOrder !== undefined && { sort_order: input.sortOrder }),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  await revalidateCategories();
  return {};
}

export async function deleteJobCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("job_categories").delete().eq("id", id);
  if (error) throw error;
  await revalidateCategories();
}

/** Swap two categories' sort_order so staff can reorder the list. */
export async function swapJobCategoryOrder(a: { id: string; sortOrder: number }, b: { id: string; sortOrder: number }) {
  const supabase = await createClient();
  const { error } = await supabase.from("job_categories").upsert([
    { id: a.id, sort_order: b.sortOrder },
    { id: b.id, sort_order: a.sortOrder },
  ] as never);
  if (error) throw error;
  await revalidateCategories();
}

export async function addJobCategoryItem(categoryId: string, name: string) {
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("job_category_items")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase
    .from("job_category_items")
    .insert({ category_id: categoryId, name, sort_order: (last?.sort_order ?? 0) + 1 });
  if (error) return { error: error.message };
  await revalidateCategories();
  return {};
}

export async function updateJobCategoryItem(
  id: string,
  input: { name?: string; needsReview?: boolean }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("job_category_items")
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.needsReview !== undefined && { needs_review: input.needsReview }),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  await revalidateCategories();
  return {};
}

export async function deleteJobCategoryItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("job_category_items").delete().eq("id", id);
  if (error) throw error;
  await revalidateCategories();
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
  interviewMessageTemplate?: string;
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
      interview_message_template: input.interviewMessageTemplate || undefined,
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

// ---------- Member portal (company accounts) ----------

export async function signInMember(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signUpMember(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signOutMember() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/** The company the signed-in user belongs to, or null. */
export async function getMyMemberId() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_member_id");
  return data ?? null;
}

function revalidateMember() {
  revalidatePath("/member");
  revalidatePath("/member/jobs");
  revalidatePath("/member/applicants");
  revalidatePath("/jobs");
  revalidatePath("/admin/jobs");
}

type MemberJobInput = {
  title: string;
  country: Country;
  category: string;
  salaryRange: string;
  description: string;
  quota: number;
  status: "open" | "closed";
};

export async function addMemberJob(input: MemberJobInput) {
  const supabase = await createClient();
  const memberId = await getMyMemberId();
  if (!memberId) return { error: "ບັນຊີນີ້ບໍ່ໄດ້ຜູກກັບບໍລິສັດສະມາຊິກ" };

  const { error } = await supabase.from("jobs").insert({
    member_id: memberId,
    title: input.title,
    country: input.country,
    category: input.category,
    salary_range: input.salaryRange,
    description: input.description,
    quota: input.quota,
    status: input.status,
  });
  if (error) return { error: error.message };
  revalidateMember();
  return { error: null };
}

export async function updateMemberJob(jobId: string, input: MemberJobInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({
      title: input.title,
      country: input.country,
      category: input.category,
      salary_range: input.salaryRange,
      description: input.description,
      quota: input.quota,
      status: input.status,
    })
    .eq("id", jobId);
  if (error) return { error: error.message };
  revalidateMember();
  return { error: null };
}

export async function deleteMemberJob(jobId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").delete().eq("id", jobId);
  if (error) return { error: error.message };
  revalidateMember();
  return { error: null };
}

/**
 * Stage changes and interview scheduling from the company side. RLS confines
 * these to applications made to the company's own jobs, and the audit log
 * records the company as the actor.
 */
export async function memberSetApplicationStage(applicationId: string, stage: ApplicationStage) {
  const supabase = await createClient();
  const { error } = await supabase.from("applications").update({ stage }).eq("id", applicationId);
  if (error) return { error: error.message };
  await logApplicationEvent(supabase, applicationId, stage);
  revalidateMember();
  return { error: null };
}

export async function memberScheduleInterview(applicationId: string, interviewAt: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({ stage: "interview", interview_at: interviewAt })
    .eq("id", applicationId);
  if (error) return { error: error.message };
  await logApplicationEvent(
    supabase,
    applicationId,
    "interview",
    new Date(interviewAt).toLocaleString("lo-LA")
  );
  revalidateMember();
  return { error: null };
}

// ---------- Company account management (staff) ----------

export async function addMemberAccount(input: { email: string; memberId: string; name: string }) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_member_user_by_email", {
    p_email: input.email,
    p_member_id: input.memberId,
    p_name: input.name,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/members");
  return { error: null };
}

export async function removeMemberAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member_user", { p_id: id });
  if (error) return { error: error.message };
  revalidatePath("/admin/members");
  return { error: null };
}

// ---------- Staff management (super admin only) ----------

export async function addStaffMember(input: { email: string; name: string; role: "staff" | "super_admin" }) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_staff_by_email", {
    p_email: input.email,
    p_name: input.name,
    p_role: input.role,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  return { error: null };
}

export async function removeStaffMember(staffId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_staff", { p_staff_id: staffId });
  if (error) return { error: error.message };
  revalidatePath("/admin/staff");
  return { error: null };
}
