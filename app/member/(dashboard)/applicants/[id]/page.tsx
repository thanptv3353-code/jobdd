import { notFound } from "next/navigation";
import { MemberApplicantDetail } from "@/components/member-applicant-detail";
import { createClient } from "@/lib/supabase/server";

export default async function MemberApplicantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS returns nothing unless this application belongs to one of the
  // signed-in company's own jobs.
  const { data: application } = await supabase
    .from("applications")
    .select("id, stage, country, worker_id, submitted_at, interview_at, jobs(title, country)")
    .eq("id", id)
    .maybeSingle();
  if (!application) notFound();

  const [{ data: worker }, { data: files }, { data: events }] = await Promise.all([
    supabase.from("worker_profiles").select("*").eq("id", application.worker_id).maybeSingle(),
    supabase
      .from("worker_files")
      .select("id, doc_type, file_path, file_name, description, uploaded_at")
      .eq("worker_id", application.worker_id)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("application_events")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!worker) notFound();

  // Short-lived signed URLs so documents are never publicly addressable.
  const fileUrls: Record<string, string> = {};
  await Promise.all(
    (files ?? []).map(async (f) => {
      const { data } = await supabase.storage
        .from("worker-uploads")
        .createSignedUrl(f.file_path, 60 * 30);
      if (data) fileUrls[f.id] = data.signedUrl;
    })
  );

  return (
    <MemberApplicantDetail
      application={application}
      worker={worker}
      files={files ?? []}
      fileUrls={fileUrls}
      events={events ?? []}
    />
  );
}
