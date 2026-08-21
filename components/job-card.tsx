import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COUNTRY_LABEL } from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";

type Job = Database["public"]["Tables"]["jobs"]["Row"] & {
  members: Database["public"]["Tables"]["members"]["Row"] | null;
};

export function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="secondary">{COUNTRY_LABEL[job.country]}</Badge>
            <span className="text-xs text-muted-foreground">{job.posted_at}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-semibold leading-snug">{job.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{job.members?.name}</p>
          <p className="mt-3 text-sm font-medium text-emerald-700">{job.salary_range}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {job.category} · ຮັບ {job.quota} ຄົນ
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
