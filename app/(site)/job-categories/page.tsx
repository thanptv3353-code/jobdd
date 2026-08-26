import { PublicJobCategories } from "@/components/public-job-categories";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "ປະເພດວຽກ — Job DD",
  description: "ອາຊີບທີ່ຄົນລາວມີສິດເຮັດໄດ້ຕາມກົດໝາຍ ໃນແຕ່ລະປະເທດປາຍທາງ",
};

export default async function JobCategoriesPage() {
  const supabase = await createClient();

  const [{ data: countries }, { data: categories }, { data: items }, { data: openJobs }] =
    await Promise.all([
      supabase.from("countries").select("*").order("sort_order", { ascending: true }),
      // Applicants should only see corridors the association currently opens.
      supabase.from("job_categories").select("*").eq("is_open", true).order("sort_order"),
      supabase.from("job_category_items").select("*").order("sort_order"),
      supabase.from("jobs").select("country, category").eq("status", "open"),
    ]);

  // How many real vacancies sit behind each category right now, so the list
  // doubles as a way into the jobs that are actually hiring.
  const openCounts: Record<string, number> = {};
  for (const j of openJobs ?? []) {
    const key = `${j.country}/${j.category}`;
    openCounts[key] = (openCounts[key] ?? 0) + 1;
  }

  return (
    <PublicJobCategories
      countries={countries ?? []}
      categories={categories ?? []}
      items={items ?? []}
      openCounts={openCounts}
    />
  );
}
