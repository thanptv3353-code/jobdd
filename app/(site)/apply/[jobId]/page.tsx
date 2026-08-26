import { notFound } from "next/navigation";
import { ApplyForm } from "@/components/apply-form";
import { getCountryRequirements, getJob, getLaoAdminDivisions } from "@/lib/queries";

export default async function ApplyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = await getJob(jobId);
  if (!job) notFound();

  const [requirements, divisions] = await Promise.all([
    getCountryRequirements(job.country),
    getLaoAdminDivisions(),
  ]);

  return (
    <ApplyForm
      job={job}
      requirements={requirements}
      provinces={divisions.provinces}
      districts={divisions.districts}
    />
  );
}
