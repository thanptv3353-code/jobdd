import type { Country } from "@/lib/supabase/database.types";
import { COUNTRY_LABEL } from "@/lib/types";

export const DOC_TYPES: Record<string, string> = {
  id_card: "ບັດປະຈຳຕົວ / ສຳມະໂນຄົວ",
  passport: "ປັດສະປອດ",
  language_cert: "ໃບຢັ້ງຢືນພາສາ",
  health_check: "ໃບກວດສຸຂະພາບ",
  criminal_record: "ໃບແຈ້ງໂທດ",
  skill_cert: "ໃບຢັ້ງຢືນທັກສະ",
};

export function docLabel(docType: string): string {
  return DOC_TYPES[docType] ?? docType;
}

export function calculateAge(dob: string, asOf: Date = new Date()): number {
  const birth = new Date(dob);
  let age = asOf.getFullYear() - birth.getFullYear();
  const monthDiff = asOf.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

export function checkEligibility(
  country: Country,
  dob: string,
  requirements: { min_age: number; max_age: number }[]
): EligibilityResult {
  const reasons: string[] = [];
  if (!dob || requirements.length === 0) {
    return { eligible: true, reasons: [] };
  }
  const age = calculateAge(dob);
  const ageReq = requirements[0];
  if (age < ageReq.min_age || age > ageReq.max_age) {
    reasons.push(
      `ອາຍຸ ${age} ປີ ບໍ່ຜ່ານເກນ${COUNTRY_LABEL[country]} (${ageReq.min_age}–${ageReq.max_age} ປີ)`
    );
  }
  return { eligible: reasons.length === 0, reasons };
}
