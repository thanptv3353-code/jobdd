import { MemberJobsManager } from "@/components/member-jobs-manager";
import { createClient } from "@/lib/supabase/server";

export default async function MemberJobsPage() {
  const supabase = await createClient();

  const [{ data: jobs }, { data: countries }, { data: categories }, { data: applications }] =
    await Promise.all([
      // RLS keeps this to the signed-in company's own postings.
      supabase.from("jobs").select("*").order("posted_at", { ascending: false }),
      supabase.from("countries").select("*").order("sort_order", { ascending: true }),
      supabase.from("job_categories").select("*").eq("is_open", true).order("sort_order"),
      supabase.from("applications").select("id, job_id"),
    ]);

  const applicantCounts: Record<string, number> = {};
  for (const a of applications ?? []) {
    applicantCounts[a.job_id] = (applicantCounts[a.job_id] ?? 0) + 1;
  }

  return (
    <MemberJobsManager
      jobs={jobs ?? []}
      countries={countries ?? []}
      categories={categories ?? []}
      applicantCounts={applicantCounts}
    />
  );
}
