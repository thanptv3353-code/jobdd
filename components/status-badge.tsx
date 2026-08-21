import { cn } from "@/lib/utils";
import { AVAILABILITY_BADGE_CLASS, AVAILABILITY_DOT, AVAILABILITY_LABEL, AvailabilityStatus } from "@/lib/types";

export function StatusDot({ status, className }: { status: AvailabilityStatus; className?: string }) {
  return <span className={cn("inline-block h-2.5 w-2.5 rounded-full shrink-0", AVAILABILITY_DOT[status], className)} />;
}

export function StatusBadge({ status }: { status: AvailabilityStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        AVAILABILITY_BADGE_CLASS[status]
      )}
    >
      <StatusDot status={status} />
      {AVAILABILITY_LABEL[status]}
    </span>
  );
}
