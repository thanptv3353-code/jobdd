import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobCard } from "@/components/job-card";
import { getCountries, getHomeStats, getOpenJobs } from "@/lib/queries";

export default async function HomePage() {
  const [jobs, stats, countries] = await Promise.all([getOpenJobs(), getHomeStats(), getCountries()]);
  const featured = jobs.slice(0, 6);

  return (
    <div>
      <section className="bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">
              ສະມາຄົມທຸລະກິດບໍລິການຈັດຫາງານລາວ
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              ຫາວຽກພາຍໃນ ແລະ ຕ່າງປະເທດ ຢ່າງປອດໄພ ຜ່ານ Job DD
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              ສະໝັກວຽກອອນໄລນ໌ກັບບໍລິສັດຈັດຫາງານທີ່ຖືກຕ້ອງຕາມກົດໝາຍ ໄປ ໄທ, ເກົາຫຼີ, ຢີ່ປຸ່ນ ຫຼື ວຽກພາຍໃນປະເທດ.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/jobs">ຄົ້ນຫາວຽກ</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register">ລົງທະບຽນເປັນຜູ້ຫາງານ</Link>
              </Button>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="ຜູ້ຫາງານທີ່ຍັງວ່າງ" value={stats.available_workers} accent="text-emerald-700" />
            <StatCard label="ຕຳແໜ່ງງານເປີດຮັບ" value={stats.open_jobs} accent="text-sky-700" />
            <StatCard label="ບໍລິສັດສະມາຊິກ" value={stats.members} accent="text-violet-700" />
            <StatCard label="ປະເທດປາຍທາງ" value={countries.length} accent="text-amber-700" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">ຕຳແໜ່ງງານແນະນຳ</h2>
            <p className="text-sm text-muted-foreground">ອັບເດດຫຼ້າສຸດຈາກບໍລິສັດສະມາຊິກ</p>
          </div>
          <Button asChild variant="link">
            <Link href="/jobs">ເບິ່ງທັງໝົດ →</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
          {featured.length === 0 && (
            <p className="col-span-full py-12 text-center text-muted-foreground">
              ຍັງບໍ່ມີຕຳແໜ່ງງານເປີດຮັບ
            </p>
          )}
        </div>
      </section>

      <section className="bg-muted/30 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-6 text-2xl font-bold">ປະເທດປາຍທາງ</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {countries.map((c) => (
              <Link key={c.code} href={`/jobs?country=${c.code}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <p className="text-lg font-semibold">{c.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {jobs.filter((j) => j.country === c.code).length} ຕຳແໜ່ງເປີດຮັບ
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className={`text-3xl font-extrabold ${accent}`}>{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
