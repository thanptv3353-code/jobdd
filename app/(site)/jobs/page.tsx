import { JobsBrowser } from "@/components/jobs-browser";
import { getOpenJobs } from "@/lib/queries";
import type { Country } from "@/lib/types";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const [jobs, params] = await Promise.all([getOpenJobs(), searchParams]);
  return <JobsBrowser jobs={jobs} initialCountry={params.country as Country | undefined} />;
}
