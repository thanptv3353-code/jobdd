export type { Country, AvailabilityStatus, ApplicationStage } from "@/lib/supabase/database.types";
import type { ApplicationStage, AvailabilityStatus } from "@/lib/supabase/database.types";

export const AVAILABILITY_LABEL: Record<AvailabilityStatus, string> = {
  available: "ວ່າງ",
  in_process: "ກຳລັງດຳເນີນການ",
  placed: "ໄດ້ວຽກແລ້ວ",
  paused: "ພັກໄວ້ຊົ່ວຄາວ",
  stale: "ຂໍ້ມູນເກົ່າ",
};

export const AVAILABILITY_DOT: Record<AvailabilityStatus, string> = {
  available: "bg-emerald-500",
  in_process: "bg-amber-500",
  placed: "bg-red-500",
  paused: "bg-zinc-500",
  stale: "bg-zinc-300",
};

export const AVAILABILITY_BADGE_CLASS: Record<AvailabilityStatus, string> = {
  available: "bg-emerald-100 text-emerald-800 border-emerald-200",
  in_process: "bg-amber-100 text-amber-800 border-amber-200",
  placed: "bg-red-100 text-red-800 border-red-200",
  paused: "bg-zinc-200 text-zinc-700 border-zinc-300",
  stale: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export const STAGE_LABEL: Record<ApplicationStage, string> = {
  received: "ໄດ້ຮັບໃບສະໝັກ",
  screening: "ກຳລັງກວດເອກະສານ",
  interview: "ນັດສຳພາດ",
  offer: "ໄດ້ຮັບການສະເໜີວຽກ",
  contract_signed: "ເຊັນສັນຍາແລ້ວ",
  rejected: "ປະຕິເສດ/ປິດ",
};

export const STAGE_ORDER: ApplicationStage[] = [
  "received",
  "screening",
  "interview",
  "offer",
  "contract_signed",
  "rejected",
];
