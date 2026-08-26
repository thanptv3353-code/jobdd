import { JobsBrowser } from "@/components/jobs-browser";
import { getOpenJobCategories, getOpenJobs } from "@/lib/queries";
import type { Country } from "@/lib/types";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; category?: string }>;
}) {
  const [jobs, categories, params] = await Promise.all([
    getOpenJobs(),
    getOpenJobCategories(),
    searchParams,
  ]);

  return (
    <JobsBrowser
      jobs={jobs}
      categories={categories}
      initialCountry={params.country as Country | undefined}
      initialCategory={params.category}
    />
  );
}
