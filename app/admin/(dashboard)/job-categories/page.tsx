import { AdminJobCategories } from "@/components/admin-job-categories";
import { createClient } from "@/lib/supabase/server";

export default async function AdminJobCategoriesPage() {
  const supabase = await createClient();
  const [{ data: countries }, { data: categories }, { data: items }] = await Promise.all([
    supabase.from("countries").select("*").order("sort_order", { ascending: true }),
    supabase.from("job_categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("job_category_items").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <AdminJobCategories
      countries={countries ?? []}
      categories={categories ?? []}
      items={items ?? []}
    />
  );
}
