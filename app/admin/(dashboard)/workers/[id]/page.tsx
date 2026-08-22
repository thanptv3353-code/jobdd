import { notFound } from "next/navigation";
import { AdminWorkerDetail } from "@/components/admin-worker-detail";
import { createClient } from "@/lib/supabase/server";

export default async function AdminWorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: worker },
    { data: applications },
    { data: placements },
    { data: contactLogs },
    { data: files },
    { data: formFields },
    { data: openJobs },
  ] = await Promise.all([
    supabase.from("worker_profiles").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("applications")
      .select("*, jobs(title)")
      .eq("worker_id", id)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("placements")
      .select("*")
      .eq("worker_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("contact_logs")
      .select("*")
      .eq("worker_id", id)
      .order("contacted_at", { ascending: false }),
    supabase
      .from("worker_files")
      .select("*")
      .eq("worker_id", id)
      .order("uploaded_at", { ascending: false }),
    supabase.from("form_fields").select("field_key, label"),
    supabase.from("jobs").select("id, title, country").eq("status", "open").order("title"),
  ]);

  if (!worker) notFound();

  return (
    <AdminWorkerDetail
      worker={worker}
      applications={applications ?? []}
      placements={placements ?? []}
      contactLogs={contactLogs ?? []}
      files={files ?? []}
      formFields={formFields ?? []}
      openJobs={openJobs ?? []}
    />
  );
}
