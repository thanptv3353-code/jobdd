import { notFound } from "next/navigation";
import { ApplyForm } from "@/components/apply-form";
import { getCountryRequirements, getJob } from "@/lib/queries";

export default async function ApplyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = await getJob(jobId);
  if (!job) notFound();

  const requirements = await getCountryRequirements(job.country);

  return <ApplyForm job={job} requirements={requirements} />;
}
