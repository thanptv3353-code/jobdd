import { AdminApplicationsBoard } from "@/components/admin-applications-board";
import { createClient } from "@/lib/supabase/server";

export default async function AdminApplicationsPage() {
  const supabase = await createClient();
  const { data: applications } = await supabase
    .from("applications")
    .select("id, stage, country, worker_id, documents, worker_profiles(name), jobs(title)")
    .order("submitted_at", { ascending: false });

  const workerIds = [...new Set((applications ?? []).map((a) => a.worker_id))];
  const { data: photos } = workerIds.length
    ? await supabase
        .from("worker_files")
        .select("worker_id, file_path, uploaded_at")
        .eq("doc_type", "photo")
        .in("worker_id", workerIds)
        .order("uploaded_at", { ascending: false })
    : { data: [] };

  const latestPhotoPathByWorker = new Map<string, string>();
  for (const p of photos ?? []) {
    if (!latestPhotoPathByWorker.has(p.worker_id)) latestPhotoPathByWorker.set(p.worker_id, p.file_path);
  }

  const photoUrls: Record<string, string> = {};
  await Promise.all(
    [...latestPhotoPathByWorker.entries()].map(async ([workerId, path]) => {
      const { data } = await supabase.storage.from("worker-uploads").createSignedUrl(path, 60 * 30);
      if (data) photoUrls[workerId] = data.signedUrl;
    })
  );

  return <AdminApplicationsBoard applications={applications ?? []} photoUrls={photoUrls} />;
}
