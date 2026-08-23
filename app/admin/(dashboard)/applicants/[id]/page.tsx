import { notFound } from "next/navigation";
import { AdminApplicantDetail } from "@/components/admin-applicant-detail";
import { createClient } from "@/lib/supabase/server";

export default async function AdminApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select("*, jobs(title), worker_profiles(*)")
    .eq("id", id)
    .maybeSingle();

  if (!application || !application.worker_profiles) notFound();

  const [{ data: files }, { data: settings }] = await Promise.all([
    supabase
      .from("worker_files")
      .select("*")
      .eq("worker_id", application.worker_id)
      .order("uploaded_at", { ascending: false }),
    supabase.from("site_settings").select("*").maybeSingle(),
  ]);

  return (
    <AdminApplicantDetail
      application={application}
      worker={application.worker_profiles}
      jobTitle={application.jobs?.title ?? ""}
      files={files ?? []}
      orgName={settings?.org_abbreviation || settings?.org_name_lo || "Job DD"}
      messageTemplate={settings?.interview_message_template}
    />
  );
}
