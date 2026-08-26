import { MemberApplicantsList } from "@/components/member-applicants-list";
import { createClient } from "@/lib/supabase/server";

export default async function MemberApplicantsPage() {
  const supabase = await createClient();

  // RLS limits this to applications made to this company's own jobs.
  const { data: applications } = await supabase
    .from("applications")
    .select("id, stage, country, worker_id, submitted_at, interview_at, worker_profiles(name, phone, dob, cur_province), jobs(title)")
    .order("submitted_at", { ascending: false });

  return <MemberApplicantsList applications={applications ?? []} />;
}
