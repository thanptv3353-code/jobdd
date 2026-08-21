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
  dob: string,
  country: { label: string; min_age: number; max_age: number } | undefined
): EligibilityResult {
  if (!dob || !country) {
    return { eligible: true, reasons: [] };
  }
  const age = calculateAge(dob);
  const reasons: string[] = [];
  if (age < country.min_age || age > country.max_age) {
    reasons.push(
      `ອາຍຸ ${age} ປີ ບໍ່ຜ່ານເກນ${country.label} (${country.min_age}–${country.max_age} ປີ)`
    );
  }
  return { eligible: reasons.length === 0, reasons };
}
