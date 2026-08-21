import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CountryDocChecklist } from "@/components/country-doc-checklist";
import { getCountryRequirements, getJob } from "@/lib/queries";
import { COUNTRY_LABEL } from "@/lib/types";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const requirements = await getCountryRequirements(job.country);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="secondary">{COUNTRY_LABEL[job.country]}</Badge>
          <h1 className="mt-2 text-3xl font-bold">{job.title}</h1>
          <p className="mt-1 text-muted-foreground">{job.members?.name}</p>
        </div>
        <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
          <Link href={`/apply/${job.id}`}>ສະໝັກວຽກນີ້</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold">ລາຍລະອຽດວຽກ</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="font-semibold">ເງື່ອນໄຂ</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {job.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-2 font-semibold">ເອກະສານທີ່ຕ້ອງກຽມ</h2>
            <CountryDocChecklist requirements={requirements} />
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-6 text-sm">
              <Row label="ເງິນເດືອນ" value={job.salary_range} />
              <Row label="ໝວດໝູ່" value={job.category} />
              <Row label="ຈຳນວນຮັບ" value={`${job.quota} ຄົນ`} />
              <Row label="ປະກາດເມື່ອ" value={job.posted_at} />
            </CardContent>
          </Card>
          {job.members && (
            <Card>
              <CardContent className="pt-6 text-sm">
                <p className="font-semibold">{job.members.name}</p>
                <p className="mt-1 text-muted-foreground">{job.members.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
